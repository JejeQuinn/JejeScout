import React from 'react';
import { Siswa, Kehadiran, Materi, SKU, Tabungan, Kedisiplinan, SKUItemDef } from '../types';
import { 
  Users, 
  CheckCircle, 
  BookOpen, 
  Landmark, 
  Award, 
  ShieldAlert, 
  Calendar, 
  UploadCloud, 
  HardDriveDownload,
  Users2,
  QrCode,
  Sparkles,
  Package,
  Library,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// @ts-ignore
import logoImage from '../assets/images/logo_pramuka_bakti_idhata_1787038251534.jpg';

interface DashboardProps {
  siswa: Siswa[];
  kehadiran: Kehadiran[];
  materi: Materi[];
  sku: SKU[];
  tabungan: Tabungan[];
  kedisiplinan: Kedisiplinan[];
  onNavigate: (tab: string) => void;
  skuDefs?: SKUItemDef[];
  onOpenBackupModal?: () => void;
}

export const DashboardOverview: React.FC<DashboardProps> = ({
  siswa,
  kehadiran,
  materi,
  sku,
  tabungan,
  kedisiplinan,
  onNavigate,
  skuDefs = [],
  onOpenBackupModal,
}) => {
  // Stats calculations
  const siswaAktif = siswa.filter((s) => s.status_aktif);
  const totalSiswa = siswaAktif.length;
  const totalMateri = materi.length;

  // Average active attendance rate
  const totalAbsenRecords = kehadiran.length;
  const totalHadir = kehadiran.filter((k) => k.status === 'Hadir').length;
  const rataKehadiran = totalAbsenRecords > 0 ? Math.round((totalHadir / totalAbsenRecords) * 100) : 0;

  // SKU progress - Total items verified
  const totalSkuVerified = sku.filter((s) => s.status_verifikasi).length;

  // Determine dynamic totals
  const bDefCount = skuDefs.filter((d) => d.tingkat === 'Bantara').length || 23;
  const lDefCount = skuDefs.filter((d) => d.tingkat === 'Laksana').length || 22;

  // Calculate unique classes & SKU progress percentages per class
  const classesList = Array.from(new Set(siswaAktif.map((s) => s.kelas))).filter(Boolean).sort();
  const chartData = classesList.map((kls) => {
    const classStudents = siswaAktif.filter((s) => s.kelas === kls);
    if (classStudents.length === 0) {
      return { name: kls, Bantara: 0, Laksana: 0 };
    }

    let totalBantaraPctSum = 0;
    let totalLaksanaPctSum = 0;

    classStudents.forEach((s) => {
      const bVerified = sku.filter((item) => item.siswa_id === s.id && item.status_verifikasi && (item.tingkat === 'Bantara' || !item.tingkat)).length;
      const lVerified = sku.filter((item) => item.siswa_id === s.id && item.status_verifikasi && item.tingkat === 'Laksana').length;

      const bPct = Math.min(100, Math.round((bVerified / bDefCount) * 100));
      const lPct = Math.min(100, Math.round((lVerified / lDefCount) * 100));

      totalBantaraPctSum += bPct;
      totalLaksanaPctSum += lPct;
    });

    return {
      name: `${kls}`,
      Bantara: Math.round(totalBantaraPctSum / classStudents.length),
      Laksana: Math.round(totalLaksanaPctSum / classStudents.length),
      jumlahAnggota: classStudents.length,
    };
  });

  // Calculate top progressive students in SKU (verified SKU items count)
  const skuProgressMap = siswaAktif.map((s) => {
    const bantaraCount = sku.filter((item) => item.siswa_id === s.id && item.status_verifikasi && (item.tingkat === 'Bantara' || !item.tingkat)).length;
    const laksanaCount = sku.filter((item) => item.siswa_id === s.id && item.status_verifikasi && item.tingkat === 'Laksana').length;
    return {
      siswa: s,
      sku_lulus_bantara: bantaraCount,
      sku_lulus_laksana: laksanaCount,
      total_lulus: bantaraCount + laksanaCount,
      persen_bantara: Math.round((bantaraCount / bDefCount) * 100),
      persen_laksana: Math.round((laksanaCount / lDefCount) * 100),
    };
  }).sort((a, b) => b.total_lulus - a.total_lulus).slice(0, 5);

  // Calculate financial statistics
  const totalWajib = tabungan.filter((t) => t.jenis === 'Wajib').reduce((acc, t) => acc + t.jumlah, 0);
  const totalSukarela = tabungan.filter((t) => t.jenis === 'Sukarela').reduce((acc, t) => acc + t.jumlah, 0);
  const totalKasPramuka = totalWajib + totalSukarela;

  // Discipline statistics
  const totalPelanggaran = kedisiplinan.filter((d) => d.tipe === 'Pelanggaran').length;
  const totalPrestasi = kedisiplinan.filter((d) => d.tipe === 'Prestasi').length;

  // Attendance by Status distribution for rendering SVG donut chart
  const statusCounts = {
    Hadir: kehadiran.filter((k) => k.status === 'Hadir').length,
    Izin: kehadiran.filter((k) => k.status === 'Izin').length,
    Sakit: kehadiran.filter((k) => k.status === 'Sakit').length,
    Alpa: kehadiran.filter((k) => k.status === 'Alpa').length,
  };
  const totalStatus = statusCounts.Hadir + statusCounts.Izin + statusCounts.Sakit + statusCounts.Alpa || 1;

  const pctHadir = Math.round((statusCounts.Hadir / totalStatus) * 100);
  const pctIzin = Math.round((statusCounts.Izin / totalStatus) * 100);
  const pctSakit = Math.round((statusCounts.Sakit / totalStatus) * 100);
  const pctAlpa = Math.round((statusCounts.Alpa / totalStatus) * 100);

  return (
    <div className="space-y-8" id="dashboard_overview">
      {/* Welcome Banner */}
      <div className="bg-indigo-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg border border-indigo-950">
        <div className="absolute right-0 top-0 bottom-0 opacity-15 flex items-center pr-10 pointer-events-none">
          <img 
            src={logoImage} 
            alt="Logo Pramuka Bakti Idhata Background" 
            className="w-48 h-48 md:w-64 md:h-64 object-contain opacity-10"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="bg-indigo-800 text-indigo-200 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SMK Bakti Idhata
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Selamat Datang, Kak Pembina!
            </h2>
            <p className="text-indigo-200 text-sm md:text-base leading-relaxed">
              Sistem Informasi Pramuka Penegak siap membantu Anda mengelola data anggota, absensi latihan mingguan, monitoring butir Syarat Kecakapan Umum (SKU), tabungan wajib, hingga rekapitulasi poin kedisiplinan secara digital dan terstruktur.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenBackupModal ? onOpenBackupModal() : onNavigate('google_drive')}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Backup JSON (Pulihkan Data)</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenBackupModal ? onOpenBackupModal() : onNavigate('google_drive')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                <HardDriveDownload className="w-4 h-4 text-indigo-200" />
                <span>Unduh File Cadangan (.json)</span>
              </button>
            </div>
          </div>
          <div className="hidden lg:block shrink-0 bg-white/10 p-4 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xs">
            <img 
              src={logoImage} 
              alt="Logo Pramuka Bakti Idhata" 
              className="w-24 h-24 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex items-center transition hover:shadow-md cursor-pointer" onClick={() => onNavigate('siswa')}>
          <div className="p-4 bg-indigo-50 rounded-xl text-indigo-600 mr-4">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Anggota Aktif</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalSiswa} Anggota</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex items-center transition hover:shadow-md cursor-pointer" onClick={() => onNavigate('absensi')}>
          <div className="p-4 bg-emerald-50 rounded-xl text-emerald-600 mr-4">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Rata Kehadiran</p>
            <h3 className="text-2xl font-bold text-gray-800">{rataKehadiran}% Efektif</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex items-center transition hover:shadow-md cursor-pointer" onClick={() => onNavigate('materi')}>
          <div className="p-4 bg-amber-50 rounded-xl text-amber-600 mr-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Materi Latihan</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalMateri} Diajarkan</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex items-center transition hover:shadow-md cursor-pointer" onClick={() => onNavigate('sku')}>
          <div className="p-4 bg-purple-50 rounded-xl text-purple-600 mr-4">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">SKU Terverifikasi</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalSkuVerified} Butir</h3>
          </div>
        </div>
      </div>

      {/* Recharts SKU Progress Chart per Class */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <Award className="w-5 h-5 mr-2 text-indigo-600" />
            Grafik Persentase Kelulusan SKU (Bantara & Laksana) per Kelas
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Menunjukkan rata-rata persentase penyelesaian butir SKU Penegak Bantara dan Laksana dari anggota aktif di masing-masing kelas.
          </p>
        </div>

        <div className="h-80 w-full bg-linear-to-b from-gray-50/20 to-white rounded-2xl p-2 border border-gray-50">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              Belum ada data kelas untuk ditampilkan.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#4b5563', fontSize: 11 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e1b4b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                  cursor={{ fill: '#f3f4f6', opacity: 0.5 }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#374151' }}
                />
                <Bar 
                  dataKey="Bantara" 
                  name="Rerata SKU Bantara (%)" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={45}
                />
                <Bar 
                  dataKey="Laksana" 
                  name="Rerata SKU Laksana (%)" 
                  fill="#ef4444" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Main Grid: Leaderboard and Stats Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SKU Leaderboard Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-amber-500" />
                  Anggota Paling Progresif (Top SKU)
                </h3>
                <p className="text-xs text-gray-400 mt-1">Dihitung dari jumlah butir SKU Bantara/Laksana yang sudah divalidasi</p>
              </div>
              <button 
                onClick={() => onNavigate('sku')} 
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
              >
                Lihat Semua &rarr;
              </button>
            </div>

            <div className="space-y-4">
              {skuProgressMap.length === 0 ? (
                <p className="text-center py-10 text-gray-400 text-sm">Belum ada data progres SKU.</p>
              ) : (
                skuProgressMap.map((item, idx) => (
                  <div key={item.siswa.id} className="flex flex-col space-y-2 p-3.5 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition border border-gray-100/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-amber-100 text-amber-800' : 
                          idx === 1 ? 'bg-gray-100 text-gray-600' : 
                          idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-50 text-gray-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{item.siswa.nama_lengkap}</p>
                          <p className="text-xs text-gray-400">{item.siswa.kelas} &bull; NIS {item.siswa.nis}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-emerald-50 text-emerald-700 font-extrabold px-2 py-1 rounded">
                          Total {item.total_lulus} Lulus
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-gray-100/30">
                      {/* Bantara Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-gray-400">
                          <span>Menuju Bantara</span>
                          <span className="text-indigo-600">{item.sku_lulus_bantara}/23 ({item.persen_bantara}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${item.persen_bantara}%` }}
                          />
                        </div>
                      </div>

                      {/* Laksana Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-gray-400">
                          <span>Menuju Laksana</span>
                          <span className="text-purple-600">{item.sku_lulus_laksana}/22 ({item.persen_laksana}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${item.persen_laksana}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Attendance Distribution Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-gray-100 mb-5">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
                Distribusi Kehadiran
              </h3>
              <p className="text-xs text-gray-400 mt-1">Rekapitulasi seluruh kehadiran absensi latihan</p>
            </div>

            {/* Custom SVG Donut Chart */}
            <div className="flex flex-col items-center py-4">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  {/* Empty base */}
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f3f4f6" strokeWidth="3" />
                  
                  {/* Hadir segment */}
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="3" 
                    strokeDasharray={`${pctHadir} ${100 - pctHadir}`} 
                    strokeDashoffset="0" />

                  {/* Izin segment */}
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="3" 
                    strokeDasharray={`${pctIzin} ${100 - pctIzin}`} 
                    strokeDashoffset={-(pctHadir)} />

                  {/* Sakit segment */}
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="3" 
                    strokeDasharray={`${pctSakit} ${100 - pctSakit}`} 
                    strokeDashoffset={-(pctHadir + pctIzin)} />

                  {/* Alpa segment */}
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="3" 
                    strokeDasharray={`${pctAlpa} ${100 - pctAlpa}`} 
                    strokeDashoffset={-(pctHadir + pctIzin + pctSakit)} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-gray-800">{rataKehadiran}%</span>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Kehadiran</span>
                </div>
              </div>

              {/* Legend with values */}
              <div className="w-full grid grid-cols-2 gap-3 mt-6">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="w-3 h-3 bg-emerald-500 rounded-xs flex-shrink-0" />
                  <span className="text-gray-600 font-medium">Hadir: <b>{pctHadir}%</b></span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="w-3 h-3 bg-blue-500 rounded-xs flex-shrink-0" />
                  <span className="text-gray-600 font-medium">Izin: <b>{pctIzin}%</b></span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="w-3 h-3 bg-amber-500 rounded-xs flex-shrink-0" />
                  <span className="text-gray-600 font-medium">Sakit: <b>{pctSakit}%</b></span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="w-3 h-3 bg-red-500 rounded-xs flex-shrink-0" />
                  <span className="text-gray-600 font-medium">Alpa: <b>{pctAlpa}%</b></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auxiliary Systems Section (Tabungan, Poin, Jurnal) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Tabungan Kas */}
        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 bg-indigo-500 text-white rounded-xl w-fit">
              <Landmark className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-gray-800 text-base">Tabungan & Kas Pramuka</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Mencatat iuran wajib mingguan dan dana sukarela guna latihan gabungan atau persami.
            </p>
          </div>
          <div className="pt-4 border-t border-indigo-100/50 mt-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-indigo-400 font-bold uppercase">Kas Terkumpul</p>
              <p className="text-lg font-black text-indigo-900">
                Rp {totalKasPramuka.toLocaleString('id-ID')}
              </p>
            </div>
            <button 
              onClick={() => onNavigate('tabungan')} 
              className="text-xs font-bold text-indigo-700 bg-indigo-100/75 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
            >
              Kelola &rarr;
            </button>
          </div>
        </div>

        {/* Kedisiplinan */}
        <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-2xl border border-amber-100 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 bg-amber-500 text-white rounded-xl w-fit">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-gray-800 text-base">Poin Kedisiplinan</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Mencatat reward prestasi ambalan & punishment pelanggaran seragam/kehadiran.
            </p>
          </div>
          <div className="pt-4 border-t border-amber-100/50 mt-4 flex items-center justify-between">
            <div className="flex gap-4">
              <div>
                <p className="text-[10px] text-amber-500 font-bold uppercase">Prestasi</p>
                <p className="text-sm font-extrabold text-emerald-600">+{totalPrestasi}</p>
              </div>
              <div>
                <p className="text-[10px] text-amber-500 font-bold uppercase">Pelanggaran</p>
                <p className="text-sm font-extrabold text-rose-600">{totalPelanggaran}</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('kedisiplinan')} 
              className="text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200/50 px-3 py-1.5 rounded-lg transition"
            >
              Kelola &rarr;
            </button>
          </div>
        </div>

        {/* Jurnal Pembina */}
        <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-purple-100 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 bg-purple-500 text-white rounded-xl w-fit">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-gray-800 text-base">Jurnal Mengajar Pembina</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Dokumentasi aktivitas, kendala latihan, serta evaluasi mingguan pembina pramuka.
            </p>
          </div>
          <div className="pt-4 border-t border-purple-100/50 mt-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-purple-400 font-bold uppercase">Evaluasi Terakhir</p>
              <p className="text-xs font-semibold text-purple-900 truncate max-w-[120px]">
                Kondusif, remidi simpul
              </p>
            </div>
            <button 
              onClick={() => onNavigate('jurnal')} 
              className="text-xs font-bold text-purple-800 bg-purple-100 hover:bg-purple-200/50 px-3 py-1.5 rounded-lg transition"
            >
              Kelola &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Ekosistem Manajemen & Digitalisasi Ambalan */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Ekosistem Manajemen Ambalan
            </span>
            <h3 className="text-base font-black text-gray-800 tracking-tight mt-1">
              Modul Digitalisasi & Tata Kelola Lengkap
            </h3>
            <p className="text-xs text-gray-500">
              Akses cepat pencatatan SKK, absensi QR event, inventaris logistik, e-library, kas, dan Dewan Ambalan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Dewan Ambalan */}
          <div 
            onClick={() => onNavigate('dewan_ambalan')}
            className="group p-4 rounded-xl border border-amber-100/80 bg-gradient-to-br from-amber-50/40 to-white hover:border-amber-300 hover:shadow-sm transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                <Users2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-800 group-hover:text-amber-700 transition">Dewan Ambalan</h4>
                <p className="text-[11px] text-gray-500">Struktur organisasi & sertijab</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition" />
          </div>

          {/* SKK / TKK Digital */}
          <div 
            onClick={() => onNavigate('skk')}
            className="group p-4 rounded-xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50/40 to-white hover:border-indigo-300 hover:shadow-sm transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-800 group-hover:text-indigo-700 transition">SKK / TKK Digital</h4>
                <p className="text-[11px] text-gray-500">Katalog & verifikasi penguji</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
          </div>

          {/* Absensi QR Code & Event */}
          <div 
            onClick={() => onNavigate('absensi_qr')}
            className="group p-4 rounded-xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/40 to-white hover:border-emerald-300 hover:shadow-sm transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-800 group-hover:text-emerald-700 transition">Absensi QR & Event</h4>
                <p className="text-[11px] text-gray-500">QR generator & geo-tagging</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
          </div>

          {/* Inventaris & Logistik */}
          <div 
            onClick={() => onNavigate('inventaris')}
            className="group p-4 rounded-xl border border-orange-100/80 bg-gradient-to-br from-orange-50/40 to-white hover:border-orange-300 hover:shadow-sm transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-800 group-hover:text-orange-700 transition">Inventaris & Logistik</h4>
                <p className="text-[11px] text-gray-500">Stok tenda, tongkat & pinjaman</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition" />
          </div>

          {/* E-Library & Silabus */}
          <div 
            onClick={() => onNavigate('elibrary')}
            className="group p-4 rounded-xl border border-sky-100/80 bg-gradient-to-br from-sky-50/40 to-white hover:border-sky-300 hover:shadow-sm transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                <Library className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-800 group-hover:text-sky-700 transition">E-Library & Silabus</h4>
                <p className="text-[11px] text-gray-500">Materi sandi, simpul & PPGD</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-sky-600 group-hover:translate-x-1 transition" />
          </div>

          {/* Keuangan & Kas */}
          <div 
            onClick={() => onNavigate('kas')}
            className="group p-4 rounded-xl border border-teal-100/80 bg-gradient-to-br from-teal-50/40 to-white hover:border-teal-300 hover:shadow-sm transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-800 group-hover:text-teal-700 transition">Keuangan & Kas</h4>
                <p className="text-[11px] text-gray-500">Iuran ambalan & transparansi</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>
    </div>
  );
};
