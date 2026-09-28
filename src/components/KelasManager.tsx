import React, { useState } from 'react';
import { Kelas, Siswa } from '../types';
import { Search, Plus, Edit2, Trash2, GraduationCap, X, Check, Users, AlertTriangle } from 'lucide-react';

interface KelasManagerProps {
  kelas: Kelas[];
  siswa: Siswa[];
  onAdd: (nama: string) => void;
  onUpdate: (id: string, nama: string) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export const KelasManager: React.FC<KelasManagerProps> = ({
  kelas,
  siswa,
  onAdd,
  onUpdate,
  onDelete,
  readOnly = false,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentKelas, setCurrentKelas] = useState<Kelas | null>(null); // null means Add Mode
  const [namaKelas, setNamaKelas] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Delete Confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtered classes based on search
  const filteredKelas = kelas.filter((k) =>
    k.nama.toLowerCase().includes(search.toLowerCase())
  );

  // Count active students in a class
  const getSiswaCount = (kelasNama: string) => {
    return siswa.filter((s) => s.kelas === kelasNama).length;
  };

  // Count active students in a class (status_aktif === true)
  const getSiswaAktifCount = (kelasNama: string) => {
    return siswa.filter((s) => s.kelas === kelasNama && s.status_aktif).length;
  };

  const handleOpenAdd = () => {
    setCurrentKelas(null);
    setNamaKelas('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (k: Kelas) => {
    setCurrentKelas(k);
    setNamaKelas(k.nama);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = namaKelas.trim();
    if (!trimmed) {
      setErrorMsg('Nama kelas tidak boleh kosong!');
      return;
    }

    // Check duplicate class name
    const isDuplicate = kelas.some(
      (k) => k.nama.toLowerCase() === trimmed.toLowerCase() && (!currentKelas || k.id !== currentKelas.id)
    );
    if (isDuplicate) {
      setErrorMsg('Nama kelas sudah terdaftar!');
      return;
    }

    if (currentKelas) {
      onUpdate(currentKelas.id, trimmed);
    } else {
      onAdd(trimmed);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleExecuteDelete = () => {
    if (deleteConfirmId) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6" id="kelas-manager-wrapper">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-150 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Kelas Ambalan</h2>
          <p className="text-sm text-gray-400 mt-1">
            Kelola master data kelas untuk penempatan anggota penegak secara terstruktur.
          </p>
        </div>
        {!readOnly ? (
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kelas Baru</span>
          </button>
        ) : (
          <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl">
            Mode Pengawas: Hanya Lihat
          </span>
        )}
      </div>

      {/* Info Card alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-amber-950 shadow-3xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-900">Petunjuk Integritas Data</h4>
          <p className="text-xs text-amber-700 leading-relaxed">
            Menghapus kelas akan mengubah kelas semua murid yang berada di dalam kelas tersebut menjadi <b className="text-amber-950 font-black">"Belum Ditentukan"</b> agar data mereka tidak hilang. Mengedit nama kelas akan secara otomatis memperbarui kelas murid yang bersangkutan.
          </p>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-3xs">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari kelas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-bold"
          />
        </div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
          Total Kelas: {kelas.length}
        </div>
      </div>

      {/* Classes Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredKelas.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-xs">
            Tidak ditemukan data kelas yang cocok dengan kriteria pencarian.
          </div>
        ) : (
          filteredKelas.map((k) => {
            const studentCount = getSiswaCount(k.nama);
            const activeCount = getSiswaAktifCount(k.nama);
            const isDeleting = deleteConfirmId === k.id;

            return (
              <div
                key={k.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-3xs flex flex-col justify-between hover:border-indigo-100 transition duration-150 relative overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 pl-2">
                      <GraduationCap className="w-5 h-5 text-indigo-600" />
                      <span className="font-extrabold text-base text-gray-800">{k.nama}</span>
                    </div>

                    {!isDeleting && !readOnly && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEdit(k)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Ubah Nama Kelas"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => confirmDelete(k.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Kelas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pl-2 grid grid-cols-2 gap-3">
                    <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 text-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Anggota</span>
                      <span className="text-base font-black text-indigo-950 mt-1 block">{studentCount}</span>
                    </div>
                    <div className="bg-emerald-50/20 p-2.5 rounded-xl border border-emerald-50 text-center">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Status Aktif</span>
                      <span className="text-base font-black text-emerald-700 mt-1 block">{activeCount}</span>
                    </div>
                  </div>
                </div>

                {isDeleting ? (
                  <div className="mt-4 bg-rose-50 rounded-xl p-3 border border-rose-100 text-xs space-y-2 animate-fade-in pl-2">
                    <p className="text-rose-900 font-extrabold">Hapus kelas ini? Murid akan diset ke "Belum Ditentukan".</p>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-lg text-[10px] font-black"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleExecuteDelete}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-black"
                      >
                        Hapus Permanen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pl-2 text-[10px] font-semibold text-gray-400 flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1 text-gray-300" />
                    <span>Daftar Siswa aktif: {studentCount > 0 ? siswa.filter(s => s.kelas === k.nama).map(s => s.nama_lengkap).slice(0, 3).join(', ') + (studentCount > 3 ? '...' : '') : 'Belum ada anggota'}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add / Edit Class */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative z-10 shadow-xl border border-indigo-100/50 animate-scale-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-gray-300 hover:text-gray-500 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-gray-800">
              {currentKelas ? 'Ubah Nama Kelas' : 'Tambah Kelas Ambalan Baru'}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {currentKelas ? 'Perubahan nama akan berimbas pada seluruh anggota di dalamnya.' : 'Masukkan nama lengkap kelas baru untuk didaftarkan.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">
                  Nama Kelas
                </label>
                <input
                  type="text"
                  placeholder="Contoh: XII TKJ 1, XI RPL 2"
                  value={namaKelas}
                  onChange={(e) => setNamaKelas(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  autoFocus
                />
              </div>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 text-xs font-bold flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1.5 text-rose-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-extrabold text-xs py-2.5 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition flex items-center justify-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>{currentKelas ? 'Simpan Perubahan' : 'Daftarkan Kelas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
