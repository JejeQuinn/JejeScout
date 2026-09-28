import React, { useState, useEffect } from 'react';
import { Siswa, Kehadiran, Materi, SKU, Kedisiplinan, Kelas, Tabungan, StatusSiklus, RiwayatAkademik } from '../types';
import { calculateNilaiSiswa } from '../utils/gradeCalculator';
import { DisciplineHistoryModal } from './DisciplineHistoryModal';
import { BatchRolloverModal } from './BatchRolloverModal';
import { Search, UserPlus, Edit2, Trash2, ShieldCheck, X, AlertTriangle, Lock, Check, Award, Shield, FileText, Sliders, Upload, Download, Eye, Landmark, CheckCircle2, ShieldAlert, Filter, RotateCcw, GraduationCap, Plus, Calendar, Mail, Hash, Users2, Sparkles, History, CheckCheck, Save } from 'lucide-react';
import { resolveSiswaForTA, recordStudentClassHistory } from '../utils/academicProgression';
import { setFirestoreDoc, COLLECTIONS } from '../utils/firestoreService';

interface SiswaCRUDProps {
  siswa: Siswa[];
  kehadiran: Kehadiran[];
  materi: Materi[];
  sku: SKU[];
  kedisiplinan: Kedisiplinan[];
  tabungan?: Tabungan[];
  onAdd: (data: Omit<Siswa, 'id'>) => void;
  onAddMultiple: (data: Omit<Siswa, 'id'>[]) => void;
  onUpdate: (data: Siswa) => void;
  onDelete: (id: string) => void;
  classList: Kelas[];
  selectedSiswaId?: string | null;
  onClearSelectedSiswa?: () => void;
  tahunAjaranList?: string[];
  activeTahunAjaran?: string;
  onSelectTahunAjaran?: (ta: string) => void;
  onAddTahunAjaran?: (newTA: string) => void;
  onSyncTahunAjaranList?: (newList: string[]) => void;
  onAddKedisiplinan?: (newLog: Omit<Kedisiplinan, 'id'>) => void;
  onDeleteKedisiplinan?: (id: string) => void;
  onBatchRollover?: (updatedSiswaList: Siswa[], newTahunAjaran: string) => void;
  readOnly?: boolean;
}

export const SiswaCRUD: React.FC<SiswaCRUDProps> = ({
  siswa,
  kehadiran,
  materi,
  sku,
  kedisiplinan,
  tabungan = [],
  onAdd,
  onAddMultiple,
  onUpdate,
  onDelete,
  classList,
  selectedSiswaId,
  onClearSelectedSiswa,
  tahunAjaranList: propsTahunAjaranList,
  activeTahunAjaran,
  onSelectTahunAjaran,
  onAddTahunAjaran,
  onSyncTahunAjaranList,
  onAddKedisiplinan,
  onDeleteKedisiplinan,
  onBatchRollover,
  readOnly = false,
}) => {
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterSiklus, setFilterSiklus] = useState<string>('all');
  const [subTab, setSubTab] = useState<'data_anggota' | 'status_pelantikan'>('data_anggota');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [selectedPelantikan, setSelectedPelantikan] = useState<string>('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRolloverModalOpen, setIsRolloverModalOpen] = useState(false);
  const [disciplineModalSiswa, setDisciplineModalSiswa] = useState<Siswa | null>(null);

  // Master Tahun Ajaran List state (persisted in localStorage)
  const DEFAULT_TAHUN_AJARAN = [
    'TA. 2024-2025',
    'TA. 2025-2026',
    'TA. 2026-2027'
  ];
  const [tahunAjaranList, setTahunAjaranList] = useState<string[]>(() => {
    if (propsTahunAjaranList && propsTahunAjaranList.length > 0) {
      return propsTahunAjaranList;
    }
    try {
      const saved = localStorage.getItem('pramuka_tahun_ajaran');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_TAHUN_AJARAN;
  });

  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>(activeTahunAjaran || 'all');
  const [isManageTaOpen, setIsManageTaOpen] = useState(false);
  const [newTaInput, setNewTaInput] = useState('');
  const [editingTaIndex, setEditingTaIndex] = useState<number | null>(null);
  const [editingTaText, setEditingTaText] = useState('');
  const [deleteTaConfirmItem, setDeleteTaConfirmItem] = useState<{ taName: string; studentCount: number; fallback: string } | null>(null);
  const [isConfirmResetTaOpen, setIsConfirmResetTaOpen] = useState(false);
  const [taErrorMsg, setTaErrorMsg] = useState<string | null>(null);
  const [taSuccessMsg, setTaSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (propsTahunAjaranList && propsTahunAjaranList.length > 0) {
      setTahunAjaranList(propsTahunAjaranList);
    }
  }, [propsTahunAjaranList]);

  useEffect(() => {
    if (activeTahunAjaran) {
      setSelectedTahunAjaran(activeTahunAjaran);
    }
  }, [activeTahunAjaran]);

  const saveTahunAjaranList = (newList: string[]) => {
    setTahunAjaranList(newList);
    try {
      localStorage.setItem('pramuka_tahun_ajaran', JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
    if (onSyncTahunAjaranList) {
      onSyncTahunAjaranList(newList);
    }
    setFirestoreDoc(COLLECTIONS.SETTINGS, 'tahun_ajaran', { list: newList }).catch(() => {});
  };

  const handleAddTa = () => {
    setTaErrorMsg(null);
    setTaSuccessMsg(null);
    const trimmed = newTaInput.trim();
    if (!trimmed) return;
    if (tahunAjaranList.map((t) => t.toLowerCase()).includes(trimmed.toLowerCase())) {
      setTaErrorMsg('Tahun Ajaran dengan nama tersebut sudah ada!');
      setTimeout(() => setTaErrorMsg(null), 3000);
      return;
    }
    const updated = [...tahunAjaranList, trimmed];
    saveTahunAjaranList(updated);
    if (onAddTahunAjaran) onAddTahunAjaran(trimmed);
    setNewTaInput('');
    setTaSuccessMsg(`Tahun Ajaran "${trimmed}" berhasil ditambahkan!`);
    setTimeout(() => setTaSuccessMsg(null), 3000);
  };

  const handleStartEditTa = (index: number) => {
    setTaErrorMsg(null);
    setTaSuccessMsg(null);
    setDeleteTaConfirmItem(null);
    setIsConfirmResetTaOpen(false);
    setEditingTaIndex(index);
    setEditingTaText(tahunAjaranList[index]);
  };

  const handleSaveEditTa = (index: number) => {
    setTaErrorMsg(null);
    setTaSuccessMsg(null);
    const trimmed = editingTaText.trim();
    if (!trimmed) return;
    const oldName = tahunAjaranList[index];
    if (oldName === trimmed) {
      setEditingTaIndex(null);
      return;
    }
    if (tahunAjaranList.some((item, i) => i !== index && item.toLowerCase() === trimmed.toLowerCase())) {
      setTaErrorMsg('Nama Tahun Ajaran tersebut sudah digunakan!');
      setTimeout(() => setTaErrorMsg(null), 3000);
      return;
    }
    const updated = [...tahunAjaranList];
    updated[index] = trimmed;
    saveTahunAjaranList(updated);

    // Update students holding the old TA
    siswa.forEach((s) => {
      if (s.tahun_ajaran === oldName) {
        onUpdate({
          ...s,
          tahun_ajaran: trimmed,
        });
      }
    });

    if (selectedTahunAjaran === oldName) {
      setSelectedTahunAjaran(trimmed);
    }

    setTaSuccessMsg(`Tahun Ajaran "${oldName}" diubah menjadi "${trimmed}"!`);
    setTimeout(() => setTaSuccessMsg(null), 3000);
    setEditingTaIndex(null);
  };

  const handleDeleteTa = (taToDelete: string) => {
    setTaErrorMsg(null);
    setTaSuccessMsg(null);
    setEditingTaIndex(null);
    setIsConfirmResetTaOpen(false);

    if (tahunAjaranList.length <= 1) {
      setTaErrorMsg('Minimal harus tersisa 1 Tahun Ajaran!');
      setTimeout(() => setTaErrorMsg(null), 3000);
      return;
    }

    const countUsing = siswa.filter((s) => s.tahun_ajaran === taToDelete).length;
    const fallback = tahunAjaranList.find((t) => t !== taToDelete) || 'TA. 2024-2025';
    setDeleteTaConfirmItem({
      taName: taToDelete,
      studentCount: countUsing,
      fallback,
    });
  };

  const executeDeleteTa = () => {
    if (!deleteTaConfirmItem) return;
    const { taName, fallback } = deleteTaConfirmItem;
    const updated = tahunAjaranList.filter((item) => item !== taName);
    saveTahunAjaranList(updated);

    if (selectedTahunAjaran === taName) {
      setSelectedTahunAjaran('all');
    }

    siswa.forEach((s) => {
      if (s.tahun_ajaran === taName) {
        onUpdate({
          ...s,
          tahun_ajaran: fallback,
        });
      }
    });

    setTaSuccessMsg(`Tahun Ajaran "${taName}" berhasil dihapus!`);
    setDeleteTaConfirmItem(null);
    setTimeout(() => setTaSuccessMsg(null), 3000);
  };

  const executeResetTaDefaults = () => {
    saveTahunAjaranList(DEFAULT_TAHUN_AJARAN);
    setIsConfirmResetTaOpen(false);
    setDeleteTaConfirmItem(null);
    setTaSuccessMsg('Daftar Tahun Ajaran berhasil dikembalikan ke standar (2024-2027)!');
    setTimeout(() => setTaSuccessMsg(null), 3000);
  };

  // Master Status Pelantikan List state (persisted in localStorage)
  const DEFAULT_PELANTIKAN_LIST = [
    'Calon Penegak',
    'Calon Bantara',
    'Penegak Bantara',
    'Calon Laksana',
    'Penegak Laksana',
  ];
  const [pelantikanList, setPelantikanList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sipramuka_status_pelantikan_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PELANTIKAN_LIST;
  });

  const [isManagePelantikanOpen, setIsManagePelantikanOpen] = useState(false);
  const [newPelantikanInput, setNewPelantikanInput] = useState('');
  const [editingPelantikanIndex, setEditingPelantikanIndex] = useState<number | null>(null);
  const [editingPelantikanText, setEditingPelantikanText] = useState('');
  const [deletePelantikanConfirmItem, setDeletePelantikanConfirmItem] = useState<{ name: string; studentCount: number } | null>(null);
  const [isConfirmResetPelantikanOpen, setIsConfirmResetPelantikanOpen] = useState(false);
  const [pelantikanErrorMsg, setPelantikanErrorMsg] = useState<string | null>(null);
  const [pelantikanSuccessMsg, setPelantikanSuccessMsg] = useState<string | null>(null);

  const savePelantikanList = (newList: string[]) => {
    setPelantikanList(newList);
    try {
      localStorage.setItem('sipramuka_status_pelantikan_list', JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPelantikan = () => {
    setPelantikanErrorMsg(null);
    setPelantikanSuccessMsg(null);
    const trimmed = newPelantikanInput.trim();
    if (!trimmed) return;
    if (pelantikanList.map((p) => p.toLowerCase()).includes(trimmed.toLowerCase())) {
      setPelantikanErrorMsg('Status pelantikan dengan nama tersebut sudah ada!');
      setTimeout(() => setPelantikanErrorMsg(null), 3000);
      return;
    }
    const updated = [...pelantikanList, trimmed];
    savePelantikanList(updated);
    setNewPelantikanInput('');
    setPelantikanSuccessMsg(`Status "${trimmed}" berhasil ditambahkan!`);
    setTimeout(() => setPelantikanSuccessMsg(null), 3000);
  };

  const handleStartEditPelantikan = (index: number) => {
    setPelantikanErrorMsg(null);
    setPelantikanSuccessMsg(null);
    setDeletePelantikanConfirmItem(null);
    setIsConfirmResetPelantikanOpen(false);
    setEditingPelantikanIndex(index);
    setEditingPelantikanText(pelantikanList[index]);
  };

  const handleSaveEditPelantikan = (index: number) => {
    setPelantikanErrorMsg(null);
    setPelantikanSuccessMsg(null);
    const trimmed = editingPelantikanText.trim();
    if (!trimmed) return;
    const oldName = pelantikanList[index];
    if (oldName === trimmed) {
      setEditingPelantikanIndex(null);
      return;
    }
    if (pelantikanList.some((item, i) => i !== index && item.toLowerCase() === trimmed.toLowerCase())) {
      setPelantikanErrorMsg('Nama status pelantikan tersebut sudah digunakan!');
      setTimeout(() => setPelantikanErrorMsg(null), 3000);
      return;
    }
    const updated = [...pelantikanList];
    updated[index] = trimmed;
    savePelantikanList(updated);

    // Update existing students holding the old status name
    siswa.forEach((s) => {
      if (s.status_pelantikan === oldName) {
        onUpdate({
          ...s,
          status_pelantikan: trimmed,
        });
      }
    });

    setPelantikanSuccessMsg(`Status "${oldName}" diubah menjadi "${trimmed}"!`);
    setTimeout(() => setPelantikanSuccessMsg(null), 3000);
    setEditingPelantikanIndex(null);
  };

  const handleDeletePelantikan = (nameToDelete: string) => {
    setPelantikanErrorMsg(null);
    setPelantikanSuccessMsg(null);
    setEditingPelantikanIndex(null);
    setIsConfirmResetPelantikanOpen(false);

    const countUsing = siswa.filter((s) => s.status_pelantikan === nameToDelete).length;
    setDeletePelantikanConfirmItem({
      name: nameToDelete,
      studentCount: countUsing,
    });
  };

  const executeDeletePelantikan = () => {
    if (!deletePelantikanConfirmItem) return;
    const { name } = deletePelantikanConfirmItem;
    const updated = pelantikanList.filter((item) => item !== name);
    savePelantikanList(updated);

    if (selectedPelantikan === name) {
      setSelectedPelantikan('all');
    }

    siswa.forEach((s) => {
      if (s.status_pelantikan === name) {
        onUpdate({
          ...s,
          status_pelantikan: undefined,
          tanggal_pelantikan: undefined,
        });
      }
    });

    setPelantikanSuccessMsg(`Status pelantikan "${name}" berhasil dihapus!`);
    setDeletePelantikanConfirmItem(null);
    setTimeout(() => setPelantikanSuccessMsg(null), 3000);
  };

  const executeResetPelantikanDefaults = () => {
    savePelantikanList(DEFAULT_PELANTIKAN_LIST);
    setIsConfirmResetPelantikanOpen(false);
    setDeletePelantikanConfirmItem(null);
    setPelantikanSuccessMsg('Daftar status pelantikan berhasil dikembalikan ke standar default!');
    setTimeout(() => setPelantikanSuccessMsg(null), 3000);
  };
  
  // Student detail modal state
  const [detailSiswaId, setDetailSiswaId] = useState<string | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'overview' | 'riwayat_akademik' | 'absensi' | 'sku' | 'kedisiplinan' | 'tabungan'>('overview');
  const [editingHistoryTa, setEditingHistoryTa] = useState<string | null>(null);
  const [editingHistoryKelas, setEditingHistoryKelas] = useState<string>('');
  const [editingHistoryAktif, setEditingHistoryAktif] = useState<boolean>(true);
  const [editingHistorySiklus, setEditingHistorySiklus] = useState<StatusSiklus>('Penegak Aktif');

  useEffect(() => {
    if (selectedSiswaId) {
      setDetailSiswaId(selectedSiswaId);
      setDetailActiveTab('overview');
    }
  }, [selectedSiswaId]);

  const handleCloseDetail = () => {
    setDetailSiswaId(null);
    if (onClearSelectedSiswa) {
      onClearSelectedSiswa();
    }
  };

  const detailSiswa = detailSiswaId ? siswa.find((s) => s.id === detailSiswaId) : null;
  const detailGrades = detailSiswa ? calculateNilaiSiswa(detailSiswa, kehadiran, materi, sku) : null;

  // Ambang batas poin kedisiplinan (default 80)
  const [minDisciplineThreshold, setMinDisciplineThreshold] = useState<number>(80);

  // Helper to calculate student's net discipline points (Base is 100)
  const getSiswaNetPoints = (siswaId: string) => {
    const studentLogs = kedisiplinan.filter((k) => k.siswa_id === siswaId);
    let score = 100;
    studentLogs.forEach((log) => {
      score += log.poin;
    });
    return score;
  };

  const detailDisciplineScore = detailSiswa ? getSiswaNetPoints(detailSiswa.id) : 100;
  const detailKehadiranLogs = detailSiswa ? kehadiran.filter((k) => k.siswa_id === detailSiswa.id) : [];
  const detailSkuLogs = detailSiswa ? sku.filter((s) => s.siswa_id === detailSiswa.id && s.status_verifikasi) : [];
  const detailDisciplineLogs = detailSiswa ? kedisiplinan.filter((k) => k.siswa_id === detailSiswa.id) : [];
  const detailSavingsLogs = detailSiswa && tabungan ? tabungan.filter((t) => t.siswa_id === detailSiswa.id) : [];
  const detailTotalSavings = detailSavingsLogs.reduce((acc, curr) => (curr.jenis === 'setor' ? acc + curr.jumlah : acc - curr.jumlah), 0);

  // Export filtered students to Excel (.csv format with UTF-8 BOM)
  const handleExportExcel = () => {
    const headers = [
      'NIS',
      'Nama Lengkap',
      'Kelas',
      'Tahun Ajaran',
      'Status Pelantikan',
      'Tanggal Pelantikan',
      'Persentase Kehadiran',
      'Skor Kehadiran (30%)',
      'Skor Materi (30%)',
      'Skor SKU (40%)',
      'Poin Kedisiplinan',
      'Kondisi Kedisiplinan',
      'Nilai Total',
      'Predikat',
      'Status Keaktifan'
    ];

    const rows = filteredSiswa.map((s) => {
      const grades = calculateNilaiSiswa(s, kehadiran, materi, sku);
      const disciplineScore = getSiswaNetPoints(s.id);
      const isBelow = disciplineScore < minDisciplineThreshold;
      const statusAbsen = `${grades.persen_kehadiran}%`;
      const resolved = resolveSiswaForTA(s, selectedTahunAjaran, tahunAjaranList);
      const effectiveClass = selectedTahunAjaran !== 'all' ? resolved.kelas : s.kelas;
      const effectiveTA = selectedTahunAjaran !== 'all' ? selectedTahunAjaran : (s.tahun_ajaran || 'TA. 2024-2025');
      const effectiveAktif = selectedTahunAjaran !== 'all' ? resolved.status_aktif : s.status_aktif;
      const statusAktifText = effectiveAktif ? 'Aktif' : 'Nonaktif';
      const kondisiDisiplin = isBelow ? `DI BAWAH AMBANG BATAS (<${minDisciplineThreshold})` : 'Aman / Baik';
      
      return [
        s.nis,
        s.nama_lengkap,
        effectiveClass,
        effectiveTA,
        s.status_pelantikan || 'Calon Penegak',
        s.tanggal_pelantikan || '-',
        statusAbsen,
        grades.skor_kehadiran,
        grades.skor_materi,
        grades.skor_sku,
        disciplineScore,
        kondisiDisiplin,
        grades.nilai_total,
        grades.predikat,
        statusAktifText
      ];
    });

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) =>
        row
          .map((val) => {
            const str = String(val ?? '');
            if (str.includes(';') || str.includes('\n') || str.includes('"')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(';')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const classLabel = selectedKelas === 'all' ? 'Semua_Kelas' : 'Kelas_' + selectedKelas;
    const taLabel = selectedTahunAjaran === 'all' ? 'Semua_TA' : selectedTahunAjaran.replace(/[^a-zA-Z0-9]/g, '_');
    const pelantikanLabel = selectedPelantikan === 'all' ? 'Semua_Pelantikan' : selectedPelantikan.replace(/\s+/g, '_');
    link.setAttribute(
      'download',
      `SI_Pramuka_Data_Anggota_${taLabel}_${classLabel}_${pelantikanLabel}_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [importMode, setImportMode] = useState<'per_kelas' | 'campuran'>('per_kelas');
  const [importTargetKelas, setImportTargetKelas] = useState<string>('');
  const [importTargetTA, setImportTargetTA] = useState<string>('TA. 2024-2025');

  React.useEffect(() => {
    if (classList.length > 0 && !importTargetKelas) {
      setImportTargetKelas(classList[0].nama);
    }
  }, [classList]);

  const handleDownloadTemplate = () => {
    let headers: string[];
    let sampleData: string[][];

    if (importMode === 'per_kelas') {
      // Per-class import format (with Tahun Ajaran)
      headers = ['NIS', 'Nama Lengkap', 'Tahun Ajaran', 'Status Aktif', 'Status Pelantikan', 'Tanggal Pelantikan'];
      sampleData = [
        ['1201', 'Achmad Dhani', 'TA. 2024-2025', 'Aktif', 'Penegak Bantara', '2026-05-10'],
        ['1202', 'Sherina Munaf', 'TA. 2025-2026', 'Aktif', 'Calon Penegak', ''],
        ['1203', 'Isyana Sarasvati', 'TA. 2026-2027', 'Nonaktif', 'Penegak Laksana', '2026-06-20']
      ];
    } else {
      // Mixed/global import format (separate columns, including class & Tahun Ajaran)
      headers = ['NIS', 'Nama Lengkap', 'Kelas', 'Tahun Ajaran', 'Status Aktif', 'Status Pelantikan', 'Tanggal Pelantikan'];
      sampleData = [
        ['1201', 'Achmad Dhani', 'XI TKJ 1', 'TA. 2024-2025', 'Aktif', 'Penegak Bantara', '2026-05-10'],
        ['1202', 'Sherina Munaf', 'XI RPL 2', 'TA. 2025-2026', 'Aktif', 'Calon Penegak', ''],
        ['1203', 'Isyana Sarasvati', 'XII MM 1', 'TA. 2026-2027', 'Nonaktif', 'Penegak Laksana', '2026-06-20']
      ];
    }

    // Semicolon separator matches standard Excel regional export defaults
    const csvContent = [
      headers.join(';'),
      ...sampleData.map(row => row.join(';'))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', importMode === 'per_kelas' ? 'template_import_murid_per_kelas.csv' : 'template_import_murid_campuran.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (importMode === 'per_kelas' && !importTargetKelas) {
      alert("Silakan pilih kelas tujuan terlebih dahulu!");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          alert("File kosong atau tidak terbaca!");
          return;
        }

        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length < 2) {
          alert("Data tidak ditemukan atau hanya berisi baris header!");
          return;
        }

        // Detect separator
        const firstLine = lines[0];
        const separator = firstLine.includes(';') ? ';' : ',';

        const cleanVal = (val: string) => {
          if (!val) return '';
          let cleaned = val.trim();
          if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.substring(1, cleaned.length - 1);
          }
          return cleaned.replace(/""/g, '"').trim();
        };

        const headers = firstLine.split(separator).map(h => cleanVal(h).toLowerCase());
        
        const nisIdx = headers.findIndex(h => h.includes('nis'));
        const namaIdx = headers.findIndex(h => h.includes('nama') || h.includes('lengkap'));
        const kelasIdx = headers.findIndex(h => h.includes('kelas'));
        const taIdx = headers.findIndex(h => h.includes('tahun') || h.includes('ajaran') || h.includes(' ta') || h === 'ta');
        const aktifIdx = headers.findIndex(h => h.includes('aktif') || h.includes('status'));
        const pelantikanIdx = headers.findIndex(h => h.includes('pelantikan') || h.includes('tingkat'));
        const tglPelantikanIdx = headers.findIndex(h => h.includes('tanggal') || h.includes('tgl'));

        if (nisIdx === -1 || namaIdx === -1) {
          alert("Kolom wajib (NIS, Nama Lengkap) tidak ditemukan! Pastikan baris pertama file berisi judul kolom tersebut.");
          return;
        }

        if (importMode === 'campuran' && kelasIdx === -1) {
          alert("Mode Impor Campuran memerlukan kolom 'Kelas' di dalam file CSV!");
          return;
        }

        const parsedSiswaList: Omit<Siswa, 'id'>[] = [];
        const duplicateNisSet = new Set<string>();
        let skippedLinesCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const cells = lines[i].split(separator).map(cleanVal);
          const minCellsNeeded = importMode === 'campuran' ? 3 : 2;
          if (cells.length < minCellsNeeded) {
            skippedLinesCount++;
            continue;
          }

          const rawNis = cells[nisIdx] ? cells[nisIdx].replace(/\D/g, '') : '';
          const rawNama = cells[namaIdx] || '';
          const rawKelas = importMode === 'per_kelas' ? importTargetKelas : (cells[kelasIdx] || '');
          const rawTA = (taIdx !== -1 && cells[taIdx]) ? cells[taIdx] : (importTargetTA || tahunAjaranList[0] || 'TA. 2024-2025');

          if (!rawNis || !rawNama || !rawKelas) {
            skippedLinesCount++;
            continue;
          }

          const cleanNis = rawNis.padStart(4, '0').slice(-4);

          // Check unique NIS constraints
          const isDuplicateInDb = siswa.some(s => s.nis === cleanNis);
          if (isDuplicateInDb || duplicateNisSet.has(cleanNis)) {
            skippedLinesCount++;
            continue;
          }

          duplicateNisSet.add(cleanNis);

          let isAktif = true;
          if (aktifIdx !== -1 && cells[aktifIdx]) {
            const statusStr = cells[aktifIdx].toLowerCase();
            if (statusStr.includes('non') || statusStr.includes('tidak') || statusStr === 'false' || statusStr === '0') {
              isAktif = false;
            }
          }

          let pelantikanVal: Siswa['status_pelantikan'] = 'Calon Penegak';
          if (pelantikanIdx !== -1 && cells[pelantikanIdx]) {
            const pelStr = cells[pelantikanIdx].toLowerCase();
            if (pelStr.includes('laksana')) {
              pelantikanVal = 'Penegak Laksana';
            } else if (pelStr.includes('bantara')) {
              pelantikanVal = 'Penegak Bantara';
            } else if (pelStr.includes('calon bantara')) {
              pelantikanVal = 'Calon Bantara';
            } else if (pelStr.includes('calon laksana')) {
              pelantikanVal = 'Calon Laksana';
            }
          }

          let tglPelantikan: string | undefined = undefined;
          if (tglPelantikanIdx !== -1 && cells[tglPelantikanIdx]) {
            tglPelantikan = cells[tglPelantikanIdx];
          }

          parsedSiswaList.push({
            nis: cleanNis,
            nama_lengkap: rawNama,
            kelas: rawKelas,
            tahun_ajaran: rawTA,
            status_aktif: isAktif,
            status_pelantikan: pelantikanVal,
            tanggal_pelantikan: tglPelantikan || undefined
          });
        }

        if (parsedSiswaList.length === 0) {
          alert("Tidak ada data murid baru yang valid untuk diimpor. Pastikan NIS unik dan kolom terisi lengkap.");
          return;
        }

        onAddMultiple(parsedSiswaList);
        
        let msg = `Berhasil mengimpor ${parsedSiswaList.length} murid baru!`;
        if (skippedLinesCount > 0) {
          msg += ` (Melewatkan ${skippedLinesCount} baris tidak valid atau NIS duplikat).`;
        }
        alert(msg);
        setIsImportModalOpen(false);
      } catch (error: any) {
        console.error(error);
        alert("Gagal mengurai file CSV: " + error.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSiswa, setCurrentSiswa] = useState<Siswa | null>(null); // Null means Add Mode
  
  // Form fields
  const [namaLengkap, setNamaLengkap] = useState('');
  const [kelas, setKelas] = useState('');
  const [tahunAjaran, setTahunAjaran] = useState('TA. 2024-2025');
  const [nis, setNis] = useState('');
  const [nisn, setNisn] = useState('');
  const [emailSekolah, setEmailSekolah] = useState('');
  const [statusSiklus, setStatusSiklus] = useState<StatusSiklus>('Calon Penegak');
  const [jabatanAmbalan, setJabatanAmbalan] = useState('');
  const [statusAktif, setStatusAktif] = useState(true);
  const [statusPelantikan, setStatusPelantikan] = useState<string>('Calon Penegak');
  const [tanggalPelantikan, setTanggalPelantikan] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Delete Confirmation States
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Extract unique classes from the managed master class list
  const uniqueClasses = classList.length > 0
    ? classList.map((k) => k.nama).sort()
    : Array.from(new Set(siswa.map((s) => s.kelas))).filter(Boolean).sort();

  // 1. Enrolled students for selected TA (or all students if 'all')
  const enrolledInSelectedTa = selectedTahunAjaran === 'all'
    ? siswa
    : siswa.filter((s) => resolveSiswaForTA(s, selectedTahunAjaran, tahunAjaranList).isEnrolled);

  // 2. Classes with enrolled students in this TA
  const classesWithStudentsInTa = Array.from(
    new Set(
      enrolledInSelectedTa.map(
        (s) => resolveSiswaForTA(s, selectedTahunAjaran, tahunAjaranList).kelas
      )
    )
  )
    .filter(Boolean)
    .sort();

  // 3. Hierarchical classes for filter: classes that have students in this TA, plus master classList
  const effectiveClassesForFilter = Array.from(
    new Set([
      ...classesWithStudentsInTa,
      ...(classList.length > 0 ? classList.map((k) => k.nama) : [])
    ])
  )
    .filter(Boolean)
    .sort();

  // 4. Accurate student count for a class in the selected TA
  const getStudentCountInClassForTa = (kls: string) => {
    if (selectedTahunAjaran === 'all') {
      return siswa.filter((s) => s.kelas === kls).length;
    }
    return enrolledInSelectedTa.filter(
      (s) => resolveSiswaForTA(s, selectedTahunAjaran, tahunAjaranList).kelas === kls
    ).length;
  };

  // Helper to check Bantara graduation status
  const getIsSiswaBantaraEligible = (s?: Siswa) => {
    if (!s) return false;
    if (s.status_pelantikan === 'Penegak Bantara' || s.status_pelantikan === 'Calon Laksana' || s.status_pelantikan === 'Penegak Laksana') {
      return true;
    }
    const bDefCount = 23; // standard Bantara SKU count
    const bVerifiedCount = sku.filter(
      (item) => item.siswa_id === s.id && item.status_verifikasi && (item.tingkat === 'Bantara' || !item.tingkat)
    ).length;
    return bVerifiedCount >= bDefCount;
  };

  const isFormSiswaBantaraEligible = currentSiswa ? getIsSiswaBantaraEligible(currentSiswa) : false;

  // Filter siswa based on search, active status, selected class, selected pelantikan, siklus, AND selected tahun ajaran
  const filteredSiswa = siswa.filter((s) => {
    const resolved = resolveSiswaForTA(s, selectedTahunAjaran, tahunAjaranList);

    // If specific TA is selected, only show students enrolled in that academic year
    if (selectedTahunAjaran !== 'all' && !resolved.isEnrolled) {
      return false;
    }

    const effectiveClass = selectedTahunAjaran !== 'all' ? resolved.kelas : s.kelas;
    const effectiveAktif = selectedTahunAjaran !== 'all' ? resolved.status_aktif : s.status_aktif;
    const effectiveSiklus = selectedTahunAjaran !== 'all' ? resolved.status_siklus : (s.status_siklus || 'Penegak Aktif');

    const matchesSearch =
      s.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
      effectiveClass.toLowerCase().includes(search.toLowerCase()) ||
      s.kelas.toLowerCase().includes(search.toLowerCase()) ||
      (s.tahun_ajaran && s.tahun_ajaran.toLowerCase().includes(search.toLowerCase())) ||
      (s.nisn && s.nisn.includes(search)) ||
      (s.nis_murid_anggota && s.nis_murid_anggota.includes(search)) ||
      (s.email_sekolah && s.email_sekolah.toLowerCase().includes(search.toLowerCase())) ||
      (s.jabatan_ambalan && s.jabatan_ambalan.toLowerCase().includes(search.toLowerCase())) ||
      s.nis.includes(search);
      
    const matchesActive = 
      filterActive === 'all' || 
      (filterActive === 'active' && effectiveAktif) || 
      (filterActive === 'inactive' && !effectiveAktif);

    const matchesKelas = selectedKelas === 'all' || effectiveClass === selectedKelas;

    const matchesSiklus = filterSiklus === 'all' || effectiveSiklus === filterSiklus;

    let matchesPelantikan = true;
    if (selectedPelantikan === 'unassigned') {
      matchesPelantikan = !s.status_pelantikan;
    } else if (selectedPelantikan !== 'all') {
      matchesPelantikan = s.status_pelantikan === selectedPelantikan;
    }

    return matchesSearch && matchesActive && matchesKelas && matchesPelantikan && matchesSiklus;
  });

  const openAddModal = () => {
    setCurrentSiswa(null);
    setNamaLengkap('');
    setKelas('');
    setTahunAjaran(selectedTahunAjaran !== 'all' ? selectedTahunAjaran : (tahunAjaranList[0] || 'TA. 2024-2025'));
    setNis('');
    setNisn('');
    setEmailSekolah('');
    setStatusSiklus('Calon Penegak');
    setJabatanAmbalan('');
    setStatusAktif(true);
    setStatusPelantikan(pelantikanList[0] || 'Calon Penegak');
    setTanggalPelantikan('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Siswa) => {
    setCurrentSiswa(s);
    setNamaLengkap(s.nama_lengkap);
    setKelas(s.kelas);
    setTahunAjaran(s.tahun_ajaran || tahunAjaranList[0] || 'TA. 2024-2025');
    setNis(s.nis);
    setNisn(s.nis_murid_anggota || s.nisn || '');
    setEmailSekolah(s.email_sekolah || '');
    setStatusSiklus(s.status_siklus || 'Calon Penegak');
    setJabatanAmbalan(s.jabatan_ambalan || '');
    setStatusAktif(s.status_aktif);
    setStatusPelantikan(s.status_pelantikan || '');
    setTanggalPelantikan(s.tanggal_pelantikan || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!namaLengkap.trim() || !kelas.trim() || !nis.trim()) {
      setErrorMsg('Semua kolom wajib diisi!');
      return;
    }

    if (nis.trim().length !== 4 || isNaN(Number(nis))) {
      setErrorMsg('NIS harus tepat berisi 4 digit angka!');
      return;
    }

    // Check unique NIS (except if editing own)
    const exists = siswa.some(
      (s) => s.nis === nis && (!currentSiswa || s.id !== currentSiswa.id)
    );
    if (exists) {
      setErrorMsg('NIS tersebut sudah terdaftar untuk murid lain!');
      return;
    }

    const isCalon = !statusPelantikan || statusPelantikan.toLowerCase().startsWith('calon');

    if (currentSiswa) {
       // Edit
       const selectedTa = tahunAjaran.trim() || currentSiswa.tahun_ajaran || 'TA. 2024-2025';
       const updatedStudent = recordStudentClassHistory(
         {
           ...currentSiswa,
           nama_lengkap: namaLengkap.trim(),
           nis: nis.trim(),
           nisn: nisn.trim() || undefined,
           nis_murid_anggota: nisn.trim() || undefined,
           email_sekolah: emailSekolah.trim() || undefined,
           status_siklus: statusSiklus || undefined,
           jabatan_ambalan: jabatanAmbalan.trim() || undefined,
           status_aktif: statusAktif,
           status_pelantikan: statusPelantikan || undefined,
           tanggal_pelantikan: (!isCalon && statusPelantikan) ? tanggalPelantikan : undefined,
         },
         selectedTa,
         kelas.trim(),
         statusSiklus,
         statusAktif
       );

       updatedStudent.kelas = kelas.trim();
       updatedStudent.tahun_ajaran = selectedTa;

       onUpdate(updatedStudent);
     } else {
       // Add
       const selectedTa = tahunAjaran.trim() || tahunAjaranList[0] || 'TA. 2024-2025';
       const initialHistory: RiwayatAkademik[] = [
         {
           tahun_ajaran: selectedTa,
           kelas: kelas.trim(),
           status_siklus: statusSiklus || 'Calon Penegak',
           status_aktif: statusAktif,
           tanggal_tercatat: new Date().toISOString(),
           catatan: 'Pendaftaran awal anggota'
         }
       ];

       onAdd({
         nama_lengkap: namaLengkap.trim(),
         kelas: kelas.trim(),
         tahun_ajaran: selectedTa,
         nis: nis.trim(),
         nisn: nisn.trim() || undefined,
         nis_murid_anggota: nisn.trim() || undefined,
         email_sekolah: emailSekolah.trim() || undefined,
         status_siklus: statusSiklus || undefined,
         jabatan_ambalan: jabatanAmbalan.trim() || undefined,
         status_aktif: statusAktif,
         status_pelantikan: statusPelantikan || undefined,
         tanggal_pelantikan: (!isCalon && statusPelantikan) ? tanggalPelantikan : undefined,
         riwayat_kelas: initialHistory
       });
     }

    setIsModalOpen(false);
  };

  const triggerDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleQuickStatusUpdate = (s: Siswa, newStatus: string) => {
    if (readOnly) {
      alert("Akses Ditolak: Akun Anda dalam mode Pengawas (Hanya Lihat). Anda tidak dapat mengubah status pelantikan.");
      return;
    }
    // If student ALREADY has newStatus, clicking it again CANCELS / TOGGLES off!
    if (s.status_pelantikan === newStatus) {
      onUpdate({
        ...s,
        status_pelantikan: undefined,
        tanggal_pelantikan: undefined,
      });
      return;
    }

    const isCalonStatus = !newStatus || newStatus.toLowerCase().startsWith('calon');
    onUpdate({
      ...s,
      status_pelantikan: newStatus,
      tanggal_pelantikan: !isCalonStatus ? new Date().toISOString().split('T')[0] : undefined
    });
  };

  const handleCancelPelantikanForSiswa = (s: Siswa) => {
    if (readOnly) return;
    onUpdate({
      ...s,
      status_pelantikan: undefined,
      tanggal_pelantikan: undefined,
    });
  };

  const isCalon = !statusPelantikan || statusPelantikan.toLowerCase().startsWith('calon');

  return (
    <div className="space-y-6" id="siswa_crud_module">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Anggota (Murid)</h2>
          <p className="text-sm text-gray-400 mt-1">Kelola data induk anggota, pantau status keaktifan, dan lakukan pelantikan sesuai kelas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {!readOnly && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition duration-150 cursor-pointer w-full sm:w-auto justify-center"
              title="Impor data anggota dari Microsoft Excel / CSV"
            >
              <Upload className="w-4 h-4" />
              <span>Impor dari Excel</span>
            </button>
          )}
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition duration-150 cursor-pointer w-full sm:w-auto justify-center"
            title="Ekspor data anggota terfilter ke Microsoft Excel (.csv)"
          >
            <FileText className="w-4 h-4" />
            <span>Ekspor ke Excel</span>
          </button>
          {!readOnly && (
            <button
              onClick={openAddModal}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition duration-150 cursor-pointer w-full sm:w-auto justify-center"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Anggota Baru</span>
            </button>
          )}
          {!readOnly && onBatchRollover && (
            <button
              onClick={() => setIsRolloverModalOpen(true)}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition duration-150 cursor-pointer w-full sm:w-auto justify-center"
              title="Promosi atau Kenaikan Kelas Massal Anggota per Tahun Ajaran Baru"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Naik Kelas Massal</span>
            </button>
          )}
          {readOnly && (
            <span className="flex items-center space-x-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-2 rounded-xl text-xs font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Mode Pengawas (Hanya Lihat)</span>
            </span>
          )}
        </div>
      </div>

      {/* Discipline Threshold Settings Panel */}
      <div className="bg-linear-to-r from-indigo-50/50 to-indigo-100/20 p-4 rounded-2xl border border-indigo-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="space-y-1">
          <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center">
            <Sliders className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
            Pengaturan Ambang Batas Kedisiplinan
          </h4>
          <p className="text-[11px] text-gray-500 font-medium">
            Tentukan batas skor kedisiplinan minimum (basis 100). Murid di bawah nilai ini akan mendapatkan tanda peringatan merah.
          </p>
        </div>
        <div className="flex items-center space-x-3 bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-3xs w-fit shrink-0">
          <span className="text-xs font-extrabold text-gray-600">Ambang Batas:</span>
          <div className="flex items-center space-x-1">
            <input
              type="number"
              min={0}
              max={150}
              value={minDisciplineThreshold}
              onChange={(e) => setMinDisciplineThreshold(Number(e.target.value) || 0)}
              className="w-14 bg-gray-50 border border-gray-200 rounded-lg py-1 px-1.5 text-center text-xs font-black text-indigo-950 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-xs font-extrabold text-gray-400">Poin</span>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setSubTab('data_anggota')}
          className={`flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 ${
            subTab === 'data_anggota' ? 'bg-white text-indigo-950 shadow-xs' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Data Induk Anggota</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('status_pelantikan')}
          className={`flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 ${
            subTab === 'status_pelantikan' ? 'bg-white text-indigo-950 shadow-xs' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Status Pelantikan</span>
        </button>
      </div>

      {/* Filter Tabs Section: Tahun Ajaran, Kelas & Status Pelantikan */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
        {/* Tahun Ajaran Filter Tabs */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Filter Berdasarkan Tahun Ajaran:
            </p>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsManageTaOpen(true)}
                className="text-[10px] font-black text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1"
                title="Tambah, edit, atau kelola opsi Tahun Ajaran"
              >
                <Sliders className="w-3 h-3 text-indigo-600" />
                <span>+ Kelola Tahun Ajaran</span>
              </button>
              {selectedTahunAjaran !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedTahunAjaran('all')}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer flex items-center space-x-1"
                >
                  <X className="w-3 h-3" />
                  <span>Reset TA</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 p-1 bg-gray-50 border border-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedTahunAjaran('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                selectedTahunAjaran === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Semua TA ({siswa.length})
            </button>
            {tahunAjaranList.map((ta) => {
              const count = siswa.filter((s) => resolveSiswaForTA(s, ta, tahunAjaranList).isEnrolled).length;
              const isSelected = selectedTahunAjaran === ta;
              return (
                <button
                  type="button"
                  key={ta}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedTahunAjaran('all');
                    } else {
                      setSelectedTahunAjaran(ta);
                    }
                    setSelectedKelas('all');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400'
                      : 'text-gray-600 hover:bg-gray-100 bg-white border border-gray-200/60'
                  }`}
                >
                  <span>{ta}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {count}
                  </span>
                  {isSelected && <X className="w-3 h-3 text-white/80 hover:text-white ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Class Filter Tabs */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center">
              <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
              Filter Berdasarkan Kelas {selectedTahunAjaran !== 'all' ? `(${selectedTahunAjaran})` : ''}:
            </p>
            {selectedKelas !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedKelas('all')}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                Reset Kelas
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 p-1 bg-gray-50 border border-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedKelas('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                selectedKelas === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Semua Kelas ({enrolledInSelectedTa.length})
            </button>
            {effectiveClassesForFilter.map((kls) => {
              const count = getStudentCountInClassForTa(kls);
              const isSelected = selectedKelas === kls;
              return (
                <button
                  type="button"
                  key={kls}
                  onClick={() => setSelectedKelas(isSelected ? 'all' : kls)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400'
                      : 'text-gray-600 hover:bg-gray-100 bg-white border border-gray-200/60'
                  }`}
                >
                  <span>Kelas {kls}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : count > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {count}
                  </span>
                  {isSelected && <X className="w-3 h-3 text-white/80 hover:text-white ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pelantikan Filter Tabs */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center">
              <Award className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              Filter Berdasarkan Status Pelantikan / Tingkat:
            </p>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsManagePelantikanOpen(true)}
                className="text-[10px] font-black text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1"
                title="Tambah, edit, atau hapus jenis status pelantikan"
              >
                <Sliders className="w-3 h-3 text-amber-600" />
                <span>+ Kelola Opsi Status</span>
              </button>
              {selectedPelantikan !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedPelantikan('all')}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer flex items-center space-x-1"
                  title="Batalkan filter status pelantikan"
                >
                  <X className="w-3 h-3" />
                  <span>Batal Pilih Status</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 p-1 bg-gray-50 border border-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedPelantikan('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                selectedPelantikan === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Semua Status ({siswa.length})
            </button>

            {pelantikanList.map((pName) => {
              const count = siswa.filter((s) => s.status_pelantikan === pName).length;
              const isSelected = selectedPelantikan === pName;
              return (
                <button
                  type="button"
                  key={pName}
                  onClick={() => setSelectedPelantikan(isSelected ? 'all' : pName)}
                  title={isSelected ? 'Klik untuk membatalkan filter status ini' : `Filter ${pName}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400'
                      : 'text-gray-600 hover:bg-gray-100 bg-white border border-gray-200/60'
                  }`}
                >
                  <span>{pName}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {count}
                  </span>
                  {isSelected && <X className="w-3 h-3 text-white/80 hover:text-white ml-0.5" />}
                </button>
              );
            })}

            {siswa.some((s) => !s.status_pelantikan) && (
              <button
                type="button"
                onClick={() => setSelectedPelantikan(selectedPelantikan === 'unassigned' ? 'all' : 'unassigned')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
                  selectedPelantikan === 'unassigned'
                    ? 'bg-gray-800 text-white shadow-xs ring-2 ring-gray-400'
                    : 'text-gray-500 hover:bg-gray-100 bg-white border border-gray-200/60'
                }`}
              >
                <span>Tanpa Status</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  selectedPelantikan === 'unassigned' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {siswa.filter((s) => !s.status_pelantikan).length}
                </span>
                {selectedPelantikan === 'unassigned' && <X className="w-3 h-3 text-white/80 ml-0.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Siklus Hidup Anggota Filter Tabs */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center">
              <Users2 className="w-3.5 h-3.5 mr-1.5 text-purple-500" />
              Filter Siklus Hidup Anggota:
            </p>
            {filterSiklus !== 'all' && (
              <button
                type="button"
                onClick={() => setFilterSiklus('all')}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                Reset Siklus
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 p-1 bg-gray-50 border border-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterSiklus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                filterSiklus === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Semua Siklus ({siswa.length})
            </button>
            {(['Calon Penegak', 'Penegak Aktif', 'Dewan Kehormatan / Alumni', 'Purna Ambalan', 'Non-Aktif'] as StatusSiklus[]).map((st) => {
              const count = siswa.filter((s) => s.status_siklus === st || (!s.status_siklus && st === 'Penegak Aktif')).length;
              const isSelected = filterSiklus === st;
              return (
                <button
                  type="button"
                  key={st}
                  onClick={() => setFilterSiklus(isSelected ? 'all' : st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <span>{st}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {count}
                  </span>
                  {isSelected && <X className="w-3 h-3 text-white/80 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Visual notification/alert for students with low discipline points */}
      {(() => {
        const studentsBelow = filteredSiswa.filter(s => getSiswaNetPoints(s.id) < minDisciplineThreshold);
        if (studentsBelow.length === 0) return null;
        return (
          <div className="bg-rose-50 border border-rose-150 rounded-2xl p-4 flex items-start space-x-3 text-rose-950 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-rose-900">Peringatan Kedisiplinan Rendah</h4>
              <p className="text-xs text-rose-700 leading-relaxed">
                Terdapat <b>{studentsBelow.length} anggota</b> dengan skor kedisiplinan di bawah ambang batas minimum (<b>{minDisciplineThreshold} poin</b>). Harap lakukan bimbingan konseling atau penegakan kode etik gerakan pramuka.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {studentsBelow.map((s) => (
                  <span key={s.id} className="bg-white/90 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-rose-200/50 flex items-center">
                    {s.nama_lengkap} (Kelas {s.kelas}: {getSiswaNetPoints(s.id)} Poin)
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Active Filter Summary Bar */}
      {(selectedPelantikan !== 'all' || selectedKelas !== 'all' || selectedTahunAjaran !== 'all' || search.trim() !== '' || filterActive !== 'all') && (
        <div className="bg-indigo-50/80 border border-indigo-100 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-indigo-950 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Menampilkan <b>{filteredSiswa.length}</b> dari {siswa.length} anggota:</span>
            {selectedTahunAjaran !== 'all' && (
              <span className="bg-indigo-700 text-white px-2.5 py-0.5 rounded-full font-extrabold text-[10px] flex items-center space-x-1">
                <span>TA: {selectedTahunAjaran}</span>
                <X className="w-3 h-3 cursor-pointer hover:opacity-80 ml-1" onClick={() => setSelectedTahunAjaran('all')} />
              </span>
            )}
            {selectedPelantikan !== 'all' && (
              <span className="bg-amber-600 text-white px-2.5 py-0.5 rounded-full font-extrabold text-[10px] flex items-center space-x-1">
                <span>Status: {selectedPelantikan}</span>
                <X className="w-3 h-3 cursor-pointer hover:opacity-80 ml-1" onClick={() => setSelectedPelantikan('all')} />
              </span>
            )}
            {selectedKelas !== 'all' && (
              <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-full font-extrabold text-[10px] flex items-center space-x-1">
                <span>Kelas: {selectedKelas}</span>
                <X className="w-3 h-3 cursor-pointer hover:opacity-80 ml-1" onClick={() => setSelectedKelas('all')} />
              </span>
            )}
            {filterActive !== 'all' && (
              <span className="bg-gray-700 text-white px-2.5 py-0.5 rounded-full font-extrabold text-[10px] flex items-center space-x-1">
                <span>Keaktifan: {filterActive === 'active' ? 'Aktif' : 'Nonaktif'}</span>
                <X className="w-3 h-3 cursor-pointer hover:opacity-80 ml-1" onClick={() => setFilterActive('all')} />
              </span>
            )}
            {search.trim() !== '' && (
              <span className="bg-slate-700 text-white px-2.5 py-0.5 rounded-full font-extrabold text-[10px] flex items-center space-x-1">
                <span>Pencarian: "{search}"</span>
                <X className="w-3 h-3 cursor-pointer hover:opacity-80 ml-1" onClick={() => setSearch('')} />
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedTahunAjaran('all');
              setSelectedPelantikan('all');
              setSelectedKelas('all');
              setSearch('');
              setFilterActive('all');
            }}
            className="text-indigo-700 hover:text-indigo-900 font-black text-xs flex items-center space-x-1 cursor-pointer shrink-0 ml-auto bg-white/80 px-2.5 py-1 rounded-lg border border-indigo-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Semua Filter</span>
          </button>
        </div>
      )}

      {/* Search and Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder={subTab === 'status_pelantikan' ? "Cari nama anggota..." : "Cari nama, kelas, atau NIS..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center space-x-2 w-full md:w-auto overflow-x-auto">
          {/* Status Pelantikan Quick Selector Dropdown */}
          <select
            value={selectedPelantikan}
            onChange={(e) => setSelectedPelantikan(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition cursor-pointer"
          >
            <option value="all">Semua Status Pelantikan ({siswa.length})</option>
            {pelantikanList.map((pName) => {
              const count = siswa.filter((s) => s.status_pelantikan === pName).length;
              return (
                <option key={pName} value={pName}>
                  {pName} ({count})
                </option>
              );
            })}
            <option value="unassigned">Tanpa Status Pelantikan ({siswa.filter((s) => !s.status_pelantikan).length})</option>
          </select>

          <button
            type="button"
            onClick={() => setFilterActive('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterActive === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            Semua ({siswa.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterActive('active')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterActive === 'active'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            Aktif ({siswa.filter((s) => s.status_aktif).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterActive('inactive')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterActive === 'inactive'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            Nonaktif ({siswa.filter((s) => !s.status_aktif).length})
          </button>
        </div>
      </div>

      {subTab === 'data_anggota' ? (
        /* Main Table View (Data Induk) */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">NIS</th>
                  <th className="p-4">Nama Lengkap</th>
                  <th className="p-4">Kelas & TA</th>
                  <th className="p-4 text-center">Status Pelantikan</th>
                  <th className="p-4 text-center">Rata Absen</th>
                  <th className="p-4 text-center">Progres SKU</th>
                  <th className="p-4 text-center">Disiplin</th>
                  <th className="p-4 text-center">Nilai Akhir (30-30-40)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
                {filteredSiswa.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-gray-400">
                      Tidak ditemukan data anggota yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredSiswa.map((s) => {
                    // Live calculate grades
                    const grades = calculateNilaiSiswa(s, kehadiran, materi, sku);
                    const disciplineScore = getSiswaNetPoints(s.id);
                    const isBelowThreshold = disciplineScore < minDisciplineThreshold;
                    const resAcademic = resolveSiswaForTA(s, selectedTahunAjaran, tahunAjaranList);
                    const effectiveClass = selectedTahunAjaran !== 'all' ? resAcademic.kelas : s.kelas;
                    
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4 font-mono text-xs font-semibold text-gray-500">{s.nis}</td>
                        <td className="p-4">
                          <div className="font-extrabold text-gray-800 flex items-center gap-1.5 flex-wrap">
                            <span>{s.nama_lengkap}</span>
                            {s.jabatan_ambalan && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                                {s.jabatan_ambalan}
                              </span>
                            )}
                          </div>
                          {(s.nis_murid_anggota || s.nisn || s.email_sekolah) && (
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mt-0.5">
                              {(s.nis_murid_anggota || s.nisn) && <span>NIS Murid Anggota: {s.nis_murid_anggota || s.nisn}</span>}
                              {s.email_sekolah && <span className="text-gray-500 truncate max-w-[140px]" title={s.email_sekolah}>{s.email_sekolah}</span>}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800">{effectiveClass}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50/80 px-1.5 py-0.5 rounded w-fit border border-indigo-100">
                                {selectedTahunAjaran !== 'all' ? selectedTahunAjaran : (s.tahun_ajaran || 'TA. 2024-2025')}
                              </span>
                              {selectedTahunAjaran !== 'all' && resAcademic.kelas !== s.kelas && (
                                <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200" title={`Kelas asal pendaftaran: ${s.kelas} (${s.tahun_ajaran})`}>
                                  {resAcademic.isExplicitHistory ? 'Arsip' : 'Promosi'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full uppercase tracking-wider ${
                              s.status_pelantikan === 'Penegak Laksana' ? 'bg-purple-100 text-purple-800 border border-purple-200/50' :
                              s.status_pelantikan === 'Calon Laksana' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                              s.status_pelantikan === 'Penegak Bantara' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200/50' :
                              s.status_pelantikan === 'Calon Bantara' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                              'bg-amber-100 text-amber-800 border border-amber-200/50'
                            }`}>
                              {s.status_pelantikan || 'Calon Penegak'}
                            </span>
                            {s.tanggal_pelantikan && (
                              <span className="text-[9px] text-gray-400 font-bold mt-0.5">
                                {new Date(s.tanggal_pelantikan).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: '2-digit'})}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center font-bold text-gray-700">{grades.persen_kehadiran}%</td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center space-y-0.5">
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                              Bantara: <b>{grades.sku_lulus}</b>/23
                            </span>
                            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                              Laksana: <b>{grades.sku_laksana_lulus}</b>/22
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => setDisciplineModalSiswa(s)}
                            className="flex flex-col items-center justify-center space-y-0.5 group cursor-pointer mx-auto transition-transform hover:scale-105"
                            title="Klik untuk membuka Riwayat Poin Kedisiplinan"
                          >
                            <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg border group-hover:ring-2 group-hover:ring-indigo-400 ${
                              isBelowThreshold 
                                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                              {disciplineScore}
                            </span>
                            {isBelowThreshold && (
                              <span className="text-[8px] text-rose-600 font-black flex items-center space-x-0.5 uppercase tracking-wide" title={`Di bawah batas minimum (${minDisciplineThreshold} Poin)`}>
                                <AlertTriangle className="w-2.5 h-2.5 text-rose-500 mr-0.5 shrink-0" />
                                <span>Rendah</span>
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-sm font-black text-indigo-950">{grades.nilai_total}</span>
                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black text-white ${
                              grades.predikat === 'A' ? 'bg-emerald-500' :
                              grades.predikat === 'B' ? 'bg-indigo-500' :
                              grades.predikat === 'C' ? 'bg-amber-500' : 'bg-red-500'
                            }`} title={`Predikat ${grades.predikat}`}>
                              {grades.predikat}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col space-y-1 items-start">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              s.status_aktif 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}>
                              {s.status_aktif ? 'Aktif' : 'Nonaktif'}
                            </span>
                            {s.status_siklus && (
                              <span className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded ${
                                s.status_siklus === 'Penegak Aktif' ? 'bg-emerald-50 text-emerald-700' :
                                s.status_siklus === 'Calon Penegak' ? 'bg-blue-50 text-blue-700' :
                                s.status_siklus === 'Dewan Kehormatan / Alumni' ? 'bg-amber-50 text-amber-800' :
                                s.status_siklus === 'Purna Ambalan' ? 'bg-purple-50 text-purple-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {s.status_siklus}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => {
                                setDetailSiswaId(s.id);
                                setDetailActiveTab('overview');
                              }}
                              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
                              title="Lihat Detail & Rapor Anggota"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDisciplineModalSiswa(s)}
                              className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition cursor-pointer"
                              title="Riwayat Poin Kedisiplinan"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                            {!readOnly && (
                              <button
                                onClick={() => openEditModal(s)}
                                className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition cursor-pointer"
                                title="Edit data anggota"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {!readOnly && (
                              <button
                                onClick={() => triggerDelete(s.id)}
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                                title="Hapus data anggota"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Status Pelantikan Tab View */
        <div className="space-y-5">
          {/* Summary Cards by Pelantikan Level */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {pelantikanList.map((pName) => {
              const count = siswa.filter((s) => s.status_pelantikan === pName).length;
              const isActive = selectedPelantikan === pName;
              return (
                <button
                  type="button"
                  key={pName}
                  onClick={() => setSelectedPelantikan(isActive ? 'all' : pName)}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between shadow-2xs ${
                    isActive
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 scale-[1.02]'
                      : 'bg-white border-gray-150 text-gray-800 hover:border-indigo-200 hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-indigo-100' : 'text-gray-400'}`}>
                      {pName}
                    </span>
                    <Award className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-amber-500'}`} />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className={`text-2xl font-black ${isActive ? 'text-white' : 'text-gray-900'}`}>{count}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {isActive ? 'Terfilter' : 'Pilih'}
                    </span>
                  </div>
                </button>
              );
            })}

            {siswa.some((s) => !s.status_pelantikan) && (
              <button
                type="button"
                onClick={() => setSelectedPelantikan(selectedPelantikan === 'unassigned' ? 'all' : 'unassigned')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between shadow-2xs ${
                  selectedPelantikan === 'unassigned'
                    ? 'bg-gray-800 text-white ring-2 ring-gray-400 scale-[1.02]'
                    : 'bg-gray-50/80 border-gray-200 text-gray-700 hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${selectedPelantikan === 'unassigned' ? 'text-gray-200' : 'text-gray-400'}`}>
                    Tanpa Status
                  </span>
                  <Award className="w-4 h-4 text-gray-400" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black">{siswa.filter((s) => !s.status_pelantikan).length}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    selectedPelantikan === 'unassigned' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {selectedPelantikan === 'unassigned' ? 'Terfilter' : 'Pilih'}
                  </span>
                </div>
              </button>
            )}
          </div>

          {filteredSiswa.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
              Tidak ditemukan data anggota yang cocok dengan kriteria filter pelantikan atau kelas ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSiswa.map((s) => {
                const bEligible = getIsSiswaBantaraEligible(s);
                return (
                  <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs hover:border-indigo-100 transition space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-gray-800 text-sm leading-snug">{s.nama_lengkap}</h4>
                          <button
                            type="button"
                            onClick={() => {
                              setDetailSiswaId(s.id);
                              setDetailActiveTab('overview');
                            }}
                            className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md transition cursor-pointer"
                            title="Lihat Rapor Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                          NIS: {s.nis} &bull; Kelas: <span className="text-gray-700 font-bold">{resolveSiswaForTA(s, selectedTahunAjaran, tahunAjaranList).kelas}</span> &bull; <span className="text-indigo-600 font-extrabold">{selectedTahunAjaran !== 'all' ? selectedTahunAjaran : (s.tahun_ajaran || 'TA. 2024-2025')}</span>
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        s.status_pelantikan ? 'bg-indigo-100 text-indigo-800 border border-indigo-200/50' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {s.status_pelantikan || 'Tanpa Status'}
                      </span>
                    </div>

                    {/* Bantara Eligibility Indicator */}
                    <div className="flex items-center space-x-2 text-[10px]">
                      {bEligible ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100/50 px-2 py-1 rounded-lg font-bold flex items-center">
                          <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Memenuhi Syarat Laksana (Bantara Lulus ✓)
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 border border-amber-100/50 px-2 py-1 rounded-lg font-bold flex items-center">
                          <Lock className="w-3 h-3 mr-1 text-amber-600" />
                          Terkunci dari Laksana (Bantara Belum Lulus)
                        </span>
                      )}
                    </div>

                    {/* Quick status edit selectors */}
                    <div className="space-y-2 pt-2 border-t border-gray-50">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ubah Status Pelantikan:</p>
                        {s.status_pelantikan && (
                          <button
                            type="button"
                            onClick={() => handleCancelPelantikanForSiswa(s)}
                            className="text-[10px] font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer flex items-center space-x-0.5"
                            title="Batalkan status pelantikan anggota ini"
                          >
                            <X className="w-3 h-3" />
                            <span>Batal Status</span>
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-extrabold">
                        {pelantikanList.map((pName) => {
                          const isCurrent = s.status_pelantikan === pName;
                          return (
                            <button
                              type="button"
                              key={pName}
                              onClick={() => handleQuickStatusUpdate(s, pName)}
                              title={isCurrent ? 'Klik untuk membatalkan status pelantikan' : `Tetapkan status ${pName}`}
                              className={`py-1.5 px-2.5 rounded-lg border text-center transition cursor-pointer flex items-center space-x-1 ${
                                isCurrent
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs font-black ring-2 ring-indigo-300'
                                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                              }`}
                            >
                              <span>{pName}</span>
                              {isCurrent && <Check className="w-3 h-3 text-white ml-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CRUD Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 max-w-md w-full shadow-2xl p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-indigo-600" />
              {currentSiswa ? 'Perbarui Data Siswa' : 'Registrasi Siswa Baru'}
            </h3>

            {errorMsg && (
              <div className="bg-rose-50 text-rose-700 border border-rose-200 p-3 rounded-xl mb-4 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jihan Pratama"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Kelas</label>
                  <select
                    required
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition font-semibold"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {uniqueClasses.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="Belum Ditentukan">Belum Ditentukan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Tahun Ajaran</label>
                  <select
                    required
                    value={tahunAjaran}
                    onChange={(e) => setTahunAjaran(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition font-semibold"
                  >
                    {tahunAjaranList.map((ta) => (
                      <option key={ta} value={ta}>
                        {ta}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">NIS (4 Digit Angka Sekolah)</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="Contoh: 1001"
                  value={nis}
                  onChange={(e) => setNis(e.target.value.replace(/\D/g, ''))} // only digits
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    NIS Murid Anggota
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="Nomor Induk / NIS Murid Anggota"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Akun Email Sekolah (SSO)
                  </label>
                  <input
                    type="email"
                    placeholder="nama@smkbaktidhata.sch.id"
                    value={emailSekolah}
                    onChange={(e) => setEmailSekolah(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Status Siklus Hidup
                  </label>
                  <select
                    value={statusSiklus}
                    onChange={(e) => setStatusSiklus(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition font-semibold"
                  >
                    <option value="Calon Penegak">Calon Penegak (Kelas X)</option>
                    <option value="Penegak Aktif">Penegak Aktif (Bantara/Laksana)</option>
                    <option value="Dewan Kehormatan / Alumni">Dewan Kehormatan / Alumni</option>
                    <option value="Purna Ambalan">Purna Ambalan (Lulus)</option>
                    <option value="Non-Aktif">Non-Aktif / Pindah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Jabatan Dewan Ambalan
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Pradana, Kerani, Anggota"
                    value={jabatanAmbalan}
                    onChange={(e) => setJabatanAmbalan(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition font-semibold"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Status Pelantikan</label>
                  {statusPelantikan && (
                    <button
                      type="button"
                      onClick={() => {
                        setStatusPelantikan('');
                        setTanggalPelantikan('');
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer flex items-center space-x-1"
                      title="Batalkan/kosongkan pilihan status pelantikan"
                    >
                      <X className="w-3 h-3" />
                      <span>Batal Pilih Status</span>
                    </button>
                  )}
                </div>
                <select
                  value={statusPelantikan}
                  onChange={(e) => setStatusPelantikan(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition font-semibold"
                >
                  <option value="">-- Tanpa Status Pelantikan / Batalkan --</option>
                  {pelantikanList.map((pName) => (
                    <option key={pName} value={pName}>
                      {pName}
                    </option>
                  ))}
                </select>
              </div>

              {!isCalon && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Tanggal Pelantikan</label>
                  <input
                    type="date"
                    required
                    value={tanggalPelantikan}
                    onChange={(e) => setTanggalPelantikan(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                  />
                </div>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="status_aktif_form"
                  checked={statusAktif}
                  onChange={(e) => setStatusAktif(e.target.checked)}
                  className="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded-sm"
                />
                <label htmlFor="status_aktif_form" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Status Aktif (Mengikuti Latihan Pramuka)
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold py-2.5 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {currentSiswa ? 'Simpan Perubahan' : 'Daftarkan Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialogue */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-gray-100">
            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <div className="p-2 bg-rose-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Konfirmasi Hapus Murid</h3>
            </div>
            
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus murid ini dari sistem? <br />
              <b className="text-gray-800">PENTING:</b> Menghapus data murid juga akan menghapus seluruh data yang berelasi (riwayat kehadiran, tabungan, nilai evaluasi, dan progres SKU) secara permanen sesuai aturan relasi database <code className="bg-gray-100 px-1 py-0.5 rounded text-rose-600 font-mono text-xs">ON DELETE CASCADE</code>.
            </p>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold py-2.5 rounded-xl transition cursor-pointer"
              >
                Batalkan
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold py-2.5 rounded-xl transition cursor-pointer"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="excel_import_modal">
          <div className="bg-white rounded-2xl border border-gray-100 max-w-lg w-full shadow-2xl p-6 relative">
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-indigo-600" />
              Impor Data Murid dari Excel / CSV
            </h3>
            
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Unggah file Excel yang disimpan dalam format <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold text-indigo-600">.csv</code> untuk mengimpor banyak murid sekaligus.
            </p>

            {/* Selector Tipe Impor */}
            <div className="mb-4">
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5">Metode Impor</label>
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setImportMode('per_kelas')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    importMode === 'per_kelas'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sesuai Pilihan Kelas
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('campuran')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    importMode === 'campuran'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Campuran Kelas (CSV)
                </button>
              </div>
            </div>

            {/* Dropdown Kelas jika Mode per_kelas */}
            {importMode === 'per_kelas' && (
              <div className="mb-4">
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Kelas Tujuan Murid</label>
                <select
                  value={importTargetKelas}
                  onChange={(e) => setImportTargetKelas(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {classList.map((c) => (
                    <option key={c.id} value={c.nama}>
                      Kelas {c.nama}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Seluruh data murid di dalam file CSV akan dimasukkan ke dalam <b>Kelas {importTargetKelas}</b>.</p>
              </div>
            )}

            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 space-y-3 mb-4">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Panduan & Aturan Format:</h4>
              <ul className="text-xs text-indigo-950 space-y-1.5 list-disc pl-4 font-medium leading-relaxed">
                {importMode === 'per_kelas' ? (
                  <>
                    <li>Kolom wajib: <b className="text-indigo-950 font-black font-sans">NIS</b> (Kolom A) dan <b className="text-indigo-950 font-black font-sans">Nama Lengkap</b> (Kolom B).</li>
                    <li><span className="text-emerald-700 font-extrabold">&bull; Bebas Kolom Kelas</span>: Tidak perlu menyertakan kolom Kelas di file CSV.</li>
                  </>
                ) : (
                  <>
                    <li>Kolom wajib: <b className="text-indigo-950 font-black font-sans">NIS</b> (Kolom A), <b className="text-indigo-950 font-black font-sans">Nama Lengkap</b> (Kolom B), dan <b className="text-indigo-950 font-black font-sans">Kelas</b> (Kolom C).</li>
                  </>
                )}
                <li>Kolom opsional berikutnya: <b>Status Aktif</b>, <b>Status Pelantikan</b>, <b>Tanggal Pelantikan</b>.</li>
                <li>Kolom <b>NIS</b> harus unik (4 digit angka). Baris dengan NIS duplikat akan dilewati.</li>
              </ul>
              
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center space-x-1.5 bg-white hover:bg-gray-50 text-indigo-600 text-xs font-black px-3 py-2 rounded-lg border border-indigo-200 transition shadow-3xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template CSV ({importMode === 'per_kelas' ? 'Per Kelas' : 'Campuran'})</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition cursor-pointer relative bg-gray-50/50">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <span className="block text-xs font-extrabold text-gray-700">Klik atau seret file CSV di sini</span>
                <span className="block text-[10px] text-gray-400 mt-1">Hanya menerima file berformat .csv</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold py-2.5 rounded-xl transition cursor-pointer text-center"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail View Modal (Rapor & Profil Anggota) */}
      {detailSiswa && detailGrades && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="student_detail_modal">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="bg-indigo-950 text-white p-6 relative flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-900">
              <button
                onClick={handleCloseDetail}
                className="absolute right-4 top-4 text-indigo-300 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-800 border-2 border-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                  {detailSiswa.nama_lengkap.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-extrabold text-white tracking-tight">{detailSiswa.nama_lengkap}</h3>
                    <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${
                      detailSiswa.status_aktif ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {detailSiswa.status_aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 font-medium mt-1 flex flex-wrap items-center gap-3">
                    <span>NIS: <b className="font-mono text-white">{detailSiswa.nis}</b></span>
                    {(detailSiswa.nis_murid_anggota || detailSiswa.nisn) && (
                      <>
                        <span>&bull;</span>
                        <span>NIS Murid Anggota: <b className="font-mono text-white">{detailSiswa.nis_murid_anggota || detailSiswa.nisn}</b></span>
                      </>
                    )}
                    <span>&bull;</span>
                    <span>Kelas: <b className="text-white">{detailSiswa.kelas}</b></span>
                    <span>&bull;</span>
                    <span>Tahun Ajaran: <b className="text-indigo-300 font-extrabold">{detailSiswa.tahun_ajaran || 'TA. 2024-2025'}</b></span>
                    <span>&bull;</span>
                    <span>Tingkat: <b className="text-white">{detailSiswa.status_pelantikan || 'Calon Penegak'}</b></span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2 md:pt-0">
                <button
                  onClick={() => {
                    handleCloseDetail();
                    openEditModal(detailSiswa);
                  }}
                  className="px-3.5 py-2 bg-indigo-800 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Data Murid</span>
                </button>
              </div>
            </div>

            {/* Sub-navigation inside detail modal */}
            <div className="bg-gray-50 border-b border-gray-100 px-6 py-2 flex overflow-x-auto gap-2 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setDetailActiveTab('overview')}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                  detailActiveTab === 'overview' ? 'bg-white text-indigo-950 shadow-xs border border-gray-200/60' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Rapor & Rangkuman Nilai</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailActiveTab('riwayat_akademik')}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                  detailActiveTab === 'riwayat_akademik' ? 'bg-white text-indigo-950 shadow-xs border border-gray-200/60' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <History className="w-4 h-4 text-indigo-600" />
                <span>Riwayat Kelas & TA ({tahunAjaranList.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailActiveTab('absensi')}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                  detailActiveTab === 'absensi' ? 'bg-white text-indigo-950 shadow-xs border border-gray-200/60' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Kehadiran ({detailKehadiranLogs.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailActiveTab('sku')}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                  detailActiveTab === 'sku' ? 'bg-white text-indigo-950 shadow-xs border border-gray-200/60' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Progres SKU ({detailSkuLogs.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailActiveTab('kedisiplinan')}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                  detailActiveTab === 'kedisiplinan' ? 'bg-white text-indigo-950 shadow-xs border border-gray-200/60' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Kedisiplinan ({detailDisciplineLogs.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailActiveTab('tabungan')}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                  detailActiveTab === 'tabungan' ? 'bg-white text-indigo-950 shadow-xs border border-gray-200/60' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Landmark className="w-4 h-4 text-amber-600" />
                <span>Tabungan ({detailSavingsLogs.length})</span>
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Tab 1: Overview / Rapor Nilai */}
              {detailActiveTab === 'overview' && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl">
                      <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Persentase Kehadiran</span>
                      <p className="text-2xl font-black text-indigo-950 mt-1">{detailGrades.persen_kehadiran}%</p>
                      <p className="text-[10px] text-indigo-700 font-extrabold mt-0.5">Skor (30%): {detailGrades.skor_kehadiran.toFixed(1)}</p>
                    </div>

                    <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl">
                      <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">Evaluasi Materi</span>
                      <p className="text-2xl font-black text-purple-950 mt-1">{detailGrades.skor_materi.toFixed(1)} Poin</p>
                      <p className="text-[10px] text-purple-700 font-extrabold mt-0.5">Maksimal Skor: 30.0</p>
                    </div>

                    <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl">
                      <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Verifikasi SKU</span>
                      <p className="text-2xl font-black text-amber-950 mt-1">{detailGrades.sku_lulus}/23 Bantara</p>
                      <p className="text-[10px] text-amber-700 font-extrabold mt-0.5">Skor (40%): {detailGrades.skor_sku.toFixed(1)}</p>
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
                      <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Nilai Total & Predikat</span>
                      <div className="flex items-baseline space-x-2 mt-1">
                        <span className="text-2xl font-black text-emerald-950">{detailGrades.nilai_total}</span>
                        <span className="text-sm font-black px-2 py-0.5 rounded-lg bg-emerald-600 text-white">{detailGrades.predikat}</span>
                      </div>
                      <p className="text-[10px] text-emerald-700 font-extrabold mt-0.5">Disiplin: {detailDisciplineScore} Poin</p>
                    </div>
                  </div>

                  {/* Formula Breakdown Panel */}
                  <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider flex items-center">
                      <FileText className="w-4 h-4 mr-1.5 text-indigo-600" />
                      Rincian Formula Penilaian Pramuka Penegak
                    </h4>
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between font-bold text-gray-700 mb-1">
                          <span>1. Kehadiran Latihan Mingguan (Bobot 30%)</span>
                          <span>{detailGrades.persen_kehadiran}% &rarr; Skor: {detailGrades.skor_kehadiran.toFixed(1)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${Math.min(100, detailGrades.persen_kehadiran)}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-bold text-gray-700 mb-1">
                          <span>2. Evaluasi Ujian Materi (Bobot 30%)</span>
                          <span>Skor: {detailGrades.skor_materi.toFixed(1)} / 30</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min(100, (detailGrades.skor_materi / 30) * 100)}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-bold text-gray-700 mb-1">
                          <span>3. Progres Penyelesaian SKU Bantara/Laksana (Bobot 40%)</span>
                          <span>Skor: {detailGrades.skor_sku.toFixed(1)} / 40</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.min(100, (detailGrades.skor_sku / 40) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Riwayat Kelas & Sinkronisasi TA */}
              {detailActiveTab === 'riwayat_akademik' && (
                <div className="space-y-5">
                  <div className="bg-indigo-50/70 border border-indigo-150 p-4 rounded-2xl flex items-start space-x-3">
                    <History className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-xs text-indigo-950 uppercase tracking-wider">
                        Rekapitulasi Riwayat Kelas & Kenaikan Tahun Ajaran
                      </h4>
                      <p className="text-xs text-indigo-800/80 mt-1 leading-relaxed">
                        Data riwayat akademik tersimpan secara permanen untuk setiap Tahun Ajaran (TA). Anggota yang berpindah ke TA baru secara otomatis berelasi dan naik tingkat kelas tanpa menghapus atau menimpa arsip pada tahun-tahun sebelumnya.
                      </p>
                    </div>
                  </div>

                  {/* Inline history editor banner if editing */}
                  {editingHistoryTa && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-900 flex items-center">
                          <Sliders className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                          Sesuaikan Status Kelas untuk {editingHistoryTa}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingHistoryTa(null)}
                          className="text-amber-700 hover:text-amber-950 text-xs font-bold"
                        >
                          Batal
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Pilih / Input Kelas</label>
                          <input
                            type="text"
                            list="class-history-options"
                            value={editingHistoryKelas}
                            onChange={(e) => setEditingHistoryKelas(e.target.value)}
                            placeholder="Contoh: X RPL 1, XI RPL 1..."
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <datalist id="class-history-options">
                            {classList.map((k) => (
                              <option key={k.id} value={k.nama} />
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Status Siklus</label>
                          <select
                            value={editingHistorySiklus}
                            onChange={(e) => setEditingHistorySiklus(e.target.value as StatusSiklus)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="Calon Penegak">Calon Penegak</option>
                            <option value="Penegak Aktif">Penegak Aktif</option>
                            <option value="Dewan Ambalan Aktif">Dewan Ambalan Aktif</option>
                            <option value="Purna Ambalan">Purna Ambalan</option>
                            <option value="Dewan Kehormatan / Alumni">Dewan Kehormatan / Alumni</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Status Keaktifan</label>
                          <select
                            value={editingHistoryAktif ? 'aktif' : 'nonaktif'}
                            onChange={(e) => setEditingHistoryAktif(e.target.value === 'aktif')}
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="aktif">Aktif Terdaftar</option>
                            <option value="nonaktif">Non-Aktif / Pindah / Alumni</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (!editingHistoryKelas.trim()) return;
                            const updated = recordStudentClassHistory(
                              detailSiswa,
                              editingHistoryTa,
                              editingHistoryKelas.trim(),
                              editingHistorySiklus,
                              editingHistoryAktif,
                              'Diperbarui secara manual melalui Rapor Detail'
                            );
                            onUpdate(updated);
                            setEditingHistoryTa(null);
                          }}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Simpan Koreksi TA Ini</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of all academic years and student status */}
                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          <th className="p-3.5">Tahun Ajaran</th>
                          <th className="p-3.5">Posisi Kelas</th>
                          <th className="p-3.5">Status Siklus</th>
                          <th className="p-3.5">Keaktifan</th>
                          <th className="p-3.5">Tipe Relasi</th>
                          <th className="p-3.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {tahunAjaranList.map((ta) => {
                          const res = resolveSiswaForTA(detailSiswa, ta, tahunAjaranList);
                          const isCurrentBaseTa = (detailSiswa.tahun_ajaran || tahunAjaranList[0]) === ta;

                          return (
                            <tr key={ta} className="hover:bg-gray-50/60 transition">
                              <td className="p-3.5">
                                <div className="flex items-center space-x-2">
                                  <span className="font-extrabold text-gray-900">{ta}</span>
                                  {isCurrentBaseTa && (
                                    <span className="bg-indigo-100 text-indigo-800 text-[9px] font-black px-2 py-0.5 rounded-full">
                                      TA Induk
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3.5">
                                <span className="font-extrabold text-indigo-700 bg-indigo-50/70 border border-indigo-100/80 px-2.5 py-1 rounded-lg">
                                  {res.kelas}
                                </span>
                              </td>
                              <td className="p-3.5 text-gray-600 font-semibold">
                                {res.status_siklus}
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  res.status_aktif ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {res.status_aktif ? 'Aktif' : 'Nonaktif'}
                                </span>
                              </td>
                              <td className="p-3.5">
                                {res.isExplicitHistory ? (
                                  <span className="bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center w-fit">
                                    <CheckCheck className="w-3 h-3 mr-1 text-purple-600" />
                                    Arsip Permanen
                                  </span>
                                ) : (
                                  <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center w-fit">
                                    <Sparkles className="w-3 h-3 mr-1 text-blue-600" />
                                    Kenaikan Relasional
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingHistoryTa(ta);
                                    setEditingHistoryKelas(res.kelas);
                                    setEditingHistoryAktif(res.status_aktif);
                                    setEditingHistorySiklus(res.status_siklus);
                                  }}
                                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
                                >
                                  Koreksi / Sesuaikan
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 2: Kehadiran */}
              {detailActiveTab === 'absensi' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-gray-600 tracking-wider">Catatan Absensi Latihan Mingguan</h4>
                  {detailKehadiranLogs.length === 0 ? (
                    <p className="text-xs text-gray-400 p-6 text-center bg-gray-50 rounded-2xl">Belum ada catatan kehadiran untuk murid ini.</p>
                  ) : (
                    <div className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
                      {detailKehadiranLogs.map((log) => (
                        <div key={log.id} className="p-3.5 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-extrabold text-gray-800">{new Date(log.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            {log.keterangan && <p className="text-[11px] text-gray-500 mt-0.5">{log.keterangan}</p>}
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            log.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' :
                            log.status === 'Izin' ? 'bg-indigo-100 text-indigo-800' :
                            log.status === 'Sakit' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: SKU */}
              {detailActiveTab === 'sku' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-gray-600 tracking-wider">Butir Syarat Kecakapan Umum (SKU) Terverifikasi</h4>
                  {detailSkuLogs.length === 0 ? (
                    <p className="text-xs text-gray-400 p-6 text-center bg-gray-50 rounded-2xl">Belum ada butir SKU yang diverifikasi untuk murid ini.</p>
                  ) : (
                    <div className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
                      {detailSkuLogs.map((item) => (
                        <div key={item.id} className="p-3.5 flex items-start justify-between text-xs gap-3">
                          <div>
                            <p className="font-extrabold text-gray-800">Butir #{item.no_sku} ({item.tingkat || 'Bantara'})</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">Penguji/Pembina: <b className="text-gray-700">{item.pembina_penguji || 'Pembina Pramuka'}</b></p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-black inline-block">
                              Lulus Verifikasi ✓
                            </span>
                            {item.tanggal_verifikasi && (
                              <p className="text-[10px] text-gray-400 mt-0.5">{item.tanggal_verifikasi}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Kedisiplinan */}
              {detailActiveTab === 'kedisiplinan' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-gray-600 tracking-wider">Catatan Poin & Pelanggaran Kedisiplinan</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const targetSiswa = siswa.find((s) => s.id === detailSiswaId);
                        if (targetSiswa) setDisciplineModalSiswa(targetSiswa);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Buka Modal Riwayat Lengkap</span>
                    </button>
                  </div>
                  {detailDisciplineLogs.length === 0 ? (
                    <p className="text-xs text-gray-400 p-6 text-center bg-gray-50 rounded-2xl">Tidak ada catatan pelanggaran (Poin sempurna: 100).</p>
                  ) : (
                    <div className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
                      {detailDisciplineLogs.map((log) => (
                        <div key={log.id} className="p-3.5 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-extrabold text-gray-800">{log.deskripsi}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{log.tanggal} &bull; Pencatat: {log.pencatat || 'Pembina'}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                            log.poin < 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {log.poin > 0 ? `+${log.poin}` : log.poin} Poin
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Tabungan */}
              {detailActiveTab === 'tabungan' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Total Saldo Tabungan Wajib</span>
                      <p className="text-2xl font-black text-amber-950 mt-0.5">Rp {detailTotalSavings.toLocaleString('id-ID')}</p>
                    </div>
                    <Landmark className="w-8 h-8 text-amber-500" />
                  </div>

                  {detailSavingsLogs.length === 0 ? (
                    <p className="text-xs text-gray-400 p-6 text-center bg-gray-50 rounded-2xl">Belum ada transaksi tabungan untuk murid ini.</p>
                  ) : (
                    <div className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
                      {detailSavingsLogs.map((t) => (
                        <div key={t.id} className="p-3.5 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-extrabold text-gray-800">{t.jenis === 'setor' ? 'Setoran Tabungan' : 'Penarikan Tabungan'}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{t.tanggal} {t.keterangan ? `&bull; ${t.keterangan}` : ''}</p>
                          </div>
                          <span className={`font-mono text-xs font-black ${t.jenis === 'setor' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.jenis === 'setor' ? '+' : '-'} Rp {t.jumlah.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end shrink-0">
              <button
                onClick={handleCloseDetail}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-extrabold rounded-xl transition cursor-pointer"
              >
                Tutup Rapor Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master Status Pelantikan Manager Modal */}
      {isManagePelantikanOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 max-w-lg w-full shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={() => {
                setIsManagePelantikanOpen(false);
                setDeletePelantikanConfirmItem(null);
                setIsConfirmResetPelantikanOpen(false);
                setPelantikanErrorMsg(null);
                setPelantikanSuccessMsg(null);
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-4 shrink-0">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Kelola Status Pelantikan</h3>
                <p className="text-xs text-gray-400">Tambah, ubah nama, atau hapus opsi status pelantikan anggota</p>
              </div>
            </div>

            {/* Notification Messages */}
            {pelantikanErrorMsg && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center space-x-2 shrink-0 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{pelantikanErrorMsg}</span>
              </div>
            )}
            {pelantikanSuccessMsg && (
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center space-x-2 shrink-0 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{pelantikanSuccessMsg}</span>
              </div>
            )}

            {/* Delete Confirmation Box */}
            {deletePelantikanConfirmItem && (
              <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 shrink-0 animate-fade-in">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-extrabold text-rose-900">
                      Hapus Status Pelantikan "{deletePelantikanConfirmItem.name}"?
                    </p>
                    {deletePelantikanConfirmItem.studentCount > 0 ? (
                      <p className="text-rose-700 mt-1">
                        Ada <b>{deletePelantikanConfirmItem.studentCount} anggota</b> yang saat ini memiliki status ini. Menghapus status ini akan membatalkan status pelantikan mereka (menjadi belum berstatus).
                      </p>
                    ) : (
                      <p className="text-rose-600 mt-1">
                        Tidak ada anggota yang memiliki status ini. Status akan langsung dihapus dari daftar.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletePelantikanConfirmItem(null)}
                    className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={executeDeletePelantikan}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Status</span>
                  </button>
                </div>
              </div>
            )}

            {/* Reset Confirmation Box */}
            {isConfirmResetPelantikanOpen && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 shrink-0 animate-fade-in">
                <div className="flex items-start space-x-2">
                  <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-extrabold text-amber-900">Kembalikan Daftar Status ke Default?</p>
                    <p className="text-amber-700 mt-1">
                      Opsi akan dikembalikan ke Calon Penegak, Calon Bantara, Penegak Bantara, Calon Laksana, dan Penegak Laksana.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmResetPelantikanOpen(false)}
                    className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={executeResetPelantikanDefaults}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ya, Kembalikan Default</span>
                  </button>
                </div>
              </div>
            )}

            {/* Input Form to Add New Status */}
            <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-xl mb-4 space-y-2 shrink-0">
              <label className="block text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                Tambah Jenis Status Pelantikan Baru
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: Penegak Garuda, Calon Garuda, dll."
                  value={newPelantikanInput}
                  onChange={(e) => setNewPelantikanInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPelantikan())}
                  className="flex-1 bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddPelantikan}
                  disabled={!newPelantikanInput.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center space-x-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>

            {/* List of Existing Status Items */}
            <div className="space-y-2 overflow-y-auto pr-1 flex-1">
              <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Daftar Status Pelantikan Saat Ini:</p>
              {pelantikanList.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">Belum ada status pelantikan tersimpan.</p>
              ) : (
                pelantikanList.map((pName, index) => {
                  const studentCount = siswa.filter((s) => s.status_pelantikan === pName).length;
                  const isEditingThis = editingPelantikanIndex === index;

                  return (
                    <div
                      key={pName}
                      className="p-3 bg-gray-50 border border-gray-150 rounded-xl flex items-center justify-between gap-2"
                    >
                      {isEditingThis ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={editingPelantikanText}
                            onChange={(e) => setEditingPelantikanText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveEditPelantikan(index))}
                            className="flex-1 bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditPelantikan(index)}
                            className="p-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition cursor-pointer"
                            title="Simpan Perubahan"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPelantikanIndex(null)}
                            className="p-1.5 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition cursor-pointer"
                            title="Batal"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-extrabold text-gray-800">{pName}</span>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-black">
                              {studentCount} anggota
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditPelantikan(index)}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="Edit nama status"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePelantikan(pName)}
                              className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus status pelantikan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsConfirmResetPelantikanOpen(true)}
                className="text-xs font-extrabold text-gray-500 hover:text-gray-800 transition cursor-pointer flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Standar Default</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsManagePelantikanOpen(false);
                  setDeletePelantikanConfirmItem(null);
                  setIsConfirmResetPelantikanOpen(false);
                  setPelantikanErrorMsg(null);
                  setPelantikanSuccessMsg(null);
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master Tahun Ajaran Manager Modal */}
      {isManageTaOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 max-w-lg w-full shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={() => {
                setIsManageTaOpen(false);
                setDeleteTaConfirmItem(null);
                setIsConfirmResetTaOpen(false);
                setTaErrorMsg(null);
                setTaSuccessMsg(null);
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-4 shrink-0">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Kelola Master Tahun Ajaran</h3>
                <p className="text-xs text-gray-400">Tambah, ubah nama, atau hapus opsi Tahun Ajaran murid</p>
              </div>
            </div>

            {/* Notification Messages */}
            {taErrorMsg && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center space-x-2 shrink-0 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{taErrorMsg}</span>
              </div>
            )}
            {taSuccessMsg && (
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center space-x-2 shrink-0 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{taSuccessMsg}</span>
              </div>
            )}

            {/* Delete Confirmation Box */}
            {deleteTaConfirmItem && (
              <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 shrink-0 animate-fade-in">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-extrabold text-rose-900">
                      Hapus Tahun Ajaran "{deleteTaConfirmItem.taName}"?
                    </p>
                    {deleteTaConfirmItem.studentCount > 0 ? (
                      <p className="text-rose-700 mt-1">
                        Ada <b>{deleteTaConfirmItem.studentCount} anggota</b> terdaftar pada TA ini. Menghapus TA ini akan mengalihkan anggota tersebut ke <b>"{deleteTaConfirmItem.fallback}"</b> secara aman.
                      </p>
                    ) : (
                      <p className="text-rose-600 mt-1">
                        Tidak ada anggota yang terdaftar pada TA ini. TA akan langsung dihapus dari daftar pilihan.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTaConfirmItem(null)}
                    className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={executeDeleteTa}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus TA</span>
                  </button>
                </div>
              </div>
            )}

            {/* Reset Confirmation Box */}
            {isConfirmResetTaOpen && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 shrink-0 animate-fade-in">
                <div className="flex items-start space-x-2">
                  <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-extrabold text-amber-900">Kembalikan Daftar TA ke Standar?</p>
                    <p className="text-amber-700 mt-1">
                      Opsi Tahun Ajaran akan dikembalikan ke default: TA. 2024-2025, TA. 2025-2026, dan TA. 2026-2027.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmResetTaOpen(false)}
                    className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={executeResetTaDefaults}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ya, Kembalikan Default</span>
                  </button>
                </div>
              </div>
            )}

            {/* Input Form to Add New Academic Year */}
            <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-xl mb-4 space-y-2 shrink-0">
              <label className="block text-xs font-extrabold text-indigo-900 uppercase tracking-wider">
                Tambah Tahun Ajaran Baru
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: TA. 2027-2028"
                  value={newTaInput}
                  onChange={(e) => setNewTaInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTa())}
                  className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddTa}
                  disabled={!newTaInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center space-x-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>

            {/* List of Existing TA Items */}
            <div className="space-y-2 overflow-y-auto pr-1 flex-1">
              <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Daftar Tahun Ajaran Terdaftar:</p>
              {tahunAjaranList.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">Belum ada Tahun Ajaran tersimpan.</p>
              ) : (
                tahunAjaranList.map((taName, index) => {
                  const studentCount = siswa.filter((s) => s.tahun_ajaran === taName).length;
                  const isEditingThis = editingTaIndex === index;

                  return (
                    <div
                      key={taName}
                      className="p-3 bg-gray-50 border border-gray-150 rounded-xl flex items-center justify-between gap-2"
                    >
                      {isEditingThis ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={editingTaText}
                            onChange={(e) => setEditingTaText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveEditTa(index))}
                            className="flex-1 bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditTa(index)}
                            className="p-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition cursor-pointer"
                            title="Simpan Perubahan"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTaIndex(null)}
                            className="p-1.5 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition cursor-pointer"
                            title="Batal"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-extrabold text-gray-800">{taName}</span>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-black">
                              {studentCount} anggota
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditTa(index)}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="Edit nama Tahun Ajaran"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTa(taName)}
                              className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus Tahun Ajaran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsConfirmResetTaOpen(true)}
                className="text-xs font-extrabold text-gray-500 hover:text-gray-800 transition cursor-pointer flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Standar (2024-2027)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsManageTaOpen(false);
                  setDeleteTaConfirmItem(null);
                  setIsConfirmResetTaOpen(false);
                  setTaErrorMsg(null);
                  setTaSuccessMsg(null);
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discipline History Detail Modal */}
      {disciplineModalSiswa && (
        <DisciplineHistoryModal
          siswa={disciplineModalSiswa}
          allKedisiplinan={kedisiplinan}
          isOpen={!!disciplineModalSiswa}
          onClose={() => setDisciplineModalSiswa(null)}
          onAddLog={(newLog) => {
            if (onAddKedisiplinan) {
              onAddKedisiplinan(newLog);
            }
          }}
          onDeleteLog={(id) => {
            if (onDeleteKedisiplinan) {
              onDeleteKedisiplinan(id);
            }
          }}
        />
      )}

      {/* Batch Academic Rollover / Naik Kelas Massal Modal */}
      {onBatchRollover && (
        <BatchRolloverModal
          isOpen={isRolloverModalOpen}
          onClose={() => setIsRolloverModalOpen(false)}
          siswaList={siswa}
          tahunAjaranList={tahunAjaranList}
          currentTahunAjaran={selectedTahunAjaran !== 'all' ? selectedTahunAjaran : (tahunAjaranList[tahunAjaranList.length - 1] || '2026-2027')}
          onExecuteRollover={(updatedSiswa, targetTa) => {
            onBatchRollover(updatedSiswa, targetTa);
            setIsRolloverModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
