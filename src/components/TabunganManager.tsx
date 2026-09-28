import React, { useState } from 'react';
import { Tabungan, Siswa } from '../types';
import { Landmark, Plus, Trash2, Calendar, PiggyBank, CircleDollarSign } from 'lucide-react';

interface TabunganProps {
  tabungan: Tabungan[];
  siswa: Siswa[];
  onAdd: (data: Omit<Tabungan, 'id'>) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export const TabunganManager: React.FC<TabunganProps> = ({
  tabungan,
  siswa,
  onAdd,
  onDelete,
  readOnly = false,
}) => {
  const [selectedSiswaId, setSelectedSiswaId] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jumlah, setJumlah] = useState('');
  const [jenis, setJenis] = useState<'Wajib' | 'Sukarela'>('Wajib');
  const [keterangan, setKeterangan] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');

  const uniqueClasses = Array.from(new Set(siswa.map((s) => s.kelas))).filter(Boolean).sort();

  const filteredTabungan = tabungan.filter((t) => {
    if (selectedKelas === 'all') return true;
    const student = siswa.find((s) => s.id === t.siswa_id);
    return student?.kelas === selectedKelas;
  });

  const activeSiswa = siswa.filter((s) => {
    const isAct = s.status_aktif;
    if (selectedKelas === 'all') return isAct;
    return isAct && s.kelas === selectedKelas;
  });

  const totalWajib = filteredTabungan.filter((t) => t.jenis === 'Wajib').reduce((acc, t) => acc + t.jumlah, 0);
  const totalSukarela = filteredTabungan.filter((t) => t.jenis === 'Sukarela').reduce((acc, t) => acc + t.jumlah, 0);
  const totalKas = totalWajib + totalSukarela;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedSiswaId || !tanggal || !jumlah) {
      setErrorMsg('Harap isi murid, tanggal, dan jumlah tabungan!');
      return;
    }

    const val = Number(jumlah);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Jumlah nominal harus berupa angka positif!');
      return;
    }

    onAdd({
      siswa_id: selectedSiswaId,
      tanggal,
      jumlah: val,
      jenis,
      keterangan: keterangan.trim() || `${jenis} Kas`,
    });

    // Reset inputs
    setJumlah('');
    setKeterangan('');
  };

  return (
    <div className="space-y-6" id="savings_manager_module">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Tabungan & Kas Pramuka</h2>
        <p className="text-sm text-gray-400 mt-1">Kelola pencatatan keuangan internal anggota ambalan (iuran wajib, kas, atau tabungan sukarela perlengkapan).</p>
      </div>

      {/* Class filter selector pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin bg-white p-3 rounded-2xl border border-gray-100">
        <span className="text-xs font-bold text-gray-400 uppercase shrink-0 mr-1">Pilih Kelas:</span>
        <button
          onClick={() => setSelectedKelas('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            selectedKelas === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          Semua Kelas
        </button>
        {uniqueClasses.map((kls) => (
          <button
            key={kls}
            onClick={() => setSelectedKelas(kls)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedKelas === kls
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            Kelas {kls}
          </button>
        ))}
      </div>

      {/* Financial stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 flex items-center">
          <div className="p-3 bg-emerald-500 text-white rounded-xl mr-4">
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-emerald-600">Total Iuran Wajib</p>
            <h4 className="text-xl font-black text-emerald-950">Rp {totalWajib.toLocaleString('id-ID')}</h4>
          </div>
        </div>

        <div className="bg-sky-50/50 p-5 rounded-2xl border border-sky-100 flex items-center">
          <div className="p-3 bg-sky-500 text-white rounded-xl mr-4">
            <CircleDollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-sky-600">Total Tabungan Sukarela</p>
            <h4 className="text-xl font-black text-sky-950">Rp {totalSukarela.toLocaleString('id-ID')}</h4>
          </div>
        </div>

        <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 flex items-center">
          <div className="p-3 bg-indigo-500 text-white rounded-xl mr-4">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-indigo-600">Total Kas Ambalan</p>
            <h4 className="text-xl font-black text-indigo-950">Rp {totalKas.toLocaleString('id-ID')}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form panel */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 h-fit">
          <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center">
            <Plus className="w-4 h-4 mr-1 text-indigo-600" />
            Catat Transaksi Kas Baru
          </h3>

          {errorMsg && (
            <div className="bg-rose-50 text-rose-700 border border-rose-200 p-3 rounded-xl mb-4 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nama Anggota Murid</label>
              <select
                value={selectedSiswaId}
                onChange={(e) => setSelectedSiswaId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="">-- Pilih Anggota --</option>
                {activeSiswa.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama_lengkap} ({s.kelas})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tanggal Bayar</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Jenis Simpanan</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setJenis('Wajib')}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    jenis === 'Wajib'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Kas Wajib
                </button>
                <button
                  type="button"
                  onClick={() => setJenis('Sukarela')}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    jenis === 'Sukarela'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Tabungan Sukarela
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nominal Setoran (Rupiah)</label>
              <input
                type="number"
                placeholder="Contoh: 10000"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Keterangan Catatan (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Iuran Mingguan Juni ke-2"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none"
              />
            </div>

            {!readOnly ? (
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition cursor-pointer"
              >
                Simpan Transaksi Kas
              </button>
            ) : (
              <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-center text-xs font-bold">
                Mode Pengawas: Hanya Lihat
              </div>
            )}
          </form>
        </div>

        {/* List ledger table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
          <h3 className="text-sm font-black text-gray-800 flex items-center">
            <Calendar className="w-4 h-4 mr-1 text-gray-500" />
            Riwayat Pembukuan Kas Ambalan
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Nama Anggota</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3 text-center">Jenis</th>
                  <th className="p-3 text-right">Nominal</th>
                  <th className="p-3">Keterangan</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
                {filteredTabungan.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-400">
                      Belum ada transaksi setoran kas tercatat untuk kelas yang dipilih.
                    </td>
                  </tr>
                ) : (
                  [...filteredTabungan].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).map((t) => {
                    const student = siswa.find((s) => s.id === t.siswa_id);
                    return (
                      <tr key={t.id} className="hover:bg-gray-50/30 transition">
                        <td className="p-3 font-semibold text-gray-400">{new Date(t.tanggal).toLocaleDateString('id-ID')}</td>
                        <td className="p-3 font-extrabold text-gray-800">{student?.nama_lengkap || 'Anggota Terhapus'}</td>
                        <td className="p-3 font-medium text-gray-400">{student?.kelas || '-'}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            t.jenis === 'Wajib' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
                          }`}>
                            {t.jenis === 'Wajib' ? 'Wajib' : 'Sukarela'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-gray-700">Rp {t.jumlah.toLocaleString('id-ID')}</td>
                        <td className="p-3 text-gray-500 font-medium truncate max-w-[120px]" title={t.keterangan}>{t.keterangan}</td>
                        <td className="p-3 text-center">
                          {!readOnly ? (
                            <button
                              onClick={() => {
                                if (confirm('Hapus transaksi tabungan ini dari pembukuan?')) {
                                  onDelete(t.id);
                                }
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-300 font-bold">-</span>
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
      </div>
    </div>
  );
};
