import React, { useState } from 'react';
import { Siswa, SKKDef, SKKRecord, TingkatSKK } from '../types';
import { 
  Award, 
  CheckCircle2, 
  Search, 
  Plus, 
  Trash2, 
  Shield, 
  Calendar, 
  Filter, 
  User, 
  X, 
  Sparkles, 
  BookCheck, 
  GraduationCap,
  Medal,
  HelpCircle,
  FileCheck
} from 'lucide-react';

interface SKKManagerProps {
  siswa: Siswa[];
  skkDefs: SKKDef[];
  skkRecords: SKKRecord[];
  onVerifySKK: (data: Omit<SKKRecord, 'id'>) => void;
  onUnverifySKK: (id: string) => void;
  onAddSKKDef?: (data: Omit<SKKDef, 'id'>) => void;
  readOnly?: boolean;
}

export const SKKManager: React.FC<SKKManagerProps> = ({
  siswa,
  skkDefs,
  skkRecords,
  onVerifySKK,
  onUnverifySKK,
  onAddSKKDef,
  readOnly = false,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [selectedBidang, setSelectedBidang] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'katalog' | 'rekap_anggota' | 'riwayat'>('katalog');

  // Verify modal state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState<string>('');
  const [targetSkkDefId, setTargetSkkDefId] = useState<string>('');
  const [selectedTingkat, setSelectedTingkat] = useState<TingkatSKK>('Purwa');
  const [tanggalLulus, setTanggalLulus] = useState<string>(new Date().toISOString().split('T')[0]);
  const [pembinaVerifikator, setPembinaVerifikator] = useState<string>('Kak Jihan Fadhilah, S. Kom');
  const [catatanPenguji, setCatatanPenguji] = useState<string>('');

  // Add Custom SKK Def modal state
  const [isAddDefModalOpen, setIsAddDefModalOpen] = useState(false);
  const [newKode, setNewKode] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newBidang, setNewBidang] = useState('Ketangkasan & Kesehatan');
  const [newDeskripsi, setNewDeskripsi] = useState('');

  const uniqueClasses = Array.from(new Set(siswa.map(s => s.kelas))).filter(Boolean).sort();
  const uniqueBidang = Array.from(new Set(skkDefs.map(d => d.bidang))).filter(Boolean).sort();

  // Filter students based on class & search
  const filteredStudents = siswa.filter(s => {
    const matchClass = selectedKelas === 'all' || s.kelas === selectedKelas;
    const matchSearch = s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) || s.nis.includes(searchQuery);
    return matchClass && matchSearch && s.status_aktif;
  });

  // Filtered SKK Defs
  const filteredDefs = skkDefs.filter(d => {
    const matchBidang = selectedBidang === 'all' || d.bidang === selectedBidang;
    const matchSearch = d.nama.toLowerCase().includes(searchQuery.toLowerCase()) || d.kode.toLowerCase().includes(searchQuery.toLowerCase()) || d.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchBidang && matchSearch;
  });

  const handleOpenVerifyModal = (skkId?: string, studentId?: string) => {
    if (skkId) setTargetSkkDefId(skkId);
    else if (skkDefs.length > 0) setTargetSkkDefId(skkDefs[0].id);

    if (studentId) setTargetStudentId(studentId);
    else if (filteredStudents.length > 0) setTargetStudentId(filteredStudents[0].id);
    else if (siswa.length > 0) setTargetStudentId(siswa[0].id);

    setSelectedTingkat('Purwa');
    setTanggalLulus(new Date().toISOString().split('T')[0]);
    setCatatanPenguji('');
    setIsVerifyModalOpen(true);
  };

  const handleExecuteVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentId || !targetSkkDefId) {
      alert('Pilih murid dan jenis TKK terlebih dahulu!');
      return;
    }

    onVerifySKK({
      siswa_id: targetStudentId,
      skk_def_id: targetSkkDefId,
      tingkat: selectedTingkat,
      tanggal_lulus: tanggalLulus,
      pembina_verifikator: pembinaVerifikator,
      status_verifikasi: true,
      catatan_penguji: catatanPenguji.trim() || undefined
    });

    setIsVerifyModalOpen(false);
  };

  const handleCreateCustomDef = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKode.trim() || !newNama.trim()) {
      alert('Kode dan Nama TKK wajib diisi!');
      return;
    }

    if (onAddSKKDef) {
      onAddSKKDef({
        kode: newKode.trim().toUpperCase(),
        nama: newNama.trim(),
        bidang: newBidang,
        deskripsi: newDeskripsi.trim() || 'Syarat Kecakapan Khusus Ambalan',
        warna_badge: 'bg-indigo-600'
      });
    }

    setIsAddDefModalOpen(false);
    setNewKode('');
    setNewNama('');
    setNewDeskripsi('');
  };

  // Helper for badge border shape based on Tingkat
  const renderTingkatBadge = (tingkat: TingkatSKK) => {
    if (tingkat === 'Purwa') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
          Purwa (Dasar)
        </span>
      );
    }
    if (tingkat === 'Madya') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300">
          <span className="w-1.5 h-1.5 rounded-xs bg-blue-500 mr-1.5"></span>
          Madya (Menengah)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
        <Sparkles className="w-2.5 h-2.5 mr-1 text-emerald-600" />
        Utama (Tinggi)
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Overview Stats */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center border border-amber-200 shrink-0">
              <Medal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                  SKK & TKK Digital
                </span>
                <span className="text-xs text-gray-400 font-bold">• Penegak Ambalan</span>
              </div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight mt-0.5">
                Pencatatan Syarat Kecakapan Khusus (SKK / TKK)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Verifikasi tanda kemahiran digital anggota tanpa ketergantungan buku fisik yang rawan tercecer.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!readOnly ? (
              <>
                {onAddSKKDef && (
                  <button
                    type="button"
                    onClick={() => setIsAddDefModalOpen(true)}
                    className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-gray-500" />
                    <span>Tambah Definisi TKK</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenVerifyModal()}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Verifikasi TKK Murid</span>
                </button>
              </>
            ) : (
              <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl">
                Mode Pengawas: Hanya Lihat
              </span>
            )}
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-gray-100">
          <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
            <span className="text-[11px] font-bold text-gray-500 block">Katalog TKK Tersedia</span>
            <span className="text-xl font-black text-gray-800 mt-0.5 block">{skkDefs.length} Modul</span>
          </div>
          <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-100">
            <span className="text-[11px] font-bold text-amber-700 block">Total TKK Terverifikasi</span>
            <span className="text-xl font-black text-amber-900 mt-0.5 block">{skkRecords.length} TKK</span>
          </div>
          <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100">
            <span className="text-[11px] font-bold text-blue-700 block">Anggota Peraih TKK</span>
            <span className="text-xl font-black text-blue-900 mt-0.5 block">
              {new Set(skkRecords.map(r => r.siswa_id)).size} Anggota
            </span>
          </div>
          <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-700 block">Tingkat Utama (Segilima)</span>
            <span className="text-xl font-black text-emerald-900 mt-0.5 block">
              {skkRecords.filter(r => r.tingkat === 'Utama').length} Badge
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveSubTab('katalog')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeSubTab === 'katalog'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Katalog 10 TKK Wajib & Pilihan
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('rekap_anggota')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeSubTab === 'rekap_anggota'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Rekap TKK Per Anggota
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('riwayat')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeSubTab === 'riwayat'
              ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Riwayat Verifikasi Pembina ({skkRecords.length})
        </button>
      </div>

      {/* 1. KATALOG TKK TAB */}
      {activeSubTab === 'katalog' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama TKK atau keterampilan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500 font-bold whitespace-nowrap">Bidang:</span>
              <select
                value={selectedBidang}
                onChange={(e) => setSelectedBidang(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="all">Semua Bidang ({skkDefs.length})</option>
                {uniqueBidang.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDefs.map((def) => {
              const recordsForThis = skkRecords.filter(r => r.skk_def_id === def.id);
              return (
                <div 
                  key={def.id}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-black text-sm shrink-0">
                          {def.nama.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-[10px] font-black tracking-wider text-amber-700 uppercase bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                            {def.kode}
                          </span>
                          <h3 className="font-extrabold text-sm text-gray-800 mt-1">{def.nama}</h3>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-semibold px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100">
                        {recordsForThis.length} lulus
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                      {def.deskripsi}
                    </p>

                    <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-gray-500 font-semibold">
                      <Shield className="w-3 h-3 text-gray-400" />
                      <span>Bidang: {def.bidang}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">Purwa / Madya / Utama</span>
                    <button
                      type="button"
                      onClick={() => handleOpenVerifyModal(def.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Uji / Verifikasi</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. REKAP TKK PER ANGGOTA */}
      {activeSubTab === 'rekap_anggota' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari murid berdasarkan nama atau NIS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-xs text-gray-500 font-bold whitespace-nowrap">Filter Kelas:</span>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="all">Semua Kelas</option>
                {uniqueClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Student TKK Badges Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3">NIS</th>
                    <th className="px-4 py-3">Nama Anggota</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3">Tingkat SKU</th>
                    <th className="px-4 py-3">Koleksi Badge TKK</th>
                    <th className="px-4 py-3 text-center">Total TKK</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400 font-bold">
                        Tidak ada data anggota yang sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => {
                      const studentRecords = skkRecords.filter(r => r.siswa_id === s.id);
                      return (
                        <tr key={s.id} className="hover:bg-amber-50/30 transition">
                          <td className="px-4 py-3 font-mono font-bold text-gray-600">{s.nis}</td>
                          <td className="px-4 py-3 font-extrabold text-gray-900">{s.nama_lengkap}</td>
                          <td className="px-4 py-3 font-bold text-gray-600">{s.kelas}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {s.status_pelantikan || 'Calon Penegak'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5 max-w-md">
                              {studentRecords.length === 0 ? (
                                <span className="text-[11px] text-gray-400 italic">Belum ada TKK terverifikasi</span>
                              ) : (
                                studentRecords.map((r) => {
                                  const def = skkDefs.find(d => d.id === r.skk_def_id);
                                  return (
                                    <span
                                      key={r.id}
                                      className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold"
                                      title={`${def?.nama || 'TKK'} (${r.tingkat}) - Penguji: ${r.pembina_verifikator}`}
                                    >
                                      <Medal className="w-2.5 h-2.5 text-amber-600" />
                                      <span>{def?.nama || 'TKK'}</span>
                                      <span className="text-[9px] opacity-75 font-mono">[{r.tingkat}]</span>
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-black text-amber-800">
                            {studentRecords.length}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenVerifyModal(undefined, s.id)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold text-[11px] transition inline-flex items-center space-x-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Uji TKK</span>
                            </button>
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
      )}

      {/* 3. RIWAYAT VERIFIKASI PEMBINA TAB */}
      {activeSubTab === 'riwayat' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-gray-800">
              Log Persetujuan / Uji SKK oleh Penguji Ambalan
            </h3>
            <span className="text-xs text-gray-400 font-semibold">{skkRecords.length} Catatan Lulus</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 font-black border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">Tanggal Lulus</th>
                  <th className="px-4 py-3">Nama Anggota</th>
                  <th className="px-4 py-3">TKK Diuji</th>
                  <th className="px-4 py-3">Tingkat Kemahiran</th>
                  <th className="px-4 py-3">Pembina Penguji</th>
                  <th className="px-4 py-3">Catatan Evaluasi</th>
                  <th className="px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {skkRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400 font-bold">
                      Belum ada riwayat verifikasi TKK.
                    </td>
                  </tr>
                ) : (
                  skkRecords.map((rec) => {
                    const student = siswa.find(s => s.id === rec.siswa_id);
                    const def = skkDefs.find(d => d.id === rec.skk_def_id);
                    return (
                      <tr key={rec.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-mono text-gray-600 font-semibold">{rec.tanggal_lulus}</td>
                        <td className="px-4 py-3 font-extrabold text-gray-900">
                          {student?.nama_lengkap || 'Anggota Tak Dikenal'}
                          <span className="block text-[10px] text-gray-400 font-normal">
                            {student?.kelas} • NIS {student?.nis}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-gray-800">{def?.nama || 'TKK'}</span>
                          <span className="block text-[10px] text-gray-400">{def?.bidang}</span>
                        </td>
                        <td className="px-4 py-3">
                          {renderTingkatBadge(rec.tingkat)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-700">
                          {rec.pembina_verifikator}
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                          {rec.catatan_penguji || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!readOnly ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Batalkan persetujuan TKK ${def?.nama} untuk ${student?.nama_lengkap}?`)) {
                                  onUnverifySKK(rec.id);
                                }
                              }}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Batalkan Verifikasi TKK"
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
      )}

      {/* VERIFY TKK MODAL */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-gray-800">Verifikasi Kelulusan SKK / TKK</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteVerify} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-700 mb-1">Pilih Anggota Pramuka</label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">-- Pilih Anggota --</option>
                  {siswa.filter(s => s.status_aktif).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nama_lengkap} ({s.kelas} - {s.nis})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1">Kategori Syarat Kecakapan Khusus (TKK)</label>
                <select
                  value={targetSkkDefId}
                  onChange={(e) => setTargetSkkDefId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">-- Pilih TKK --</option>
                  {skkDefs.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.kode} - {d.nama} ({d.bidang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">Tingkat Kemahiran</label>
                  <select
                    value={selectedTingkat}
                    onChange={(e) => setSelectedTingkat(e.target.value as TingkatSKK)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Purwa">Purwa (Tingkat Dasar - Lingkaran)</option>
                    <option value="Madya">Madya (Tingkat Menengah - Persegi)</option>
                    <option value="Utama">Utama (Tingkat Tinggi - Segilima)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">Tanggal Kelulusan</label>
                  <input
                    type="date"
                    value={tanggalLulus}
                    onChange={(e) => setTanggalLulus(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1">Pembina / Penguji yang Menyetujui</label>
                <input
                  type="text"
                  value={pembinaVerifikator}
                  onChange={(e) => setPembinaVerifikator(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Nama Pembina / Penguji Ahli..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1">Catatan Ujian / Bukti Portofolio (Opsional)</label>
                <textarea
                  rows={2}
                  value={catatanPenguji}
                  onChange={(e) => setCatatanPenguji(e.target.value)}
                  placeholder="Contoh: Sukses memimpin pembuatan tenda komando saat kemah pelantikan..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Setujui & Terbitkan TKK</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CUSTOM TKK DEFINITION MODAL */}
      {isAddDefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-black text-sm text-gray-800">Tambah Definisi TKK Baru</h3>
              <button
                type="button"
                onClick={() => setIsAddDefModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomDef} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">Kode TKK</label>
                  <input
                    type="text"
                    placeholder="misal: TKK-IT"
                    value={newKode}
                    onChange={(e) => setNewKode(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">Bidang Kemahiran</label>
                  <select
                    value={newBidang}
                    onChange={(e) => setNewBidang(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Ketangkasan & Kesehatan">Ketangkasan & Kesehatan</option>
                    <option value="Keterampilan & Pembangunan">Keterampilan & Pembangunan</option>
                    <option value="Patriotisme & Seni">Patriotisme & Seni</option>
                    <option value="Sosial & Gotong Royong">Sosial & Gotong Royong</option>
                    <option value="Agama & Mental">Agama & Mental</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1">Nama Syarat Kecakapan Khusus</label>
                <input
                  type="text"
                  placeholder="misal: Programmer / Jaringan Komputer"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1">Deskripsi & Syarat Pengujian</label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan kriteria ujian yang harus diselesaikan anggota..."
                  value={newDeskripsi}
                  onChange={(e) => setNewDeskripsi(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddDefModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  Simpan Definisi TKK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
