import { useState, useEffect } from 'react';
import { 
  Siswa, 
  Kehadiran, 
  Materi, 
  SKU, 
  Tabungan, 
  Kedisiplinan, 
  Jurnal, 
  StatusKehadiran, 
  SKUItemDef, 
  Kelas,
  SKKDef,
  SKKRecord,
  KegiatanEvent,
  BarangInventaris,
  PeminjamanLogistik,
  ModulMateri,
  SilabusLatihan,
  TransaksiKas,
  PeriodeDewanAmbalan,
  TingkatSKK,
  UserProfile,
  OFFICIAL_ACCOUNTS,
  PengawasAccount,
  DEFAULT_PENGAWAS_ACCOUNTS,
  SyncStatus
} from './types';
import {
  initialSiswa,
  initialKehadiran,
  initialMateri,
  initialSKU,
  initialTabungan,
  initialKedisiplinan,
  initialJurnal,
  initialSKUDefs,
  initialSKKDefs,
  initialSKKRecords,
  initialKegiatanEvents,
  initialBarangInventaris,
  initialPeminjamanLogistik,
  initialModulMateri,
  initialSilabusLatihan,
  initialTransaksiKas,
  initialDewanAmbalan
} from './data/seedData';
import {
  COLLECTIONS,
  subscribeCollection,
  subscribeDoc,
  getFirestoreDoc,
  setFirestoreDoc,
  deleteFirestoreDoc,
  saveAllToFirestore,
  syncAllDeletedTrackersWithFirestore,
  db
} from './utils/firestoreService';
import { collection, getDocs } from 'firebase/firestore';
import {
  markIdAsDeleted,
  unmarkIdAsDeleted,
  filterNonDeleted,
  verifyAndFilterSnapshot,
  clearDeletedIds
} from './utils/deletionTracker';
import { DataSyncManager } from './utils/DataSyncManager';
import { initAuth, saveAuthSession, getAuthSession, clearAuthSession, logout, resolveUserRole } from './utils/firebaseAuth';

// Component imports
import { DashboardOverview } from './components/DashboardOverview';
import { SiswaCRUD } from './components/SiswaCRUD';
import { KehadiranManager } from './components/KehadiranManager';
import { MateriCRUD } from './components/MateriCRUD';
import { SKUManager } from './components/SKUManager';
import { TabunganManager } from './components/TabunganManager';
import { KedisiplinanManager } from './components/KedisiplinanManager';
import { JurnalPembina } from './components/JurnalPembina';
import { CodeViewer } from './components/CodeViewer';
import { GoogleDriveBackup } from './components/GoogleDriveBackup';
import { KelasManager } from './components/KelasManager';
import { NilaiManager } from './components/NilaiManager';
import { GlobalSearchBar } from './components/GlobalSearchBar';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { LoginPage } from './components/LoginPage';
import { PengawasAccountManager } from './components/PengawasAccountManager';

// New Advanced Modules
import { SKKManager } from './components/SKKManager';
import { AbsensiQRManager } from './components/AbsensiQRManager';
import { InventarisLogistikManager } from './components/InventarisLogistikManager';
import { ELibraryMateriManager } from './components/ELibraryMateriManager';
import { KeuanganKasManager } from './components/KeuanganKasManager';
import { DewanAmbalanManager } from './components/DewanAmbalanManager';
import { PublicPresensiQRPage } from './components/PublicPresensiQRPage';

// @ts-ignore
import logoImage from './assets/images/logo_pramuka_bakti_idhata_1787038251534.jpg';

import {
  LayoutDashboard,
  Users,
  CheckSquare,
  BookOpen,
  Award,
  Landmark,
  ShieldAlert,
  FileText,
  Code2,
  RefreshCcw,
  Menu,
  X,
  Compass,
  Cloud,
  CloudUpload,
  HardDriveDownload,
  GraduationCap,
  Percent,
  Database,
  QrCode,
  Package,
  Library,
  DollarSign,
  Users2,
  Sparkles,
  ChevronDown,
  Eye,
  Check,
  ShieldCheck,
  UserCheck,
  LogOut,
  KeyRound
} from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const session = getAuthSession();
    return Boolean(session && session.userId && session.email);
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(DataSyncManager.getStatus());

  // Listen to DataSyncManager status
  useEffect(() => {
    DataSyncManager.init();
    const unsub = DataSyncManager.subscribeStatus(setSyncStatus);
    return () => unsub();
  }, []);

  const [tahunAjaranList, setTahunAjaranList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pramuka_tahun_ajaran');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return ['TA. 2024-2025', 'TA. 2025-2026', 'TA. 2026-2027', '2026-2027'];
  });

  const handleSyncTahunAjaranList = (newList: string[]) => {
    setTahunAjaranList(newList);
    try {
      localStorage.setItem('pramuka_tahun_ajaran', JSON.stringify(newList));
    } catch (e) {}
    DataSyncManager.persistDoc(COLLECTIONS.SETTINGS, 'tahun_ajaran', { list: newList, updated_at: new Date().toISOString() });
    setFirestoreDoc(COLLECTIONS.SETTINGS, 'tahun_ajaran', { list: newList, updated_at: new Date().toISOString() }).catch(() => {});
  };

  const [pengawasAccounts, setPengawasAccounts] = useState<PengawasAccount[]>(() => {
    try {
      const saved = localStorage.getItem('pramuka_pengawas_accounts');
      if (saved) return filterNonDeleted(COLLECTIONS.PENGAWAS_ACCOUNTS, JSON.parse(saved));
    } catch (e) {
      console.warn(e);
    }
    return filterNonDeleted(COLLECTIONS.PENGAWAS_ACCOUNTS, DEFAULT_PENGAWAS_ACCOUNTS);
  });

  // Subscribe to real-time Pengawas accounts from Firestore
  useEffect(() => {
    const unsub = subscribeCollection<PengawasAccount>(
      COLLECTIONS.PENGAWAS_ACCOUNTS,
      (data) => {
        const nonDeletedData = filterNonDeleted(COLLECTIONS.PENGAWAS_ACCOUNTS, data || []);
        const nonDeletedDefaults = filterNonDeleted(COLLECTIONS.PENGAWAS_ACCOUNTS, DEFAULT_PENGAWAS_ACCOUNTS);
        const merged = [...nonDeletedDefaults];
        nonDeletedData.forEach((d) => {
          const idx = merged.findIndex(
            (m) => m.email.toLowerCase() === d.email.toLowerCase() || m.id === d.id
          );
          if (idx >= 0) {
            merged[idx] = d;
          } else {
            merged.push(d);
          }
        });
        const finalAccounts = filterNonDeleted(COLLECTIONS.PENGAWAS_ACCOUNTS, merged);
        setPengawasAccounts(finalAccounts);
        localStorage.setItem('pramuka_pengawas_accounts', JSON.stringify(finalAccounts));
      }
    );
    return () => unsub();
  }, []);

  const handleAddPengawas = (newAcc: PengawasAccount) => {
    unmarkIdAsDeleted(COLLECTIONS.PENGAWAS_ACCOUNTS, newAcc.id);
    setPengawasAccounts((prev) => {
      const filtered = prev.filter(
        (p) => p.id !== newAcc.id && p.email.toLowerCase() !== newAcc.email.toLowerCase()
      );
      const next = [...filtered, newAcc];
      localStorage.setItem('pramuka_pengawas_accounts', JSON.stringify(next));
      return next;
    });
    DataSyncManager.persistDoc(COLLECTIONS.PENGAWAS_ACCOUNTS, newAcc.id, newAcc);
    setFirestoreDoc(COLLECTIONS.PENGAWAS_ACCOUNTS, newAcc.id, newAcc);
  };

  const handleUpdatePengawas = (updatedAcc: PengawasAccount) => {
    unmarkIdAsDeleted(COLLECTIONS.PENGAWAS_ACCOUNTS, updatedAcc.id);
    setPengawasAccounts((prev) => {
      const next = prev.map((p) => (p.id === updatedAcc.id ? updatedAcc : p));
      localStorage.setItem('pramuka_pengawas_accounts', JSON.stringify(next));
      return next;
    });
    DataSyncManager.persistDoc(COLLECTIONS.PENGAWAS_ACCOUNTS, updatedAcc.id, updatedAcc);
    setFirestoreDoc(COLLECTIONS.PENGAWAS_ACCOUNTS, updatedAcc.id, updatedAcc);

    // If currentUser is being updated, update session currentUser
    if (currentUser && (currentUser.id === updatedAcc.id || currentUser.email.toLowerCase() === updatedAcc.email.toLowerCase())) {
      const isAccountAdmin = updatedAcc.role === 'admin';
      const initials = updatedAcc.nama
        .split(' ')
        .filter((w) => !['bapak', 'ibu', 'kak', 's.', 'm.', 'pd', 'kom', 'dr.'].includes(w.toLowerCase().replace('.', '')))
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase() || (isAccountAdmin ? 'AD' : 'PA');

      setCurrentUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          nama: updatedAcc.nama,
          email: updatedAcc.email,
          username: updatedAcc.username || prev.username,
          jabatan: updatedAcc.jabatan,
          role: isAccountAdmin ? 'admin' : 'viewer',
          inisial: initials,
          keteranganAkses: isAccountAdmin
            ? 'Akses Admin Penuh (Dapat mengedit semua fitur dan mengelola seluruh data)'
            : `Akses Pengawas (${updatedAcc.jabatan}) - Hanya Lihat`,
          avatarColor: isAccountAdmin ? 'bg-indigo-600 text-white' : 'bg-amber-600 text-white'
        };
      });
    }
  };

  const handleDeletePengawas = (id: string) => {
    markIdAsDeleted(COLLECTIONS.PENGAWAS_ACCOUNTS, id);
    setPengawasAccounts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      localStorage.setItem('pramuka_pengawas_accounts', JSON.stringify(next));
      return next;
    });
    deleteFirestoreDoc(COLLECTIONS.PENGAWAS_ACCOUNTS, id);
    DataSyncManager.persistDelete(COLLECTIONS.PENGAWAS_ACCOUNTS, id);
  };

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const session = getAuthSession();
    if (!session || !session.userId || !session.email) {
      return null;
    }

    const email = session.email.toLowerCase().trim();

    // Check pre-registered official accounts
    const foundOfficial = OFFICIAL_ACCOUNTS.find(
      (a) => a.id === session.userId || a.email.toLowerCase() === email || (email === 'jihanminho8@gmail.com' && a.id === 'acc_pembina')
    );
    if (foundOfficial) return foundOfficial;

    // Check registered custom pengawas
    try {
      const savedPengawas: PengawasAccount[] = JSON.parse(
        localStorage.getItem('pramuka_pengawas_accounts') || '[]'
      );
      const match = savedPengawas.find(
        (p) => p.id === session.userId || p.email.toLowerCase() === email
      );
      if (match) {
        const isAccountAdmin = match.role === 'admin';
        const initials = match.nama
          .split(' ')
          .filter((w) => !['bapak', 'ibu', 'kak', 's.', 'm.', 'pd', 'kom', 'dr.'].includes(w.toLowerCase().replace('.', '')))
          .slice(0, 2)
          .map((w) => w[0])
          .join('')
          .toUpperCase() || (isAccountAdmin ? 'AD' : 'PA');
        return {
          id: match.id,
          username: match.username || match.email.split('@')[0],
          nama: match.nama,
          email: match.email,
          jabatan: match.jabatan,
          role: isAccountAdmin ? 'admin' : 'viewer',
          inisial: initials,
          keteranganAkses: isAccountAdmin
            ? 'Akses Admin Penuh (Dapat mengedit semua fitur dan mengelola seluruh data)'
            : `Akses Pengawas (${match.jabatan}) - Hanya Lihat`,
          avatarColor: isAccountAdmin ? 'bg-indigo-600 text-white' : 'bg-amber-600 text-white'
        };
      }
    } catch (e) {}

    // Fallback from saved validated session
    return {
      id: session.userId,
      username: session.email ? session.email.split('@')[0] : session.userId,
      nama: session.nama,
      email: session.email,
      jabatan: session.jabatan,
      role: session.role,
      inisial: session.nama.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'AD',
      keteranganAkses: session.role === 'admin'
        ? 'Akses Admin Penuh (Dapat mengedit semua fitur dan mengelola seluruh data)'
        : `Akses Pengawas (${session.jabatan}) - Hanya Lihat`,
      avatarColor: session.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-amber-600 text-white'
    };
  });

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const isReadOnly = currentUser?.role === 'viewer';

  // Maintain Firebase Auth state listener across page reloads
  useEffect(() => {
    const unsub = initAuth((user, token) => {
      if (user && user.email) {
        const email = user.email.toLowerCase().trim();
        const roleProfile = resolveUserRole(email, pengawasAccounts);
        if (roleProfile) {
          setCurrentUser(roleProfile);
          setIsAuthenticated(true);
          saveAuthSession({
            userId: roleProfile.id,
            email: roleProfile.email,
            nama: roleProfile.nama,
            role: roleProfile.role,
            jabatan: roleProfile.jabatan,
            token,
            loginAt: Date.now()
          });
        } else {
          // Email not authorized! Log out immediately and strictly do not bypass
          clearAuthSession();
          setIsAuthenticated(false);
          setCurrentUser(null);
          logout().catch(() => {});
        }
      }
    }, () => {
      // User signed out in Firebase
      const session = getAuthSession();
      if (!session) {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });
    return () => unsub();
  }, [pengawasAccounts]);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    saveAuthSession({
      userId: user.id,
      email: user.email,
      nama: user.nama,
      role: user.role,
      jabatan: user.jabatan,
      loginAt: Date.now()
    });
  };

  const handleLogout = () => {
    const userName = currentUser ? currentUser.nama : 'Pengguna';
    if (confirm(`Apakah Anda yakin ingin keluar dari akun ${userName}?`)) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      clearAuthSession();
      logout().catch(() => {});
      setIsAccountMenuOpen(false);
    }
  };

  const [isPublicPresensi, setIsPublicPresensi] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('presensi') === '1' || Boolean(params.get('eventId')) || params.get('mode') === 'presensi';
    } catch (e) {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('presensi') === '1' || params.get('tab') === 'absensi_qr' || params.get('eventId')) {
        return 'absensi_qr';
      }
    } catch (e) {}
    return 'dashboard';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSiswaForDetail, setSelectedSiswaForDetail] = useState<string | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const handleSelectStudentFromSearch = (studentId: string) => {
    setSelectedSiswaForDetail(studentId);
    setActiveTab('siswa');
  };

  // --- STATE IMPLEMENTATIONS ---
  const [siswa, setSiswa] = useState<Siswa[]>(() => {
    const saved = localStorage.getItem('pramuka_siswa');
    if (saved) {
      try {
        const raw: Siswa[] = JSON.parse(saved);
        if (Array.isArray(raw) && raw.length > 0) {
          // Update official 33 ambalan members to official 2026-2027 names if needed
          const officialMap = new Map(initialSiswa.filter(s => s.id.startsWith('da_s')).map(s => [s.id, s]));
          const updated = raw.map(s => {
            const off = officialMap.get(s.id);
            return off ? { ...s, nama_lengkap: off.nama_lengkap, kelas: off.kelas, jabatan_ambalan: off.jabatan_ambalan, tahun_ajaran: off.tahun_ajaran || 'TA. 2026-2027' } : s;
          });
          return filterNonDeleted(COLLECTIONS.SISWA, updated);
        }
      } catch (e) {}
    }
    return filterNonDeleted(COLLECTIONS.SISWA, initialSiswa);
  });

  const [kehadiran, setKehadiran] = useState<Kehadiran[]>(() => {
    const saved = localStorage.getItem('pramuka_kehadiran');
    const raw = saved ? JSON.parse(saved) : initialKehadiran;
    return filterNonDeleted(COLLECTIONS.KEHADIRAN, raw);
  });

  const [materi, setMateri] = useState<Materi[]>(() => {
    const saved = localStorage.getItem('pramuka_materi');
    const raw = saved ? JSON.parse(saved) : initialMateri;
    return filterNonDeleted(COLLECTIONS.MATERI, raw);
  });

  const [sku, setSku] = useState<SKU[]>(() => {
    const saved = localStorage.getItem('pramuka_sku');
    const raw = saved ? JSON.parse(saved) : initialSKU;
    return filterNonDeleted(COLLECTIONS.SKU, raw);
  });

  const [skuDefs, setSkuDefs] = useState<SKUItemDef[]>(() => {
    const saved = localStorage.getItem('pramuka_sku_defs');
    const raw = saved ? JSON.parse(saved) : initialSKUDefs;
    return filterNonDeleted(COLLECTIONS.SKU_DEFS, raw);
  });

  const [tabungan, setTabungan] = useState<Tabungan[]>(() => {
    const saved = localStorage.getItem('pramuka_tabungan');
    const raw = saved ? JSON.parse(saved) : initialTabungan;
    return filterNonDeleted(COLLECTIONS.TABUNGAN, raw);
  });

  const [kedisiplinan, setKedisiplinan] = useState<Kedisiplinan[]>(() => {
    const saved = localStorage.getItem('pramuka_kedisiplinan');
    const raw = saved ? JSON.parse(saved) : initialKedisiplinan;
    return filterNonDeleted(COLLECTIONS.KEDISIPLINAN, raw);
  });

  const [jurnal, setJurnal] = useState<Jurnal[]>(() => {
    const saved = localStorage.getItem('pramuka_jurnal');
    const raw = saved ? JSON.parse(saved) : initialJurnal;
    return filterNonDeleted(COLLECTIONS.JURNAL, raw);
  });

  const [classList, setClassList] = useState<Kelas[]>(() => {
    const saved = localStorage.getItem('pramuka_kelas');
    if (saved) return filterNonDeleted(COLLECTIONS.KELAS, JSON.parse(saved));
    const unique = Array.from(new Set(initialSiswa.map((s) => s.kelas))).filter(Boolean).sort();
    return filterNonDeleted(COLLECTIONS.KELAS, unique.map((c, i) => ({ id: `c_${i + 1}`, nama: c })));
  });

  const [skkDefs, setSkkDefs] = useState<SKKDef[]>(() => {
    const saved = localStorage.getItem('pramuka_skk_defs');
    const raw = saved ? JSON.parse(saved) : initialSKKDefs;
    return filterNonDeleted(COLLECTIONS.SKK_DEFS, raw);
  });

  const [skkRecords, setSkkRecords] = useState<SKKRecord[]>(() => {
    const saved = localStorage.getItem('pramuka_skk_records');
    const raw = saved ? JSON.parse(saved) : initialSKKRecords;
    return filterNonDeleted(COLLECTIONS.SKK, raw);
  });

  const [kegiatanEvents, setKegiatanEvents] = useState<KegiatanEvent[]>(() => {
    const saved = localStorage.getItem('pramuka_kegiatan_events');
    const raw = saved ? JSON.parse(saved) : initialKegiatanEvents;
    return filterNonDeleted(COLLECTIONS.KEGIATAN_EVENTS, raw);
  });

  const [inventaris, setInventaris] = useState<BarangInventaris[]>(() => {
    const saved = localStorage.getItem('pramuka_inventaris');
    const raw = saved ? JSON.parse(saved) : initialBarangInventaris;
    return filterNonDeleted(COLLECTIONS.INVENTARIS, raw);
  });

  const [peminjaman, setPeminjaman] = useState<PeminjamanLogistik[]>(() => {
    const saved = localStorage.getItem('pramuka_peminjaman');
    const raw = saved ? JSON.parse(saved) : initialPeminjamanLogistik;
    return filterNonDeleted(COLLECTIONS.PEMINJAMAN, raw);
  });

  const [modulMateri, setModulMateri] = useState<ModulMateri[]>(() => {
    const saved = localStorage.getItem('pramuka_modul_materi');
    const raw = saved ? JSON.parse(saved) : initialModulMateri;
    return filterNonDeleted(COLLECTIONS.MODUL_MATERI, raw);
  });

  const [silabus, setSilabus] = useState<SilabusLatihan[]>(() => {
    const saved = localStorage.getItem('pramuka_silabus');
    const raw = saved ? JSON.parse(saved) : initialSilabusLatihan;
    return filterNonDeleted(COLLECTIONS.SILABUS, raw);
  });

  const [kas, setKas] = useState<TransaksiKas[]>(() => {
    const saved = localStorage.getItem('pramuka_kas');
    const raw = saved ? JSON.parse(saved) : initialTransaksiKas;
    return filterNonDeleted(COLLECTIONS.KAS, raw);
  });

  const [dewanAmbalan, setDewanAmbalan] = useState<PeriodeDewanAmbalan[]>(() => {
    const saved = localStorage.getItem('pramuka_dewan_ambalan');
    const official2026 = initialDewanAmbalan[0];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const has2026 = parsed.some((d: PeriodeDewanAmbalan) => d.id === 'da_2026' || d.periode === '2026-2027' || d.periode === '2026/2027');
          let normalized: PeriodeDewanAmbalan[] = [];
          if (has2026) {
            normalized = parsed.map((d: PeriodeDewanAmbalan) => {
              if (d.id === 'da_2026' || d.periode === '2026-2027' || d.periode === '2026/2027') {
                return {
                  ...d,
                  id: 'da_2026',
                  periode: '2026-2027',
                  tahun_ajaran: '2026-2027',
                  is_active: true,
                  is_aktif: true,
                  mabigus: d.mabigus && d.mabigus.length > 0 ? d.mabigus : official2026.mabigus,
                  gudep_putra: d.gudep_putra && d.gudep_putra.length > 0 ? d.gudep_putra : official2026.gudep_putra,
                  gudep_putri: d.gudep_putri && d.gudep_putri.length > 0 ? d.gudep_putri : official2026.gudep_putri,
                  susunan_pengurus: d.susunan_pengurus && d.susunan_pengurus.length > 0 ? d.susunan_pengurus : official2026.susunan_pengurus,
                };
              }
              return {
                ...d,
                is_active: false,
                is_aktif: false
              };
            });
          } else {
            normalized = [official2026, ...parsed.map((d: PeriodeDewanAmbalan) => ({ ...d, is_active: false, is_aktif: false }))];
          }
          normalized.sort((a, b) => (b.id === 'da_2026' ? 1 : 0) - (a.id === 'da_2026' ? 1 : 0));
          localStorage.setItem('pramuka_dewan_ambalan', JSON.stringify(normalized));
          return filterNonDeleted(COLLECTIONS.DEWAN_AMBALAN, normalized);
        }
      } catch (e) {
        console.error(e);
      }
    }
    return filterNonDeleted(COLLECTIONS.DEWAN_AMBALAN, initialDewanAmbalan);
  });

  // Aggressively synchronize deleted_ids storage with Firestore on boot
  useEffect(() => {
    syncAllDeletedTrackersWithFirestore().catch((e) => console.warn("Background sync deleted trackers error:", e));
  }, []);

  // --- FIRESTORE REAL-TIME SUBSCRIPTION ---
  useEffect(() => {
    // 1. Siswa (Murid)
    const unsubSiswa = subscribeCollection<Siswa>(COLLECTIONS.SISWA, (data) => {
      const processed = DataSyncManager.processSnapshot<Siswa>(COLLECTIONS.SISWA, data || []);
      setSiswa(processed);
    });

    // 2. Kehadiran
    const unsubKehadiran = subscribeCollection<Kehadiran>(COLLECTIONS.KEHADIRAN, (data) => {
      const processed = DataSyncManager.processSnapshot<Kehadiran>(COLLECTIONS.KEHADIRAN, data || []);
      setKehadiran(processed);
    });

    // 3. Materi
    const unsubMateri = subscribeCollection<Materi>(COLLECTIONS.MATERI, (data) => {
      const processed = DataSyncManager.processSnapshot<Materi>(COLLECTIONS.MATERI, data || []);
      setMateri(processed);
    });

    // 4. SKU
    const unsubSku = subscribeCollection<SKU>(COLLECTIONS.SKU, (data) => {
      const processed = DataSyncManager.processSnapshot<SKU>(COLLECTIONS.SKU, data || []);
      setSku(processed);
    });

    // 5. SKU Defs
    const unsubSkuDefs = subscribeCollection<SKUItemDef>(COLLECTIONS.SKU_DEFS, (data) => {
      const processed = DataSyncManager.processSnapshot<SKUItemDef>(COLLECTIONS.SKU_DEFS, data || []);
      setSkuDefs(processed);
    });

    // 6. Tabungan
    const unsubTabungan = subscribeCollection<Tabungan>(COLLECTIONS.TABUNGAN, (data) => {
      const processed = DataSyncManager.processSnapshot<Tabungan>(COLLECTIONS.TABUNGAN, data || []);
      setTabungan(processed);
    });

    // 7. Kedisiplinan
    const unsubKedisiplinan = subscribeCollection<Kedisiplinan>(COLLECTIONS.KEDISIPLINAN, (data) => {
      const processed = DataSyncManager.processSnapshot<Kedisiplinan>(COLLECTIONS.KEDISIPLINAN, data || []);
      setKedisiplinan(processed);
    });

    // 8. Jurnal
    const unsubJurnal = subscribeCollection<Jurnal>(COLLECTIONS.JURNAL, (data) => {
      const processed = DataSyncManager.processSnapshot<Jurnal>(COLLECTIONS.JURNAL, data || []);
      setJurnal(processed);
    });

    // 9. Kelas
    const unsubKelas = subscribeCollection<Kelas>(COLLECTIONS.KELAS, (data) => {
      const processed = DataSyncManager.processSnapshot<Kelas>(COLLECTIONS.KELAS, data || []);
      setClassList(processed);
    });

    // 10. SKK Defs
    const unsubSkkDefs = subscribeCollection<SKKDef>(COLLECTIONS.SKK_DEFS, (data) => {
      const processed = DataSyncManager.processSnapshot<SKKDef>(COLLECTIONS.SKK_DEFS, data || []);
      setSkkDefs(processed);
    });

    // 11. SKK Records
    const unsubSkkRecords = subscribeCollection<SKKRecord>(COLLECTIONS.SKK, (data) => {
      const processed = DataSyncManager.processSnapshot<SKKRecord>(COLLECTIONS.SKK, data || []);
      setSkkRecords(processed);
    });

    // 12. Kegiatan Events
    const unsubKegiatan = subscribeCollection<KegiatanEvent>(COLLECTIONS.KEGIATAN_EVENTS, (data) => {
      const processed = DataSyncManager.processSnapshot<KegiatanEvent>(COLLECTIONS.KEGIATAN_EVENTS, data || []);
      setKegiatanEvents(processed);
    });

    // 13. Inventaris
    const unsubInventaris = subscribeCollection<BarangInventaris>(COLLECTIONS.INVENTARIS, (data) => {
      const processed = DataSyncManager.processSnapshot<BarangInventaris>(COLLECTIONS.INVENTARIS, data || []);
      setInventaris(processed);
    });

    // 14. Peminjaman
    const unsubPeminjaman = subscribeCollection<PeminjamanLogistik>(COLLECTIONS.PEMINJAMAN, (data) => {
      const processed = DataSyncManager.processSnapshot<PeminjamanLogistik>(COLLECTIONS.PEMINJAMAN, data || []);
      setPeminjaman(processed);
    });

    // 15. Modul Materi
    const unsubModul = subscribeCollection<ModulMateri>(COLLECTIONS.MODUL_MATERI, (data) => {
      const processed = DataSyncManager.processSnapshot<ModulMateri>(COLLECTIONS.MODUL_MATERI, data || []);
      setModulMateri(processed);
    });

    // 16. Silabus
    const unsubSilabus = subscribeCollection<SilabusLatihan>(COLLECTIONS.SILABUS, (data) => {
      const processed = DataSyncManager.processSnapshot<SilabusLatihan>(COLLECTIONS.SILABUS, data || []);
      setSilabus(processed);
    });

    // 17. Kas
    const unsubKas = subscribeCollection<TransaksiKas>(COLLECTIONS.KAS, (data) => {
      const processed = DataSyncManager.processSnapshot<TransaksiKas>(COLLECTIONS.KAS, data || []);
      setKas(processed);
    });

    // 18. Dewan Ambalan
    const unsubDewan = subscribeCollection<PeriodeDewanAmbalan>(COLLECTIONS.DEWAN_AMBALAN, (data) => {
      const processed = DataSyncManager.processSnapshot<PeriodeDewanAmbalan>(COLLECTIONS.DEWAN_AMBALAN, data || []);
      const official2026 = initialDewanAmbalan[0];

      if (!processed || processed.length === 0) {
        setDewanAmbalan(initialDewanAmbalan);
        localStorage.setItem('pramuka_dewan_ambalan', JSON.stringify(initialDewanAmbalan));
        initialDewanAmbalan.forEach((d) => {
          setFirestoreDoc(COLLECTIONS.DEWAN_AMBALAN, d.id, d);
        });
        return;
      }

      const has2026 = processed.some((d) => d.id === 'da_2026' || d.periode === '2026-2027' || d.periode === '2026/2027');
      let normalizedList: PeriodeDewanAmbalan[] = [];

      if (!has2026) {
        const deactivatedOlder = processed.map((d) => ({ ...d, is_active: false, is_aktif: false }));
        normalizedList = [official2026, ...deactivatedOlder];
        setFirestoreDoc(COLLECTIONS.DEWAN_AMBALAN, official2026.id, official2026);
        deactivatedOlder.forEach((d) => {
          if (d.is_active || d.is_aktif) {
            setFirestoreDoc(COLLECTIONS.DEWAN_AMBALAN, d.id, d);
          }
        });
      } else {
        normalizedList = processed.map((d) => {
          if (d.id === 'da_2026' || d.periode === '2026-2027' || d.periode === '2026/2027') {
            const updated2026: PeriodeDewanAmbalan = {
              ...d,
              id: 'da_2026',
              periode: '2026-2027',
              tahun_ajaran: '2026-2027',
              is_active: true,
              is_aktif: true,
              mabigus: d.mabigus && d.mabigus.length > 0 ? d.mabigus : official2026.mabigus,
              gudep_putra: d.gudep_putra && d.gudep_putra.length > 0 ? d.gudep_putra : official2026.gudep_putra,
              gudep_putri: d.gudep_putri && d.gudep_putri.length > 0 ? d.gudep_putri : official2026.gudep_putri,
              susunan_pengurus: d.susunan_pengurus && d.susunan_pengurus.length > 0 ? d.susunan_pengurus : official2026.susunan_pengurus,
            };
            if (!d.is_active || !d.is_aktif || d.periode !== '2026-2027' || d.tahun_ajaran !== '2026-2027') {
              setFirestoreDoc(COLLECTIONS.DEWAN_AMBALAN, 'da_2026', updated2026);
            }
            return updated2026;
          }

          if (d.is_active || d.is_aktif) {
            const deactivated = { ...d, is_active: false, is_aktif: false };
            setFirestoreDoc(COLLECTIONS.DEWAN_AMBALAN, d.id, deactivated);
            return deactivated;
          }
          return d;
        });
      }

      normalizedList.sort((a, b) => (b.id === 'da_2026' ? 1 : 0) - (a.id === 'da_2026' ? 1 : 0));
      setDewanAmbalan(normalizedList);
      try {
        localStorage.setItem('pramuka_dewan_ambalan', JSON.stringify(normalizedList));
      } catch (e) {}
    });

    // 19. Master Tahun Ajaran from Firestore Settings
    const unsubTa = subscribeDoc<{ list?: string[] }>(COLLECTIONS.SETTINGS, 'tahun_ajaran', (data) => {
      if (data && Array.isArray(data.list) && data.list.length > 0) {
        setTahunAjaranList(data.list);
        try {
          localStorage.setItem('pramuka_tahun_ajaran', JSON.stringify(data.list));
        } catch (e) {}
      }
    });

    // Server-level initialization: seed ONLY if database has never been initialized
    const hasLocalInit = localStorage.getItem('pramuka_system_initialized') === 'true';
    if (!hasLocalInit) {
      getFirestoreDoc<{ is_initialized?: boolean }>(COLLECTIONS.SETTINGS, 'system_initialized')
        .then((setting) => {
          if (setting && setting.is_initialized) {
            localStorage.setItem('pramuka_system_initialized', 'true');
            return;
          }
          getDocs(collection(db, COLLECTIONS.SISWA)).then((snap) => {
            if (snap.empty) {
              const unique = Array.from(new Set(initialSiswa.map((s) => s.kelas))).filter(Boolean).sort();
              const derivedKelas = unique.map((c, i) => ({ id: `c_${i + 1}`, nama: c }));
              saveAllToFirestore({
                siswa: initialSiswa,
                kehadiran: initialKehadiran,
                materi: initialMateri,
                sku: initialSKU,
                skuDefs: initialSKUDefs,
                tabungan: initialTabungan,
                kedisiplinan: initialKedisiplinan,
                jurnal: initialJurnal,
                kelas: derivedKelas,
                skkDefs: initialSKKDefs,
                skkRecords: initialSKKRecords,
                kegiatanEvents: initialKegiatanEvents,
                inventaris: initialBarangInventaris,
                peminjaman: initialPeminjamanLogistik,
                modulMateri: initialModulMateri,
                silabus: initialSilabusLatihan,
                kas: initialTransaksiKas,
                dewanAmbalan: initialDewanAmbalan,
                tahunAjaran: ['TA. 2024-2025', 'TA. 2025-2026', 'TA. 2026-2027']
              }).then(() => {
                localStorage.setItem('pramuka_system_initialized', 'true');
                setFirestoreDoc(COLLECTIONS.SETTINGS, 'system_initialized', {
                  is_initialized: true,
                  initialized_at: new Date().toISOString()
                });
              });
            } else {
              localStorage.setItem('pramuka_system_initialized', 'true');
              setFirestoreDoc(COLLECTIONS.SETTINGS, 'system_initialized', {
                is_initialized: true,
                initialized_at: new Date().toISOString()
              });
            }
          }).catch(() => {});
        })
        .catch(() => {});
    }

    return () => {
      unsubSiswa();
      unsubKehadiran();
      unsubMateri();
      unsubSku();
      unsubSkuDefs();
      unsubTabungan();
      unsubKedisiplinan();
      unsubJurnal();
      unsubKelas();
      unsubSkkDefs();
      unsubSkkRecords();
      unsubKegiatan();
      unsubInventaris();
      unsubPeminjaman();
      unsubModul();
      unsubSilabus();
      unsubKas();
      unsubDewan();
      unsubTa();
    };
  }, []);

  // --- PERSISTENCE EFFECT WRITERS ---
  useEffect(() => {
    localStorage.setItem('pramuka_siswa', JSON.stringify(siswa));
  }, [siswa]);

  useEffect(() => {
    localStorage.setItem('pramuka_kehadiran', JSON.stringify(kehadiran));
  }, [kehadiran]);

  useEffect(() => {
    localStorage.setItem('pramuka_materi', JSON.stringify(materi));
  }, [materi]);

  useEffect(() => {
    localStorage.setItem('pramuka_sku', JSON.stringify(sku));
  }, [sku]);

  useEffect(() => {
    localStorage.setItem('pramuka_sku_defs', JSON.stringify(skuDefs));
  }, [skuDefs]);

  useEffect(() => {
    localStorage.setItem('pramuka_tabungan', JSON.stringify(tabungan));
  }, [tabungan]);

  useEffect(() => {
    localStorage.setItem('pramuka_kedisiplinan', JSON.stringify(kedisiplinan));
  }, [kedisiplinan]);

  useEffect(() => {
    localStorage.setItem('pramuka_jurnal', JSON.stringify(jurnal));
  }, [jurnal]);

  useEffect(() => {
    localStorage.setItem('pramuka_kelas', JSON.stringify(classList));
  }, [classList]);

  useEffect(() => {
    localStorage.setItem('pramuka_skk_defs', JSON.stringify(skkDefs));
  }, [skkDefs]);

  useEffect(() => {
    localStorage.setItem('pramuka_skk_records', JSON.stringify(skkRecords));
  }, [skkRecords]);

  useEffect(() => {
    localStorage.setItem('pramuka_kegiatan_events', JSON.stringify(kegiatanEvents));
  }, [kegiatanEvents]);

  useEffect(() => {
    localStorage.setItem('pramuka_inventaris', JSON.stringify(inventaris));
  }, [inventaris]);

  useEffect(() => {
    localStorage.setItem('pramuka_peminjaman', JSON.stringify(peminjaman));
  }, [peminjaman]);

  useEffect(() => {
    localStorage.setItem('pramuka_modul_materi', JSON.stringify(modulMateri));
  }, [modulMateri]);

  useEffect(() => {
    localStorage.setItem('pramuka_silabus', JSON.stringify(silabus));
  }, [silabus]);

  useEffect(() => {
    localStorage.setItem('pramuka_kas', JSON.stringify(kas));
  }, [kas]);

  useEffect(() => {
    localStorage.setItem('pramuka_dewan_ambalan', JSON.stringify(dewanAmbalan));
  }, [dewanAmbalan]);

  useEffect(() => {
    localStorage.setItem('pramuka_sku_defs', JSON.stringify(skuDefs));
  }, [skuDefs]);

  useEffect(() => {
    localStorage.setItem('pramuka_tabungan', JSON.stringify(tabungan));
  }, [tabungan]);

  useEffect(() => {
    localStorage.setItem('pramuka_kedisiplinan', JSON.stringify(kedisiplinan));
  }, [kedisiplinan]);

  useEffect(() => {
    localStorage.setItem('pramuka_jurnal', JSON.stringify(jurnal));
  }, [jurnal]);

  useEffect(() => {
    localStorage.setItem('pramuka_kelas', JSON.stringify(classList));
  }, [classList]);

  // --- RESTORATION ACTION ---
  const handleResetData = () => {
    if (isReadOnly) {
      alert("Mode Pengawas: Tindakan reset database hanya dapat dilakukan oleh Admin (Pembina Pramuka).");
      return;
    }
    if (confirm("Apakah Anda yakin ingin menyetel ulang semua data kembali ke contoh awal SMK Bakti Idhata? Semua perubahan buatan Anda akan dihapus!")) {
      clearDeletedIds();
      setSiswa(initialSiswa);
      setKehadiran(initialKehadiran);
      setMateri(initialMateri);
      setSku(initialSKU);
      setSkuDefs(initialSKUDefs);
      setTabungan(initialTabungan);
      setKedisiplinan(initialKedisiplinan);
      setJurnal(initialJurnal);
      setSkkDefs(initialSKKDefs);
      setSkkRecords(initialSKKRecords);
      setKegiatanEvents(initialKegiatanEvents);
      setInventaris(initialBarangInventaris);
      setPeminjaman(initialPeminjamanLogistik);
      setModulMateri(initialModulMateri);
      setSilabus(initialSilabusLatihan);
      setKas(initialTransaksiKas);
      setDewanAmbalan(initialDewanAmbalan);

      const unique = Array.from(new Set(initialSiswa.map((s) => s.kelas))).filter(Boolean).sort();
      const derivedKelas = unique.map((c, i) => ({ id: `c_${i + 1}`, nama: c }));
      setClassList(derivedKelas);

      // Save to cloud Firestore as well
      saveAllToFirestore({
        siswa: initialSiswa,
        kehadiran: initialKehadiran,
        materi: initialMateri,
        sku: initialSKU,
        skuDefs: initialSKUDefs,
        tabungan: initialTabungan,
        kedisiplinan: initialKedisiplinan,
        jurnal: initialJurnal,
        kelas: derivedKelas,
        skkDefs: initialSKKDefs,
        skkRecords: initialSKKRecords,
        kegiatanEvents: initialKegiatanEvents,
        inventaris: initialBarangInventaris,
        peminjaman: initialPeminjamanLogistik,
        modulMateri: initialModulMateri,
        silabus: initialSilabusLatihan,
        kas: initialTransaksiKas,
        dewanAmbalan: initialDewanAmbalan
      });

      setActiveTab('dashboard');
      alert("Seluruh database online & lokal berhasil disetel ulang!");
    }
  };

  // --- ACTIONS DISPATCHERS ---

  // 1. Siswa CRUD
  const handleAddSiswa = (newSiswa: Omit<Siswa, 'id'>) => {
    const id = "s" + (siswa.length + 1) + "_" + Date.now();
    unmarkIdAsDeleted(COLLECTIONS.SISWA, id);
    const docObj: Siswa = { ...newSiswa, id, deleted: false, is_deleted: false, tombstone: false };
    setSiswa((prev) => [...prev, docObj]);
    DataSyncManager.persistDoc(COLLECTIONS.SISWA, id, docObj);
    setFirestoreDoc(COLLECTIONS.SISWA, id, docObj);
  };

  const handleAddMultipleSiswa = (newSiswaList: Omit<Siswa, 'id'>[]) => {
    const startingLength = siswa.length;
    const added: Siswa[] = newSiswaList.map((s, idx) => {
      const id = "s" + (startingLength + idx + 1) + "_" + Date.now() + "_" + idx;
      unmarkIdAsDeleted(COLLECTIONS.SISWA, id);
      return { ...s, id, deleted: false, is_deleted: false, tombstone: false };
    });
    setSiswa((prev) => [...prev, ...added]);
    added.forEach((docObj) => {
      DataSyncManager.persistDoc(COLLECTIONS.SISWA, docObj.id, docObj);
      setFirestoreDoc(COLLECTIONS.SISWA, docObj.id, docObj);
    });
  };

  // Class List CRUD
  const handleAddKelas = (nama: string) => {
    const id = "c_" + Date.now();
    unmarkIdAsDeleted(COLLECTIONS.KELAS, id);
    const docObj: Kelas = { id, nama };
    setClassList((prev) => [...prev, docObj]);
    DataSyncManager.persistDoc(COLLECTIONS.KELAS, id, docObj);
    setFirestoreDoc(COLLECTIONS.KELAS, id, docObj);
  };

  const handleUpdateKelas = (id: string, newNama: string) => {
    const oldKelas = classList.find((k) => k.id === id);
    if (!oldKelas) return;
    
    // Update the class list
    const updatedClass: Kelas = { id, nama: newNama };
    setClassList((prev) => prev.map((k) => (k.id === id ? updatedClass : k)));
    DataSyncManager.persistDoc(COLLECTIONS.KELAS, id, updatedClass);
    setFirestoreDoc(COLLECTIONS.KELAS, id, updatedClass);
    
    // Update all students belonging to the old class name
    setSiswa((prevSiswa) => {
      const updatedStudents = prevSiswa.map((s) => (s.kelas === oldKelas.nama ? { ...s, kelas: newNama } : s));
      updatedStudents.filter(s => s.kelas === newNama).forEach(s => {
        DataSyncManager.persistDoc(COLLECTIONS.SISWA, s.id, s);
        setFirestoreDoc(COLLECTIONS.SISWA, s.id, s);
      });
      return updatedStudents;
    });
  };

  const handleDeleteKelas = (id: string) => {
    const target = classList.find((k) => k.id === id);
    if (!target) return;
    
    markIdAsDeleted(COLLECTIONS.KELAS, id, true);
    // Remove from class list
    setClassList((prev) => prev.filter((k) => k.id !== id));
    DataSyncManager.persistDelete(COLLECTIONS.KELAS, id);
    deleteFirestoreDoc(COLLECTIONS.KELAS, id);
    
    // Unassign students from this class
    setSiswa((prevSiswa) => {
      const updated = prevSiswa.map((s) => (s.kelas === target.nama ? { ...s, kelas: 'Belum Ditentukan' } : s));
      updated.filter(s => s.kelas === 'Belum Ditentukan').forEach(s => {
        DataSyncManager.persistDoc(COLLECTIONS.SISWA, s.id, s);
        setFirestoreDoc(COLLECTIONS.SISWA, s.id, s);
      });
      return updated;
    });
  };

  const handleUpdateSiswa = (updated: Siswa) => {
    unmarkIdAsDeleted(COLLECTIONS.SISWA, updated.id);
    const docObj: Siswa = { ...updated, deleted: false, is_deleted: false, tombstone: false };
    setSiswa((prev) => prev.map((s) => (s.id === updated.id ? docObj : s)));
    DataSyncManager.persistDoc(COLLECTIONS.SISWA, updated.id, docObj);
    setFirestoreDoc(COLLECTIONS.SISWA, updated.id, docObj);
  };

  const handleDeleteSiswa = (id: string) => {
    markIdAsDeleted(COLLECTIONS.SISWA, id, true);
    setSiswa((prev) => prev.filter((s) => s.id !== id));
    DataSyncManager.persistDelete(COLLECTIONS.SISWA, id);
    deleteFirestoreDoc(COLLECTIONS.SISWA, id);
    // Cascade Deletion
    const relatedKehadiran = kehadiran.filter((k) => k.siswa_id === id);
    relatedKehadiran.forEach((k) => {
      markIdAsDeleted(COLLECTIONS.KEHADIRAN, k.id, true);
      DataSyncManager.persistDelete(COLLECTIONS.KEHADIRAN, k.id);
      deleteFirestoreDoc(COLLECTIONS.KEHADIRAN, k.id);
    });
    setKehadiran((prev) => prev.filter((k) => k.siswa_id !== id));

    const relatedSku = sku.filter((s) => s.siswa_id === id);
    relatedSku.forEach((s) => {
      markIdAsDeleted(COLLECTIONS.SKU, s.id, true);
      DataSyncManager.persistDelete(COLLECTIONS.SKU, s.id);
      deleteFirestoreDoc(COLLECTIONS.SKU, s.id);
    });
    setSku((prev) => prev.filter((s) => s.siswa_id !== id));

    const relatedTabungan = tabungan.filter((t) => t.siswa_id === id);
    relatedTabungan.forEach((t) => {
      markIdAsDeleted(COLLECTIONS.TABUNGAN, t.id, true);
      DataSyncManager.persistDelete(COLLECTIONS.TABUNGAN, t.id);
      deleteFirestoreDoc(COLLECTIONS.TABUNGAN, t.id);
    });
    setTabungan((prev) => prev.filter((t) => t.siswa_id !== id));

    const relatedKedisiplinan = kedisiplinan.filter((kd) => kd.siswa_id === id);
    relatedKedisiplinan.forEach((kd) => {
      markIdAsDeleted(COLLECTIONS.KEDISIPLINAN, kd.id, true);
      DataSyncManager.persistDelete(COLLECTIONS.KEDISIPLINAN, kd.id);
      deleteFirestoreDoc(COLLECTIONS.KEDISIPLINAN, kd.id);
    });
    setKedisiplinan((prev) => prev.filter((kd) => kd.siswa_id !== id));
  };

  // 2. Kehadiran Batch Save
  const handleSaveKehadiranBatch = (tanggal: string, records: { siswa_id: string; status: StatusKehadiran; keterangan: string }[]) => {
    // Construct new records
    const newRecs: Kehadiran[] = records.map((r, idx) => ({
      id: "k_" + tanggal + "_" + idx + "_" + Date.now(),
      siswa_id: r.siswa_id,
      tanggal,
      status: r.status,
      keterangan: r.keterangan
    }));

    setKehadiran((prev) => {
      const filtered = prev.filter((k) => k.tanggal !== tanggal);
      return [...filtered, ...newRecs];
    });

    newRecs.forEach((rec) => {
      DataSyncManager.persistDoc(COLLECTIONS.KEHADIRAN, rec.id, rec);
      setFirestoreDoc(COLLECTIONS.KEHADIRAN, rec.id, rec);
    });
  };

  // 3. Materi CRUD
  const handleAddMateri = (newMateri: Omit<Materi, 'id' | 'nilai_evaluasi'>) => {
    const id = "m" + (materi.length + 1) + "_" + Date.now();
    unmarkIdAsDeleted(COLLECTIONS.MATERI, id);
    const docObj: Materi = { ...newMateri, id, nilai_evaluasi: {} };
    setMateri((prev) => [...prev, docObj]);
    DataSyncManager.persistDoc(COLLECTIONS.MATERI, id, docObj);
    setFirestoreDoc(COLLECTIONS.MATERI, id, docObj);
  };

  const handleUpdateMateri = (updated: Materi) => {
    unmarkIdAsDeleted(COLLECTIONS.MATERI, updated.id);
    setMateri((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    DataSyncManager.persistDoc(COLLECTIONS.MATERI, updated.id, updated);
    setFirestoreDoc(COLLECTIONS.MATERI, updated.id, updated);
  };

  const handleDeleteMateri = (id: string) => {
    markIdAsDeleted(COLLECTIONS.MATERI, id, true);
    setMateri((prev) => prev.filter((m) => m.id !== id));
    DataSyncManager.persistDelete(COLLECTIONS.MATERI, id);
    deleteFirestoreDoc(COLLECTIONS.MATERI, id);
    // Cascade removal on journals
    setJurnal((prev) => prev.map((j) => j.materi_id === id ? { ...j, materi_id: '' } : j));
  };

  const handleUpdateNilaiMateri = (materiId: string, nilai_evaluasi: Record<string, number>) => {
    setMateri((prev) => {
      const updated = prev.map((m) => (m.id === materiId ? { ...m, nilai_evaluasi } : m));
      const target = updated.find(m => m.id === materiId);
      if (target) {
        DataSyncManager.persistDoc(COLLECTIONS.MATERI, materiId, target);
        setFirestoreDoc(COLLECTIONS.MATERI, materiId, target);
      }
      return updated;
    });
  };

  // 4. SKU Verify, Unverify & Custom Definitions CRUD
  const handleVerifySKU = (data: { siswa_id: string; no_item_sku: number; tanggal_lulus: string; status_verifikasi: boolean; tingkat: 'Bantara' | 'Laksana'; pembina_verifikator?: string }) => {
    const id = "sku_" + data.siswa_id + "_" + data.no_item_sku + "_" + data.tingkat + "_" + Date.now();
    unmarkIdAsDeleted(COLLECTIONS.SKU, id);
    const docObj: SKU = { id, ...data, pembina_verifikator: data.pembina_verifikator || 'Kak Jihan Fadhilah, S. Kom' };
    setSku((prev) => {
      const filtered = prev.filter((item) => !(item.siswa_id === data.siswa_id && item.no_item_sku === data.no_item_sku && (item.tingkat === data.tingkat || (!item.tingkat && data.tingkat === 'Bantara'))));
      return [...filtered, docObj];
    });
    DataSyncManager.persistDoc(COLLECTIONS.SKU, id, docObj);
    setFirestoreDoc(COLLECTIONS.SKU, id, docObj);
  };

  const handleUnverifySKU = (id: string) => {
    markIdAsDeleted(COLLECTIONS.SKU, id, true);
    setSku((prev) => prev.filter((item) => item.id !== id));
    DataSyncManager.persistDelete(COLLECTIONS.SKU, id);
    deleteFirestoreDoc(COLLECTIONS.SKU, id);
  };

  const handleAddSkuDef = (newDef: Omit<SKUItemDef, 'id'>) => {
    const id = "def_" + (skuDefs.length + 1) + "_" + Date.now();
    unmarkIdAsDeleted(COLLECTIONS.SKU_DEFS, id);
    const docObj: SKUItemDef = { ...newDef, id };
    setSkuDefs((prev) => [...prev, docObj]);
    DataSyncManager.persistDoc(COLLECTIONS.SKU_DEFS, id, docObj);
    setFirestoreDoc(COLLECTIONS.SKU_DEFS, id, docObj);
  };

  const handleUpdateSkuDef = (updated: SKUItemDef) => {
    unmarkIdAsDeleted(COLLECTIONS.SKU_DEFS, updated.id);
    setSkuDefs((prev) => prev.map((d) => d.id === updated.id ? updated : d));
    DataSyncManager.persistDoc(COLLECTIONS.SKU_DEFS, updated.id, updated);
    setFirestoreDoc(COLLECTIONS.SKU_DEFS, updated.id, updated);
  };

  const handleDeleteSkuDef = (id: string) => {
    const target = skuDefs.find((d) => d.id === id);
    if (!target) return;
    markIdAsDeleted(COLLECTIONS.SKU_DEFS, id, true);
    setSkuDefs((prev) => prev.filter((d) => d.id !== id));
    DataSyncManager.persistDelete(COLLECTIONS.SKU_DEFS, id);
    deleteFirestoreDoc(COLLECTIONS.SKU_DEFS, id);
    // Cascade removal on verified student SKU items
    const relatedSku = sku.filter((item) => (item.no_item_sku === target.no_item && (item.tingkat === target.tingkat || (!item.tingkat && target.tingkat === 'Bantara'))));
    relatedSku.forEach((r) => {
      markIdAsDeleted(COLLECTIONS.SKU, r.id, true);
      DataSyncManager.persistDelete(COLLECTIONS.SKU, r.id);
      deleteFirestoreDoc(COLLECTIONS.SKU, r.id);
    });
    setSku((prev) => prev.filter((item) => !(item.no_item_sku === target.no_item && (item.tingkat === target.tingkat || (!item.tingkat && target.tingkat === 'Bantara')))));
  };

  // 5. Tabungan Actions
  const handleAddTabungan = (newTabungan: Omit<Tabungan, 'id'>) => {
    const id = "t" + (tabungan.length + 1) + "_" + Date.now();
    unmarkIdAsDeleted(COLLECTIONS.TABUNGAN, id);
    const docObj: Tabungan = { ...newTabungan, id };
    setTabungan((prev) => [...prev, docObj]);
    DataSyncManager.persistDoc(COLLECTIONS.TABUNGAN, id, docObj);
    setFirestoreDoc(COLLECTIONS.TABUNGAN, id, docObj);
  };

  const handleDeleteTabungan = (id: string) => {
    markIdAsDeleted(COLLECTIONS.TABUNGAN, id, true);
    setTabungan((prev) => prev.filter((t) => t.id !== id));
    DataSyncManager.persistDelete(COLLECTIONS.TABUNGAN, id);
    deleteFirestoreDoc(COLLECTIONS.TABUNGAN, id);
  };

  // 6. Kedisiplinan Actions
  const handleAddKedisiplinan = (newLog: Omit<Kedisiplinan, 'id'>) => {
    const id = "d" + (kedisiplinan.length + 1) + "_" + Date.now();
    unmarkIdAsDeleted(COLLECTIONS.KEDISIPLINAN, id);
    const docObj: Kedisiplinan = { ...newLog, id };
    setKedisiplinan((prev) => [...prev, docObj]);
    DataSyncManager.persistDoc(COLLECTIONS.KEDISIPLINAN, id, docObj);
    setFirestoreDoc(COLLECTIONS.KEDISIPLINAN, id, docObj);
  };

  const handleDeleteKedisiplinan = (id: string) => {
    markIdAsDeleted(COLLECTIONS.KEDISIPLINAN, id, true);
    setKedisiplinan((prev) => prev.filter((d) => d.id !== id));
    DataSyncManager.persistDelete(COLLECTIONS.KEDISIPLINAN, id);
    deleteFirestoreDoc(COLLECTIONS.KEDISIPLINAN, id);
  };

  // 7. Jurnal Actions
  const handleAddJurnal = (newJurnal: Omit<Jurnal, 'id'>) => {
    const id = "j" + (jurnal.length + 1) + "_" + Date.now();
    unmarkIdAsDeleted(COLLECTIONS.JURNAL, id);
    const docObj: Jurnal = { ...newJurnal, id };
    setJurnal((prev) => [...prev, docObj]);
    DataSyncManager.persistDoc(COLLECTIONS.JURNAL, id, docObj);
    setFirestoreDoc(COLLECTIONS.JURNAL, id, docObj);
  };

  const handleDeleteJurnal = (id: string) => {
    markIdAsDeleted(COLLECTIONS.JURNAL, id, true);
    setJurnal((prev) => prev.filter((j) => j.id !== id));
    DataSyncManager.persistDelete(COLLECTIONS.JURNAL, id);
    deleteFirestoreDoc(COLLECTIONS.JURNAL, id);
  };

  // --- BATCH ACADEMIC ROLLOVER (NAIK KELAS MASSAL) ---
  const handleBatchRollover = (updatedSiswaList: Siswa[], targetTa: string) => {
    setSiswa(updatedSiswaList);
    updatedSiswaList.forEach((s) => {
      unmarkIdAsDeleted(COLLECTIONS.SISWA, s.id);
      DataSyncManager.persistDoc(COLLECTIONS.SISWA, s.id, s);
      setFirestoreDoc(COLLECTIONS.SISWA, s.id, s);
    });

    // Auto-detect and register newly promoted classes in classList
    const currentClassNames = new Set(classList.map((c) => c.nama));
    const newClassesToAdd: Kelas[] = [];
    updatedSiswaList.forEach((s) => {
      if (s.kelas && !currentClassNames.has(s.kelas) && s.kelas !== 'Belum Ditentukan' && s.kelas !== 'Alumni') {
        currentClassNames.add(s.kelas);
        const newClassObj: Kelas = { 
          id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, 
          nama: s.kelas 
        };
        newClassesToAdd.push(newClassObj);
        unmarkIdAsDeleted(COLLECTIONS.KELAS, newClassObj.id);
        DataSyncManager.persistDoc(COLLECTIONS.KELAS, newClassObj.id, newClassObj);
        setFirestoreDoc(COLLECTIONS.KELAS, newClassObj.id, newClassObj);
      }
    });
    if (newClassesToAdd.length > 0) {
      setClassList((prev) => [...prev, ...newClassesToAdd]);
    }
  };

  // --- SKK / TKK DIGITAL ACTIONS ---
  const handleVerifySKK = (data: Omit<SKKRecord, 'id'>) => {
    const existing = skkRecords.find(
      (r) => r.siswa_id === data.siswa_id && r.skk_def_id === data.skk_def_id && r.tingkat === data.tingkat
    );
    if (existing) {
      const updated: SKKRecord = { ...existing, ...data };
      unmarkIdAsDeleted(COLLECTIONS.SKK, existing.id);
      setSkkRecords((prev) => prev.map((r) => (r.id === existing.id ? updated : r)));
      DataSyncManager.persistDoc(COLLECTIONS.SKK, existing.id, updated);
      setFirestoreDoc(COLLECTIONS.SKK, existing.id, updated);
    } else {
      const id = `skkr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newRec: SKKRecord = { ...data, id };
      unmarkIdAsDeleted(COLLECTIONS.SKK, id);
      setSkkRecords((prev) => [...prev, newRec]);
      DataSyncManager.persistDoc(COLLECTIONS.SKK, id, newRec);
      setFirestoreDoc(COLLECTIONS.SKK, id, newRec);
    }
  };

  const handleUnverifySKK = (id: string) => {
    markIdAsDeleted(COLLECTIONS.SKK, id, true);
    setSkkRecords((prev) => prev.filter((r) => r.id !== id));
    DataSyncManager.persistDelete(COLLECTIONS.SKK, id);
    deleteFirestoreDoc(COLLECTIONS.SKK, id);
  };

  const handleAddSKKDef = (data: Omit<SKKDef, 'id'>) => {
    const id = `skk_${Date.now()}`;
    unmarkIdAsDeleted(COLLECTIONS.SKK_DEFS, id);
    const newDef: SKKDef = { ...data, id };
    setSkkDefs((prev) => [...prev, newDef]);
    DataSyncManager.persistDoc(COLLECTIONS.SKK_DEFS, id, newDef);
    setFirestoreDoc(COLLECTIONS.SKK_DEFS, id, newDef);
  };

  // --- ABSENSI QR & KEGIATAN ACTIONS ---
  const handleAddKegiatanEvent = (event: Omit<KegiatanEvent, 'id'>) => {
    const id = `evt_${Date.now()}`;
    unmarkIdAsDeleted(COLLECTIONS.KEGIATAN_EVENTS, id);
    const newEvt: KegiatanEvent = { ...event, id };
    setKegiatanEvents((prev) => [...prev, newEvt]);
    DataSyncManager.persistDoc(COLLECTIONS.KEGIATAN_EVENTS, id, newEvt);
    setFirestoreDoc(COLLECTIONS.KEGIATAN_EVENTS, id, newEvt);
  };

  const handleUpdateKegiatanEvent = (event: KegiatanEvent) => {
    unmarkIdAsDeleted(COLLECTIONS.KEGIATAN_EVENTS, event.id);
    setKegiatanEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
    DataSyncManager.persistDoc(COLLECTIONS.KEGIATAN_EVENTS, event.id, event);
    setFirestoreDoc(COLLECTIONS.KEGIATAN_EVENTS, event.id, event);
  };

  const handleRecordAttendanceFromQR = (data: {
    siswa_id: string;
    tanggal: string;
    status: StatusKehadiran;
    catatan?: string;
  }) => {
    const existing = kehadiran.find(
      (k) => k.siswa_id === data.siswa_id && k.tanggal === data.tanggal
    );
    if (existing) {
      const updated: Kehadiran = {
        ...existing,
        status: data.status,
        keterangan: data.catatan || existing.keterangan,
      };
      unmarkIdAsDeleted(COLLECTIONS.KEHADIRAN, existing.id);
      setKehadiran((prev) => prev.map((k) => (k.id === existing.id ? updated : k)));
      DataSyncManager.persistDoc(COLLECTIONS.KEHADIRAN, existing.id, updated);
      setFirestoreDoc(COLLECTIONS.KEHADIRAN, existing.id, updated);
    } else {
      const id = `k_${data.tanggal}_${Date.now()}`;
      unmarkIdAsDeleted(COLLECTIONS.KEHADIRAN, id);
      const newKehadiran: Kehadiran = {
        id,
        siswa_id: data.siswa_id,
        tanggal: data.tanggal,
        status: data.status,
        keterangan: data.catatan || 'Absensi QR Code',
      };
      setKehadiran((prev) => [...prev, newKehadiran]);
      DataSyncManager.persistDoc(COLLECTIONS.KEHADIRAN, id, newKehadiran);
      setFirestoreDoc(COLLECTIONS.KEHADIRAN, id, newKehadiran);
    }
  };

  // --- INVENTARIS & PEMINJAMAN ACTIONS ---
  const handleAddBarang = (barang: Omit<BarangInventaris, 'id'>) => {
    const id = `inv_${Date.now()}`;
    unmarkIdAsDeleted(COLLECTIONS.INVENTARIS, id);
    const newBarang: BarangInventaris = { ...barang, id };
    setInventaris((prev) => [...prev, newBarang]);
    DataSyncManager.persistDoc(COLLECTIONS.INVENTARIS, id, newBarang);
    setFirestoreDoc(COLLECTIONS.INVENTARIS, id, newBarang);
  };

  const handleUpdateBarang = (barang: BarangInventaris) => {
    unmarkIdAsDeleted(COLLECTIONS.INVENTARIS, barang.id);
    setInventaris((prev) => prev.map((b) => (b.id === barang.id ? barang : b)));
    DataSyncManager.persistDoc(COLLECTIONS.INVENTARIS, barang.id, barang);
    setFirestoreDoc(COLLECTIONS.INVENTARIS, barang.id, barang);
  };

  const handleDeleteBarang = (id: string) => {
    markIdAsDeleted(COLLECTIONS.INVENTARIS, id, true);
    setInventaris((prev) => prev.filter((b) => b.id !== id));
    DataSyncManager.persistDelete(COLLECTIONS.INVENTARIS, id);
    deleteFirestoreDoc(COLLECTIONS.INVENTARIS, id);
    const relatedPeminjaman = peminjaman.filter((p) => p.barang_id === id);
    relatedPeminjaman.forEach((p) => {
      markIdAsDeleted(COLLECTIONS.PEMINJAMAN, p.id, true);
      DataSyncManager.persistDelete(COLLECTIONS.PEMINJAMAN, p.id);
      deleteFirestoreDoc(COLLECTIONS.PEMINJAMAN, p.id);
    });
    setPeminjaman((prev) => prev.filter((p) => p.barang_id !== id));
  };

  const handleAddPeminjaman = (pinjam: Omit<PeminjamanLogistik, 'id'>) => {
    const id = `pinjam_${Date.now()}`;
    unmarkIdAsDeleted(COLLECTIONS.PEMINJAMAN, id);
    const newPinjam: PeminjamanLogistik = { ...pinjam, id };
    setPeminjaman((prev) => [...prev, newPinjam]);
    DataSyncManager.persistDoc(COLLECTIONS.PEMINJAMAN, id, newPinjam);
    setFirestoreDoc(COLLECTIONS.PEMINJAMAN, id, newPinjam);

    // Deduct available stock
    setInventaris((prev) =>
      prev.map((b) => {
        if (b.id === pinjam.barang_id) {
          const updated = {
            ...b,
            jumlah_tersedia: Math.max(0, b.jumlah_tersedia - pinjam.jumlah_pinjam),
          };
          DataSyncManager.persistDoc(COLLECTIONS.INVENTARIS, b.id, updated);
          setFirestoreDoc(COLLECTIONS.INVENTARIS, b.id, updated);
          return updated;
        }
        return b;
      })
    );
  };

  const handleKembalikanBarang = (
    pinjamId: string,
    kondisi: 'Baik' | 'Rusak' | 'Hilang',
    catatan?: string
  ) => {
    const target = peminjaman.find((p) => p.id === pinjamId);
    if (!target) return;

    const updatedPinjam: PeminjamanLogistik = {
      ...target,
      status: 'Kembali',
      tanggal_kembali_aktual: new Date().toISOString().split('T')[0],
      kondisi_kembali: kondisi === 'Rusak' ? 'Rusak Ringan' : (kondisi as any),
      catatan: catatan ? `${target.catatan || ''} | ${catatan}` : target.catatan,
    };

    setPeminjaman((prev) => prev.map((p) => (p.id === pinjamId ? updatedPinjam : p)));
    DataSyncManager.persistDoc(COLLECTIONS.PEMINJAMAN, pinjamId, updatedPinjam);
    setFirestoreDoc(COLLECTIONS.PEMINJAMAN, pinjamId, updatedPinjam);

    // Return stock to inventory
    setInventaris((prev) =>
      prev.map((b) => {
        if (b.id === target.barang_id) {
          const newAvail = Math.min(b.jumlah_total, b.jumlah_tersedia + target.jumlah_pinjam);
          let newBaik = b.kondisi_baik;
          let newRusak = b.kondisi_rusak;
          if (kondisi === 'Rusak') {
            newRusak += target.jumlah_pinjam;
            newBaik = Math.max(0, newBaik - target.jumlah_pinjam);
          }
          const updated = {
            ...b,
            jumlah_tersedia: newAvail,
            kondisi_baik: newBaik,
            kondisi_rusak: newRusak,
          };
          DataSyncManager.persistDoc(COLLECTIONS.INVENTARIS, b.id, updated);
          setFirestoreDoc(COLLECTIONS.INVENTARIS, b.id, updated);
          return updated;
        }
        return b;
      })
    );
  };

  // --- E-LIBRARY MATERI ACTIONS ---
  const handleAddModul = (modul: Omit<ModulMateri, 'id'>) => {
    const id = `lib_${Date.now()}`;
    unmarkIdAsDeleted(COLLECTIONS.MODUL_MATERI, id);
    const newModul: ModulMateri = { ...modul, id };
    setModulMateri((prev) => [...prev, newModul]);
    DataSyncManager.persistDoc(COLLECTIONS.MODUL_MATERI, id, newModul);
    setFirestoreDoc(COLLECTIONS.MODUL_MATERI, id, newModul);
  };

  const handleAddSilabus = (sil: Omit<SilabusLatihan, 'id'>) => {
    const id = `sil_${Date.now()}`;
    unmarkIdAsDeleted(COLLECTIONS.SILABUS, id);
    const newSil: SilabusLatihan = { ...sil, id };
    setSilabus((prev) => [...prev, newSil]);
    DataSyncManager.persistDoc(COLLECTIONS.SILABUS, id, newSil);
    setFirestoreDoc(COLLECTIONS.SILABUS, id, newSil);
  };

  const handleUpdateSilabus = (sil: SilabusLatihan) => {
    unmarkIdAsDeleted(COLLECTIONS.SILABUS, sil.id);
    setSilabus((prev) => prev.map((s) => (s.id === sil.id ? sil : s)));
    DataSyncManager.persistDoc(COLLECTIONS.SILABUS, sil.id, sil);
    setFirestoreDoc(COLLECTIONS.SILABUS, sil.id, sil);
  };

  // --- KAS AMBALAN ACTIONS ---
  const handleAddKas = (tx: Omit<TransaksiKas, 'id'>) => {
    const id = `kas_${Date.now()}`;
    unmarkIdAsDeleted(COLLECTIONS.KAS, id);
    const newTx: TransaksiKas = { ...tx, id };
    setKas((prev) => [...prev, newTx]);
    DataSyncManager.persistDoc(COLLECTIONS.KAS, id, newTx);
    setFirestoreDoc(COLLECTIONS.KAS, id, newTx);
  };

  const handleDeleteKas = (id: string) => {
    markIdAsDeleted(COLLECTIONS.KAS, id, true);
    setKas((prev) => prev.filter((k) => k.id !== id));
    DataSyncManager.persistDelete(COLLECTIONS.KAS, id);
    deleteFirestoreDoc(COLLECTIONS.KAS, id);
  };

  // --- DEWAN AMBALAN ACTIONS ---
  const handleAddDewan = (dewan: Omit<PeriodeDewanAmbalan, 'id'>) => {
    const id = `da_${Date.now()}`;
    unmarkIdAsDeleted(COLLECTIONS.DEWAN_AMBALAN, id);
    const newDewan: PeriodeDewanAmbalan = { ...dewan, id };
    setDewanAmbalan((prev) => [...prev, newDewan]);
    DataSyncManager.persistDoc(COLLECTIONS.DEWAN_AMBALAN, id, newDewan);
    setFirestoreDoc(COLLECTIONS.DEWAN_AMBALAN, id, newDewan);
  };

  const handleUpdateDewan = (dewan: PeriodeDewanAmbalan) => {
    unmarkIdAsDeleted(COLLECTIONS.DEWAN_AMBALAN, dewan.id);
    setDewanAmbalan((prev) => prev.map((d) => (d.id === dewan.id ? dewan : d)));
    DataSyncManager.persistDoc(COLLECTIONS.DEWAN_AMBALAN, dewan.id, dewan);
    setFirestoreDoc(COLLECTIONS.DEWAN_AMBALAN, dewan.id, dewan);
  };

  const handleDeleteDewan = (id: string) => {
    markIdAsDeleted(COLLECTIONS.DEWAN_AMBALAN, id, true);
    setDewanAmbalan((prev) => prev.filter((d) => d.id !== id));
    DataSyncManager.persistDelete(COLLECTIONS.DEWAN_AMBALAN, id);
    deleteFirestoreDoc(COLLECTIONS.DEWAN_AMBALAN, id);
  };

  const handleResetDewanToOfficial = () => {
    initialDewanAmbalan.forEach(d => unmarkIdAsDeleted(COLLECTIONS.DEWAN_AMBALAN, d.id));
    setDewanAmbalan(initialDewanAmbalan);
    localStorage.setItem('pramuka_dewan_ambalan', JSON.stringify(initialDewanAmbalan));
    saveAllToFirestore({ dewanAmbalan: initialDewanAmbalan });
    initialDewanAmbalan.forEach(d => {
      setFirestoreDoc(COLLECTIONS.DEWAN_AMBALAN, d.id, d);
    });

    // Ensure all 33 official students are updated with official 2026-2027 names and present in siswa state and Firestore
    const officialMap = new Map(initialSiswa.filter(s => s.id.startsWith('da_s')).map(s => [s.id, s]));
    const updatedSiswa = siswa.map(s => {
      const off = officialMap.get(s.id);
      return off ? { ...s, nama_lengkap: off.nama_lengkap, kelas: off.kelas, jabatan_ambalan: off.jabatan_ambalan, tahun_ajaran: off.tahun_ajaran || 'TA. 2026-2027' } : s;
    });
    const existingIds = new Set(updatedSiswa.map(s => s.id));
    const missingAmbalan = initialSiswa.filter(s => !existingIds.has(s.id));
    missingAmbalan.forEach(s => unmarkIdAsDeleted(COLLECTIONS.SISWA, s.id));
    const finalSiswa = [...updatedSiswa, ...missingAmbalan];
    setSiswa(finalSiswa);
    localStorage.setItem('pramuka_siswa', JSON.stringify(finalSiswa));
    saveAllToFirestore({ siswa: finalSiswa });
  };

  // --- COMPREHENSIVE RESTORE HANDLER ---
  const handleRestoreAllData = (newData: {
    siswa: Siswa[];
    kehadiran: Kehadiran[];
    materi: Materi[];
    sku: SKU[];
    tabungan: Tabungan[];
    kedisiplinan: Kedisiplinan[];
    jurnal: Jurnal[];
    skuDefs: SKUItemDef[];
    kelas?: Kelas[];
    skkDefs?: SKKDef[];
    skkRecords?: SKKRecord[];
    kegiatanEvents?: KegiatanEvent[];
    inventaris?: BarangInventaris[];
    peminjaman?: PeminjamanLogistik[];
    modulMateri?: ModulMateri[];
    silabus?: SilabusLatihan[];
    kas?: TransaksiKas[];
    dewanAmbalan?: PeriodeDewanAmbalan[];
  }) => {
    if (isReadOnly) {
      alert("Mode Pengawas: Pemulihan / penimpaan database hanya dapat dilakukan oleh Admin (Pembina Pramuka).");
      return;
    }
    // Clear deletion history so restored items are preserved
    clearDeletedIds();
    setSiswa(newData.siswa);
    setKehadiran(newData.kehadiran);
    setMateri(newData.materi);
    setSku(newData.sku);
    setTabungan(newData.tabungan);
    setKedisiplinan(newData.kedisiplinan);
    setJurnal(newData.jurnal);
    setSkuDefs(newData.skuDefs);
    
    if (newData.skkDefs) setSkkDefs(newData.skkDefs);
    if (newData.skkRecords) setSkkRecords(newData.skkRecords);
    if (newData.kegiatanEvents) setKegiatanEvents(newData.kegiatanEvents);
    if (newData.inventaris) setInventaris(newData.inventaris);
    if (newData.peminjaman) setPeminjaman(newData.peminjaman);
    if (newData.modulMateri) setModulMateri(newData.modulMateri);
    if (newData.silabus) setSilabus(newData.silabus);
    if (newData.kas) setKas(newData.kas);
    if (newData.dewanAmbalan) setDewanAmbalan(newData.dewanAmbalan);

    let resolvedClasses: Kelas[] = [];
    if (newData.kelas) {
      resolvedClasses = newData.kelas;
      setClassList(newData.kelas);
      localStorage.setItem('pramuka_kelas', JSON.stringify(newData.kelas));
    } else {
      const unique = Array.from(new Set(newData.siswa.map((s) => s.kelas))).filter(Boolean).sort();
      resolvedClasses = unique.map((c, i) => ({ id: `c_${i + 1}`, nama: c }));
      setClassList(resolvedClasses);
      localStorage.setItem('pramuka_kelas', JSON.stringify(resolvedClasses));
    }

    // Save directly to local storage to persist immediately
    localStorage.setItem('pramuka_siswa', JSON.stringify(newData.siswa));
    localStorage.setItem('pramuka_kehadiran', JSON.stringify(newData.kehadiran));
    localStorage.setItem('pramuka_materi', JSON.stringify(newData.materi));
    localStorage.setItem('pramuka_sku', JSON.stringify(newData.sku));
    localStorage.setItem('pramuka_tabungan', JSON.stringify(newData.tabungan));
    localStorage.setItem('pramuka_kedisiplinan', JSON.stringify(newData.kedisiplinan));
    localStorage.setItem('pramuka_jurnal', JSON.stringify(newData.jurnal));
    localStorage.setItem('pramuka_sku_defs', JSON.stringify(newData.skuDefs));

    if (newData.skkDefs) localStorage.setItem('pramuka_skk_defs', JSON.stringify(newData.skkDefs));
    if (newData.skkRecords) localStorage.setItem('pramuka_skk_records', JSON.stringify(newData.skkRecords));
    if (newData.kegiatanEvents) localStorage.setItem('pramuka_kegiatan_events', JSON.stringify(newData.kegiatanEvents));
    if (newData.inventaris) localStorage.setItem('pramuka_inventaris', JSON.stringify(newData.inventaris));
    if (newData.peminjaman) localStorage.setItem('pramuka_peminjaman', JSON.stringify(newData.peminjaman));
    if (newData.modulMateri) localStorage.setItem('pramuka_modul_materi', JSON.stringify(newData.modulMateri));
    if (newData.silabus) localStorage.setItem('pramuka_silabus', JSON.stringify(newData.silabus));
    if (newData.kas) localStorage.setItem('pramuka_kas', JSON.stringify(newData.kas));
    if (newData.dewanAmbalan) localStorage.setItem('pramuka_dewan_ambalan', JSON.stringify(newData.dewanAmbalan));

    // Save to Firestore
    saveAllToFirestore({
      siswa: newData.siswa,
      kehadiran: newData.kehadiran,
      materi: newData.materi,
      sku: newData.sku,
      skuDefs: newData.skuDefs,
      tabungan: newData.tabungan,
      kedisiplinan: newData.kedisiplinan,
      jurnal: newData.jurnal,
      kelas: resolvedClasses,
      skkDefs: newData.skkDefs || skkDefs,
      skkRecords: newData.skkRecords || skkRecords,
      kegiatanEvents: newData.kegiatanEvents || kegiatanEvents,
      inventaris: newData.inventaris || inventaris,
      peminjaman: newData.peminjaman || peminjaman,
      modulMateri: newData.modulMateri || modulMateri,
      silabus: newData.silabus || silabus,
      kas: newData.kas || kas,
      dewanAmbalan: newData.dewanAmbalan || dewanAmbalan
    });
  };

  // Navigation array
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'siswa', label: 'Data Murid & Siklus', icon: Users },
    { id: 'kelas', label: 'Manajemen Kelas', icon: GraduationCap },
    { id: 'dewan_ambalan', label: 'Dewan Ambalan', icon: Users2 },
    { id: 'absensi', label: 'Absensi Latihan', icon: CheckSquare },
    { id: 'absensi_qr', label: 'Absensi QR & Event', icon: QrCode },
    { id: 'sku', label: 'Progres SKU', icon: Award },
    { id: 'skk', label: 'SKK / TKK Digital', icon: Sparkles },
    { id: 'inventaris', label: 'Inventaris & Logistik', icon: Package },
    { id: 'elibrary', label: 'E-Library & Silabus', icon: Library },
    { id: 'kas', label: 'Keuangan & Kas', icon: DollarSign },
    { id: 'materi', label: 'Materi Latihan', icon: BookOpen },
    { id: 'tabungan', label: 'Tabungan Anggota', icon: Landmark },
    { id: 'kedisiplinan', label: 'Poin Kedisiplinan', icon: ShieldAlert },
    { id: 'jurnal', label: 'Jurnal Pembina', icon: FileText },
    { id: 'nilai', label: 'Rekap Nilai Akhir', icon: Percent },
    { id: 'pengawas_manager', label: 'Kelola Data Akun', icon: UserCheck, adminOnly: true },
    { id: 'google_drive', label: 'Backup & Restore Data', icon: CloudUpload },
    { id: 'source_code', label: 'Kode PHP & SQL', icon: Code2 },
  ];

  if (isPublicPresensi) {
    return (
      <PublicPresensiQRPage
        siswa={siswa}
        events={kegiatanEvents}
        kehadiran={kehadiran}
        sku={sku}
        skuDefs={skuDefs}
        skkRecords={skkRecords}
        onRecordAttendance={handleRecordAttendanceFromQR}
        onGoToLogin={() => {
          setIsPublicPresensi(false);
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete('presensi');
            url.searchParams.delete('eventId');
            url.searchParams.delete('token');
            url.searchParams.delete('mode');
            window.history.replaceState({}, '', url.pathname + (url.search ? '?' + url.searchParams.toString() : ''));
          } catch (e) {}
        }}
        isAuthenticated={isAuthenticated}
      />
    );
  }

  if (!isAuthenticated || !currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={handleLoginSuccess} 
        onOpenPublicPresensi={() => setIsPublicPresensi(true)}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      
      {/* 1. SIDEBAR Navigation (Desktop Screen) */}
      <aside className="hidden md:flex flex-col w-64 bg-indigo-950 text-white flex-shrink-0 h-full border-r border-indigo-950">
        <div className="p-6 border-b border-indigo-900 flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center p-1.5 overflow-hidden shadow-xs border border-white/5 shrink-0">
            <img 
              src={logoImage} 
              alt="Logo Pramuka Bakti Idhata" 
              className="w-full h-full object-contain animate-pulse"
              referrerPolicy="no-referrer" 
            />
          </div>
          <div>
            <span className="text-sm font-black tracking-wider uppercase">SI-Pramuka</span>
            <p className="text-[10px] text-indigo-300 font-extrabold uppercase mt-0.5">SMK Bakti Idhata</p>
          </div>
        </div>

        {/* Scrollable Nav menus */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin">
          {menuItems
            .filter((item) => !item.adminOnly || currentUser.role === 'admin')
            .map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md border border-indigo-500'
                      : 'text-indigo-200 hover:bg-indigo-900/40 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-indigo-300'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.adminOnly && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Admin
                    </span>
                  )}
                </button>
              );
            })}
        </nav>

        {/* Restore/Reset Option */}
        <div className="p-4 border-t border-indigo-900/70 bg-indigo-950/50">
          {!isReadOnly ? (
            <button
              onClick={handleResetData}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-900/50 hover:bg-indigo-900 text-[10px] text-indigo-300 hover:text-white font-black py-2 rounded-xl transition cursor-pointer"
              title="Reset seluruh data ke awal (Khusus Pembina/Admin)"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>RESET DATABASE</span>
            </button>
          ) : (
            <div className="text-center py-1.5 px-2 bg-indigo-900/30 rounded-xl border border-indigo-800/40">
              <span className="text-[10px] text-amber-300/80 font-bold flex items-center justify-center gap-1">
                <Eye className="w-3 h-3 text-amber-400" /> Mode Pengawas
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0 relative z-20 shadow-xs">
          
          {/* Mobile Menu Toggle button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-1.5 bg-gray-50 text-gray-500 hover:text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center space-x-3">
            <div className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl p-1 overflow-hidden flex items-center justify-center shrink-0">
              <img 
                src={logoImage} 
                alt="Logo Pramuka Bakti Idhata" 
                className="w-full h-full object-contain" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block leading-none">
                Sistem Informasi Pramuka Penegak Ambalan
              </span>
              <h1 className="text-sm font-black text-gray-800 uppercase tracking-wider mt-1 leading-none">
                SMK Bakti Idhata Jakarta
              </h1>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-3">
            <GlobalSearchBar
              siswa={siswa}
              onSelectStudent={handleSelectStudentFromSearch}
            />
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => setIsPublicPresensi(true)}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-900 border border-amber-300 rounded-full text-[11px] font-black shadow-2xs transition cursor-pointer"
              title="Buka Portal Presensi Mandiri Murid (Tampilan Penegak Bebas Login)"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-700" />
              <span>Portal Murid (QR)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBackupModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 border border-indigo-200 rounded-full text-[11px] font-bold shadow-2xs transition cursor-pointer"
              title="Buka Pusat Cadangan & Pemulihan Data JSON"
            >
              <HardDriveDownload className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Backup / Restore JSON</span>
              <span className="sm:hidden">JSON</span>
            </button>

            <button 
              type="button"
              onClick={() => DataSyncManager.flushPendingQueue()}
              title="Klik untuk memaksa sinkronisasi antrean ke Cloud Firestore"
              className={`hidden lg:flex items-center space-x-2 px-3 py-1.5 border rounded-full text-[11px] font-bold shadow-2xs transition cursor-pointer ${
                syncStatus.isSyncing 
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200' 
                  : syncStatus.pendingCount > 0 
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${syncStatus.isSyncing ? 'bg-indigo-500 animate-ping' : syncStatus.pendingCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {syncStatus.isSyncing 
                  ? 'Menyimpan ke Cloud...' 
                  : syncStatus.pendingCount > 0 
                  ? `Antrean Sinkronisasi (${syncStatus.pendingCount})` 
                  : 'Database Cloud Terhubung'}
              </span>
            </button>

            {/* Interactive User Account Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="flex items-center space-x-2.5 p-1.5 pl-2.5 rounded-2xl hover:bg-gray-50 border border-gray-200 transition cursor-pointer text-left"
                title="Ganti Akun Pengguna / Hak Akses"
              >
                <div className="hidden sm:block text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <p className="text-xs font-bold text-gray-800 leading-tight">{currentUser.nama}</p>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </div>
                  <div className="flex items-center justify-end space-x-1 mt-0.5">
                    {currentUser.role === 'admin' ? (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded-sm text-[9px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800">
                        Admin (Edit)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded-sm text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 gap-0.5">
                        <Eye className="w-2.5 h-2.5" /> Pengawas
                      </span>
                    )}
                    <span className="text-[10px] text-gray-500 font-medium truncate max-w-[130px]">
                      {currentUser.jabatan}
                    </span>
                  </div>
                </div>

                <div className={`w-9 h-9 ${currentUser.avatarColor} rounded-xl flex items-center justify-center font-black text-xs border border-white/40 shadow-xs shrink-0`}>
                  {currentUser.inisial}
                </div>
              </button>

              {/* Dropdown Menu Modal/Overlay */}
              {isAccountMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsAccountMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 z-50 animate-fade-in space-y-3.5">
                    <div className="px-1 py-1 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Profil Sesi Aktif</span>
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Terotentikasi Aman
                      </span>
                    </div>

                    {/* Active User Identity Card */}
                    <div className="p-3 bg-gradient-to-br from-indigo-50/70 to-slate-50 rounded-2xl border border-indigo-100 flex items-start space-x-3">
                      <div className={`w-11 h-11 ${currentUser.avatarColor} rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs border-2 border-white`}>
                        {currentUser.inisial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-gray-900 truncate">{currentUser.nama}</p>
                        <p className="text-[11px] font-semibold text-gray-600 truncate">{currentUser.jabatan}</p>
                        <p className="text-[10px] text-gray-500 font-mono truncate mt-0.5">{currentUser.email}</p>
                        <div className="mt-1.5">
                          {currentUser.role === 'admin' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                              <ShieldCheck className="w-3 h-3 mr-1 text-indigo-600" /> Admin Gugus Depan (Akses Penuh)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                              <Eye className="w-3 h-3 mr-1 text-amber-700" /> Pengawas (Mode Hanya Lihat)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Security Details */}
                    <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-[11px] text-gray-600 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-gray-500">
                        <span>Otorisasi Sistem:</span>
                        <span className="text-gray-800 font-black">{currentUser.role === 'admin' ? 'Hak Akses Penuh' : 'Hak Baca / Monitoring'}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        {currentUser.role === 'admin' 
                          ? 'Anda memiliki wewenang mengelola data ambalan, anggota, keuangan, serta mengotorisasi email pengawas.' 
                          : 'Akses terbatas untuk memantau data perkembangan ambalan secara transparan tanpa izin ubah data.'}
                      </p>
                    </div>

                    {/* Admin Shortcut: Kelola Akun Pengawas */}
                    {currentUser.role === 'admin' && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('pengawas_manager');
                            setIsAccountMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-center space-x-2 p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer border border-indigo-200"
                        >
                          <UserCheck className="w-4 h-4 text-indigo-600" />
                          <span>Kelola Akun Pengawas (Email Google)</span>
                        </button>
                      </div>
                    )}

                    {/* Logout Button */}
                    <div className="pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer border border-rose-200"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>Keluar dari Akun (Logout)</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Menu Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
            
            <aside className="relative flex flex-col w-64 bg-indigo-950 text-white h-full border-r border-indigo-950 p-5 space-y-4 animate-slide-in">
              <div className="flex items-center justify-between pb-4 border-b border-indigo-900">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 bg-white/10 rounded-lg p-1 overflow-hidden flex items-center justify-center shrink-0">
                    <img 
                      src={logoImage} 
                      alt="Logo Pramuka Bakti Idhata" 
                      className="w-full h-full object-contain" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <span className="font-black text-xs uppercase tracking-wider block leading-none">SI-Pramuka</span>
                    <span className="text-[9px] text-indigo-300 font-extrabold block mt-1 leading-none">SMK Bakti Idhata</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-indigo-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Active User Card */}
              <div className="p-3 bg-indigo-900/50 rounded-2xl border border-indigo-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-300">Sesi Terverifikasi</span>
                  <span className="text-[8px] bg-black/30 px-1.5 py-0.5 rounded text-indigo-200 uppercase font-bold">
                    {currentUser.role === 'admin' ? 'Admin' : 'Pengawas'}
                  </span>
                </div>
                <p className="text-xs font-black text-white truncate">{currentUser.nama}</p>
                <p className="text-[10px] text-indigo-200/80 truncate">{currentUser.jabatan}</p>

                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('pengawas_manager');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full mt-1 flex items-center justify-center space-x-1.5 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    <UserCheck className="w-3 h-3 text-indigo-300" />
                    <span>Kelola Pengawas</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full mt-1 flex items-center justify-center space-x-1.5 py-1.5 bg-rose-900/60 hover:bg-rose-900 text-rose-200 rounded-lg text-[10px] font-bold border border-rose-800/60 cursor-pointer transition"
                >
                  <LogOut className="w-3 h-3 text-rose-300" />
                  <span>Keluar dari Akun (Logout)</span>
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto space-y-1">
                {menuItems
                  .filter((item) => !item.adminOnly || currentUser.role === 'admin')
                  .map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? 'bg-indigo-600 text-white'
                            : 'text-indigo-200 hover:bg-indigo-900/40 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
              </nav>

              {!isReadOnly ? (
                <button
                  onClick={() => {
                    handleResetData();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-900/40 hover:bg-indigo-900 text-[10px] text-indigo-300 font-black py-2 rounded-xl transition cursor-pointer"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>RESET DATABASE</span>
                </button>
              ) : (
                <div className="text-center py-2 text-[10px] text-indigo-300/60 font-bold">
                  Mode Pengawas Aktif
                </div>
              )}
            </aside>
          </div>
        )}

        {/* 3. SCROLLABLE CONTENT BODY */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* Mode Pengawas Info Banner */}
          {isReadOnly && (
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-fade-in">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-900">Mode Pengawas Aktif</span>
                    <span className="text-[10px] bg-amber-200/80 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">Hanya Lihat</span>
                  </div>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Anda masuk sebagai <strong>{currentUser.nama}</strong> ({currentUser.jabatan}). Seluruh data ambalan, absensi, SKU, kas, dan inventaris dapat dipantau dan diunduh secara transparan tanpa izin modifikasi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen(true)}
                className="self-start sm:self-center px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-2xs"
              >
                Ganti Akun
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardOverview
              siswa={siswa}
              kehadiran={kehadiran}
              materi={materi}
              sku={sku}
              tabungan={tabungan}
              kedisiplinan={kedisiplinan}
              onNavigate={(tab) => setActiveTab(tab)}
              skuDefs={skuDefs}
              onOpenBackupModal={() => setIsBackupModalOpen(true)}
            />
          )}

          {activeTab === 'siswa' && (
            <SiswaCRUD
              siswa={siswa}
              kehadiran={kehadiran}
              materi={materi}
              sku={sku}
              kedisiplinan={kedisiplinan}
              tabungan={tabungan}
              onAdd={handleAddSiswa}
              onAddMultiple={handleAddMultipleSiswa}
              onUpdate={handleUpdateSiswa}
              onDelete={handleDeleteSiswa}
              classList={classList}
              selectedSiswaId={selectedSiswaForDetail}
              onClearSelectedSiswa={() => setSelectedSiswaForDetail(null)}
              tahunAjaranList={tahunAjaranList}
              onSyncTahunAjaranList={handleSyncTahunAjaranList}
              onAddKedisiplinan={handleAddKedisiplinan}
              onDeleteKedisiplinan={handleDeleteKedisiplinan}
              onBatchRollover={handleBatchRollover}
              readOnly={isReadOnly}
            />
          )}

          {activeTab === 'kelas' && (
            <KelasManager
              kelas={classList}
              siswa={siswa}
              onAdd={handleAddKelas}
              onUpdate={handleUpdateKelas}
              onDelete={handleDeleteKelas}
              readOnly={isReadOnly}
            />
          )}

          {activeTab === 'dewan_ambalan' && (
            <DewanAmbalanManager
              dewanList={dewanAmbalan}
              siswa={siswa}
              onAddDewan={handleAddDewan}
              onUpdateDewan={handleUpdateDewan}
              onDeleteDewan={handleDeleteDewan}
              onResetOfficial={handleResetDewanToOfficial}
              readOnly={isReadOnly}
            />
          )}

          {activeTab === 'absensi' && (
            <KehadiranManager
              kehadiran={kehadiran}
              siswa={siswa}
              onSaveBatch={handleSaveKehadiranBatch}
              readOnly={isReadOnly}
            />
          )}

          {activeTab === 'absensi_qr' && (
            <AbsensiQRManager
              events={kegiatanEvents}
              siswa={siswa}
              kehadiran={kehadiran}
              sku={sku}
              skuDefs={skuDefs}
              skkRecords={skkRecords}
              skkDefs={skkDefs}
              onAddEvent={handleAddKegiatanEvent}
              onUpdateEvent={handleUpdateKegiatanEvent}
              onRecordAttendance={handleRecordAttendanceFromQR}
              onVerifySKU={handleVerifySKU}
              onUpdateSiswa={handleUpdateSiswa}
              readOnly={isReadOnly}
              onOpenPublicPortal={() => setIsPublicPresensi(true)}
            />
          )}

          {activeTab === 'sku' && (
            <SKUManager
              sku={sku}
              siswa={siswa}
              skuDefs={skuDefs}
              onVerify={handleVerifySKU}
              onUnverify={handleUnverifySKU}
              onAddSkuDef={handleAddSkuDef}
              onUpdateSkuDef={handleUpdateSkuDef}
              onDeleteSkuDef={handleDeleteSkuDef}
              readOnly={isReadOnly}
            />
          )}

          {activeTab === 'skk' && (
            <SKKManager
              siswa={siswa}
              skkDefs={skkDefs}
              skkRecords={skkRecords}
              onVerifySKK={handleVerifySKK}
              onUnverifySKK={handleUnverifySKK}
              onAddSKKDef={handleAddSKKDef}
              readOnly={isReadOnly}
            />
          )}

          {activeTab === 'inventaris' && (
            <InventarisLogistikManager
              inventaris={inventaris}
              peminjaman={peminjaman}
              onAddBarang={handleAddBarang}
              onUpdateBarang={handleUpdateBarang}
              onDeleteBarang={handleDeleteBarang}
              onAddPeminjaman={handleAddPeminjaman}
              onKembalikanBarang={handleKembalikanBarang}
              readOnly={isReadOnly}
            />
          )}

          {activeTab === 'elibrary' && (
            <ELibraryMateriManager
              modulMateri={modulMateri}
              silabus={silabus}
              onAddModul={handleAddModul}
              onAddSilabus={handleAddSilabus}
              onUpdateSilabus={handleUpdateSilabus}
              readOnly={isReadOnly}
            />
          )}

          {activeTab === 'kas' && (
            <KeuanganKasManager
              kas={kas}
              onAddKas={handleAddKas}
              onDeleteKas={handleDeleteKas}
              readOnly={isReadOnly}
            />
          )}

          {activeTab === 'materi' && (
            <MateriCRUD
              materi={materi}
              siswa={siswa}
              onAdd={handleAddMateri}
              onUpdate={handleUpdateMateri}
              onDelete={handleDeleteMateri}
              onUpdateNilai={handleUpdateNilaiMateri}
              readOnly={isReadOnly}
            />
          )}

          {activeTab === 'tabungan' && (
            <TabunganManager
              tabungan={tabungan}
              siswa={siswa}
              onAdd={handleAddTabungan}
              onDelete={handleDeleteTabungan}
              readOnly={isReadOnly}
            />
          )}

          {activeTab === 'kedisiplinan' && (
            <KedisiplinanManager
              kedisiplinan={kedisiplinan}
              siswa={siswa}
              onAdd={handleAddKedisiplinan}
              onDelete={handleDeleteKedisiplinan}
              readOnly={isReadOnly}
            />
          )}

          {activeTab === 'jurnal' && (
            <JurnalPembina
              jurnal={jurnal}
              materi={materi}
              onAdd={handleAddJurnal}
              onDelete={handleDeleteJurnal}
              readOnly={isReadOnly}
            />
          )}

          {activeTab === 'nilai' && (
            <NilaiManager
              siswa={siswa}
              kehadiran={kehadiran}
              materi={materi}
              sku={sku}
              skuDefs={skuDefs}
              classList={classList}
            />
          )}

          {activeTab === 'google_drive' && (
            <GoogleDriveBackup
              siswa={siswa}
              kehadiran={kehadiran}
              materi={materi}
              sku={sku}
              tabungan={tabungan}
              kedisiplinan={kedisiplinan}
              jurnal={jurnal}
              skuDefs={skuDefs}
              kelas={classList}
              skkDefs={skkDefs}
              skkRecords={skkRecords}
              kegiatanEvents={kegiatanEvents}
              inventaris={inventaris}
              peminjaman={peminjaman}
              modulMateri={modulMateri}
              silabus={silabus}
              kas={kas}
              dewanAmbalan={dewanAmbalan}
              onRestore={handleRestoreAllData}
              readOnly={isReadOnly}
            />
          )}

          {activeTab === 'source_code' && (
            <CodeViewer />
          )}

          {activeTab === 'pengawas_manager' && currentUser.role === 'admin' && (
            <PengawasAccountManager
              currentUser={currentUser}
              accounts={pengawasAccounts}
              onAddAccount={handleAddPengawas}
              onUpdateAccount={handleUpdatePengawas}
              onDeleteAccount={handleDeletePengawas}
            />
          )}
        </main>
      </div>

      {/* Global Quick Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        siswa={siswa}
        kehadiran={kehadiran}
        materi={materi}
        sku={sku}
        tabungan={tabungan}
        kedisiplinan={kedisiplinan}
        jurnal={jurnal}
        skuDefs={skuDefs}
        kelas={classList}
        skkDefs={skkDefs}
        skkRecords={skkRecords}
        kegiatanEvents={kegiatanEvents}
        inventaris={inventaris}
        peminjaman={peminjaman}
        modulMateri={modulMateri}
        silabus={silabus}
        kas={kas}
        dewanAmbalan={dewanAmbalan}
        onRestore={handleRestoreAllData}
        readOnly={isReadOnly}
      />
    </div>
  );
}
