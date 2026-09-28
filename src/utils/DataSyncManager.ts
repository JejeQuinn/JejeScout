import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection
} from 'firebase/firestore';
import { db, COLLECTIONS, sanitizeDoc } from './firestoreService';
import {
  markIdAsDeleted,
  unmarkIdAsDeleted,
  isIdDeleted,
  isDocTombstone,
  filterNonDeleted
} from './deletionTracker';
import { SyncStatus } from '../types';

export interface PendingMutation {
  id: string; // unique mutation id
  targetId: string; // doc id
  collectionName: string;
  type: 'SET' | 'DELETE';
  data?: any;
  timestamp: number;
  retryCount: number;
}

const STORAGE_QUEUE_KEY = 'pramuka_pending_sync_queue';
const STATUS_LISTENERS: Set<(status: SyncStatus) => void> = new Set();

let currentStatus: SyncStatus = {
  isSyncing: false,
  pendingCount: 0,
  lastSyncTime: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
};

function updateStatus(updates: Partial<SyncStatus>) {
  currentStatus = { ...currentStatus, ...updates };
  STATUS_LISTENERS.forEach((fn) => {
    try {
      fn(currentStatus);
    } catch (e) {
      console.warn('Sync listener error:', e);
    }
  });
}

/**
 * DataSyncManager handles bidirectional synchronization between Firestore and LocalStorage,
 * guaranteeing conflict resolution, authoritative Firestore priority, and resolution of
 * CRUD race conditions that occur across page refreshes.
 */
export class DataSyncManager {
  private static isFlushing = false;
  private static initialized = false;

  /**
   * Subscribe to real-time synchronization status updates (syncing, pending count, online status).
   */
  public static subscribeStatus(listener: (status: SyncStatus) => void): () => void {
    STATUS_LISTENERS.add(listener);
    listener(currentStatus);
    return () => {
      STATUS_LISTENERS.delete(listener);
    };
  }

  public static getStatus(): SyncStatus {
    return { ...currentStatus };
  }

  /**
   * Retrieve current pending mutations from persistent storage.
   */
  public static getPendingQueue(): PendingMutation[] {
    try {
      const raw = localStorage.getItem(STORAGE_QUEUE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading pending sync queue:', e);
    }
    return [];
  }

  private static savePendingQueue(queue: PendingMutation[]): void {
    try {
      localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
      updateStatus({ pendingCount: queue.length });
    } catch (e) {
      console.warn('Error saving pending sync queue:', e);
    }
  }

  /**
   * Enqueue a pending mutation into local queue.
   */
  public static enqueue(mutation: Omit<PendingMutation, 'id' | 'timestamp' | 'retryCount'>): string {
    const queue = this.getPendingQueue();
    const id = `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullMutation: PendingMutation = {
      ...mutation,
      id,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    // Replace existing pending mutation for the same targetId & collection if present
    const filtered = queue.filter(
      (m) => !(m.collectionName === mutation.collectionName && m.targetId === mutation.targetId)
    );
    filtered.push(fullMutation);
    this.savePendingQueue(filtered);
    return id;
  }

  /**
   * Dequeue a mutation once successfully committed to Firestore.
   */
  public static dequeue(mutationId: string): void {
    const queue = this.getPendingQueue();
    const next = queue.filter((m) => m.id !== mutationId);
    this.savePendingQueue(next);
  }

  /**
   * Remove any pending mutation for a specific doc.
   */
  public static dequeueByTarget(collectionName: string, targetId: string): void {
    const queue = this.getPendingQueue();
    const next = queue.filter((m) => !(m.collectionName === collectionName && m.targetId === targetId));
    this.savePendingQueue(next);
  }

  /**
   * Flush all locally queued pending mutations to Firestore before snapshots are applied.
   * Resolves offline changes or page-refresh race conditions.
   */
  public static async flushPendingQueue(): Promise<void> {
    if (this.isFlushing) return;
    const queue = this.getPendingQueue();
    if (queue.length === 0) {
      updateStatus({ isSyncing: false, pendingCount: 0 });
      return;
    }

    this.isFlushing = true;
    updateStatus({ isSyncing: true, pendingCount: queue.length });

    try {
      for (const mutation of [...queue]) {
        try {
          const docRef = doc(db, mutation.collectionName, mutation.targetId);

          if (mutation.type === 'DELETE') {
            // Write authoritative deleted: true flag to Firestore so all subscribers and reloads honor it
            await setDoc(
              docRef,
              {
                deleted: true,
                is_deleted: true,
                tombstone: true,
                deleted_at: new Date().toISOString()
              },
              { merge: true }
            );
            markIdAsDeleted(mutation.collectionName, mutation.targetId, false);
          } else if (mutation.type === 'SET') {
            unmarkIdAsDeleted(mutation.collectionName, mutation.targetId);
            const payload = sanitizeDoc({
              ...mutation.data,
              id: mutation.targetId,
              deleted: false,
              is_deleted: false,
              tombstone: false,
              deleted_at: null
            });
            await setDoc(docRef, payload, { merge: true });
          }

          this.dequeue(mutation.id);
        } catch (err) {
          console.warn(`Failed to sync pending mutation ${mutation.id}:`, err);
          mutation.retryCount += 1;
          // Keep in queue for next flush attempt if transient
        }
      }

      updateStatus({
        isSyncing: false,
        lastSyncTime: Date.now(),
        pendingCount: this.getPendingQueue().length
      });
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Process and sanitize incoming Firestore snapshot items.
   * Filters out documents with 'deleted: true', tombstones, and honors authoritative state.
   */
  public static processSnapshot<T extends { id?: string; deleted?: boolean; is_deleted?: boolean; tombstone?: boolean }>(
    collectionName: string,
    rawSnapshotDocs: any[]
  ): T[] {
    const queue = this.getPendingQueue();
    const pendingForCol = queue.filter((m) => m.collectionName === collectionName);
    const pendingDeleteIds = new Set(
      pendingForCol.filter((m) => m.type === 'DELETE').map((m) => m.targetId)
    );
    const pendingSetMap = new Map<string, any>();
    pendingForCol
      .filter((m) => m.type === 'SET')
      .forEach((m) => pendingSetMap.set(m.targetId, m.data));

    const authoritativeMap = new Map<string, any>();

    // 1. Process server snapshot documents
    (rawSnapshotDocs || []).forEach((item) => {
      if (!item || !item.id) return;
      const docId = item.id;

      // Check authoritative deleted flag on the Firestore document
      if (item.deleted === true || item.is_deleted === true || item.tombstone === true || item.deleted_at) {
        markIdAsDeleted(collectionName, docId, false);
        return;
      }

      // Check if item was marked as deleted locally
      if (isIdDeleted(collectionName, docId) || pendingDeleteIds.has(docId)) {
        return;
      }

      // If there is an in-flight uncommitted local set for this item, prioritize local until committed
      if (pendingSetMap.has(docId)) {
        authoritativeMap.set(docId, pendingSetMap.get(docId));
      } else {
        authoritativeMap.set(docId, item);
      }
    });

    // 2. Add any newly created in-flight items not yet present in server snapshot
    pendingSetMap.forEach((data, id) => {
      if (!authoritativeMap.has(id) && !isIdDeleted(collectionName, id) && !pendingDeleteIds.has(id)) {
        authoritativeMap.set(id, data);
      }
    });

    const result = Array.from(authoritativeMap.values()) as T[];

    // 3. Update localStorage offline cache with authoritative state
    try {
      localStorage.setItem(`pramuka_${collectionName}`, JSON.stringify(result));
    } catch (e) {
      console.warn(`Error writing offline cache for ${collectionName}:`, e);
    }

    return result;
  }

  /**
   * Persist a document write both optimistically and persistently to Firestore.
   */
  public static async persistDoc(collectionName: string, id: string, data: any): Promise<void> {
    unmarkIdAsDeleted(collectionName, id);
    const mutId = this.enqueue({
      collectionName,
      targetId: id,
      type: 'SET',
      data
    });

    try {
      const docRef = doc(db, collectionName, id);
      const payload = sanitizeDoc({
        ...data,
        id,
        deleted: false,
        is_deleted: false,
        tombstone: false,
        deleted_at: null
      });
      await setDoc(docRef, payload, { merge: true });
      this.dequeue(mutId);
      updateStatus({ lastSyncTime: Date.now() });
    } catch (error) {
      console.warn(`Firestore write queued for background retry [${collectionName}/${id}]:`, error);
      // Remains in pending queue for background retry
    }
  }

  /**
   * Persist a document deletion:
   * Sets 'deleted: true' flag in Firestore, removes it locally, and enqueues permanent deletion.
   */
  public static async persistDelete(collectionName: string, id: string): Promise<void> {
    // 1. Mark in local deletion tracker immediately and push deleted: true to Firestore
    await markIdAsDeleted(collectionName, id, true);

    // 2. Enqueue mutation in case of offline/network retry
    const mutId = this.enqueue({
      collectionName,
      targetId: id,
      type: 'DELETE'
    });

    try {
      const docRef = doc(db, collectionName, id);
      // Set authoritative deleted: true in Firestore permanently
      await setDoc(
        docRef,
        {
          deleted: true,
          is_deleted: true,
          tombstone: true,
          deleted_at: new Date().toISOString()
        },
        { merge: true }
      );
      this.dequeue(mutId);
      updateStatus({ lastSyncTime: Date.now() });
    } catch (error) {
      console.warn(`Firestore delete queued for background retry [${collectionName}/${id}]:`, error);
      // Remains in queue
    }
  }

  /**
   * Initialize DataSyncManager: flush pending queue and setup connectivity listeners.
   */
  public static async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        updateStatus({ isOnline: true });
        this.flushPendingQueue();
      });
      window.addEventListener('offline', () => {
        updateStatus({ isOnline: false });
      });
    }

    // Flush any pending mutations from prior session immediately
    await this.flushPendingQueue();
  }
}
