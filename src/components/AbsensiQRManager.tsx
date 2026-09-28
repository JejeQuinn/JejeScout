import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { 
  KegiatanEvent, 
  Siswa, 
  Kehadiran, 
  StatusKehadiran, 
  SKU, 
  SKUItemDef, 
  SKKRecord, 
  SKKDef 
} from '../types';
import { 
  QrCode, 
  MapPin, 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Users, 
  Download, 
  Camera, 
  Compass, 
  Search, 
  Check, 
  X,
  Navigation,
  ShieldCheck,
  ChevronRight,
  Maximize2,
  Minimize2,
  Copy,
  CheckCheck,
  CameraOff,
  SwitchCamera,
  Zap,
  ZapOff,
  Upload,
  Sparkles,
  Award,
  TrendingUp,
  FileText,
  Printer,
  BookOpen,
  Filter,
  ExternalLink,
  ChevronDown,
  Info
} from 'lucide-react';

interface AbsensiQRManagerProps {
  events: KegiatanEvent[];
  siswa: Siswa[];
  kehadiran: Kehadiran[];
  sku?: SKU[];
  skuDefs?: SKUItemDef[];
  skkRecords?: SKKRecord[];
  skkDefs?: SKKDef[];
  onAddEvent: (event: Omit<KegiatanEvent, 'id'>) => void;
  onUpdateEvent: (event: KegiatanEvent) => void;
  onRecordAttendance: (data: { siswa_id: string; tanggal: string; status: StatusKehadiran; catatan?: string }) => void;
  onVerifySKU?: (data: { siswa_id: string; no_item_sku: number; tanggal_lulus: string; status_verifikasi: boolean; tingkat: 'Bantara' | 'Laksana'; pembina_verifikator?: string }) => void;
  onUpdateSiswa?: (siswa: Siswa) => void;
  readOnly?: boolean;
  onOpenPublicPortal?: (eventId?: string) => void;
}

// Synthesize an audio beep tone on successful QR scan
const playBeep = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch (e) {
    // AudioContext blocked or not supported
  }
  if (navigator.vibrate) {
    try { navigator.vibrate(120); } catch (e) {}
  }
};

export const AbsensiQRManager: React.FC<AbsensiQRManagerProps> = ({
  events,
  siswa,
  kehadiran,
  sku = [],
  skuDefs = [],
  skkRecords = [],
  skkDefs = [],
  onAddEvent,
  onUpdateEvent,
  onRecordAttendance,
  onVerifySKU,
  onUpdateSiswa,
  readOnly = false,
  onOpenPublicPortal,
}) => {
  // Check URL query parameters for auto-navigating to an event or presensi tab
  const [activeEventId, setActiveEventId] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlEventId = params.get('eventId');
      if (urlEventId && events.some(e => e.id === urlEventId)) {
        return urlEventId;
      }
    } catch (e) {}
    const active = events.find(e => e.is_active);
    return active ? active.id : (events.length > 0 ? events[0].id : '');
  });

  const [activeTab, setActiveTab] = useState<'qr_display' | 'kamera_scan' | 'rekap_kenaikan_tingkat' | 'daftar_kegiatan'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('presensi') === '1' || params.get('tab') === 'kamera_scan') {
        return 'kamera_scan';
      }
    } catch (e) {}
    return 'qr_display';
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // New Event Modal state
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [namaKegiatan, setNamaKegiatan] = useState('');
  const [kategori, setKategori] = useState<KegiatanEvent['kategori']>('Latihan Rutin');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jamMulai, setJamMulai] = useState('15:00');
  const [jamSelesai, setJamSelesai] = useState('17:30');
  const [lokasi, setLokasi] = useState('Lapangan Utama SMK Bakti Idhata');
  const [lat, setLat] = useState<number>(-6.29548);
  const [lng, setLng] = useState<number>(106.79975);
  const [radiusMeter, setRadiusMeter] = useState<number>(150);
  const [deskripsi, setDeskripsi] = useState('');
  const [targetTingkat, setTargetTingkat] = useState<'Semua Tingkat' | 'Bantara' | 'Laksana'>('Semua Tingkat');
  const [terkaitSkuNo, setTerkaitSkuNo] = useState<number | ''>('');
  const [geoLocating, setGeoLocating] = useState(false);

  // Camera QR Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Self Attendance manual inputs & feedback
  const [scanNisInput, setScanNisInput] = useState('');
  const [scanTokenInput, setScanTokenInput] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || '';
    } catch (e) {
      return '';
    }
  });
  const [scanFeedback, setScanFeedback] = useState<{ 
    type: 'success' | 'error'; 
    message: string;
    studentName?: string;
    studentClass?: string;
    bantaraProgress?: number;
    laksanaProgress?: number;
    attendanceRate?: number;
    linkedSkuNo?: number;
    studentId?: string;
  } | null>(null);
  const [userCurrentCoord, setUserCurrentCoord] = useState<{ lat: number; lng: number } | null>(null);

  // Rekap Kenaikan Tingkat Tab State
  const [rekapFilterKelas, setRekapFilterKelas] = useState<string>('all');
  const [rekapFilterStatus, setRekapFilterStatus] = useState<'all' | 'siap_bantara' | 'siap_laksana' | 'proses'>('all');
  const [rekapSearch, setRekapSearch] = useState('');

  const selectedEvent = events.find(e => e.id === activeEventId);

  // Digital clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate QR Code with direct URL payload so any phone camera / scanner opens the app directly
  useEffect(() => {
    if (selectedEvent) {
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      const directScanUrl = `${baseUrl}?presensi=1&eventId=${encodeURIComponent(selectedEvent.id)}&token=${encodeURIComponent(selectedEvent.qr_token)}`;

      QRCode.toDataURL(directScanUrl, {
        width: 360,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#1e1b4b',
          light: '#ffffff'
        }
      }).then(url => {
        setQrDataUrl(url);
      }).catch(err => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [selectedEvent]);

  // Request browser GPS location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Fitur Geolocation tidak didukung di peramban ini.');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        setUserCurrentCoord({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLocating(false);
      },
      (err) => {
        alert('Gagal membaca lokasi GPS: ' + err.message);
        setGeoLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Haversine Distance calculation in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  // Helper to calculate rank advancement (syarat kenaikan tingkat) for any student
  const getStudentKenaikanTingkatData = useCallback((sId: string) => {
    const student = siswa.find(s => s.id === sId);
    if (!student) return null;

    // 1. Attendance rate
    const totalEvents = events.filter(e => e.is_active || new Date(e.tanggal) <= new Date()).length || 1;
    const studentPresensiCount = kehadiran.filter(k => k.siswa_id === sId && k.status === 'Hadir').length;
    const attendancePercentage = Math.round((studentPresensiCount / totalEvents) * 100);
    const isAttendanceEligible = attendancePercentage >= 75 || studentPresensiCount >= 8;

    // 2. SKU Bantara (23 items)
    const bantaraDefs = skuDefs.filter(d => d.tingkat === 'Bantara');
    const totalBantara = bantaraDefs.length || 23;
    const bantaraPassed = sku.filter(k => k.siswa_id === sId && k.status_verifikasi && (k.tingkat === 'Bantara' || !k.tingkat)).length;
    const bantaraPercentage = Math.min(100, Math.round((bantaraPassed / totalBantara) * 100));
    const isBantaraSKUEligible = bantaraPassed >= totalBantara;

    // 3. SKU Laksana (22 items)
    const laksanaDefs = skuDefs.filter(d => d.tingkat === 'Laksana');
    const totalLaksana = laksanaDefs.length || 22;
    const laksanaPassed = sku.filter(k => k.siswa_id === sId && k.status_verifikasi && k.tingkat === 'Laksana').length;
    const laksanaPercentage = Math.min(100, Math.round((laksanaPassed / totalLaksana) * 100));
    const isLaksanaSKUEligible = laksanaPassed >= totalLaksana;

    // 4. SKK / TKK
    const studentSkkCount = skkRecords.filter(r => r.siswa_id === sId && r.status_verifikasi).length;

    // 5. Overall Rank Status
    let statusKelayakan: 'Siap Bantara' | 'Siap Laksana' | 'Proses Bantara' | 'Proses Laksana' = 'Proses Bantara';
    let catatanStatus = '';

    if (student.status_pelantikan === 'Penegak Laksana') {
      statusKelayakan = 'Siap Laksana';
      catatanStatus = 'Sudah Dilantik Penegak Laksana';
    } else if (student.status_pelantikan === 'Penegak Bantara') {
      if (isAttendanceEligible && isLaksanaSKUEligible) {
        statusKelayakan = 'Siap Laksana';
        catatanStatus = 'Syarat Laksana Lengkap: Siap Dilantik!';
      } else {
        statusKelayakan = 'Proses Laksana';
        const sisaSKU = Math.max(0, totalLaksana - laksanaPassed);
        catatanStatus = `Menuju Laksana (Sisa ${sisaSKU} Butir SKU${!isAttendanceEligible ? ', Perlu tambah kehadiran' : ''})`;
      }
    } else {
      if (isAttendanceEligible && isBantaraSKUEligible) {
        statusKelayakan = 'Siap Bantara';
        catatanStatus = 'Syarat Bantara Lengkap: Siap Dilantik!';
      } else {
        statusKelayakan = 'Proses Bantara';
        const sisaSKU = Math.max(0, totalBantara - bantaraPassed);
        catatanStatus = `Menuju Bantara (Sisa ${sisaSKU} Butir SKU${!isAttendanceEligible ? ', Kehadiran <75%' : ''})`;
      }
    }

    return {
      student,
      studentPresensiCount,
      totalEvents,
      attendancePercentage,
      isAttendanceEligible,
      bantaraPassed,
      totalBantara,
      bantaraPercentage,
      isBantaraSKUEligible,
      laksanaPassed,
      totalLaksana,
      laksanaPercentage,
      isLaksanaSKUEligible,
      studentSkkCount,
      statusKelayakan,
      catatanStatus
    };
  }, [siswa, events, kehadiran, sku, skuDefs, skkRecords]);

  // Process and record attendance (with instant feedback and rank requirement tallying)
  const handleProcessScanAttendance = (targetStudentId?: string, overrideToken?: string, overrideEventId?: string) => {
    setScanFeedback(null);
    
    // Determine event
    const eventToUse = overrideEventId 
      ? (events.find(e => e.id === overrideEventId) || selectedEvent) 
      : selectedEvent;

    if (!eventToUse) {
      setScanFeedback({ type: 'error', message: 'Tidak ada kegiatan aktif yang dipilih.' });
      return;
    }

    // Find student
    let foundStudent: Siswa | undefined;
    if (targetStudentId) {
      foundStudent = siswa.find(s => s.id === targetStudentId);
    } else {
      const trimmedNis = scanNisInput.trim();
      if (!trimmedNis) {
        setScanFeedback({ type: 'error', message: 'Silakan pilih murid atau masukkan NIS / NIS Murid Anggota / Nama anggota.' });
        return;
      }
      foundStudent = siswa.find(s => 
        s.nis === trimmedNis || 
        (s.nisn && s.nisn === trimmedNis) || 
        (s.nis_murid_anggota && s.nis_murid_anggota === trimmedNis) ||
        s.nama_lengkap.toLowerCase() === trimmedNis.toLowerCase() ||
        s.nama_lengkap.toLowerCase().includes(trimmedNis.toLowerCase())
      );
    }

    if (!foundStudent) {
      setScanFeedback({ type: 'error', message: 'Anggota dengan NIS / NIS Murid Anggota tersebut tidak ditemukan di database ambalan.' });
      return;
    }

    // Verify QR token
    const tokenToCheck = overrideToken || scanTokenInput.trim();
    if (tokenToCheck && tokenToCheck !== eventToUse.qr_token) {
      setScanFeedback({ type: 'error', message: 'Token QR tidak valid untuk kegiatan ini!' });
      return;
    }

    // Check existing attendance on this date
    const alreadyAttended = kehadiran.some(k => k.siswa_id === foundStudent!.id && k.tanggal === eventToUse.tanggal && k.status === 'Hadir');
    if (alreadyAttended) {
      const rek = getStudentKenaikanTingkatData(foundStudent.id);
      setScanFeedback({ 
        type: 'error', 
        message: `${foundStudent.nama_lengkap} SUDAH TERCATAT HADIR pada kegiatan ini sebelumnya.`,
        studentName: foundStudent.nama_lengkap,
        studentClass: foundStudent.kelas,
        bantaraProgress: rek?.bantaraPercentage,
        laksanaProgress: rek?.laksanaPercentage,
        attendanceRate: rek?.attendancePercentage,
        studentId: foundStudent.id
      });
      return;
    }

    // Record attendance
    onRecordAttendance({
      siswa_id: foundStudent.id,
      tanggal: eventToUse.tanggal,
      status: 'Hadir',
      catatan: `Presensi QR Otomatis [${eventToUse.nama_kegiatan}]`
    });

    playBeep();

    // Calculate real-time rank advancement data
    const updatedRekap = getStudentKenaikanTingkatData(foundStudent.id);

    setScanFeedback({
      type: 'success',
      message: `Presensi Berhasil! ${foundStudent.nama_lengkap} (${foundStudent.kelas}) tercatat HADIR & syarat kenaikan tingkat diperbarui.`,
      studentName: foundStudent.nama_lengkap,
      studentClass: foundStudent.kelas,
      bantaraProgress: updatedRekap?.bantaraPercentage,
      laksanaProgress: updatedRekap?.laksanaPercentage,
      attendanceRate: updatedRekap?.attendancePercentage,
      linkedSkuNo: eventToUse.terkait_sku_no,
      studentId: foundStudent.id
    });

    setScanNisInput('');
  };

  // Helper to parse scanned QR text from camera or uploaded image
  const handleScannedRawData = (rawData: string) => {
    if (!rawData) return;

    let detectedToken = '';
    let detectedEventId = '';

    // Check if it's a URL
    if (rawData.includes('?') && (rawData.includes('token=') || rawData.includes('eventId='))) {
      try {
        const urlObj = new URL(rawData);
        detectedToken = urlObj.searchParams.get('token') || '';
        detectedEventId = urlObj.searchParams.get('eventId') || '';
      } catch (e) {
        // Fallback search param parser
        const matchToken = rawData.match(/token=([^&]+)/);
        const matchEvent = rawData.match(/eventId=([^&]+)/);
        if (matchToken) detectedToken = decodeURIComponent(matchToken[1]);
        if (matchEvent) detectedEventId = decodeURIComponent(matchEvent[1]);
      }
    } else {
      // Check if it's JSON
      try {
        const json = JSON.parse(rawData);
        if (json.token) detectedToken = json.token;
        if (json.eventId) detectedEventId = json.eventId;
      } catch (e) {
        // Raw token text
        detectedToken = rawData.trim();
      }
    }

    if (detectedEventId && events.some(e => e.id === detectedEventId)) {
      setActiveEventId(detectedEventId);
    }
    if (detectedToken) {
      setScanTokenInput(detectedToken);
    }

    // Play feedback tone
    playBeep();

    // If active event matched or single student selected, prompt or check-in
    setScanFeedback({
      type: 'success',
      message: `QR Code Terdeteksi! Token Kegiatan: ${detectedToken || 'Valid'}. Silakan pilih atau ketik nama Anda untuk konfirmasi presensi.`
    });
  };

  // --- Real-time Camera Scanner Stream & jsQR Loop ---
  const stopCameraStream = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
    setHasTorch(false);
    setTorchOn(false);
  }, []);

  const startCameraStream = useCallback(async () => {
    stopCameraStream();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Perangkat atau peramban ini tidak mendukung akses kamera HTML5.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      // Check torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        if (capabilities.torch) {
          setHasTorch(true);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);

        // Start jsQR scanning frame loop
        const scanFrame = () => {
          if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
            animationFrameId.current = requestAnimationFrame(scanFrame);
            return;
          }

          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return;

          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert'
            });

            if (qrCode && qrCode.data) {
              handleScannedRawData(qrCode.data);
              // Pause scanning for 2 seconds to avoid rapid repeated triggers
              setTimeout(() => {
                if (mediaStreamRef.current) {
                  animationFrameId.current = requestAnimationFrame(scanFrame);
                }
              }, 2000);
              return;
            }
          } catch (err) {
            console.error('jsQR frame error:', err);
          }

          animationFrameId.current = requestAnimationFrame(scanFrame);
        };

        animationFrameId.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let errMsg = 'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di peramban Anda.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Akses kamera ditolak. Silakan klik ikon gembok di bilah alamat browser Anda dan pilih "Izinkan Kamera".';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'Tidak ditemukan kamera pada perangkat ini.';
      }
      setCameraError(errMsg);
      setIsCameraActive(false);
    }
  }, [facingMode, stopCameraStream]);

  // Toggle Camera Flashlight / Torch
  const handleToggleTorch = async () => {
    if (!mediaStreamRef.current) return;
    const track = mediaStreamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }]
      });
      setTorchOn(nextState);
    } catch (e) {
      console.error('Failed to toggle torch:', e);
    }
  };

  // Switch between front and back camera
  const handleSwitchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Process uploaded QR Code image file from gallery
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data) {
          handleScannedRawData(code.data);
        } else {
          setScanFeedback({
            type: 'error',
            message: 'Tidak ditemukan QR Code yang valid pada gambar tersebut. Pastikan foto QR terlihat jelas.'
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Stop camera when leaving the scan tab
  useEffect(() => {
    if (activeTab !== 'kamera_scan') {
      stopCameraStream();
    }
  }, [activeTab, stopCameraStream]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Copy Direct Link to Clipboard
  const handleCopyLink = () => {
    if (!selectedEvent) return;
    const directScanUrl = `${window.location.origin}${window.location.pathname}?presensi=1&eventId=${selectedEvent.id}&token=${selectedEvent.qr_token}`;
    navigator.clipboard.writeText(directScanUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Download QR Code image with Pramuka badge frame
  const handleDownloadQR = () => {
    if (!qrDataUrl || !selectedEvent) return;
    const link = document.createElement('a');
    link.download = `QR-Presensi-${selectedEvent.nama_kegiatan.replace(/\s+/g, '_')}-${selectedEvent.tanggal}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  // Create new event
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKegiatan.trim()) {
      alert('Nama kegiatan wajib diisi!');
      return;
    }

    const token = `BI-PRAMUKA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newEvt: Omit<KegiatanEvent, 'id'> = {
      nama_kegiatan: namaKegiatan.trim(),
      kategori,
      tanggal,
      jam_mulai: jamMulai,
      jam_selesai: jamSelesai,
      lokasi: lokasi.trim(),
      lat,
      lng,
      radius_meter: radiusMeter,
      qr_token: token,
      is_active: true,
      deskripsi: deskripsi.trim(),
      target_tingkat: targetTingkat,
      terkait_sku_no: terkaitSkuNo !== '' ? Number(terkaitSkuNo) : undefined
    };

    onAddEvent(newEvt);
    setIsNewEventModalOpen(false);
    // Reset form
    setNamaKegiatan('');
    setDeskripsi('');
    setTerkaitSkuNo('');
  };

  const handleToggleEventStatus = (event: KegiatanEvent) => {
    onUpdateEvent({
      ...event,
      is_active: !event.is_active
    });
  };

  // Quick Action: Officially promote student rank to Bantara or Laksana
  const handlePromoteStudent = (student: Siswa, newRank: 'Penegak Bantara' | 'Penegak Laksana') => {
    if (!onUpdateSiswa) return;
    const confirmPromote = confirm(
      `Sahkan Kenaikan Tingkat untuk ${student.nama_lengkap} (${student.kelas}) menjadi ${newRank}? Status pelantikan akan diperbarui secara resmi di database.`
    );
    if (confirmPromote) {
      const today = new Date().toISOString().split('T')[0];
      onUpdateSiswa({
        ...student,
        status_pelantikan: newRank,
        tanggal_pelantikan: today,
        status_siklus: 'Penegak Aktif'
      });
      alert(`Selamat! ${student.nama_lengkap} resmi disahkan sebagai ${newRank}.`);
    }
  };

  // Quick Action: One-click verify linked SKU item for student after attendance
  const handleVerifyLinkedSKU = (studentId: string, skuNo: number, targetTingkatLevel: 'Bantara' | 'Laksana' = 'Bantara') => {
    if (!onVerifySKU) return;
    const today = new Date().toISOString().split('T')[0];
    onVerifySKU({
      siswa_id: studentId,
      no_item_sku: skuNo,
      tanggal_lulus: today,
      status_verifikasi: true,
      tingkat: targetTingkatLevel,
      pembina_verifikator: 'Kak Jihan Fadhilah, S. Kom'
    });
    alert(`Butir SKU No. ${skuNo} (${targetTingkatLevel}) berhasil disahkan lulus untuk anggota ini!`);
    setScanFeedback(prev => prev ? { ...prev, linkedSkuNo: undefined } : null);
  };

  // Present attendees for selected event
  const attendeesList = selectedEvent 
    ? kehadiran.filter(k => k.tanggal === selectedEvent.tanggal && k.status === 'Hadir')
    : [];

  // Filtered students for Rekap Kenaikan Tingkat
  const activeStudents = siswa.filter(s => s.status_aktif);
  const rekapData = activeStudents.map(s => getStudentKenaikanTingkatData(s.id)!).filter(Boolean);

  const filteredRekap = rekapData.filter(item => {
    const matchesKelas = rekapFilterKelas === 'all' || item.student.kelas === rekapFilterKelas;
    const matchesSearch = item.student.nama_lengkap.toLowerCase().includes(rekapSearch.toLowerCase()) || 
                          item.student.nis.includes(rekapSearch);
    
    let matchesStatus = true;
    if (rekapFilterStatus === 'siap_bantara') matchesStatus = item.statusKelayakan === 'Siap Bantara';
    if (rekapFilterStatus === 'siap_laksana') matchesStatus = item.statusKelayakan === 'Siap Laksana';
    if (rekapFilterStatus === 'proses') matchesStatus = item.statusKelayakan.startsWith('Proses');

    return matchesKelas && matchesSearch && matchesStatus;
  });

  const countSiapBantara = rekapData.filter(d => d.statusKelayakan === 'Siap Bantara').length;
  const countSiapLaksana = rekapData.filter(d => d.statusKelayakan === 'Siap Laksana').length;
  const avgAttendance = rekapData.length > 0 
    ? Math.round(rekapData.reduce((acc, curr) => acc + curr.attendancePercentage, 0) / rekapData.length) 
    : 0;

  const uniqueClasses = Array.from(new Set(activeStudents.map(s => s.kelas))).filter(Boolean).sort();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Hidden canvas for jsQR stream decoding */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl flex items-center justify-center shadow-md shadow-indigo-200 shrink-0 mt-0.5">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Presensi & Rekap Otomatis
                </span>
                <span className="text-xs text-gray-400 font-bold">• SKU Bantara & Laksana</span>
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight mt-0.5">
                Absensi QR Code & Pemantau Kenaikan Tingkat
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 max-w-2xl">
                Generator QR Code kegiatan dengan tautan presensi universal, pemindai kamera live responsif, dan rekapitulasi syarat kenaikan tingkat otomatis secara terpadu.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            {!readOnly ? (
              <button
                type="button"
                onClick={() => setIsNewEventModalOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Kegiatan Baru</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl">
                Mode Pengawas: Hanya Lihat
              </span>
            )}
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-gray-100 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('qr_display')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'qr_display'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Generator & Layar QR</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kamera_scan')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'kamera_scan'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Pindai Kamera Live (Scan)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rekap_kenaikan_tingkat')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'rekap_kenaikan_tingkat'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Rekap Syarat Kenaikan Tingkat ({rekapData.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('daftar_kegiatan')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'daftar_kegiatan'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Daftar Kegiatan ({events.length})</span>
          </button>
        </div>
      </div>

      {/* 1. LAYAR QR CODE GENERATOR & PROYEKSI TAB */}
      {activeTab === 'qr_display' && (
        <>
          {selectedEvent ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main QR Card */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs flex flex-col items-center text-center relative overflow-hidden">
                <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${selectedEvent.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></span>
                      <span className="text-xs font-black uppercase tracking-wider text-gray-500">
                        {selectedEvent.is_active ? 'SESI PRESENSI AKTIF & SIAP PINDAI' : 'SESI KEGIATAN SELESAI / NON-AKTIF'}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mt-1">{selectedEvent.nama_kegiatan}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {selectedEvent.kategori}
                      </span>
                      {selectedEvent.terkait_sku_no && (
                        <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Terkait SKU #{selectedEvent.terkait_sku_no} ({selectedEvent.target_tingkat || 'Bantara'})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsProjectorMode(true)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                      title="Buka tampilan layar penuh untuk proyektor"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Layar Penuh</span>
                    </button>

                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleToggleEventStatus(selectedEvent)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          selectedEvent.is_active 
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' 
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {selectedEvent.is_active ? 'Tutup Sesi' : 'Aktifkan Sesi'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Big QR Code Frame with Animated Scanner Corner Accents */}
                <div className="my-6 relative p-5 bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-3xl border-2 border-indigo-100/80 shadow-inner flex flex-col items-center group">
                  {/* Decorative Reticle Corners */}
                  <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-indigo-600 rounded-tl-xl"></div>
                  <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-indigo-600 rounded-tr-xl"></div>
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-indigo-600 rounded-bl-xl"></div>
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-indigo-600 rounded-br-xl"></div>

                  {qrDataUrl ? (
                    <div className="relative">
                      <img 
                        src={qrDataUrl} 
                        alt="QR Code Presensi Pramuka" 
                        className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-2xl bg-white p-3 shadow-md"
                      />
                      {/* Center Scout Logo watermark */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 bg-white rounded-full p-1 shadow-md border border-gray-100 flex items-center justify-center opacity-90">
                          <Compass className="w-7 h-7 text-indigo-700" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center text-gray-400 text-xs font-bold">
                      Membuat QR Code...
                    </div>
                  )}

                  <p className="text-[11px] font-bold text-gray-500 mt-3 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Dapat dipindai langsung menggunakan kamera smartphone apa saja</span>
                  </p>
                </div>

                {/* Public Student Attendance Banner (Free of Login) */}
                <div className="w-full mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-950">Akses Mandiri Murid (Bebas Login)</h4>
                      <p className="text-[11px] text-amber-800 font-medium">
                        Anggota Penegak cukup scan QR atau buka tautan tanpa perlu memiliki akun login.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenPublicPortal) {
                        onOpenPublicPortal(selectedEvent.id);
                      } else {
                        window.open(`?presensi=1&eventId=${selectedEvent.id}&token=${selectedEvent.qr_token}`, '_blank');
                      }
                    }}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black rounded-xl text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Tampilan Murid</span>
                  </button>
                </div>

                {/* Quick Share & Direct Link Bar */}
                <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
                  <div className="bg-indigo-50/90 px-4 py-2 rounded-2xl border border-indigo-200 flex items-center space-x-2 text-xs">
                    <span className="text-indigo-700 font-bold">Token Manual:</span>
                    <span className="font-mono font-black text-indigo-950 text-sm tracking-wider">
                      {selectedEvent.qr_token}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-800 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    {copiedLink ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                    <span>{copiedLink ? 'Tautan Tersalin!' : 'Salin Tautan Presensi'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh PNG</span>
                  </button>
                </div>

                {/* Event Metadata Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full mt-6 text-left">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center space-x-1.5 text-gray-400 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Tanggal</span>
                    </div>
                    <span className="font-extrabold text-xs text-gray-800 mt-1 block">{selectedEvent.tanggal}</span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center space-x-1.5 text-gray-400 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Waktu</span>
                    </div>
                    <span className="font-extrabold text-xs text-gray-800 mt-1 block">
                      {selectedEvent.jam_mulai} - {selectedEvent.jam_selesai} WIB
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 col-span-2 sm:col-span-1">
                    <div className="flex items-center space-x-1.5 text-gray-400 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>Radius Lokasi</span>
                    </div>
                    <span className="font-extrabold text-xs text-gray-800 mt-1 block truncate" title={selectedEvent.lokasi}>
                      {selectedEvent.radius_meter || 150}m ({selectedEvent.lokasi})
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Attendees on this Event */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-black text-sm text-gray-800">Personil Hadir</h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                      {attendeesList.length} Hadir
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Daftar anggota yang berhasil check-in QR Code pada kegiatan ini.
                  </p>

                  <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-1">
                    {attendeesList.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 text-xs font-bold bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        Belum ada anggota yang melakukan scan presensi.
                      </div>
                    ) : (
                      attendeesList.map((log) => {
                        const student = siswa.find(s => s.id === log.siswa_id);
                        return (
                          <div key={log.id} className="p-3 bg-gray-50 hover:bg-indigo-50/50 rounded-2xl border border-gray-100 transition flex items-center justify-between">
                            <div>
                              <p className="font-black text-xs text-gray-900">{student?.nama_lengkap || 'Anggota'}</p>
                              <p className="text-[10px] text-gray-500 font-semibold">{student?.kelas} • NIS {student?.nis}</p>
                            </div>
                            <span className="inline-flex items-center text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Check className="w-2.5 h-2.5 mr-1" />
                              Hadir
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('kamera_scan')}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold rounded-2xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Buka Kamera Pemindai (Scan)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('rekap_kenaikan_tingkat')}
                    className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-2xl transition flex items-center justify-center space-x-2 cursor-pointer border border-amber-200"
                  >
                    <Award className="w-4 h-4 text-amber-700" />
                    <span>Lihat Rekap Syarat Kenaikan Tingkat</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs">
              <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-black text-base text-gray-800">Belum Ada Kegiatan Dipilih</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Silakan buat kegiatan baru atau pilih salah satu kegiatan dari daftar kegiatan ambalan.
              </p>
              <button
                type="button"
                onClick={() => setIsNewEventModalOpen(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Buat Kegiatan Pertama
              </button>
            </div>
          )}
        </>
      )}

      {/* 2. REAL-TIME CAMERA SCANNER & TERMINAL PRESENSI TAB */}
      {activeTab === 'kamera_scan' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-black text-gray-900">Pemindai Kamera Live & Terminal Presensi</h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Arahkan kamera ke QR Code kegiatan di proyektor atau papan pengumuman.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                  Kegiatan: <strong className="text-indigo-900">{selectedEvent?.nama_kegiatan || 'Pilih Kegiatan'}</strong>
                </span>
              </div>
            </div>

            {/* Scan Feedback Banner with Instant Rank Advancement Progress */}
            {scanFeedback && (
              <div className={`mt-4 p-4 rounded-2xl text-xs font-bold border animate-scale-in ${
                scanFeedback.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}>
                <div className="flex items-start space-x-3">
                  {scanFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-extrabold text-sm">{scanFeedback.message}</p>
                    
                    {scanFeedback.studentName && (
                      <div className="mt-2.5 p-3 bg-white/80 rounded-xl border border-emerald-200/80 space-y-1.5 text-gray-800">
                        <div className="flex items-center justify-between text-[11px] font-black">
                          <span>Rekap Syarat Kenaikan Tingkat ({scanFeedback.studentName}):</span>
                          <span className="text-indigo-700">Kehadiran: {scanFeedback.attendanceRate}%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="bg-indigo-50 p-2 rounded-lg">
                            <span className="text-gray-500 block">SKU Bantara:</span>
                            <span className="font-black text-indigo-900">{scanFeedback.bantaraProgress}% Selesai</span>
                          </div>
                          <div className="bg-purple-50 p-2 rounded-lg">
                            <span className="text-gray-500 block">SKU Laksana:</span>
                            <span className="font-black text-purple-900">{scanFeedback.laksanaProgress}% Selesai</span>
                          </div>
                        </div>

                        {/* One-click verify linked SKU item if event provides one */}
                        {scanFeedback.linkedSkuNo && scanFeedback.studentId && onVerifySKU && !readOnly && (
                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-[10px] text-gray-600">Kegiatan ini menautkan Butir SKU #{scanFeedback.linkedSkuNo}:</span>
                            <button
                              type="button"
                              onClick={() => handleVerifyLinkedSKU(scanFeedback.studentId!, scanFeedback.linkedSkuNo!)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black transition cursor-pointer"
                            >
                              Sahkan Butir SKU Ini
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* LIVE CAMERA VIEWFINDER HUD */}
            <div className="mt-6">
              <div className="relative bg-black rounded-3xl overflow-hidden shadow-xl aspect-video max-h-80 sm:max-h-96 flex items-center justify-center">
                {isCameraActive ? (
                  <>
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-cover" 
                      playsInline 
                      muted 
                    />

                    {/* Reticle / Viewfinder Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-56 h-56 border-2 border-dashed border-indigo-400 rounded-3xl relative animate-pulse">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl"></div>

                        {/* Animated Laser Scanning Line */}
                        <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent top-1/2 -translate-y-1/2 animate-bounce"></div>
                      </div>
                    </div>

                    {/* Camera Control Overlay Buttons */}
                    <div className="absolute top-3 right-3 flex items-center space-x-2">
                      {hasTorch && (
                        <button
                          type="button"
                          onClick={handleToggleTorch}
                          className={`p-2 rounded-xl text-white backdrop-blur-md transition cursor-pointer ${
                            torchOn ? 'bg-amber-500' : 'bg-black/50 hover:bg-black/70'
                          }`}
                          title="Nyalakan Lampu Senter"
                        >
                          {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleSwitchCamera}
                        className="p-2 bg-black/50 hover:bg-black/70 rounded-xl text-white backdrop-blur-md transition cursor-pointer"
                        title="Ganti Kamera Depan / Belakang"
                      >
                        <SwitchCamera className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={stopCameraStream}
                        className="p-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-white transition cursor-pointer"
                        title="Matikan Kamera"
                      >
                        <CameraOff className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] text-white font-bold flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Mendeteksi QR Code Otomatis...</span>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-white space-y-4">
                    <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto border border-white/20">
                      <Camera className="w-8 h-8 text-indigo-300" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Kamera Belum Aktif</h4>
                      <p className="text-xs text-gray-300 mt-1 max-w-sm mx-auto">
                        Klik tombol di bawah untuk menyalakan kamera smartphone / laptop dan memindai QR Code.
                      </p>
                    </div>

                    {cameraError && (
                      <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-2xl max-w-md mx-auto text-left flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                        <span>{cameraError}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={startCameraStream}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/30 transition active:scale-95 flex items-center space-x-2 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Aktifkan Kamera Pemindai</span>
                      </button>

                      {/* File upload fallback */}
                      <label className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer border border-white/20">
                        <Upload className="w-4 h-4" />
                        <span>Upload Foto QR Galeri</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileUpload} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FAST CHECK-IN FORM & MANUAL CONTROLS */}
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-800">
                  Konfirmasi Identitas Anggota yang Hadir:
                </span>
                <span className="text-[11px] text-gray-400 font-bold">
                  {siswa.filter(s => s.status_aktif).length} Anggota Terdaftar
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Cari Berdasarkan NIS, NIS Murid Anggota, atau Nama:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ketik NIS atau nama anggota..."
                      value={scanNisInput}
                      onChange={(e) => setScanNisInput(e.target.value)}
                      className="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Token QR Kegiatan (Otomatis dari Pindaian / Manual):
                  </label>
                  <input
                    type="text"
                    placeholder={selectedEvent?.qr_token || 'Masukkan token...'}
                    value={scanTokenInput}
                    onChange={(e) => setScanTokenInput(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>
              </div>

              {/* Geo Location Check */}
              <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs">
                  <Navigation className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="font-bold text-gray-800 block">Validasi Radius Lapangan (Geo-Fencing)</span>
                    <span className="text-[11px] text-gray-500">
                      {userCurrentCoord ? 'Koordinat GPS Anda Terverifikasi di Lokasi' : 'Deteksi posisi koordinat smartphone/laptop'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-[11px] font-bold transition cursor-pointer"
                >
                  {geoLocating ? 'Mendeteksi...' : 'Cek Lokasi GPS'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleProcessScanAttendance()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-black rounded-2xl shadow-md shadow-indigo-100 transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Presensi & Rekap Kenaikan Tingkat</span>
              </button>

              {/* Quick Click from Member List */}
              <div className="pt-3 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-500 block mb-2">
                  Atau Pilih Cepat Anggota untuk Check-in:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {siswa
                    .filter(s => s.status_aktif)
                    .filter(s => !scanNisInput || s.nama_lengkap.toLowerCase().includes(scanNisInput.toLowerCase()) || s.nis.includes(scanNisInput))
                    .map(s => {
                      const isPresent = kehadiran.some(k => k.siswa_id === s.id && k.tanggal === selectedEvent?.tanggal && k.status === 'Hadir');
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleProcessScanAttendance(s.id)}
                          className={`p-2 rounded-xl text-left text-xs font-bold transition flex items-center justify-between border cursor-pointer ${
                            isPresent
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-gray-50 hover:bg-indigo-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          <span className="truncate">{s.nama_lengkap}</span>
                          {isPresent ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. REKAP SYARAT KENAIKAN TINGKAT TAB */}
      {activeTab === 'rekap_kenaikan_tingkat' && (
        <div className="space-y-6">
          {/* Overview Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
              <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Total Anggota Aktif</span>
              <p className="text-2xl font-black text-gray-900 mt-1">{activeStudents.length}</p>
              <span className="text-[10px] text-gray-500 font-semibold mt-0.5 block">Penegak Ambalan</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-600 block tracking-wider">Siap Bantara</span>
                <Award className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-700 mt-1">{countSiapBantara}</p>
              <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">Memenuhi Syarat 100%</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-purple-600 block tracking-wider">Siap Laksana</span>
                <Award className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-black text-purple-700 mt-1">{countSiapLaksana}</p>
              <span className="text-[10px] text-purple-600 font-bold mt-0.5 block">Memenuhi Syarat 100%</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
              <span className="text-[10px] font-black uppercase text-indigo-600 block tracking-wider">Rata-rata Presensi</span>
              <p className="text-2xl font-black text-indigo-900 mt-1">{avgAttendance}%</p>
              <span className="text-[10px] text-indigo-500 font-semibold mt-0.5 block">Target Minimal 75%</span>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center space-x-1.5 bg-gray-50 px-3 py-1.5 rounded-2xl border border-gray-200 text-xs">
                <Filter className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-500 font-bold">Kelas:</span>
                <select
                  value={rekapFilterKelas}
                  onChange={(e) => setRekapFilterKelas(e.target.value)}
                  className="bg-transparent font-black text-gray-800 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Kelas</option>
                  {uniqueClasses.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1.5 bg-gray-50 px-3 py-1.5 rounded-2xl border border-gray-200 text-xs">
                <Award className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-500 font-bold">Kelayakan:</span>
                <select
                  value={rekapFilterStatus}
                  onChange={(e) => setRekapFilterStatus(e.target.value as any)}
                  className="bg-transparent font-black text-gray-800 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="siap_bantara">Siap Bantara</option>
                  <option value="siap_laksana">Siap Laksana</option>
                  <option value="proses">Dalam Proses</option>
                </select>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Cari nama atau NIS..."
                value={rekapSearch}
                onChange={(e) => setRekapSearch(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Table of Rank Advancement Status */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-gray-900">Tabel Rekapitulasi Syarat Kenaikan Tingkat</h3>
                <p className="text-[11px] text-gray-500">
                  Data kehadiran terintegrasi otomatis dengan progres SKU Bantara dan Laksana.
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Cetak PDF</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-black border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3.5">Nama Anggota</th>
                    <th className="px-4 py-3.5">Kelas & NIS</th>
                    <th className="px-4 py-3.5">Kehadiran (Presensi)</th>
                    <th className="px-4 py-3.5">SKU Bantara (23)</th>
                    <th className="px-4 py-3.5">SKU Laksana (22)</th>
                    <th className="px-4 py-3.5">Status Kelayakan</th>
                    <th className="px-4 py-3.5 text-right">Aksi Pelantikan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRekap.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400 font-bold">
                        Tidak ada data anggota yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredRekap.map((item) => (
                      <tr key={item.student.id} className="hover:bg-gray-50/70 transition">
                        <td className="px-4 py-3.5">
                          <p className="font-black text-gray-900">{item.student.nama_lengkap}</p>
                          <span className="text-[10px] text-gray-400 font-semibold">
                            {item.student.status_pelantikan || 'Calon Penegak'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-gray-600">
                          {item.student.kelas} • NIS {item.student.nis}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-2">
                            <span className={`font-black text-xs ${item.isAttendanceEligible ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {item.studentPresensiCount}/{item.totalEvents} ({item.attendancePercentage}%)
                            </span>
                            {item.isAttendanceEligible ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {item.isAttendanceEligible ? 'Syarat Kehadiran Terpenuhi' : 'Kurang Pertemuan Latihan'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="w-32">
                            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                              <span>{item.bantaraPassed}/{item.totalBantara} Butir</span>
                              <span className="font-mono">{item.bantaraPercentage}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full transition-all" 
                                style={{ width: `${item.bantaraPercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="w-32">
                            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                              <span>{item.laksanaPassed}/{item.totalLaksana} Butir</span>
                              <span className="font-mono">{item.laksanaPercentage}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 rounded-full transition-all" 
                                style={{ width: `${item.laksanaPercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {item.statusKelayakan === 'Siap Bantara' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200">
                              <Award className="w-3 h-3 mr-1 text-emerald-700" />
                              SIAP DILANTIK BANTARA
                            </span>
                          )}
                          {item.statusKelayakan === 'Siap Laksana' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-200">
                              <Award className="w-3 h-3 mr-1 text-purple-700" />
                              SIAP DILANTIK LAKSANA
                            </span>
                          )}
                          {item.statusKelayakan.startsWith('Proses') && (
                            <div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                Proses Pemenuhan
                              </span>
                              <p className="text-[10px] text-gray-500 mt-0.5">{item.catatanStatus}</p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {!readOnly && onUpdateSiswa ? (
                            <>
                              {item.statusKelayakan === 'Siap Bantara' && item.student.status_pelantikan !== 'Penegak Bantara' && (
                                <button
                                  type="button"
                                  onClick={() => handlePromoteStudent(item.student, 'Penegak Bantara')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] transition cursor-pointer shadow-xs"
                                >
                                  Sahkan Bantara
                                </button>
                              )}
                              {item.statusKelayakan === 'Siap Laksana' && item.student.status_pelantikan !== 'Penegak Laksana' && (
                                <button
                                  type="button"
                                  onClick={() => handlePromoteStudent(item.student, 'Penegak Laksana')}
                                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-[10px] transition cursor-pointer shadow-xs"
                                >
                                  Sahkan Laksana
                                </button>
                              )}
                              {item.statusKelayakan.startsWith('Proses') && (
                                <span className="text-[10px] text-gray-400 font-bold">
                                  Belum Memenuhi
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold">Lihat Saja</span>
                          )}
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

      {/* 4. DAFTAR KEGIATAN TAB */}
      {activeTab === 'daftar_kegiatan' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-base text-gray-900">
                Daftar Kegiatan & Kalender Absensi Ambalan
              </h3>
              <p className="text-xs text-gray-500">
                Pilih kegiatan untuk memuat QR Code atau mengedit detail kehadiran.
              </p>
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={() => setIsNewEventModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kegiatan</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-black border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Nama Kegiatan</th>
                  <th className="px-4 py-3.5">Kategori</th>
                  <th className="px-4 py-3.5">Tautan SKU</th>
                  <th className="px-4 py-3.5">Tanggal & Jam</th>
                  <th className="px-4 py-3.5">Lokasi</th>
                  <th className="px-4 py-3.5">Token QR</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        evt.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${evt.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                        {evt.is_active ? 'Aktif' : 'Selesai'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-black text-gray-900">{evt.nama_kegiatan}</td>
                    <td className="px-4 py-3.5 font-semibold text-gray-600">{evt.kategori}</td>
                    <td className="px-4 py-3.5">
                      {evt.terkait_sku_no ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
                          SKU #{evt.terkait_sku_no}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">
                      {evt.tanggal} ({evt.jam_mulai} - {evt.jam_selesai})
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 truncate max-w-xs">{evt.lokasi}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-indigo-700">{evt.qr_token}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveEventId(evt.id);
                          setActiveTab('qr_display');
                        }}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-[11px] transition cursor-pointer"
                      >
                        Tampilkan QR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FULLSCREEN PROJECTOR DISPLAY MODAL */}
      {isProjectorMode && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-indigo-950 text-white flex flex-col justify-between p-8 sm:p-12 animate-fade-in">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-indigo-900 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center p-1 border border-white/10">
                <Compass className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-indigo-300">SMK Bakti Idhata Jakarta</span>
                <h2 className="text-lg font-black uppercase text-white">Presensi Digital Ambalan Penegak</h2>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-xs font-bold text-indigo-300 block">Waktu Sesi Presensi:</span>
                <span className="text-xl font-mono font-black text-amber-400">{currentTimeStr} WIB</span>
              </div>
              <button
                type="button"
                onClick={() => setIsProjectorMode(false)}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition cursor-pointer"
                title="Keluar Layar Penuh"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Showcase */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 my-auto">
            <div className="bg-white p-6 rounded-3xl shadow-2xl shadow-indigo-900/50 flex flex-col items-center">
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  alt="QR Code Proyektor" 
                  className="w-80 h-80 sm:w-96 sm:h-96 object-contain rounded-2xl"
                />
              )}
              <div className="mt-4 text-center">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-950 block">
                  Arahkan Kamera HP Anda ke QR Code Ini
                </span>
                <p className="text-[11px] text-amber-900 font-bold mt-1 bg-amber-100 px-3 py-1 rounded-full inline-block border border-amber-300">
                  ⚡ Tanpa Perlu Login • Anggota Cukup Scan & Pilih Nama
                </p>
              </div>
            </div>

            <div className="max-w-md space-y-5 text-left">
              <div>
                <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black rounded-full uppercase tracking-wider">
                  {selectedEvent.kategori}
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-white mt-2 leading-tight">
                  {selectedEvent.nama_kegiatan}
                </h1>
                <p className="text-indigo-200 text-sm mt-2">{selectedEvent.deskripsi || 'Silakan melakukan absensi kehadiran sebelum waktu kegiatan ditutup.'}</p>
              </div>

              <div className="p-4 bg-indigo-900/60 rounded-2xl border border-indigo-800 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>{selectedEvent.tanggal} • {selectedEvent.jam_mulai} - {selectedEvent.jam_selesai} WIB</span>
                </div>
                <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>{selectedEvent.lokasi}</span>
                </div>
              </div>

              <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                <span className="text-xs text-indigo-200 block font-bold">Kode Token Cadangan:</span>
                <span className="text-2xl font-mono font-black text-white tracking-widest block mt-0.5">
                  {selectedEvent.qr_token}
                </span>
              </div>

              <div className="flex items-center space-x-3 text-sm">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
                <span className="text-emerald-300 font-bold">
                  {attendeesList.length} Anggota Telah Berhasil Hadir
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-indigo-900 pt-4 flex items-center justify-between text-xs text-indigo-400">
            <span>Sistem Presensi QR Terpadu • Gerakan Pramuka Gugus Depan Jakarta Selatan</span>
            <span>Tekan ESC atau tombol kanan atas untuk menutup layar penuh</span>
          </div>
        </div>
      )}

      {/* CREATE NEW EVENT MODAL */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-sm text-gray-800">Buat Kegiatan Baru & Tautkan SKU</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewEventModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-black text-gray-700 mb-1">Nama Kegiatan</label>
                <input
                  type="text"
                  placeholder="misal: Latihan Rutin Pionering & Tali Temali"
                  value={namaKegiatan}
                  onChange={(e) => setNamaKegiatan(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-gray-700 mb-1">Kategori Kegiatan</label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Latihan Rutin">Latihan Rutin</option>
                    <option value="Perkemahan">Perkemahan</option>
                    <option value="Giat Prestasi">Giat Prestasi</option>
                    <option value="Bakti Sosial">Bakti Sosial</option>
                    <option value="Apel & Upacara">Apel & Upacara</option>
                  </select>
                </div>
                <div>
                  <label className="block font-black text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Linkage to SKU / Rank Advancement */}
              <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
                <span className="text-[11px] font-black text-amber-900 block">
                  Tautkan dengan Syarat Kenaikan Tingkat (SKU):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Target Tingkat</label>
                    <select
                      value={targetTingkat}
                      onChange={(e) => setTargetTingkat(e.target.value as any)}
                      className="w-full bg-white border border-amber-200 rounded-xl px-2 py-1.5 text-xs font-bold text-gray-800"
                    >
                      <option value="Semua Tingkat">Semua Tingkat</option>
                      <option value="Bantara">Penegak Bantara</option>
                      <option value="Laksana">Penegak Laksana</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Nomor Butir SKU (Opsional)</label>
                    <input
                      type="number"
                      min={1}
                      max={23}
                      placeholder="misal: 14 atau 20"
                      value={terkaitSkuNo}
                      onChange={(e) => setTerkaitSkuNo(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-full bg-white border border-amber-200 rounded-xl px-2 py-1.5 text-xs font-bold text-gray-800"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-gray-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={jamMulai}
                    onChange={(e) => setJamMulai(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-black text-gray-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={jamSelesai}
                    onChange={(e) => setJamSelesai(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Lokasi Kegiatan</label>
                <input
                  type="text"
                  placeholder="misal: Lapangan Utama SMK Bakti Idhata"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-black text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-gray-800"
                  />
                </div>
                <div>
                  <label className="block font-black text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-gray-800"
                  />
                </div>
                <div>
                  <label className="block font-black text-gray-700 mb-1">Radius (m)</label>
                  <input
                    type="number"
                    value={radiusMeter}
                    onChange={(e) => setRadiusMeter(parseInt(e.target.value) || 150)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-gray-800"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Isi Otomatis Posisi GPS Saya Sekarang</span>
                </button>
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Deskripsi Singkat (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Uraian materi, seragam pramuka, perlengkapan yang wajib dibawa..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-md shadow-indigo-100 transition active:scale-95 cursor-pointer flex items-center space-x-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Generate QR Code & Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
