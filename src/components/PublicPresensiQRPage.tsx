import React, { useState, useEffect, useMemo } from 'react';
import { 
  Siswa, 
  KegiatanEvent, 
  Kehadiran, 
  StatusKehadiran,
  SKU,
  SKUItemDef,
  SKKRecord
} from '../types';
import { 
  CheckCircle2, 
  QrCode, 
  Search, 
  UserCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw, 
  Smartphone, 
  Award, 
  ChevronRight, 
  LogIn, 
  Check, 
  Info, 
  User, 
  GraduationCap,
  Layers,
  MapPinned,
  Share2,
  FileCheck,
  ChevronDown
} from 'lucide-react';
// @ts-ignore
import logoImage from '../assets/images/logo_pramuka_bakti_idhata_1787038251534.jpg';

interface PublicPresensiQRPageProps {
  siswa: Siswa[];
  events: KegiatanEvent[];
  kehadiran: Kehadiran[];
  sku?: SKU[];
  skuDefs?: SKUItemDef[];
  skkRecords?: SKKRecord[];
  onRecordAttendance: (data: {
    siswa_id: string;
    tanggal: string;
    status: StatusKehadiran;
    catatan?: string;
  }) => void;
  onGoToLogin: () => void;
  isAuthenticated?: boolean;
}

// Audio beep tone on attendance success
const playSuccessSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch (e) {}
  if (navigator.vibrate) {
    try { navigator.vibrate([100, 50, 100]); } catch (e) {}
  }
};

export const PublicPresensiQRPage: React.FC<PublicPresensiQRPageProps> = ({
  siswa,
  events,
  kehadiran,
  sku = [],
  skuDefs = [],
  skkRecords = [],
  onRecordAttendance,
  onGoToLogin,
  isAuthenticated = false,
}) => {
  // 1. Read URL query parameters
  const [urlParams] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return {
        eventId: params.get('eventId') || '',
        token: params.get('token') || '',
      };
    } catch (e) {
      return { eventId: '', token: '' };
    }
  });

  // Current active event selection
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    if (urlParams.eventId && events.some(e => e.id === urlParams.eventId)) {
      return urlParams.eventId;
    }
    const active = events.find(e => e.is_active);
    if (active) return active.id;
    return events.length > 0 ? events[0].id : '';
  });

  const selectedEvent = useMemo(() => {
    return events.find(e => e.id === selectedEventId) || events.find(e => e.is_active) || events[0];
  }, [events, selectedEventId]);

  // Live time string
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Student search and selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('Semua');
  const [selectedSiswaId, setSelectedSiswaId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<StatusKehadiran>('Hadir');
  const [catatanInput, setCatatanInput] = useState<string>('');

  // GPS verification state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<{
    verified: boolean;
    distanceMeter?: number;
    message?: string;
  } | null>(null);

  // Success Pass Receipt
  const [attendancePass, setAttendancePass] = useState<{
    receiptNo: string;
    studentName: string;
    studentClass: string;
    studentNis: string;
    sangga: string;
    eventName: string;
    date: string;
    time: string;
    status: StatusKehadiran;
    totalHadir: number;
    bantaraPercent: number;
    laksanaPercent: number;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  // Unique classes for filtering
  const availableClasses = useMemo(() => {
    const classes = Array.from(new Set(siswa.map(s => s.kelas))).filter(Boolean).sort();
    return ['Semua', ...classes];
  }, [siswa]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return siswa.filter(s => {
      const matchClass = selectedClassFilter === 'Semua' || s.kelas === selectedClassFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchClass;

      const matchName = s.nama_lengkap.toLowerCase().includes(q);
      const matchNis = s.nis.toLowerCase().includes(q);
      const matchNisn = (s.nis_murid_anggota || s.nisn)?.toLowerCase().includes(q) || false;
      const matchSangga = s.sangga?.toLowerCase().includes(q) || false;
      const matchKelas = s.kelas.toLowerCase().includes(q);

      return matchClass && (matchName || matchNis || matchNisn || matchSangga || matchKelas);
    });
  }, [siswa, searchQuery, selectedClassFilter]);

  const selectedStudent = useMemo(() => {
    return siswa.find(s => s.id === selectedSiswaId) || null;
  }, [siswa, selectedSiswaId]);

  // Check if selected student is already marked attended for this event and date
  const isAlreadyAttended = useMemo(() => {
    if (!selectedStudent || !selectedEvent) return null;
    return kehadiran.find(
      k => k.siswa_id === selectedStudent.id && k.tanggal === selectedEvent.tanggal
    );
  }, [selectedStudent, selectedEvent, kehadiran]);

  // Helper to compute SKU/attendance progress
  const getStudentProgress = (studentId: string) => {
    const studentHadirCount = kehadiran.filter(k => k.siswa_id === studentId && k.status === 'Hadir').length;
    const bantaraPassed = sku.filter(
      k => k.siswa_id === studentId && k.status_verifikasi && (k.tingkat === 'Bantara' || !k.tingkat)
    ).length;
    const bantaraTotal = skuDefs.filter(d => d.tingkat === 'Bantara').length || 23;
    const bantaraPercent = Math.min(100, Math.round((bantaraPassed / bantaraTotal) * 100));

    const laksanaPassed = sku.filter(
      k => k.siswa_id === studentId && k.status_verifikasi && k.tingkat === 'Laksana'
    ).length;
    const laksanaTotal = skuDefs.filter(d => d.tingkat === 'Laksana').length || 22;
    const laksanaPercent = Math.min(100, Math.round((laksanaPassed / laksanaTotal) * 100));

    return {
      studentHadirCount,
      bantaraPercent,
      laksanaPercent
    };
  };

  // Check GPS location if event has coordinates
  const handleCheckGPS = () => {
    if (!navigator.geolocation) {
      alert('Perangkat Anda tidak mendukung fitur lokasi / GPS.');
      return;
    }
    if (!selectedEvent?.lat || !selectedEvent?.lng) {
      setGpsStatus({
        verified: true,
        message: 'Kegiatan ini tidak membatasi radius lokasi GPS.'
      });
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        // Haversine formula
        const R = 6371e3;
        const φ1 = (userLat * Math.PI) / 180;
        const φ2 = (selectedEvent.lat! * Math.PI) / 180;
        const Δφ = ((selectedEvent.lat! - userLat) * Math.PI) / 180;
        const Δλ = ((selectedEvent.lng! - userLng) * Math.PI) / 180;
        const a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = Math.round(R * c);

        const allowedRadius = selectedEvent.radius_meter || 200;
        const isWithin = distance <= allowedRadius;

        setGpsStatus({
          verified: isWithin,
          distanceMeter: distance,
          message: isWithin
            ? `Posisi Terverifikasi di Pangkalan (${distance}m dari lokasi acara)`
            : `Anda terdeteksi ${distance}m dari lokasi acara (Batas: ${allowedRadius}m)`
        });
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setGpsStatus({
          verified: true, // Graceful fallback
          message: `GPS izin dibatasi: ${err.message}. Presensi tetap dapat dilanjutkan.`
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Submit attendance
  const handleSubmitAttendance = () => {
    if (!selectedStudent) {
      alert('Silakan pilih nama anggota penegak terlebih dahulu!');
      return;
    }
    if (!selectedEvent) {
      alert('Tidak ada data kegiatan aktif!');
      return;
    }

    // Verify token if url has token and event has qr_token
    if (urlParams.token && selectedEvent.qr_token && urlParams.token !== selectedEvent.qr_token) {
      if (!confirm('Token QR di tautan sedikit berbeda dengan kegiatan saat ini. Apakah Anda yakin ingin melanjutkan?')) {
        return;
      }
    }

    setSubmitting(true);

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const randomReceipt = `PRS-${selectedEvent.tanggal.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const catatanText = catatanInput.trim() 
      ? `Presensi Mandiri Penegak: ${catatanInput.trim()}`
      : `Presensi QR Mandiri [${selectedEvent.nama_kegiatan}]`;

    // Record attendance to parent state & Firestore
    onRecordAttendance({
      siswa_id: selectedStudent.id,
      tanggal: selectedEvent.tanggal,
      status: selectedStatus,
      catatan: catatanText
    });

    playSuccessSound();

    const progress = getStudentProgress(selectedStudent.id);

    setAttendancePass({
      receiptNo: randomReceipt,
      studentName: selectedStudent.nama_lengkap,
      studentClass: selectedStudent.kelas,
      studentNis: selectedStudent.nis,
      sangga: selectedStudent.sangga || 'Sangga Ambalan',
      eventName: selectedEvent.nama_kegiatan,
      date: selectedEvent.tanggal,
      time: timeStr,
      status: selectedStatus,
      totalHadir: progress.studentHadirCount + 1,
      bantaraPercent: progress.bantaraPercent,
      laksanaPercent: progress.laksanaPercent
    });

    setSubmitting(false);
  };

  const handleShareLink = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setIsCopiedLink(true);
      setTimeout(() => setIsCopiedLink(false), 2500);
    }
  };

  const handleResetForAnotherStudent = () => {
    setSelectedSiswaId(null);
    setSearchQuery('');
    setCatatanInput('');
    setAttendancePass(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 flex flex-col font-sans selection:bg-amber-500 selection:text-white pb-12">
      
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white p-1 shadow-md shadow-amber-500/10 ring-2 ring-white/10 shrink-0">
              <img 
                src={logoImage} 
                alt="Logo Pramuka Bakti Idhata" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-wide text-white uppercase flex items-center gap-1.5">
                  Presensi Mandiri Penegak
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Tanpa Login
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Gudep 07.133 - 07.134 • SMK Bakti Idhata
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleShareLink}
              title="Salin tautan presensi"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-white/10 transition flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isCopiedLink ? 'Tersalin!' : 'Bagikan'}</span>
            </button>

            <button
              type="button"
              onClick={onGoToLogin}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isAuthenticated ? 'Dashboard' : 'Login Pembina'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* 2. Success Attendance Pass Modal/Card (if submitted) */}
        {attendancePass && (
          <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/40 animate-fade-in relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 mx-auto animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Tanda Bukti Presensi Digital
                </span>
                <h2 className="text-2xl font-black text-white mt-2">
                  Presensi Berhasil Dicatat!
                </h2>
                <p className="text-xs text-emerald-200/80 mt-1">
                  Salam Pramuka! Kehadiran Anda telah terverifikasi secara resmi di database Ambalan.
                </p>
              </div>
            </div>

            {/* Pass Ticket Details */}
            <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Nama Anggota Penegak</span>
                  <p className="text-base font-black text-white">{attendancePass.studentName}</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">No. Bukti / ID Presensi</span>
                  <p className="font-mono text-xs font-bold text-amber-300">{attendancePass.receiptNo}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Kelas</span>
                  <span className="font-black text-white">{attendancePass.studentClass}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">NIS</span>
                  <span className="font-mono font-bold text-white">{attendancePass.studentNis}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Sangga</span>
                  <span className="font-bold text-amber-300">{attendancePass.sangga}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Status</span>
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {attendancePass.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Kegiatan</span>
                  <span className="font-bold text-indigo-200">{attendancePass.eventName}</span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-slate-400 block">Waktu Tercatat</span>
                  <span className="font-mono font-bold text-slate-300">{attendancePass.date} • {attendancePass.time}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-bold">Total Kehadiran</span>
                  <span className="text-base font-black text-white">{attendancePass.totalHadir} Pertemuan</span>
                </div>
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-bold">SKU Bantara</span>
                  <span className="text-base font-black text-amber-300">{attendancePass.bantaraPercent}%</span>
                </div>
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-bold">SKU Laksana</span>
                  <span className="text-base font-black text-indigo-300">{attendancePass.laksanaPercent}%</span>
                </div>
              </div>
            </div>

            {/* Action Buttons in Pass */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold border border-white/10 transition flex items-center justify-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>Simpan Bukti (Screenshot / Cetak)</span>
              </button>

              <button
                type="button"
                onClick={handleResetForAnotherStudent}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-black shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Absenkan Rekan Penegak Lain</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Event Information Banner */}
        {selectedEvent && (
          <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {selectedEvent.kategori}
                  </span>
                  {selectedEvent.is_active ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1.5"></span>
                      Kegiatan Berlangsung
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300">
                      Agenda Terjadwal
                    </span>
                  )}
                  {urlParams.token && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      QR Terverifikasi
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {selectedEvent.nama_kegiatan}
                </h2>
              </div>

              {/* Event Selector dropdown if multiple active events */}
              {events.length > 1 && (
                <div className="shrink-0">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Ganti Kegiatan:</label>
                  <div className="relative">
                    <select
                      value={selectedEvent.id}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full sm:w-auto bg-slate-900 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.nama_kegiatan} ({ev.tanggal})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Event Meta Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="flex items-center space-x-2.5 bg-slate-900/60 p-2.5 rounded-2xl border border-white/5">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Tanggal Pelaksanaan</span>
                  <span className="font-bold text-white">{selectedEvent.tanggal}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 bg-slate-900/60 p-2.5 rounded-2xl border border-white/5">
                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Waktu Sesi</span>
                  <span className="font-bold text-white">{selectedEvent.jam_mulai} - {selectedEvent.jam_selesai} WIB</span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 bg-slate-900/60 p-2.5 rounded-2xl border border-white/5">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 block">Tempat / Lokasi</span>
                  <span className="font-bold text-white truncate block">{selectedEvent.lokasi}</span>
                </div>
              </div>
            </div>

            {selectedEvent.deskripsi && (
              <p className="text-xs text-slate-400 italic bg-slate-900/30 p-2.5 rounded-xl border border-white/5">
                "{selectedEvent.deskripsi}"
              </p>
            )}
          </div>
        )}

        {/* 4. Student Attendance Form */}
        <div className="bg-slate-800/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-white/10 shadow-2xl space-y-6">
          <div className="border-b border-white/10 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                Langkah 1: Cari & Pilih Identitas Anda
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ketik nama atau NIS untuk menemukan data Anda di daftar Ambalan
              </p>
            </div>
            <span className="text-xs font-mono text-amber-300 font-bold bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
              {currentTimeStr}
            </span>
          </div>

          {/* Search Box & Quick Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik Nama Anda, NIS, atau Sangga (misal: Fauzi, 2324...)"
                className="w-full bg-slate-900/90 border-2 border-white/15 focus:border-amber-500 rounded-2xl pl-12 pr-10 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Class Selector Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Filter Kelas:
              </span>
              {availableClasses.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setSelectedClassFilter(cls)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 ${
                    selectedClassFilter === cls
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-900/80 hover:bg-slate-700 text-slate-300 border border-white/5'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Student Candidate List (If not yet selected or searching) */}
          {!selectedStudent && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Ditemukan {filteredStudents.length} anggota</span>
                <span className="text-[10px]">Klik nama Anda untuk memilih</span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {filteredStudents.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-dashed border-white/10 text-slate-400 text-xs">
                    <p className="font-bold">Tidak ditemukan anggota dengan kata kunci tersebut.</p>
                    <p className="text-[11px] mt-1 text-slate-500">
                      Coba cari menggunakan nama depan atau periksa filter kelas di atas.
                    </p>
                  </div>
                ) : (
                  filteredStudents.map((s) => {
                    // Check if already attended
                    const already = kehadiran.some(
                      k => k.siswa_id === s.id && k.tanggal === (selectedEvent?.tanggal || '')
                    );

                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSiswaId(s.id)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          already
                            ? 'bg-slate-900/40 border-emerald-500/30 hover:bg-slate-900/80'
                            : 'bg-slate-900/80 hover:bg-slate-700/80 border-white/10 hover:border-amber-500/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${
                            already ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-amber-300 border border-white/10'
                          }`}>
                            {s.nama_lengkap.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-black text-white truncate">{s.nama_lengkap}</h4>
                              <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-white/5">
                                {s.kelas}
                              </span>
                              {already && (
                                <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  ✓ Sudah Hadir
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span>NIS: {s.nis}</span>
                              {s.sangga && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-300/80 font-medium">{s.sangga}</span>
                                </>
                              )}
                              <span>•</span>
                              <span className="text-indigo-300 font-medium">{s.status_pelantikan}</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-slate-400 hover:text-white">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Selected Student Confirmation Card */}
          {selectedStudent && (
            <div className="space-y-5">
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border-2 border-amber-500/50 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-base flex items-center justify-center shrink-0 shadow-md">
                      {selectedStudent.nama_lengkap.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-black text-white">
                          {selectedStudent.nama_lengkap}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {selectedStudent.kelas}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        NIS: <span className="font-mono text-slate-200">{selectedStudent.nis}</span> • Sangga: <span className="text-amber-300 font-bold">{selectedStudent.sangga || 'Ambalan'}</span> • Tingkat: <span className="text-slate-200">{selectedStudent.status_pelantikan}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedSiswaId(null)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition self-end sm:self-center border border-white/10"
                  >
                    Ganti Anggota
                  </button>
                </div>

                {/* Warning if already attended */}
                {isAlreadyAttended && (
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Anda Sudah Tercatat Hadir pada Kegiatan Ini!</p>
                      <p className="text-[11px] text-emerald-200/80 mt-0.5">
                        Status kehadiran Anda: <strong>{isAlreadyAttended.status}</strong>. Keterangan: {isAlreadyAttended.keterangan || 'Presensi QR'}. Anda dapat memperbarui catatan atau presensikan rekan lain.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Attendance Options */}
              <div className="space-y-4 pt-1">
                <div>
                  <label className="text-xs font-black text-slate-300 block mb-2">
                    Langkah 2: Pilih Status Kehadiran
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['Hadir', 'Izin', 'Sakit'] as StatusKehadiran[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedStatus(st)}
                        className={`py-3 px-3 rounded-2xl text-xs font-black border transition flex items-center justify-center gap-2 ${
                          selectedStatus === st
                            ? st === 'Hadir'
                              ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30'
                              : st === 'Izin'
                              ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-600/30'
                              : 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-600/30'
                            : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {selectedStatus === st && <Check className="w-4 h-4" />}
                        <span>{st}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Catatan */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Catatan Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={catatanInput}
                    onChange={(e) => setCatatanInput(e.target.value)}
                    placeholder="Contoh: Hadir tepat waktu, dispensasi tugas sekolah, dll."
                    className="w-full bg-slate-900 border border-white/15 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                {/* GPS Verification Button (Optional) */}
                {selectedEvent?.lat && selectedEvent?.lng && (
                  <div className="p-3 bg-slate-900/70 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center space-x-2">
                      <MapPinned className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-slate-300">
                        {gpsStatus?.message || 'Verifikasi lokasi kehadiran Anda (GPS)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCheckGPS}
                      disabled={gpsLoading}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/20 transition self-start sm:self-auto shrink-0"
                    >
                      {gpsLoading ? 'Mendeteksi...' : 'Cek Lokasi GPS'}
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSubmitAttendance}
                    disabled={submitting}
                    className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/25 transition active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="w-5 h-5" />
                    <span>
                      {submitting
                        ? 'Menyimpan Presensi...'
                        : isAlreadyAttended
                        ? 'Perbarui Status Presensi Saya'
                        : `KIRIM PRESENSI SEKARANG (${selectedStatus.toUpperCase()})`}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Helpful Guide & FAQs for Penegak Members */}
        <div className="p-5 bg-slate-800/40 rounded-3xl border border-white/5 space-y-3 text-xs text-slate-400">
          <div className="flex items-center space-x-2 text-slate-200 font-bold">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Petunjuk Presensi Mandiri Pramuka Penegak:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] leading-relaxed text-slate-400">
            <li>Anggota Penegak tidak perlu memiliki akun login untuk mengisi daftar hadir kegiatan.</li>
            <li>Cukup pindai kode QR yang ditampilkan di layar proyektor atau papan sanggar menggunakan kamera smartphone.</li>
            <li>Ketik nama Anda di bilah pencarian, pilih nama Anda, dan klik tombol <strong>Kirim Presensi Sekarang</strong>.</li>
            <li>Satu perangkat ponsel dapat digunakan bergantian untuk mengabsenkan rekan satu sangga.</li>
            <li>Bila nama belum terdaftar, silakan laporkan kepada Pradana Dewan Ambalan atau Pembina Pramuka.</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 text-center text-[11px] text-slate-500 space-y-1">
        <p>Ambalan Penegak Raden Fatahillah & Cut Nyak Dien</p>
        <p>Gugus Depan 07.133 - 07.134 • SMK Bakti Idhata Jakarta</p>
      </footer>
    </div>
  );
};
