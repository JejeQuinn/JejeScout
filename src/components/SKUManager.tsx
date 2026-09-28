import React, { useState } from 'react';
import { SKU, Siswa, SKUItemDef } from '../types';
import { Award, CheckCircle, Search, ClipboardList, Trash2, Calendar, UserCheck, Plus, Edit2, Settings, AlertTriangle, X } from 'lucide-react';

interface SKUManagerProps {
  sku: SKU[];
  siswa: Siswa[];
  skuDefs: SKUItemDef[];
  onVerify: (data: { siswa_id: string; no_item_sku: number; tanggal_lulus: string; status_verifikasi: boolean; tingkat: 'Bantara' | 'Laksana'; pembina_verifikator?: string }) => void;
  onUnverify: (id: string) => void;
  onAddSkuDef: (data: Omit<SKUItemDef, 'id'>) => void;
  onUpdateSkuDef: (data: SKUItemDef) => void;
  onDeleteSkuDef: (id: string) => void;
  readOnly?: boolean;
}

export const SKUManager: React.FC<SKUManagerProps> = ({
  sku,
  siswa,
  skuDefs,
  onVerify,
  onUnverify,
  onAddSkuDef,
  onUpdateSkuDef,
  onDeleteSkuDef,
  readOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'history' | 'defs'>('matrix');
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>(siswa[0]?.id || '');
  const [currentLevel, setCurrentLevel] = useState<'Bantara' | 'Laksana'>('Bantara');
  const [searchHistory, setSearchHistory] = useState('');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [searchSiswa, setSearchSiswa] = useState<string>('');

  // Form helper states for manual verification
  const [verifikasiTanggal, setVerifikasiTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [verifikatorNama, setVerifikatorNama] = useState('Kak Jihan Fadhilah, S. Kom');

  // State for editing SKU status modal (Lulus vs Tidak Lulus)
  const [editingSKU, setEditingSKU] = useState<{
    def: SKUItemDef;
    isVerified: boolean;
    existingRecord?: SKU;
  } | null>(null);
  const [modalStatusLulus, setModalStatusLulus] = useState(true);
  const [modalTanggal, setModalTanggal] = useState('');
  const [modalPenguji, setModalPenguji] = useState('');

  // Form helper states for managing SKU definitions
  const [showDefForm, setShowDefForm] = useState(false);
  const [editingDef, setEditingDef] = useState<SKUItemDef | null>(null);
  const [defNo, setDefNo] = useState<number>(1);
  const [defDeskripsi, setDefDeskripsi] = useState('');
  const [defTingkat, setDefTingkat] = useState<'Bantara' | 'Laksana'>('Bantara');
  const [defError, setDefError] = useState('');

  const activeSiswa = siswa.filter((s) => s.status_aktif);
  
  // Extract unique classes of active members
  const uniqueClasses = Array.from(new Set(activeSiswa.map((s) => s.kelas))).filter(Boolean).sort();

  // Filter students based on selected class tab & search input
  const filteredActiveSiswa = activeSiswa.filter((s) => {
    const matchesKelas = selectedKelas === 'all' || s.kelas === selectedKelas;
    const matchesSearch = s.nama_lengkap.toLowerCase().includes(searchSiswa.toLowerCase()) || s.nis.includes(searchSiswa);
    return matchesKelas && matchesSearch;
  });

  const selectedSiswa = siswa.find((s) => s.id === selectedSiswaId);

  // Group SKU definitions by levels
  const bantaraDefs = skuDefs.filter((d) => d.tingkat === 'Bantara').sort((a, b) => a.no_item - b.no_item);
  const laksanaDefs = skuDefs.filter((d) => d.tingkat === 'Laksana').sort((a, b) => a.no_item - b.no_item);

  const bantaraTotal = bantaraDefs.length || 1;
  const laksanaTotal = laksanaDefs.length || 1;

  // Calculate student progress
  const getSiswaProgress = (sId: string) => {
    const verifiedBantara = sku.filter((item) => item.siswa_id === sId && item.status_verifikasi && (item.tingkat === 'Bantara' || !item.tingkat));
    const verifiedLaksana = sku.filter((item) => item.siswa_id === sId && item.status_verifikasi && item.tingkat === 'Laksana');

    const bantaraCount = verifiedBantara.length;
    const laksanaCount = verifiedLaksana.length;

    const bantaraPct = Math.round((bantaraCount / bantaraTotal) * 100);
    const laksanaPct = Math.round((laksanaCount / laksanaTotal) * 100);

    return { 
      bantaraCount, 
      laksanaCount, 
      bantaraPct, 
      laksanaPct,
      verifiedBantara,
      verifiedLaksana
    };
  };

  const handleCardClick = (def: SKUItemDef, isVerified: boolean, existingRecord?: SKU) => {
    setEditingSKU({ def, isVerified, existingRecord });
    setModalStatusLulus(isVerified);
    setModalTanggal(existingRecord?.tanggal_lulus || verifikasiTanggal);
    setModalPenguji(existingRecord?.pembina_verifikator || verifikatorNama);
  };

  const handleSaveModalSKU = () => {
    if (readOnly) {
      alert("Akses Ditolak: Hanya Pembina Pramuka (Admin) yang dapat memverifikasi butir SKU.");
      return;
    }
    if (!editingSKU) return;
    const { def, isVerified, existingRecord } = editingSKU;

    if (modalStatusLulus) {
      onVerify({
        siswa_id: selectedSiswaId,
        no_item_sku: def.no_item,
        tanggal_lulus: modalTanggal,
        status_verifikasi: true,
        tingkat: def.tingkat,
        pembina_verifikator: modalPenguji || verifikatorNama,
      });
    } else {
      if (existingRecord) {
        onUnverify(existingRecord.id);
      }
    }
    setEditingSKU(null);
  };

  // Handle SKU definition submit
  const handleDefSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDefError('');

    if (!defDeskripsi.trim()) {
      setDefError('Deskripsi butir SKU tidak boleh kosong!');
      return;
    }

    if (defNo <= 0) {
      setDefError('Nomor butir SKU harus bernilai positif!');
      return;
    }

    // Check duplicate number in the same level
    const duplicate = skuDefs.find(
      (d) => d.tingkat === defTingkat && d.no_item === defNo && (!editingDef || d.id !== editingDef.id)
    );
    if (duplicate) {
      setDefError(`Nomor butir ${defNo} sudah digunakan pada tingkat ${defTingkat}!`);
      return;
    }

    if (editingDef) {
      onUpdateSkuDef({
        id: editingDef.id,
        no_item: defNo,
        deskripsi: defDeskripsi.trim(),
        tingkat: defTingkat,
      });
    } else {
      onAddSkuDef({
        no_item: defNo,
        deskripsi: defDeskripsi.trim(),
        tingkat: defTingkat,
      });
    }

    // Reset Form
    setShowDefForm(false);
    setEditingDef(null);
    setDefDeskripsi('');
  };

  const startEditDef = (def: SKUItemDef) => {
    setEditingDef(def);
    setDefNo(def.no_item);
    setDefDeskripsi(def.deskripsi);
    setDefTingkat(def.tingkat);
    setDefError('');
    setShowDefForm(true);
  };

  const startAddDef = () => {
    setEditingDef(null);
    // Find next number for Bantara / Laksana
    const currentDefs = defTingkat === 'Bantara' ? bantaraDefs : laksanaDefs;
    const nextNo = currentDefs.length > 0 ? Math.max(...currentDefs.map(d => d.no_item)) + 1 : 1;
    setDefNo(nextNo);
    setDefDeskripsi('');
    setDefError('');
    setShowDefForm(true);
  };

  // SKU History List
  const historyList = sku
    .filter((item) => item.status_verifikasi)
    .map((item) => {
      const student = siswa.find((s) => s.id === item.siswa_id);
      const tingkat = item.tingkat || 'Bantara';
      const definition = skuDefs.find((d) => d.tingkat === tingkat && d.no_item === item.no_item_sku);
      return {
        ...item,
        tingkat,
        studentName: student?.nama_lengkap || 'Tidak Dikenal',
        studentKelas: student?.kelas || '-',
        itemDeskripsi: definition?.deskripsi || 'Butir SKU',
      };
    })
    .filter((item) => 
      item.studentName.toLowerCase().includes(searchHistory.toLowerCase()) ||
      item.studentKelas.toLowerCase().includes(searchHistory.toLowerCase()) ||
      item.tingkat.toLowerCase().includes(searchHistory.toLowerCase()) ||
      String(item.no_item_sku).includes(searchHistory)
    )
    .sort((a, b) => new Date(b.tanggal_lulus).getTime() - new Date(a.tanggal_lulus).getTime());

  const currentProgress = selectedSiswaId ? getSiswaProgress(selectedSiswaId) : { bantaraCount: 0, laksanaCount: 0, bantaraPct: 0, laksanaPct: 0, verifiedBantara: [], verifiedLaksana: [] };

  const isBantaraLulus = selectedSiswa?.status_pelantikan === 'Penegak Bantara' ||
                        selectedSiswa?.status_pelantikan === 'Calon Laksana' ||
                        selectedSiswa?.status_pelantikan === 'Penegak Laksana' ||
                        currentProgress.bantaraPct >= 100;

  return (
    <div className="space-y-6" id="sku_manager_module">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Ujian Syarat Kecakapan Umum (SKU)</h2>
          <p className="text-sm text-gray-400 mt-1">Sertifikasi & verifikasi kelulusan butir SKU Penegak Bantara dan Laksana secara transparan.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center space-x-1.5 text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'matrix' ? 'bg-white text-indigo-950 shadow-xs' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Matriks Ujian</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-1.5 text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'history' ? 'bg-white text-indigo-950 shadow-xs' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Riwayat Kelulusan</span>
          </button>
          <button
            onClick={() => setActiveTab('defs')}
            className={`flex items-center space-x-1.5 text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'defs' ? 'bg-white text-indigo-950 shadow-xs' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Kelola Butir SKU</span>
          </button>
        </div>
      </div>

      {activeTab === 'matrix' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Student Selector sidebar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 h-fit lg:col-span-1 space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Pilih Anggota Aktif</h3>
              <p className="text-[10px] text-gray-400">Pilih kelas & cari nama anggota di bawah</p>
            </div>

            {/* Class Filter Tabs/Pills */}
            <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedKelas('all')}
                className={`flex-1 text-[10px] font-bold py-1 px-2 rounded-lg transition cursor-pointer text-center ${
                  selectedKelas === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Semua
              </button>
              {uniqueClasses.map((kls) => (
                <button
                  type="button"
                  key={kls}
                  onClick={() => setSelectedKelas(kls)}
                  className={`text-[10px] font-bold py-1 px-2 rounded-lg transition cursor-pointer text-center ${
                    selectedKelas === kls
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {kls}
                </button>
              ))}
            </div>

            {/* Live Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama / NIS..."
                value={searchSiswa}
                onChange={(e) => setSearchSiswa(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
              {searchSiswa && (
                <button
                  onClick={() => setSearchSiswa('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredActiveSiswa.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-xs text-gray-400 font-medium">Anggota tidak ditemukan</p>
                </div>
              ) : (
                filteredActiveSiswa.map((s) => {
                  const prog = getSiswaProgress(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSiswaId(s.id)}
                      className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex flex-col space-y-2 ${
                        selectedSiswaId === s.id
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/10'
                          : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-gray-800 line-clamp-1">{s.nama_lengkap}</span>
                        <span className="text-[10px] text-gray-400 font-bold bg-white px-1.5 py-0.5 rounded border border-gray-100">{s.kelas}</span>
                      </div>

                      {/* Progress bantara bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-gray-500 font-medium">
                          <span>Bantara:</span>
                          <span className="font-extrabold text-indigo-600">{prog.bantaraCount}/{bantaraTotal}</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${prog.bantaraPct}%` }} />
                        </div>
                      </div>

                      {/* Progress laksana bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-gray-500 font-medium">
                          <span>Laksana:</span>
                          <span className="font-extrabold text-purple-600">{prog.laksanaCount}/{laksanaTotal}</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                          <div className="bg-purple-500 h-full rounded-full" style={{ width: `${prog.laksanaPct}%` }} />
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Matrix Checklist Area */}
          <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-gray-100 space-y-6">
            {/* Student Details & Global parameters */}
            {selectedSiswa ? (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 gap-4">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-600">Murid Terpilih</span>
                    <h3 className="text-lg font-black text-gray-800 mt-1">{selectedSiswa.nama_lengkap} ({selectedSiswa.kelas})</h3>
                    <p className="text-xs text-gray-400 mt-0.5">NIS: {selectedSiswa.nis} &bull; Keaktifan: Aktif</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100/30 flex flex-col justify-center">
                      <p className="text-[9px] uppercase font-bold text-indigo-500">Bantara</p>
                      <p className="text-xs font-black text-indigo-950">{currentProgress.bantaraCount}/{bantaraTotal} ({currentProgress.bantaraPct}%)</p>
                    </div>
                    <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-100/30 flex flex-col justify-center">
                      <p className="text-[9px] uppercase font-bold text-purple-500">Laksana</p>
                      <p className="text-xs font-black text-purple-950">{currentProgress.laksanaCount}/{laksanaTotal} ({currentProgress.laksanaPct}%)</p>
                    </div>
                  </div>
                </div>

                {/* Level toggle & input parameters */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-gray-50/70 border border-gray-100 rounded-xl">
                  {/* Bantara / Laksana toggle selector */}
                  <div className="flex space-x-1.5 bg-gray-200/60 p-1 rounded-xl w-full md:w-auto">
                    <button
                      onClick={() => setCurrentLevel('Bantara')}
                      className={`flex-1 md:flex-none text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer ${
                        currentLevel === 'Bantara' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      SKU Bantara
                    </button>
                    <button
                      onClick={() => {
                        if (!isBantaraLulus) {
                          alert(`Ujian SKU Laksana belum terbuka untuk ${selectedSiswa.nama_lengkap} karena belum lulus/dilantik sebagai Penegak Bantara.`);
                          return;
                        }
                        setCurrentLevel('Laksana');
                      }}
                      className={`flex-1 md:flex-none text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer ${
                        currentLevel === 'Laksana' ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      SKU Laksana
                    </button>
                  </div>

                  {/* Input parameters applied when checklist toggled */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto text-xs">
                    <div>
                      <input
                        type="date"
                        value={verifikasiTanggal}
                        onChange={(e) => setVerifikasiTanggal(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        title="Tanggal Kelulusan (Saat Checklist Dicentang)"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Nama Penguji"
                        value={verifikatorNama}
                        onChange={(e) => setVerifikatorNama(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full"
                        title="Nama Pembina Penguji"
                      />
                    </div>
                  </div>
                </div>

                {/* SKU Checklist Items */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                    Daftar Butir SKU Penegak {currentLevel}
                  </h4>
                  
                  {currentLevel === 'Laksana' && !isBantaraLulus ? (
                    <div className="p-8 text-center bg-amber-50/50 border border-amber-200/60 rounded-2xl space-y-3 flex flex-col items-center">
                      <div className="p-3 bg-amber-100 text-amber-700 rounded-full">
                        <AlertTriangle className="w-8 h-8" />
                      </div>
                      <h5 className="font-extrabold text-amber-900 text-sm">Tingkat SKU Laksana Terkunci</h5>
                      <p className="text-xs text-amber-700 max-w-md leading-relaxed text-center">
                        Anggota ini belum lulus/dilantik sebagai <b>Penegak Bantara</b>. Anda harus melengkapi seluruh butir ujian SKU Bantara dan melantiknya sebelum membuka lembar ujian SKU Laksana.
                      </p>
                      <button
                        type="button"
                        onClick={() => setCurrentLevel('Bantara')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-xs transition"
                      >
                        Kembali ke SKU Bantara
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                      {(currentLevel === 'Bantara' ? bantaraDefs : laksanaDefs).map((def) => {
                      const no = def.no_item;
                      const activeVerifiedList = currentLevel === 'Bantara' ? currentProgress.verifiedBantara : currentProgress.verifiedLaksana;
                      const existingRecord = activeVerifiedList.find((item) => item.no_item_sku === no);
                      const isVerified = !!existingRecord;

                      return (
                        <div
                          key={def.id}
                          onClick={() => handleCardClick(def, isVerified, existingRecord)}
                          className={`flex items-start space-x-3 p-3.5 rounded-xl border cursor-pointer select-none transition ${
                            isVerified
                              ? currentLevel === 'Bantara'
                                ? 'bg-indigo-50/40 border-indigo-200 hover:bg-indigo-50'
                                : 'bg-purple-50/40 border-purple-200 hover:bg-purple-50'
                              : 'bg-white border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <div className="pt-0.5">
                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-black transition ${
                              isVerified 
                                ? currentLevel === 'Bantara' ? 'bg-indigo-600 text-white' : 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-400'
                            }`}>
                              {isVerified ? '✓' : no}
                            </span>
                          </div>

                          <div className="flex-1 space-y-1">
                            <p className="text-xs font-bold text-gray-800 leading-snug">
                              Butir {no}
                            </p>
                            <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                              {def.deskripsi}
                            </p>
                            {isVerified && existingRecord && (
                              <p className="text-[9px] text-emerald-600 font-extrabold flex items-center bg-emerald-100/30 px-1.5 py-0.5 rounded w-fit mt-1">
                                <UserCheck className="w-2.5 h-2.5 mr-1" />
                                Lulus {new Date(existingRecord.tanggal_lulus).toLocaleDateString('id-ID')}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-center py-20 text-gray-400 text-sm">Tidak ada murid aktif terpilih.</p>
            )}
          </div>
        </div>
      ) : activeTab === 'history' ? (
        /* SKU History Log view */
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <ClipboardList className="w-5 h-5 mr-2 text-indigo-500" />
                Daftar Riwayat Kelulusan SKU Murid
              </h3>
              <p className="text-xs text-gray-400 mt-1">Seluruh butir SKU yang sudah diverifikasi lulus bagi semua murid aktif.</p>
            </div>

            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Cari murid, kelas, tingkat, no butir..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-3">Murid</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3 text-center">Tingkat</th>
                  <th className="p-3 text-center">Butir SKU</th>
                  <th className="p-3">Deskripsi SKU</th>
                  <th className="p-3">Tanggal Lulus</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
                {historyList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      Tidak ada riwayat kelulusan SKU yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  historyList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/40 transition">
                      <td className="p-3 font-extrabold text-gray-800">{item.studentName}</td>
                      <td className="p-3 font-semibold text-gray-400">{item.studentKelas}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          item.tingkat === 'Laksana' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {item.tingkat}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-amber-50 text-amber-700 font-black border border-amber-100 px-2 py-0.5 rounded text-[10px]">
                          Butir {item.no_item_sku}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-gray-500 truncate max-w-xs" title={item.itemDeskripsi}>
                        {item.itemDeskripsi}
                      </td>
                      <td className="p-3 text-gray-400 font-semibold">
                        {new Date(item.tanggal_lulus).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3">
                        {!readOnly ? (
                          <button
                            onClick={() => {
                              if (confirm(`Batalkan kelulusan SKU Butir ${item.no_item_sku} untuk ${item.studentName}?`)) {
                                onUnverify(item.id);
                              }
                            }}
                            className="text-rose-600 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 font-bold px-2 py-1 rounded transition cursor-pointer animate-pulse-once"
                          >
                            Batalkan ×
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[10px] italic">Terkunci</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kelola SKU Definitions Tab */
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-indigo-500" />
                Daftar Butir Syarat Kecakapan Umum (SKU)
              </h3>
              <p className="text-xs text-gray-400 mt-1">Sengaja didesain dinamis. Tambah, edit, dan hapus butir SKU Bantara & Laksana di sini.</p>
            </div>

            <button
              onClick={startAddDef}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Butir SKU</span>
            </button>
          </div>

          {/* Form for SKU Definition creation / edit */}
          {showDefForm && (
            <form onSubmit={handleDefSubmit} className="bg-gray-50 border border-gray-100 p-5 rounded-2xl space-y-4 animate-fade-in">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center">
                {editingDef ? <Edit2 className="w-4 h-4 mr-1 text-indigo-500" /> : <Plus className="w-4 h-4 mr-1 text-indigo-500" />}
                {editingDef ? 'Edit Butir SKU' : 'Tambah Butir SKU Baru'}
              </h4>

              {defError && (
                <div className="bg-rose-50 text-rose-700 border border-rose-200 p-3 rounded-xl text-xs font-semibold">
                  {defError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tingkat SKU</label>
                  <select
                    value={defTingkat}
                    onChange={(e) => {
                      const l = e.target.value as 'Bantara' | 'Laksana';
                      setDefTingkat(l);
                      // Recalculate default next no
                      const currentDefs = l === 'Bantara' ? bantaraDefs : laksanaDefs;
                      const nextNo = currentDefs.length > 0 ? Math.max(...currentDefs.map(d => d.no_item)) + 1 : 1;
                      setDefNo(nextNo);
                    }}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="Bantara">Bantara</option>
                    <option value="Laksana">Laksana</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">No Butir SKU</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={defNo}
                    onChange={(e) => setDefNo(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Deskripsi Syarat Kecakapan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Selalu taat menjalankan ibadah agamanya secara pribadi..."
                    value={defDeskripsi}
                    onChange={(e) => setDefDeskripsi(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end border-t border-gray-200/50 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDefForm(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  {editingDef ? 'Simpan Perubahan' : 'Simpan Butir Baru'}
                </button>
              </div>
            </form>
          )}

          {/* List of current SKU item definitions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bantara definitions */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100/50">
                Tingkat Bantara ({bantaraDefs.length} Butir)
              </h4>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 text-xs">
                {bantaraDefs.map((def) => (
                  <div key={def.id} className="bg-white border border-gray-100 p-3 rounded-xl flex items-start justify-between gap-3 hover:bg-gray-50/50 transition">
                    <div className="flex-1">
                      <p className="font-extrabold text-indigo-950">Butir {def.no_item}</p>
                      <p className="text-[11px] text-gray-400 font-semibold leading-relaxed mt-0.5">{def.deskripsi}</p>
                    </div>
                    <div className="flex space-x-1.5 shrink-0">
                      <button
                        onClick={() => startEditDef(def)}
                        className="p-1 bg-gray-50 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Edit Butir"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus butir SKU Bantara No ${def.no_item}? (PENTING: Seluruh riwayat kelulusan murid terkait butir ini juga akan terhapus).`)) {
                            onDeleteSkuDef(def.id);
                          }
                        }}
                        className="p-1 bg-gray-50 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Hapus Butir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Laksana definitions */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-2 rounded-xl border border-purple-100/50">
                Tingkat Laksana ({laksanaDefs.length} Butir)
              </h4>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 text-xs">
                {laksanaDefs.map((def) => (
                  <div key={def.id} className="bg-white border border-gray-100 p-3 rounded-xl flex items-start justify-between gap-3 hover:bg-gray-50/50 transition">
                    <div className="flex-1">
                      <p className="font-extrabold text-purple-950">Butir {def.no_item}</p>
                      <p className="text-[11px] text-gray-400 font-semibold leading-relaxed mt-0.5">{def.deskripsi}</p>
                    </div>
                    <div className="flex space-x-1.5 shrink-0">
                      <button
                        onClick={() => startEditDef(def)}
                        className="p-1 bg-gray-50 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                        title="Edit Butir"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus butir SKU Laksana No ${def.no_item}? (PENTING: Seluruh riwayat kelulusan murid terkait butir ini juga akan terhapus).`)) {
                            onDeleteSkuDef(def.id);
                          }
                        }}
                        className="p-1 bg-gray-50 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Hapus Butir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for editing status (Lulus / Tidak Lulus) of SKU item */}
      {editingSKU && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 max-w-md w-full shadow-2xl p-6 relative">
            <button
              onClick={() => setEditingSKU(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
              <Award className="w-5 h-5 mr-2 text-indigo-600" />
              Edit Status Kelulusan SKU
            </h3>
            
            <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100/50 mb-4 text-xs">
              <p className="font-extrabold text-indigo-950">Tingkat {editingSKU.def.tingkat} &bull; Butir {editingSKU.def.no_item}</p>
              <p className="text-gray-500 font-semibold mt-1 leading-relaxed">{editingSKU.def.deskripsi}</p>
            </div>

            <div className="space-y-4">
              {/* Toggle Lulus vs Tidak Lulus */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Status Kelulusan</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalStatusLulus(true)}
                    className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                      modalStatusLulus
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-base">✓</span>
                    <span>Lulus</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStatusLulus(false)}
                    className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                      !modalStatusLulus
                        ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm">×</span>
                    <span>Tidak Lulus</span>
                  </button>
                </div>
              </div>

              {modalStatusLulus && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Tanggal Kelulusan</label>
                    <input
                      type="date"
                      value={modalTanggal}
                      onChange={(e) => setModalTanggal(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Nama Pembina Penguji</label>
                    <input
                      type="text"
                      placeholder="Nama Penguji"
                      value={modalPenguji}
                      onChange={(e) => setModalPenguji(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingSKU(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold py-2.5 rounded-xl transition cursor-pointer"
                >
                  {readOnly ? 'Tutup' : 'Batal'}
                </button>
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={handleSaveModalSKU}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                ) : (
                  <div className="flex-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold py-2.5 px-3 rounded-xl text-center flex items-center justify-center">
                    <span>Hanya Lihat (Terkunci)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
