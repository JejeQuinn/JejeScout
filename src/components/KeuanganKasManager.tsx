import React, { useState } from 'react';
import { KasAmbalan } from '../types';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  Trash2, 
  Receipt, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  X,
  CreditCard
} from 'lucide-react';

interface KeuanganKasManagerProps {
  kas: KasAmbalan[];
  onAddKas: (transaksi: Omit<KasAmbalan, 'id'>) => void;
  onDeleteKas: (id: string) => void;
  readOnly?: boolean;
}

export const KeuanganKasManager: React.FC<KeuanganKasManagerProps> = ({
  kas,
  onAddKas,
  onDeleteKas,
  readOnly = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTipe, setSelectedTipe] = useState<'all' | 'Pemasukan' | 'Pengeluaran'>('all');
  const [selectedKategori, setSelectedKategori] = useState<string>('all');

  // Modal Tambah Transaksi state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipe, setTipe] = useState<'Pemasukan' | 'Pengeluaran'>('Pemasukan');
  const [kategori, setKategori] = useState<string>('Iuran Mingguan');
  const [jumlah, setJumlah] = useState<number>(50000);
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [deskripsi, setDeskripsi] = useState<string>('');
  const [pjBendahara, setPjBendahara] = useState<string>('Bankir Ambalan');
  const [nomorBukti, setNomorBukti] = useState<string>('');

  // Format IDR Currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Calculations
  const totalPemasukan = kas
    .filter(k => k.tipe === 'Pemasukan')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

  const totalPengeluaran = kas
    .filter(k => k.tipe === 'Pengeluaran')
    .reduce((acc, curr) => acc + curr.jumlah, 0);

  const saldoKas = totalPemasukan - totalPengeluaran;

  const uniqueKategori = Array.from(new Set(kas.map(k => k.kategori))).filter(Boolean);

  // Filtered transactions
  const filteredKas = kas.filter(k => {
    const matchTipe = selectedTipe === 'all' || k.tipe === selectedTipe;
    const matchKat = selectedKategori === 'all' || k.kategori === selectedKategori;
    const matchSearch = 
      k.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.nomor_bukti && k.nomor_bukti.toLowerCase().includes(searchQuery.toLowerCase())) ||
      k.pj_bendahara.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTipe && matchKat && matchSearch;
  });

  const handleOpenAddModal = (presetTipe?: 'Pemasukan' | 'Pengeluaran') => {
    if (presetTipe) {
      setTipe(presetTipe);
      setKategori(presetTipe === 'Pemasukan' ? 'Iuran Mingguan' : 'Konsumsi & Logistik');
    }
    setNomorBukti(`KAS-${Date.now().toString().slice(-4)}`);
    setIsModalOpen(true);
  };

  const handleExecuteAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deskripsi.trim()) {
      alert('Keterangan transaksi wajib diisi!');
      return;
    }
    if (jumlah <= 0) {
      alert('Jumlah nominal harus lebih dari Rp 0!');
      return;
    }

    onAddKas({
      tanggal,
      tipe,
      kategori,
      jumlah,
      deskripsi: deskripsi.trim(),
      pj_bendahara: pjBendahara.trim() || 'Bankir Ambalan',
      nomor_bukti: nomorBukti.trim() || undefined
    });

    setIsModalOpen(false);
    setDeskripsi('');
    setJumlah(50000);
  };

  // Export Kas to CSV
  const handleExportCSV = () => {
    const headers = ['Nomor Bukti', 'Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Nominal (Rp)', 'PJ Bendahara'];
    const rows = filteredKas.map(k => [
      k.nomor_bukti || '-',
      k.tanggal,
      k.tipe,
      k.kategori,
      `"${k.deskripsi.replace(/"/g, '""')}"`,
      k.jumlah,
      k.pj_bendahara
    ]);

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Kas_Ambalan_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center border border-emerald-200 shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Keuangan Ambalan
                </span>
                <span className="text-xs text-gray-400 font-bold">• Transparansi Kas & Iuran</span>
              </div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight mt-0.5">
                Buku Kas & Keuangan Pramuka
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Pencatatan iuran anggota, dana bantuan sekolah, dan pembelanjaan logistik secara akuntabel.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Ekspor CSV</span>
            </button>

            {!readOnly ? (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenAddModal('Pemasukan')}
                  className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>+ Pemasukan</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddModal('Pengeluaran')}
                  className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+ Pengeluaran</span>
                </button>
              </>
            ) : (
              <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl">
                Mode Pengawas: Hanya Lihat
              </span>
            )}
          </div>
        </div>

        {/* 3 Large Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100">
          <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">Total Pemasukan</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-2xl font-black text-emerald-950 mt-2 block">
              {formatIDR(totalPemasukan)}
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
              Iuran mingguan, subsidi & donasi
            </span>
          </div>

          <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-800 uppercase tracking-wider">Total Pengeluaran</span>
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
            </div>
            <span className="text-2xl font-black text-rose-950 mt-2 block">
              {formatIDR(totalPengeluaran)}
            </span>
            <span className="text-[11px] text-rose-700 font-semibold mt-0.5 block">
              Logistik, konsumsi & kegiatan
            </span>
          </div>

          <div className="bg-indigo-50/70 rounded-2xl p-4 border border-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-800 uppercase tracking-wider">Saldo Kas Ambalan</span>
              <Wallet className="w-4 h-4 text-indigo-600" />
            </div>
            <span className={`text-2xl font-black mt-2 block ${saldoKas >= 0 ? 'text-indigo-950' : 'text-rose-600'}`}>
              {formatIDR(saldoKas)}
            </span>
            <span className="text-[11px] text-indigo-700 font-semibold mt-0.5 block">
              Dana kas riil tersisa saat ini
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari keterangan, bukti kwitansi, PJ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedTipe}
            onChange={(e) => setSelectedTipe(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">Semua Tipe Kas</option>
            <option value="Pemasukan">Hanya Pemasukan</option>
            <option value="Pengeluaran">Hanya Pengeluaran</option>
          </select>

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
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Tgl & Bukti</th>
                <th className="px-4 py-3">Keterangan Transaksi</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">PJ Bankir</th>
                <th className="px-4 py-3 text-right">Nominal</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredKas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400 font-bold">
                    Tidak ada catatan transaksi kas yang cocok.
                  </td>
                </tr>
              ) : (
                filteredKas.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-4 py-3">
                      <span className="font-mono text-gray-700 font-bold block">{item.tanggal}</span>
                      {item.nomor_bukti && (
                        <span className="text-[10px] text-gray-400 font-mono block">{item.nomor_bukti}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          item.tipe === 'Pemasukan' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {item.tipe === 'Pemasukan' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        </span>
                        <span className="font-extrabold text-gray-900">{item.deskripsi}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-semibold">
                      {item.pj_bendahara}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-black text-sm ${
                        item.tipe === 'Pemasukan' ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {item.tipe === 'Pemasukan' ? '+ ' : '- '}
                        {formatIDR(item.jumlah)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!readOnly ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus catatan transaksi ${item.deskripsi}?`)) {
                              onDeleteKas(item.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH TRANSAKSI KAS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  tipe === 'Pemasukan' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {tipe === 'Pemasukan' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <h3 className="font-black text-sm text-gray-800">
                  {tipe === 'Pemasukan' ? 'Catat Pemasukan Kas' : 'Catat Pengeluaran Kas'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteAdd} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-gray-700 mb-1">Jenis Kas</label>
                  <select
                    value={tipe}
                    onChange={(e) => {
                      const newT = e.target.value as any;
                      setTipe(newT);
                      setKategori(newT === 'Pemasukan' ? 'Iuran Mingguan' : 'Konsumsi & Logistik');
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Pemasukan">Pemasukan (+)</option>
                    <option value="Pengeluaran">Pengeluaran (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-black text-gray-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="misal: Iuran, Bantuan Sekolah, Logistik"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Nominal (Rupiah)</label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  value={jumlah}
                  onChange={(e) => setJumlah(parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-mono font-black text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Keterangan Transaksi</label>
                <input
                  type="text"
                  placeholder="misal: Pembelian baterai toa dan pasak tenda dome..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 font-bold text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-black text-gray-700 mb-1">Nomor Bukti / Kwitansi</label>
                  <input
                    type="text"
                    value={nomorBukti}
                    onChange={(e) => setNomorBukti(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 font-mono text-gray-800"
                    placeholder="misal: KAS-001"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">PJ Bendahara / Bankir Ambalan</label>
                <input
                  type="text"
                  value={pjBendahara}
                  onChange={(e) => setPjBendahara(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800"
                  required
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-xl font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center space-x-1.5 ${
                    tipe === 'Pemasukan' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simpan Transaksi Kas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
