import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DewanAmbalan, Siswa, SusunanPengurusDewan, MabigusMember, GudepMember } from '../types';
import { initialMabigus, initialGudepPutra, initialGudepPutri } from '../data/seedData';
import { 
  Users2, 
  Crown, 
  ShieldCheck, 
  Plus, 
  Calendar, 
  Scroll, 
  CheckCircle2, 
  X, 
  Award, 
  Sparkles, 
  BookOpen, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Compass, 
  FileSpreadsheet, 
  Layers, 
  Flame, 
  Star, 
  UserCheck, 
  Briefcase, 
  ChevronRight, 
  RotateCcw, 
  Edit3,
  Landmark,
  Building,
  GraduationCap,
  Shield
} from 'lucide-react';

interface DewanAmbalanManagerProps {
  dewanList: DewanAmbalan[];
  siswa: Siswa[];
  onAddDewan: (dewan: Omit<DewanAmbalan, 'id'>) => void;
  onUpdateDewan: (dewan: DewanAmbalan) => void;
  onDeleteDewan: (id: string) => void;
  onResetOfficial?: () => void;
  readOnly?: boolean;
}

export const DewanAmbalanManager: React.FC<DewanAmbalanManagerProps> = ({
  dewanList,
  siswa,
  onAddDewan,
  onUpdateDewan,
  onDeleteDewan,
  onResetOfficial,
  readOnly = false,
}) => {
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<string>(() => {
    const target2026 = dewanList.find(d => d.id === 'da_2026' || d.periode === '2026-2027' || d.tahun_ajaran === '2026-2027');
    if (target2026) return target2026.id;
    const active = dewanList.find(d => d.is_active || d.is_aktif);
    return active ? active.id : (dewanList.length > 0 ? dewanList[0].id : '');
  });

  const userSelectedRef = useRef(false);

  // Automatically keep 2026-2027 selected as current active period unless manually switched
  useEffect(() => {
    if (!dewanList || dewanList.length === 0) return;
    if (userSelectedRef.current) return;

    const target2026 = dewanList.find(d => d.id === 'da_2026' || d.periode === '2026-2027' || d.tahun_ajaran === '2026-2027');
    const active = target2026 || dewanList.find(d => d.is_active || d.is_aktif) || dewanList[0];
    if (active && selectedPeriodeId !== active.id) {
      setSelectedPeriodeId(active.id);
    }
  }, [dewanList]);

  const [activeTab, setActiveTab] = useState<'bagan' | 'gudep' | 'pengurus' | 'divisi' | 'sertijab'>('bagan');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivisi, setSelectedDivisi] = useState<string>('Semua');
  const [selectedTingkat, setSelectedTingkat] = useState<string>('Semua');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal Tambah Periode
  const [isAddPeriodeModalOpen, setIsAddPeriodeModalOpen] = useState(false);
  const [newPeriode, setNewPeriode] = useState('2026-2027');
  const [newPradanaPa, setNewPradanaPa] = useState('');
  const [newPradanaPi, setNewPradanaPi] = useState('');
  const [newKerani, setNewKerani] = useState('');
  const [newBankir, setNewBankir] = useState('');
  const [newPemangkuAdatPa, setNewPemangkuAdatPa] = useState('');
  const [newPemangkuAdatPi, setNewPemangkuAdatPi] = useState('');
  const [newVisiMisi, setNewVisiMisi] = useState('');

  // Modal Tambah / Edit Pengurus
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
  const [memberSiswaId, setMemberSiswaId] = useState('');
  const [memberNama, setMemberNama] = useState('');
  const [memberKelas, setMemberKelas] = useState('');
  const [memberJabatan, setMemberJabatan] = useState('Staff Pradana');
  const [memberDivisi, setMemberDivisi] = useState('Pradana');
  const [memberIsStaff, setMemberIsStaff] = useState(false);
  const [memberTugas, setMemberTugas] = useState('');
  const [memberJenisKelamin, setMemberJenisKelamin] = useState<'L' | 'P'>('L');

  const currentDewan = dewanList.find(d => d.id === selectedPeriodeId) || dewanList[0];

  // Quick Division Filter Options
  const divisiList = [
    { id: 'Semua', label: 'Semua Divisi' },
    { id: 'Dewan Kehormatan', label: 'Dewan Kehormatan' },
    { id: 'Pemangku Adat', label: 'Pemangku Adat' },
    { id: 'Penegak Pradana', label: 'Penegak Pradana' },
    { id: 'Pradana', label: 'Pradana' },
    { id: 'Wakil Pradana', label: 'Wakil Pradana' },
    { id: 'Krani', label: 'Krani' },
    { id: 'Bendahara', label: 'Bendahara' },
    { id: 'Giatop', label: 'Giatop' },
    { id: 'Tekram', label: 'Tekram' },
    { id: 'Staff', label: 'Khusus Staff' }
  ];

  // Filtered members list
  const filteredMembers = useMemo(() => {
    if (!currentDewan || !currentDewan.susunan_pengurus) return [];
    return currentDewan.susunan_pengurus.filter(m => {
      // Search
      const query = searchQuery.toLowerCase().trim();
      const matchSearch = !query || 
        m.nama.toLowerCase().includes(query) ||
        m.kelas.toLowerCase().includes(query) ||
        m.jabatan.toLowerCase().includes(query) ||
        (m.divisi && m.divisi.toLowerCase().includes(query)) ||
        (m.tugas_pokok && m.tugas_pokok.toLowerCase().includes(query));

      // Divisi Filter
      let matchDivisi = true;
      if (selectedDivisi === 'Staff') {
        matchDivisi = Boolean(m.is_staff || m.jabatan.toLowerCase().includes('staff'));
      } else if (selectedDivisi !== 'Semua') {
        matchDivisi = m.divisi === selectedDivisi || m.jabatan.toLowerCase().includes(selectedDivisi.toLowerCase());
      }

      // Tingkat Filter (Kelas XII vs XI vs X)
      let matchTingkat = true;
      if (selectedTingkat === 'XII') {
        matchTingkat = m.kelas.startsWith('XII');
      } else if (selectedTingkat === 'XI') {
        matchTingkat = m.kelas.startsWith('XI');
      } else if (selectedTingkat === 'X') {
        matchTingkat = m.kelas.startsWith('X');
      }

      return matchSearch && matchDivisi && matchTingkat;
    });
  }, [currentDewan, searchQuery, selectedDivisi, selectedTingkat]);

  // Statistics
  const stats = useMemo(() => {
    const list = currentDewan?.susunan_pengurus || [];
    const total = list.length;
    const kelasXII = list.filter(m => m.kelas.startsWith('XII')).length;
    const kelasXI = list.filter(m => m.kelas.startsWith('XI')).length;
    const staffCount = list.filter(m => m.is_staff || m.jabatan.toLowerCase().includes('staff')).length;
    const putra = list.filter(m => m.jenis_kelamin === 'L').length;
    const putri = list.filter(m => m.jenis_kelamin === 'P').length;
    return { total, kelasXII, kelasXI, staffCount, putra, putri };
  }, [currentDewan]);

  const handleCreatePeriode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriode.trim()) {
      alert('Periode wajib diisi!');
      return;
    }

    onAddDewan({
      periode: newPeriode.trim(),
      pradana_putra: newPradanaPa.trim() || 'Pradana Putra',
      pradana_putri: newPradanaPi.trim() || 'Pradana Putri',
      kerani: newKerani.trim() || 'Kerani Ambalan',
      bankir: newBankir.trim() || 'Bankir Ambalan',
      pemangku_adat_putra: newPemangkuAdatPa.trim() || 'Pemangku Adat Putra',
      pemangku_adat_putri: newPemangkuAdatPi.trim() || 'Pemangku Adat Putri',
      visi_misi: newVisiMisi.trim() || 'Mewujudkan Pramuka Penegak yang Mandiri, Disiplin, dan Berakhlak Mulia',
      is_active: false,
      susunan_pengurus: []
    });

    setIsAddPeriodeModalOpen(false);
  };

  const handleOpenAddMember = () => {
    setEditingMemberIndex(null);
    setMemberSiswaId('');
    setMemberNama('');
    setMemberKelas('');
    setMemberJabatan('Staff Pradana');
    setMemberDivisi('Pradana');
    setMemberIsStaff(true);
    setMemberTugas('');
    setMemberJenisKelamin('L');
    setIsAddMemberModalOpen(true);
  };

  const handleOpenEditMember = (index: number) => {
    if (!currentDewan) return;
    const item = currentDewan.susunan_pengurus[index];
    setEditingMemberIndex(index);
    setMemberSiswaId(item.siswa_id || '');
    setMemberNama(item.nama);
    setMemberKelas(item.kelas);
    setMemberJabatan(item.jabatan);
    setMemberDivisi(item.divisi || 'Pradana');
    setMemberIsStaff(Boolean(item.is_staff));
    setMemberTugas(item.tugas_pokok || '');
    setMemberJenisKelamin(item.jenis_kelamin || 'L');
    setIsAddMemberModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDewan) return;

    let finalNama = memberNama.trim();
    let finalKelas = memberKelas.trim();
    let finalSiswaId = memberSiswaId;

    if (memberSiswaId) {
      const found = siswa.find(s => s.id === memberSiswaId);
      if (found) {
        finalNama = found.nama_lengkap;
        finalKelas = found.kelas;
      }
    }

    if (!finalNama || !finalKelas) {
      alert('Nama dan Kelas wajib diisi!');
      return;
    }

    const newEntry: SusunanPengurusDewan = {
      siswa_id: finalSiswaId || `da_custom_${Date.now()}`,
      nama: finalNama,
      kelas: finalKelas,
      jabatan: memberJabatan,
      divisi: memberDivisi,
      is_staff: memberIsStaff,
      tugas_pokok: memberTugas.trim() || undefined,
      jenis_kelamin: memberJenisKelamin
    };

    let updatedSusunan: SusunanPengurusDewan[];
    if (editingMemberIndex !== null) {
      updatedSusunan = [...currentDewan.susunan_pengurus];
      updatedSusunan[editingMemberIndex] = newEntry;
    } else {
      updatedSusunan = [...currentDewan.susunan_pengurus, newEntry];
    }

    onUpdateDewan({
      ...currentDewan,
      susunan_pengurus: updatedSusunan
    });

    setIsAddMemberModalOpen(false);
  };

  const handleRemoveMember = (index: number) => {
    if (!currentDewan) return;
    if (!confirm('Apakah Anda yakin ingin menghapus anggota ini dari kepengurusan Dewan Ambalan?')) return;
    const updated = [...currentDewan.susunan_pengurus];
    updated.splice(index, 1);
    onUpdateDewan({
      ...currentDewan,
      susunan_pengurus: updated
    });
  };

  const handleSetActivePeriod = (dewan: DewanAmbalan) => {
    userSelectedRef.current = true;
    setSelectedPeriodeId(dewan.id);
    dewanList.forEach(d => {
      onUpdateDewan({
        ...d,
        is_active: d.id === dewan.id,
        is_aktif: d.id === dewan.id
      });
    });
  };

  const handleExportCSV = () => {
    if (!currentDewan || !currentDewan.susunan_pengurus.length) return;
    const headers = ['No', 'Nama Lengkap', 'Kelas', 'Divisi', 'Jabatan', 'Staff', 'Tugas Pokok'];
    const rows = currentDewan.susunan_pengurus.map((m, idx) => [
      idx + 1,
      `"${m.nama}"`,
      `"${m.kelas}"`,
      `"${m.divisi || '-'}"`,
      `"${m.jabatan}"`,
      m.is_staff ? 'Ya' : 'Tidak',
      `"${m.tugas_pokok || '-'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dewan_Ambalan_SMK_Bakti_Idhata_${currentDewan.periode.replace('/', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-13 h-13 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-full uppercase tracking-wider">
                  SMK Bakti Idhata
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                  {stats.total} Personel Resmi
                </span>
                <span className="text-xs text-gray-400 font-semibold">Gugus Depan Jakarta Selatan</span>
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight mt-1">
                Struktur Organisasi Dewan Ambalan
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Bagan komando, divisi operasional, dan susunan pimpinan ambalan putra & putri masa bakti resmi.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Periode selector */}
            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Tahun Ajaran:</span>
              <select
                value={selectedPeriodeId}
                onChange={(e) => {
                  userSelectedRef.current = true;
                  setSelectedPeriodeId(e.target.value);
                }}
                className="bg-transparent focus:outline-none text-gray-900 font-black cursor-pointer"
              >
                {dewanList.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.tahun_ajaran || d.periode} {d.is_active ? '★ (Aktif)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {!readOnly && onResetOfficial && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Sinkronkan struktur ke susunan resmi Dewan Ambalan SMK Bakti Idhata (33 Personel: Dewan Kehormatan s/d Tekram)?')) {
                    onResetOfficial();
                  }
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition cursor-pointer"
                title="Muat Ulang Struktur Resmi SMK Bakti Idhata"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Sinkron Resmi</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold transition cursor-pointer"
              title="Unduh file CSV"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold transition cursor-pointer"
              title="Cetak Struktur Organisasi"
            >
              <Printer className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            {!readOnly ? (
              <button
                type="button"
                onClick={() => setIsAddPeriodeModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Periode Baru</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl">
                Mode Pengawas: Hanya Lihat
              </span>
            )}
          </div>
        </div>

        {/* Quick Highlights Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-gray-100 text-xs">
          <div className="bg-amber-50/50 rounded-xl p-2.5 border border-amber-100 flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              {stats.total}
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Total Personel</span>
              <span className="font-extrabold text-gray-800">33 Pengurus</span>
            </div>
          </div>

          <div className="bg-indigo-50/50 rounded-xl p-2.5 border border-indigo-100 flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-black">
              {stats.kelasXII}
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Tingkat Penegak</span>
              <span className="font-extrabold text-gray-800">Kelas XII (Laksana)</span>
            </div>
          </div>

          <div className="bg-blue-50/50 rounded-xl p-2.5 border border-blue-100 flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-black">
              {stats.kelasXI}
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Kader Bantara</span>
              <span className="font-extrabold text-gray-800">Kelas XI (Bantara)</span>
            </div>
          </div>

          <div className="bg-emerald-50/50 rounded-xl p-2.5 border border-emerald-100 flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              {stats.staffCount}
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Staff Pembantu</span>
              <span className="font-extrabold text-gray-800">14 Staff Khusus</span>
            </div>
          </div>

          <div className="bg-purple-50/50 rounded-xl p-2.5 border border-purple-100 col-span-2 sm:col-span-1 flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-black">
              9
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Departemen</span>
              <span className="font-extrabold text-gray-800">Struktur Lengkap</span>
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-wrap items-center justify-between mt-5 pt-3 border-t border-gray-100 gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('bagan')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'bagan'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Hierarki Komando Penegak</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gudep')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'gudep'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Mabigus & Gudep (06.193 - 06.194)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pengurus')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'pengurus'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users2 className="w-3.5 h-3.5" />
              <span>Susunan Pengurus ({stats.total})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('divisi')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'divisi'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Departemen & Divisi Kerja</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sertijab')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'sertijab'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Scroll className="w-3.5 h-3.5" />
              <span>Visi Misi & Berita Acara</span>
            </button>
          </div>

          {currentDewan && !currentDewan.is_active && (
            <button
              type="button"
              onClick={() => handleSetActivePeriod(currentDewan)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Jadikan Periode Aktif
            </button>
          )}
        </div>
      </div>

      {currentDewan && (
        <>
          {/* ========================================================================= */}
          {/* 1. BAGAN STRUKTUR ORGANISASI (ORGANOGRAM) TAB                             */}
          {/* ========================================================================= */}
          {activeTab === 'bagan' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-8">
              <div className="text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-black rounded-full border border-amber-200">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>DEWAN AMBALAN SMK BAKTI IDHATA JAKARTA SELATAN</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 mt-2">
                  Hierarki Komando & Struktur Dewan Ambalan Tahun Ajaran {currentDewan.tahun_ajaran || currentDewan.periode || '2026-2027'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Gugus Depan Putra 06.193 (Ambalan Ki Hajar Dewantara) & Gugus Depan Putri 06.194 (Ambalan Dewi Sartika) • Tahun Ajaran {currentDewan.tahun_ajaran || '2026-2027'}
                </p>
              </div>

              {/* Organogram Flow */}
              <div className="flex flex-col items-center space-y-6 pt-2">
                {/* 1. PEMBINA SATUAN PUTRA & PUTRI (GUGUS DEPAN) */}
                <div className="w-full max-w-3xl">
                  <div className="text-center mb-2">
                    <span className="px-3 py-0.5 bg-amber-500 text-gray-950 text-[10px] font-black rounded-full uppercase tracking-wider shadow-xs">
                      Pimpinan Pembina Gugus Depan & Satuan Ambalan
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pembina Satuan Putra */}
                    <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-blue-900/60 relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-md border border-blue-400/30 uppercase">
                          Gudep Putra 06.193
                        </span>
                        <Shield className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Pembina Satuan Putra
                      </span>
                      <h4 className="text-sm font-black text-white mt-0.5">
                        Kak Sultan Haidar Basyar, S. Pd
                      </h4>
                      <p className="text-[11px] text-blue-300 font-medium mt-0.5">
                        Wakil Kepala Sekolah Bid. Hubin • Ambalan Ki Hajar Dewantara
                      </p>
                    </div>

                    {/* Pembina Satuan Putri */}
                    <div className="bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-rose-900/60 relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-bold rounded-md border border-rose-400/30 uppercase">
                          Gudep Putri 06.194
                        </span>
                        <Shield className="w-4 h-4 text-rose-400" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Pembina Satuan Putri
                      </span>
                      <h4 className="text-sm font-black text-white mt-0.5">
                        Kak Jihan Fadhilah, S. Kom
                      </h4>
                      <p className="text-[11px] text-rose-300 font-medium mt-0.5">
                        Guru dan Pembina Pramuka • Ambalan Dewi Sartika
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-gray-300"></div>

                {/* 2. DEWAN KEHORMATAN (Badan Pertimbangan & Kehormatan) */}
                <div className="w-full max-w-3xl bg-amber-50/80 rounded-2xl p-5 border-2 border-amber-300/80 shadow-xs relative">
                  <div className="flex items-center justify-between pb-3 border-b border-amber-200/80 mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-amber-950 uppercase tracking-wide block">
                          Dewan Kehormatan Ambalan
                        </span>
                        <span className="text-[10px] text-amber-800 block">
                          Badan penasehat, pertimbangan kehormatan adat, dan pengawas kode etik ambalan
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-amber-200/80 text-amber-900 text-[10px] font-black rounded-full">
                      Tingkat XII
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3 border border-amber-200 shadow-2xs flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xs">
                          MK
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-amber-800 block uppercase">Dewan Kehormatan Putra</span>
                          <span className="font-black text-xs text-gray-900 block">Malik Khadafi Al Ghoni</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-lg">
                        XII TKJ
                      </span>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-amber-200 shadow-2xs flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-black text-xs">
                          DR
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-amber-800 block uppercase">Dewan Kehormatan Putri</span>
                          <span className="font-black text-xs text-gray-900 block">Della Rizkyani</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-lg">
                        XII DKV 2
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-gray-300"></div>

                {/* PEMANGKU ADAT & STAFF */}
                <div className="w-full max-w-4xl bg-indigo-50/70 rounded-2xl p-5 border border-indigo-200 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-indigo-100 mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-indigo-950 uppercase tracking-wide block">
                          Pemangku Adat & Staff Ambalan
                        </span>
                        <span className="text-[10px] text-indigo-700 block">
                          Penjaga adat sandi ambalan, tata krama kepramukaan, dan penegak disiplin anggota
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-indigo-700 font-bold">4 Personel</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white rounded-xl p-3 border border-indigo-100">
                      <span className="text-[9px] font-bold text-indigo-500 uppercase block">Pemangku Adat Putra</span>
                      <span className="text-xs font-black text-gray-900 block mt-0.5">Daffa Arya Perkasa</span>
                      <span className="text-[10px] text-gray-500 font-semibold block">XII RPL</span>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-indigo-100">
                      <span className="text-[9px] font-bold text-indigo-500 uppercase block">Pemangku Adat Putri</span>
                      <span className="text-xs font-black text-gray-900 block mt-0.5">Khalifah Azzahra</span>
                      <span className="text-[10px] text-gray-500 font-semibold block">XII DKV 2</span>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-indigo-100">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase block">Staff Pemangku Adat Putra</span>
                      <span className="text-xs font-black text-gray-900 block mt-0.5">Sabian Attila Taftazani Artha</span>
                      <span className="text-[10px] text-indigo-700 font-bold block">XI RPL</span>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-indigo-100">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase block">Staff Pemangku Adat Putri</span>
                      <span className="text-xs font-black text-gray-900 block mt-0.5">Aurelia Khanza Sabrina Sari</span>
                      <span className="text-[10px] text-indigo-700 font-bold block">XI RPL</span>
                    </div>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-gray-300"></div>

                {/* TRIO PIMPINAN: PENEGAK PRADANA, PRADANA, WAKIL PRADANA */}
                <div className="w-full max-w-4xl space-y-4">
                  <div className="text-center">
                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                      Pucuk Pimpinan Dewan Ambalan
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* A. Penegak Pradana */}
                    <div className="bg-gradient-to-b from-amber-50/70 to-white rounded-2xl p-4 border border-amber-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-md uppercase">
                            Penegak Pradana
                          </span>
                          <Crown className="w-4 h-4 text-amber-600" />
                        </div>
                        <p className="text-[10px] text-gray-500 mb-3">
                          Pimpinan penegak pengarah garis besar kebijakan strategis ambalan
                        </p>

                        <div className="space-y-2">
                          <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                            <span className="text-[9px] font-bold text-gray-400 block uppercase">Penegak Pradana Putra</span>
                            <span className="text-xs font-black text-gray-900 block">Raditya</span>
                            <span className="text-[10px] text-amber-700 font-semibold">XII DKV 2</span>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                            <span className="text-[9px] font-bold text-gray-400 block uppercase">Penegak Pradana Putri</span>
                            <span className="text-xs font-black text-gray-900 block">Nayla Janeeta</span>
                            <span className="text-[10px] text-amber-700 font-semibold">XII DKV 2</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-amber-100/80">
                        <span className="text-[10px] font-bold text-gray-500 block mb-1">Staff Penegak Pradana:</span>
                        <div className="space-y-1 text-[10px]">
                          <div className="px-2 py-1 bg-amber-50 text-amber-950 rounded-md font-bold border border-amber-200">
                            Zainun Ghilman Aziz (XI RPL)
                          </div>
                          <div className="px-2 py-1 bg-amber-50 text-amber-950 rounded-md font-bold border border-amber-200">
                            Carissa Rahma Zahirah (XI DKV 2)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* B. Pradana (Ketua Harian) */}
                    <div className="bg-gradient-to-b from-amber-100/50 to-white rounded-2xl p-4 border-2 border-amber-400 shadow-sm flex flex-col justify-between relative">
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-600 text-white text-[9px] font-black rounded-full uppercase tracking-wider">
                        Ketua Harian Dewan Ambalan
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2 mt-1">
                          <span className="px-2 py-0.5 bg-amber-200 text-amber-950 text-[10px] font-black rounded-md uppercase">
                            Pradana Harian
                          </span>
                          <Flame className="w-4 h-4 text-amber-700" />
                        </div>
                        <p className="text-[10px] text-gray-500 mb-3">
                          Ketua harian penanggung jawab seluruh dinamika dan operasional ambalan
                        </p>

                        <div className="space-y-2">
                          <div className="p-2.5 bg-white rounded-xl border border-amber-300">
                            <span className="text-[9px] font-bold text-gray-400 block uppercase">Pradana Putra</span>
                            <span className="text-xs font-black text-gray-900 block">Yasir Hidayatullah</span>
                            <span className="text-[10px] text-amber-800 font-bold">XII TKJ</span>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-amber-300">
                            <span className="text-[9px] font-bold text-gray-400 block uppercase">Pradana Putri</span>
                            <span className="text-xs font-black text-gray-900 block">Bilqis Suci Makayla</span>
                            <span className="text-[10px] text-amber-800 font-bold">XII DKV 2</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-amber-200">
                        <span className="text-[10px] font-bold text-gray-500 block mb-1">Staff Pradana:</span>
                        <div className="space-y-1 text-[10px]">
                          <div className="px-2 py-1 bg-amber-50 text-amber-950 rounded-md font-bold border border-amber-200">
                            Dimas Aditya (XI RPL)
                          </div>
                          <div className="px-2 py-1 bg-amber-50 text-amber-950 rounded-md font-bold border border-amber-200">
                            Julfa Khairanih (XI DKV 2)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* C. Wakil Pradana */}
                    <div className="bg-gradient-to-b from-amber-50/70 to-white rounded-2xl p-4 border border-amber-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-md uppercase">
                            Wakil Pradana
                          </span>
                          <Users2 className="w-4 h-4 text-amber-600" />
                        </div>
                        <p className="text-[10px] text-gray-500 mb-3">
                          Wakil ketua bidang pengawasan internal sangga dan koordinasi seksi
                        </p>

                        <div className="space-y-2">
                          <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                            <span className="text-[9px] font-bold text-gray-400 block uppercase">Wakil Pradana Putra</span>
                            <span className="text-xs font-black text-gray-900 block">Rizky Anugrah Ramadhan</span>
                            <span className="text-[10px] text-amber-700 font-semibold">XII TKJ</span>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                            <span className="text-[9px] font-bold text-gray-400 block uppercase">Wakil Pradana Putri</span>
                            <span className="text-xs font-black text-gray-900 block">Intan Ayyu Nur Aini</span>
                            <span className="text-[10px] text-amber-700 font-semibold">XII DKV 1</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-amber-100/80">
                        <span className="text-[10px] font-bold text-gray-500 block mb-1">Staff Wakil Pradana:</span>
                        <div className="space-y-1 text-[10px]">
                          <div className="px-2 py-1 bg-amber-50 text-amber-950 rounded-md font-bold border border-amber-200">
                            Raffael Zaidan Alfaridzi (XI RPL)
                          </div>
                          <div className="px-2 py-1 bg-amber-50 text-amber-950 rounded-md font-bold border border-amber-200">
                            Najla Amelia Kirana (XI DKV 2)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-gray-300"></div>

                {/* BIRO ADMINISTRASI & KEUANGAN (KRANI & BENDAHARA) */}
                <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Krani */}
                  <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-200 shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-blue-100 mb-3">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-blue-700" />
                        <span className="text-xs font-black text-blue-950 uppercase tracking-wide">
                          Krani (Sekretariat & Arsip)
                        </span>
                      </div>
                      <span className="text-[10px] text-blue-700 font-bold">4 Personel</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                          <span className="text-[9px] text-blue-600 font-bold block">Krani Putra</span>
                          <span className="font-extrabold text-gray-900 block text-[11px]">Fathier Assyarief</span>
                          <span className="text-[10px] text-gray-500">XII RPL</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                          <span className="text-[9px] text-blue-600 font-bold block">Krani Putri</span>
                          <span className="font-extrabold text-gray-900 block text-[11px]">Siti Humaira Auliahya</span>
                          <span className="text-[10px] text-gray-500">XII DKV 2</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-100">
                        <div className="bg-white/80 p-2 rounded-xl border border-blue-100">
                          <span className="text-[9px] text-gray-400 font-bold block">Staff Krani Putra</span>
                          <span className="font-bold text-gray-800 block text-[11px]">Raihan Nur Irsyad</span>
                          <span className="text-[10px] text-blue-700 font-bold">XI RPL</span>
                        </div>
                        <div className="bg-white/80 p-2 rounded-xl border border-blue-100">
                          <span className="text-[9px] text-gray-400 font-bold block">Staff Krani Putri</span>
                          <span className="font-bold text-gray-800 block text-[11px]">Nadya Ulya Khairunnisa</span>
                          <span className="text-[10px] text-blue-700 font-bold">XI DKV 2</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bendahara */}
                  <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-100 mb-3">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                          Bendahara (Bankir Ambalan)
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold">2 Personel</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-emerald-100">
                        <span className="text-[9px] text-emerald-600 font-bold block">Bendahara Putra</span>
                        <span className="font-extrabold text-gray-900 block text-xs mt-0.5">Sauqi Moebarok</span>
                        <span className="text-[10px] text-emerald-800 font-bold block mt-0.5">XI DKV 2</span>
                        <span className="text-[9px] text-gray-400 block mt-1">Pengelola Kas & Pembukuan</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100">
                        <span className="text-[9px] text-emerald-600 font-bold block">Bendahara Putri</span>
                        <span className="font-extrabold text-gray-900 block text-xs mt-0.5">Hanifah Salsabilla</span>
                        <span className="text-[10px] text-emerald-800 font-bold block mt-0.5">XI DKV 1</span>
                        <span className="text-[9px] text-gray-400 block mt-1">Iuran Mingguan & Anggaran</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-gray-300"></div>

                {/* BIDANG OPERASIONAL & TEKNIK KEPRAMUKAAN (GIATOP & TEKRAM) */}
                <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Giatop */}
                  <div className="bg-orange-50/70 rounded-2xl p-4 border border-orange-200 shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-orange-100 mb-3">
                      <div className="flex items-center space-x-2">
                        <Flame className="w-4 h-4 text-orange-700" />
                        <span className="text-xs font-black text-orange-950 uppercase tracking-wide">
                          Giatop (Kegiatan Operasional)
                        </span>
                      </div>
                      <span className="text-[10px] text-orange-700 font-bold">4 Personel</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white p-2.5 rounded-xl border border-orange-100">
                          <span className="text-[9px] text-orange-600 font-bold block">Giatop Putra</span>
                          <span className="font-extrabold text-gray-900 block text-[11px]">Abdul Hafiidz</span>
                          <span className="text-[10px] text-orange-800 font-bold">XI RPL</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-orange-100">
                          <span className="text-[9px] text-orange-600 font-bold block">Giatop Putri</span>
                          <span className="font-extrabold text-gray-900 block text-[11px]">Osriseffita Nurramadhaniah</span>
                          <span className="text-[10px] text-orange-800 font-bold">XI DKV 1</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-orange-100">
                        <div className="bg-white/80 p-2 rounded-xl border border-orange-100">
                          <span className="text-[9px] text-gray-400 font-bold block">Staff Giatop Putra</span>
                          <span className="font-bold text-gray-800 block text-[11px]">Syahrul Sya'ban</span>
                          <span className="text-[10px] text-orange-700 font-bold">XI RPL</span>
                        </div>
                        <div className="bg-white/80 p-2 rounded-xl border border-orange-100">
                          <span className="text-[9px] text-gray-400 font-bold block">Staff Giatop Putri</span>
                          <span className="font-bold text-gray-800 block text-[11px]">Kanza Dwi Melviana</span>
                          <span className="text-[10px] text-orange-700 font-bold">XI DKV 1</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tekram */}
                  <div className="bg-cyan-50/70 rounded-2xl p-4 border border-cyan-200 shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-cyan-100 mb-3">
                      <div className="flex items-center space-x-2">
                        <Compass className="w-4 h-4 text-cyan-700" />
                        <span className="text-xs font-black text-cyan-950 uppercase tracking-wide">
                          Tekram (Teknik Kepramukaan)
                        </span>
                      </div>
                      <span className="text-[10px] text-cyan-700 font-bold">5 Personel</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="bg-white p-2 rounded-xl border border-cyan-100 text-center">
                          <span className="text-[8px] text-cyan-600 font-bold block">Tekram Putra</span>
                          <span className="font-extrabold text-gray-900 block truncate text-[11px]">Arif Zakariya</span>
                          <span className="text-[9px] text-gray-500">XII TKJ</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-cyan-100 text-center">
                          <span className="text-[8px] text-cyan-600 font-bold block">Tekram Putra</span>
                          <span className="font-extrabold text-gray-900 block truncate text-[11px]">M. Dwikie D.</span>
                          <span className="text-[9px] text-cyan-700 font-bold">XI TKJ</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-cyan-100 text-center">
                          <span className="text-[8px] text-cyan-600 font-bold block">Tekram Putri</span>
                          <span className="font-extrabold text-gray-900 block truncate text-[11px]">Shafa Azalia A.</span>
                          <span className="text-[9px] text-cyan-700 font-bold">XI DKV 2</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-cyan-100">
                        <div className="bg-white/80 p-2 rounded-xl border border-cyan-100">
                          <span className="text-[9px] text-gray-400 font-bold block">Staff Tekram Putra</span>
                          <span className="font-bold text-gray-800 block text-[11px]">Raden Ahmad Faisal M.</span>
                          <span className="text-[10px] text-cyan-700 font-bold">XI DKV 1</span>
                        </div>
                        <div className="bg-white/80 p-2 rounded-xl border border-cyan-100">
                          <span className="text-[9px] text-gray-400 font-bold block">Staff Tekram Putra</span>
                          <span className="font-bold text-gray-800 block text-[11px]">Zayden Athaya N.</span>
                          <span className="text-[10px] text-cyan-700 font-bold">XI TKJ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MABIGUS & GUGUS DEPAN (06.193 & 06.194) TAB                               */}
          {/* ========================================================================= */}
          {activeTab === 'gudep' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-8">
              <div className="text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 text-blue-800 text-xs font-black rounded-full border border-blue-200">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  <span>STRUKTUR ORGANISASI GUGUS DEPAN SMK BAKTI IDHATA</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 mt-2">
                  Majelis Pembimbing Gugusdepan (Mabigus) & Pembina Satuan T.A. 2026-2027
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Gugus Depan Putra 06.193 (Ambalan Ki Hajar Dewantara) & Gugus Depan Putri 06.194 (Ambalan Dewi Sartika)
                </p>
              </div>

              {/* SECTION 1: UNSUR MAJELIS PEMBIMBING GUGUSDEPAN (MABIGUS) */}
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900">
                        Majelis Pembimbing Gugusdepan (Mabigus)
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Pimpinan yayasan, kepala sekolah, pimpinan tata usaha, dan wakil kepala sekolah
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-[10px] font-black rounded-full self-start sm:self-auto">
                    9 Anggota Mabigus
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(currentDewan.mabigus || initialMabigus).map((m, idx) => (
                    <div 
                      key={idx}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-300 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            m.jabatan.includes('Ketua') && !m.jabatan.includes('Wakil') && !m.jabatan.includes('Ex-Officio')
                              ? 'bg-amber-100 text-amber-900'
                              : m.is_ex_officio
                                ? 'bg-indigo-100 text-indigo-900'
                                : 'bg-slate-100 text-slate-700'
                          }`}>
                            {m.jabatan}
                          </span>
                          {m.is_ex_officio && (
                            <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                              Ex-Officio
                            </span>
                          )}
                        </div>
                        <h5 className="text-xs font-black text-gray-900 mt-1">
                          {m.nama}
                        </h5>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center space-x-1.5 text-[10px] text-gray-500">
                        <GraduationCap className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{m.instansi_jabatan}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* UNSUR GUGUSDEPAN PUTRA & PUTRI */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* UNSUR GUDEP PUTRA 06.193 */}
                <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-blue-200">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-blue-950 uppercase tracking-wide">
                          Gugusdepan Putra
                        </h4>
                        <span className="text-[10px] text-blue-700 font-bold block">
                          No. Gudep 06.193 • Ambalan Ki Hajar Dewantara
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-bold rounded-lg">
                      9 Personel
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(currentDewan.gudep_putra || initialGudepPutra).map((m, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs hover:border-blue-300 transition flex items-start justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <span className={`text-[9px] font-black uppercase block ${
                            m.jabatan.includes('Ketua') ? 'text-amber-700' : m.jabatan.includes('Pembina Satuan') ? 'text-blue-700' : 'text-gray-500'
                          }`}>
                            {m.jabatan}
                          </span>
                          <h5 className="text-xs font-black text-gray-900 truncate mt-0.5">
                            {m.nama}
                          </h5>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {m.keterangan}
                          </p>
                        </div>
                        {m.is_ex_officio && (
                          <span className="text-[8px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shrink-0">
                            Ex-Officio
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* UNSUR GUDEP PUTRI 06.194 */}
                <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-rose-200">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black shadow-xs">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-rose-950 uppercase tracking-wide">
                          Gugusdepan Putri
                        </h4>
                        <span className="text-[10px] text-rose-700 font-bold block">
                          No. Gudep 06.194 • Ambalan Dewi Sartika
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-900 text-[10px] font-bold rounded-lg">
                      9 Personel
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(currentDewan.gudep_putri || initialGudepPutri).map((m, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-xl border border-rose-100 shadow-2xs hover:border-rose-300 transition flex items-start justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <span className={`text-[9px] font-black uppercase block ${
                            m.jabatan.includes('Ketua') ? 'text-amber-700' : m.jabatan.includes('Pembina Satuan') ? 'text-rose-700' : 'text-gray-500'
                          }`}>
                            {m.jabatan}
                          </span>
                          <h5 className="text-xs font-black text-gray-900 truncate mt-0.5">
                            {m.nama}
                          </h5>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {m.keterangan}
                          </p>
                        </div>
                        {m.is_ex_officio && (
                          <span className="text-[8px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shrink-0">
                            Ex-Officio
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. SUSUNAN PENGURUS & ANGGOTA (DIRECTORY TAB)                              */}
          {/* ========================================================================= */}
          {activeTab === 'pengurus' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden space-y-4 p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 flex items-center space-x-2">
                    <span>Daftar Personel Dewan Ambalan SMK Bakti Idhata</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-full">
                      {filteredMembers.length} / {currentDewan.susunan_pengurus.length}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Rincian nama lengkap, kelas, divisi kepengurusan, dan uraian tugas pokok anggota.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-gray-100 p-0.5 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        viewMode === 'grid' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      Kartu (Grid)
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        viewMode === 'table' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      Tabel Rinci
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddMember}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Personel</span>
                  </button>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                {/* Search Box */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama anggota, kelas (TKJ/RPL/DKV), atau divisi..."
                    className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Tingkat Selector */}
                <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs">
                  <span className="px-2 text-gray-400 font-bold text-[11px]">Tingkat:</span>
                  {(['Semua', 'XII', 'XI'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTingkat(t)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        selectedTingkat === t ? 'bg-white shadow-2xs text-amber-800' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {t === 'Semua' ? 'Semua Kelas' : `Kelas ${t}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Divisi Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
                {divisiList.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDivisi(d.id)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedDivisi === d.id
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Render: Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                  {filteredMembers.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <Users2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-500">Tidak ada anggota yang cocok dengan filter pencarian.</p>
                      <button
                        type="button"
                        onClick={() => { setSearchQuery(''); setSelectedDivisi('Semua'); setSelectedTingkat('Semua'); }}
                        className="mt-2 text-xs font-bold text-amber-700 hover:underline cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    </div>
                  ) : (
                    filteredMembers.map((m, idx) => {
                      const originalIdx = currentDewan.susunan_pengurus.findIndex(x => x.nama === m.nama && x.jabatan === m.jabatan);
                      const isXII = m.kelas.startsWith('XII');
                      const isStaff = m.is_staff || m.jabatan.toLowerCase().includes('staff');
                      
                      return (
                        <div
                          key={idx}
                          className="bg-white rounded-2xl p-4 border border-gray-200/80 hover:border-amber-300 hover:shadow-xs transition group flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center space-x-2.5">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                                  m.jenis_kelamin === 'P'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {m.nama.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-gray-900 leading-tight">
                                    {m.nama}
                                  </h4>
                                  <div className="flex items-center space-x-1.5 mt-0.5">
                                    <span className="px-1.5 py-0.2 bg-gray-100 text-gray-700 text-[10px] font-bold rounded">
                                      {m.kelas}
                                    </span>
                                    <span className={`text-[10px] font-bold ${isXII ? 'text-amber-700' : 'text-emerald-700'}`}>
                                      {isXII ? 'Laksana' : 'Bantara'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditMember(originalIdx)}
                                  className="p-1 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                  title="Edit Data"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(originalIdx)}
                                  className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                isStaff 
                                  ? 'bg-purple-50 text-purple-800 border-purple-200' 
                                  : 'bg-amber-50 text-amber-900 border-amber-200'
                              }`}>
                                {m.jabatan}
                              </span>
                              {m.divisi && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 text-gray-600 border border-gray-200">
                                  {m.divisi}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-gray-500 mt-2.5 line-clamp-2">
                              {m.tugas_pokok || 'Bertanggung jawab atas koordinasi dan penugasan divisi.'}
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-semibold">
                            <span>SMK Bakti Idhata</span>
                            <span className="text-amber-800 font-bold">Tahun Ajaran {currentDewan.tahun_ajaran || currentDewan.periode}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Render: Table View */}
              {viewMode === 'table' && (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-black border-b border-gray-200 text-[11px]">
                      <tr>
                        <th className="px-3 py-3 w-10 text-center">No</th>
                        <th className="px-4 py-3">Nama Anggota</th>
                        <th className="px-3 py-3">Kelas</th>
                        <th className="px-4 py-3">Divisi</th>
                        <th className="px-4 py-3">Jabatan Resmi</th>
                        <th className="px-4 py-3">Tugas Pokok</th>
                        <th className="px-3 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredMembers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-400 font-bold">
                            Tidak ada data yang cocok dengan kriteria pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredMembers.map((m, idx) => {
                          const originalIdx = currentDewan.susunan_pengurus.findIndex(x => x.nama === m.nama && x.jabatan === m.jabatan);
                          const isStaff = m.is_staff || m.jabatan.toLowerCase().includes('staff');
                          return (
                            <tr key={idx} className="hover:bg-amber-50/30 transition">
                              <td className="px-3 py-2.5 text-center text-gray-400 font-bold text-[11px]">{idx + 1}</td>
                              <td className="px-4 py-2.5 font-black text-gray-900">
                                <div className="flex items-center space-x-2">
                                  <span className={`w-2 h-2 rounded-full ${m.jenis_kelamin === 'P' ? 'bg-rose-400' : 'bg-blue-500'}`} />
                                  <span>{m.nama}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 font-bold text-gray-700">
                                <span className="px-2 py-0.5 bg-gray-100 rounded-md text-[10px]">
                                  {m.kelas}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 font-bold text-gray-600">
                                {m.divisi || '-'}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                  isStaff ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-amber-50 text-amber-900 border-amber-200'
                                }`}>
                                  {m.jabatan}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-gray-500 text-[11px] max-w-xs truncate">
                                {m.tugas_pokok || '-'}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditMember(originalIdx)}
                                    className="p-1 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                    title="Edit Data"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMember(originalIdx)}
                                    className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* DEPARTEMEN & DIVISI KERJA TAB                                           */}
          {/* ========================================================================= */}
          {activeTab === 'divisi' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                <h3 className="font-extrabold text-sm text-gray-900">
                  Rincian Departemen & Divisi Ambalan SMK Bakti Idhata
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Setiap divisi dikelola oleh pimpinan inti bersama tim staff penunjang operasional ambalan.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Dewan Kehormatan */}
                <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-full uppercase">
                        Dewan Kehormatan
                      </span>
                      <Award className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-[11px] text-gray-500 mb-3">
                      Penasehat pertimbangan kehormatan adat, sandi ambalan, dan penegak kode etik Dasa Darma.
                    </p>
                    <div className="space-y-1.5 text-xs font-bold text-gray-800">
                      <div className="p-2 bg-amber-50/60 rounded-xl flex items-center justify-between">
                        <span>Malik Khadafi Al Ghoni</span>
                        <span className="text-[10px] text-gray-500">XII TKJ</span>
                      </div>
                      <div className="p-2 bg-amber-50/60 rounded-xl flex items-center justify-between">
                        <span>Della Rizkyani</span>
                        <span className="text-[10px] text-gray-500">XII DKV 2</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-400 font-semibold">
                    2 Personel Tingkat XII
                  </div>
                </div>

                {/* 2. Pemangku Adat */}
                <div className="bg-white rounded-2xl p-4 border border-indigo-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 text-[10px] font-black rounded-full uppercase">
                        Pemangku Adat
                      </span>
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className="text-[11px] text-gray-500 mb-3">
                      Menjaga keluhuran adat, memimpin prosesi adat ambalan, dan menegakkan tata tertib pramuka.
                    </p>
                    <div className="space-y-1.5 text-xs font-bold text-gray-800">
                      <div className="p-2 bg-indigo-50/60 rounded-xl flex items-center justify-between">
                        <span>Daffa Arya Perkasa (Pemangku Pa)</span>
                        <span className="text-[10px] text-gray-500">XII RPL</span>
                      </div>
                      <div className="p-2 bg-indigo-50/60 rounded-xl flex items-center justify-between">
                        <span>Khalifah Azzahra (Pemangku Pi)</span>
                        <span className="text-[10px] text-gray-500">XII DKV 2</span>
                      </div>
                      <div className="p-2 bg-indigo-50/30 rounded-xl space-y-1 text-indigo-900 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span>Staff: Sabian Attila Taftazani A.</span>
                          <span className="text-[10px] text-indigo-700">XI RPL</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Staff: Aurelia Khanza Sabrina S.</span>
                          <span className="text-[10px] text-indigo-700">XI RPL</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-400 font-semibold">
                    4 Personel (2 Pimpinan, 2 Staff)
                  </div>
                </div>

                {/* 3. Penegak Pradana */}
                <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-full uppercase">
                        Penegak Pradana
                      </span>
                      <Crown className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-[11px] text-gray-500 mb-3">
                      Pengarah strategis ambalan, koordinasi eksternal gugus depan dan kwartir ranting.
                    </p>
                    <div className="space-y-1.5 text-xs font-bold text-gray-800">
                      <div className="p-2 bg-amber-50/60 rounded-xl flex items-center justify-between">
                        <span>Raditya</span>
                        <span className="text-[10px] text-gray-500">XII DKV 2</span>
                      </div>
                      <div className="p-2 bg-amber-50/60 rounded-xl flex items-center justify-between">
                        <span>Nayla Janeeta</span>
                        <span className="text-[10px] text-gray-500">XII DKV 2</span>
                      </div>
                      <div className="p-2 bg-amber-50/30 rounded-xl space-y-1 text-amber-900 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span>Staff: Zainun Ghilman Aziz</span>
                          <span className="text-[10px] text-amber-700">XI RPL</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Staff: Carissa Rahma Zahirah</span>
                          <span className="text-[10px] text-amber-700">XI DKV 2</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-400 font-semibold">
                    4 Personel (2 Pimpinan, 2 Staff)
                  </div>
                </div>

                {/* 4. Pradana Harian */}
                <div className="bg-white rounded-2xl p-4 border-2 border-amber-400 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 bg-amber-200 text-amber-950 text-[10px] font-black rounded-full uppercase">
                        Pradana (Ketua Harian)
                      </span>
                      <Flame className="w-4 h-4 text-amber-700" />
                    </div>
                    <p className="text-[11px] text-gray-500 mb-3">
                      Penanggung jawab utama seluruh program kerja dan komando latihan ambalan mingguan.
                    </p>
                    <div className="space-y-1.5 text-xs font-bold text-gray-800">
                      <div className="p-2 bg-amber-50 rounded-xl flex items-center justify-between">
                        <span>Yasir Hidayatullah (Pradana Pa)</span>
                        <span className="text-[10px] text-amber-800 font-bold">XII TKJ</span>
                      </div>
                      <div className="p-2 bg-amber-50 rounded-xl flex items-center justify-between">
                        <span>Bilqis Suci Makayla (Pradana Pi)</span>
                        <span className="text-[10px] text-amber-800 font-bold">XII DKV 2</span>
                      </div>
                      <div className="p-2 bg-amber-100/50 rounded-xl space-y-1 text-amber-950 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span>Staff: Dimas Aditya</span>
                          <span className="text-[10px] text-amber-800 font-bold">XI RPL</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Staff: Julfa Khairanih</span>
                          <span className="text-[10px] text-amber-800 font-bold">XI DKV 2</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-400 font-semibold">
                    4 Personel (2 Pimpinan, 2 Staff)
                  </div>
                </div>

                {/* 5. Wakil Pradana */}
                <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-full uppercase">
                        Wakil Pradana
                      </span>
                      <Users2 className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-[11px] text-gray-500 mb-3">
                      Membantu Pradana, memonitor jalannya sangga kerja, dan pengawasan kedisiplinan seksi.
                    </p>
                    <div className="space-y-1.5 text-xs font-bold text-gray-800">
                      <div className="p-2 bg-amber-50/60 rounded-xl flex items-center justify-between">
                        <span>Rizky Anugrah Ramadhan (Waka Pa)</span>
                        <span className="text-[10px] text-gray-500">XII TKJ</span>
                      </div>
                      <div className="p-2 bg-amber-50/60 rounded-xl flex items-center justify-between">
                        <span>Intan Ayyu Nur Aini (Waka Pi)</span>
                        <span className="text-[10px] text-gray-500">XII DKV 1</span>
                      </div>
                      <div className="p-2 bg-amber-50/30 rounded-xl space-y-1 text-amber-900 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span>Staff: Raffael Zaidan Alfaridzi</span>
                          <span className="text-[10px] text-amber-700 font-bold">XI RPL</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Staff: Najla Amelia Kirana</span>
                          <span className="text-[10px] text-amber-700 font-bold">XI DKV 2</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-400 font-semibold">
                    4 Personel (2 Pimpinan, 2 Staff)
                  </div>
                </div>

                {/* 6. Krani (Sekretariat) */}
                <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-black rounded-full uppercase">
                        Krani (Sekretariat)
                      </span>
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-[11px] text-gray-500 mb-3">
                      Pengelolaan administrasi surat, proposal, absensi latihan, notulensi rapat, dan buku induk.
                    </p>
                    <div className="space-y-1.5 text-xs font-bold text-gray-800">
                      <div className="p-2 bg-blue-50/60 rounded-xl flex items-center justify-between">
                        <span>Fathier Assyarief (Krani Pa)</span>
                        <span className="text-[10px] text-gray-500">XII RPL</span>
                      </div>
                      <div className="p-2 bg-blue-50/60 rounded-xl flex items-center justify-between">
                        <span>Siti Humaira Auliahya (Krani Pi)</span>
                        <span className="text-[10px] text-gray-500">XII DKV 2</span>
                      </div>
                      <div className="p-2 bg-blue-50/30 rounded-xl space-y-1 text-blue-900 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span>Staff: Raihan Nur Irsyad</span>
                          <span className="text-[10px] text-blue-700 font-bold">XI RPL</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Staff: Nadya Ulya Khairunnisa</span>
                          <span className="text-[10px] text-blue-700 font-bold">XI DKV 2</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-400 font-semibold">
                    4 Personel (2 Pimpinan, 2 Staff)
                  </div>
                </div>

                {/* 7. Bendahara */}
                <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-black rounded-full uppercase">
                        Bendahara (Bankir)
                      </span>
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-gray-500 mb-3">
                      Pengelolaan kas masuk/keluar, buku kas harian, iuran kas wajib, dan kwitansi kegiatan.
                    </p>
                    <div className="space-y-1.5 text-xs font-bold text-gray-800">
                      <div className="p-2 bg-emerald-50/60 rounded-xl flex items-center justify-between">
                        <span>Sauqi Moebarok (Bendahara Pa)</span>
                        <span className="text-[10px] text-emerald-800 font-bold">XI DKV 2</span>
                      </div>
                      <div className="p-2 bg-emerald-50/60 rounded-xl flex items-center justify-between">
                        <span>Hanifah Salsabilla (Bendahara Pi)</span>
                        <span className="text-[10px] text-emerald-800 font-bold">XI DKV 1</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-400 font-semibold">
                    2 Personel Pengelola Keuangan
                  </div>
                </div>

                {/* 8. Giatop */}
                <div className="bg-white rounded-2xl p-4 border border-orange-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 bg-orange-100 text-orange-900 text-[10px] font-black rounded-full uppercase">
                        Giatop (Kegiatan Operasional)
                      </span>
                      <Flame className="w-4 h-4 text-orange-600" />
                    </div>
                    <p className="text-[11px] text-gray-500 mb-3">
                      Perencanaan rundown latihan, apel pembukaan/penutupan, kemah bakti, dan jelajah medan.
                    </p>
                    <div className="space-y-1.5 text-xs font-bold text-gray-800">
                      <div className="p-2 bg-orange-50/60 rounded-xl flex items-center justify-between">
                        <span>Abdul Hafiidz (Giatop Pa)</span>
                        <span className="text-[10px] text-orange-800 font-bold">XI RPL</span>
                      </div>
                      <div className="p-2 bg-orange-50/60 rounded-xl flex items-center justify-between">
                        <span>Osriseffita Nurramadhaniah (Giatop Pi)</span>
                        <span className="text-[10px] text-orange-800 font-bold">XI DKV 1</span>
                      </div>
                      <div className="p-2 bg-orange-50/30 rounded-xl space-y-1 text-orange-950 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span>Staff: Syahrul Sya'ban</span>
                          <span className="text-[10px] text-orange-700 font-bold">XI RPL</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Staff: Kanza Dwi Melviana</span>
                          <span className="text-[10px] text-orange-700 font-bold">XI DKV 1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-400 font-semibold">
                    4 Personel (2 Pimpinan, 2 Staff)
                  </div>
                </div>

                {/* 9. Tekram */}
                <div className="bg-white rounded-2xl p-4 border border-cyan-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-900 text-[10px] font-black rounded-full uppercase">
                        Tekram (Teknik Kepramukaan)
                      </span>
                      <Compass className="w-4 h-4 text-cyan-600" />
                    </div>
                    <p className="text-[11px] text-gray-500 mb-3">
                      Instruktur pionering, tali temali, sandi morse/semaphor, navigasi darat, dan PPGD.
                    </p>
                    <div className="space-y-1.5 text-xs font-bold text-gray-800">
                      <div className="p-2 bg-cyan-50/60 rounded-xl flex items-center justify-between">
                        <span>Arif Zakariya (Tekram Pa)</span>
                        <span className="text-[10px] text-gray-500">XII TKJ</span>
                      </div>
                      <div className="p-2 bg-cyan-50/60 rounded-xl flex items-center justify-between">
                        <span>M. Dwikie Dhermawan As'syidiq (Tekram Pa)</span>
                        <span className="text-[10px] text-cyan-800 font-bold">XI TKJ</span>
                      </div>
                      <div className="p-2 bg-cyan-50/60 rounded-xl flex items-center justify-between">
                        <span>Shafa Azalia Andini (Tekram Pi)</span>
                        <span className="text-[10px] text-cyan-800 font-bold">XI DKV 2</span>
                      </div>
                      <div className="p-2 bg-cyan-50/30 rounded-xl space-y-1 text-cyan-950 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span>Staff: Raden Ahmad Faisal Mubaroq</span>
                          <span className="text-[10px] text-cyan-700 font-bold">XI DKV 1</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Staff: Zayden Athaya Nareswara</span>
                          <span className="text-[10px] text-cyan-700 font-bold">XI TKJ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-400 font-semibold">
                    5 Personel (3 Instruktur, 2 Staff)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. VISI MISI & BERITA ACARA SERTIJAB TAB                                  */}
          {/* ========================================================================= */}
          {activeTab === 'sertijab' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-6">
              <div>
                <div className="flex items-center space-x-2">
                  <Scroll className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-black text-gray-900">
                    Visi & Misi Dewan Ambalan SMK Bakti Idhata (Tahun Ajaran {currentDewan.tahun_ajaran || currentDewan.periode})
                  </h3>
                </div>
                <div className="mt-3 p-4 bg-amber-50/60 rounded-2xl border border-amber-200/70 text-xs leading-relaxed text-gray-800 font-medium whitespace-pre-line">
                  {currentDewan.visi_misi || "Mewujudkan Dewan Ambalan SMK Bakti Idhata yang disiplin, berakhlak mulia, berprestasi kepramukaan, serta berdaya saing tinggi berlandaskan Trisatya dan Dasa Darma."}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-black text-gray-900">
                    Berita Acara Serah Terima Jabatan & Pengukuhan
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Dokumentasi digital prosesi pelantikan dan pengucapan Janji Trisatya di hadapan Pembina Gugus Depan.
                </p>

                <div className="mt-4 p-5 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-700 space-y-3">
                  <p className="leading-relaxed">
                    Telah terlaksana dengan khidmat serah terima panji kebesaran Ambalan dan sandi ambalan kepada pengurus terpilih masa bakti Tahun Ajaran <strong>{currentDewan.tahun_ajaran || currentDewan.periode}</strong> bertempat di Sanggar Pramuka SMK Bakti Idhata Jakarta Selatan dengan disaksikan oleh seluruh anggota, dewan kehormatan, dan pimpinan gugus depan.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-200 font-semibold text-[11px]">
                    <div className="bg-white p-3 rounded-xl border border-gray-100">
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Pradana Terpilih:</span>
                      <span className="text-gray-900 block font-extrabold mt-0.5">Yasir Hidayatullah & Bilqis Suci Makayla</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-100">
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Dewan Kehormatan:</span>
                      <span className="text-gray-900 block font-extrabold mt-0.5">Malik Khadafi Al Ghoni & Della Rizkyani</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-100">
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Pembina Gugus Depan:</span>
                      <span className="text-gray-900 block font-extrabold mt-0.5">Kak Sultan Haidar Basyar & Kak Jihan Fadhilah</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL TAMBAH / EDIT PENGURUS SEKSI                                        */}
      {/* ========================================================================= */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-black text-sm text-gray-900">
                {editingMemberIndex !== null ? 'Edit Data Pengurus Ambalan' : 'Tambah Personel Dewan Ambalan'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddMemberModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="mt-4 space-y-3.5 text-xs">
              {/* Opsi Pilih dari Siswa atau Input Manual */}
              <div>
                <label className="block font-black text-gray-700 mb-1">Pilih dari Database Siswa (Opsional)</label>
                <select
                  value={memberSiswaId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setMemberSiswaId(id);
                    const found = siswa.find(s => s.id === id);
                    if (found) {
                      setMemberNama(found.nama_lengkap);
                      setMemberKelas(found.kelas);
                    }
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Input Manual atau Pilih Siswa --</option>
                  {siswa.filter(s => s.status_aktif).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nama_lengkap} ({s.kelas} - {s.nis})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-gray-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    placeholder="Nama anggota..."
                    value={memberNama}
                    onChange={(e) => setMemberNama(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-black text-gray-700 mb-1">Kelas</label>
                  <input
                    type="text"
                    placeholder="misal: XII TKJ, XI RPL..."
                    value={memberKelas}
                    onChange={(e) => setMemberKelas(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-gray-700 mb-1">Divisi Kepengurusan</label>
                  <select
                    value={memberDivisi}
                    onChange={(e) => {
                      setMemberDivisi(e.target.value);
                      if (e.target.value.toLowerCase().includes('staff') || memberIsStaff) {
                        setMemberJabatan(`Staff ${e.target.value}`);
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800"
                  >
                    <option value="Dewan Kehormatan">Dewan Kehormatan</option>
                    <option value="Pemangku Adat">Pemangku Adat</option>
                    <option value="Penegak Pradana">Penegak Pradana</option>
                    <option value="Pradana">Pradana</option>
                    <option value="Wakil Pradana">Wakil Pradana</option>
                    <option value="Krani">Krani</option>
                    <option value="Bendahara">Bendahara</option>
                    <option value="Giatop">Giatop</option>
                    <option value="Tekram">Tekram</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-gray-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={memberJenisKelamin}
                    onChange={(e) => setMemberJenisKelamin(e.target.value as 'L' | 'P')}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800"
                  >
                    <option value="L">Putra (L)</option>
                    <option value="P">Putri (P)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-gray-700 mb-1">Jabatan Spesifik</label>
                  <input
                    type="text"
                    placeholder="misal: Staff Krani, Pemangku Adat..."
                    value={memberJabatan}
                    onChange={(e) => setMemberJabatan(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="isStaffCheck"
                    checked={memberIsStaff}
                    onChange={(e) => setMemberIsStaff(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <label htmlFor="isStaffCheck" className="font-bold text-gray-700 text-xs cursor-pointer">
                    Termasuk Jabatan Staff Pembantu
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Tugas Pokok & Tanggung Jawab</label>
                <textarea
                  rows={2}
                  placeholder="Uraian tugas pokok jabatan ini..."
                  value={memberTugas}
                  onChange={(e) => setMemberTugas(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
                >
                  {editingMemberIndex !== null ? 'Perbarui Data' : 'Simpan Personel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL TAMBAH PERIODE BARU                                                 */}
      {/* ========================================================================= */}
      {isAddPeriodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4 text-amber-600" />
                <h3 className="font-black text-sm text-gray-900">Tambah Periode Kepengurusan Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPeriodeModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePeriode} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-black text-gray-700 mb-1">Masa Bakti / Tahun Ajaran</label>
                <input
                  type="text"
                  placeholder="misal: 2026-2027"
                  value={newPeriode}
                  onChange={(e) => setNewPeriode(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-gray-700 mb-1">Pradana Putra</label>
                  <input
                    type="text"
                    placeholder="Nama Lengkap..."
                    value={newPradanaPa}
                    onChange={(e) => setNewPradanaPa(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-black text-gray-700 mb-1">Pradana Putri</label>
                  <input
                    type="text"
                    placeholder="Nama Lengkap..."
                    value={newPradanaPi}
                    onChange={(e) => setNewPradanaPi(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-gray-700 mb-1">Pemangku Adat Putra</label>
                  <input
                    type="text"
                    placeholder="Nama Lengkap..."
                    value={newPemangkuAdatPa}
                    onChange={(e) => setNewPemangkuAdatPa(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block font-black text-gray-700 mb-1">Pemangku Adat Putri</label>
                  <input
                    type="text"
                    placeholder="Nama Lengkap..."
                    value={newPemangkuAdatPi}
                    onChange={(e) => setNewPemangkuAdatPi(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-gray-700 mb-1">Kerani (Sekretaris)</label>
                  <input
                    type="text"
                    placeholder="Nama Lengkap..."
                    value={newKerani}
                    onChange={(e) => setNewKerani(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-black text-gray-700 mb-1">Bankir (Bendahara)</label>
                  <input
                    type="text"
                    placeholder="Nama Lengkap..."
                    value={newBankir}
                    onChange={(e) => setNewBankir(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Visi & Misi Kepengurusan</label>
                <textarea
                  rows={2}
                  placeholder="Ketikkan visi dan misi masa bakti ini..."
                  value={newVisiMisi}
                  onChange={(e) => setNewVisiMisi(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddPeriodeModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Simpan Periode</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
