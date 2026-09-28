import React, { useState } from 'react';
import { Kedisiplinan, Siswa } from '../types';
import { ShieldAlert, Plus, Trash2, Calendar, Award, Star, AlertTriangle, CheckCircle2, Zap, X, ClipboardList, Check } from 'lucide-react';

interface KedisiplinanProps {
  kedisiplinan: Kedisiplinan[];
  siswa: Siswa[];
  onAdd: (data: Omit<Kedisiplinan, 'id'>) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export const KedisiplinanManager: React.FC<KedisiplinanProps> = ({
  kedisiplinan,
  siswa,
  onAdd,
  onDelete,
  readOnly = false,
}) => {
  const [selectedSiswaId, setSelectedSiswaId] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [tipe, setTipe] = useState<'Prestasi' | 'Pelanggaran'>('Prestasi');
  const [poin, setPoin] = useState('10');
  const [keterangan, setKeterangan] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');

  // Success Notification Banner State
  const [successNotif, setSuccessNotif] = useState<{
    studentName: string;
    studentKelas: string;
    type: 'Prestasi' | 'Pelanggaran';
    poin: number;
    newTotal: number;
    message: string;
  } | null>(null);

  const uniqueClasses = Array.from(new Set(siswa.map((s) => s.kelas))).filter(Boolean).sort();

  const filteredKedisiplinan = kedisiplinan.filter((k) => {
    if (selectedKelas === 'all') return true;
    const student = siswa.find((s) => s.id === k.siswa_id);
    return student?.kelas === selectedKelas;
  });

  const activeSiswa = siswa.filter((s) => {
    const isAct = s.status_aktif;
    if (selectedKelas === 'all') return isAct;
    return isAct && s.kelas === selectedKelas;
  });

  // Calculate student behavioral totals
  const getSiswaNetPoints = (siswaId: string) => {
    const studentLogs = kedisiplinan.filter((k) => k.siswa_id === siswaId);
    let score = 100; // Base points of 100
    studentLogs.forEach((log) => {
      score += log.poin; // points are already positive or negative in model
    });
    return score;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedSiswaId || !tanggal || !poin || !keterangan.trim()) {
      setErrorMsg('Semua kolom wajib diisi!');
      return;
    }

    const val = Number(poin);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Skor poin harus berupa angka positif!');
      return;
    }

    // Apply signed points based on selected type: positive for reward, negative for punishment
    const signedPoin = tipe === 'Prestasi' ? val : -val;

    const targetStudent = siswa.find((s) => s.id === selectedSiswaId);
    const currentPoints = getSiswaNetPoints(selectedSiswaId);
    const newTotalPoints = currentPoints + signedPoin;

    onAdd({
      siswa_id: selectedSiswaId,
      tanggal,
      tipe,
      poin: signedPoin,
      keterangan: keterangan.trim(),
    });

    // Show success notification banner
    setSuccessNotif({
      studentName: targetStudent?.nama_lengkap || 'Murid',
      studentKelas: targetStudent?.kelas || '',
      type: tipe,
      poin: signedPoin,
      newTotal: newTotalPoints,
      message: `Poin kedisiplinan berhasil diperbarui! ${targetStudent?.nama_lengkap} (${targetStudent?.kelas}) mendapatkan pencatatan ${tipe} (${signedPoin > 0 ? '+' : ''}${signedPoin} Poin). Skor akhir otomatis terupdate menjadi ${newTotalPoints} Poin.`
    });

    // Reset fields
    setKeterangan('');
  };

  const handleDelete = (logId: string) => {
    const log = kedisiplinan.find((k) => k.id === logId);
    if (!log) return;

    const student = siswa.find((s) => s.id === log.siswa_id);
    const currentPoints = getSiswaNetPoints(log.siswa_id);
    const newTotalPoints = currentPoints - log.poin;

    onDelete(logId);

    setSuccessNotif({
      studentName: student?.nama_lengkap || 'Murid',
      studentKelas: student?.kelas || '',
      type: log.tipe,
      poin: -log.poin,
      newTotal: newTotalPoints,
      message: `Catatan ${log.tipe.toLowerCase()} untuk ${student?.nama_lengkap || 'murid'} berhasil dihapus. Skor total otomatis disesuaikan kembali menjadi ${newTotalPoints} Poin.`
    });
  };

  return (
    <div className="space-y-6" id="discipline_manager_module">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Catatan Reward & Punishment (Poin Kedisiplinan)</h2>
        <p className="text-sm text-gray-400 mt-1">Gunakan poin apresiasi untuk prestasi dan pengurangan poin sebagai pembinaan kedisiplinan tingkat SMK Bakti Idhata.</p>
      </div>

      {/* Success Notification Alert */}
      {successNotif && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm flex items-start justify-between animate-fade-in">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-extrabold text-emerald-950">
                  Otomatisasi Poin Terupdate
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  successNotif.type === 'Prestasi' ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                }`}>
                  {successNotif.type}
                </span>
              </div>
              <p className="text-xs text-emerald-800 font-medium mt-1 leading-relaxed">
                {successNotif.message}
              </p>
              <div className="mt-2 flex items-center space-x-3 text-xs font-bold text-emerald-900">
                <span className="bg-white/80 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  Anggota: <b>{successNotif.studentName}</b> ({successNotif.studentKelas})
                </span>
                <span className="bg-white/80 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Skor Akumulasi Terkini: <b>{successNotif.newTotal} Poin</b></span>
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessNotif(null)}
            className="text-emerald-500 hover:text-emerald-800 p-1 rounded-lg transition cursor-pointer"
            title="Tutup Notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Add log Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 h-fit space-y-5">
          <h3 className="text-sm font-black text-gray-800 flex items-center pb-3 border-b border-gray-50">
            <Plus className="w-4 h-4 mr-1 text-indigo-600" />
            Catat Pelanggaran / Prestasi
          </h3>

          {errorMsg && (
            <div className="bg-rose-50 text-rose-700 border border-rose-200 p-3 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Anggota Murid</label>
              <select
                value={selectedSiswaId}
                onChange={(e) => setSelectedSiswaId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="">-- Pilih Murid --</option>
                {activeSiswa.map((s) => {
                  const net = getSiswaNetPoints(s.id);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.nama_lengkap} ({s.kelas}) - Skor Akhir: {net} Poin
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tanggal Kejadian</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Kategori Pencatatan</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipe('Prestasi')}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center space-x-1 ${
                    tipe === 'Prestasi'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Prestasi (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTipe('Pelanggaran')}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center space-x-1 ${
                    tipe === 'Pelanggaran'
                      ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Pelanggaran (-)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Besaran Poin (Skala Positif)</label>
              <select
                value={poin}
                onChange={(e) => setPoin(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold"
              >
                <option value="5">5 Poin (Ringan - misal: terlambat, hasduk kotor)</option>
                <option value="10">10 Poin (Sedang - misal: tidak ikut upacara, sangga aktif)</option>
                <option value="15">15 Poin (Tinggi - misal: sangga terbaik latihan, merusak alat)</option>
                <option value="25">25 Poin (Sangat Tinggi - misal: mewakili lomba SMK, membolos)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Deskripsi Kejadian / Kronologi</label>
              <textarea
                rows={3}
                placeholder="Tuliskan kronologi singkat, misalnya: Membantu mendirikan tenda utama dengan inisiatif tinggi"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {!readOnly ? (
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition cursor-pointer"
              >
                Simpan Catatan Kedisiplinan
              </button>
            ) : (
              <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-center text-xs font-bold">
                Mode Pengawas: Hanya Lihat
              </div>
            )}
          </form>
        </div>

        {/* Right column: Ledger lists & student scores */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Top Students behavioral score rankings */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center">
              <Award className="w-4 h-4 mr-1 text-emerald-500" />
              Skor Perilaku Ambalan (Nilai Dasar: 100)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activeSiswa.slice(0, 6).map((s) => {
                const net = getSiswaNetPoints(s.id);
                return (
                  <div key={s.id} className="p-3 bg-gray-50/50 border border-gray-100 rounded-xl text-center space-y-1">
                    <p className="text-xs font-extrabold text-gray-800 truncate">{s.nama_lengkap}</p>
                    <p className="text-[9px] text-gray-400 uppercase font-semibold">{s.kelas}</p>
                    <div className="pt-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                        net > 100 ? 'bg-emerald-50 text-emerald-700' :
                        net < 100 ? 'bg-rose-50 text-rose-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {net} Poin
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historical Log list */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-gray-800 flex items-center">
              <ClipboardList className="w-4 h-4 mr-1 text-gray-500" />
              Log Kronologi Poin Kedisiplinan
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Murid</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Poin</th>
                    <th className="p-3">Deskripsi Kejadian</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
                  {filteredKedisiplinan.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400">
                        Belum ada riwayat pelanggaran atau prestasi dicatat untuk kelas ini.
                      </td>
                    </tr>
                  ) : (
                    [...filteredKedisiplinan].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).map((log) => {
                      const student = siswa.find((s) => s.id === log.siswa_id);
                      return (
                        <tr key={log.id} className="hover:bg-gray-50/30 transition">
                          <td className="p-3 font-semibold text-gray-400">{new Date(log.tanggal).toLocaleDateString('id-ID')}</td>
                          <td className="p-3 font-extrabold text-gray-800">
                            <div>{student?.nama_lengkap || 'Murid Terhapus'}</div>
                            <div className="text-[10px] text-gray-400 font-normal">{student?.kelas}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              log.tipe === 'Prestasi' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {log.tipe}
                            </span>
                          </td>
                          <td className="p-3 font-extrabold">
                            <span className={log.poin > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                              {log.poin > 0 ? `+${log.poin}` : log.poin}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-gray-500 leading-relaxed max-w-xs break-words" title={log.keterangan}>
                            {log.keterangan}
                          </td>
                          <td className="p-3 text-center">
                            {!readOnly ? (
                              <button
                                onClick={() => {
                                  if (confirm('Hapus catatan kedisiplinan ini?')) {
                                    handleDelete(log.id);
                                  }
                                }}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Hapus Catatan"
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
    </div>
  );
};
