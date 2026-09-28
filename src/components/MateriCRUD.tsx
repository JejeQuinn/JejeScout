import React, { useState } from 'react';
import { Materi, Siswa, KategoriMateri, StatusMateri } from '../types';
import { Plus, BookOpen, Edit2, Trash2, X, GraduationCap, Calendar, CheckSquare, Search } from 'lucide-react';

interface MateriCRUDProps {
  materi: Materi[];
  siswa: Siswa[];
  onAdd: (data: Omit<Materi, 'id' | 'nilai_evaluasi'>) => void;
  onUpdate: (data: Materi) => void;
  onDelete: (id: string) => void;
  onUpdateNilai: (materiId: string, nilai_evaluasi: Record<string, number>) => void;
  readOnly?: boolean;
}

export const MateriCRUD: React.FC<MateriCRUDProps> = ({
  materi,
  siswa,
  onAdd,
  onUpdate,
  onDelete,
  onUpdateNilai,
  readOnly = false,
}) => {
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState<'All' | KategoriMateri>('All');
  
  // Modals / Drawer active triggers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentMateri, setCurrentMateri] = useState<Materi | null>(null); // Null = Add mode
  
  // Active evaluation target
  const [evaluasiMateri, setEvaluasiMateri] = useState<Materi | null>(null);
  const [tempNilai, setTempNilai] = useState<Record<string, string>>({}); // studentId -> string representation

  // Form Fields
  const [judulMateri, setJudulMateri] = useState('');
  const [kategori, setKategori] = useState<KategoriMateri>('Umum');
  const [tanggal, setTanggal] = useState('');
  const [status, setStatus] = useState<StatusMateri>('Direncanakan');
  const [errorMsg, setErrorMsg] = useState('');

  const activeSiswa = siswa.filter((s) => s.status_aktif);

  const openAddForm = () => {
    setCurrentMateri(null);
    setJudulMateri('');
    setKategori('Umum');
    setTanggal(new Date().toISOString().split('T')[0]);
    setStatus('Direncanakan');
    setErrorMsg('');
    setIsFormOpen(true);
  };

  const openEditForm = (m: Materi) => {
    setCurrentMateri(m);
    setJudulMateri(m.judul_materi);
    setKategori(m.kategori);
    setTanggal(m.tanggal_pelaksanaan);
    setStatus(m.status);
    setErrorMsg('');
    setIsFormOpen(true);
  };

  const handleMateriSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!judulMateri.trim() || !tanggal) {
      setErrorMsg('Semua kolom wajib diisi!');
      return;
    }

    if (currentMateri) {
      onUpdate({
        ...currentMateri,
        judul_materi: judulMateri.trim(),
        kategori,
        tanggal_pelaksanaan: tanggal,
        status,
      });
    } else {
      onAdd({
        judul_materi: judulMateri.trim(),
        kategori,
        tanggal_pelaksanaan: tanggal,
        status,
      });
    }

    setIsFormOpen(false);
  };

  const openEvaluasiPanel = (m: Materi) => {
    setEvaluasiMateri(m);
    const initialGrades: Record<string, string> = {};
    activeSiswa.forEach((s) => {
      initialGrades[s.id] = m.nilai_evaluasi && m.nilai_evaluasi[s.id] !== undefined
        ? String(m.nilai_evaluasi[s.id])
        : '';
    });
    setTempNilai(initialGrades);
  };

  const handleNilaiChange = (siswaId: string, val: string) => {
    // Only numbers 0-100 or empty string
    if (val === '') {
      setTempNilai((prev) => ({ ...prev, [siswaId]: '' }));
      return;
    }
    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setTempNilai((prev) => ({ ...prev, [siswaId]: String(num) }));
    }
  };

  const submitEvaluasiNilai = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluasiMateri) return;

    const gradesToSave: Record<string, number> = {};
    Object.entries(tempNilai).forEach(([sId, val]) => {
      if (val !== '') {
        gradesToSave[sId] = Number(val);
      }
    });

    onUpdateNilai(evaluasiMateri.id, gradesToSave);
    setEvaluasiMateri(null);
  };

  // Filtered List
  const filteredMateri = materi.filter((m) => {
    const matchesSearch = m.judul_materi.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterKategori === 'All' || m.kategori === filterKategori;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6" id="materi_crud_module">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Materi Latihan</h2>
          <p className="text-sm text-gray-400 mt-1">Susun materi pembelajaran mingguan, kelompokkan kategori, dan input nilai uji pemahaman ambalan.</p>
        </div>
        {!readOnly ? (
          <button
            onClick={openAddForm}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-xs transition duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Materi Baru</span>
          </button>
        ) : (
          <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl">
            Mode Pengawas: Hanya Lihat
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Materials List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Cari judul materi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
              />
            </div>

            <div className="flex space-x-1 overflow-x-auto w-full sm:w-auto">
              {(['All', 'Umum', 'Tekpram', 'Karakter'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterKategori(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    filterKategori === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {cat === 'All' ? 'Semua' : cat === 'Tekpram' ? 'Tekpram' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Materials Cards List */}
          <div className="space-y-4">
            {filteredMateri.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center text-gray-400 text-sm">
                Tidak ada materi latihan ditemukan.
              </div>
            ) : (
              filteredMateri.map((m) => (
                <div 
                  key={m.id} 
                  className={`bg-white rounded-2xl border p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:shadow-xs ${
                    evaluasiMateri?.id === m.id ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-gray-100'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        m.kategori === 'Tekpram' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        m.kategori === 'Karakter' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        'bg-sky-50 text-sky-700 border border-sky-100'
                      }`}>
                        {m.kategori === 'Tekpram' ? 'Teknis Kepramukaan' : m.kategori}
                      </span>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === 'Selesai' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {m.status}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-gray-800">{m.judul_materi}</h4>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-400 font-semibold">
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        {new Date(m.tanggal_pelaksanaan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {m.status === 'Selesai' && (
                        <span className="flex items-center text-emerald-600">
                          <CheckSquare className="w-3.5 h-3.5 mr-1" />
                          {Object.keys(m.nilai_evaluasi || {}).length} Murid Dinilai
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-stretch md:self-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-50">
                    {m.status === 'Selesai' && (
                      <button
                        onClick={() => openEvaluasiPanel(m)}
                        className="flex items-center space-x-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-2 rounded-xl transition cursor-pointer"
                        title={readOnly ? "Lihat Nilai Evaluasi Murid" : "Isi Nilai Evaluasi Murid"}
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>{readOnly ? 'Lihat Nilai' : 'Input Nilai'}</span>
                      </button>
                    )}
                    {!readOnly && (
                      <>
                        <button
                          onClick={() => openEditForm(m)}
                          className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                          title="Edit materi"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Apakah Anda yakin ingin menghapus materi ini? Semua nilai evaluasi terkait materi ini juga akan terhapus otomatis!")) {
                              onDelete(m.id);
                              if (evaluasiMateri?.id === m.id) setEvaluasiMateri(null);
                            }
                          }}
                          className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition cursor-pointer"
                          title="Hapus materi"
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

        {/* Right Side Panel: Form Create/Edit OR Evaluasi Nilai */}
        <div className="space-y-6">
          {/* Sub-Panel 1: Input/Edit Form */}
          {isFormOpen && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative">
              <button
                onClick={() => setIsFormOpen(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
                {currentMateri ? 'Perbarui Materi' : 'Susun Materi Latihan Baru'}
              </h3>

              {errorMsg && (
                <div className="bg-rose-50 text-rose-700 border border-rose-200 p-3 rounded-xl mb-4 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleMateriSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Judul Materi</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Praktik Pioneering Menara Pandang"
                    value={judulMateri}
                    onChange={(e) => setJudulMateri(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Kategori Latihan</label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value as KategoriMateri)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                  >
                    <option value="Umum">Umum (Wawasan/Sejarah/Pancasila)</option>
                    <option value="Tekpram">Teknis Kepramukaan (Simpul/Tali/Kompas/Sandi)</option>
                    <option value="Karakter">Karakter / Mental (Spiritualitas/Dasa Darma)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Tanggal Pelaksanaan</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Status Pelaksanaan</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusMateri)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                  >
                    <option value="Direncanakan">Direncanakan</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Simpan Materi
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sub-Panel 2: Input Evaluasi Nilai Siswa */}
          {evaluasiMateri && (
            <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-lg p-6 relative">
              <button
                onClick={() => setEvaluasiMateri(null)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Evaluasi Nilai Latihan
                </span>
                <h3 className="text-sm font-black text-gray-800 mt-2 leading-tight">
                  {evaluasiMateri.judul_materi}
                </h3>
                <p className="text-[11px] text-gray-400 mt-1">Masukkan skor pemahaman (skala 0 - 100) untuk seluruh ambalan aktif.</p>
              </div>

              <form onSubmit={submitEvaluasiNilai} className="space-y-4">
                <div className="max-h-72 overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50/50 divide-y divide-gray-100">
                  {activeSiswa.length === 0 ? (
                    <p className="p-4 text-center text-xs text-gray-400">Tidak ada murid aktif terdaftar.</p>
                  ) : (
                    activeSiswa.map((s) => (
                      <div key={s.id} className="flex items-center justify-between py-2.5 px-2">
                        <div>
                          <p className="text-xs font-bold text-gray-800">{s.nama_lengkap}</p>
                          <p className="text-[10px] text-gray-400">{s.kelas}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0-100"
                            disabled={readOnly}
                            value={tempNilai[s.id] || ''}
                            onChange={(e) => handleNilaiChange(s.id, e.target.value)}
                            className="w-16 bg-white border border-gray-200 text-center rounded-lg px-1.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEvaluasiMateri(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 rounded-xl transition cursor-pointer"
                  >
                    {readOnly ? 'Tutup' : 'Batal'}
                  </button>
                  {!readOnly ? (
                    <button
                      type="submit"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Simpan Nilai
                    </button>
                  ) : (
                    <div className="flex-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold py-2 rounded-xl text-center">
                      Hanya Lihat
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Guidelines info card if nothing is open */}
          {!isFormOpen && !evaluasiMateri && (
            <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100 text-indigo-950 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900">💡 Petunjuk Pembina</h4>
              <ul className="text-xs space-y-2 list-disc pl-4 text-indigo-800 leading-relaxed">
                <li>Klik <b>"Tambah Materi Baru"</b> di atas untuk menyusun jadwal latihan ambalan mendatang.</li>
                <li>Setelah latihan terlaksana, ubah status materi menjadi <b>"Selesai"</b>.</li>
                <li>Materi berstatus <b>Selesai</b> akan menampilkan tombol <b>"Input Nilai"</b>. Isilah nilai pemahaman murid untuk melengkapi bobot 30% nilai evaluasi mereka.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
