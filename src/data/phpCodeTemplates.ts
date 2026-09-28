export interface PHPFile {
  filename: string;
  language: string;
  description: string;
  content: string;
}

export const phpCodeTemplates: PHPFile[] = [
  {
    filename: "schema.sql",
    language: "sql",
    description: "Skema DDL Basis Data MySQL dengan Relasi Foreign Key dan Cascade Delete.",
    content: `-- CREATE DATABASE pramuka_smk_bakti_idhata;
-- USE pramuka_smk_bakti_idhata;

-- 1. Tabel Siswa
CREATE TABLE IF NOT EXISTS siswa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_lengkap VARCHAR(150) NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    nis VARCHAR(10) NOT NULL UNIQUE,
    tahun_ajaran VARCHAR(30) DEFAULT 'TA. 2024-2025',
    status_aktif TINYINT(1) DEFAULT 1,
    status_pelantikan VARCHAR(50) DEFAULT 'Calon Penegak',
    tanggal_pelantikan DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabel Kehadiran (Relasi One-to-Many ke Siswa)
CREATE TABLE IF NOT EXISTS kehadiran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    tanggal DATE NOT NULL,
    status ENUM('Hadir', 'Izin', 'Sakit', 'Alpa') NOT NULL,
    keterangan VARCHAR(255) NULL,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel Materi Pramuka
CREATE TABLE IF NOT EXISTS materi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    judul_materi VARCHAR(200) NOT NULL,
    kategori ENUM('Umum', 'Tekpram', 'Karakter') NOT NULL,
    tanggal_pelaksanaan DATE NOT NULL,
    status ENUM('Selesai', 'Direncanakan') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel Nilai Evaluasi Materi (Menghubungkan Siswa dengan Materi)
CREATE TABLE IF NOT EXISTS nilai_materi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    materi_id INT NOT NULL,
    siswa_id INT NOT NULL,
    nilai INT NOT NULL CHECK (nilai >= 0 AND nilai <= 100),
    FOREIGN KEY (materi_id) REFERENCES materi(id) ON DELETE CASCADE,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    UNIQUE KEY unique_siswa_materi (materi_id, siswa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabel Syarat Kecakapan Umum (SKU)
-- No Item SKU bernilai 1-23 untuk Bantara/Laksana
CREATE TABLE IF NOT EXISTS sku (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    no_item_sku INT NOT NULL CHECK (no_item_sku >= 1 AND no_item_sku <= 23),
    tanggal_lulus DATE NOT NULL,
    status_verifikasi TINYINT(1) DEFAULT 0,
    pembina_verifikator VARCHAR(100) NOT NULL,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
    UNIQUE KEY unique_siswa_sku (siswa_id, no_item_sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabel Tabungan Anggota
CREATE TABLE IF NOT EXISTS tabungan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    tanggal DATE NOT NULL,
    jumlah DECIMAL(10,2) NOT NULL,
    jenis ENUM('Wajib', 'Sukarela') NOT NULL,
    keterangan VARCHAR(255) NULL,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabel Kedisiplinan (Poin Pelanggaran & Prestasi)
CREATE TABLE IF NOT EXISTS kedisiplinan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    tanggal DATE NOT NULL,
    tipe ENUM('Prestasi', 'Pelanggaran') NOT NULL,
    keterangan VARCHAR(255) NOT NULL,
    poin INT NOT NULL,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tabel Jurnal Kegiatan Pembina
CREATE TABLE IF NOT EXISTS jurnal_pembina (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tanggal DATE NOT NULL,
    judul_kegiatan VARCHAR(255) NOT NULL,
    materi_id INT NULL,
    pembina_nama VARCHAR(150) NOT NULL,
    evaluasi_ringkas TEXT NOT NULL,
    foto LONGTEXT NULL,
    FOREIGN KEY (materi_id) REFERENCES materi(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`
  },
  {
    filename: "koneksi.php",
    language: "php",
    description: "Koneksi Database MySQL menggunakan PDO (PHP Data Objects) yang Aman.",
    content: `<?php
/**
 * File: koneksi.php
 * Deskripsi: Mengatur koneksi database menggunakan PDO dengan penanganan error yang aman.
 */

$host = 'localhost';
$dbname = 'pramuka_smk_bakti_idhata';
$username = 'root';
$password = ''; // Ganti sesuai dengan password server database Anda
$charset = 'utf8mb4';

// Konfigurasi DSN (Data Source Name)
$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

// Konfigurasi opsi PDO untuk keamanan dan kompatibilitas
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Mengaktifkan throwing error exceptions
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Fetch default mengembalikan array asosiatif
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Menonaktifkan emulasi, menggunakan query native real prepared statements
];

try {
    // Inisialisasi object koneksi PDO
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    // Hindari mengekspos detail kredensial sistem ketika error terjadi
    die("Koneksi ke database gagal. Silakan hubungi Administrator Sistem. <br> Detail: " . htmlspecialchars($e->getMessage()));
}
?>`
  },
  {
    filename: "hitung_nilai.php",
    language: "php",
    description: "Fungsi Analisis Nilai Akhir Otomatis dengan Bobot Variabel (30-30-40).",
    content: `<?php
/**
 * File: hitung_nilai.php
 * Deskripsi: Mengandung logika perhitungan nilai otomatis siswa berdasarkan 3 aspek:
 * 1. Kehadiran (30%): Dihitung dari persentase kehadiran efektif (Hadir / Total).
 * 2. Nilai Evaluasi Materi (30%): Diambil dari rata-rata nilai materi yang diselesaikan.
 * 3. Progres SKU (40%): Dihitung berdasarkan jumlah item SKU (1-23) yang diverifikasi lulus (Item Lulus / 23 * 100).
 */

require_once 'koneksi.php';

function hitungNilaiSiswa($pdo, $siswa_id) {
    // -----------------------------------------------------
    // 1. ASPEK KEHADIRAN (Bobot 30%)
    // -----------------------------------------------------
    $stmt_kehadiran = $pdo->prepare("
        SELECT 
            SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) as jumlah_hadir,
            COUNT(*) as total_pertemuan
        FROM kehadiran 
        WHERE siswa_id = ?
    ");
    $stmt_kehadiran->execute([$siswa_id]);
    $data_hadir = $stmt_kehadiran->fetch();
    
    $total_pertemuan = $data_hadir['total_pertemuan'] ?? 0;
    $jumlah_hadir = $data_hadir['jumlah_hadir'] ?? 0;
    
    // Jika belum ada record kehadiran, asumsikan nilai netral 100 (atau 0 sesuai kebijakan)
    $persen_kehadiran = ($total_pertemuan > 0) ? ($jumlah_hadir / $total_pertemuan) * 100 : 100;
    $skor_kehadiran = $persen_kehadiran * 0.30; // Bobot 30%

    // -----------------------------------------------------
    // 2. ASPEK PENGUASAAN MATERI (Bobot 30%)
    // -----------------------------------------------------
    $stmt_materi = $pdo->prepare("
        SELECT AVG(nilai) as rata_rata_nilai 
        FROM nilai_materi 
        WHERE siswa_id = ?
    ");
    $stmt_materi->execute([$siswa_id]);
    $data_materi = $stmt_materi->fetch();
    
    $rata_rata_nilai = $data_materi['rata_rata_nilai'] ?? 0;
    // Jika belum ada nilai evaluasi, asumsikan default 70 (KKM dasar pramuka) atau 0
    $skor_materi = $rata_rata_nilai * 0.30; // Bobot 30%

    // -----------------------------------------------------
    // 3. ASPEK PROGRES SKU (Bobot 40%)
    // -----------------------------------------------------
    // Total item SKU Penegak Bantara/Laksana adalah 23 item
    $stmt_sku = $pdo->prepare("
        SELECT COUNT(*) as jumlah_sku_lulus 
        FROM sku 
        WHERE siswa_id = ? AND status_verifikasi = 1
    ");
    $stmt_sku->execute([$siswa_id]);
    $data_sku = $stmt_sku->fetch();
    
    $jumlah_sku_lulus = $data_sku['jumlah_sku_lulus'] ?? 0;
    $persen_sku = ($jumlah_sku_lulus / 23) * 100;
    $skor_sku = $persen_sku * 0.40; // Bobot 40%

    // -----------------------------------------------------
    // 4. TOTAL AKHIR & PREDIKAT
    // -----------------------------------------------------
    $nilai_total = round($skor_kehadiran + $skor_materi + $skor_sku, 2);
    
    // Klasifikasi Predikat Kelulusan Pramuka
    $predikat = 'D';
    if ($nilai_total >= 85) {
        $predikat = 'A'; // Istimewa
    } elseif ($nilai_total >= 70) {
        $predikat = 'B'; // Baik / Kompeten
    } elseif ($nilai_total >= 55) {
        $predikat = 'C'; // Cukup
    } else {
        $predikat = 'D'; // Kurang
    }

    return [
        'persen_kehadiran' => round($persen_kehadiran, 1),
        'jumlah_sku_lulus' => $jumlah_sku_lulus,
        'rata_rata_nilai' => round($rata_rata_nilai, 1),
        'skor_kehadiran' => round($skor_kehadiran, 2),
        'skor_materi' => round($skor_materi, 2),
        'skor_sku' => round($skor_sku, 2),
        'nilai_total' => $nilai_total,
        'predikat' => $predikat
    ];
}
?>`
  },
  {
    filename: "index.php",
    language: "php",
    description: "Halaman Dashboard Utama dengan Desain Modern, Statistik, dan Leaderboard SKU.",
    content: `<?php
/**
 * File: index.php
 * Deskripsi: Dashboard utama Pembina Pramuka. Menampilkan statistik ringkasan,
 * grafik kehadiran mingguan (simulasi/rekap), dan daftar siswa progresif.
 */

require_once 'koneksi.php';
require_once 'hitung_nilai.php';

// Ambil Statistik Global
$total_siswa = $pdo->query("SELECT COUNT(*) FROM siswa WHERE status_aktif = 1")->fetchColumn();
$total_materi = $pdo->query("SELECT COUNT(*) FROM materi")->fetchColumn();
$total_sku_verified = $pdo->query("SELECT COUNT(*) FROM sku WHERE status_verifikasi = 1")->fetchColumn();

// Rata-rata Kehadiran Global
$avg_kehadiran = $pdo->query("
    SELECT ROUND((SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) 
    FROM kehadiran
")->fetchColumn() ?? 0;

// Daftar Siswa Paling Progresif SKU
$siswa_progresif = $pdo->query("
    SELECT s.id, s.nama_lengkap, s.kelas, COUNT(k.id) as sku_lulus
    FROM siswa s
    LEFT JOIN sku k ON s.id = k.siswa_id AND k.status_verifikasi = 1
    WHERE s.status_aktif = 1
    GROUP BY s.id
    ORDER BY sku_lulus DESC, s.nama_lengkap ASC
    LIMIT 5
")->fetchAll();

?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Pramuka SMK Bakti Idhata</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 font-sans leading-normal tracking-normal">

    <div class="flex flex-col md:flex-row min-h-screen">
        <!-- Sidebar Navigation -->
        <div class="bg-indigo-900 text-white w-full md:w-64 flex-shrink-0">
            <div class="p-6 border-b border-indigo-800">
                <span class="text-xl font-bold tracking-wider">SI PRAMUKA</span>
                <p class="text-xs text-indigo-300 mt-1">SMK Bakti Idhata</p>
            </div>
            <nav class="mt-6">
                <a href="index.php" class="block py-3 px-6 bg-indigo-800 text-white font-medium border-l-4 border-indigo-400">
                    Dashboard
                </a>
                <a href="siswa.php" class="block py-3 px-6 hover:bg-indigo-800 text-indigo-200 hover:text-white transition duration-200">
                    Data Siswa
                </a>
                <a href="materi.php" class="block py-3 px-6 hover:bg-indigo-800 text-indigo-200 hover:text-white transition duration-200">
                    Materi Latihan
                </a>
                <a href="sku.php" class="block py-3 px-6 hover:bg-indigo-800 text-indigo-200 hover:text-white transition duration-200">
                    Progres SKU
                </a>
            </nav>
        </div>

        <!-- Main Content Area -->
        <div class="flex-1 p-6 md:p-10">
            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200 mb-8">
                <div>
                    <h1 class="text-2xl md:text-3xl font-bold text-gray-800">Sistem Informasi Pramuka Penegak</h1>
                    <p class="text-sm text-gray-500 mt-1">Halaman Dashboard Khusus Pembina Pramuka</p>
                </div>
                <div class="mt-4 md:mt-0 text-sm text-gray-600 font-medium">
                    Hari ini: <?php echo date('d-m-Y'); ?>
                </div>
            </div>

            <!-- Stats Widgets -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                    <div class="p-3 bg-indigo-50 rounded-lg text-indigo-600 mr-4">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </div>
                    <div>
                        <p class="text-xs text-gray-400 font-bold tracking-wider uppercase">Total Siswa</p>
                        <h3 class="text-2xl font-bold text-gray-800"><?php echo $total_siswa; ?></h3>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                    <div class="p-3 bg-emerald-50 rounded-lg text-emerald-600 mr-4">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div>
                        <p class="text-xs text-gray-400 font-bold tracking-wider uppercase">Rata Kehadiran</p>
                        <h3 class="text-2xl font-bold text-gray-800"><?php echo $avg_kehadiran; ?>%</h3>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                    <div class="p-3 bg-amber-50 rounded-lg text-amber-600 mr-4">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    </div>
                    <div>
                        <p class="text-xs text-gray-400 font-bold tracking-wider uppercase">Materi Diajarkan</p>
                        <h3 class="text-2xl font-bold text-gray-800"><?php echo $total_materi; ?></h3>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                    <div class="p-3 bg-rose-50 rounded-lg text-rose-600 mr-4">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    </div>
                    <div>
                        <p class="text-xs text-gray-400 font-bold tracking-wider uppercase">Item SKU Terverifikasi</p>
                        <h3 class="text-2xl font-bold text-gray-800"><?php echo $total_sku_verified; ?></h3>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Leaderboard SKU -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">Siswa Paling Progresif (Top SKU)</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm text-gray-600">
                            <thead>
                                <tr class="border-b border-gray-100 text-gray-400 uppercase text-xs font-bold">
                                    <th class="pb-3">Siswa</th>
                                    <th class="pb-3">Kelas</th>
                                    <th class="pb-3 text-right">SKU Lulus (dari 23)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach($siswa_progresif as $siswa): ?>
                                <tr class="border-b border-gray-50 hover:bg-gray-50">
                                    <td class="py-3 font-semibold text-gray-800"><?php echo htmlspecialchars($siswa['nama_lengkap']); ?></td>
                                    <td class="py-3"><?php echo htmlspecialchars($siswa['kelas']); ?></td>
                                    <td class="py-3 text-right font-bold text-emerald-600"><?php echo $siswa['sku_lulus']; ?> / 23</td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Petunjuk & Hitung Nilai Pramuka -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">Bobot Penilaian Pramuka Penegak</h3>
                    <p class="text-sm text-gray-500 mb-4">Sistem menghitung nilai akhir secara otomatis menggunakan variabel bobot berikut:</p>
                    
                    <div class="space-y-4">
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span class="text-sm font-semibold text-gray-700">Kehadiran (Absensi)</span>
                            <span class="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded">Bobot 30%</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span class="text-sm font-semibold text-gray-700">Evaluasi Materi Pramuka</span>
                            <span class="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded">Bobot 30%</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span class="text-sm font-semibold text-gray-700">Progres Kelulusan SKU (1-23)</span>
                            <span class="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded">Bobot 40%</span>
                        </div>
                    </div>

                    <div class="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                        <h4 class="text-sm font-bold text-indigo-900 mb-1">💡 Pengingat Pembina</h4>
                        <p class="text-xs text-indigo-700">Pastikan untuk memverifikasi kelulusan butir SKU di menu Progres SKU setelah siswa mempraktikkan ujian SKU mereka.</p>
                    </div>
                </div>
            </div>

        </div>
    </div>

</body>
</html>`
  },
  {
    filename: "siswa.php",
    language: "php",
    description: "Modul CRUD Lengkap untuk Manajemen Data Siswa (Prepared Statements & Cascade Protection).",
    content: `<?php
/**
 * File: siswa.php
 * Deskripsi: Manajemen CRUD (Create, Read, Update, Delete) Data Siswa secara aman menggunakan PDO.
 */

require_once 'koneksi.php';

$error = '';
$success = '';

// 1. PROSES SIMPAN / TAMBAH DATA (CREATE) & UPDATE (EDIT)
if (isset($_POST['simpan'])) {
    $id = $_POST['id'] ?? '';
    $nama_lengkap = trim($_POST['nama_lengkap'] ?? '');
    $kelas = trim($_POST['kelas'] ?? '');
    $nisn = trim($_POST['nisn'] ?? '');
    $status_aktif = isset($_POST['status_aktif']) ? 1 : 0;

    // Validasi data tidak boleh kosong
    if (empty($nama_lengkap) || empty($kelas) || empty($nisn)) {
        $error = 'Semua field wajib diisi!';
    } elseif (strlen($nisn) != 10) {
        $error = 'NISN harus berisi tepat 10 digit angka!';
    } else {
        try {
            if (empty($id)) {
                // Proses INSERT (Create)
                // Cek apakah NISN sudah digunakan
                $stmt_cek = $pdo->prepare("SELECT COUNT(*) FROM siswa WHERE nisn = ?");
                $stmt_cek->execute([$nisn]);
                if ($stmt_cek->fetchColumn() > 0) {
                    $error = 'NISN sudah terdaftar di sistem!';
                } else {
                    $stmt_insert = $pdo->prepare("INSERT INTO siswa (nama_lengkap, kelas, nisn, status_aktif) VALUES (?, ?, ?, ?)");
                    $stmt_insert->execute([$nama_lengkap, $kelas, $nisn, $status_aktif]);
                    $success = 'Data siswa berhasil ditambahkan!';
                }
            } else {
                // Proses UPDATE (Edit)
                // Cek NISN unik kecuali untuk siswa yang sedang diedit
                $stmt_cek = $pdo->prepare("SELECT COUNT(*) FROM siswa WHERE nisn = ? AND id != ?");
                $stmt_cek->execute([$nisn, $id]);
                if ($stmt_cek->fetchColumn() > 0) {
                    $error = 'NISN tersebut sudah digunakan oleh siswa lain!';
                } else {
                    $stmt_update = $pdo->prepare("UPDATE siswa SET nama_lengkap = ?, kelas = ?, nisn = ?, status_aktif = ? WHERE id = ?");
                    $stmt_update->execute([$nama_lengkap, $kelas, $nisn, $status_aktif, $id]);
                    $success = 'Data siswa berhasil diperbarui!';
                }
            }
        } catch (PDOException $e) {
            $error = 'Gagal menyimpan data: ' . $e->getMessage();
        }
    }
}

// 2. PROSES HAPUS DATA (DELETE)
if (isset($_GET['hapus'])) {
    $id_hapus = $_GET['hapus'];
    try {
        // Berkat FK 'ON DELETE CASCADE' di skema MySQL, semua data kehadiran, tabungan,
        // nilai, dan SKU yang berhubungan dengan siswa ini akan otomatis dihapus secara aman.
        $stmt_delete = $pdo->prepare("DELETE FROM siswa WHERE id = ?");
        $stmt_delete->execute([$id_hapus]);
        $success = 'Siswa beserta seluruh data terkait berhasil dihapus!';
    } catch (PDOException $e) {
        $error = 'Gagal menghapus siswa: ' . $e->getMessage();
    }
}

// 3. AMBIL DATA SISWA UNTUK DIEDIT (GET BY ID)
$edit_data = null;
if (isset($_GET['edit'])) {
    $id_edit = $_GET['edit'];
    $stmt_edit = $pdo->prepare("SELECT * FROM siswa WHERE id = ?");
    $stmt_edit->execute([$id_edit]);
    $edit_data = $stmt_edit->fetch();
}

// 4. AMBIL SEMUA DATA SISWA
$siswa_list = [];
try {
    $siswa_list = $pdo->query("SELECT * FROM siswa ORDER BY kelas ASC, nama_lengkap ASC")->fetchAll();
} catch (PDOException $e) {
    $error = 'Gagal mengambil data: ' . $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manajemen Siswa - Pramuka Bakti Idhata</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">

    <div class="flex flex-col md:flex-row min-h-screen">
        <!-- Sidebar -->
        <div class="bg-indigo-900 text-white w-full md:w-64 flex-shrink-0">
            <div class="p-6 border-b border-indigo-800">
                <span class="text-xl font-bold tracking-wider">SI PRAMUKA</span>
                <p class="text-xs text-indigo-300 mt-1">SMK Bakti Idhata</p>
            </div>
            <nav class="mt-6">
                <a href="index.php" class="block py-3 px-6 hover:bg-indigo-800 text-indigo-200 hover:text-white transition duration-200">Dashboard</a>
                <a href="siswa.php" class="block py-3 px-6 bg-indigo-800 text-white font-medium border-l-4 border-indigo-400">Data Siswa</a>
                <a href="materi.php" class="block py-3 px-6 hover:bg-indigo-800 text-indigo-200 hover:text-white transition duration-200">Materi Latihan</a>
                <a href="sku.php" class="block py-3 px-6 hover:bg-indigo-800 text-indigo-200 hover:text-white transition duration-200">Progres SKU</a>
            </nav>
        </div>

        <!-- Konten Utama -->
        <div class="flex-1 p-6 md:p-10">
            <h1 class="text-2xl font-bold text-gray-800 mb-6">Manajemen Siswa (Anggota Pramuka)</h1>

            <!-- Notifikasi -->
            <?php if ($error): ?>
                <div class="bg-rose-50 text-rose-700 border border-rose-200 p-4 rounded-lg mb-6 text-sm font-semibold">
                    <?php echo htmlspecialchars($error); ?>
                </div>
            <?php endif; ?>
            <?php if ($success): ?>
                <div class="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-lg mb-6 text-sm font-semibold">
                    <?php echo htmlspecialchars($success); ?>
                </div>
            <?php endif; ?>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Form Input/Edit Siswa -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">
                        <?php echo $edit_data ? 'Edit Data Siswa' : 'Tambah Siswa Baru'; ?>
                    </h3>
                    <form action="siswa.php" method="POST" class="space-y-4">
                        <input type="hidden" name="id" value="<?php echo $edit_data ? $edit_data['id'] : ''; ?>">
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                            <input type="text" name="nama_lengkap" required value="<?php echo $edit_data ? htmlspecialchars($edit_data['nama_lengkap']) : ''; ?>" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Kelas (contoh: XI TKJ 1, XII RPL)</label>
                            <input type="text" name="kelas" required value="<?php echo $edit_data ? htmlspecialchars($edit_data['kelas']) : ''; ?>" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">NISN (10 Digit)</label>
                            <input type="text" name="nisn" required maxlength="10" placeholder="1234567890" value="<?php echo $edit_data ? htmlspecialchars($edit_data['nisn']) : ''; ?>" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                        </div>

                        <div class="flex items-center">
                            <input type="checkbox" name="status_aktif" id="status_aktif" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" <?php echo (!$edit_data || $edit_data['status_aktif'] == 1) ? 'checked' : ''; ?>>
                            <label for="status_aktif" class="ml-2 block text-sm text-gray-700">Siswa Aktif</label>
                        </div>

                        <div class="flex gap-2 pt-2">
                            <button type="submit" name="simpan" class="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700">
                                Simpan Data
                            </button>
                            <?php if ($edit_data): ?>
                                <a href="siswa.php" class="bg-gray-100 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-200">Batal</a>
                            <?php endif; ?>
                        </div>
                    </form>
                </div>

                <!-- Tabel Data Siswa -->
                <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">Daftar Anggota Pramuka</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm text-gray-600">
                            <thead>
                                <tr class="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                                    <th class="p-3">NISN</th>
                                    <th class="p-3">Nama Lengkap</th>
                                    <th class="p-3">Kelas</th>
                                    <th class="p-3">Status</th>
                                    <th class="p-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($siswa_list)): ?>
                                    <tr>
                                        <td colspan="5" class="p-4 text-center text-gray-400">Belum ada data siswa.</td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($siswa_list as $siswa): ?>
                                        <tr class="border-b border-gray-100 hover:bg-gray-50">
                                            <td class="p-3 font-mono"><?php echo htmlspecialchars($siswa['nisn']); ?></td>
                                            <td class="p-3 font-semibold text-gray-800"><?php echo htmlspecialchars($siswa['nama_lengkap']); ?></td>
                                            <td class="p-3"><?php echo htmlspecialchars($siswa['kelas']); ?></td>
                                            <td class="p-3">
                                                <span class="px-2 py-1 text-xs font-bold rounded-full <?php echo $siswa['status_aktif'] ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'; ?>">
                                                    <?php echo $siswa['status_aktif'] ? 'Aktif' : 'Nonaktif'; ?>
                                                </span>
                                            </td>
                                            <td class="p-3 text-center flex justify-center gap-2">
                                                <a href="siswa.php?edit=<?php echo $siswa['id']; ?>" class="text-indigo-600 hover:text-indigo-900 text-xs font-bold bg-indigo-50 px-2.5 py-1.5 rounded-lg">Edit</a>
                                                <a href="siswa.php?hapus=<?php echo $siswa['id']; ?>" onclick="return confirm('Apakah Anda yakin ingin menghapus siswa ini? Seluruh data kehadiran, tabungan, dan SKU terkait akan terhapus otomatis secara permanen!')" class="text-rose-600 hover:text-rose-900 text-xs font-bold bg-rose-50 px-2.5 py-1.5 rounded-lg">Hapus</a>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

</body>
</html>`
  },
  {
    filename: "materi.php",
    language: "php",
    description: "Modul CRUD untuk Materi Pembelajaran Pramuka (Kategori Tekpram, Karakter, dll).",
    content: `<?php
/**
 * File: materi.php
 * Deskripsi: Manajemen CRUD Materi Pembelajaran Pramuka Penegak beserta input nilai evaluasi siswa.
 */

require_once 'koneksi.php';

$error = '';
$success = '';

// 1. PROSES SIMPAN / TAMBAH / EDIT MATERI
if (isset($_POST['simpan_materi'])) {
    $id = $_POST['id'] ?? '';
    $judul_materi = trim($_POST['judul_materi'] ?? '');
    $kategori = $_POST['kategori'] ?? '';
    $tanggal_pelaksanaan = $_POST['tanggal_pelaksanaan'] ?? '';
    $status = $_POST['status'] ?? 'Direncanakan';

    if (empty($judul_materi) || empty($kategori) || empty($tanggal_pelaksanaan)) {
        $error = 'Semua field materi wajib diisi!';
    } else {
        try {
            if (empty($id)) {
                // INSERT
                $stmt = $pdo->prepare("INSERT INTO materi (judul_materi, kategori, tanggal_pelaksanaan, status) VALUES (?, ?, ?, ?)");
                $stmt->execute([$judul_materi, $kategori, $tanggal_pelaksanaan, $status]);
                $success = 'Materi latihan baru berhasil ditambahkan!';
            } else {
                // UPDATE
                $stmt = $pdo->prepare("UPDATE materi SET judul_materi = ?, kategori = ?, tanggal_pelaksanaan = ?, status = ? WHERE id = ?");
                $stmt->execute([$judul_materi, $kategori, $tanggal_pelaksanaan, $status, $id]);
                $success = 'Data materi berhasil diperbarui!';
            }
        } catch (PDOException $e) {
            $error = 'Gagal menyimpan materi: ' . $e->getMessage();
        }
    }
}

// 2. PROSES UPDATE EVALUASI NILAI SISWA (PENGUASAAN MATERI)
if (isset($_POST['simpan_nilai'])) {
    $materi_id = $_POST['materi_id'];
    $nilai_siswa = $_POST['nilai'] ?? []; // Array dengan key: siswa_id, value: skor 0-100

    try {
        $pdo->beginTransaction();
        
        // Hapus nilai lama agar tidak duplikat, lalu ganti baru
        $stmt_delete = $pdo->prepare("DELETE FROM nilai_materi WHERE materi_id = ?");
        $stmt_delete->execute([$materi_id]);

        $stmt_insert = $pdo->prepare("INSERT INTO nilai_materi (materi_id, siswa_id, nilai) VALUES (?, ?, ?)");
        
        foreach ($nilai_siswa as $siswa_id => $nilai) {
            if ($nilai !== '') {
                $nilai_int = intval($nilai);
                if ($nilai_int >= 0 && $nilai_int <= 100) {
                    $stmt_insert->execute([$materi_id, $siswa_id, $nilai_int]);
                }
            }
        }
        
        $pdo->commit();
        $success = 'Nilai evaluasi materi berhasil diperbarui!';
    } catch (PDOException $e) {
        $pdo->rollBack();
        $error = 'Gagal menyimpan nilai evaluasi: ' . $e->getMessage();
    }
}

// 3. PROSES HAPUS MATERI
if (isset($_GET['hapus'])) {
    $id_hapus = $_GET['hapus'];
    try {
        $stmt = $pdo->prepare("DELETE FROM materi WHERE id = ?");
        $stmt->execute([$id_hapus]);
        $success = 'Materi beserta seluruh rekam nilai evaluasi siswa berhasil dihapus!';
    } catch (PDOException $e) {
        $error = 'Gagal menghapus materi: ' . $e->getMessage();
    }
}

// 4. AMBIL DATA MATERI UNTUK EDIT
$edit_materi = null;
if (isset($_GET['edit'])) {
    $id_edit = $_GET['edit'];
    $stmt = $pdo->prepare("SELECT * FROM materi WHERE id = ?");
    $stmt->execute([$id_edit]);
    $edit_materi = $stmt->fetch();
}

// 5. AMBIL SEMUA MATERI
$materi_list = $pdo->query("SELECT * FROM materi ORDER BY tanggal_pelaksanaan DESC")->fetchAll();

// 6. AMBIL SISWA AKTIF UNTUK INPUT NILAI
$siswa_list = $pdo->query("SELECT id, nama_lengkap, kelas FROM siswa WHERE status_aktif = 1 ORDER BY nama_lengkap ASC")->fetchAll();

// 7. JIKA SEDANG MEMBUKA EVALUASI NILAI MATERI TERTENTU
$evaluasi_materi_id = $_GET['evaluasi'] ?? null;
$nilai_terdaftar = [];
$materi_aktif = null;
if ($evaluasi_materi_id) {
    $stmt_materi_aktif = $pdo->prepare("SELECT * FROM materi WHERE id = ?");
    $stmt_materi_aktif->execute([$evaluasi_materi_id]);
    $materi_aktif = $stmt_materi_aktif->fetch();

    if ($materi_aktif) {
        // Ambil nilai yang sudah diinput sebelumnya
        $stmt_nilai = $pdo->prepare("SELECT siswa_id, nilai FROM nilai_materi WHERE materi_id = ?");
        $stmt_nilai->execute([$evaluasi_materi_id]);
        $nilai_terdaftar = $stmt_nilai->fetchAll(PDO::FETCH_KEY_PAIR); // Menghasilkan [siswa_id => nilai]
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Materi Latihan - Pramuka SMK Bakti Idhata</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">

    <div class="flex flex-col md:flex-row min-h-screen">
        <!-- Sidebar -->
        <div class="bg-indigo-900 text-white w-full md:w-64 flex-shrink-0">
            <div class="p-6 border-b border-indigo-800">
                <span class="text-xl font-bold tracking-wider">SI PRAMUKA</span>
                <p class="text-xs text-indigo-300 mt-1">SMK Bakti Idhata</p>
            </div>
            <nav class="mt-6">
                <a href="index.php" class="block py-3 px-6 hover:bg-indigo-800 text-indigo-200 hover:text-white transition duration-200">Dashboard</a>
                <a href="siswa.php" class="block py-3 px-6 hover:bg-indigo-800 text-indigo-200 hover:text-white transition duration-200">Data Siswa</a>
                <a href="materi.php" class="block py-3 px-6 bg-indigo-800 text-white font-medium border-l-4 border-indigo-400">Materi Latihan</a>
                <a href="sku.php" class="block py-3 px-6 hover:bg-indigo-800 text-indigo-200 hover:text-white transition duration-200">Progres SKU</a>
            </nav>
        </div>

        <!-- Konten Utama -->
        <div class="flex-1 p-6 md:p-10">
            <h1 class="text-2xl font-bold text-gray-800 mb-6">Manajemen Materi & Evaluasi</h1>

            <?php if ($error): ?>
                <div class="bg-rose-50 text-rose-700 border border-rose-200 p-4 rounded-lg mb-6 text-sm font-semibold"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            <?php if ($success): ?>
                <div class="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-lg mb-6 text-sm font-semibold"><?php echo htmlspecialchars($success); ?></div>
            <?php endif; ?>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Form Input/Edit Materi -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                    <h3 class="text-lg font-bold text-gray-800 mb-4"><?php echo $edit_materi ? 'Edit Materi Latihan' : 'Tambah Materi Baru'; ?></h3>
                    
                    <form action="materi.php" method="POST" class="space-y-4">
                        <input type="hidden" name="id" value="<?php echo $edit_materi ? $edit_materi['id'] : ''; ?>">
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Judul Materi</label>
                            <input type="text" name="judul_materi" required value="<?php echo $edit_materi ? htmlspecialchars($edit_materi['judul_materi']) : ''; ?>" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                            <select name="kategori" required class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                <option value="Umum" <?php echo ($edit_materi && $edit_materi['kategori'] == 'Umum') ? 'selected' : ''; ?>>Umum</option>
                                <option value="Tekpram" <?php echo ($edit_materi && $edit_materi['kategori'] == 'Tekpram') ? 'selected' : ''; ?>>Teknis Kepramukaan (Tekpram)</option>
                                <option value="Karakter" <?php echo ($edit_materi && $edit_materi['kategori'] == 'Karakter') ? 'selected' : ''; ?>>Karakter / Mental</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Pelaksanaan</label>
                            <input type="date" name="tanggal_pelaksanaan" required value="<?php echo $edit_materi ? $edit_materi['tanggal_pelaksanaan'] : date('Y-m-d'); ?>" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status Pelaksanaan</label>
                            <select name="status" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                <option value="Direncanakan" <?php echo ($edit_materi && $edit_materi['status'] == 'Direncanakan') ? 'selected' : ''; ?>>Direncanakan</option>
                                <option value="Selesai" <?php echo ($edit_materi && $edit_materi['status'] == 'Selesai') ? 'selected' : ''; ?>>Selesai</option>
                            </select>
                        </div>

                        <div class="flex gap-2 pt-2">
                            <button type="submit" name="simpan_materi" class="bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700">Simpan Materi</button>
                            <?php if ($edit_materi): ?>
                                <a href="materi.php" class="bg-gray-100 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-200">Batal</a>
                            <?php endif; ?>
                        </div>
                    </form>
                </div>

                <!-- Daftar Materi Pramuka -->
                <div class="lg:col-span-2 space-y-6">
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">Daftar Materi Latihan Mingguan</h3>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-sm text-gray-600">
                                <thead>
                                    <tr class="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                                        <th class="p-3">Tanggal</th>
                                        <th class="p-3">Judul Materi</th>
                                        <th class="p-3">Kategori</th>
                                        <th class="p-3">Status</th>
                                        <th class="p-3 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($materi_list as $m): ?>
                                        <tr class="border-b border-gray-100 hover:bg-gray-50">
                                            <td class="p-3 font-medium text-xs text-gray-500"><?php echo date('d M Y', strtotime($m['tanggal_pelaksanaan'])); ?></td>
                                            <td class="p-3 font-semibold text-gray-800"><?php echo htmlspecialchars($m['judul_materi']); ?></td>
                                            <td class="p-3">
                                                <span class="px-2.5 py-1 rounded text-xs font-semibold <?php echo $m['kategori']=='Tekpram' ? 'bg-amber-50 text-amber-700' : ($m['kategori']=='Karakter'?'bg-emerald-50 text-emerald-700':'bg-sky-50 text-sky-700'); ?>">
                                                    <?php echo $m['kategori']; ?>
                                                </span>
                                            </td>
                                            <td class="p-3">
                                                <span class="px-2.5 py-1 text-xs font-bold rounded-full <?php echo $m['status']=='Selesai'?'bg-emerald-100 text-emerald-800':'bg-gray-100 text-gray-600'; ?>">
                                                    <?php echo $m['status']; ?>
                                                </span>
                                            </td>
                                            <td class="p-3 text-center flex justify-center gap-1.5">
                                                <?php if($m['status'] == 'Selesai'): ?>
                                                    <a href="materi.php?evalu=<?php echo $m['id']; ?>" class="text-emerald-700 hover:text-emerald-900 text-xs font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg">Evaluasi Nilai</a>
                                                <?php endif; ?>
                                                <a href="materi.php?edit=<?php echo $m['id']; ?>" class="text-indigo-600 hover:text-indigo-900 text-xs font-bold bg-indigo-50 px-2 py-1.5 rounded-lg">Edit</a>
                                                <a href="materi.php?hapus=<?php echo $m['id']; ?>" onclick="return confirm('Hapus materi ini? Seluruh data nilai evaluasi siswa terkait akan ikut terhapus!')" class="text-rose-600 hover:text-rose-900 text-xs font-bold bg-rose-50 px-2 py-1.5 rounded-lg">Hapus</a>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Sub-Panel: Pengisian Nilai Evaluasi Siswa (Hanya tampil jika tombol Evaluasi diklik) -->
                    <?php if ($materi_aktif): ?>
                        <div class="bg-white p-6 rounded-xl shadow-sm border-2 border-emerald-500">
                            <div class="flex justify-between items-center mb-4">
                                <div>
                                    <h3 class="text-lg font-bold text-gray-800">Input Evaluasi Nilai: <?php echo htmlspecialchars($materi_aktif['judul_materi']); ?></h3>
                                    <p class="text-xs text-gray-500">Masukkan nilai pemahaman materi (skala 0 - 100) untuk masing-masing siswa aktif.</p>
                                </div>
                                <a href="materi.php" class="text-xs font-bold text-gray-400 hover:text-gray-600">Sembunyikan Panel ×</a>
                            </div>

                            <form action="materi.php" method="POST">
                                <input type="hidden" name="materi_id" value="<?php echo $materi_aktif['id']; ?>">
                                <div class="max-h-96 overflow-y-auto border border-gray-100 rounded-lg p-2 mb-4 space-y-2">
                                    <?php foreach ($siswa_list as $siswa): ?>
                                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                            <div>
                                                <p class="text-sm font-semibold text-gray-800"><?php echo htmlspecialchars($siswa['nama_lengkap']); ?></p>
                                                <p class="text-xs text-gray-400"><?php echo htmlspecialchars($siswa['kelas']); ?></p>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-xs text-gray-400">Skor:</span>
                                                <input type="number" name="nilai[<?php echo $siswa['id']; ?>]" min="0" max="100" placeholder="Belum dinilai" value="<?php echo isset($nilai_terdaftar[$siswa['id']]) ? $nilai_terdaftar[$siswa['id']] : ''; ?>" class="w-24 border border-gray-300 rounded px-2 py-1 text-center text-sm font-bold focus:ring-2 focus:ring-emerald-500">
                                            </div>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                                <button type="submit" name="simpan_nilai" class="w-full bg-emerald-600 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-emerald-700">Simpan Seluruh Nilai Evaluasi</button>
                            </form>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

</body>
</html>`
  },
  {
    filename: "sku.php",
    language: "php",
    description: "Modul Manajemen Item SKU Pramuka (1-23) & Verifikasi Kelulusan dengan Aman.",
    content: `<?php
/**
 * File: sku.php
 * Deskripsi: Manajemen Pengujian Syarat Kecakapan Umum (SKU) Pramuka Penegak Bantara/Laksana (Item 1-23).
 * Menyediakan form pencatatan kelulusan item per siswa serta log verifikasi pembina.
 */

require_once 'koneksi.php';

$error = '';
$success = '';

// Kumpulan 23 Butir SKU Penegak Bantara singkat (sebagai referensi guru)
$sku_items = [
    1 => "Mampu keagamaan masing-masing & toleransi beragama",
    2 => "Berani menyampaikan pendapat di muka umum",
    3 => "Dapat mengikuti jalannya diskusi dengan baik",
    4 => "Mampu berbahasa asing (minimal bahasa daerah/nasional)",
    5 => "Telah membaca buku undang-undang gerakan pramuka",
    6 => "Mengenal AD & ART Gerakan Pramuka",
    7 => "Dapat menjelaskan sejarah kepramukaan Indonesia & dunia",
    8 => "Dapat menjelaskan lambang gerakan pramuka",
    9 => "Dapat menjelaskan dan mempraktikkan salam pramuka",
    10 => "Dapat menyanyikan lagu kebangsaan Indonesia Raya",
    11 => "Mampu menjelaskan pancasila & tri satya",
    12 => "Membayar iuran pramuka teratur & menabung",
    13 => "Dapat menjelaskan sejarah ASEAN & PBB",
    14 => "Dapat menjelaskan tentang kewirausahaan",
    15 => "Dapat mendaur ulang barang bekas",
    16 => "Dapat menerapkan teknologi informasi",
    17 => "Dapat menjelaskan mitigasi bencana alam",
    18 => "Mengenal organisasi sangga & ambalan",
    19 => "Mampu menggunakan kompas & peta pita",
    20 => "Mampu membuat pioneering kaki tiga",
    21 => "Dapat berenang atau menguasai bela diri",
    22 => "Mampu menjelaskan penyakit menular",
    23 => "Melakukan aktivitas olahraga teratur"
];

// 1. PROSES VERIFIKASI / INPUT KELULUSAN BUTIR SKU SISWA
if (isset($_POST['verifikasi_sku'])) {
    $siswa_id = $_POST['siswa_id'] ?? '';
    $no_item_sku = $_POST['no_item_sku'] ?? '';
    $tanggal_lulus = $_POST['tanggal_lulus'] ?? date('Y-m-d');
    $pembina_verifikator = trim($_POST['pembina_verifikator'] ?? 'Kak Pembina');

    if (empty($siswa_id) || empty($no_item_sku) || empty($pembina_verifikator)) {
        $error = 'Siswa, butir SKU, dan nama pembina verifikator wajib diisi!';
    } else {
        try {
            // Cek apakah item SKU sudah pernah diverifikasi sebelumnya untuk siswa ini
            $stmt_cek = $pdo->prepare("SELECT COUNT(*) FROM sku WHERE siswa_id = ? AND no_item_sku = ?");
            $stmt_cek->execute([$siswa_id, $no_item_sku]);
            
            if ($stmt_cek->fetchColumn() > 0) {
                // Update status verifikasi jika sudah terdaftar
                $stmt_update = $pdo->prepare("UPDATE sku SET tanggal_lulus = ?, pembina_verifikator = ?, status_verifikasi = 1 WHERE siswa_id = ? AND no_item_sku = ?");
                $stmt_update->execute([$tanggal_lulus, $pembina_verifikator, $siswa_id, $no_item_sku]);
                $success = 'Butir SKU berhasil diverifikasi ulang!';
            } else {
                // Insert baru
                $stmt_insert = $pdo->prepare("INSERT INTO sku (siswa_id, no_item_sku, tanggal_lulus, status_verifikasi, pembina_verifikator) VALUES (?, ?, ?, 1, ?)");
                $stmt_insert->execute([$siswa_id, $no_item_sku, $tanggal_lulus, $pembina_verifikator]);
                $success = 'Butir SKU baru berhasil diverifikasi lulus untuk siswa!';
            }
        } catch (PDOException $e) {
            $error = 'Gagal memverifikasi SKU: ' . $e->getMessage();
        }
    }
}

// 2. PROSES BATALKAN VERIFIKASI SKU (HAPUS DATA SKU TERTENTU)
if (isset($_GET['batal_sku'])) {
    $sku_id = $_GET['batal_sku'];
    try {
        $stmt_delete = $pdo->prepare("DELETE FROM sku WHERE id = ?");
        $stmt_delete->execute([$sku_id]);
        $success = 'Verifikasi butir SKU berhasil dibatalkan!';
    } catch (PDOException $e) {
        $error = 'Gagal membatalkan verifikasi: ' . $e->getMessage();
    }
}

// 3. FILTER SISWA AKTIF UNTUK DROPDOWN
$siswa_list = $pdo->query("SELECT id, nama_lengkap, kelas FROM siswa WHERE status_aktif = 1 ORDER BY nama_lengkap ASC")->fetchAll();

// 4. AMBIL SEMUA RIWAYAT SKU YANG SUDAH TERVERIFIKASI
$sku_history = [];
try {
    $sku_history = $pdo->query("
        SELECT k.id, s.nama_lengkap, s.kelas, k.no_item_sku, k.tanggal_lulus, k.pembina_verifikator
        FROM sku k
        JOIN siswa s ON k.siswa_id = s.id
        WHERE k.status_verifikasi = 1
        ORDER BY k.tanggal_lulus DESC, s.nama_lengkap ASC
    ")->fetchAll();
} catch (PDOException $e) {
    $error = 'Gagal memuat riwayat SKU: ' . $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manajemen SKU - Pramuka SMK Bakti Idhata</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">

    <div class="flex flex-col md:flex-row min-h-screen">
        <!-- Sidebar -->
        <div class="bg-indigo-900 text-white w-full md:w-64 flex-shrink-0">
            <div class="p-6 border-b border-indigo-800">
                <span class="text-xl font-bold tracking-wider">SI PRAMUKA</span>
                <p class="text-xs text-indigo-300 mt-1">SMK Bakti Idhata</p>
            </div>
            <nav class="mt-6">
                <a href="index.php" class="block py-3 px-6 hover:bg-indigo-800 text-indigo-200 hover:text-white transition duration-200">Dashboard</a>
                <a href="siswa.php" class="block py-3 px-6 hover:bg-indigo-800 text-indigo-200 hover:text-white transition duration-200">Data Siswa</a>
                <a href="materi.php" class="block py-3 px-6 hover:bg-indigo-800 text-indigo-200 hover:text-white transition duration-200">Materi Latihan</a>
                <a href="sku.php" class="block py-3 px-6 bg-indigo-800 text-white font-medium border-l-4 border-indigo-400">Progres SKU</a>
            </nav>
        </div>

        <!-- Konten Utama -->
        <div class="flex-1 p-6 md:p-10">
            <h1 class="text-2xl font-bold text-gray-800 mb-6">Kelulusan Syarat Kecakapan Umum (SKU)</h1>

            <?php if ($error): ?>
                <div class="bg-rose-50 text-rose-700 border border-rose-200 p-4 rounded-lg mb-6 text-sm font-semibold"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            <?php if ($success): ?>
                <div class="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-lg mb-6 text-sm font-semibold"><?php echo htmlspecialchars($success); ?></div>
            <?php endif; ?>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Form Verifikasi SKU -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">Verifikasi Butir SKU Siswa</h3>
                    
                    <form action="sku.php" method="POST" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Pilih Siswa</label>
                            <select name="siswa_id" required class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                <option value="">-- Pilih Siswa --</option>
                                <?php foreach ($siswa_list as $s): ?>
                                    <option value="<?php echo $s['id']; ?>"><?php echo htmlspecialchars($s['nama_lengkap']); ?> (<?php echo htmlspecialchars($s['kelas']); ?>)</option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Pilih Butir Item SKU (1-23)</label>
                            <select name="no_item_sku" required class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                <option value="">-- Pilih Butir SKU --</option>
                                <?php foreach ($sku_items as $no => $deskripsi): ?>
                                    <option value="<?php echo $no; ?>">Item <?php echo $no; ?>: <?php echo htmlspecialchars($deskripsi); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Verifikasi Lulus</label>
                            <input type="date" name="tanggal_lulus" required value="<?php echo date('Y-m-d'); ?>" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Pembina Verifikator</label>
                            <input type="text" name="pembina_verifikator" required value="Kak Pembina Bakti Idhata" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                        </div>

                        <button type="submit" name="verifikasi_sku" class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm py-2 px-4 rounded-lg transition duration-200">
                            Verifikasi Kelulusan
                        </button>
                    </form>
                </div>

                <!-- Log Riwayat SKU Siswa -->
                <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">Log Riwayat SKU Penegak Bantara Terverifikasi</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm text-gray-600">
                            <thead>
                                <tr class="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                                    <th class="p-3">Siswa</th>
                                    <th class="p-3">Kelas</th>
                                    <th class="p-3 text-center">No Item SKU</th>
                                    <th class="p-3">Deskripsi SKU</th>
                                    <th class="p-3">Tanggal Lulus</th>
                                    <th class="p-3">Verifikator</th>
                                    <th class="p-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($sku_history)): ?>
                                    <tr>
                                        <td colspan="7" class="p-4 text-center text-gray-400">Belum ada butir SKU siswa yang diverifikasi lulus.</td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($sku_history as $hist): ?>
                                        <tr class="border-b border-gray-100 hover:bg-gray-50">
                                            <td class="p-3 font-semibold text-gray-800"><?php echo htmlspecialchars($hist['nama_lengkap']); ?></td>
                                            <td class="p-3 text-xs"><?php echo htmlspecialchars($hist['kelas']); ?></td>
                                            <td class="p-3 text-center"><span class="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-xs">Item <?php echo $hist['no_item_sku']; ?></span></td>
                                            <td class="p-3 text-xs max-w-xs truncate" title="<?php echo htmlspecialchars($sku_items[$hist['no_item_sku']]); ?>">
                                                <?php echo htmlspecialchars($sku_items[$hist['no_item_sku']]); ?>
                                            </td>
                                            <td class="p-3 text-xs text-gray-500"><?php echo date('d M Y', strtotime($hist['tanggal_lulus'])); ?></td>
                                            <td class="p-3 text-xs italic font-medium"><?php echo htmlspecialchars($hist['pembina_verifikator']); ?></td>
                                            <td class="p-3 text-center">
                                                <a href="sku.php?batal_sku=<?php echo $hist['id']; ?>" onclick="return confirm('Apakah Anda yakin ingin membatalkan kelulusan SKU ini?')" class="text-rose-600 hover:text-rose-900 text-xs font-bold bg-rose-50 px-2.5 py-1 rounded-lg">Batal ×</a>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

</body>
</html>`
  },
  {
    filename: "jurnal_filter.php",
    language: "php",
    description: "Modul filter pencarian bulanan untuk Buku Jurnal Latihan Pramuka Pembina secara dinamis.",
    content: `<?php
/**
 * File: jurnal_filter.php
 * Deskripsi: Modul filter bulanan jurnal kegiatan latihan ambalan menggunakan PDO MySQL.
 * Digunakan oleh Kak Jihan Fadhilah, S. Kom untuk menyaring agenda latihan mingguan.
 */
require_once 'koneksi.php';

// Inisialisasi filter bulan (format YYYY-MM)
$bulan_pilihan = isset($_GET['bulan']) ? $_GET['bulan'] : date('Y-m');

// Ambil daftar bulan yang tersedia dari database untuk dropdown filter
try {
    $stmt_bulan = $pdo->query("SELECT DISTINCT DATE_FORMAT(tanggal, '%Y-%m') as bulan_tahun FROM jurnal_pembina ORDER BY bulan_tahun DESC");
    $list_bulan = $stmt_bulan->fetchAll();
} catch (PDOException $e) {
    $list_bulan = [];
}

// Ambil jurnal berdasarkan bulan yang difilter
try {
    $stmt_jurnal = $pdo->prepare("SELECT j.*, m.judul_materi FROM jurnal_pembina j LEFT JOIN materi_pramuka m ON j.materi_id = m.id WHERE DATE_FORMAT(j.tanggal, '%Y-%m') = :bulan ORDER BY j.tanggal DESC");
    $stmt_jurnal->execute(['bulan' => $bulan_pilihan]);
    $jurnals = $stmt_jurnal->fetchAll();
} catch (PDOException $e) {
    $jurnals = [];
    $error = "Gagal mengambil data jurnal: " . $e->getMessage();
}

// Format bulan Indonesia
function formatBulanIndo($yearMonth) {
    if (empty($yearMonth)) return '-';
    $parts = explode('-', $yearMonth);
    if (count($parts) < 2) return $yearMonth;
    $tahun = $parts[0];
    $bulan_num = intval($parts[1]);
    $bulan_names = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
    ];
    return $bulan_names[$bulan_num] . " " . $tahun;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Jurnal Kegiatan Pembina - SMK Bakti Idhata</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#FDFBF7] text-gray-800 font-sans min-h-screen">
    <!-- Header Admin -->
    <header class="bg-[#1B4332] text-white py-4 px-6 shadow-md flex justify-between items-center">
        <div class="flex items-center space-x-3">
            <span class="text-xl font-bold">SMK Bakti Idhata - SI-Pramuka</span>
        </div>
        <div class="text-right">
            <span class="block text-xs font-semibold text-emerald-300">Admin Utama</span>
            <span class="font-bold text-sm">Kak Jihan Fadhilah, S. Kom</span>
        </div>
    </header>

    <div class="max-w-6xl mx-auto p-6 mt-6 space-y-6">
        <!-- Header Section -->
        <div class="flex justify-between items-center">
            <div>
                <h1 class="text-2xl font-bold text-[#1B4332]">Buku Jurnal Latihan Pramuka</h1>
                <p class="text-sm text-gray-500">Kelola filter dan cetak laporan surat resmi jurnal latihan pramuka.</p>
            </div>
            <a href="index.php" class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-4 py-2 rounded-xl border border-gray-200 transition">
                &larr; Kembali ke Dashboard
            </a>
        </div>

        <!-- Filter Bar -->
        <div class="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
            <form method="GET" action="jurnal_filter.php" class="flex items-center space-x-3 w-full sm:w-auto">
                <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Pilih Periode Bulan:</span>
                <select name="bulan" onchange="this.form.submit()" class="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/50 min-w-[200px]">
                    <?php if (empty($list_bulan)): ?>
                        <option value="<?php echo date('Y-m'); ?>"><?php echo formatBulanIndo(date('Y-m')); ?></option>
                    <?php else: ?>
                        <?php foreach($list_bulan as $row): ?>
                            <option value="<?php echo $row['bulan_tahun']; ?>" <?php echo $bulan_pilihan === $row['bulan_tahun'] ? 'selected' : ''; ?>>
                                <?php echo formatBulanIndo($row['bulan_tahun']); ?>
                            </option>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </select>
            </form>

            <!-- Download Button -->
            <a href="cetak_jurnal_pdf.php?bulan=<?php echo urlencode($bulan_pilihan); ?>" target="_blank" class="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition">
                <span>Unduh Rekap Bulanan PDF (Resmi)</span>
            </a>
        </div>

        <!-- Table / List of Journals -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="bg-gray-50/50 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <span class="text-sm font-extrabold text-gray-800">Daftar Kegiatan Bulan <?php echo formatBulanIndo($bulan_pilihan); ?></span>
                <span class="text-xs font-bold bg-[#1B4332] text-white px-2.5 py-1 rounded-full"><?php echo count($jurnals); ?> Kegiatan</span>
            </div>

            <div class="p-6">
                <?php if (!empty($error)): ?>
                    <div class="bg-rose-50 text-rose-700 p-4 rounded-xl text-xs font-semibold mb-4"><?php echo $error; ?></div>
                <?php endif; ?>

                <?php if (empty($jurnals)): ?>
                    <p class="text-center text-gray-400 py-8 text-sm">Tidak ada kegiatan yang dicatat pada bulan ini.</p>
                <?php else: ?>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <?php foreach ($jurnals as $j): ?>
                            <div class="bg-gray-50/50 rounded-2xl border border-gray-100 p-5 space-y-4 relative flex flex-col justify-between">
                                <div class="space-y-2">
                                    <div class="flex items-center justify-between">
                                        <span class="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full uppercase">
                                            <?php echo date('d M Y', strtotime($j['tanggal'])); ?>
                                        </span>
                                        <span class="text-xs text-gray-400 font-medium"><?php echo htmlspecialchars($j['pembina_nama']); ?></span>
                                    </div>
                                    <h3 class="text-base font-extrabold text-gray-800"><?php echo htmlspecialchars($j['judul_kegiatan']); ?></h3>
                                    <?php if (!empty($j['judul_materi'])): ?>
                                        <p class="text-xs font-bold text-indigo-600">Materi: <?php echo htmlspecialchars($j['judul_materi']); ?></p>
                                    <?php endif; ?>
                                    <p class="text-xs text-gray-500 leading-relaxed italic bg-white p-3 rounded-xl border border-gray-100">
                                        "<?php echo htmlspecialchars($j['evaluasi_ringkas']); ?>"
                                    </p>
                                </div>

                                <div class="pt-4 border-t border-gray-100 flex justify-end">
                                    <a href="cetak_jurnal_pdf.php?id=<?php echo $j['id']; ?>" target="_blank" class="bg-white hover:bg-gray-100 text-[#1B4332] text-xs font-bold px-3 py-2 rounded-lg border border-gray-200 transition">
                                        Unduh PDF Resmi &rarr;
                                    </a>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</body>
</html>`
  },
  {
    filename: "cetak_jurnal_pdf.php",
    language: "php",
    description: "Ekspor data jurnal pembina ke PDF Resmi Surat Keputusan Gugus Depan Pramuka SMK Bakti Idhata dengan 3 Kolom Tanda Tangan.",
    content: `<?php
/**
 * File: cetak_jurnal_pdf.php
 * Deskripsi: Ekspor data jurnal pembina ke format PDF Surat Resmi Gugus Depan Pramuka SMK Bakti Idhata.
 * Mengintegrasikan data dari database dan mendukung layout tanda tangan dinas 3 kolom.
 */
require_once 'koneksi.php';

// Ambil parameter cetak
$id_kegiatan = isset($_GET['id']) ? $_GET['id'] : null;
$bulan_rekap = isset($_GET['bulan']) ? $_GET['bulan'] : null;

$jurnals = [];
$is_single = false;

if ($id_kegiatan) {
    try {
        $stmt = $pdo->prepare("SELECT j.*, m.judul_materi, m.kategori FROM jurnal_pembina j LEFT JOIN materi_pramuka m ON j.materi_id = m.id WHERE j.id = :id");
        $stmt->execute(['id' => $id_kegiatan]);
        $j = $stmt->fetch();
        if ($j) {
            $jurnals[] = $j;
            $is_single = true;
        }
    } catch (PDOException $e) {
        die("Error mengambil data kegiatan: " . $e->getMessage());
    }
} elseif ($bulan_rekap) {
    try {
        $stmt = $pdo->prepare("SELECT j.*, m.judul_materi, m.kategori FROM jurnal_pembina j LEFT JOIN materi_pramuka m ON j.materi_id = m.id WHERE DATE_FORMAT(j.tanggal, '%Y-%m') = :bulan ORDER BY j.tanggal ASC");
        $stmt->execute(['bulan' => $bulan_rekap]);
        $jurnals = $stmt->fetchAll();
    } catch (PDOException $e) {
        die("Error mengambil rekap data kegiatan: " . $e->getMessage());
    }
} else {
    die("Parameter cetak tidak ditentukan.");
}

// Format bulan Indonesia
function formatBulanIndo($yearMonth) {
    if (empty($yearMonth)) return '-';
    $parts = explode('-', $yearMonth);
    if (count($parts) < 2) return $yearMonth;
    $tahun = $parts[0];
    $bulan_num = intval($parts[1]);
    $bulan_names = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
    ];
    return $bulan_names[$bulan_num] . " " . $tahun;
}

// Format tanggal penuh Indonesia
function formatTanggalIndo($tglStr) {
    if (empty($tglStr)) return '-';
    $timestamp = strtotime($tglStr);
    $hari = date('d', $timestamp);
    $bulan_num = intval(date('m', $timestamp));
    $tahun = date('Y', $timestamp);
    $bulan_names = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
    ];
    return $hari . " " . $bulan_names[$bulan_num] . " " . $tahun;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Resmi Jurnal Kegiatan Pramuka - SMK Bakti Idhata</title>
    <style>
        body {
            font-family: "Times New Roman", Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
            background-color: #fff;
            margin: 0;
            padding: 0;
        }
        .page-container {
            width: 210mm;
            min-height: 297mm;
            padding: 25mm 20mm 20mm 20mm;
            margin: auto;
            box-sizing: border-box;
            background: #fff;
        }
        
        /* KOP SURAT RESMI */
        .kop-surat {
            display: flex;
            align-items: center;
            border-bottom: 4px double #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .logo-pramuka {
            width: 70px;
            height: auto;
            margin-right: 20px;
        }
        .kop-text {
            text-align: center;
            flex-grow: 1;
        }
        .kop-text h1 {
            font-size: 15pt;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
        }
        .kop-text h2 {
            font-size: 13pt;
            font-weight: bold;
            margin: 2px 0;
            text-transform: uppercase;
        }
        .kop-text h3 {
            font-size: 12pt;
            font-weight: bold;
            margin: 2px 0;
            text-transform: uppercase;
        }
        .kop-text p {
            font-size: 9pt;
            margin: 2px 0;
            font-style: italic;
        }

        /* DETAIL DOKUMEN */
        .judul-dokumen {
            text-align: center;
            font-weight: bold;
            font-size: 14pt;
            text-decoration: underline;
            text-transform: uppercase;
            margin-top: 15px;
            margin-bottom: 5px;
        }
        .nomor-surat {
            text-align: center;
            font-size: 11pt;
            margin-bottom: 30px;
        }

        .jurnal-item {
            margin-bottom: 25px;
            border-bottom: 1px dashed #ccc;
            padding-bottom: 15px;
        }
        .jurnal-item:last-child {
            border-bottom: none;
        }

        table.detail-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 15px;
        }
        table.detail-table th, table.detail-table td {
            border: 1px solid #000;
            padding: 8px 12px;
            text-align: left;
            font-size: 11pt;
        }
        table.detail-table th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
        }

        .label-field {
            font-weight: bold;
            width: 25%;
        }

        .evaluasi-box {
            background-color: #f9f9f9;
            border-left: 3px solid #000;
            padding: 10px 15px;
            font-style: italic;
            font-size: 11pt;
            margin-top: 5px;
        }

        /* LEMBAR PENGESAHAN */
        .signature-table {
            width: 100%;
            margin-top: 45px;
            text-align: center;
            font-size: 11pt;
            border: none !important;
        }
        .signature-table td {
            border: none !important;
            padding: 10px;
            vertical-align: top;
        }

        @media print {
            body {
                background: none;
            }
            .page-container {
                width: 100%;
                padding: 0;
                margin: 0;
                box-shadow: none;
            }
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <!-- Floating Print Control (No-Print) -->
    <div class="no-print" style="position:fixed; top:20px; right:20px; background:#1B4332; color:white; padding:12px 20px; border-radius:10px; font-family:sans-serif; font-size:12px; box-shadow:0 4px 10px rgba(0,0,0,0.15); z-index:1000; display:flex; gap:10px; align-items:center;">
        <span style="font-weight:bold;">Mode Cetak Laporan Dinas Resmi</span>
        <button onclick="window.print()" style="background:#fff; color:#1B4332; border:none; padding:6px 12px; font-weight:bold; border-radius:6px; cursor:pointer; font-size:11px;">Cetak Sekarang</button>
        <button onclick="window.close()" style="background:rgba(255,255,255,0.2); color:white; border:none; padding:6px 12px; font-weight:bold; border-radius:6px; cursor:pointer; font-size:11px;">Tutup</button>
    </div>

    <div class="page-container">
        <!-- KOP SURAT RESMI -->
        <div class="kop-surat">
            <img src="https://upload.wikimedia.org/wikipedia/commons/e/ea/Logo_Pramuka.svg" class="logo-pramuka" alt="Logo Pramuka">
            <div class="kop-text">
                <h1>Gerakan Pramuka Kwartir Cabang Jakarta Selatan</h1>
                <h2>Gugus Depan Pramuka SMK Bakti Idhata</h2>
                <h3>Ambalan Penegak Bantara - Laksana</h3>
                <p>Jl. Melati No.25, RT.13/RW.3, Cilandak Barat, Kec. Cilandak, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12430</p>
            </div>
        </div>

        <!-- JUDUL SURAT LAPORAN -->
        <div class="judul-dokumen">
            <?php if ($is_single): ?>
                Laporan Mingguan Jurnal Latihan Pramuka
            <?php else: ?>
                Rekapitulasi Bulanan Jurnal Latihan Pramuka
            <?php endif; ?>
        </div>
        <div class="nomor-surat">
            Nomor: <?php echo "0".rand(10,99)."/GP-SMKBI/JRN/".date('Y'); ?>
        </div>

        <!-- DETAIL / DAFTAR JURNAL -->
        <?php if ($is_single): ?>
            <!-- Single Meeting Details -->
            <?php $j = $jurnals[0]; ?>
            <p>Pada hari ini, yang bertanda tangan di bawah ini melaporkan bahwa latihan Pramuka Penegak Ambalan SMK Bakti Idhata telah diselenggarakan dengan rincian laporan sebagai berikut:</p>
            
            <table class="detail-table">
                <tr>
                    <td class="label-field">Hari / Tanggal</td>
                    <td>: <?php echo formatTanggalIndo($j['tanggal']); ?></td>
                </tr>
                <tr>
                    <td class="label-field">Pembina Pengajar</td>
                    <td>: <b><?php echo htmlspecialchars($j['pembina_nama']); ?></b></td>
                </tr>
                <tr>
                    <td class="label-field">Agenda Kegiatan</td>
                    <td>: <?php echo htmlspecialchars($j['judul_kegiatan']); ?></td>
                </tr>
                <tr>
                    <td class="label-field">Materi Terhubung</td>
                    <td>: <?php echo !empty($j['judul_materi']) ? htmlspecialchars($j['judul_materi'])." (".htmlspecialchars($j['kategori']).")" : 'Tidak ada hubungan materi khusus.'; ?></td>
                </tr>
            </table>

            <div style="font-weight:bold; margin-top:15px; margin-bottom:5px;">Ringkasan Evaluasi & Catatan Kemajuan Latihan:</div>
            <div class="evaluasi-box">
                <?php echo nl2br(htmlspecialchars($j['evaluasi_ringkas'])); ?>
            </div>

            <?php 
            $photos = [];
            if (!empty($j['foto'])) {
                if (strpos($j['foto'], '[') === 0) {
                    $decoded = json_decode($j['foto'], true);
                    if (is_array($decoded)) {
                        $photos = $decoded;
                    }
                } else {
                    $photos = [$j['foto']];
                }
            }
            if (!empty($photos)): 
            ?>
                <div style="font-weight:bold; margin-top:15px; margin-bottom:10px; text-align:center;">Foto / Dokumentasi Kegiatan Latihan (Pusat):</div>
                <div style="display:flex; flex-wrap:wrap; gap:15px; justify-content:center; margin-top:5px; margin-bottom:15px;">
                    <?php foreach ($photos as $p): ?>
                        <img src="<?php echo htmlspecialchars($p); ?>" style="max-width:260px; height:auto; border:1px solid #ccc; padding:4px;" alt="Dokumentasi Kegiatan">
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

        <?php else: ?>
            <!-- Monthly Recap Details -->
            <p>Melaporkan Rekapitulasi Pelaksanaan Kegiatan Latihan Mingguan Pramuka Penegak Gugus Depan SMK Bakti Idhata Jakarta Selatan pada periode <b><?php echo formatBulanIndo($bulan_rekap); ?></b> dengan rincian kegiatan sebagai berikut:</p>
            
            <table class="detail-table">
                <thead>
                    <tr>
                        <th style="width: 5%;">No</th>
                        <th style="width: 15%;">Tanggal Latihan</th>
                        <th style="width: 25%;">Agenda Kegiatan / Materi</th>
                        <th style="width: 15%;">Pembina</th>
                        <th style="width: 20%;">Dokumentasi</th>
                        <th style="width: 20%;">Evaluasi Ringkas / Catatan Kemajuan</th>
                    </tr>
                </thead>
                <tbody>
                    <?php $no = 1; foreach ($jurnals as $j): ?>
                        <tr>
                            <td style="text-align:center;"><?php echo $no++; ?></td>
                            <td style="text-align:center;"><?php echo formatTanggalIndo($j['tanggal']); ?></td>
                            <td>
                                <b><?php echo htmlspecialchars($j['judul_kegiatan']); ?></b>
                                <?php if (!empty($j['judul_materi'])): ?>
                                    <br><span style="font-size:9pt; color:#444;">Materi: <?php echo htmlspecialchars($j['judul_materi']); ?></span>
                                <?php endif; ?>
                            </td>
                            <td style="word-break: break-all; font-weight: bold; font-size: 9.5pt;">
                                <?php echo htmlspecialchars($j['pembina_nama']); ?>
                            </td>
                            <td style="text-align:center; vertical-align:middle;">
                                <?php 
                                $rowPhotos = [];
                                if (!empty($j['foto'])) {
                                    if (strpos($j['foto'], '[') === 0) {
                                        $decoded = json_decode($j['foto'], true);
                                        if (is_array($decoded)) {
                                            $rowPhotos = $decoded;
                                        }
                                    } else {
                                        $rowPhotos = [$j['foto']];
                                    }
                                }
                                if (!empty($rowPhotos)): 
                                ?>
                                    <div style="display:flex; flex-direction:column; align-items:center; gap:5px; padding:4px 0;">
                                        <?php foreach ($rowPhotos as $rp): ?>
                                            <img src="<?php echo htmlspecialchars($rp); ?>" style="max-width:110px; max-height:80px; border:1px solid #eee; padding:2px;" alt="Foto">
                                        <?php endforeach; ?>
                                    </div>
                                <?php else: ?>
                                    -
                                <?php endif; ?>
                            </td>
                            <td style="font-size: 10pt; font-style: italic;">
                                <?php echo htmlspecialchars($j['evaluasi_ringkas']); ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>

        <p style="margin-top:30px;">Demikian laporan resmi jurnal kegiatan latihan mingguan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>

        <!-- TANDA TANGAN 3 KOLOM DINAS -->
        <table class="signature-table">
            <tr>
                <td style="width: 33%;">
                    Mengetahui,<br>
                    Wakasek Bidang Kesiswaan<br><br><br><br><br>
                    <b><u>Kak Dhenny Effendi, S. Pd</u></b>
                </td>
                <td style="width: 33%;">
                    Pelapor,<br>
                    Pembina Pramuka<br><br><br><br><br>
                    <b><u>Kak Jihan Fadhilah, S. Kom</u></b>
                </td>
                <td style="width: 33%;">
                    Mengetahui,<br>
                    Kepala Sekolah<br><br><br><br><br>
                    <b><u>Kak Nurman, M. Pd</u></b>
                </td>
            </tr>
        </table>
    </div>

    <!-- Auto trigger print dialog if desired by the user -->
    <script>
        // window.print();
    </script>
</body>
</html>`
  }
];

