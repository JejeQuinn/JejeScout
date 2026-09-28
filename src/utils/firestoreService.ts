import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocFromServer,
  Unsubscribe
} from 'firebase/firestore';
import { app, db, auth } from './firebaseClient';
export { app, db, auth };
import {
  Siswa,
  Kehadiran,
  Materi,
  SKU,
  Tabungan,
  Kedisiplinan,
  Jurnal,
  SKUItemDef,
  Kelas,
  SKKDef,
  SKKRecord,
  KegiatanEvent,
  BarangInventaris,
  PeminjamanLogistik,
  ModulMateri,
  SilabusLatihan,
  TransaksiKas,
  PeriodeDewanAmbalan,
  PengawasAccount
} from '../types';

// Error Handling specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notification:', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'settings', 'connection_test'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline, using offline persistence cache.');
    }
    return false;
  }
}

// Collections generic helpers
export const COLLECTIONS = {
  SISWA: 'siswa',
  KEHADIRAN: 'kehadiran',
  MATERI: 'materi',
  SKU: 'sku',
  SKU_DEFS: 'skuDefs',
  SKK: 'skk',
  SKK_DEFS: 'skkDefs',
  KEGIATAN_EVENTS: 'kegiatanEvents',
  INVENTARIS: 'inventaris',
  PEMINJAMAN: 'peminjaman',
  MODUL_MATERI: 'modulMateri',
  SILABUS: 'silabus',
  KAS: 'kas',
  DEWAN_AMBALAN: 'dewanAmbalan',
  TABUNGAN: 'tabungan',
  KEDISIPLINAN: 'kedisiplinan',
  JURNAL: 'jurnal',
  KELAS: 'kelas',
  SETTINGS: 'settings',
  PENGAWAS_ACCOUNTS: 'pengawasAccounts'
};

// Generic batch upload for full database sync with chunking (< 500 limit)
export async function saveAllToFirestore(data: {
  siswa?: Siswa[];
  kehadiran?: Kehadiran[];
  materi?: Materi[];
  sku?: SKU[];
  tabungan?: Tabungan[];
  kedisiplinan?: Kedisiplinan[];
  jurnal?: Jurnal[];
  skuDefs?: SKUItemDef[];
  skkDefs?: SKKDef[];
  skkRecords?: SKKRecord[];
  kegiatanEvents?: KegiatanEvent[];
  inventaris?: BarangInventaris[];
  peminjaman?: PeminjamanLogistik[];
  modulMateri?: ModulMateri[];
  silabus?: SilabusLatihan[];
  kas?: TransaksiKas[];
  dewanAmbalan?: PeriodeDewanAmbalan[];
  kelas?: Kelas[];
  tahunAjaran?: string[];
  pelantikanList?: string[];
}): Promise<void> {
  try {
    const ops: Array<{ col: string; id: string; data: any }> = [];

    if (data.siswa) {
      data.siswa.forEach((item) => ops.push({ col: COLLECTIONS.SISWA, id: item.id, data: sanitizeDoc(item) }));
    }
    if (data.kehadiran) {
      data.kehadiran.forEach((item) => ops.push({ col: COLLECTIONS.KEHADIRAN, id: item.id, data: sanitizeDoc(item) }));
    }
    if (data.materi) {
      data.materi.forEach((item) => ops.push({ col: COLLECTIONS.MATERI, id: item.id, data: sanitizeDoc(item) }));
    }
    if (data.sku) {
      data.sku.forEach((item) => ops.push({ col: COLLECTIONS.SKU, id: item.id, data: sanitizeDoc(item) }));
    }
    if (data.skuDefs) {
      data.skuDefs.forEach((item) => ops.push({ col: COLLECTIONS.SKU_DEFS, id: item.id, data: sanitizeDoc(item) }));
    }
    if (data.skkDefs) {
      data.skkDefs.forEach((item) => ops.push({ col: COLLECTIONS.SKK_DEFS, id: item.id, data: sanitizeDoc(item) }));
    }
    if (data.skkRecords) {
      data.skkRecords.forEach((item) => ops.push({ col: COLLECTIONS.SKK, id: item.id, data: sanitizeDoc(item) }));
    }
    if (data.kegiatanEvents) {
      data.kegiatanEvents.forEach((item) => ops.push({ col: COLLECTIONS.KEGIATAN_EVENTS, id: item.id, data: sanitizeDoc(item) }));
    }
    if (data.inventaris) {
      data.inventaris.forEach((item) => ops.push({ col: COLLECTIONS.INVENTARIS, id: item.id, data: sanitizeDoc(item) }));
    }
    if (data.peminjaman) {
      data.peminjaman.forEach((item) => ops.push({ col: COLLECTIONS.PEMINJAMAN, id: item.id, data: sanitizeDoc(item) }));
    }
    if (data.modulMateri) {
      data.modulMateri.forEach((item) => ops.push({ col: COLLECTIONS.MODUL_MATERI, id: item.id, data: sanitizeDoc(item) }));
    }
    if (data.silabus) {
      data.silabus.forEach((item) => ops.push({ col: COLLECTIONS.SILABUS, id: item.id, data: sanitizeDoc(item) }));
    }
    if (data.kas) {
      data.kas.forEach((item) => ops.push({ col: COLLECTIONS.KAS, id: item.id, data: sanitizeDoc(item) }));
    }
    if (data.dewanAmbalan) {
      data.dewanAmbalan.forEach((item) => ops.push({ col: COLLECTIONS.DEWAN_AMBALAN, id: item.id, data: sanitizeDoc(item) }));
    }
    if (data.tabungan) {
      data.tabungan.forEach((item) => ops.push({ col: COLLECTIONS.TABUNGAN, id: item.id, data: sanitizeDoc(item) }));
    }
    if (data.kedisiplinan) {
      data.kedisiplinan.forEach((item) => ops.push({ col: COLLECTIONS.KEDISIPLINAN, id: item.id, data: sanitizeDoc(item) }));
    }
    if (data.jurnal) {
      data.jurnal.forEach((item) => ops.push({ col: COLLECTIONS.JURNAL, id: item.id, data: sanitizeDoc(item) }));
    }
    if (data.kelas) {
      data.kelas.forEach((item) => ops.push({ col: COLLECTIONS.KELAS, id: item.id, data: sanitizeDoc(item) }));
    }
    if (data.tahunAjaran) {
      ops.push({ col: COLLECTIONS.SETTINGS, id: 'tahun_ajaran', data: { list: data.tahunAjaran } });
    }
    if (data.pelantikanList) {
      ops.push({ col: COLLECTIONS.SETTINGS, id: 'pelantikan_list', data: { list: data.pelantikanList } });
    }

    // Chunk ops in groups of 400 to strictly respect Firestore batch limits
    const CHUNK_SIZE = 400;
    for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
      const chunk = ops.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((op) => {
        batch.set(doc(db, op.col, op.id), op.data);
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch_all');
    console.error("Gagal menyimpan data ke Firestore:", error);
  }
}

import { 
  markIdAsDeleted, 
  unmarkIdAsDeleted, 
  filterNonDeleted, 
  getDeletedIds,
  syncDeletedIdsWithSnapshotDocs
} from './deletionTracker';

// Single document upsert
export async function setFirestoreDoc(collectionName: string, id: string, data: any): Promise<void> {
  try {
    unmarkIdAsDeleted(collectionName, id);
    const docRef = doc(db, collectionName, id);
    // Explicitly reset tombstone and deleted flags when restoring or creating an active document
    const payload = sanitizeDoc({
      ...data,
      id,
      deleted: false,
      is_deleted: false,
      deleted_at: null,
      tombstone: false
    });
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${id}`);
  }
}

// Single document delete with tombstone flag persisted in Firestore
export async function deleteFirestoreDoc(collectionName: string, id: string): Promise<void> {
  try {
    // 1. Mark locally and in Firestore with deleted: true
    await markIdAsDeleted(collectionName, id, true);

    const docRef = doc(db, collectionName, id);
    const tombstonePayload = {
      deleted: true,
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      tombstone: true
    };

    // 2. Set authoritative deleted flag in Firestore so all subscribers filter it out permanently
    await setDoc(docRef, tombstonePayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
  }
}

// Single document get
export async function getFirestoreDoc<T>(collectionName: string, id: string): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, id);
    const snap = await getDocFromServer(docRef).catch(() => null);
    if (snap && snap.exists()) {
      return { ...snap.data(), id: snap.id } as T;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Single document realtime subscription
export function subscribeDoc<T>(
  collectionName: string,
  id: string,
  onData: (data: T | null) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const docRef = doc(db, collectionName, id);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onData({ ...snap.data(), id: snap.id } as T);
      } else {
        onData(null);
      }
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

// Fetch all documents from a collection once, filtering out any tombstones or locally deleted items
export async function getFirestoreDocs<T extends { id?: string; deleted?: boolean; is_deleted?: boolean; deleted_at?: string; tombstone?: boolean }>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    const items: any[] = [];
    snap.forEach((docSnap) => {
      items.push({ ...docSnap.data(), id: docSnap.id });
    });
    return filterNonDeleted(collectionName, items) as T[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
    return [];
  }
}

// Subscribe to collection changes with realtime callback and instantaneous tombstone suppression
export function subscribeCollection<T extends { id?: string; deleted?: boolean; is_deleted?: boolean; deleted_at?: string; tombstone?: boolean }>(
  collectionName: string,
  onData: (data: T[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: any[] = [];
      const deletedSet = getDeletedIds(collectionName);
      const lingeringDeletedDocs: string[] = [];

      snapshot.forEach((docSnap) => {
        const docId = docSnap.id;
        const data = docSnap.data() as any;
        const isTombstone =
          data?.deleted === true ||
          data?.is_deleted === true ||
          Boolean(data?.deleted_at) ||
          data?.tombstone === true;

        if (isTombstone) {
          // If server marks it as deleted, make sure local tracker also records it
          if (!deletedSet.has(docId)) {
            markIdAsDeleted(collectionName, docId, false);
            deletedSet.add(docId);
          }
          lingeringDeletedDocs.push(docId);
          return;
        }

        if (deletedSet.has(docId)) {
          // Document was marked deleted locally but exists in snapshot
          lingeringDeletedDocs.push(docId);
          return;
        }

        items.push({ ...data, id: docId });
      });

      // Ensure lingering deleted docs have their authoritative deleted flag set in Firestore
      if (lingeringDeletedDocs.length > 0) {
        lingeringDeletedDocs.forEach((id) => {
          try {
            const ref = doc(db, collectionName, id);
            setDoc(ref, { deleted: true, is_deleted: true, deleted_at: new Date().toISOString(), tombstone: true }, { merge: true })
              .catch(() => {});
          } catch (e) {}
        });
      }

      onData(items as T[]);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionName);
      if (onError) onError(error);
    }
  );
}

/**
 * Utility function to synchronize the 'deleted_ids' storage with actual Firestore data.
 * 1. Discovers any server documents containing tombstone flags (deleted: true, deleted_at, is_deleted, tombstone)
 *    and registers them into the local deleted_ids tracker.
 * 2. For any document on Firestore whose ID exists in the local deleted_ids tracker, applies
 *    a server-side tombstone so all clients know it is deleted.
 */
export async function syncDeletedTrackerWithFirestore(collectionName: string): Promise<{
  syncedTombstones: number;
  purgedLingeringDocs: number;
}> {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    const rawDocs: any[] = [];
    snap.forEach((d) => rawDocs.push({ ...d.data(), id: d.id }));

    const { lingeringDeletedIds, newlyDetectedTombstones } = syncDeletedIdsWithSnapshotDocs(collectionName, rawDocs);

    if (lingeringDeletedIds.length > 0) {
      const purgePromises = lingeringDeletedIds.map(async (id) => {
        try {
          const docRef = doc(db, collectionName, id);
          await setDoc(docRef, { deleted: true, is_deleted: true, deleted_at: new Date().toISOString(), tombstone: true }, { merge: true });
        } catch (e) {
          console.warn(`Failed tombstone sync for ${collectionName}/${id}:`, e);
        }
      });
      await Promise.allSettled(purgePromises);
    }

    return {
      syncedTombstones: newlyDetectedTombstones.length,
      purgedLingeringDocs: lingeringDeletedIds.length
    };
  } catch (err) {
    console.warn(`Aggressive sync failed for ${collectionName}:`, err);
    return { syncedTombstones: 0, purgedLingeringDocs: 0 };
  }
}

/**
 * Aggressively synchronizes all core collections with the local deletion tracker.
 */
export async function syncAllDeletedTrackersWithFirestore(): Promise<void> {
  const collectionList = [
    COLLECTIONS.SISWA,
    COLLECTIONS.KEHADIRAN,
    COLLECTIONS.MATERI,
    COLLECTIONS.SKU,
    COLLECTIONS.SKU_DEFS,
    COLLECTIONS.SKK,
    COLLECTIONS.SKK_DEFS,
    COLLECTIONS.KEGIATAN_EVENTS,
    COLLECTIONS.INVENTARIS,
    COLLECTIONS.PEMINJAMAN,
    COLLECTIONS.MODUL_MATERI,
    COLLECTIONS.SILABUS,
    COLLECTIONS.KAS,
    COLLECTIONS.DEWAN_AMBALAN,
    COLLECTIONS.TABUNGAN,
    COLLECTIONS.KEDISIPLINAN,
    COLLECTIONS.JURNAL,
    COLLECTIONS.KELAS
  ];

  await Promise.allSettled(collectionList.map((col) => syncDeletedTrackerWithFirestore(col)));
}

// Helper to remove undefined fields from payload to avoid Firestore errors
export function sanitizeDoc(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeDoc);
  }
  const clean: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = sanitizeDoc(value);
    }
  }
  return clean;
}
