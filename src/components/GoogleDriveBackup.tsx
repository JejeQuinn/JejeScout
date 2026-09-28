import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { 
  googleSignIn, 
  logout, 
  listBackupFiles, 
  uploadBackupFile, 
  downloadBackupContent, 
  deleteDriveFile, 
  DriveFile, 
  initAuth 
} from '../utils/firebaseAuth';
import { 
  Cloud, 
  CloudUpload, 
  Download, 
  Trash2, 
  RefreshCw, 
  LogOut, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Database,
  FileDown,
  HardDriveDownload,
  UploadCloud,
  FileJson,
  Users,
  CheckSquare,
  BookOpen,
  Award,
  Landmark,
  ShieldAlert,
  FileText,
  GraduationCap
} from 'lucide-react';
import { Siswa, Kehadiran, Materi, SKU, Tabungan, Kedisiplinan, Jurnal, SKUItemDef, Kelas, SKKDef, SKKRecord, KegiatanEvent, BarangInventaris, PeminjamanLogistik, ModulMateri, SilabusLatihan, TransaksiKas, PeriodeDewanAmbalan } from '../types';
import { 
  triggerDownloadBackupJson, 
  parseBackupFile, 
  ParseBackupResult, 
  formatBytes 
} from '../utils/backupRestoreHelper';

interface GoogleDriveBackupProps {
  siswa: Siswa[];
  kehadiran: Kehadiran[];
  materi: Materi[];
  sku: SKU[];
  tabungan: Tabungan[];
  kedisiplinan: Kedisiplinan[];
  jurnal: Jurnal[];
  skuDefs: SKUItemDef[];
  kelas: Kelas[];
  skkDefs?: SKKDef[];
  skkRecords?: SKKRecord[];
  kegiatanEvents?: KegiatanEvent[];
  inventaris?: BarangInventaris[];
  peminjaman?: PeminjamanLogistik[];
  modulMateri?: ModulMateri[];
  silabus?: SilabusLatihan[];
  kas?: TransaksiKas[];
  dewanAmbalan?: PeriodeDewanAmbalan[];
  onRestore: (data: {
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
  }) => void;
  readOnly?: boolean;
}

export const GoogleDriveBackup: React.FC<GoogleDriveBackupProps> = ({
  siswa,
  kehadiran,
  materi,
  sku,
  tabungan,
  kedisiplinan,
  jurnal,
  skuDefs,
  kelas,
  skkDefs,
  skkRecords,
  kegiatanEvents,
  inventaris,
  peminjaman,
  modulMateri,
  silabus,
  kas,
  dewanAmbalan,
  onRestore,
  readOnly = false,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backups, setBackups] = useState<DriveFile[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Local JSON Upload & Restore State
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingJson, setIsProcessingJson] = useState(false);
  const [jsonParseResult, setJsonParseResult] = useState<ParseBackupResult | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Auth state on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        fetchBackups(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setBackups([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchBackups = async (accessToken: string) => {
    setIsLoading(true);
    try {
      const files = await listBackupFiles(accessToken);
      setBackups(files);
    } catch (error: any) {
      console.error(error);
      showMsg('error', 'Gagal memuat daftar backup dari Google Drive: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const showMsg = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage((prev) => prev?.text === text ? null : prev);
    }, 7000);
  };

  // Google Drive Auth handlers
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const res = await googleSignIn({ requestDriveScope: true });
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showMsg('success', `Berhasil menghubungkan Google Drive (${res.user.email})`);
        fetchBackups(res.accessToken);
      }
    } catch (error: any) {
      console.error(error);
      showMsg('error', 'Login gagal: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      setUser(null);
      setToken(null);
      setBackups([]);
      showMsg('info', 'Google Drive berhasil diputuskan');
    } catch (error: any) {
      console.error(error);
      showMsg('error', 'Gagal logout: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const backupData = {
        app: "SI-Pramuka Ambalan",
        backupVersion: "2.0",
        timestamp: new Date().toISOString(),
        data: {
          siswa,
          kehadiran,
          materi,
          sku,
          tabungan,
          kedisiplinan,
          jurnal,
          skuDefs,
          kelas,
          skkDefs,
          skkRecords,
          kegiatanEvents,
          inventaris,
          peminjaman,
          modulMateri,
          silabus,
          kas,
          dewanAmbalan,
        }
      };

      const now = new Date();
      const dateStr = now.getFullYear() +
        '-' + String(now.getMonth() + 1).padStart(2, '0') +
        '-' + String(now.getDate()).padStart(2, '0') +
        '_' + String(now.getHours()).padStart(2, '0') +
        '-' + String(now.getMinutes()).padStart(2, '0');

      const filename = `SI_Pramuka_Backup_${dateStr}.json`;

      await uploadBackupFile(token, filename, backupData);
      showMsg('success', `Sukses membuat backup baru di Google Drive: "${filename}"`);
      await fetchBackups(token);
    } catch (error: any) {
      console.error(error);
      showMsg('error', 'Gagal mengunggah backup ke Google Drive: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Local JSON Download
  const handleDownloadLocalBackup = () => {
    try {
      const filename = triggerDownloadBackupJson({
        siswa,
        kehadiran,
        materi,
        sku,
        tabungan,
        kedisiplinan,
        jurnal,
        skuDefs,
        kelas,
        skkDefs,
        skkRecords,
        kegiatanEvents,
        inventaris,
        peminjaman,
        modulMateri,
        silabus,
        kas,
        dewanAmbalan,
      });
      showMsg('success', `File backup lokal berhasil diunduh: "${filename}"`);
    } catch (error: any) {
      console.error(error);
      showMsg('error', 'Gagal mengunduh backup lokal: ' + error.message);
    }
  };

  // Local JSON File Upload & Inspection
  const handleFileChosen = async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      showMsg('error', 'Format file tidak valid. Harap pilih file berekstensi .json');
      return;
    }

    setIsProcessingJson(true);
    setRestoreSuccess(false);

    try {
      const res = await parseBackupFile(file);
      setJsonParseResult(res);
      if (!res.success) {
        showMsg('error', res.error || 'Gagal membaca isi file JSON');
      } else {
        showMsg('info', `File "${file.name}" siap dipulihkan (${res.summary?.totalSiswa} murid, ${res.summary?.totalKehadiran} absensi)`);
      }
    } catch (err: any) {
      showMsg('error', 'Gagal memproses file: ' + err.message);
    } finally {
      setIsProcessingJson(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChosen(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteJsonRestore = () => {
    if (!jsonParseResult || !jsonParseResult.success || !jsonParseResult.data) {
      showMsg('error', 'Tidak ada data cadangan yang valid untuk dipulihkan.');
      return;
    }

    const { summary, data } = jsonParseResult;
    setIsProcessingJson(true);

    try {
      onRestore({
        siswa: data.siswa,
        kehadiran: data.kehadiran,
        materi: data.materi,
        sku: data.sku,
        tabungan: data.tabungan,
        kedisiplinan: data.kedisiplinan,
        jurnal: data.jurnal,
        skuDefs: data.skuDefs.length > 0 ? data.skuDefs : skuDefs,
        kelas: data.kelas && data.kelas.length > 0 ? data.kelas : kelas,
        skkDefs: data.skkDefs,
        skkRecords: data.skkRecords,
        kegiatanEvents: data.kegiatanEvents,
        inventaris: data.inventaris,
        peminjaman: data.peminjaman,
        modulMateri: data.modulMateri,
        silabus: data.silabus,
        kas: data.kas,
        dewanAmbalan: data.dewanAmbalan,
      });

      setRestoreSuccess(true);
      showMsg(
        'success',
        `Database berhasil dipulihkan dari "${summary?.filename}"! ${summary?.totalSiswa} murid dan seluruh rekaman data kini aktif.`
      );
    } catch (err: any) {
      showMsg('error', 'Gagal memulihkan database: ' + err.message);
    } finally {
      setIsProcessingJson(false);
    }
  };

  const handleResetFilePicker = () => {
    setJsonParseResult(null);
    setRestoreSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drive restore and delete
  const handleDownloadDriveBackupToLocal = async (file: DriveFile) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const fileData = await downloadBackupContent(token, file.id);
      if (fileData) {
        const jsonStr = JSON.stringify(fileData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = file.name || `SI_Pramuka_Backup_${file.id}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showMsg('success', `File backup "${file.name}" berhasil diunduh ke komputer Anda.`);
      } else {
        throw new Error('Data file backup kosong');
      }
    } catch (error: any) {
      console.error(error);
      showMsg('error', 'Gagal mengunduh file backup: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreDriveBackup = async (file: DriveFile) => {
    if (!token) return;

    const confirmed = window.confirm(
      `Peringatan Pemulihan Data!\n\nApakah Anda yakin ingin memulihkan data dari backup Google Drive "${file.name}"?\n\nTindakan ini akan MENIMPA seluruh data murid, absensi, SKU, tabungan, kedisiplinan, dan jurnal saat ini.`
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const fileData = await downloadBackupContent(token, file.id);
      
      if (fileData && fileData.data) {
        const d = fileData.data;
        onRestore({
          siswa: d.siswa || [],
          kehadiran: d.kehadiran || [],
          materi: d.materi || [],
          sku: d.sku || [],
          tabungan: d.tabungan || [],
          kedisiplinan: d.kedisiplinan || [],
          jurnal: d.jurnal || [],
          skuDefs: d.skuDefs || skuDefs,
          kelas: d.kelas || kelas,
        });
        showMsg('success', `Database berhasil dipulihkan dari cadangan Google Drive!`);
      } else {
        throw new Error('Format file backup tidak valid untuk aplikasi SI-Pramuka');
      }
    } catch (error: any) {
      console.error(error);
      showMsg('error', 'Gagal memulihkan database: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDriveBackup = async (file: DriveFile) => {
    if (!token) return;

    const confirmed = window.confirm(
      `Konfirmasi Penghapusan File!\n\nApakah Anda yakin ingin menghapus file backup "${file.name}" dari Google Drive Anda secara permanen?`
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      await deleteDriveFile(token, file.id);
      showMsg('success', `File backup "${file.name}" berhasil dihapus.`);
      await fetchBackups(token);
    } catch (error: any) {
      console.error(error);
      showMsg('error', 'Gagal menghapus file backup: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8" id="google_drive_backup_module">
      {/* Header Banner */}
      <div className="bg-indigo-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg border border-indigo-950">
        <div className="relative z-10 space-y-2 max-w-3xl">
          <span className="bg-indigo-800 text-indigo-200 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest inline-flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Pusat Keamanan & Pemulihan Data Ambalan
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Cadangkan & Pulihkan Database (Upload Backup JSON)
          </h2>
          <p className="text-indigo-200 text-xs md:text-sm leading-relaxed">
            Gunakan fitur ini untuk menyimpan salinan cadangan (*backup file*) ke komputer/HP Anda, atau mengunggah kembali file JSON hasil backup jika data ter-reset saat ada pembaruan fitur atau perpindahan sesi.
          </p>
        </div>
      </div>

      {/* Floating Status Notification */}
      {message && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs font-bold animate-fade-in shadow-xs ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : message.type === 'error' 
              ? 'bg-rose-50 text-rose-900 border-rose-200' 
              : 'bg-indigo-50 text-indigo-900 border-indigo-200'
        }`}>
          {message.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />}
          {message.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />}
          {message.type === 'info' && <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />}
          <div className="flex-1 leading-relaxed">{message.text}</div>
        </div>
      )}

      {/* SECTION 1: UTAMA - UPLOAD & DOWNLOAD FILE JSON (OFFLINE-FIRST) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: UPLOAD & RESTORE JSON (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-800">1. Unggah File Backup JSON</h3>
                <p className="text-[11px] text-gray-400">Pulihkan seluruh data murid, absensi, SKU, tabungan & jurnal</p>
              </div>
            </div>
            {jsonParseResult?.success && (
              <button
                type="button"
                onClick={handleResetFilePicker}
                className="text-[11px] font-bold text-gray-500 hover:text-gray-800 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
              >
                Ganti File
              </button>
            )}
          </div>

          {!jsonParseResult || !jsonParseResult.success ? (
            /* DROP ZONE */
            <div className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-600 bg-indigo-50/70 scale-[0.99]'
                    : 'border-gray-200 hover:border-indigo-400 bg-gray-50/50 hover:bg-indigo-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileChosen(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <FileJson className="w-7 h-7" />
                </div>

                <h4 className="text-sm font-black text-gray-800">
                  Klik untuk Memilih File Backup JSON (.json)
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  atau tarik dan letakkan file hasil unduhan backup Anda ke area ini
                </p>
                <span className="inline-block mt-3 px-3 py-1 bg-white border border-gray-200 rounded-full text-[10px] font-bold text-gray-600 shadow-2xs">
                  Format: SI_Pramuka_Backup_*.json
                </span>
              </div>

              {/* Informative Tip Box */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-900 leading-relaxed font-medium">
                  <strong className="font-bold">Tips Pembina:</strong> Ketika website menerima update fitur baru dari sistem AI Studio, Anda dapat mengunggah file JSON terakhir Anda ke sini. Seluruh data akan seketika kembali terisi dan disinkronkan ke Cloud Database Firestore.
                </div>
              </div>
            </div>
          ) : (
            /* PREVIEW OF PARSED BACKUP DATA */
            <div className="space-y-4">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-gray-800 truncate">
                      {jsonParseResult.summary?.filename}
                    </p>
                    <p className="text-[10px] text-gray-500 font-semibold">
                      Ukuran: {jsonParseResult.summary?.fileSizeFormatted} &bull; {jsonParseResult.summary?.timestamp ? `Tanggal: ${new Date(jsonParseResult.summary.timestamp).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Format Standar'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stat inspection badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Murid</p>
                    <p className="text-xs font-black text-gray-800">{jsonParseResult.summary?.totalSiswa}</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Absensi</p>
                    <p className="text-xs font-black text-gray-800">{jsonParseResult.summary?.totalKehadiran}</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Materi</p>
                    <p className="text-xs font-black text-gray-800">{jsonParseResult.summary?.totalMateri}</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center space-x-2">
                  <Award className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">SKU</p>
                    <p className="text-xs font-black text-gray-800">{jsonParseResult.summary?.totalSku}</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center space-x-2">
                  <Landmark className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Tabungan</p>
                    <p className="text-xs font-black text-gray-800">{jsonParseResult.summary?.totalTabungan}</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Disiplin</p>
                    <p className="text-xs font-black text-gray-800">{jsonParseResult.summary?.totalKedisiplinan}</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Jurnal</p>
                    <p className="text-xs font-black text-gray-800">{jsonParseResult.summary?.totalJurnal}</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-violet-600 shrink-0" />
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Kelas</p>
                    <p className="text-xs font-black text-gray-800">{jsonParseResult.summary?.totalKelas}</p>
                  </div>
                </div>
              </div>

              {!restoreSuccess ? (
                <div className="pt-2">
                  {!readOnly ? (
                    <>
                      <button
                        type="button"
                        onClick={handleExecuteJsonRestore}
                        disabled={isProcessingJson}
                        className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-extrabold text-xs rounded-2xl transition shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                      >
                        <HardDriveDownload className="w-4 h-4" />
                        <span>{isProcessingJson ? 'Sedang Memulihkan & Menyimpan ke Cloud...' : 'Pulihkan Database Sekarang (Timpa Data)'}</span>
                      </button>
                      <p className="text-[10px] text-gray-400 text-center mt-2 font-medium">
                        Data lama di browser & Firestore akan diperbarui dengan data dari file backup ini.
                      </p>
                    </>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-amber-800 text-xs font-bold">
                      Mode Pengawas: Pemulihan / penimpaan database hanya dapat dilakukan oleh Admin (Pembina Pramuka).
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-extrabold text-emerald-900">
                    Pemulihan Berhasil! Database telah aktif dan tersinkronisasi.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DOWNLOAD BACKUP JSON & LIVE SUMMARY (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileDown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-800">2. Unduh Salinan Cadangan</h3>
                <p className="text-[11px] text-gray-400">Simpan data terbaru ke file .json mandiri</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Unduh salinan seluruh database terkini kapan saja. File ini dapat Anda simpan di Flashdisk, Google Drive mandiri, atau laptop untuk berjaga-jaga.
            </p>

            {/* Current counts */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span className="flex items-center gap-1.5 text-gray-500">
                  <Users className="w-3.5 h-3.5 text-indigo-500" /> Murid Aktif:
                </span>
                <span>{siswa.length} Orang</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span className="flex items-center gap-1.5 text-gray-500">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500" /> Total Absensi:
                </span>
                <span>{kehadiran.length} Catatan</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span className="flex items-center gap-1.5 text-gray-500">
                  <Award className="w-3.5 h-3.5 text-purple-500" /> Penilaian SKU:
                </span>
                <span>{sku.length} Nilai</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span className="flex items-center gap-1.5 text-gray-500">
                  <Landmark className="w-3.5 h-3.5 text-teal-500" /> Tabungan Anggota:
                </span>
                <span>{tabungan.length} Transaksi</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span className="flex items-center gap-1.5 text-gray-500">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Poin Disiplin:
                </span>
                <span>{kedisiplinan.length} Catatan</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadLocalBackup}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs rounded-2xl transition shadow-md flex items-center justify-center space-x-2 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Unduh Backup JSON Sekarang</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: GOOGLE DRIVE CLOUD INTEGRATION */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-800">
                Pencadangan Cloud Google Drive (Opsional)
              </h3>
              <p className="text-xs text-gray-400">
                Sinkronisasikan file backup secara otomatis langsung ke akun Google Drive pribadi Anda
              </p>
            </div>
          </div>

          {user && (
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3.5 py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold rounded-xl transition cursor-pointer self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Putuskan Google Drive</span>
            </button>
          )}
        </div>

        {!user ? (
          /* NOT LOGGED IN */
          <div className="p-8 max-w-lg mx-auto text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <Cloud className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-gray-800">Hubungkan Akun Google Drive</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Menghubungkan akun Google Drive memungkinkan Anda membuat arsip backup langsung ke folder Google Drive pribadi Anda tanpa perlu mengunduh manual.
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="gsi-material-button cursor-pointer focus:outline-none"
                style={{
                  background: 'white',
                  border: '1px solid #747775',
                  borderRadius: '12px',
                  color: '#1f1f1f',
                  fontFamily: 'Roboto, arial, sans-serif',
                  fontSize: '14px',
                  height: '40px',
                  letterSpacing: '0.25px',
                  outline: 'none',
                  overflow: 'hidden',
                  position: 'relative',
                  textAlign: 'center',
                  transition: 'background-color .218s, border-color .218s, box-shadow .218s',
                  userSelect: 'none',
                  width: 'auto',
                  minWidth: '190px',
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'
                }}
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="gsi-material-button-icon" style={{ height: '20px', width: '20px', display: 'block' }}>
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents" style={{ fontWeight: 600 }}>Masuk dengan Google</span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* LOGGED IN GOOGLE DRIVE VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 h-fit">
              <div className="flex items-center space-x-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                    {user.displayName?.substring(0, 2).toUpperCase() || 'JF'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-black text-gray-800 truncate">{user.displayName}</p>
                  <p className="text-[10px] text-gray-400 font-bold truncate">{user.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateBackup}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
              >
                <CloudUpload className="w-4 h-4" />
                <span>Upload Backup Baru ke Drive</span>
              </button>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Daftar Arsip Backup di Google Drive Anda
                </h4>
                <button
                  type="button"
                  onClick={() => fetchBackups(token!)}
                  disabled={isLoading}
                  className="p-1 text-gray-400 hover:text-gray-700 transition cursor-pointer"
                  title="Segarkan daftar"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                {backups.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400">
                    Belum ada file backup di Google Drive. Klik "Upload Backup Baru ke Drive" untuk membuat arsip pertama.
                  </div>
                ) : (
                  backups.map((file) => (
                    <div key={file.id} className="p-4 flex items-center justify-between hover:bg-gray-50/60 transition gap-4">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-xs font-extrabold text-gray-800 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <div className="flex items-center space-x-2 text-[9px] text-gray-400 font-bold">
                          <span>{formatBytes(parseInt(file.size || '0'))}</span>
                          <span>&bull;</span>
                          <span>
                            {file.createdTime ? new Date(file.createdTime).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : '-'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDownloadDriveBackupToLocal(file)}
                          disabled={isLoading}
                          className="flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                          title="Unduh ke perangkat"
                        >
                          <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                          <span>UNDUH</span>
                        </button>

                        {!readOnly && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRestoreDriveBackup(file)}
                              disabled={isLoading}
                              className="flex items-center space-x-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                              title="Pulihkan data ini"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PULIHKAN</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteDriveBackup(file)}
                              disabled={isLoading}
                              className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
