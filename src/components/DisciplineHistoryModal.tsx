import React, { useState, useMemo } from 'react';
import { Siswa, Kedisiplinan } from '../types';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Award,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  User,
  Filter,
  Search,
  CheckCircle2,
  Printer,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  FileSpreadsheet
} from 'lucide-react';

interface DisciplineHistoryModalProps {
  siswa: Siswa;
  allKedisiplinan: Kedisiplinan[];
  isOpen: boolean;
  onClose: () => void;
  onAddLog: (newLog: Omit<Kedisiplinan, 'id'>) => void;
  onDeleteLog: (id: string) => void;
}

export const DisciplineHistoryModal: React.FC<DisciplineHistoryModalProps> = ({
  siswa,
  allKedisiplinan,
  isOpen,
  onClose,
  onAddLog,
  onDeleteLog,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'prestasi' | 'pelanggaran'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    tanggal: string;
    tipe: 'Prestasi' | 'Pelanggaran';
    keterangan: string;
    poin: number;
    pencatat: string;
  }>({
    tanggal: new Date().toISOString().split('T')[0],
    tipe: 'Pelanggaran',
    keterangan: '',
    poin: 5,
    pencatat: 'Kak Jihan Fadhilah, S. Kom'
  });

  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Get student's history sorted newest first
  const studentLogs = useMemo(() => {
    return allKedisiplinan
      .filter((k) => k.siswa_id === siswa.id)
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [allKedisiplinan, siswa.id]);

  // Compute stats
  const stats = useMemo(() => {
    let totalPrestasi = 0;
    let countPrestasi = 0;
    let totalPelanggaran = 0;
    let countPelanggaran = 0;

    studentLogs.forEach((item) => {
      if (item.tipe === 'Prestasi') {
        totalPrestasi += Math.abs(item.poin);
        countPrestasi++;
      } else {
        totalPelanggaran += Math.abs(item.poin);
        countPelanggaran++;
      }
    });

    const netScore = 100 + totalPrestasi - totalPelanggaran;

    return {
      netScore,
      totalPrestasi,
      countPrestasi,
      totalPelanggaran,
      countPelanggaran,
      totalEntries: studentLogs.length
    };
  }, [studentLogs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return studentLogs.filter((log) => {
      const matchFilter =
        activeFilter === 'all'
          ? true
          : activeFilter === 'prestasi'
          ? log.tipe === 'Prestasi'
          : log.tipe === 'Pelanggaran';

      const matchSearch =
        searchQuery.trim() === '' ||
        log.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.tanggal.includes(searchQuery);

      return matchFilter && matchSearch;
    });
  }, [studentLogs, activeFilter, searchQuery]);

  // Status tier evaluation
  const getStatusTier = (score: number) => {
    if (score >= 110) return { label: 'Teladan & Berprestasi', color: 'emerald', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (score >= 90) return { label: 'Sangat Baik & Disiplin', color: 'indigo', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (score >= 75) return { label: 'Cukup / Perhatian Ringan', color: 'amber', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Perlu Pembinaan Khusus', color: 'rose', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  const statusTier = getStatusTier(stats.netScore);

  // Quick preset handlers
  const applyPreset = (preset: { tipe: 'Prestasi' | 'Pelanggaran'; keterangan: string; poin: number }) => {
    setFormData({
      ...formData,
      tipe: preset.tipe,
      keterangan: preset.keterangan,
      poin: preset.poin
    });
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.keterangan.trim() || formData.poin <= 0) return;

    onAddLog({
      siswa_id: siswa.id,
      tanggal: formData.tanggal,
      tipe: formData.tipe,
      keterangan: formData.keterangan.trim(),
      poin: formData.poin
    });

    setFormSuccess(`Catatan ${formData.tipe} (${formData.poin} poin) berhasil ditambahkan!`);
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      tipe: 'Pelanggaran',
      keterangan: '',
      poin: 5,
      pencatat: 'Kak Jihan Fadhilah, S. Kom'
    });

    setTimeout(() => {
      setFormSuccess(null);
      setShowAddForm(false);
    }, 1500);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Kedisiplinan - ${siswa.nama_lengkap}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .header h2 { margin: 0; text-transform: uppercase; font-size: 18px; color: #0f172a; }
          .header p { margin: 4px 0 0; font-size: 12px; color: #64748b; }
          .info-table { width: 100%; margin-bottom: 20px; font-size: 12px; }
          .info-table td { padding: 4px 8px; }
          .score-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 20px; }
          .score-val { font-size: 28px; font-weight: bold; color: ${stats.netScore >= 80 ? '#059669' : '#dc2626'}; }
          table.data-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
          table.data-table th, table.data-table td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          table.data-table th { background: #f1f5f9; font-weight: bold; }
          .badge-plus { color: #059669; font-weight: bold; }
          .badge-minus { color: #dc2626; font-weight: bold; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>GERAKAN PRAMUKA GUGUS DEPAN SMK BAKTI IDHATA</h2>
          <p>Jl. Melati No. 25, Cilandak Barat, Jakarta Selatan | Ambalan Penegak</p>
          <h3 style="margin-top: 10px; font-size: 14px; text-decoration: underline;">BUKU CATATAN POIN KEDISIPLINAN & PRESTASI ANGGOTA</h3>
        </div>

        <table class="info-table">
          <tr>
            <td width="15%"><strong>Nama Anggota</strong></td>
            <td width="35%">: ${siswa.nama_lengkap}</td>
            <td width="15%"><strong>Kelas</strong></td>
            <td width="35%">: ${siswa.kelas}</td>
          </tr>
          <tr>
            <td><strong>NIS</strong></td>
            <td>: ${siswa.nis}</td>
            <td><strong>Tahun Ajaran</strong></td>
            <td>: ${siswa.tahun_ajaran || 'TA. 2024-2025'}</td>
          </tr>
          <tr>
            <td><strong>Status Pelantikan</strong></td>
            <td>: ${siswa.status_pelantikan || 'Calon Penegak'}</td>
            <td><strong>Status Poin</strong></td>
            <td>: <strong>${statusTier.label} (${stats.netScore} Poin)</strong></td>
          </tr>
        </table>

        <table class="data-table">
          <thead>
            <tr>
              <th width="5%">No</th>
              <th width="15%">Tanggal</th>
              <th width="15%">Jenis Catatan</th>
              <th>Keterangan Pelanggaran / Prestasi</th>
              <th width="12%">Poin</th>
            </tr>
          </thead>
          <tbody>
            ${studentLogs.length === 0 ? '<tr><td colspan="5" style="text-align: center; padding: 15px; color: #94a3b8;">Belum ada catatan pelanggaran maupun prestasi. Siswa berstatus Bersih (100 Poin).</td></tr>' : 
              studentLogs.map((item, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td>${item.tanggal}</td>
                  <td>${item.tipe === 'Prestasi' ? 'Apresiasi / Prestasi' : 'Pelanggaran / Teguran'}</td>
                  <td>${item.keterangan}</td>
                  <td style="text-align: center;" class="${item.tipe === 'Prestasi' ? 'badge-plus' : 'badge-minus'}">
                    ${item.tipe === 'Prestasi' ? '+' : '-'}${Math.abs(item.poin)}
                  </td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>

        <div class="footer">
          <div>
            <p>Mengetahui,</p>
            <p>Wali Kelas</p>
            <br><br><br>
            <p>( ................................................. )</p>
          </div>
          <div style="text-align: right;">
            <p>Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>Pembina Pramuka SMK Bakti Idhata</p>
            <br><br><br>
            <p><strong>Kak Jihan Fadhilah, S. Kom</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 max-w-3xl w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-8">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                {stats.netScore >= 80 ? (
                  <ShieldCheck className="w-7 h-7 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-7 h-7 text-amber-400" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-black tracking-tight">{siswa.nama_lengkap}</h2>
                  <span className="px-2.5 py-0.5 bg-white/15 border border-white/20 rounded-full text-[11px] font-bold">
                    NIS: {siswa.nis}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-indigo-200 mt-1">
                  <span>Kelas: {siswa.kelas}</span>
                  <span>&bull;</span>
                  <span>{siswa.tahun_ajaran || 'TA. 2024-2025'}</span>
                  <span>&bull;</span>
                  <span className="text-amber-300 font-semibold">{siswa.status_pelantikan || 'Calon Penegak'}</span>
                </div>
              </div>
            </div>

            {/* Total Points Badge */}
            <div className="flex items-center sm:flex-col sm:items-end justify-between bg-white/10 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-white/10 sm:border-0">
              <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Skor Poin Kedisiplinan</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-3xl font-black text-white">{stats.netScore}</span>
                <span className="text-xs text-indigo-300 font-bold">/ 100 Standar</span>
              </div>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full mt-1 border ${statusTier.bg}`}>
                {statusTier.label}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 px-6 py-3 shrink-0 text-center text-xs">
          <div className="border-r border-gray-200">
            <span className="text-gray-400 text-[10px] font-extrabold uppercase">Total Prestasi (+)</span>
            <p className="font-black text-emerald-600 text-sm mt-0.5">
              +{stats.totalPrestasi} Poin <span className="text-gray-400 font-normal text-xs">({stats.countPrestasi} catatan)</span>
            </p>
          </div>
          <div className="border-r border-gray-200">
            <span className="text-gray-400 text-[10px] font-extrabold uppercase">Total Pelanggaran (-)</span>
            <p className="font-black text-rose-600 text-sm mt-0.5">
              -{stats.totalPelanggaran} Poin <span className="text-gray-400 font-normal text-xs">({stats.countPelanggaran} catatan)</span>
            </p>
          </div>
          <div>
            <span className="text-gray-400 text-[10px] font-extrabold uppercase">Total Riwayat Perubahan</span>
            <p className="font-black text-gray-800 text-sm mt-0.5">
              {stats.totalEntries} Transaksi
            </p>
          </div>
        </div>

        {/* Quick Actions & Search Strip */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeFilter === 'all' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Semua ({studentLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('prestasi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                activeFilter === 'prestasi' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-emerald-600'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Prestasi ({stats.countPrestasi})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('pelanggaran')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                activeFilter === 'pelanggaran' ? 'bg-rose-600 text-white shadow-xs' : 'text-gray-500 hover:text-rose-600'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Pelanggaran ({stats.countPelanggaran})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari keterangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36 sm:w-44"
              />
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition cursor-pointer"
              title="Cetak Rekap Riwayat Kedisiplinan Siswa"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Toggle Add Form Button */}
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center space-x-1.5 shadow-xs ${
                showAddForm
                  ? 'bg-gray-800 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Plus className={`w-3.5 h-3.5 transition-transform ${showAddForm ? 'rotate-45' : ''}`} />
              <span>{showAddForm ? 'Tutup Form' : 'Catat Poin Baru'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Quick Preset Badges */}
          <div className="bg-gradient-to-r from-amber-50/70 to-indigo-50/70 border border-indigo-100/80 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-indigo-950 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Pilihan Cepat Catatan Poin:</span>
              </span>
              <span className="text-[10px] text-gray-400">Klik untuk langsung mengisi form</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset({ tipe: 'Pelanggaran', keterangan: 'Terlambat mengikuti apel pembukaan latihan', poin: 5 })}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center space-x-1"
              >
                <span>Terlambat Apel (-5)</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset({ tipe: 'Pelanggaran', keterangan: 'Seragam / atribut pramuka tidak lengkap (tanpa kacu/baret/tanda jejak)', poin: 5 })}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center space-x-1"
              >
                <span>Atribut Tidak Lengkap (-5)</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset({ tipe: 'Pelanggaran', keterangan: 'Tidak hadir latihan tanpa surat keterangan (Alpa)', poin: 10 })}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center space-x-1"
              >
                <span>Alpa / Bolos (-10)</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset({ tipe: 'Prestasi', keterangan: 'Petugas Upacara / Pengibar Bendera Latihan Ambalan', poin: 10 })}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center space-x-1"
              >
                <span>Petugas Upacara (+10)</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset({ tipe: 'Prestasi', keterangan: 'Juara Lomba Keterampilan Pramuka Tingkat Kwarran / Kwarcab', poin: 25 })}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center space-x-1"
              >
                <span>Juara Lomba (+25)</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset({ tipe: 'Prestasi', keterangan: 'Inisiatif piket kebersihan sanggar & pembantu pembina', poin: 5 })}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center space-x-1"
              >
                <span>Piket Sanggar (+5)</span>
              </button>
            </div>
          </div>

          {/* Quick Add Form Section */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-white border-2 border-indigo-200 rounded-2xl p-4.5 space-y-3.5 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center space-x-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>Input Catatan Poin Kedisiplinan Baru</span>
                </h4>
                <span className="text-[10px] text-gray-400">Tersimpan ke database otomatis</span>
              </div>

              {formSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Tipe Catatan</label>
                  <select
                    value={formData.tipe}
                    onChange={(e) => setFormData({ ...formData, tipe: e.target.value as 'Prestasi' | 'Pelanggaran' })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Pelanggaran">Pelanggaran (Pengurangan Poin)</option>
                    <option value="Prestasi">Prestasi / Apresiasi (Penambahan Poin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Bobot Poin</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.poin}
                    onChange={(e) => setFormData({ ...formData, poin: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Keterangan / Alasan Lengkap</label>
                <input
                  type="text"
                  placeholder="Contoh: Terlambat apel 20 menit tanpa izin, atau Juara 1 Pionering..."
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Catatan Poin</span>
                </button>
              </div>
            </form>
          )}

          {/* Delete Confirmation Card */}
          {deleteConfirmId && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center space-x-2 text-xs text-rose-900">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Yakin ingin menghapus catatan riwayat poin ini? Data akan dihapus permanen.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteLog(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          )}

          {/* List of History Items */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-extrabold text-gray-400 uppercase tracking-wider px-1">
              <span>Kronologi Catatan ({filteredLogs.length})</span>
              <span>Skor Relatif</span>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-bold text-gray-700">Belum Ada Riwayat Catatan</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? 'Tidak ditemukan riwayat yang sesuai dengan kata kunci pencarian.'
                    : 'Anggota ini memiliki catatan kedisiplinan yang bersih dengan standar poin 100.'}
                </p>
                {!showAddForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="mt-3 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    + Tambah Catatan Pertama
                  </button>
                )}
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isPrestasi = log.tipe === 'Prestasi';
                return (
                  <div
                    key={log.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isPrestasi
                        ? 'bg-emerald-50/40 border-emerald-100 hover:border-emerald-200'
                        : 'bg-rose-50/40 border-rose-100 hover:border-rose-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isPrestasi ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {isPrestasi ? <Award className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              isPrestasi ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {log.tipe}
                          </span>
                          <span className="text-[11px] text-gray-400 font-semibold flex items-center space-x-1">
                            <Calendar className="w-3 h-3 inline mr-0.5" />
                            {log.tanggal}
                          </span>
                        </div>
                        <p className="text-xs font-extrabold text-gray-800 mt-1 break-words">
                          {log.keterangan}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span
                        className={`px-3 py-1.5 rounded-xl text-xs font-black font-mono ${
                          isPrestasi
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {isPrestasi ? `+${Math.abs(log.poin)}` : `-${Math.abs(log.poin)}`} Poin
                      </span>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(log.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-100/50 rounded-lg transition cursor-pointer"
                        title="Hapus Catatan Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-500 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Terhubung & Tersinkronisasi Otomatis ke Database</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
          >
            Tutup Riwayat
          </button>
        </div>
      </div>
    </div>
  );
};
