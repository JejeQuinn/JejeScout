import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileDown, 
  CheckCircle2, 
  AlertTriangle, 
  FileJson, 
  Users, 
  CheckSquare, 
  BookOpen, 
  Award, 
  Landmark, 
  ShieldAlert, 
  FileText, 
  GraduationCap,
  HardDriveDownload,
  Database,
  ArrowRight,
  Info
} from 'lucide-react';
import { Siswa, Kehadiran, Materi, SKU, Tabungan, Kedisiplinan, Jurnal, SKUItemDef, Kelas, SKKDef, SKKRecord, KegiatanEvent, BarangInventaris, PeminjamanLogistik, ModulMateri, SilabusLatihan, TransaksiKas, PeriodeDewanAmbalan } from '../types';
import { 
  triggerDownloadBackupJson, 
  parseBackupFile, 
  ParseBackupResult, 
  BackupSummary 
} from '../utils/backupRestoreHelper';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  defaultTab?: 'upload' | 'download';
  readOnly?: boolean;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
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
  defaultTab = 'upload',
  readOnly = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'download'>(readOnly ? 'download' : defaultTab);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseBackupResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChosen = async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      setStatusMessage({
        type: 'error',
        text: 'Format file tidak didukung. Harap pilih file backup berekstensi .json'
      });
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);
    setStatusMessage(null);
    setRestoreSuccess(false);

    try {
      const res = await parseBackupFile(file);
      setParseResult(res);
      if (!res.success) {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Gagal membaca isi file JSON.'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat memeriksa file: ' + err.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChosen(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleExecuteRestore = () => {
    if (!parseResult || !parseResult.success || !parseResult.data) {
      setStatusMessage({
        type: 'error',
        text: 'Tidak ada data cadangan yang valid untuk dipulihkan.'
      });
      return;
    }

    const { summary, data } = parseResult;
    setIsProcessing(true);

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
      setStatusMessage({
        type: 'success',
        text: `Sukses memulihkan database dari "${summary?.filename}"! Data telah tersimpan di browser dan disinkronkan ke Database Cloud Firestore.`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Gagal memulihkan database: ' + err.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadBackup = () => {
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

      setStatusMessage({
        type: 'success',
        text: `File cadangan "${filename}" berhasil diunduh ke komputer/HP Anda.`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Gagal mengunduh backup: ' + err.message
      });
    }
  };

  const handleResetPicker = () => {
    setSelectedFile(null);
    setParseResult(null);
    setRestoreSuccess(false);
    setStatusMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-900 to-indigo-950 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 text-white">
              <HardDriveDownload className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                Pusat Backup & Pemulihan Data
                <span className="text-[10px] font-bold bg-indigo-500/40 text-indigo-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  JSON File
                </span>
              </h3>
              <p className="text-xs text-indigo-200">
                Amankan data Ambalan Anda atau pulihkan data terbaru saat website diperbarui
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 p-2 gap-2 px-6">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('upload');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'upload'
                ? 'bg-white text-indigo-700 shadow-xs border border-gray-200'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Unggah & Pulihkan Backup JSON</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('download');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'download'
                ? 'bg-white text-indigo-700 shadow-xs border border-gray-200'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
            }`}
          >
            <FileDown className="w-4 h-4" />
            <span>Unduh File Backup JSON</span>
          </button>
        </div>

        {/* Alert notification message */}
        {statusMessage && (
          <div className="px-6 pt-4">
            <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs font-bold ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-900 border-rose-200'
                  : 'bg-indigo-50 text-indigo-900 border-indigo-200'
            }`}>
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />}
              <div className="flex-1 leading-relaxed">{statusMessage.text}</div>
            </div>
          </div>
        )}

        {/* Scrollable Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeSubTab === 'upload' ? (
            /* UPLOAD & RESTORE TAB */
            <div className="space-y-5">
              {!parseResult || !parseResult.success ? (
                /* DRAG AND DROP ZONE */
                <div className="space-y-4">
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50/70 scale-[0.99]'
                        : 'border-gray-300 hover:border-indigo-400 bg-gray-50/40 hover:bg-indigo-50/20'
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

                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-4 shadow-2xs">
                      <FileJson className="w-8 h-8" />
                    </div>

                    <h4 className="text-sm font-extrabold text-gray-800">
                      Tarik & Letakkan file backup JSON ke sini
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      atau <span className="text-indigo-600 font-bold underline">klik untuk memilih file dari komputer/HP</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-3 font-medium">
                      Mendukung file hasil unduhan (.json) SI-Pramuka Ambalan SMK Bakti Idhata
                    </p>
                  </div>

                  {/* Information Box */}
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-amber-900 leading-relaxed font-medium">
                      <strong className="font-bold">Kenapa data bisa hilang saat update?</strong> Pada platform web preview, pembaruan kode atau pergantian sesi browser dapat mereset cache lokal. Mengunggah file backup JSON ini akan seketika mengisi kembali seluruh data Anda dan menyimpannya secara permanen ke Database Cloud.
                    </div>
                  </div>
                </div>
              ) : (
                /* PREVIEW OF PARSED DATA BEFORE RESTORING */
                <div className="space-y-4">
                  {/* File card */}
                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <FileJson className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-gray-800 truncate">
                          {parseResult.summary?.filename}
                        </p>
                        <p className="text-[10px] text-gray-500 font-semibold">
                          Ukuran: {parseResult.summary?.fileSizeFormatted} &bull; {parseResult.summary?.timestamp ? `Dibuat: ${new Date(parseResult.summary.timestamp).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Format JSON Standar'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetPicker}
                      className="text-xs font-bold text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-200/60 transition cursor-pointer"
                    >
                      Ganti File
                    </button>
                  </div>

                  {/* Summary grid */}
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">
                      Rincian Data yang Terdeteksi di File
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center space-x-2.5">
                        <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Siswa</p>
                          <p className="text-sm font-black text-gray-800">{parseResult.summary?.totalSiswa}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center space-x-2.5">
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Kehadiran</p>
                          <p className="text-sm font-black text-gray-800">{parseResult.summary?.totalKehadiran}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center space-x-2.5">
                        <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Materi</p>
                          <p className="text-sm font-black text-gray-800">{parseResult.summary?.totalMateri}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center space-x-2.5">
                        <Award className="w-4 h-4 text-purple-600 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">SKU</p>
                          <p className="text-sm font-black text-gray-800">{parseResult.summary?.totalSku}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center space-x-2.5">
                        <Landmark className="w-4 h-4 text-teal-600 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Tabungan</p>
                          <p className="text-sm font-black text-gray-800">{parseResult.summary?.totalTabungan}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center space-x-2.5">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Disiplin</p>
                          <p className="text-sm font-black text-gray-800">{parseResult.summary?.totalKedisiplinan}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center space-x-2.5">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Jurnal</p>
                          <p className="text-sm font-black text-gray-800">{parseResult.summary?.totalJurnal}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center space-x-2.5">
                        <GraduationCap className="w-4 h-4 text-violet-600 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Kelas</p>
                          <p className="text-sm font-black text-gray-800">{parseResult.summary?.totalKelas}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation Action Button */}
                  {!restoreSuccess ? (
                    <div className="pt-2">
                      {readOnly ? (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center text-xs font-bold text-amber-900">
                          Akses Ditolak: Anda masuk sebagai akun Pengawas (Hanya Lihat). Pemulihan data hanya dapat dijalankan oleh Pembina Pramuka (Admin).
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleExecuteRestore}
                          disabled={isProcessing}
                          className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-extrabold text-xs rounded-2xl transition shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                        >
                          <HardDriveDownload className="w-4 h-4" />
                          <span>{isProcessing ? 'Sedang Memulihkan & Menyimpan ke Cloud...' : 'Pulihkan Database Sekarang (Timpa Data)'}</span>
                        </button>
                      )}
                      <p className="text-[10px] text-gray-400 text-center mt-2">
                        Data lama akan digantikan dengan data yang ada di file ini dan otomatis disinkronkan ke Cloud Firestore.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                      <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-extrabold text-emerald-900">
                        Pemulihan Berhasil! Seluruh data terbaru Anda telah aktif.
                      </p>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Selesai & Tutup Jendela
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* DOWNLOAD BACKUP TAB */
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-800">
                      Data Aktif yang Siap Dicadangkan
                    </h4>
                    <p className="text-xs text-gray-500">
                      Semua data anggota, nilai, absensi, dan jurnal saat ini akan dikemas menjadi satu file JSON.
                    </p>
                  </div>
                </div>

                {/* Current Data Stat Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 text-center">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Siswa</span>
                    <span className="text-xs font-black text-gray-800">{siswa.length} Orang</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 text-center">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Absensi</span>
                    <span className="text-xs font-black text-gray-800">{kehadiran.length} Catatan</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 text-center">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Materi</span>
                    <span className="text-xs font-black text-gray-800">{materi.length} Materi</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 text-center">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">SKU</span>
                    <span className="text-xs font-black text-gray-800">{sku.length} Nilai</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 text-center">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Tabungan</span>
                    <span className="text-xs font-black text-gray-800">{tabungan.length} Transaksi</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 text-center">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Kedisiplinan</span>
                    <span className="text-xs font-black text-gray-800">{kedisiplinan.length} Log Poin</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 text-center">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Jurnal</span>
                    <span className="text-xs font-black text-gray-800">{jurnal.length} Catatan</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200 text-center">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">Kelas</span>
                    <span className="text-xs font-black text-gray-800">{kelas.length} Kelas</span>
                  </div>
                </div>
              </div>

              {/* Download CTA */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs rounded-2xl transition shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Unduh File Backup JSON (.json) Sekarang</span>
                </button>

                <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-indigo-900 leading-relaxed font-medium">
                    Simpan file backup ini di laptop atau HP Anda. Jika sewaktu-waktu aplikasi diperbarui atau data ter-reset, Anda cukup menggunakan tab <strong>Unggah & Pulihkan</strong> untuk mengembalikan seluruh data hanya dalam 1 klik!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[11px] text-gray-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Cloud & Local Sync Aktif</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
