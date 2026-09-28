import React, { useState, useMemo } from 'react';
import { Siswa, Kehadiran, Materi, SKU, SKUItemDef, Kelas, NilaiAkhir } from '../types';
import { calculateNilaiSiswa } from '../utils/gradeCalculator';
import {
  Search,
  Download,
  Award,
  GraduationCap,
  TrendingUp,
  Percent,
  Check,
  Eye,
  X,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface NilaiManagerProps {
  siswa: Siswa[];
  kehadiran: Kehadiran[];
  materi: Materi[];
  sku: SKU[];
  skuDefs: SKUItemDef[];
  classList: Kelas[];
}

export const NilaiManager: React.FC<NilaiManagerProps> = ({
  siswa,
  kehadiran,
  materi,
  sku,
  skuDefs,
  classList
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Siswa | null>(null);
  const [showFormulaInfo, setShowFormulaInfo] = useState<boolean>(false);

  // Filter students by status_aktif = true (usually we calculate active students or all, let's show all but highlight or filter active)
  const [filterActive, setFilterActive] = useState<boolean>(true);

  // Filtered list of students
  const filteredStudents = useMemo(() => {
    return siswa.filter((s) => {
      const matchClass = selectedClass === 'all' || s.kelas === selectedClass;
      const matchSearch =
        s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.includes(searchQuery);
      const matchActive = !filterActive || s.status_aktif;
      return matchClass && matchSearch && matchActive;
    });
  }, [siswa, selectedClass, searchQuery, filterActive]);

  // Calculated grades for filtered students
  const studentGrades = useMemo(() => {
    return filteredStudents.map((s) => {
      const grades = calculateNilaiSiswa(s, kehadiran, materi, sku, skuDefs);
      return {
        student: s,
        grades
      };
    });
  }, [filteredStudents, kehadiran, materi, sku, skuDefs]);

  // Overall Statistics for selected group
  const stats = useMemo(() => {
    if (studentGrades.length === 0) {
      return {
        average: 0,
        highest: 0,
        lowest: 0,
        countA: 0,
        countB: 0,
        countC: 0,
        countD: 0,
        avgAttendance: 0,
        avgMateri: 0,
        avgSKU: 0,
      };
    }

    let total = 0;
    let highest = 0;
    let lowest = 100;
    let countA = 0;
    let countB = 0;
    let countC = 0;
    let countD = 0;
    
    let sumAttendance = 0;
    let sumMateri = 0;
    let sumSKU = 0;

    studentGrades.forEach(({ grades }) => {
      total += grades.nilai_total;
      sumAttendance += grades.persen_kehadiran;
      
      // Calculate average score of materi for stats
      // We know grades.skor_materi is weight-adjusted (30%). Let's convert back to percentage for avg
      const rawMateri = (grades.skor_materi / 30) * 100;
      sumMateri += isNaN(rawMateri) ? 0 : rawMateri;

      // SKU score is weight-adjusted (40%). Convert back to percentage
      const rawSKU = (grades.skor_sku / 40) * 100;
      sumSKU += isNaN(rawSKU) ? 0 : rawSKU;

      if (grades.nilai_total > highest) highest = grades.nilai_total;
      if (grades.nilai_total < lowest) lowest = grades.nilai_total;

      if (grades.predikat === 'A') countA++;
      else if (grades.predikat === 'B') countB++;
      else if (grades.predikat === 'C') countC++;
      else if (grades.predikat === 'D') countD++;
    });

    return {
      average: Math.round((total / studentGrades.length) * 100) / 100,
      highest: Math.round(highest * 100) / 100,
      lowest: Math.round(lowest * 100) / 100,
      countA,
      countB,
      countC,
      countD,
      avgAttendance: Math.round((sumAttendance / studentGrades.length) * 10) / 10,
      avgMateri: Math.round((sumMateri / studentGrades.length) * 10) / 10,
      avgSKU: Math.round((sumSKU / studentGrades.length) * 10) / 10,
    };
  }, [studentGrades]);

  // Chart data format
  const chartData = [
    { name: 'Predikat A (≥85)', count: stats.countA, color: '#10B981' },
    { name: 'Predikat B (70-84)', count: stats.countB, color: '#3B82F6' },
    { name: 'Predikat C (55-69)', count: stats.countC, color: '#F59E0B' },
    { name: 'Predikat D (<55)', count: stats.countD, color: '#EF4444' },
  ];

  // CSV Export handler with UTF-8 BOM for Microsoft Excel compatibility
  const handleExportCSV = () => {
    if (studentGrades.length === 0) {
      alert('Tidak ada data rekapitulasi nilai untuk diekspor!');
      return;
    }

    const headers = [
      'Peringkat',
      'NIS',
      'Nama Lengkap Anggota',
      'Kelas',
      'Status Keanggotaan',
      'Persen Kehadiran (%)',
      'Skor Kehadiran (Bobot 30%)',
      'Rata-rata Evaluasi Materi (0-100)',
      'Skor Evaluasi Materi (Bobot 30%)',
      'SKU Bantara Lulus (Butir)',
      'SKU Laksana Lulus (Butir)',
      'Skor Capaian SKU (Bobot 40%)',
      'Nilai Total Akhir (0-100)',
      'Predikat Kelulusan',
      'Rekomendasi Pembina'
    ];

    // Sort by total grade descending for ranking in CSV
    const sortedGrades = [...studentGrades].sort((a, b) => b.grades.nilai_total - a.grades.nilai_total);

    const rows = sortedGrades.map(({ student, grades }, index) => {
      const rawMateriAvg = Math.round((grades.skor_materi / 30) * 100) || 0;
      let rekomendasi = 'Sangat Baik - Layak Dilantik / Diapresiasi';
      if (grades.predikat === 'A') rekomendasi = 'Sangat Baik - Direkomendasikan Kenaikan Tingkat';
      else if (grades.predikat === 'B') rekomendasi = 'Baik - Memenuhi Standar Minimal Kelulusan';
      else if (grades.predikat === 'C') rekomendasi = 'Cukup - Memerlukan Tambahan Jam Latihan';
      else rekomendasi = 'Kurang - Memerlukan Pembinaan Intensif';

      return [
        index + 1,
        `"${student.nis}"`,
        `"${student.nama_lengkap.replace(/"/g, '""')}"`,
        `"${student.kelas}"`,
        student.status_aktif ? '"Aktif"' : '"Non-aktif"',
        grades.persen_kehadiran,
        grades.skor_kehadiran,
        rawMateriAvg,
        grades.skor_materi,
        grades.sku_lulus,
        grades.sku_laksana_lulus,
        grades.skor_sku,
        grades.nilai_total,
        `"${grades.predikat}"`,
        `"${rekomendasi}"`
      ];
    });

    // Byte Order Mark (BOM) \uFEFF ensures UTF-8 encoding is recognized by MS Excel
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const classNameClean = selectedClass === 'all' ? 'Semua_Kelas' : selectedClass.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Rekapitulasi_Nilai_Akhir_${classNameClean}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Student detailed breakdown modal details helper
  const studentDetails = useMemo(() => {
    if (!selectedStudent) return null;
    const s = selectedStudent;
    const grades = calculateNilaiSiswa(s, kehadiran, materi, sku, skuDefs);

    // Filter attendance for student
    const sKehadiran = kehadiran.filter((k) => k.siswa_id === s.id);
    const presentCount = sKehadiran.filter((k) => k.status === 'Hadir').length;
    const permissionCount = sKehadiran.filter((k) => k.status === 'Izin').length;
    const sickCount = sKehadiran.filter((k) => k.status === 'Sakit').length;
    const alphaCount = sKehadiran.filter((k) => k.status === 'Alpa').length;

    // Filter evaluations
    const sMateriEvaluations = materi
      .filter((m) => m.status === 'Selesai')
      .map((m) => {
        const score = m.nilai_evaluasi && m.nilai_evaluasi[s.id] !== undefined ? m.nilai_evaluasi[s.id] : null;
        return {
          id: m.id,
          judul: m.judul_materi,
          kategori: m.kategori,
          tanggal: m.tanggal_pelaksanaan,
          score
        };
      });

    // Filter verified SKU items
    const verifiedSKUItems = sku.filter((item) => item.siswa_id === s.id && item.status_verifikasi);

    return {
      student: s,
      grades,
      attendance: {
        total: sKehadiran.length,
        present: presentCount,
        permit: permissionCount,
        sick: sickCount,
        alpha: alphaCount,
        history: sKehadiran.sort((a, b) => b.tanggal.localeCompare(a.tanggal))
      },
      evaluations: sMateriEvaluations.sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
      sku: {
        verified: verifiedSKUItems.sort((a, b) => (a.no_item_sku - b.no_item_sku)),
        bantaraCount: verifiedSKUItems.filter((item) => item.tingkat === 'Bantara' || !item.tingkat).length,
        laksanaCount: verifiedSKUItems.filter((item) => item.tingkat === 'Laksana').length,
      }
    };
  }, [selectedStudent, kehadiran, materi, sku, skuDefs]);

  return (
    <div className="space-y-6" id="nilai-manager-wrapper">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-150 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Rekapitulasi Nilai Akhir</h2>
          <p className="text-sm text-gray-400 mt-1">
            Lihat perolehan nilai komprehensif ambalan berdasarkan akumulasi Absensi, Evaluasi Materi, dan SKU.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setShowFormulaInfo(!showFormulaInfo)}
            className="flex items-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs px-3 py-2.5 rounded-xl transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-gray-500" />
            <span>Bobot Penilaian</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Formula Info Callout Box */}
      {showFormulaInfo && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 animate-fade-in text-indigo-950 shadow-3xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-indigo-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Formula & Pembobotan Nilai Akhir Anggota
            </h4>
            <button 
              onClick={() => setShowFormulaInfo(false)}
              className="text-indigo-400 hover:text-indigo-600 cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
          <p className="text-xs text-indigo-800 leading-relaxed">
            Perhitungan nilai akhir dihitung secara otomatis secara real-time berdasarkan portofolio dan data latihan setiap anggota:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="bg-white/70 p-3 rounded-xl border border-indigo-100/50">
              <span className="text-[10px] font-black uppercase text-indigo-500 block mb-1">1. Kehadiran Latihan (30%)</span>
              <p className="text-xs text-indigo-900">
                Dihitung dari persentase kehadiran: <code className="font-mono font-bold">(Hadir / Total Pertemuan) * 100%</code>. Skor kontribusi maksimal: <b>30 poin</b>.
              </p>
            </div>
            <div className="bg-white/70 p-3 rounded-xl border border-indigo-100/50">
              <span className="text-[10px] font-black uppercase text-indigo-500 block mb-1">2. Penguasaan Materi (30%)</span>
              <p className="text-xs text-indigo-900">
                Rata-rata nilai ujian/evaluasi dari materi yang telah berstatus selesai. Skor kontribusi maksimal: <b>30 poin</b>.
              </p>
            </div>
            <div className="bg-white/70 p-3 rounded-xl border border-indigo-100/50">
              <span className="text-[10px] font-black uppercase text-indigo-500 block mb-1">3. Capaian SKU (40%)</span>
              <p className="text-xs text-indigo-900">
                Penyelesaian item SKU Bantara (23 butir) & Laksana (22 butir). Jika telah mulai Laksana, dihitung rata-rata keduanya. Maksimal: <b>40 poin</b>.
              </p>
            </div>
          </div>
          <div className="text-[11px] text-indigo-700/80 italic border-t border-indigo-100/60 pt-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Predikat Kelulusan: <b>A (≥85)</b> Sangat Baik | <b>B (70-84)</b> Baik | <b>C (55-69)</b> Cukup | <b>D (&lt;55)</b> Kurang / Perlu Bimbingan.</span>
          </div>
        </div>
      )}

      {/* 2. Controls & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Class Select */}
          <div className="w-full sm:w-48">
            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pilih Kelas</label>
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 pr-8 cursor-pointer"
              >
                <option value="all">Semua Kelas</option>
                {classList.map((k) => (
                  <option key={k.id} value={k.nama}>
                    {k.nama}
                  </option>
                ))}
              </select>
              <GraduationCap className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Active Filter Toggle */}
          <div className="mt-4 sm:mt-0 flex items-center h-full">
            <label className="flex items-center space-x-2 text-xs font-bold text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={filterActive}
                onChange={(e) => setFilterActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Tampilkan Anggota Aktif Saja</span>
            </label>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cari Anggota</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Cari nama atau NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Summary Cards & Charts */}
      {studentGrades.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Metrics Column */}
          <div className="lg:col-span-1 grid grid-cols-2 gap-4">
            
            {/* Average Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 rounded-2xl border border-indigo-100 shadow-3xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Rata-rata Kelas</span>
                <Percent className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-800">{stats.average}</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Skor dari {studentGrades.length} murid</p>
              </div>
            </div>

            {/* Highest Scorer */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-2xl border border-emerald-100 shadow-3xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Skor Tertinggi</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-800">{stats.highest}</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Pencapaian maksimal</p>
              </div>
            </div>

            {/* Average Attendance Card */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs flex flex-col justify-between">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-2">Rata Kehadiran</span>
              <div>
                <h3 className="text-xl font-extrabold text-gray-700">{stats.avgAttendance}%</h3>
                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${stats.avgAttendance}%` }}></div>
                </div>
              </div>
            </div>

            {/* Average SKU Card */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs flex flex-col justify-between">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-2">Rata Progres SKU</span>
              <div>
                <h3 className="text-xl font-extrabold text-gray-700">{stats.avgSKU}%</h3>
                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${stats.avgSKU}%` }}></div>
                </div>
              </div>
            </div>

          </div>

          {/* Distribution Chart Card */}
          <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-4 block">Distribusi Predikat Nilai</span>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 600, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ fontSize: '11px', borderRadius: '12px', borderColor: '#f3f4f6', fontFamily: 'Inter' }}
                    cursor={{ fill: '#f9fafb' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      ) : null}

      {/* 4. Grades Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-3xs overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
            Daftar Portofolio & Nilai Murid ({filteredStudents.length} Anggota)
          </span>
        </div>

        {studentGrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/20 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-12">Peringkat</th>
                  <th className="py-3.5 px-4">Nama Lengkap & NIS</th>
                  <th className="py-3.5 px-4 text-center">Kelas</th>
                  <th className="py-3.5 px-4 text-center">Absensi (30%)</th>
                  <th className="py-3.5 px-4 text-center">Evaluasi (30%)</th>
                  <th className="py-3.5 px-4 text-center">Capaian SKU (40%)</th>
                  <th className="py-3.5 px-4 text-center">Nilai Total</th>
                  <th className="py-3.5 px-4 text-center">Predikat</th>
                  <th className="py-3.5 px-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {/* Sort by total grade descending */}
                {[...studentGrades]
                  .sort((a, b) => b.grades.nilai_total - a.grades.nilai_total)
                  .map(({ student, grades }, index) => {
                    const isRank1 = index === 0;
                    const isRank2 = index === 1;
                    const isRank3 = index === 2;

                    let rankBadge = (
                      <span className="font-bold text-gray-500">{index + 1}</span>
                    );
                    if (isRank1) {
                      rankBadge = <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 font-black rounded-full text-[11px] shadow-3xs border border-amber-200">🥇</span>;
                    } else if (isRank2) {
                      rankBadge = <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 text-slate-700 font-black rounded-full text-[11px] shadow-3xs border border-slate-200">🥈</span>;
                    } else if (isRank3) {
                      rankBadge = <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-50 text-amber-800 font-black rounded-full text-[11px] shadow-3xs border border-amber-100">🥉</span>;
                    }

                    return (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3.5 px-4 text-center">{rankBadge}</td>
                        <td className="py-3.5 px-4">
                          <div>
                            <div className="font-extrabold text-gray-800 flex items-center space-x-1.5">
                              <span>{student.nama_lengkap}</span>
                              {!student.status_aktif && (
                                <span className="bg-gray-100 text-gray-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                                  Non-Aktif
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">NIS: {student.nis}</div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-gray-600">{student.kelas}</td>
                        
                        {/* Attendance display */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-bold text-gray-700">{grades.persen_kehadiran}%</div>
                          <div className="text-[9px] text-indigo-500 font-semibold mt-0.5">Skor: {grades.skor_kehadiran}</div>
                        </td>

                        {/* Evaluation display */}
                        <td className="py-3.5 px-4 text-center">
                          {/* Calculate raw average score */}
                          {(() => {
                            const rawAvg = Math.round((grades.skor_materi / 30) * 100);
                            return (
                              <>
                                <div className="font-bold text-gray-700">{rawAvg || 0}/100</div>
                                <div className="text-[9px] text-indigo-500 font-semibold mt-0.5">Skor: {grades.skor_materi}</div>
                              </>
                            );
                          })()}
                        </td>

                        {/* SKU Progress display */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-bold text-gray-700">
                            B: <span className="text-emerald-600">{grades.sku_lulus}</span>
                            {grades.sku_laksana_lulus > 0 && (
                              <span> | L: <span className="text-amber-600">{grades.sku_laksana_lulus}</span></span>
                            )}
                          </div>
                          <div className="text-[9px] text-indigo-500 font-semibold mt-0.5">Skor: {grades.skor_sku}</div>
                        </td>

                        {/* Total Score */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="text-sm font-black text-indigo-950">{grades.nilai_total}</div>
                        </td>

                        {/* Predikat Badge */}
                        <td className="py-3.5 px-4 text-center">
                          {(() => {
                            let badgeClass = 'bg-red-50 text-red-700 border-red-200';
                            if (grades.predikat === 'A') badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            else if (grades.predikat === 'B') badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                            else if (grades.predikat === 'C') badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';

                            return (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${badgeClass}`}>
                                {grades.predikat}
                              </span>
                            );
                          })()}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="inline-flex items-center space-x-1 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 transition px-2.5 py-1.5 rounded-lg font-bold text-[10px] cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Detail</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center space-y-2">
            <Search className="w-8 h-8 text-gray-300 animate-pulse" />
            <p className="text-xs font-bold">Anggota Tidak Ditemukan</p>
            <p className="text-[10px] text-gray-400">Silakan sesuaikan filter kelas atau kata kunci pencarian Anda.</p>
          </div>
        )}
      </div>

      {/* 5. Detailed Breakdown Modal */}
      {selectedStudent && studentDetails && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-gray-150 animate-slide-in">
            
            {/* Modal Header */}
            <div className="bg-indigo-950 text-white p-6 shrink-0 flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="p-2 bg-indigo-600 rounded-xl">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider">{studentDetails.student.nama_lengkap}</h3>
                  <p className="text-[10px] text-indigo-300 font-mono tracking-widest mt-0.5">
                    NIS: {studentDetails.student.nis} • KELAS {studentDetails.student.kelas}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="text-[10px] text-indigo-300 font-bold block">NILAI AKHIR</span>
                  <span className="text-xl font-black">{studentDetails.grades.nilai_total}</span>
                </div>
                <div className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl font-black text-md border border-indigo-500 uppercase">
                  {studentDetails.grades.predikat}
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1 bg-white/10 hover:bg-white/20 rounded-lg transition text-white cursor-pointer ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Top Summary of Weights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                  <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">SKOR KEHADIRAN (30%)</span>
                  <div className="text-base font-black text-gray-800">{studentDetails.grades.skor_kehadiran} / 30</div>
                  <p className="text-[10px] text-gray-400 mt-1">Kehadiran: <b>{studentDetails.grades.persen_kehadiran}%</b> ({studentDetails.attendance.present} hadir dari {studentDetails.attendance.total} latihan)</p>
                </div>
                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                  <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">SKOR EVALUASI MATERI (30%)</span>
                  <div className="text-base font-black text-gray-800">{studentDetails.grades.skor_materi} / 30</div>
                  {/* Raw average */}
                  {(() => {
                    const rawAvg = Math.round((studentDetails.grades.skor_materi / 30) * 100);
                    return <p className="text-[10px] text-gray-400 mt-1">Rata-rata Nilai: <b>{rawAvg || 0}/100</b> ({studentDetails.evaluations.filter(e => e.score !== null).length} dinilai)</p>;
                  })()}
                </div>
                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                  <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">SKOR PROGRES SKU (40%)</span>
                  <div className="text-base font-black text-gray-800">{studentDetails.grades.skor_sku} / 40</div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Bantara: <b>{studentDetails.sku.bantaraCount}</b> lulus | Laksana: <b>{studentDetails.sku.laksanaCount}</b> lulus
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Panel: Attendance List & Scores */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-xs uppercase text-gray-700 tracking-wider flex items-center gap-1.5 pb-1 border-b border-gray-100">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Riwayat Absensi Latihan
                  </h4>
                  {studentDetails.attendance.history.length > 0 ? (
                    <div className="border border-gray-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-gray-50">
                      {studentDetails.attendance.history.map((att) => {
                        let statusColor = 'bg-rose-50 text-rose-600 border-rose-100';
                        if (att.status === 'Hadir') statusColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                        else if (att.status === 'Izin') statusColor = 'bg-blue-50 text-blue-600 border-blue-100';
                        else if (att.status === 'Sakit') statusColor = 'bg-amber-50 text-amber-600 border-amber-100';

                        return (
                          <div key={att.id} className="p-2.5 flex items-center justify-between text-[11px] hover:bg-gray-50 transition">
                            <div>
                              <span className="font-extrabold text-gray-700">
                                {new Date(att.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                              {att.keterangan && (
                                <p className="text-[10px] text-gray-400 italic mt-0.5">"{att.keterangan}"</p>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full font-bold border text-[9px] ${statusColor}`}>
                              {att.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-[11px]">
                      Belum ada data absensi latihan minggu ini.
                    </div>
                  )}

                  <h4 className="font-extrabold text-xs uppercase text-gray-700 tracking-wider flex items-center gap-1.5 pb-1 border-b border-gray-100 pt-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    Nilai Evaluasi Materi
                  </h4>
                  {studentDetails.evaluations.length > 0 ? (
                    <div className="border border-gray-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-gray-50">
                      {studentDetails.evaluations.map((ev) => (
                        <div key={ev.id} className="p-2.5 flex items-center justify-between text-[11px] hover:bg-gray-50 transition">
                          <div>
                            <div className="font-extrabold text-gray-700">{ev.judul}</div>
                            <span className="text-[9px] text-gray-400 font-bold uppercase">{ev.kategori} • {new Date(ev.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                          </div>
                          <div className="text-right">
                            {ev.score !== null ? (
                              <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                                {ev.score}
                              </span>
                            ) : (
                              <span className="text-[9px] text-gray-400 italic bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-lg">
                                Belum dinilai
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-[11px]">
                      Belum ada materi selesai yang terdaftar.
                    </div>
                  )}
                </div>

                {/* Right Panel: Verified SKU Items */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-xs uppercase text-gray-700 tracking-wider flex items-center gap-1.5 pb-1 border-b border-gray-100">
                    <Award className="w-4 h-4 text-amber-500" />
                    Butir SKU Terverifikasi ({studentDetails.sku.verified.length})
                  </h4>
                  {studentDetails.sku.verified.length > 0 ? (
                    <div className="border border-gray-100 rounded-xl overflow-hidden max-h-96 overflow-y-auto divide-y divide-gray-50">
                      {studentDetails.sku.verified.map((item) => {
                        const isLaksana = item.tingkat === 'Laksana';
                        const desc = skuDefs.find(
                          (d) => d.no_item === item.no_item_sku && d.tingkat === (item.tingkat || 'Bantara')
                        )?.deskripsi || `Item SKU No. ${item.no_item_sku}`;

                        return (
                          <div key={item.id} className="p-3 text-[11px] hover:bg-gray-50 transition space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-gray-800 flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isLaksana ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                                SKU No. {item.no_item_sku}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider ${
                                isLaksana ? 'bg-amber-50 text-amber-800 border border-amber-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                              }`}>
                                {item.tingkat || 'Bantara'}
                              </span>
                            </div>
                            <p className="text-gray-500 font-medium leading-relaxed italic">"{desc}"</p>
                            <div className="flex items-center justify-between pt-1 text-[9px] text-gray-400">
                              <span>Lulus: {new Date(item.tanggal_lulus).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              <span className="font-bold">Verifikator: {item.pembina_verifikator || 'Kak Jihan'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-12 border border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-[11px] flex flex-col items-center justify-center space-y-2">
                      <Award className="w-8 h-8 text-gray-300" />
                      <p className="font-bold">Belum Ada SKU Terverifikasi</p>
                      <p className="text-[10px] text-gray-400">Anggota ini belum menyelesaikan atau mendaftarkan pencapaian butir SKU.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
