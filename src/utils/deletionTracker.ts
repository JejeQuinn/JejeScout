/**
 * Utility for tracking and honoring document deletions across local storage and Firestore.
 * Prevents Firestore realtime snapshot subscriptions from resurrecting
 * documents that have been explicitly deleted by the user.
 * 
 * Sets 'deleted: true' directly in Firestore to guarantee that deletions persist
 * authoritatively across client reloads, browsers, and devices.
 */

import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseClient';

const inMemoryDeleted: Record<string, Set<string>> = {};

function getStorageKey(collectionName: string): string {
  return `pramuka_deleted_${collectionName}`;
}

export function getDeletedIds(collectionName: string): Set<string> {
  if (inMemoryDeleted[collectionName]) {
    return inMemoryDeleted[collectionName];
  }

  try {
    const raw = localStorage.getItem(getStorageKey(collectionName));
    if (raw) {
      const parsed: string[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemoryDeleted[collectionName] = new Set(parsed);
        return inMemoryDeleted[collectionName];
      }
    }
  } catch (e) {
    console.warn(`Error reading deleted ids for ${collectionName}:`, e);
  }

  inMemoryDeleted[collectionName] = new Set<string>();
  return inMemoryDeleted[collectionName];
}

/**
 * Marks an ID as deleted locally AND updates the Firestore document with an authoritative 'deleted: true' flag.
 * This guarantees deletion persistence even if local storage is cleared or app is opened elsewhere.
 */
export function markIdAsDeleted(collectionName: string, id: string, syncToFirestore: boolean = true): Promise<void> {
  if (!id) return Promise.resolve();
  const set = getDeletedIds(collectionName);
  set.add(id);
  try {
    localStorage.setItem(getStorageKey(collectionName), JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn(`Error persisting deleted id ${id} for ${collectionName}:`, e);
  }

  if (syncToFirestore) {
    try {
      const docRef = doc(db, collectionName, id);
      return setDoc(
        docRef,
        {
          deleted: true,
          is_deleted: true,
          tombstone: true,
          deleted_at: new Date().toISOString()
        },
        { merge: true }
      ).catch((err) => {
        console.warn(`Firestore sync error for deleted doc [${collectionName}/${id}]:`, err);
      });
    } catch (e) {
      console.warn(`Could not push deleted flag to Firestore for ${collectionName}/${id}:`, e);
      return Promise.resolve();
    }
  }
  return Promise.resolve();
}

export function markMultipleIdsAsDeleted(collectionName: string, ids: string[], syncToFirestore: boolean = true): Promise<void[]> {
  if (!ids || ids.length === 0) return Promise.resolve([]);
  const set = getDeletedIds(collectionName);
  ids.forEach((id) => {
    if (id) set.add(id);
  });
  try {
    localStorage.setItem(getStorageKey(collectionName), JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn(`Error persisting deleted ids for ${collectionName}:`, e);
  }

  if (syncToFirestore) {
    const promises = ids.filter(Boolean).map((id) => {
      try {
        const docRef = doc(db, collectionName, id);
        return setDoc(
          docRef,
          {
            deleted: true,
            is_deleted: true,
            tombstone: true,
            deleted_at: new Date().toISOString()
          },
          { merge: true }
        ).catch(() => {});
      } catch (e) {
        return Promise.resolve();
      }
    });
    return Promise.all(promises);
  }
  return Promise.resolve([]);
}

export function unmarkIdAsDeleted(collectionName: string, id: string): void {
  if (!id) return;
  const set = getDeletedIds(collectionName);
  if (set.has(id)) {
    set.delete(id);
    try {
      localStorage.setItem(getStorageKey(collectionName), JSON.stringify(Array.from(set)));
    } catch (e) {
      console.warn(`Error updating deleted ids for ${collectionName}:`, e);
    }
  }
}

export function isIdDeleted(collectionName: string, id: string): boolean {
  if (!id) return false;
  return getDeletedIds(collectionName).has(id);
}

export function isDocTombstone(doc: any): boolean {
  if (!doc) return true;
  return (
    doc.deleted === true ||
    doc.is_deleted === true ||
    Boolean(doc.deleted_at) ||
    doc.tombstone === true
  );
}

export function isDocDeleted(collectionName: string, doc: any): boolean {
  if (!doc) return true;
  if (isDocTombstone(doc)) return true;
  if (doc.id && isIdDeleted(collectionName, doc.id)) return true;
  return false;
}

/**
 * Filters out items that are marked deleted either by local tracker or by tombstone flags ('deleted: true').
 * Automatically records newly observed tombstones into the local deleted_ids storage.
 */
export function filterNonDeleted<T extends { id?: string; deleted?: boolean; is_deleted?: boolean; deleted_at?: string; tombstone?: boolean }>(
  collectionName: string,
  items: T[]
): T[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  const deletedSet = getDeletedIds(collectionName);
  let hasNewTombstones = false;

  const result = items.filter((item) => {
    if (!item || !item.id) return false;

    // 1. Authoritative Firestore deletion / tombstone flag check
    if (item.deleted === true || item.is_deleted === true || Boolean(item.deleted_at) || item.tombstone === true) {
      if (!deletedSet.has(item.id)) {
        deletedSet.add(item.id);
        hasNewTombstones = true;
      }
      return false;
    }

    // 2. Local tracker check
    if (deletedSet.has(item.id)) {
      return false;
    }

    return true;
  });

  if (hasNewTombstones) {
    try {
      localStorage.setItem(getStorageKey(collectionName), JSON.stringify(Array.from(deletedSet)));
    } catch (e) {
      console.warn(`Error syncing tombstones to deleted ids storage for ${collectionName}:`, e);
    }
  }

  return result;
}

/**
 * Rigorously verifies incoming snapshot items against both the local deletion tracker
 * and tombstone properties immediately before state setters are invoked.
 * Prevents any transient UI flicker or resurrection of deleted documents.
 */
export function verifyAndFilterSnapshot<T extends { id?: string; deleted?: boolean; is_deleted?: boolean; deleted_at?: string; tombstone?: boolean }>(
  collectionName: string,
  snapshotItems: T[]
): T[] {
  return filterNonDeleted(collectionName, snapshotItems || []);
}

/**
 * Synchronizes the local deleted_ids storage against a set of documents from Firestore.
 * Any document with 'deleted: true' or a tombstone is added to deleted_ids.
 */
export function syncDeletedIdsWithSnapshotDocs(
  collectionName: string,
  docs: Array<{ id: string; deleted?: boolean; is_deleted?: boolean; deleted_at?: string; tombstone?: boolean }>
): { lingeringDeletedIds: string[]; newlyDetectedTombstones: string[] } {
  const deletedSet = getDeletedIds(collectionName);
  const lingeringDeletedIds: string[] = [];
  const newlyDetectedTombstones: string[] = [];

  docs.forEach((doc) => {
    const isTombstone = doc.deleted === true || doc.is_deleted === true || Boolean(doc.deleted_at) || doc.tombstone === true;
    if (isTombstone) {
      if (!deletedSet.has(doc.id)) {
        deletedSet.add(doc.id);
        newlyDetectedTombstones.push(doc.id);
      }
      lingeringDeletedIds.push(doc.id);
    } else if (deletedSet.has(doc.id)) {
      lingeringDeletedIds.push(doc.id);
    }
  });

  if (newlyDetectedTombstones.length > 0) {
    try {
      localStorage.setItem(getStorageKey(collectionName), JSON.stringify(Array.from(deletedSet)));
    } catch (e) {
      console.warn(`Error saving newly detected tombstones for ${collectionName}:`, e);
    }
  }

  return { lingeringDeletedIds, newlyDetectedTombstones };
}

export function clearDeletedIds(collectionName?: string): void {
  if (collectionName) {
    delete inMemoryDeleted[collectionName];
    try {
      localStorage.removeItem(getStorageKey(collectionName));
    } catch (e) {}
  } else {
    Object.keys(inMemoryDeleted).forEach((k) => delete inMemoryDeleted[k]);
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('pramuka_deleted_')) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {}
  }
}
