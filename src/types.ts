export type StatusSiklus = 'Calon Penegak' | 'Penegak Aktif' | 'Purna Ambalan' | 'Non-Aktif' | 'Dewan Kehormatan / Alumni' | 'Dewan Ambalan Aktif';

export interface RiwayatAkademik {
  tahun_ajaran: string; // e.g. "TA. 2024-2025"
  kelas: string;        // e.g. "X RPL 1"
  status_siklus?: StatusSiklus;
  status_aktif?: boolean;
  tanggal_tercatat?: string;
  catatan?: string;
}

export interface Siswa {
  id: string;
  nama_lengkap: string;
  kelas: string;
  nis: string; // 4-digit NIS
  nisn?: string; // NIS Murid Anggota
  nis_murid_anggota?: string; // Alias for NIS Murid Anggota
  email_sekolah?: string; // School Google Workspace / email
  tahun_ajaran?: string; // e.g. "TA. 2024-2025", "TA. 2025-2026", "TA. 2026-2027"
  status_aktif: boolean;
  status_pelantikan?: string;
  tanggal_pelantikan?: string;
  status_siklus?: StatusSiklus; // Lifecycle status for rollover management
  tahun_lulus?: string; // Year of graduation (for alumni / purna ambalan)
  jabatan_ambalan?: string; // e.g. "Pradana", "Kerani", "Anggota Sangga"
  riwayat_kelas?: RiwayatAkademik[]; // Historical records per academic year
  deleted?: boolean;
  is_deleted?: boolean;
  deleted_at?: string;
  tombstone?: boolean;
}

export interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  isOnline: boolean;
}

export interface TahunAjaran {
  id: string;
  nama: string; // e.g. "TA. 2024-2025"
  is_aktif?: boolean;
}

export type StatusKehadiran = 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';

export interface Kehadiran {
  id: string;
  siswa_id: string;
  tanggal: string;
  status: StatusKehadiran;
  keterangan: string;
  metode?: 'Manual' | 'QR Code' | 'Geo-Tagging';
  kegiatan_event_id?: string;
  jam_absen?: string;
  lokasi_koordinat?: string;
}

export type KategoriMateri = 'Umum' | 'Tekpram' | 'Karakter';
export type StatusMateri = 'Selesai' | 'Direncanakan';

export interface Materi {
  id: string;
  judul_materi: string;
  kategori: KategoriMateri;
  tanggal_pelaksanaan: string;
  status: StatusMateri;
  nilai_evaluasi: Record<string, number>; // key: siswa_id, value: score 0-100
}

export interface SKU {
  id: string;
  siswa_id: string;
  no_item_sku: number; // 1-23
  tanggal_lulus: string;
  status_verifikasi: boolean;
  tingkat?: 'Bantara' | 'Laksana'; // Optional/defaulting for backward compatibility
  pembina_verifikator?: string;
}

export interface SKUItemDef {
  id: string;
  no_item: number;
  deskripsi: string;
  tingkat: 'Bantara' | 'Laksana';
}

// --- SKK (Syarat Kecakapan Khusus) ---
export type TingkatSKK = 'Purwa' | 'Madya' | 'Utama';
export type BidangSKK = 'Agama & Mental' | 'Patriotisme & Seni' | 'Ketangkasan & Kesehatan' | 'Keterampilan & Pembangunan' | 'Sosial & Gotong Royong';

export interface SKKDef {
  id: string;
  kode: string; // e.g. "SKK-01"
  nama: string; // e.g. "Berkemah", "Juru Masak", "P3K", "Pengatur Ruangan"
  bidang: BidangSKK;
  deskripsi: string;
  warna_badge?: string;
  icon?: string;
}

export interface SKKRecord {
  id: string;
  siswa_id: string;
  skk_def_id: string;
  tingkat: TingkatSKK;
  tanggal_lulus: string;
  pembina_verifikator: string;
  status_verifikasi: boolean;
  catatan_penguji?: string;
}

// --- Absensi QR Code & Kegiatan ---
export interface KegiatanEvent {
  id: string;
  nama_kegiatan: string;
  kategori: 'Latihan Rutin' | 'Perkemahan' | 'Giat Prestasi' | 'Bakti Sosial' | 'Apel & Upacara';
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  lokasi: string;
  lat?: number;
  lng?: number;
  radius_meter?: number;
  qr_token: string;
  is_active: boolean;
  deskripsi?: string;
  target_tingkat?: 'Semua Tingkat' | 'Bantara' | 'Laksana';
  terkait_sku_no?: number;
}

// --- Inventaris & Logistik Ambalan ---
export interface BarangInventaris {
  id: string;
  kode_barang: string;
  nama_barang: string;
  kategori: 'Tenda & Berkemah' | 'Pionering & Tali' | 'Komunikasi & Sandi' | 'Dapur & Masak' | 'P3K & Medis' | 'Atribut & Seragam';
  jumlah_total: number;
  jumlah_tersedia: number;
  kondisi_baik: number;
  kondisi_rusak: number;
  lokasi_rak: string;
  foto_url?: string;
  keterangan?: string;
}

export interface PeminjamanLogistik {
  id: string;
  barang_id: string;
  nama_peminjam: string;
  sangga_atau_kelas: string;
  jumlah_pinjam: number;
  tanggal_pinjam: string;
  tanggal_kembali_target: string;
  tanggal_kembali_aktual?: string;
  status: 'Dipinjam' | 'Kembali' | 'Terlambat';
  kondisi_kembali?: 'Baik' | 'Ada Kerusakan';
  catatan?: string;
}

// --- E-Library Materi Digital & Silabus ---
export interface ModulMateri {
  id: string;
  judul: string;
  kategori: 'Sandi' | 'Simpul & Ikatan' | 'Navigasi Darat' | 'PPGD / P3K' | 'Sejarah & Organisasi' | 'Teknik Kepramukaan';
  ringkasan: string;
  konten_lengkap: string;
  tingkat_rekomendasi: 'Semua Tingkat' | 'Penegak Bantara' | 'Penegak Laksana';
  icon_name?: string;
}

export interface SilabusLatihan {
  id: string;
  minggu_ke: number;
  bulan: string;
  topik_utama: string;
  tujuan: string;
  skenario: string;
  pj_instruktur: string;
  is_selesai?: boolean;
}

// --- Keuangan & Buku Kas Ambalan ---
export interface KasAmbalan {
  id: string;
  tanggal: string;
  tipe: 'Pemasukan' | 'Pengeluaran';
  kategori: string;
  jumlah: number;
  deskripsi: string;
  pj_bendahara: string;
  nomor_bukti?: string;
  keterangan?: string;
}
export type TransaksiKas = KasAmbalan;

// --- Struktur Gugus Depan & Majelis Pembimbing (Mabigus) ---
export interface MabigusMember {
  jabatan: string; // e.g. "Ketua", "Wakil Ketua", "Sekretaris", "Bendahara", "Anggota 1", "Ketua Gugusdepan Putra (Ex-Officio)"
  nama: string;    // e.g. "Machfud Yachya, M. Pd"
  instansi_jabatan: string; // e.g. "Ketua Yayasan Bakti Idhata", "Kepala SMK Bakti Idhata"
  is_ex_officio?: boolean;
}

export interface GudepMember {
  jabatan: string; // e.g. "Ketua Gugusdepan", "Sekretaris", "Pembina Satuan", etc.
  nama: string;    // e.g. "Dhenny Effendi, S. Pd"
  keterangan: string; // e.g. "Wakil Kepala Sekolah Bid. Kesiswaan"
  nomor_gudep?: string; // e.g. "06.193", "06.194"
  ambalan?: string; // e.g. "Ambalan Ki Hajar Dewantara", "Ambalan Dewi Sartika"
  is_ex_officio?: boolean;
}

// --- Kepengurusan Dewan Ambalan Periodik ---
export interface SusunanPengurusDewan {
  siswa_id: string;
  nama: string;
  jabatan: string;
  kelas: string;
  divisi?: string; // 'Dewan Kehormatan' | 'Pemangku Adat' | 'Penegak Pradana' | 'Pradana' | 'Wakil Pradana' | 'Krani' | 'Bendahara' | 'Giatop' | 'Tekram';
  is_staff?: boolean;
  tugas_pokok?: string;
  jenis_kelamin?: 'L' | 'P';
}

export interface DewanAmbalan {
  id: string;
  periode: string; // e.g. "2026/2027", "2025/2026"
  tahun_ajaran?: string; // e.g. "TA. 2026-2027"
  is_active: boolean;
  is_aktif?: boolean;
  nama_ambalan?: string;
  nomor_gudep_putra?: string; // "06.193"
  ambalan_putra?: string;     // "Ambalan Ki Hajar Dewantara"
  nomor_gudep_putri?: string; // "06.194"
  ambalan_putri?: string;     // "Ambalan Dewi Sartika"
  pembina_satuan_putra?: string; // "Kak Sultan Haidar Basyar, S. Pd"
  pembina_satuan_putri?: string; // "Kak Jihan Fadhilah, S. Kom"
  pembina_gudep?: string;
  mabigus?: MabigusMember[];
  gudep_putra?: GudepMember[];
  gudep_putri?: GudepMember[];
  dewan_kehormatan?: string[];
  pemangku_adat_putra: string;
  pemangku_adat_putri: string;
  staff_pemangku_adat?: string[];
  penegak_pradana_putra?: string;
  penegak_pradana_putri?: string;
  staff_penegak_pradana?: string[];
  pradana_putra: string;
  pradana_putri: string;
  staff_pradana?: string[];
  wakil_pradana_putra?: string;
  wakil_pradana_putri?: string;
  staff_wakil_pradana?: string[];
  kerani: string;
  kerani_putri?: string;
  staff_krani?: string[];
  bankir: string;
  bendahara_2?: string;
  giatop_putri?: string;
  giatop_putra?: string;
  staff_giatop?: string[];
  tekram_list?: string[];
  staff_tekram?: string[];
  visi_misi: string;
  susunan_pengurus: SusunanPengurusDewan[];
  seksi_giatops?: string;
  seksi_sarpras?: string;
  seksi_kajian?: string;
  tanggal_sertijab?: string;
  catatan_sertijab?: string;
}
export type PeriodeDewanAmbalan = DewanAmbalan;

export interface Tabungan {
  id: string;
  siswa_id: string;
  tanggal: string;
  jumlah: number;
  jenis: 'Wajib' | 'Sukarela';
  keterangan: string;
}

export interface Kedisiplinan {
  id: string;
  siswa_id: string;
  tanggal: string;
  tipe: 'Prestasi' | 'Pelanggaran';
  keterangan: string;
  poin: number; // Positive for reward, negative or positive impact
}

export interface JurnalFile {
  name: string;
  url: string;
  fileId?: string;
}

export interface Jurnal {
  id: string;
  tanggal: string;
  judul_kegiatan: string;
  materi_id: string;
  pembina_nama: string;
  evaluasi_ringkas: string;
  lampiran?: JurnalFile[];
  foto?: string;
}

export interface Kelas {
  id: string;
  nama: string;
}

export interface NilaiAkhir {
  siswa_id: string;
  persen_kehadiran: number;
  skor_kehadiran: number; // 30%
  skor_materi: number; // 30%
  skor_sku: number; // 40% (based on Bantara/Laksana average completion)
  sku_lulus: number; // count of Bantara
  sku_laksana_lulus: number; // count of Laksana
  nilai_total: number;
  predikat: 'A' | 'B' | 'C' | 'D';
}

export type UserRole = 'admin' | 'viewer';

export interface UserProfile {
  id: string;
  username: string;
  password?: string;
  nama: string;
  email: string;
  jabatan: string;
  role: UserRole;
  inisial: string;
  keteranganAkses: string;
  avatarColor: string;
}

export interface PengawasAccount {
  id: string;
  nama: string;
  email: string; // Personal Google Email or school email
  username?: string; // Optional custom username for manual login
  password?: string; // Optional custom password for manual login
  jabatan: string;
  role?: UserRole; // 'admin' | 'viewer' (default 'viewer')
  tanggalDitambahkan: string;
  ditambahkanOleh?: string;
  isActive: boolean;
  avatarColor?: string;
}

export const DEFAULT_PENGAWAS_ACCOUNTS: PengawasAccount[] = [
  {
    id: 'pengawas_dhenny',
    nama: 'Bapak Dhenny Effendi, S. Pd',
    email: 'dhenny.effendi@smkbaktiidhata.sch.id',
    username: 'kurikulum',
    password: 'kurikulum123',
    jabatan: 'Wakil Kepala Sekolah Bidang Kurikulum',
    role: 'viewer',
    tanggalDitambahkan: '2024-01-10',
    ditambahkanOleh: 'Kak Jihan Fadhilah, S. Kom (jihanminho8@gmail.com)',
    isActive: true,
    avatarColor: 'bg-amber-600 text-white'
  },
  {
    id: 'pengawas_sarah',
    nama: 'Ibu Sarah Nur Amalia, S. Pd',
    email: 'sarah.amalia@smkbaktiidhata.sch.id',
    username: 'ekskul',
    password: 'ekskul123',
    jabatan: 'Pembina Ekstrakulikuler',
    role: 'viewer',
    tanggalDitambahkan: '2024-01-10',
    ditambahkanOleh: 'Kak Jihan Fadhilah, S. Kom (jihanminho8@gmail.com)',
    isActive: true,
    avatarColor: 'bg-rose-600 text-white'
  }
];

export const OFFICIAL_ACCOUNTS: UserProfile[] = [
  {
    id: 'acc_pembina',
    username: 'pembina',
    password: 'pembina123',
    nama: 'Kak Jihan Fadhilah, S. Kom',
    email: 'jihanminho8@gmail.com',
    jabatan: 'Pembina Pramuka Gugus Depan',
    role: 'admin',
    inisial: 'JF',
    keteranganAkses: 'Akses Admin Penuh (Dapat mengedit semua fitur dan mengelola seluruh data)',
    avatarColor: 'bg-indigo-600 text-white'
  },
  {
    id: 'acc_wakasek_kurikulum',
    username: 'kurikulum',
    password: 'kurikulum123',
    nama: 'Bapak Dhenny Effendi, S. Pd',
    email: 'dhenny.effendi@smkbaktiidhata.sch.id',
    jabatan: 'Wakil Kepala Sekolah Bidang Kurikulum',
    role: 'viewer',
    inisial: 'DE',
    keteranganAkses: 'Akses Pengawas Kurikulum (Dapat melihat semua data tanpa bisa mengubah)',
    avatarColor: 'bg-amber-600 text-white'
  },
  {
    id: 'acc_pembina_ekskul',
    username: 'ekskul',
    password: 'ekskul123',
    nama: 'Ibu Sarah Nur Amalia, S. Pd',
    email: 'sarah.amalia@smkbaktiidhata.sch.id',
    jabatan: 'Pembina Ekstrakulikuler',
    role: 'viewer',
    inisial: 'SA',
    keteranganAkses: 'Akses Pembina Ekstrakulikuler (Dapat melihat semua data tanpa bisa mengubah)',
    avatarColor: 'bg-rose-600 text-white'
  }
];

