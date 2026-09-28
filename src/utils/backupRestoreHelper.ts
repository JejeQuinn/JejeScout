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

export interface BackupPayload {
  app: string;
  backupVersion: string;
  timestamp: string;
  data: {
    siswa: Siswa[];
    kehadiran: Kehadiran[];
    materi: Materi[];
    sku: SKU[];
    tabungan: Tabungan[];
    kedisiplinan: Kedisiplinan[];
    jurnal: Jurnal[];
    skuDefs: SKUItemDef[];
    kelas?: Kelas[];
    skkDefs?: SKKDef[];
    skkRecords?: SKKRecord[];
    kegiatanEvents?: KegiatanEvent[];
    inventaris?: BarangInventaris[];
    peminjaman?: PeminjamanLogistik[];
    modulMateri?: ModulMateri[];
    silabus?: SilabusLatihan[];
    kas?: TransaksiKas[];
    dewanAmbalan?: PeriodeDewanAmbalan[];
  };
}

export interface BackupSummary {
  filename: string;
  fileSizeFormatted: string;
  timestamp: string | null;
  appIdentifier: string | null;
  totalSiswa: number;
  totalKehadiran: number;
  totalMateri: number;
  totalSku: number;
  totalTabungan: number;
  totalKedisiplinan: number;
  totalJurnal: number;
  totalKelas: number;
  totalSkuDefs: number;
  totalSkkDefs?: number;
  totalSkkRecords?: number;
  totalKegiatanEvents?: number;
  totalInventaris?: number;
  totalPeminjaman?: number;
  totalKas?: number;
  totalDewanAmbalan?: number;
}

export interface ParseBackupResult {
  success: boolean;
  error?: string;
  summary?: BackupSummary;
  data?: {
    siswa: Siswa[];
    kehadiran: Kehadiran[];
    materi: Materi[];
    sku: SKU[];
    tabungan: Tabungan[];
    kedisiplinan: Kedisiplinan[];
    jurnal: Jurnal[];
    skuDefs: SKUItemDef[];
    kelas?: Kelas[];
    skkDefs?: SKKDef[];
    skkRecords?: SKKRecord[];
    kegiatanEvents?: KegiatanEvent[];
    inventaris?: BarangInventaris[];
    peminjaman?: PeminjamanLogistik[];
    modulMateri?: ModulMateri[];
    silabus?: SilabusLatihan[];
    kas?: TransaksiKas[];
    dewanAmbalan?: PeriodeDewanAmbalan[];
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function createBackupObject(data: {
  siswa: Siswa[];
  kehadiran: Kehadiran[];
  materi: Materi[];
  sku: SKU[];
  tabungan: Tabungan[];
  kedisiplinan: Kedisiplinan[];
  jurnal: Jurnal[];
  skuDefs: SKUItemDef[];
  kelas?: Kelas[];
  skkDefs?: SKKDef[];
  skkRecords?: SKKRecord[];
  kegiatanEvents?: KegiatanEvent[];
  inventaris?: BarangInventaris[];
  peminjaman?: PeminjamanLogistik[];
  modulMateri?: ModulMateri[];
  silabus?: SilabusLatihan[];
  kas?: TransaksiKas[];
  dewanAmbalan?: PeriodeDewanAmbalan[];
}): BackupPayload {
  return {
    app: "SI-Pramuka Ambalan SMK Bakti Idhata",
    backupVersion: "2.0",
    timestamp: new Date().toISOString(),
    data: {
      siswa: data.siswa,
      kehadiran: data.kehadiran,
      materi: data.materi,
      sku: data.sku,
      tabungan: data.tabungan,
      kedisiplinan: data.kedisiplinan,
      jurnal: data.jurnal,
      skuDefs: data.skuDefs,
      kelas: data.kelas,
      skkDefs: data.skkDefs,
      skkRecords: data.skkRecords,
      kegiatanEvents: data.kegiatanEvents,
      inventaris: data.inventaris,
      peminjaman: data.peminjaman,
      modulMateri: data.modulMateri,
      silabus: data.silabus,
      kas: data.kas,
      dewanAmbalan: data.dewanAmbalan,
    }
  };
}

export function triggerDownloadBackupJson(data: {
  siswa: Siswa[];
  kehadiran: Kehadiran[];
  materi: Materi[];
  sku: SKU[];
  tabungan: Tabungan[];
  kedisiplinan: Kedisiplinan[];
  jurnal: Jurnal[];
  skuDefs: SKUItemDef[];
  kelas?: Kelas[];
  skkDefs?: SKKDef[];
  skkRecords?: SKKRecord[];
  kegiatanEvents?: KegiatanEvent[];
  inventaris?: BarangInventaris[];
  peminjaman?: PeminjamanLogistik[];
  modulMateri?: ModulMateri[];
  silabus?: SilabusLatihan[];
  kas?: TransaksiKas[];
  dewanAmbalan?: PeriodeDewanAmbalan[];
}, customFilename?: string): string {
  const payload = createBackupObject(data);
  const now = new Date();
  const dateStr = now.getFullYear() +
    '-' + String(now.getMonth() + 1).padStart(2, '0') +
    '-' + String(now.getDate()).padStart(2, '0') +
    '_' + String(now.getHours()).padStart(2, '0') +
    '-' + String(now.getMinutes()).padStart(2, '0');

  const filename = customFilename || `SI_Pramuka_Backup_${dateStr}.json`;
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}

export async function parseBackupFile(file: File): Promise<ParseBackupResult> {
  try {
    const text = await file.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      return {
        success: false,
        error: 'File yang dipilih bukan merupakan format JSON yang valid. Harap periksa kembali file Anda.'
      };
    }

    if (!json || typeof json !== 'object') {
      return {
        success: false,
        error: 'Isi file JSON tidak sesuai struktur yang diharapkan.'
      };
    }

    // Determine data container: either json.data (official export) or root object
    const rawData = (json.data && typeof json.data === 'object') ? json.data : json;

    const siswa: Siswa[] = Array.isArray(rawData.siswa) ? rawData.siswa : [];
    const kehadiran: Kehadiran[] = Array.isArray(rawData.kehadiran) ? rawData.kehadiran : [];
    const materi: Materi[] = Array.isArray(rawData.materi) ? rawData.materi : [];
    const sku: SKU[] = Array.isArray(rawData.sku) ? rawData.sku : [];
    const tabungan: Tabungan[] = Array.isArray(rawData.tabungan) ? rawData.tabungan : [];
    const kedisiplinan: Kedisiplinan[] = Array.isArray(rawData.kedisiplinan) ? rawData.kedisiplinan : [];
    const jurnal: Jurnal[] = Array.isArray(rawData.jurnal) ? rawData.jurnal : [];
    const skuDefs: SKUItemDef[] = Array.isArray(rawData.skuDefs) ? rawData.skuDefs : [];
    const kelas: Kelas[] = Array.isArray(rawData.kelas) ? rawData.kelas : [];
    const skkDefs: SKKDef[] = Array.isArray(rawData.skkDefs) ? rawData.skkDefs : [];
    const skkRecords: SKKRecord[] = Array.isArray(rawData.skkRecords) ? rawData.skkRecords : (Array.isArray(rawData.skk) ? rawData.skk : []);
    const kegiatanEvents: KegiatanEvent[] = Array.isArray(rawData.kegiatanEvents) ? rawData.kegiatanEvents : [];
    const inventaris: BarangInventaris[] = Array.isArray(rawData.inventaris) ? rawData.inventaris : [];
    const peminjaman: PeminjamanLogistik[] = Array.isArray(rawData.peminjaman) ? rawData.peminjaman : [];
    const modulMateri: ModulMateri[] = Array.isArray(rawData.modulMateri) ? rawData.modulMateri : [];
    const silabus: SilabusLatihan[] = Array.isArray(rawData.silabus) ? rawData.silabus : [];
    const kas: TransaksiKas[] = Array.isArray(rawData.kas) ? rawData.kas : [];
    const dewanAmbalan: PeriodeDewanAmbalan[] = Array.isArray(rawData.dewanAmbalan) ? rawData.dewanAmbalan : [];

    const totalItems = siswa.length + kehadiran.length + materi.length + sku.length + tabungan.length + kedisiplinan.length + jurnal.length + inventaris.length + kas.length;
    
    if (totalItems === 0) {
      return {
        success: false,
        error: 'File JSON ini tidak berisi data SI-Pramuka (tidak ditemukan data murid, absensi, materi, tabungan, dsb).'
      };
    }

    const summary: BackupSummary = {
      filename: file.name,
      fileSizeFormatted: formatBytes(file.size),
      timestamp: json.timestamp || null,
      appIdentifier: json.app || 'Data JSON Mandiri',
      totalSiswa: siswa.length,
      totalKehadiran: kehadiran.length,
      totalMateri: materi.length,
      totalSku: sku.length,
      totalTabungan: tabungan.length,
      totalKedisiplinan: kedisiplinan.length,
      totalJurnal: jurnal.length,
      totalKelas: kelas.length,
      totalSkuDefs: skuDefs.length,
      totalSkkDefs: skkDefs.length,
      totalSkkRecords: skkRecords.length,
      totalKegiatanEvents: kegiatanEvents.length,
      totalInventaris: inventaris.length,
      totalPeminjaman: peminjaman.length,
      totalKas: kas.length,
      totalDewanAmbalan: dewanAmbalan.length
    };

    return {
      success: true,
      summary,
      data: {
        siswa,
        kehadiran,
        materi,
        sku,
        tabungan,
        kedisiplinan,
        jurnal,
        skuDefs,
        kelas: kelas.length > 0 ? kelas : undefined,
        skkDefs: skkDefs.length > 0 ? skkDefs : undefined,
        skkRecords: skkRecords.length > 0 ? skkRecords : undefined,
        kegiatanEvents: kegiatanEvents.length > 0 ? kegiatanEvents : undefined,
        inventaris: inventaris.length > 0 ? inventaris : undefined,
        peminjaman: peminjaman.length > 0 ? peminjaman : undefined,
        modulMateri: modulMateri.length > 0 ? modulMateri : undefined,
        silabus: silabus.length > 0 ? silabus : undefined,
        kas: kas.length > 0 ? kas : undefined,
        dewanAmbalan: dewanAmbalan.length > 0 ? dewanAmbalan : undefined,
      }
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Terjadi kesalahan saat memproses file: ' + (err?.message || String(err))
    };
  }
}
