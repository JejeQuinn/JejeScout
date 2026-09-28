import React, { useState } from 'react';
import { BarangInventaris, PeminjamanLogistik } from '../types';
import { 
  Package, 
  Search, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Trash2, 
  Filter, 
  Tent, 
  Boxes, 
  RotateCcw,
  Tag
} from 'lucide-react';

interface InventarisLogistikManagerProps {
  inventaris: BarangInventaris[];
  peminjaman: PeminjamanLogistik[];
  onAddBarang: (barang: Omit<BarangInventaris, 'id'>) => void;
  onUpdateBarang: (barang: BarangInventaris) => void;
  onDeleteBarang: (id: string) => void;
  onAddPeminjaman: (pinjam: Omit<PeminjamanLogistik, 'id'>) => void;
  onKembalikanBarang: (id: string, kondisi: 'Baik' | 'Rusak' | 'Hilang', catatan?: string) => void;
  readOnly?: boolean;
}

export const InventarisLogistikManager: React.FC<InventarisLogistikManagerProps> = ({
  inventaris,
  peminjaman,
  onAddBarang,
  onUpdateBarang,
  onDeleteBarang,
  onAddPeminjaman,
  onKembalikanBarang,
  readOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<'stok' | 'peminjaman'>('stok');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('all');

  // Modal Peminjaman Baru state
  const [isPinjamModalOpen, setIsPinjamModalOpen] = useState(false);
  const [selectedBarangId, setSelectedBarangId] = useState('');
  const [namaPeminjam, setNamaPeminjam] = useState('');
  const [sanggaAtauKelas, setSanggaAtauKelas] = useState('');
  const [jumlahPinjam, setJumlahPinjam] = useState(1);
  const [tanggalPinjam, setTanggalPinjam] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalKembaliTarget, setTanggalKembaliTarget] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [catatanPinjam, setCatatanPinjam] = useState('');

  // Modal Tambah Barang Baru state
  const [isAddBarangModalOpen, setIsAddBarangModalOpen] = useState(false);
  const [kodeBarang, setKodeBarang] = useState('');
  const [namaBarang, setNamaBarang] = useState('');
  const [kategoriBarang, setKategoriBarang] = useState<BarangInventaris['kategori']>('Tenda & Berkemah');
  const [jumlahTotal, setJumlahTotal] = useState(5);
  const [kondisiBaik, setKondisiBaik] = useState(5);
  const [kondisiRusak, setKondisiRusak] = useState(0);
  const [lokasiRak, setLokasiRak] = useState('Gudang Sanggar Rak A-1');
  const [keteranganBarang, setKeteranganBarang] = useState('');

  // Modal Pengembalian Barang state
  const [isKembaliModalOpen, setIsKembaliModalOpen] = useState(false);
  const [selectedLoanToReturn, setSelectedLoanToReturn] = useState<PeminjamanLogistik | null>(null);
  const [kondisiKembali, setKondisiKembali] = useState<'Baik' | 'Rusak' | 'Hilang'>('Baik');
  const [catatanKembali, setCatatanKembali] = useState('');

  const uniqueKategori = Array.from(new Set(inventaris.map(b => b.kategori))).filter(Boolean);

  // Filtered Inventaris
  const filteredBarang = inventaris.filter(b => {
    const matchKat = selectedKategori === 'all' || b.kategori === selectedKategori;
    const matchSearch = b.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) || b.kode_barang.toLowerCase().includes(searchQuery.toLowerCase()) || b.lokasi_rak.toLowerCase().includes(searchQuery.toLowerCase());
    return matchKat && matchSearch;
  });

  // Filtered Peminjaman
  const filteredLoans = peminjaman.filter(p => {
    const barang = inventaris.find(b => b.id === p.barang_id);
    const matchSearch = 
      p.nama_peminjam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sangga_atau_kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (barang && barang.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSearch;
  });

  // Stats calculation
  const totalItemCount = inventaris.reduce((acc, b) => acc + b.jumlah_total, 0);
  const totalAvailableCount = inventaris.reduce((acc, b) => acc + b.jumlah_tersedia, 0);
  const totalBorrowedCount = totalItemCount - totalAvailableCount;
  const totalDamagedCount = inventaris.reduce((acc, b) => acc + b.kondisi_rusak, 0);
  const activeLoans = peminjaman.filter(p => p.status === 'Dipinjam' || p.status === 'Terlambat');

  const handleOpenPinjamModal = (barangId?: string) => {
    if (barangId) {
      setSelectedBarangId(barangId);
    } else if (inventaris.length > 0) {
      setSelectedBarangId(inventaris[0].id);
    }
    setJumlahPinjam(1);
    setIsPinjamModalOpen(true);
  };

  const handleExecutePinjam = (e: React.FormEvent) => {
    e.preventDefault();
    const barang = inventaris.find(b => b.id === selectedBarangId);
    if (!barang) {
      alert('Pilih barang yang valid!');
      return;
    }

    if (jumlahPinjam > barang.jumlah_tersedia) {
      alert(`Stok tersedia hanya ${barang.jumlah_tersedia} unit! Tidak bisa meminjam ${jumlahPinjam} unit.`);
      return;
    }

    onAddPeminjaman({
      barang_id: selectedBarangId,
      nama_peminjam: namaPeminjam.trim(),
      sangga_atau_kelas: sanggaAtauKelas.trim(),
      jumlah_pinjam: jumlahPinjam,
      tanggal_pinjam: tanggalPinjam,
      tanggal_kembali_target: tanggalKembaliTarget,
      status: 'Dipinjam',
      catatan: catatanPinjam.trim() || undefined
    });

    // Update stock availability
    onUpdateBarang({
      ...barang,
      jumlah_tersedia: Math.max(0, barang.jumlah_tersedia - jumlahPinjam)
    });

    setIsPinjamModalOpen(false);
    setNamaPeminjam('');
    setSanggaAtauKelas('');
    setCatatanPinjam('');
  };

  const handleOpenKembaliModal = (loan: PeminjamanLogistik) => {
    setSelectedLoanToReturn(loan);
    setKondisiKembali('Baik');
    setCatatanKembali('');
    setIsKembaliModalOpen(true);
  };

  const handleExecuteKembali = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanToReturn) return;

    onKembalikanBarang(selectedLoanToReturn.id, kondisiKembali, catatanKembali);

    // Update stock availability on returned item
    const barang = inventaris.find(b => b.id === selectedLoanToReturn.barang_id);
    if (barang) {
      const addedAvail = kondisiKembali === 'Hilang' ? 0 : selectedLoanToReturn.jumlah_pinjam;
      const addedDamaged = kondisiKembali === 'Rusak' ? selectedLoanToReturn.jumlah_pinjam : 0;
      onUpdateBarang({
        ...barang,
        jumlah_tersedia: Math.min(barang.jumlah_total, barang.jumlah_tersedia + addedAvail),
        kondisi_rusak: barang.kondisi_rusak + addedDamaged
      });
    }

    setIsKembaliModalOpen(false);
    setSelectedLoanToReturn(null);
  };

  const handleCreateBarang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang.trim()) {
      alert('Nama barang wajib diisi!');
      return;
    }

    const autoKode = kodeBarang.trim() || `LOG-${Date.now().toString().slice(-4)}`;
    onAddBarang({
      kode_barang: autoKode.toUpperCase(),
      nama_barang: namaBarang.trim(),
      kategori: kategoriBarang,
      jumlah_total: jumlahTotal,
      jumlah_tersedia: Math.max(0, jumlahTotal - kondisiRusak),
      kondisi_baik: kondisiBaik,
      kondisi_rusak: kondisiRusak,
      lokasi_rak: lokasiRak.trim() || 'Gudang Sanggar',
      keterangan: keteranganBarang.trim() || undefined
    });

    setIsAddBarangModalOpen(false);
    setNamaBarang('');
    setKodeBarang('');
    setKeteranganBarang('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Stats Bar */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center border border-emerald-200 shrink-0">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Logistik Ambalan
                </span>
                <span className="text-xs text-gray-400 font-bold">• Sanggar & Sarpras</span>
              </div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight mt-0.5">
                Inventaris & Peminjaman Logistik Pramuka
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Manajemen stok tenda, pasak, tongkat, alat komunikasi sandi, dan monitoring peminjaman sangga.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {!readOnly ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsAddBarangModalOpen(true)}
                  className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-gray-500" />
                  <span>Tambah Barang Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPinjamModal()}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Formulir Peminjaman</span>
                </button>
              </>
            ) : (
              <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl">
                Mode Pengawas: Hanya Lihat
              </span>
            )}
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-gray-100">
          <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
            <span className="text-[11px] font-bold text-gray-500 block">Total Unit Sarpras</span>
            <span className="text-xl font-black text-gray-800 mt-0.5 block">{totalItemCount} Unit</span>
          </div>
          <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-700 block">Tersedia di Sanggar</span>
            <span className="text-xl font-black text-emerald-900 mt-0.5 block">{totalAvailableCount} Unit</span>
          </div>
          <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-100">
            <span className="text-[11px] font-bold text-amber-700 block">Sedang Dipinjam</span>
            <span className="text-xl font-black text-amber-900 mt-0.5 block">{totalBorrowedCount} Unit ({activeLoans.length} Transaksi)</span>
          </div>
          <div className="bg-rose-50/60 rounded-xl p-3 border border-rose-100">
            <span className="text-[11px] font-bold text-rose-700 block">Kondisi Rusak / Servis</span>
            <span className="text-xl font-black text-rose-900 mt-0.5 block">{totalDamagedCount} Unit</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('stok')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'stok'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Katalog Stok Barang ({inventaris.length} Item)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('peminjaman')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'peminjaman'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Riwayat Peminjaman & Pengembalian ({peminjaman.length})
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'stok' ? "Cari kode, nama barang, rak..." : "Cari peminjam, sangga, barang..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {activeTab === 'stok' && (
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500 font-bold whitespace-nowrap">Kategori:</span>
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              {uniqueKategori.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 1. STOK BARANG TAB */}
      {activeTab === 'stok' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama Barang</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-center">Tersedia</th>
                  <th className="px-4 py-3 text-center">Total</th>
                  <th className="px-4 py-3 text-center">Kondisi Baik / Rusak</th>
                  <th className="px-4 py-3">Lokasi Penyimpanan</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBarang.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400 font-bold">
                      Tidak ada data barang yang sesuai filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredBarang.map((b) => (
                    <tr key={b.id} className="hover:bg-emerald-50/20 transition">
                      <td className="px-4 py-3 font-mono font-bold text-gray-600">{b.kode_barang}</td>
                      <td className="px-4 py-3">
                        <span className="font-extrabold text-gray-900 block">{b.nama_barang}</span>
                        {b.keterangan && (
                          <span className="text-[10px] text-gray-400 block mt-0.5 truncate max-w-xs">{b.keterangan}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md">
                          {b.kategori}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-black text-sm ${b.jumlah_tersedia > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {b.jumlah_tersedia}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-600">
                        {b.jumlah_total}
                      </td>
                      <td className="px-4 py-3 text-center text-[11px]">
                        <span className="text-emerald-700 font-bold">{b.kondisi_baik} Baik</span>
                        {b.kondisi_rusak > 0 && (
                          <span className="text-rose-600 font-bold ml-1.5">• {b.kondisi_rusak} Rusak</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-medium">
                        {b.lokasi_rak}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenPinjamModal(b.id)}
                          disabled={b.jumlah_tersedia === 0}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-bold text-[11px] transition inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          <span>Pinjam</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus barang ${b.nama_barang} dari inventaris?`)) {
                              onDeleteBarang(b.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Barang"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. RIWAYAT PEMINJAMAN TAB */}
      {activeTab === 'peminjaman' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Peminjam</th>
                  <th className="px-4 py-3">Sangga / Kelas</th>
                  <th className="px-4 py-3">Barang & Jumlah</th>
                  <th className="px-4 py-3">Tgl Pinjam</th>
                  <th className="px-4 py-3">Target Kembali</th>
                  <th className="px-4 py-3">Kondisi Akhir</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400 font-bold">
                      Belum ada riwayat peminjaman logistik.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => {
                    const barang = inventaris.find(b => b.id === loan.barang_id);
                    return (
                      <tr key={loan.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          {loan.status === 'Kembali' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                              Kembali
                            </span>
                          )}
                          {loan.status === 'Dipinjam' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-2.5 h-2.5 mr-1" />
                              Dipinjam
                            </span>
                          )}
                          {loan.status === 'Terlambat' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                              Terlambat
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-extrabold text-gray-900">{loan.nama_peminjam}</td>
                        <td className="px-4 py-3 font-semibold text-gray-600">{loan.sangga_atau_kelas}</td>
                        <td className="px-4 py-3">
                          <span className="font-extrabold text-gray-800">{barang?.nama_barang || 'Barang Dihapus'}</span>
                          <span className="block text-[10px] text-gray-500 font-mono">
                            {loan.jumlah_pinjam} Unit
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-600">{loan.tanggal_pinjam}</td>
                        <td className="px-4 py-3 font-mono text-gray-600 font-semibold">{loan.tanggal_kembali_target}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {loan.kondisi_kembali ? (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              loan.kondisi_kembali === 'Baik' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {loan.kondisi_kembali}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {loan.status !== 'Kembali' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenKembaliModal(loan)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] transition inline-flex items-center space-x-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Kembalikan</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-400 font-semibold">Tuntas</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PINJAM BARANG */}
      {isPinjamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <h3 className="font-black text-sm text-gray-800">Formulir Peminjaman Logistik Ambalan</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPinjamModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecutePinjam} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-black text-gray-700 mb-1">Pilih Barang yang Dipinjam</label>
                <select
                  value={selectedBarangId}
                  onChange={(e) => setSelectedBarangId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">-- Pilih Barang --</option>
                  {inventaris.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.nama_barang} (Tersedia: {b.jumlah_tersedia} Unit)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-gray-700 mb-1">Nama Peminjam</label>
                  <input
                    type="text"
                    placeholder="misal: Jihan Pratama"
                    value={namaPeminjam}
                    onChange={(e) => setNamaPeminjam(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-black text-gray-700 mb-1">Sangga / Kelas</label>
                  <input
                    type="text"
                    placeholder="misal: Sangga Perintis / XI TKJ 1"
                    value={sanggaAtauKelas}
                    onChange={(e) => setSanggaAtauKelas(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-black text-gray-700 mb-1">Jumlah</label>
                  <input
                    type="number"
                    min={1}
                    value={jumlahPinjam}
                    onChange={(e) => setJumlahPinjam(parseInt(e.target.value) || 1)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-black text-gray-700 mb-1">Tgl Pinjam</label>
                  <input
                    type="date"
                    value={tanggalPinjam}
                    onChange={(e) => setTanggalPinjam(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 font-bold text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-black text-gray-700 mb-1">Target Kembali</label>
                  <input
                    type="date"
                    value={tanggalKembaliTarget}
                    onChange={(e) => setTanggalKembaliTarget(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 font-bold text-gray-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Keperluan / Catatan Peminjaman</label>
                <textarea
                  rows={2}
                  placeholder="misal: Untuk latihan lomba pionering atau perkemahan sabtu-minggu..."
                  value={catatanPinjam}
                  onChange={(e) => setCatatanPinjam(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPinjamModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center space-x-1.5"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Proses Peminjaman</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PENGEMBALIAN BARANG */}
      {isKembaliModalOpen && selectedLoanToReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-indigo-600" />
                <h3 className="font-black text-sm text-gray-800">Konfirmasi Pengembalian Logistik</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsKembaliModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteKembali} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                <p className="font-black text-gray-800">
                  {inventaris.find(b => b.id === selectedLoanToReturn.barang_id)?.nama_barang}
                </p>
                <p className="text-gray-500">
                  Dipinjam oleh: <strong>{selectedLoanToReturn.nama_peminjam}</strong> ({selectedLoanToReturn.sangga_atau_kelas})
                </p>
                <p className="text-gray-500">
                  Jumlah: <strong>{selectedLoanToReturn.jumlah_pinjam} Unit</strong>
                </p>
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Kondisi Barang Saat Kembali</label>
                <select
                  value={kondisiKembali}
                  onChange={(e) => setKondisiKembali(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Baik">Kondisi Lengkap & Baik (Bisa langsung dipinjam lagi)</option>
                  <option value="Rusak">Kondisi Rusak / Perlu Perbaikan (Pindah ke stok rusak)</option>
                  <option value="Hilang">Barang Hilang / Rusak Total</option>
                </select>
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Catatan Pengembalian (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Catatan kebersihan atau kondisi fisik saat diterima Dewan Ambalan..."
                  value={catatanKembali}
                  onChange={(e) => setCatatanKembali(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsKembaliModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Konfirmasi Pengembalian</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH BARANG BARU */}
      {isAddBarangModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-emerald-600" />
                <h3 className="font-black text-sm text-gray-800">Tambah Barang ke Inventaris Ambalan</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBarangModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBarang} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-black text-gray-700 mb-1">Nama Barang / Peralatan</label>
                <input
                  type="text"
                  placeholder="misal: Tenda Dome 4 Orang / Pasak Besi 30cm"
                  value={namaBarang}
                  onChange={(e) => setNamaBarang(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-gray-700 mb-1">Kode Barang (Opsional)</label>
                  <input
                    type="text"
                    placeholder="misal: TND-01"
                    value={kodeBarang}
                    onChange={(e) => setKodeBarang(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block font-black text-gray-700 mb-1">Kategori</label>
                  <select
                    value={kategoriBarang}
                    onChange={(e) => setKategoriBarang(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Tenda & Berkemah">Tenda & Berkemah</option>
                    <option value="Pionering & Tali">Pionering & Tali</option>
                    <option value="Komunikasi & Sandi">Komunikasi & Sandi</option>
                    <option value="Dapur & Masak">Dapur & Masak</option>
                    <option value="P3K & Medis">P3K & Medis</option>
                    <option value="Perlengkapan Upacara">Perlengkapan Upacara</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-black text-gray-700 mb-1">Total Unit</label>
                  <input
                    type="number"
                    min={1}
                    value={jumlahTotal}
                    onChange={(e) => {
                      const total = parseInt(e.target.value) || 1;
                      setJumlahTotal(total);
                      setKondisiBaik(total);
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-black text-gray-700 mb-1">Kondisi Baik</label>
                  <input
                    type="number"
                    min={0}
                    value={kondisiBaik}
                    onChange={(e) => setKondisiBaik(parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800"
                  />
                </div>
                <div>
                  <label className="block font-black text-gray-700 mb-1">Kondisi Rusak</label>
                  <input
                    type="number"
                    min={0}
                    value={kondisiRusak}
                    onChange={(e) => setKondisiRusak(parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Lokasi Rak / Lemari Penyimpanan</label>
                <input
                  type="text"
                  placeholder="misal: Gudang Sanggar Rak A-1"
                  value={lokasiRak}
                  onChange={(e) => setLokasiRak(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Keterangan / Spesifikasi</label>
                <textarea
                  rows={2}
                  placeholder="Spesifikasi bahan, kelengkapan pasak, frame, dll..."
                  value={keteranganBarang}
                  onChange={(e) => setKeteranganBarang(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddBarangModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center space-x-1.5"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Simpan ke Inventaris</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
