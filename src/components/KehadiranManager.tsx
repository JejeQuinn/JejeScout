import React, { useState } from 'react';
import { Kehadiran, Siswa, StatusKehadiran } from '../types';
import { Calendar, Save, CheckCircle, Clock, AlertCircle, RefreshCw, Download, FileText } from 'lucide-react';

interface KehadiranProps {
  kehadiran: Kehadiran[];
  siswa: Siswa[];
  onSaveBatch: (tanggal: string, records: { siswa_id: string; status: StatusKehadiran; keterangan: string }[]) => void;
  readOnly?: boolean;
}

export const KehadiranManager: React.FC<KehadiranProps> = ({
  kehadiran,
  siswa,
  onSaveBatch,
  readOnly = false,
}) => {
  const [selectedTanggal, setSelectedTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [selectedKelas, setSelectedKelas] = useState('Semua Kelas');
  const [activeTab, setActiveTab] = useState<'pencatatan' | 'laporan'>('pencatatan');
  
  // State for Laporan Bulanan
  const [reportMonth, setReportMonth] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7); // Default to current month, e.g. YYYY-MM
  });
  const [reportKelas, setReportKelas] = useState<string>('Semua Kelas');

  // Status state of current batch: key = studentId -> status/keterangan
  const [batchStatus, setBatchStatus] = useState<Record<string, StatusKehadiran>>({});
  const [batchKeterangan, setBatchKeterangan] = useState<Record<string, string>>({});
  const [alertMsg, setAlertMsg] = useState('');

  const activeSiswa = siswa.filter((s) => s.status_aktif);
  
  // Get list of unique classes
  const listKelas = Array.from(new Set(activeSiswa.map((s) => s.kelas))).sort();

  // Filter students by selected class
  const visibleSiswa = selectedKelas === 'Semua Kelas' 
    ? activeSiswa 
    : activeSiswa.filter((s) => s.kelas === selectedKelas);

  // Load existing records for selected date if they exist
  const handleLoadDate = () => {
    const existing = kehadiran.filter((k) => k.tanggal === selectedTanggal);
    const newStatuses: Record<string, StatusKehadiran> = {};
    const newKeterangans: Record<string, string> = {};

    activeSiswa.forEach((s) => {
      const rec = existing.find((k) => k.siswa_id === s.id);
      newStatuses[s.id] = rec ? rec.status : 'Hadir'; // default to Hadir
      newKeterangans[s.id] = rec ? rec.keterangan : '';
    });

    setBatchStatus(newStatuses);
    setBatchKeterangan(newKeterangans);
    setAlertMsg(`Memuat absensi tanggal ${selectedTanggal}. ${existing.length > 0 ? 'Data tersimpan ditemukan.' : 'Membuat presensi baru (Default Hadir).'}`);
    setTimeout(() => setAlertMsg(''), 4000);
  };

  // Run on first render or when date changes
  React.useEffect(() => {
    handleLoadDate();
  }, [selectedTanggal, siswa]);

  const handleStatusChange = (siswaId: string, status: StatusKehadiran) => {
    setBatchStatus((prev) => ({ ...prev, [siswaId]: status }));
  };

  const handleKeteranganChange = (siswaId: string, ket: string) => {
    setBatchKeterangan((prev) => ({ ...prev, [siswaId]: ket }));
  };

  const handleBulkMark = (status: StatusKehadiran) => {
    const newStatuses = { ...batchStatus };
    visibleSiswa.forEach((s) => {
      newStatuses[s.id] = status;
    });
    setBatchStatus(newStatuses);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTanggal) return;

    // Save only records of visible students
    const records = visibleSiswa.map((s) => ({
      siswa_id: s.id,
      status: batchStatus[s.id] || 'Hadir',
      keterangan: batchKeterangan[s.id] || '',
    }));

    onSaveBatch(selectedTanggal, records);
    setAlertMsg('✅ Absensi berhasil disimpan untuk ' + (selectedKelas === 'Semua Kelas' ? 'Semua Kelas' : 'Kelas ' + selectedKelas) + ' tanggal ' + selectedTanggal);
    setTimeout(() => setAlertMsg(''), 4000);
  };

  // --- LOGIC FOR MONTHLY REPORTS ---
  const getAvailableMonths = (): string[] => {
    const months = kehadiran
      .map((k) => {
        if (!k.tanggal) return '';
        return k.tanggal.substring(0, 7); // YYYY-MM
      })
      .filter(Boolean);
    const unique = Array.from(new Set(months)) as string[];
    const currentYM = new Date().toISOString().substring(0, 7);
    if (!unique.includes(currentYM)) unique.push(currentYM);
    // Include some historic months
    if (!unique.includes('2026-01')) unique.push('2026-01');
    if (!unique.includes('2026-02')) unique.push('2026-02');
    if (!unique.includes('2026-06')) unique.push('2026-06');
    return unique.sort((a, b) => b.localeCompare(a));
  };

  const formattedMonthText = (ym: string) => {
    if (!ym) return '-';
    const [year, month] = ym.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  // Students for report
  const reportSiswa = reportKelas === 'Semua Kelas'
    ? activeSiswa
    : activeSiswa.filter((s) => s.kelas === reportKelas);

  // Compute stats for each student for the selected month
  const reportData = reportSiswa.map((s) => {
    const studentRecords = kehadiran.filter(
      (k) => k.siswa_id === s.id && k.tanggal.startsWith(reportMonth)
    );
    const total = studentRecords.length;
    const hadir = studentRecords.filter((k) => k.status === 'Hadir').length;
    const izin = studentRecords.filter((k) => k.status === 'Izin').length;
    const sakit = studentRecords.filter((k) => k.status === 'Sakit').length;
    const alpa = studentRecords.filter((k) => k.status === 'Alpa').length;

    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 100;
    return {
      id: s.id,
      nis: s.nis,
      nama: s.nama_lengkap,
      kelas: s.kelas,
      total,
      hadir,
      izin,
      sakit,
      alpa,
      percentage,
    };
  });

  const handleDownloadReport = () => {
    const headers = [
      'NIS',
      'Nama Lengkap',
      'Kelas',
      'Bulan Laporan',
      'Total Pertemuan',
      'Hadir (H)',
      'Izin (I)',
      'Sakit (S)',
      'Alpa (A)',
      'Persentase Kehadiran (%)',
      'Predikat Kehadiran'
    ];

    const monthName = formattedMonthText(reportMonth);
    const rows = reportData.map((r) => {
      let predikat = 'Baik';
      if (r.percentage >= 90) predikat = 'Sangat Baik';
      else if (r.percentage < 60) predikat = 'Kurang';
      else if (r.percentage < 80) predikat = 'Cukup';

      return [
        r.nis,
        r.nama,
        r.kelas,
        monthName,
        r.total,
        r.hadir,
        r.izin,
        r.sakit,
        r.alpa,
        `${r.percentage}%`,
        predikat
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
    link.setAttribute(
      'download',
      `Laporan_Kehadiran_Bulanan_${reportKelas.replace(/ /g, '_')}_${reportMonth}_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="attendance_manager_module">
      {/* Header and sub-tab selection */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Presensi & Kehadiran Latihan Murid</h2>
          <p className="text-sm text-gray-400 mt-1">Lakukan absensi latihan mingguan atau cetak laporan ringkasan kehadiran murid per bulan.</p>
        </div>

        {/* Sub-tabs switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-full sm:w-auto shrink-0 shadow-3xs">
          <button
            onClick={() => setActiveTab('pencatatan')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'pencatatan'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-950'
            }`}
          >
            Pencatatan Harian
          </button>
          <button
            onClick={() => setActiveTab('laporan')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'laporan'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-950'
            }`}
          >
            Laporan Bulanan
          </button>
        </div>
      </div>

      {activeTab === 'pencatatan' ? (
        <>
          {/* Date Parameter Bar */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 shadow-3xs">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Tanggal Pertemuan</label>
                  <input
                    type="date"
                    value={selectedTanggal}
                    onChange={(e) => setSelectedTanggal(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="hidden sm:block h-8 w-px bg-gray-100"></div>

              <div className="w-full sm:w-auto">
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Saring Berdasarkan Kelas</label>
                <select
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[140px]"
                >
                  <option value="Semua Kelas">Semua Kelas</option>
                  {listKelas.map((k) => (
                    <option key={k} value={k}>
                      Kelas {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Bulk Marking */}
            <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Tandai Semua (Saring):</span>
              <button
                type="button"
                onClick={() => handleBulkMark('Hadir')}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Hadir
              </button>
              <button
                type="button"
                onClick={() => handleBulkMark('Izin')}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Izin
              </button>
              <button
                type="button"
                onClick={() => handleBulkMark('Sakit')}
                className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Sakit
              </button>
              <button
                type="button"
                onClick={() => handleBulkMark('Alpa')}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Alpa
              </button>
            </div>
          </div>

          {/* Alert Notification */}
          {alertMsg && (
            <div className="bg-indigo-50 text-indigo-700 border border-indigo-200 p-3.5 rounded-xl text-xs font-semibold animate-pulse">
              {alertMsg}
            </div>
          )}

          {/* Grid: Attendance list */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Murid</th>
                    <th className="p-4">Kelas</th>
                    <th className="p-4 text-center">Status Kehadiran</th>
                    <th className="p-4">Keterangan Catatan (Opsional)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
                  {visibleSiswa.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400">
                        Tidak ada murid aktif terdaftar di kelas ini.
                      </td>
                    </tr>
                  ) : (
                    visibleSiswa.map((s) => {
                      const currentStatus = batchStatus[s.id] || 'Hadir';
                      return (
                        <tr key={s.id} className="hover:bg-gray-50/30 transition">
                          <td className="p-4 font-extrabold text-gray-800">{s.nama_lengkap}</td>
                          <td className="p-4 font-semibold text-gray-400 text-xs">{s.kelas}</td>
                          <td className="p-4">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(s.id, 'Hadir')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition ${
                                  currentStatus === 'Hadir'
                                    ? 'bg-emerald-500 text-white shadow-xs'
                                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                }`}
                              >
                                Hadir
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(s.id, 'Izin')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition ${
                                  currentStatus === 'Izin'
                                    ? 'bg-blue-500 text-white shadow-xs'
                                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                }`}
                              >
                                Izin
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(s.id, 'Sakit')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition ${
                                  currentStatus === 'Sakit'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                }`}
                              >
                                Sakit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(s.id, 'Alpa')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition ${
                                  currentStatus === 'Alpa'
                                    ? 'bg-rose-500 text-white shadow-xs'
                                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                }`}
                              >
                                Alpa
                              </button>
                            </div>
                          </td>
                          <td className="p-4">
                            <input
                              type="text"
                              placeholder="Keterangan (misal: Demam, Acara Keluarga)"
                              value={batchKeterangan[s.id] || ''}
                              onChange={(e) => handleKeteranganChange(s.id, e.target.value)}
                              className="w-full bg-gray-50/70 border border-gray-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Save Button */}
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end items-center">
              {readOnly ? (
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
                  <span>Mode Pengawas: Hanya Lihat (Presensi tidak dapat diubah)</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Absensi Hari Ini</span>
                </button>
              )}
            </div>
          </form>
        </>
      ) : (
        /* MONTHLY REPORTS MODULE (Requirement 5) */
        <div className="space-y-6 animate-fade-in">
          {/* Parameters selector bar */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 shadow-3xs">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <div className="w-full sm:w-48">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Pilih Bulan Laporan</label>
                  <select
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    {getAvailableMonths().map((m) => (
                      <option key={m} value={m}>
                        {formattedMonthText(m)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="hidden sm:block h-8 w-px bg-gray-100"></div>

              <div className="w-full sm:w-48">
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Saring Kelas</label>
                <select
                  value={reportKelas}
                  onChange={(e) => setReportKelas(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="Semua Kelas">Semua Kelas</option>
                  {listKelas.map((k) => (
                    <option key={k} value={k}>
                      Kelas {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownloadReport}
              className="w-full md:w-auto inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Cetak & Unduh Laporan (.csv)</span>
            </button>
          </div>

          {/* Table representation */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="bg-gray-50/50 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-extrabold text-gray-800">
                  Rekapitulasi Kehadiran Latihan - {formattedMonthText(reportMonth)} ({reportKelas})
                </span>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase">
                {reportSiswa.length} Murid Terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/30 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">NIS</th>
                    <th className="p-4">Nama Lengkap</th>
                    <th className="p-4">Kelas</th>
                    <th className="p-4 text-center">Total Pertemuan</th>
                    <th className="p-4 text-center text-emerald-600">Hadir</th>
                    <th className="p-4 text-center text-blue-600">Izin</th>
                    <th className="p-4 text-center text-amber-500">Sakit</th>
                    <th className="p-4 text-center text-rose-500">Alpa</th>
                    <th className="p-4 text-center">Tingkat Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
                  {reportData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-400 font-medium">
                        Tidak ada data kehadiran murid untuk filter saat ini.
                      </td>
                    </tr>
                  ) : (
                    reportData.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/30 transition">
                        <td className="p-4 font-mono font-extrabold text-gray-400">{row.nis}</td>
                        <td className="p-4 font-black text-gray-800">{row.nama}</td>
                        <td className="p-4 font-bold text-gray-500">{row.kelas}</td>
                        <td className="p-4 text-center font-bold text-gray-600">{row.total}</td>
                        <td className="p-4 text-center font-bold text-emerald-600 bg-emerald-50/20">{row.hadir}</td>
                        <td className="p-4 text-center font-bold text-blue-600">{row.izin}</td>
                        <td className="p-4 text-center font-bold text-amber-600">{row.sakit}</td>
                        <td className="p-4 text-center font-bold text-rose-600 bg-rose-50/20">{row.alpa}</td>
                        <td className="p-4">
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                              row.percentage >= 90
                                ? 'bg-emerald-50 text-emerald-700'
                                : row.percentage >= 80
                                  ? 'bg-blue-50 text-blue-700'
                                  : row.percentage >= 60
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-rose-50 text-rose-700'
                            }`}>
                              {row.percentage}%
                            </span>
                            <span className="text-[9px] font-semibold text-gray-400">
                              {row.percentage >= 90 ? 'Sangat Baik' : row.percentage >= 80 ? 'Baik' : row.percentage >= 60 ? 'Cukup' : 'Kurang'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
