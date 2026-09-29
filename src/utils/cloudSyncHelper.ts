import { 
  getDocs, 
  collection, 
  doc, 
  setDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db, COLLECTIONS, sanitizeDoc } from './firestoreService';
import { clearDeletedIds } from './deletionTracker';
import { getCollectionStorageKey, DataSyncManager } from './DataSyncManager';
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
  PeriodeDewanAmbalan
} from '../types';

export interface ComprehensiveCloudData {
  siswa: Siswa[];
  kehadiran: Kehadiran[];
  materi: Materi[];
  sku: SKU[];
  tabungan: Tabungan[];
  kedisiplinan: Kedisiplinan[];
  jurnal: Jurnal[];
  skuDefs: SKUItemDef[];
  kelas: Kelas[];
  skkDefs: SKKDef[];
  skkRecords: SKKRecord[];
  kegiatanEvents: KegiatanEvent[];
  inventaris: BarangInventaris[];
  peminjaman: PeminjamanLogistik[];
  modulMateri: ModulMateri[];
  silabus: SilabusLatihan[];
  kas: TransaksiKas[];
  dewanAmbalan: PeriodeDewanAmbalan[];
  tahunAjaran?: string[];
}

export interface SyncStats {
  totalSiswa: number;
  totalKehadiran: number;
  totalMateri: number;
  totalSku: number;
  totalTabungan: number;
  totalKedisiplinan: number;
  totalJurnal: number;
  totalKelas: number;
  totalInventaris: number;
  totalKas: number;
  totalDewanAmbalan: number;
  totalSemuaItem: number;
  timestamp: string;
}

/**
 * Pushes all active data on the current device (e.g. Laptop) to Cloud Firestore.
 * Explicitly clears tombstones and broadcasts a system_sync signal to all other devices (e.g. HP).
 */
export async function pushComprehensiveDataToCloud(
  data: ComprehensiveCloudData,
  actorName: string = 'Admin (Laptop)'
): Promise<{ success: boolean; stats: SyncStats; error?: string }> {
  try {
    // 1. Clear deletion tracker on this device so restored items are not blocked
    clearDeletedIds();
    DataSyncManager.clearPendingQueue();

    const ops: Array<{ col: string; id: string; data: any }> = [];

    const addItems = (col: string, list?: any[]) => {
      if (!Array.isArray(list)) return;
      list.forEach((item) => {
        if (!item || !item.id) return;
        ops.push({
          col,
          id: item.id,
          data: sanitizeDoc({
            ...item,
            deleted: false,
            is_deleted: false,
            tombstone: false,
            deleted_at: null
          })
        });
      });
    };

    addItems(COLLECTIONS.SISWA, data.siswa);
    addItems(COLLECTIONS.KEHADIRAN, data.kehadiran);
    addItems(COLLECTIONS.MATERI, data.materi);
    addItems(COLLECTIONS.SKU, data.sku);
    addItems(COLLECTIONS.SKU_DEFS, data.skuDefs);
    addItems(COLLECTIONS.TABUNGAN, data.tabungan);
    addItems(COLLECTIONS.KEDISIPLINAN, data.kedisiplinan);
    addItems(COLLECTIONS.JURNAL, data.jurnal);
    addItems(COLLECTIONS.KELAS, data.kelas);
    addItems(COLLECTIONS.SKK_DEFS, data.skkDefs);
    addItems(COLLECTIONS.SKK, data.skkRecords);
    addItems(COLLECTIONS.KEGIATAN_EVENTS, data.kegiatanEvents);
    addItems(COLLECTIONS.INVENTARIS, data.inventaris);
    addItems(COLLECTIONS.PEMINJAMAN, data.peminjaman);
    addItems(COLLECTIONS.MODUL_MATERI, data.modulMateri);
    addItems(COLLECTIONS.SILABUS, data.silabus);
    addItems(COLLECTIONS.KAS, data.kas);
    addItems(COLLECTIONS.DEWAN_AMBALAN, data.dewanAmbalan);

    if (data.tahunAjaran && data.tahunAjaran.length > 0) {
      ops.push({
        col: COLLECTIONS.SETTINGS,
        id: 'tahun_ajaran',
        data: { list: data.tahunAjaran }
      });
    }

    const syncVersion = Date.now();
    const syncTimestamp = new Date().toISOString();

    // Add system sync broadcast event document
    ops.push({
      col: COLLECTIONS.SETTINGS,
      id: 'system_sync',
      data: {
        version: syncVersion,
        action: 'FULL_MASTER_SYNC',
        timestamp: syncTimestamp,
        updatedBy: actorName,
        totalItems: ops.length
      }
    });

    // Chunk ops in groups of 400 to respect Firestore batch limits
    const CHUNK_SIZE = 400;
    for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
      const chunk = ops.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((op) => {
        batch.set(doc(db, op.col, op.id), op.data, { merge: true });
      });
      await batch.commit();
    }

    // Mirror to local storage
    const mirrorLocal = (col: string, list?: any[]) => {
      if (!list) return;
      try {
        const key = getCollectionStorageKey(col);
        localStorage.setItem(key, JSON.stringify(list));
      } catch (e) {}
    };

    mirrorLocal(COLLECTIONS.SISWA, data.siswa);
    mirrorLocal(COLLECTIONS.KEHADIRAN, data.kehadiran);
    mirrorLocal(COLLECTIONS.MATERI, data.materi);
    mirrorLocal(COLLECTIONS.SKU, data.sku);
    mirrorLocal(COLLECTIONS.SKU_DEFS, data.skuDefs);
    mirrorLocal(COLLECTIONS.TABUNGAN, data.tabungan);
    mirrorLocal(COLLECTIONS.KEDISIPLINAN, data.kedisiplinan);
    mirrorLocal(COLLECTIONS.JURNAL, data.jurnal);
    mirrorLocal(COLLECTIONS.KELAS, data.kelas);
    mirrorLocal(COLLECTIONS.SKK_DEFS, data.skkDefs);
    mirrorLocal(COLLECTIONS.SKK, data.skkRecords);
    mirrorLocal(COLLECTIONS.KEGIATAN_EVENTS, data.kegiatanEvents);
    mirrorLocal(COLLECTIONS.INVENTARIS, data.inventaris);
    mirrorLocal(COLLECTIONS.PEMINJAMAN, data.peminjaman);
    mirrorLocal(COLLECTIONS.MODUL_MATERI, data.modulMateri);
    mirrorLocal(COLLECTIONS.SILABUS, data.silabus);
    mirrorLocal(COLLECTIONS.KAS, data.kas);
    mirrorLocal(COLLECTIONS.DEWAN_AMBALAN, data.dewanAmbalan);

    localStorage.setItem('pramuka_last_sync_version', syncVersion.toString());
    localStorage.setItem('pramuka_last_sync_time', syncTimestamp);

    const stats: SyncStats = {
      totalSiswa: data.siswa?.length || 0,
      totalKehadiran: data.kehadiran?.length || 0,
      totalMateri: data.materi?.length || 0,
      totalSku: data.sku?.length || 0,
      totalTabungan: data.tabungan?.length || 0,
      totalKedisiplinan: data.kedisiplinan?.length || 0,
      totalJurnal: data.jurnal?.length || 0,
      totalKelas: data.kelas?.length || 0,
      totalInventaris: data.inventaris?.length || 0,
      totalKas: data.kas?.length || 0,
      totalDewanAmbalan: data.dewanAmbalan?.length || 0,
      totalSemuaItem: ops.length,
      timestamp: syncTimestamp
    };

    return { success: true, stats };
  } catch (err: any) {
    console.error('Error pushing data to Cloud:', err);
    return {
      success: false,
      stats: {
        totalSiswa: 0,
        totalKehadiran: 0,
        totalMateri: 0,
        totalSku: 0,
        totalTabungan: 0,
        totalKedisiplinan: 0,
        totalJurnal: 0,
        totalKelas: 0,
        totalInventaris: 0,
        totalKas: 0,
        totalDewanAmbalan: 0,
        totalSemuaItem: 0,
        timestamp: new Date().toISOString()
      },
      error: err.message || 'Gagal menyinkronkan data ke Cloud Firestore.'
    };
  }
}

/**
 * Pulls authoritative data directly from Cloud Firestore for all 18 collections.
 * Clears local stale caches and deletion blockers on this device (e.g. HP),
 * ensuring the device's state becomes 100% identical to the master database.
 */
export async function pullAuthoritativeDataFromCloud(): Promise<{
  success: boolean;
  data?: ComprehensiveCloudData;
  stats?: SyncStats;
  error?: string;
}> {
  try {
    // 1. Clear deletion tracker on this device
    clearDeletedIds();
    DataSyncManager.clearPendingQueue();

    // Helper to fetch collection
    const fetchCol = async <T extends { id?: string; deleted?: boolean; is_deleted?: boolean; tombstone?: boolean }>(
      colName: string
    ): Promise<T[]> => {
      try {
        const snap = await getDocs(collection(db, colName));
        const list: T[] = [];
        snap.forEach((docSnap) => {
          const item = docSnap.data() as T;
          if (!item) return;
          const docId = docSnap.id || (item as any).id;
          if (item.deleted === true || item.is_deleted === true || item.tombstone === true) {
            return;
          }
          list.push({ ...item, id: docId });
        });
        return list;
      } catch (err) {
        console.warn(`Error pulling ${colName} from cloud:`, err);
        return [];
      }
    };

    // Parallel fetch across all collections
    const [
      siswa,
      kehadiran,
      materi,
      sku,
      skuDefs,
      tabungan,
      kedisiplinan,
      jurnal,
      kelas,
      skkDefs,
      skkRecords,
      kegiatanEvents,
      inventaris,
      peminjaman,
      modulMateri,
      silabus,
      kas,
      dewanAmbalan
    ] = await Promise.all([
      fetchCol<Siswa>(COLLECTIONS.SISWA),
      fetchCol<Kehadiran>(COLLECTIONS.KEHADIRAN),
      fetchCol<Materi>(COLLECTIONS.MATERI),
      fetchCol<SKU>(COLLECTIONS.SKU),
      fetchCol<SKUItemDef>(COLLECTIONS.SKU_DEFS),
      fetchCol<Tabungan>(COLLECTIONS.TABUNGAN),
      fetchCol<Kedisiplinan>(COLLECTIONS.KEDISIPLINAN),
      fetchCol<Jurnal>(COLLECTIONS.JURNAL),
      fetchCol<Kelas>(COLLECTIONS.KELAS),
      fetchCol<SKKDef>(COLLECTIONS.SKK_DEFS),
      fetchCol<SKKRecord>(COLLECTIONS.SKK),
      fetchCol<KegiatanEvent>(COLLECTIONS.KEGIATAN_EVENTS),
      fetchCol<BarangInventaris>(COLLECTIONS.INVENTARIS),
      fetchCol<PeminjamanLogistik>(COLLECTIONS.PEMINJAMAN),
      fetchCol<ModulMateri>(COLLECTIONS.MODUL_MATERI),
      fetchCol<SilabusLatihan>(COLLECTIONS.SILABUS),
      fetchCol<TransaksiKas>(COLLECTIONS.KAS),
      fetchCol<PeriodeDewanAmbalan>(COLLECTIONS.DEWAN_AMBALAN)
    ]);

    const resultData: ComprehensiveCloudData = {
      siswa,
      kehadiran,
      materi,
      sku,
      skuDefs,
      tabungan,
      kedisiplinan,
      jurnal,
      kelas,
      skkDefs,
      skkRecords,
      kegiatanEvents,
      inventaris,
      peminjaman,
      modulMateri,
      silabus,
      kas,
      dewanAmbalan
    };

    // Mirror each collection directly into this device's localStorage
    const mirrorLocal = (col: string, list?: any[]) => {
      if (!list) return;
      try {
        const key = getCollectionStorageKey(col);
        localStorage.setItem(key, JSON.stringify(list));
      } catch (e) {}
    };

    mirrorLocal(COLLECTIONS.SISWA, siswa);
    mirrorLocal(COLLECTIONS.KEHADIRAN, kehadiran);
    mirrorLocal(COLLECTIONS.MATERI, materi);
    mirrorLocal(COLLECTIONS.SKU, sku);
    mirrorLocal(COLLECTIONS.SKU_DEFS, skuDefs);
    mirrorLocal(COLLECTIONS.TABUNGAN, tabungan);
    mirrorLocal(COLLECTIONS.KEDISIPLINAN, kedisiplinan);
    mirrorLocal(COLLECTIONS.JURNAL, jurnal);
    mirrorLocal(COLLECTIONS.KELAS, kelas);
    mirrorLocal(COLLECTIONS.SKK_DEFS, skkDefs);
    mirrorLocal(COLLECTIONS.SKK, skkRecords);
    mirrorLocal(COLLECTIONS.KEGIATAN_EVENTS, kegiatanEvents);
    mirrorLocal(COLLECTIONS.INVENTARIS, inventaris);
    mirrorLocal(COLLECTIONS.PEMINJAMAN, peminjaman);
    mirrorLocal(COLLECTIONS.MODUL_MATERI, modulMateri);
    mirrorLocal(COLLECTIONS.SILABUS, silabus);
    mirrorLocal(COLLECTIONS.KAS, kas);
    mirrorLocal(COLLECTIONS.DEWAN_AMBALAN, dewanAmbalan);

    const now = new Date().toISOString();
    localStorage.setItem('pramuka_last_sync_time', now);
    localStorage.setItem('pramuka_last_sync_version', Date.now().toString());

    const stats: SyncStats = {
      totalSiswa: siswa.length,
      totalKehadiran: kehadiran.length,
      totalMateri: materi.length,
      totalSku: sku.length,
      totalTabungan: tabungan.length,
      totalKedisiplinan: kedisiplinan.length,
      totalJurnal: jurnal.length,
      totalKelas: kelas.length,
      totalInventaris: inventaris.length,
      totalKas: kas.length,
      totalDewanAmbalan: dewanAmbalan.length,
      totalSemuaItem:
        siswa.length +
        kehadiran.length +
        materi.length +
        sku.length +
        skuDefs.length +
        tabungan.length +
        kedisiplinan.length +
        jurnal.length +
        kelas.length +
        skkDefs.length +
        skkRecords.length +
        kegiatanEvents.length +
        inventaris.length +
        peminjaman.length +
        modulMateri.length +
        silabus.length +
        kas.length +
        dewanAmbalan.length,
      timestamp: now
    };

    return { success: true, data: resultData, stats };
  } catch (err: any) {
    console.error('Error pulling data from cloud:', err);
    return {
      success: false,
      error: err.message || 'Gagal mengambil data dari Cloud Firestore.'
    };
  }
}
