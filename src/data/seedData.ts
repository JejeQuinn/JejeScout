import { Siswa, Kehadiran, Materi, SKU, Tabungan, Kedisiplinan, Jurnal, SKUItemDef, SKKDef, SKKRecord, KegiatanEvent, BarangInventaris, PeminjamanLogistik, ModulMateri, SilabusLatihan, TransaksiKas, PeriodeDewanAmbalan, MabigusMember, GudepMember } from '../types';

export const initialTahunAjaran: string[] = [
  'TA. 2024-2025',
  'TA. 2025-2026',
  'TA. 2026-2027',
  '2026-2027'
];

export const initialSiswa: Siswa[] = [
  // --- 33 PENGURUS DEWAN AMBALAN RESMI SMK BAKTI IDHATA (2026-2027) ---
  { id: "da_s01", nama_lengkap: "Malik Khadafi Al Ghoni", kelas: "XII TKJ", nis: "1101", nisn: "0051234101", email_sekolah: "malik.tkj@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Laksana", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Dewan Kehormatan Putra", tanggal_pelantikan: "2025-06-12" },
  { id: "da_s02", nama_lengkap: "Della Rizkyani", kelas: "XII DKV 2", nis: "1102", nisn: "0051234102", email_sekolah: "della.dkv2@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Laksana", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Dewan Kehormatan Putri", tanggal_pelantikan: "2025-06-12" },
  { id: "da_s03", nama_lengkap: "Daffa Arya Perkasa", kelas: "XII RPL", nis: "1103", nisn: "0051234103", email_sekolah: "daffa.rpl@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Laksana", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Pemangku Adat Putra", tanggal_pelantikan: "2025-06-12" },
  { id: "da_s04", nama_lengkap: "Khalifah Azzahra", kelas: "XII DKV 2", nis: "1104", nisn: "0051234104", email_sekolah: "khalifah.dkv2@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Laksana", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Pemangku Adat Putri", tanggal_pelantikan: "2025-06-12" },
  { id: "da_s05", nama_lengkap: "Sabian Attila Taftazani Artha", kelas: "XI RPL", nis: "1105", nisn: "0061234105", email_sekolah: "sabian.rpl@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Staff Pemangku Adat Putra", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s06", nama_lengkap: "Aurelia Khanza Sabrina Sari", kelas: "XI RPL", nis: "1106", nisn: "0061234106", email_sekolah: "aurelia.rpl@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Staff Pemangku Adat Putri", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s07", nama_lengkap: "Raditya", kelas: "XII DKV 2", nis: "1107", nisn: "0051234107", email_sekolah: "raditya.dkv2@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Laksana", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Penegak Pradana Putra", tanggal_pelantikan: "2025-06-12" },
  { id: "da_s08", nama_lengkap: "Nayla Janeeta", kelas: "XII DKV 2", nis: "1108", nisn: "0051234108", email_sekolah: "nayla.janeeta@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Laksana", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Penegak Pradana Putri", tanggal_pelantikan: "2025-06-12" },
  { id: "da_s09", nama_lengkap: "Zainun Ghilman Aziz", kelas: "XI RPL", nis: "1109", nisn: "0061234109", email_sekolah: "zainun.rpl@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Staff Penegak Pradana Putra", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s10", nama_lengkap: "Carissa Rahma Zahirah", kelas: "XI DKV 2", nis: "1110", nisn: "0061234110", email_sekolah: "carissa.dkv2@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Staff Penegak Pradana Putri", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s11", nama_lengkap: "Yasir Hidayatullah", kelas: "XII TKJ", nis: "1111", nisn: "0051234111", email_sekolah: "yasir.tkj@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Laksana", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Pradana Putra", tanggal_pelantikan: "2025-06-12" },
  { id: "da_s12", nama_lengkap: "Bilqis Suci Makayla", kelas: "XII DKV 2", nis: "1112", nisn: "0051234112", email_sekolah: "bilqis.dkv2@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Laksana", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Pradana Putri", tanggal_pelantikan: "2025-06-12" },
  { id: "da_s13", nama_lengkap: "Dimas Aditya", kelas: "XI RPL", nis: "1113", nisn: "0061234113", email_sekolah: "dimas.rpl@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Staff Pradana Putra", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s14", nama_lengkap: "Julfa Khairanih", kelas: "XI DKV 2", nis: "1114", nisn: "0061234114", email_sekolah: "julfa.dkv2@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Staff Pradana Putri", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s15", nama_lengkap: "Rizky Anugrah Ramadhan", kelas: "XII TKJ", nis: "1115", nisn: "0051234115", email_sekolah: "rizky.tkj@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Laksana", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Wakil Pradana Putra", tanggal_pelantikan: "2025-06-12" },
  { id: "da_s16", nama_lengkap: "Intan Ayyu Nur Aini", kelas: "XII DKV 1", nis: "1116", nisn: "0051234116", email_sekolah: "intan.dkv1@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Laksana", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Wakil Pradana Putri", tanggal_pelantikan: "2025-06-12" },
  { id: "da_s17", nama_lengkap: "Raffael Zaidan Alfaridzi", kelas: "XI RPL", nis: "1117", nisn: "0061234117", email_sekolah: "raffael.rpl@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Staff Wakil Pradana Putra", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s18", nama_lengkap: "Najla Amelia Kirana", kelas: "XI DKV 2", nis: "1118", nisn: "0061234118", email_sekolah: "najla.dkv2@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Staff Wakil Pradana Putri", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s19", nama_lengkap: "Fathier Assyarief", kelas: "XII RPL", nis: "1119", nisn: "0051234119", email_sekolah: "fathier.rpl@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Laksana", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Krani Putra", tanggal_pelantikan: "2025-06-12" },
  { id: "da_s20", nama_lengkap: "Siti Humaira Auliahya", kelas: "XII DKV 2", nis: "1120", nisn: "0051234120", email_sekolah: "siti.humaira@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Laksana", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Krani Putri", tanggal_pelantikan: "2025-06-12" },
  { id: "da_s21", nama_lengkap: "Raihan Nur Irsyad", kelas: "XI RPL", nis: "1121", nisn: "0061234121", email_sekolah: "raihan.rpl@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Staff Krani Putra", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s22", nama_lengkap: "Nadya Ulya Khairunnisa", kelas: "XI DKV 2", nis: "1122", nisn: "0061234122", email_sekolah: "nadya.dkv2@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Staff Krani Putri", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s23", nama_lengkap: "Sauqi Moebarok", kelas: "XI DKV 2", nis: "1123", nisn: "0061234123", email_sekolah: "sauqi.dkv2@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Bendahara Putra", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s24", nama_lengkap: "Hanifah Salsabilla", kelas: "XI DKV 1", nis: "1124", nisn: "0061234124", email_sekolah: "hanifah.dkv1@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Bendahara Putri", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s25", nama_lengkap: "Abdul Hafiidz", kelas: "XI RPL", nis: "1126", nisn: "0061234126", email_sekolah: "abdul.hafiidz@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Giatop Putra", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s26", nama_lengkap: "Osriseffita Nurramadhaniah", kelas: "XI DKV 1", nis: "1125", nisn: "0061234125", email_sekolah: "osriseffita.dkv1@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Giatop Putri", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s27", nama_lengkap: "Syahrul Sya'ban", kelas: "XI RPL", nis: "1128", nisn: "0061234128", email_sekolah: "syahrul.rpl@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Staff Giatop Putra", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s28", nama_lengkap: "Kanza Dwi Melviana", kelas: "XI DKV 1", nis: "1127", nisn: "0061234127", email_sekolah: "kanza.dkv1@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Staff Giatop Putri", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s29", nama_lengkap: "Arif Zakariya", kelas: "XII TKJ", nis: "1129", nisn: "0051234129", email_sekolah: "arif.tkj@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Laksana", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Tekram Putra", tanggal_pelantikan: "2025-06-12" },
  { id: "da_s30", nama_lengkap: "M. Dwikie Dhermawan As'syidiq", kelas: "XI TKJ", nis: "1130", nisn: "0061234130", email_sekolah: "dwikie.tkj@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Tekram Putra", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s31", nama_lengkap: "Shafa Azalia Andini", kelas: "XI DKV 2", nis: "1131", nisn: "0061234131", email_sekolah: "shafa.dkv2@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Tekram Putri", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s32", nama_lengkap: "Raden Ahmad Faisal Mubaroq", kelas: "XI DKV 1", nis: "1132", nisn: "0061234132", email_sekolah: "raden.ahmad@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Staff Tekram Putra", tanggal_pelantikan: "2026-05-10" },
  { id: "da_s33", nama_lengkap: "Zayden Athaya Nareswara", kelas: "XI TKJ", nis: "1133", nisn: "0061234133", email_sekolah: "zayden.tkj@smkbaktidhata.sch.id", tahun_ajaran: "2026-2027", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Dewan Ambalan Aktif", jabatan_ambalan: "Staff Tekram Putra", tanggal_pelantikan: "2026-05-10" },

  // --- ANGGOTA SAMPEL TAMBAHAN ---
  { id: "s1", nama_lengkap: "Jihan Pratama", kelas: "XI TKJ 1", nis: "1001", nisn: "0061234501", email_sekolah: "jihan.pratama@smkbaktidhata.sch.id", tahun_ajaran: "TA. 2024-2025", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Penegak Aktif", jabatan_ambalan: "Anggota Sangga Pelaksana", tanggal_pelantikan: "2026-05-10" },
  { id: "s2", nama_lengkap: "Lee Min-ho Septian", kelas: "XI TKJ 1", nis: "1002", nisn: "0061234502", email_sekolah: "lee.minho@smkbaktidhata.sch.id", tahun_ajaran: "TA. 2024-2025", status_aktif: true, status_pelantikan: "Penegak Bantara", status_siklus: "Penegak Aktif", jabatan_ambalan: "Anggota Sangga Pelaksana", tanggal_pelantikan: "2026-05-10" },
  { id: "s3", nama_lengkap: "Ahmad Fauzi", kelas: "XI RPL 2", nis: "1003", nisn: "0061234503", email_sekolah: "ahmad.fauzi@smkbaktidhata.sch.id", tahun_ajaran: "TA. 2024-2025", status_aktif: true, status_pelantikan: "Calon Penegak", status_siklus: "Penegak Aktif", jabatan_ambalan: "Anggota Sangga Penegas" },
  { id: "s4", nama_lengkap: "Siti Rahmawati", kelas: "XII MM 1", nis: "1004", nisn: "0051234504", email_sekolah: "siti.rahmawati@smkbaktidhata.sch.id", tahun_ajaran: "TA. 2025-2026", status_aktif: true, status_pelantikan: "Penegak Laksana", status_siklus: "Penegak Aktif", jabatan_ambalan: "Anggota Sangga Perintis", tanggal_pelantikan: "2026-06-20" },
  { id: "s5", nama_lengkap: "Budi Wijaya", kelas: "X RPL 1", nis: "1005", nisn: "0071234505", email_sekolah: "budi.wijaya@smkbaktidhata.sch.id", tahun_ajaran: "TA. 2026-2027", status_aktif: true, status_pelantikan: "Calon Penegak", status_siklus: "Calon Penegak", jabatan_ambalan: "Anggota Sangga Perintis" },
  { id: "s6", nama_lengkap: "Dewi Lestari", kelas: "XI TKJ 2", nis: "1006", nisn: "0061234506", email_sekolah: "dewi.lestari@smkbaktidhata.sch.id", tahun_ajaran: "TA. 2025-2026", status_aktif: true, status_pelantikan: "Calon Penegak", status_siklus: "Penegak Aktif", jabatan_ambalan: "Anggota Sangga Pendobrak" },
  { id: "s7", nama_lengkap: "Rian Hidayat", kelas: "XII TKJ 1", nis: "1007", nisn: "0041234507", email_sekolah: "rian.hidayat@smkbaktidhata.sch.id", tahun_ajaran: "TA. 2024-2025", status_aktif: false, status_pelantikan: "Penegak Laksana", status_siklus: "Purna Ambalan", tahun_lulus: "2025", jabatan_ambalan: "Alumni Dewan Kehormatan" },
  { id: "s8", nama_lengkap: "Farhan Mahendra", kelas: "XI RPL 1", nis: "1008", nisn: "0061234508", email_sekolah: "farhan.m@smkbaktidhata.sch.id", tahun_ajaran: "TA. 2025-2026", status_aktif: true, status_pelantikan: "Calon Penegak", status_siklus: "Penegak Aktif", jabatan_ambalan: "Anggota Sangga Pendobrak" }
];

export const initialKehadiran: Kehadiran[] = [
  // Pertemuan 1 - 2026-06-15
  { id: "k1", siswa_id: "s1", tanggal: "2026-06-15", status: "Hadir", keterangan: "" },
  { id: "k2", siswa_id: "s2", tanggal: "2026-06-15", status: "Hadir", keterangan: "" },
  { id: "k3", siswa_id: "s3", tanggal: "2026-06-15", status: "Hadir", keterangan: "" },
  { id: "k4", siswa_id: "s4", tanggal: "2026-06-15", status: "Izin", keterangan: "Acara Keluarga" },
  { id: "k5", siswa_id: "s5", tanggal: "2026-06-15", status: "Hadir", keterangan: "" },
  { id: "k6", siswa_id: "s6", tanggal: "2026-06-15", status: "Sakit", keterangan: "Demam" },
  { id: "k7", siswa_id: "s8", tanggal: "2026-06-15", status: "Hadir", keterangan: "" },

  // Pertemuan 2 - 2026-06-22
  { id: "k8", siswa_id: "s1", tanggal: "2026-06-22", status: "Hadir", keterangan: "" },
  { id: "k9", siswa_id: "s2", tanggal: "2026-06-22", status: "Hadir", keterangan: "" },
  { id: "k10", siswa_id: "s3", tanggal: "2026-06-22", status: "Alpa", keterangan: "Tanpa Keterangan" },
  { id: "k11", siswa_id: "s4", tanggal: "2026-06-22", status: "Hadir", keterangan: "" },
  { id: "k12", siswa_id: "s5", tanggal: "2026-06-22", status: "Hadir", keterangan: "" },
  { id: "k13", siswa_id: "s6", tanggal: "2026-06-22", status: "Hadir", keterangan: "" },
  { id: "k14", siswa_id: "s8", tanggal: "2026-06-22", status: "Hadir", keterangan: "" },

  // Pertemuan 3 - 2026-06-29
  { id: "k15", siswa_id: "s1", tanggal: "2026-06-29", status: "Hadir", keterangan: "" },
  { id: "k16", siswa_id: "s2", tanggal: "2026-06-29", status: "Hadir", keterangan: "" },
  { id: "k17", siswa_id: "s3", tanggal: "2026-06-29", status: "Hadir", keterangan: "" },
  { id: "k18", siswa_id: "s4", tanggal: "2026-06-29", status: "Hadir", keterangan: "" },
  { id: "k19", siswa_id: "s5", tanggal: "2026-06-29", status: "Hadir", keterangan: "" },
  { id: "k20", siswa_id: "s6", tanggal: "2026-06-29", status: "Hadir", keterangan: "" },
  { id: "k21", siswa_id: "s8", tanggal: "2026-06-29", status: "Izin", keterangan: "Ujian Susulan Sekolah" },

  // Pertemuan 4 - 2026-07-06
  { id: "k22", siswa_id: "s1", tanggal: "2026-07-06", status: "Hadir", keterangan: "" },
  { id: "k23", siswa_id: "s2", tanggal: "2026-07-06", status: "Hadir", keterangan: "" },
  { id: "k24", siswa_id: "s3", tanggal: "2026-07-06", status: "Hadir", keterangan: "" },
  { id: "k25", siswa_id: "s4", tanggal: "2026-07-06", status: "Hadir", keterangan: "" },
  { id: "k26", siswa_id: "s5", tanggal: "2026-07-06", status: "Hadir", keterangan: "" },
  { id: "k27", siswa_id: "s6", tanggal: "2026-07-06", status: "Hadir", keterangan: "" },
  { id: "k28", siswa_id: "s8", tanggal: "2026-07-06", status: "Hadir", keterangan: "" }
];

export const initialMateri: Materi[] = [
  {
    id: "m1",
    judul_materi: "Sejarah Kepramukaan Indonesia & Dunia",
    kategori: "Umum",
    tanggal_pelaksanaan: "2026-06-15",
    status: "Selesai",
    nilai_evaluasi: {
      s1: 85,
      s2: 90,
      s3: 80,
      s4: 75,
      s5: 88,
      s6: 70,
      s8: 82
    }
  },
  {
    id: "m2",
    judul_materi: "Simpul Dasar, Ikatan, dan Pembuatan Pionering Kaki Tiga",
    kategori: "Tekpram",
    tanggal_pelaksanaan: "2026-06-22",
    status: "Selesai",
    nilai_evaluasi: {
      s1: 95,
      s2: 85,
      s3: 65, // Remidi
      s4: 80,
      s5: 90,
      s6: 85,
      s8: 88
    }
  },
  {
    id: "m3",
    judul_materi: "Pembentukan Karakter & Penerapan Dasa Darma di SMK",
    kategori: "Karakter",
    tanggal_pelaksanaan: "2026-06-29",
    status: "Selesai",
    nilai_evaluasi: {
      s1: 90,
      s2: 92,
      s3: 85,
      s4: 85,
      s5: 80,
      s6: 90,
      s8: 75
    }
  },
  {
    id: "m4",
    judul_materi: "Navigasi Darat, Membaca Kompas, dan Peta Pita",
    kategori: "Tekpram",
    tanggal_pelaksanaan: "2026-07-13",
    status: "Direncanakan",
    nilai_evaluasi: {}
  }
];

export const initialSKU: SKU[] = [
  // Jihan Pratama SKU (Bantara)
  { id: "sku1", siswa_id: "s1", no_item_sku: 1, tanggal_lulus: "2026-06-15", status_verifikasi: true },
  { id: "sku2", siswa_id: "s1", no_item_sku: 2, tanggal_lulus: "2026-06-15", status_verifikasi: true },
  { id: "sku3", siswa_id: "s1", no_item_sku: 3, tanggal_lulus: "2026-06-22", status_verifikasi: true },
  { id: "sku4", siswa_id: "s1", no_item_sku: 5, tanggal_lulus: "2026-06-22", status_verifikasi: true },
  { id: "sku5", siswa_id: "s1", no_item_sku: 8, tanggal_lulus: "2026-06-29", status_verifikasi: true },
  { id: "sku6", siswa_id: "s1", no_item_sku: 10, tanggal_lulus: "2026-06-29", status_verifikasi: true },
  { id: "sku7", siswa_id: "s1", no_item_sku: 12, tanggal_lulus: "2026-07-06", status_verifikasi: true },
  { id: "sku8", siswa_id: "s1", no_item_sku: 20, tanggal_lulus: "2026-07-06", status_verifikasi: true },

  // Lee Min-ho Septian SKU (Bantara)
  { id: "sku9", siswa_id: "s2", no_item_sku: 1, tanggal_lulus: "2026-06-15", status_verifikasi: true },
  { id: "sku10", siswa_id: "s2", no_item_sku: 5, tanggal_lulus: "2026-06-15", status_verifikasi: true },
  { id: "sku11", siswa_id: "s2", no_item_sku: 8, tanggal_lulus: "2026-06-22", status_verifikasi: true },
  { id: "sku12", siswa_id: "s2", no_item_sku: 10, tanggal_lulus: "2026-06-22", status_verifikasi: true },
  { id: "sku13", siswa_id: "s2", no_item_sku: 12, tanggal_lulus: "2026-06-29", status_verifikasi: true },
  { id: "sku14", siswa_id: "s2", no_item_sku: 20, tanggal_lulus: "2026-07-06", status_verifikasi: true },

  // Ahmad Fauzi
  { id: "sku15", siswa_id: "s3", no_item_sku: 1, tanggal_lulus: "2026-06-15", status_verifikasi: true },
  { id: "sku16", siswa_id: "s3", no_item_sku: 2, tanggal_lulus: "2026-06-29", status_verifikasi: true },

  // Siti Rahmawati
  { id: "sku17", siswa_id: "s4", no_item_sku: 1, tanggal_lulus: "2026-06-22", status_verifikasi: true },
  { id: "sku18", siswa_id: "s4", no_item_sku: 12, tanggal_lulus: "2026-06-22", status_verifikasi: true },
  { id: "sku19", siswa_id: "s4", no_item_sku: 23, tanggal_lulus: "2026-07-06", status_verifikasi: true }
];

export const initialTabungan: Tabungan[] = [
  { id: "t1", siswa_id: "s1", tanggal: "2026-06-15", jumlah: 10000, jenis: "Wajib", keterangan: "Iuran Juni" },
  { id: "t2", siswa_id: "s1", tanggal: "2026-06-22", jumlah: 5000, jenis: "Sukarela", keterangan: "Tabungan Kemah" },
  { id: "t3", siswa_id: "s2", tanggal: "2026-06-15", jumlah: 10000, jenis: "Wajib", keterangan: "Iuran Juni" },
  { id: "t4", siswa_id: "s3", tanggal: "2026-06-15", jumlah: 10000, jenis: "Wajib", keterangan: "Iuran Juni" },
  { id: "t5", siswa_id: "s4", tanggal: "2026-06-22", jumlah: 10000, jenis: "Wajib", keterangan: "Iuran Juni" },
  { id: "t6", siswa_id: "s5", tanggal: "2026-06-15", jumlah: 10000, jenis: "Wajib", keterangan: "Iuran Juni" },
  { id: "t7", siswa_id: "s6", tanggal: "2026-06-15", jumlah: 10000, jenis: "Wajib", keterangan: "Iuran Juni" },
  { id: "t8", siswa_id: "s8", tanggal: "2026-06-15", jumlah: 10000, jenis: "Wajib", keterangan: "Iuran Juni" },
  { id: "t9", siswa_id: "s1", tanggal: "2026-07-06", jumlah: 10000, jenis: "Wajib", keterangan: "Iuran Juli" },
  { id: "t10", siswa_id: "s2", tanggal: "2026-07-06", jumlah: 10000, jenis: "Wajib", keterangan: "Iuran Juli" }
];

export const initialKedisiplinan: Kedisiplinan[] = [
  { id: "d1", siswa_id: "s1", tanggal: "2026-06-22", tipe: "Prestasi", keterangan: "Sangga Kerja Terbaik dalam Latihan Pioneering", poin: 15 },
  { id: "d2", siswa_id: "s3", tanggal: "2026-06-22", tipe: "Pelanggaran", keterangan: "Terlambat latihan lebih dari 20 menit", poin: -5 },
  { id: "d3", siswa_id: "s5", tanggal: "2026-06-15", tipe: "Pelanggaran", keterangan: "Tidak memakai atribut hasduk lengkap", poin: -5 },
  { id: "d4", siswa_id: "s2", tanggal: "2026-06-29", tipe: "Prestasi", keterangan: "Membantu Pembina menyiapkan perlengkapan kemah bakti", poin: 10 },
  { id: "d5", siswa_id: "s4", tanggal: "2026-07-06", tipe: "Prestasi", keterangan: "Pemimpin upacara pembukaan terbaik", poin: 10 }
];

export const initialJurnal: Jurnal[] = [
  {
    id: "jan1",
    tanggal: "2026-01-05",
    judul_kegiatan: "Rapat Kerja Ambalan & Penyusunan Program Semester Genap",
    materi_id: "",
    pembina_nama: "Kak Jihan Fadhilah, S. Kom",
    evaluasi_ringkas: "Rapat koordinasi awal tahun bersama dewan ambalan. Menyepakati agenda pelantikan Bantara dan latihan gabungan."
  },
  {
    id: "jan2",
    tanggal: "2026-01-12",
    judul_kegiatan: "Latihan Dasar Kepemimpinan (LDK) Ambalan - Sesi Ideologi",
    materi_id: "m1",
    pembina_nama: "Kak Jihan Fadhilah, S. Kom",
    evaluasi_ringkas: "Pengenalan kembali nilai Pancasila dan Tri Satya bagi calon penegak. 100% peserta hadir tepat waktu."
  },
  {
    id: "jan3",
    tanggal: "2026-01-19",
    judul_kegiatan: "Praktik Kompas dan Navigasi Darat Lingkungan Sekolah",
    materi_id: "",
    pembina_nama: "Kak Jihan Fadhilah, S. Kom",
    evaluasi_ringkas: "Siswa belajar membidik sasaran menggunakan kompas bidik. 3 siswa masih bingung menghitung azimuth back-azimuth."
  },
  {
    id: "jan4",
    tanggal: "2026-01-26",
    judul_kegiatan: "Evaluasi Fisik Tahunan & Olahraga Bersama Ambalan",
    materi_id: "",
    pembina_nama: "Kak Wahyu, M.Kom.",
    evaluasi_ringkas: "Pengujian kebugaran jasmani ambalan. Semua anggota mampu lari 12 menit dengan jarak yang memuaskan."
  },
  {
    id: "feb1",
    tanggal: "2026-02-02",
    judul_kegiatan: "Pendalaman Materi Sandi Kotak 1 & 2 serta Semaphore",
    materi_id: "m2",
    pembina_nama: "Kak Jihan Fadhilah, S. Kom",
    evaluasi_ringkas: "Siswa mempraktikkan pengiriman berita jarak dekat menggunakan bendera semaphore. Mayoritas sudah lancar menghafal alfabet sandi."
  },
  {
    id: "feb2",
    tanggal: "2026-02-09",
    judul_kegiatan: "Latihan Pertolongan Pertama Gawat Darurat (PPGD)",
    materi_id: "",
    pembina_nama: "Kak Jihan Fadhilah, S. Kom",
    evaluasi_ringkas: "Simulasi pembidaian patah tulang lengan dan evakuasi korban pingsan. Kerja sama tim sangat solid."
  },
  {
    id: "feb3",
    tanggal: "2026-02-16",
    judul_kegiatan: "Kunjungan & Bakti Sosial Ambalan ke Panti Asuhan",
    materi_id: "m3",
    pembina_nama: "Kak Wahyu, M.Kom.",
    evaluasi_ringkas: "Penerapan Dasa Darma ke-2 (Cinta alam dan kasih sayang sesama manusia). Penyerahan donasi sembako berjalan dengan lancar."
  },
  {
    id: "feb4",
    tanggal: "2026-02-23",
    judul_kegiatan: "Ujian Teori SKU Syarat Pelantikan Penegak Bantara",
    materi_id: "",
    pembina_nama: "Kak Jihan Fadhilah, S. Kom",
    evaluasi_ringkas: "Sesi pengujian lisan beberapa butir SKU keagamaan dan toleransi. Siswa menunjukkan kesiapan mental yang luar biasa."
  },
  {
    id: "feb5",
    tanggal: "2026-02-27",
    judul_kegiatan: "Sidang Dewan Kehormatan Ambalan untuk Verifikasi Calon Bantara",
    materi_id: "",
    pembina_nama: "Kak Jihan Fadhilah, S. Kom",
    evaluasi_ringkas: "Sidang kelayakan untuk menentukan nama-nama calon penegak yang siap dilantik pada upacara adat mendatang."
  },
  {
    id: "j1",
    tanggal: "2026-06-15",
    judul_kegiatan: "Upacara Pembukaan & Latihan Sejarah Kepramukaan",
    materi_id: "m1",
    pembina_nama: "Kak Jihan Fadhilah, S. Kom",
    evaluasi_ringkas: "Latihan berjalan sangat kondusif. Antusiasme siswa tinggi, namun ada 2 orang siswa yang perlu perhatian khusus terkait kesiapan baris-berbaris."
  },
  {
    id: "j2",
    tanggal: "2026-06-22",
    judul_kegiatan: "Ujian Tali Temali & Praktik Pembuatan Pionering Kaki Tiga",
    materi_id: "m2",
    pembina_nama: "Kak Jihan Fadhilah, S. Kom",
    evaluasi_ringkas: "Siswa secara beregu mampu mendirikan kaki tiga. Rian Hidayat tidak aktif dalam sangganya. Ahmad Fauzi perlu remidi materi ikatan silang."
  },
  {
    id: "j3",
    tanggal: "2026-06-29",
    judul_kegiatan: "Kultum Dasa Darma & Pembinaan Karakter SMK Bakti Idhata",
    materi_id: "m3",
    pembina_nama: "Kak Wahyu, M.Kom.",
    evaluasi_ringkas: "Siswa berbagi cerita kasus moralitas remaja. Semuanya memberikan tanggapan positif dan mendalam mengenai Dasa Darma Pramuka."
  }
];

export const listSKUItems: Record<number, string> = {
  1: "Mampu keagamaan masing-masing & toleransi beragama",
  2: "Berani menyampaikan pendapat di muka umum",
  3: "Dapat mengikuti jalannya diskusi dengan baik",
  4: "Mampu berbahasa asing (minimal bahasa daerah/nasional)",
  5: "Telah membaca buku undang-undang gerakan pramuka",
  6: "Mengenal AD & ART Gerakan Pramuka",
  7: "Dapat menjelaskan sejarah kepramukaan Indonesia & dunia",
  8: "Dapat menjelaskan lambang gerakan pramuka",
  9: "Dapat menjelaskan dan mempraktikkan salam pramuka",
  10: "Dapat menyanyikan lagu kebangsaan Indonesia Raya",
  11: "Mampu menjelaskan pancasila & tri satya",
  12: "Membayar iuran pramuka teratur & menabung",
  13: "Dapat menjelaskan sejarah ASEAN & PBB",
  14: "Dapat menjelaskan tentang kewirausahaan",
  15: "Dapat mendaur ulang barang bekas",
  16: "Dapat menerapkan teknologi informasi",
  17: "Dapat menjelaskan tentang mitigasi bencana alam",
  18: "Mengenal organisasi sangga & ambalan",
  19: "Mampu menggunakan kompas & peta pita",
  20: "Mampu membuat pioneering kaki tiga",
  21: "Dapat berenang atau menguasai bela diri",
  22: "Mampu menjelaskan penyakit menular",
  23: "Melakukan aktivitas olahraga teratur"
};

export const initialSKUDefs: SKUItemDef[] = [
  // Bantara
  { id: "def_b_1", no_item: 1, tingkat: "Bantara", deskripsi: "Mampu keagamaan masing-masing & toleransi beragama" },
  { id: "def_b_2", no_item: 2, tingkat: "Bantara", deskripsi: "Berani menyampaikan pendapat di muka umum" },
  { id: "def_b_3", no_item: 3, tingkat: "Bantara", deskripsi: "Dapat mengikuti jalannya diskusi dengan baik" },
  { id: "def_b_4", no_item: 4, tingkat: "Bantara", deskripsi: "Mampu berbahasa asing (minimal bahasa daerah/nasional)" },
  { id: "def_b_5", no_item: 5, tingkat: "Bantara", deskripsi: "Telah membaca buku undang-undang gerakan pramuka" },
  { id: "def_b_6", no_item: 6, tingkat: "Bantara", deskripsi: "Mengenal AD & ART Gerakan Pramuka" },
  { id: "def_b_7", no_item: 7, tingkat: "Bantara", deskripsi: "Dapat menjelaskan sejarah kepramukaan Indonesia & dunia" },
  { id: "def_b_8", no_item: 8, tingkat: "Bantara", deskripsi: "Dapat menjelaskan lambang gerakan pramuka" },
  { id: "def_b_9", no_item: 9, tingkat: "Bantara", deskripsi: "Dapat menjelaskan dan mempraktikkan salam pramuka" },
  { id: "def_b_10", no_item: 10, tingkat: "Bantara", deskripsi: "Dapat menyanyikan lagu kebangsaan Indonesia Raya" },
  { id: "def_b_11", no_item: 11, tingkat: "Bantara", deskripsi: "Mampu menjelaskan pancasila & tri satya" },
  { id: "def_b_12", no_item: 12, tingkat: "Bantara", deskripsi: "Membayar iuran pramuka teratur & menabung" },
  { id: "def_b_13", no_item: 13, tingkat: "Bantara", deskripsi: "Dapat menjelaskan sejarah ASEAN & PBB" },
  { id: "def_b_14", no_item: 14, tingkat: "Bantara", deskripsi: "Dapat menjelaskan tentang kewirausahaan" },
  { id: "def_b_15", no_item: 15, tingkat: "Bantara", deskripsi: "Dapat mendaur ulang barang bekas" },
  { id: "def_b_16", no_item: 16, tingkat: "Bantara", deskripsi: "Dapat menerapkan teknologi informasi" },
  { id: "def_b_17", no_item: 17, tingkat: "Bantara", deskripsi: "Dapat menjelaskan tentang mitigasi bencana alam" },
  { id: "def_b_18", no_item: 18, tingkat: "Bantara", deskripsi: "Mengenal organisasi sangga & ambalan" },
  { id: "def_b_19", no_item: 19, tingkat: "Bantara", deskripsi: "Mampu menggunakan kompas & peta pita" },
  { id: "def_b_20", no_item: 20, tingkat: "Bantara", deskripsi: "Mampu membuat pioneering kaki tiga" },
  { id: "def_b_21", no_item: 21, tingkat: "Bantara", deskripsi: "Dapat berenang atau menguasai bela diri" },
  { id: "def_b_22", no_item: 22, tingkat: "Bantara", deskripsi: "Mampu menjelaskan penyakit menular" },
  { id: "def_b_23", no_item: 23, tingkat: "Bantara", deskripsi: "Melakukan aktivitas olahraga teratur" },

  // Laksana
  { id: "def_l_1", no_item: 1, tingkat: "Laksana", deskripsi: "Menerima dan memimpin upacara ambalan dengan khidmat" },
  { id: "def_l_2", no_item: 2, tingkat: "Laksana", deskripsi: "Menjadi teladan dalam kehidupan bermasyarakat sesuai adat ambalan" },
  { id: "def_l_3", no_item: 3, tingkat: "Laksana", deskripsi: "Aktif dalam kepengurusan dewan ambalan atau kegiatan sekolah" },
  { id: "def_l_4", no_item: 4, tingkat: "Laksana", deskripsi: "Menyelenggarakan pertemuan diskusi pramuka tingkat ambalan" },
  { id: "def_l_5", no_item: 5, tingkat: "Laksana", deskripsi: "Dapat membimbing calon penegak dan penegak bantara" },
  { id: "def_l_6", no_item: 6, tingkat: "Laksana", deskripsi: "Membuat rencana kerja dan anggaran ambalan" },
  { id: "def_l_7", no_item: 7, tingkat: "Laksana", deskripsi: "Melakukan kampanye sosial di lingkungan masyarakat" },
  { id: "def_l_8", no_item: 8, tingkat: "Laksana", deskripsi: "Menunjukkan kecakapan khusus dalam bidang teknologi" },
  { id: "def_l_9", no_item: 9, tingkat: "Laksana", deskripsi: "Mengikuti kegiatan pengabdian masyarakat atau bakti sosial" },
  { id: "def_l_10", no_item: 10, tingkat: "Laksana", deskripsi: "Dapat merancang penjelajahan alam dengan aman" },
  { id: "def_l_11", no_item: 11, tingkat: "Laksana", deskripsi: "Membuat artikel atau tulisan bertema kepramukaan" },
  { id: "def_l_12", no_item: 12, tingkat: "Laksana", deskripsi: "Mampu merencanakan tabungan kegiatan kemah mandiri" },
  { id: "def_l_13", no_item: 13, tingkat: "Laksana", deskripsi: "Dapat memberikan penjelasan tentang hak asasi manusia" },
  { id: "def_l_14", no_item: 14, tingkat: "Laksana", deskripsi: "Mengaplikasikan prinsip sanitasi lingkungan di sekolah" },
  { id: "def_l_15", no_item: 15, tingkat: "Laksana", deskripsi: "Mengatur pertolongan pertama pada kecelakaan (PPPK)" },
  { id: "def_l_16", no_item: 16, tingkat: "Laksana", deskripsi: "Menunjukkan karya seni atau budaya tradisional ambalan" },
  { id: "def_l_17", no_item: 17, tingkat: "Laksana", deskripsi: "Mengikuti forum penegak tingkat kwartir cabang" },
  { id: "def_l_18", no_item: 18, tingkat: "Laksana", deskripsi: "Mengidentifikasi keanekaragaman hayati sekitar" },
  { id: "def_l_19", no_item: 19, tingkat: "Laksana", deskripsi: "Mengoperasikan kompas bidik dengan akurasi tinggi" },
  { id: "def_l_20", no_item: 20, tingkat: "Laksana", deskripsi: "Membuat rancangan konstruksi jembatan tali sederhana" },
  { id: "def_l_21", no_item: 21, tingkat: "Laksana", deskripsi: "Menguasai salah satu keterampilan olahraga ekstrem/bela diri lanjutan" },
  { id: "def_l_22", no_item: 22, tingkat: "Laksana", deskripsi: "Menerapkan gaya hidup sehat bebas narkoba secara konsisten" }
];

// --- SKK DEFINITIONS (10 TKK Wajib & Unggulan Penegak) ---
export const initialSKKDefs: SKKDef[] = [
  { id: "skk_1", kode: "TKK-KEMAH", nama: "Berkemah", bidang: "Ketangkasan & Kesehatan", deskripsi: "Mampu mendirikan tenda, mengelola tapak perkemahan, dan hidup di alam terbuka minimal 3 hari berturut-turut.", warna_badge: "bg-emerald-600" },
  { id: "skk_2", kode: "TKK-MASAK", nama: "Juru Masak", bidang: "Keterampilan & Pembangunan", deskripsi: "Mampu menyusun menu gizi seimbang, memasak untuk sangga/ambalan, serta menjaga sanitasi dapur perkemahan.", warna_badge: "bg-amber-600" },
  { id: "skk_3", kode: "TKK-P3K", nama: "Pertolongan Pertama (P3K)", bidang: "Ketangkasan & Kesehatan", deskripsi: "Menguasai teknik balut bidai, penanganan luka bakar, pingsan, resusitasi dasar, dan evakuasi tandu darurat.", warna_badge: "bg-rose-600" },
  { id: "skk_4", kode: "TKK-RUANG", nama: "Pengatur Ruangan", bidang: "Patriotisme & Seni", deskripsi: "Mampu menata interior sanggar, ruang pertemuan ambalan, dekorasi panggung upacara, dan penataan arsip.", warna_badge: "bg-indigo-600" },
  { id: "skk_5", kode: "TKK-AMAT", nama: "Pengamat", bidang: "Ketangkasan & Kesehatan", deskripsi: "Mampu mengingat detail benda dalam waktu singkat (Kim Memory), membaca jejak medan, dan observasi lingkungan.", warna_badge: "bg-blue-600" },
  { id: "skk_6", kode: "TKK-JALAN", nama: "Gerak Jalan", bidang: "Ketangkasan & Kesehatan", deskripsi: "Mampu menempuh jarak jalan kaki minimal 20 km dengan formasi barisan rapi dan fisik prima.", warna_badge: "bg-teal-600" },
  { id: "skk_7", kode: "TKK-QARI", nama: "Qari / Doa", bidang: "Agama & Mental", deskripsi: "Mampu membaca kitab suci dengan tajwid baik atau memimpin doa dalam upacara pembukaan dan penutupan ambalan.", warna_badge: "bg-violet-600" },
  { id: "skk_8", kode: "TKK-TABUNG", nama: "Menabung", bidang: "Keterampilan & Pembangunan", deskripsi: "Memiliki buku tabungan aktif, menyisihkan uang saku secara disiplin selama minimal 6 bulan berturut-turut.", warna_badge: "bg-cyan-600" },
  { id: "skk_9", kode: "TKK-KEBUN", nama: "Juru Kebun", bidang: "Sosial & Gotong Royong", deskripsi: "Mampu merawat tanaman pekarangan sekolah, hidroponik sederhana, serta pembudidayaan tanaman obat keluarga (TOGA).", warna_badge: "bg-green-700" },
  { id: "skk_10", kode: "TKK-SANDI", nama: "Komunikasi & Sandi", bidang: "Keterampilan & Pembangunan", deskripsi: "Menguasai pengiriman dan penerimaan sandi Morse (peluit/bendera) serta Semaphore dengan kecepatan standar.", warna_badge: "bg-purple-600" }
];

export const initialSKKRecords: SKKRecord[] = [
  { id: "skkr_1", siswa_id: "s1", skk_def_id: "skk_1", tingkat: "Purwa", tanggal_lulus: "2026-05-15", pembina_verifikator: "Kak Jihan Fadhilah, S. Kom", status_verifikasi: true, catatan_penguji: "Praktik berkemah Persami sukses mendirikan tenda komando." },
  { id: "skkr_2", siswa_id: "s1", skk_def_id: "skk_3", tingkat: "Purwa", tanggal_lulus: "2026-05-20", pembina_verifikator: "Kak Jihan Fadhilah, S. Kom", status_verifikasi: true, catatan_penguji: "Balut bidai lengan bawah dinilai sangat presisi." },
  { id: "skkr_3", siswa_id: "s2", skk_def_id: "skk_10", tingkat: "Madya", tanggal_lulus: "2026-06-02", pembina_verifikator: "Kak Wahyu, M.Kom.", status_verifikasi: true, catatan_penguji: "Penerimaan Semaphore 30 kata/menit tanpa kesalahan." },
  { id: "skkr_4", siswa_id: "s4", skk_def_id: "skk_2", tingkat: "Utama", tanggal_lulus: "2026-06-18", pembina_verifikator: "Kak Jihan Fadhilah, S. Kom", status_verifikasi: true, catatan_penguji: "Memimpin dapur umum perkemahan untuk 40 personil." },
  { id: "skkr_5", siswa_id: "s3", skk_def_id: "skk_8", tingkat: "Purwa", tanggal_lulus: "2026-07-01", pembina_verifikator: "Kak Jihan Fadhilah, S. Kom", status_verifikasi: true, catatan_penguji: "Buku tabungan ambalan tercatat rutin setiap pekan." }
];

// --- KEGIATAN & QR ATTENDANCE EVENTS ---
export const initialKegiatanEvents: KegiatanEvent[] = [
  {
    id: "evt_1",
    nama_kegiatan: "Latihan Rutin Penegak: Pionering & Navigasi Darat",
    kategori: "Latihan Rutin",
    tanggal: "2026-09-18",
    jam_mulai: "15:00",
    jam_selesai: "17:30",
    lokasi: "Lapangan Utama SMK Bakti Idhata Jakarta",
    lat: -6.29548,
    lng: 106.79975,
    radius_meter: 150,
    qr_token: "PRAMUKA-BI-LAT-20260918",
    is_active: true,
    deskripsi: "Latihan mingguan wajib seluruh Penegak Bantara & Calon Penegak. Materi pembuatan tiang bendera kaki tiga dan kompas bidik."
  },
  {
    id: "evt_2",
    nama_kegiatan: "Kemah Bakti Pelantikan Penegak Bantara 2026",
    kategori: "Perkemahan",
    tanggal: "2026-10-10",
    jam_mulai: "07:00",
    jam_selesai: "16:00",
    lokasi: "Bumi Perkemahan Cibubur / Sanggar Bakti Idhata",
    lat: -6.36832,
    lng: 106.89945,
    radius_meter: 300,
    qr_token: "PRAMUKA-BI-KEMAH-20261010",
    is_active: false,
    deskripsi: "Perkemahan pelantikan uji syarat kecakapan umum Penegak Bantara angkatan baru."
  },
  {
    id: "evt_3",
    nama_kegiatan: "Apel Hari Pramuka & Upacara Ulang Janji",
    kategori: "Apel & Upacara",
    tanggal: "2026-08-14",
    jam_mulai: "07:30",
    jam_selesai: "09:00",
    lokasi: "Plaza Upacara SMK Bakti Idhata",
    lat: -6.29548,
    lng: 106.79975,
    radius_meter: 100,
    qr_token: "PRAMUKA-BI-APEL-20260814",
    is_active: false,
    deskripsi: "Upacara peringatan Hari Pramuka bersama Majelis Pembimbing Gugus Depan."
  }
];

// --- INVENTARIS & LOGISTIK AMBALAN ---
export const initialBarangInventaris: BarangInventaris[] = [
  { id: "inv_1", kode_barang: "TND-DOME-01", nama_barang: "Tenda Dome Kapasitas 4 Orang (Consina)", kategori: "Tenda & Berkemah", jumlah_total: 8, jumlah_tersedia: 6, kondisi_baik: 7, kondisi_rusak: 1, lokasi_rak: "Gudang Sanggar Rak A-1", keterangan: "Waterproof 3000mm, lengkap pasak & frame fiber" },
  { id: "inv_2", kode_barang: "TND-PLTN-01", nama_barang: "Tenda Pleton / Komando Regu", kategori: "Tenda & Berkemah", jumlah_total: 2, jumlah_tersedia: 2, kondisi_baik: 2, kondisi_rusak: 0, lokasi_rak: "Gudang Sanggar Rak A-2", keterangan: "Bahan terpal militer tebal, kapasitas 20 orang" },
  { id: "inv_3", kode_barang: "PSK-BSI-01", nama_barang: "Pasak Tenda Besi Galvanis 30cm", kategori: "Tenda & Berkemah", jumlah_total: 60, jumlah_tersedia: 45, kondisi_baik: 55, kondisi_rusak: 5, lokasi_rak: "Box Perkakas B-1", keterangan: "Besi ulir kuat anti bengkok" },
  { id: "inv_4", kode_barang: "TGK-PRM-01", nama_barang: "Tongkat Pramuka Kayu Jati Lapis Vernis (160cm)", kategori: "Pionering & Tali", jumlah_total: 40, jumlah_tersedia: 25, kondisi_baik: 36, kondisi_rusak: 4, lokasi_rak: "Stand Tongkat Sudut Kanan", keterangan: "Standar tiang bendera dan pioneering regu" },
  { id: "inv_5", kode_barang: "TLI-PRM-01", nama_barang: "Tali Tambang Pramuka Nilon 10 Meter", kategori: "Pionering & Tali", jumlah_total: 50, jumlah_tersedia: 40, kondisi_baik: 48, kondisi_rusak: 2, lokasi_rak: "Box Tali B-2", keterangan: "Diameter 6mm kuat untuk simpul dan ikatan" },
  { id: "inv_6", kode_barang: "SMP-BND-01", nama_barang: "Bendera Semaphore Sepasang + Stik Kayu", kategori: "Komunikasi & Sandi", jumlah_total: 15, jumlah_tersedia: 11, kondisi_baik: 14, kondisi_rusak: 1, lokasi_rak: "Lemari Kaca Kiri", keterangan: "Warna standar merah kuning kontras" },
  { id: "inv_7", kode_barang: "MRS-PLT-01", nama_barang: "Peluit Morse Lapangan Acme Thunderer", kategori: "Komunikasi & Sandi", jumlah_total: 10, jumlah_tersedia: 10, kondisi_baik: 10, kondisi_rusak: 0, lokasi_rak: "Laci Administrasi Kerani", keterangan: "Suara lantang jangkauan 300 meter" },
  { id: "inv_8", kode_barang: "NST-KPR-01", nama_barang: "Nesting Alat Masak Tentara (3 Susun)", kategori: "Dapur & Masak", jumlah_total: 12, jumlah_tersedia: 8, kondisi_baik: 11, kondisi_rusak: 1, lokasi_rak: "Lemari Dapur C-1", keterangan: "Bahan aluminium tebal, lengkap gagang lipat" },
  { id: "inv_9", kode_barang: "KMP-SPT-01", nama_barang: "Kompor Portable / Lapangan Mini", kategori: "Dapur & Masak", jumlah_total: 6, jumlah_tersedia: 4, kondisi_baik: 6, kondisi_rusak: 0, lokasi_rak: "Lemari Dapur C-2", keterangan: "Bisa gas kaleng atau spirtus tablet" },
  { id: "inv_10", kode_barang: "KMS-BDK-01", nama_barang: "Kompas Bidik Prisma Militer", kategori: "Komunikasi & Sandi", jumlah_total: 8, jumlah_tersedia: 6, kondisi_baik: 8, kondisi_rusak: 0, lokasi_rak: "Laci Alat Navigasi", keterangan: "Presisi tinggi untuk resection / intersection" },
  { id: "inv_11", kode_barang: "MED-P3K-01", nama_barang: "Tas Ransel Medis P3K Lapangan Lengkap", kategori: "P3K & Medis", jumlah_total: 4, jumlah_tersedia: 4, kondisi_baik: 4, kondisi_rusak: 0, lokasi_rak: "Kotak P3K Sanggar", keterangan: "Mitela, kassa steril, betadine, bidai lipat, oksigen kaleng" }
];

export const initialPeminjamanLogistik: PeminjamanLogistik[] = [
  { id: "pinjam_1", barang_id: "inv_1", nama_peminjam: "Jihan Pratama", sangga_atau_kelas: "Sangga Perintis / XI TKJ 1", jumlah_pinjam: 2, tanggal_pinjam: "2026-09-12", tanggal_kembali_target: "2026-09-16", status: "Dipinjam", catatan: "Untuk latihan persiapan perkemahan sabtu-minggu" },
  { id: "pinjam_2", barang_id: "inv_4", nama_peminjam: "Ahmad Fauzi", sangga_atau_kelas: "Sangga Penegas / XI RPL 2", jumlah_pinjam: 15, tanggal_pinjam: "2026-09-14", tanggal_kembali_target: "2026-09-15", tanggal_kembali_aktual: "2026-09-15", status: "Kembali", kondisi_kembali: "Baik", catatan: "Latihan lomba pionering kaki tiga selesai tepat waktu" },
  { id: "pinjam_3", barang_id: "inv_6", nama_peminjam: "Lee Min-ho Septian", sangga_atau_kelas: "Sangga Pendobrak / XI TKJ 1", jumlah_pinjam: 4, tanggal_pinjam: "2026-09-10", tanggal_kembali_target: "2026-09-13", status: "Terlambat", catatan: "Latihan isyarat sandi demonstrasi ekstrakurikuler" }
];

// --- E-LIBRARY MATERI DIGITAL PRAMUKA ---
export const initialModulMateri: ModulMateri[] = [
  {
    id: "lib_1",
    judul: "Sandi Pramuka: Morse, Semaphore, & Sandi Kotak",
    kategori: "Sandi",
    ringkasan: "Panduan lengkap menghafal kode Morse internasional, isyarat Semaphore tangan, dan algoritma pemecahan Sandi Kotak I & II.",
    tingkat_rekomendasi: "Semua Tingkat",
    konten_lengkap: `### 1. Sandi Morse
Kode Morse ditemukan oleh Samuel F.B. Morse pada tahun 1838. Sandi ini menggunakan kombinasi titik (.) dan strip (-) yang dapat dikirimkan melalui:
- **Peluit**: Bunyi pendek (1 ketukan) = Titik; Bunyi panjang (3 ketukan) = Strip.
- **Senter**: Kedipan cepat = Titik; Nyala lama = Strip.
- **Bendera Morse**: Ayunan ke kiri/kanan.

**Rumus Cepat Menghafal Alfabet Morse:**
- **Huruf EISH (Hanya Titik):** E (.), I (..), S (...), H (....)
- **Huruf TMO (Hanya Strip):** T (-), M (--), O (---)
- **Huruf Kebalikan:**
  - A (.-) >< N (-.)
  - U (..-) >< D (-..)
  - V (...-) >< B (-...)
  - W (.--) >< G (--.)

---

### 2. Isyarat Semaphore
Semaphore menggunakan sepasang bendera berukuran 45x45 cm warna merah-kuning diagonal.
Posisi tangan dihitung searah jarum jam melingkari 8 penjuru sudut:
- Lingkaran I (A - G): Gerakan tangan kanan 1 langkah ke kiri/bawah.
- Lingkaran II (H - N tanpa J): Posisi tangan kiri di sudut 45 derajat bawah.
- Lingkaran III (O - S): Posisi tangan kiri horizontal 90 derajat.

---

### 3. Sandi Kotak I & II
- **Sandi Kotak I**: Menggunakan bagan pagar (#) dan silang (X). Setiap kotak memuat 2 huruf, huruf kedua diberi tanda titik.
- **Sandi Kotak II**: Menggunakan bagan pagar tunggal yang memuat 3 huruf dalam satu kotak. Huruf ke-2 diberi satu titik, huruf ke-3 diberi dua titik.`
  },
  {
    id: "lib_2",
    judul: "Master Simpul & Ikatan Tali Pionering",
    kategori: "Simpul & Ikatan",
    ringkasan: "Teknik membuat Simpul Hidup, Mati, Pangkal, Jangkar, Kembar, Anyam, serta Ikatan Palang, Silang, dan Canggah.",
    tingkat_rekomendasi: "Penegak Bantara",
    konten_lengkap: `### Perbedaan Simpul dan Ikatan
- **Simpul (Knot)**: Hubungan antara tali dengan tali lainnya.
- **Ikatan (Lashing)**: Hubungan antara tali dengan benda lain (seperti tongkat kayu, pohon, atau ring besi).

---

### Macam-Macam Simpul Wajib Penegak:
1. **Simpul Pangkal (Clove Hitch)**:
   - *Fungsi*: Memulai dan mengakhiri hampir seluruh ikatan pionering pada tongkat.
2. **Simpul Jangkar (Cow Hitch / Lark's Head)**:
   - *Fungsi*: Menautkan tali pada cincin, membuat dragbar tandu darurat, atau mengikat jangkar perahu.
3. **Simpul Mati (Reef Knot / Square Knot)**:
   - *Fungsi*: Menyambung 2 utas tali yang sama besar dan dalam kondisi kering. Sangat mudah dibuka kembali.
4. **Simpul Anyam (Sheet Bend)**:
   - *Fungsi*: Menyambung 2 utas tali yang tidak sama besar dan kering.
5. **Simpul Kembar / Nelayan (Fisherman's Knot)**:
   - *Fungsi*: Menyambung 2 utas tali yang licin atau dalam kondisi basah.

---

### Tiga Ikatan Utama Pionering:
1. **Ikatan Palang (Square Lashing)**: Mengikat 2 tongkat kayu yang bersilangan tegak lurus membentuk sudut 90°.
2. **Ikatan Silang (Diagonal Lashing)**: Mengikat 2 tongkat yang bersilangan membentuk sudut tidak 90° (diagonal).
3. **Ikatan Canggah (Sheer Lashing)**: Menyambung 2 tongkat kayu menjadi lebih panjang secara vertikal (misal: tiang bendera).`
  },
  {
    id: "lib_3",
    judul: "Navigasi Darat, Kompas Bidik, & Peta Pita",
    kategori: "Navigasi Darat",
    ringkasan: "Keterampilan menentukan arah mata angin, membaca azimuth & back-azimuth, serta menyusun peta pita perjalanan penjelajahan.",
    tingkat_rekomendasi: "Penegak Laksana",
    konten_lengkap: `### 1. Kompas Bidik & Dial Sudut
Kompas bidik digunakan untuk menentukan arah sasaran medan (Target Bearing) dengan akurasi 1 derajat.
- **Azimuth**: Sudut horizontal searah jarum jam dari arah utara menuju sasaran bidik.
- **Back-Azimuth (Sudut Balik)**:
  - Jika Azimuth < 180°, maka Back-Azimuth = Azimuth + 180°.
  - Jika Azimuth > 180°, maka Back-Azimuth = Azimuth - 180°.
  *Contoh*: Jika sasaran bidik 45°, maka arah pulang adalah 45 + 180 = 225°.

---

### 2. Cara Membuat Peta Pita (Ribbon Map)
Peta pita adalah laporan visual perjalanan dari titik awal ke titik akhir penjelajahan yang digambar memanjang dari bawah ke atas pada kertas pita.
**Kolom-kolom Peta Pita:**
1. Nomor Pos / Checkpoint
2. Waktu Tempuh (Jam & Menit)
3. Jarak Tempuh (Meter / Langkah)
4. Arah Kompas (Derajat Sudut Azimuth)
5. Peta Rute Garis Perjalanan
6. Tanda Medan Kiri (Gedung, Sungai, Sawah, Masjid)
7. Tanda Medan Kanan (Pohon beringin, Jalan raya, Lapangan)
8. Keterangan / Suhu Cuaca`
  },
  {
    id: "lib_4",
    judul: "Pertolongan Pertama Pada Gawat Darurat (PPGD)",
    kategori: "PPGD / P3K",
    ringkasan: "Prosedur penanganan korban kecelakaan, pembidaian fraktur tulang, pembalutan mitela segitiga, dan resusitasi darurat.",
    tingkat_rekomendasi: "Semua Tingkat",
    konten_lengkap: `### Prinsip Utama 3A dalam P3K:
1. **Aman Diri**: Pastikan penolong aman dari bahaya api, listrik, atau lalu lintas.
2. **Aman Lingkungan**: Sterilkan lokasi dari kerumunan massa yang panik.
3. **Aman Korban**: Jangan memindahkan korban tanpa fiksasi leher jika ada indikasi cedera tulang belakang.

---

### Penanganan Kasus Umum Lapangan:
1. **Luka Sayat / Berdarah**: Tekan langsung pada luka menggunakan kasa steril (Direct Pressure), posisikan bagian luka lebih tinggi dari jantung jika memungkinkan.
2. **Patah Tulang (Fraktur)**: Lakukan fiksasi minimal melewati dua sendi di atas dan di bawah tulang yang patah menggunakan bidai spalk kayu dan ikatan mitela yang tidak terlalu ketat.
3. **Pingsan / Heat Stroke**: Pindahkan ke tempat teduh, longgarkan kerah baju/ikat pinggang, angkat kaki 30 cm lebih tinggi dari kepala agar aliran darah ke otak kembali normal.`
  },
  {
    id: "lib_5",
    judul: "Sejarah Kepramukaan Indonesia & Riwayat Baden Powell",
    kategori: "Sejarah & Organisasi",
    ringkasan: "Napak tilas berdirinya gerakan kepanduan dunia oleh Lord Baden Powell of Gilwell hingga lahirnya Keppres No. 238 Tahun 1961 di Indonesia.",
    tingkat_rekomendasi: "Semua Tingkat",
    konten_lengkap: `### 1. Bapak Pandu Dunia: Lord Baden Powell
- Nama Asli: Robert Stephenson Smyth Baden-Powell.
- Lahir di London, Inggris pada 22 Februari 1857.
- Perkemahan kepanduan pertama diselenggarakan di Pulau Brownsea (Brownsea Island) pada tahun 1907 bersama 20 pemuda.
- Menulis mahakarya buku *"Scouting for Boys"* pada tahun 1908 yang menjadi pedoman pandu sedunia.

---

### 2. Sejarah Gerakan Pramuka di Indonesia
- Gerakan kepanduan masuk ke Nusantara sejak zaman kolonial Hindia Belanda (NIPV - Nederlandsche Indische Padvinders Vereeniging).
- Tokoh nasional KH. Agus Salim pertama kali mencetuskan istilah "Pandu" atau "Kepanduan" untuk menggantikan istilah bahasa Belanda yang dilarang.
- **Tonggak Sejarah 14 Agustus 1961**: Presiden Ir. Soekarno menyatukan lebih dari 60 organisasi kepanduan menjadi satu wadah tunggal: **GERAKAN PRAMUKA**, ditandai dengan penganugerahan Panji Gerakan Pramuka melalui Keppres No. 238 Tahun 1961.`
  }
];

export const initialSilabusLatihan: SilabusLatihan[] = [
  { id: "sil_1", minggu_ke: 1, bulan: "September", topik_utama: "Pengenalan Ambalan & Dinamika Sangga", tujuan: "Calon penegak mengenal adat ambalan, tata krama sanggar, dan pembentukan struktur sangga.", skenario: "Apel pembukaan, ice breaking sangga, pemaparan sejarah Ambalan Bakti Idhata, dan musyawarah sangga.", pj_instruktur: "Kak Jihan Fadhilah, S. Kom" },
  { id: "sil_2", minggu_ke: 2, bulan: "September", topik_utama: "Teknik Kepramukaan: Sandi Morse & Semaphore Lanjutan", tujuan: "Anggota mampu membaca dan mengirim pesan sandi jarak 50 meter dengan cepat dan tepat.", skenario: "Praktik stasiun isyarat estafet sandi, kuis tebak kata antar sangga, dan bedah sandi kotak.", pj_instruktur: "Kak Lee Min-ho Septian" },
  { id: "sil_3", minggu_ke: 3, bulan: "September", topik_utama: "Pionering Konstruksi Tiang Kaki Tiga & Menara Pandang", tujuan: "Anggota menguasai ikatan palang, silang, dan simpul pangkal dalam pembuatan konstruksi kokoh.", skenario: "Simulasi mendirikan menara pandang mini dengan 12 tongkat, uji beban dan kestabilan simpul.", pj_instruktur: "Kak Wahyu, M.Kom." },
  { id: "sil_4", minggu_ke: 4, bulan: "September", topik_utama: "Pertolongan Pertama (PPGD) & Pembuatan Tandu Dragbar", tujuan: "Anggota mampu mengevakuasi korban cedera lapangan dengan tandu darurat secara aman.", skenario: "Studi kasus korban jatuh di medan perkemahan, praktik balut bidai cepat, dan balap tandu halang rintang.", pj_instruktur: "Kak Siti Rahmawati" }
];

// --- KEUANGAN & KAS AMBALAN ---
export const initialTransaksiKas: TransaksiKas[] = [
  { id: "kas_1", tanggal: "2026-08-01", tipe: "Pemasukan", kategori: "Subsidi Sekolah", jumlah: 1500000, deskripsi: "Alokasi anggaran ekstrakurikuler Pramuka semester ganjil dari bendahara sekolah", keterangan: "Alokasi anggaran ekstrakurikuler Pramuka semester ganjil dari bendahara sekolah", pj_bendahara: "Dewi Lestari", nomor_bukti: "BKT-SCH-0801" },
  { id: "kas_2", tanggal: "2026-08-08", tipe: "Pemasukan", kategori: "Iuran Kas Mingguan", jumlah: 240000, deskripsi: "Iuran kas mingguan sangga perintis, penegas, pendobrak (30 anggota)", keterangan: "Iuran kas mingguan sangga perintis, penegas, pendobrak (30 anggota)", pj_bendahara: "Dewi Lestari", nomor_bukti: "KAS-W1-08" },
  { id: "kas_3", tanggal: "2026-08-14", tipe: "Pengeluaran", kategori: "Perlengkapan Kegiatan", jumlah: 350000, deskripsi: "Pembelian pita merah putih, baterai megafon, dan perlengkapan Apel Hari Pramuka", keterangan: "Pembelian pita merah putih, baterai megafon, dan perlengkapan Apel Hari Pramuka", pj_bendahara: "Dewi Lestari", nomor_bukti: "NOT-KGT-0814" },
  { id: "kas_4", tanggal: "2026-08-14", tipe: "Pengeluaran", kategori: "Konsumsi Latihan", jumlah: 280000, deskripsi: "Konsumsi snack box dan air mineral galon apel 14 Agustus", keterangan: "Konsumsi snack box dan air mineral galon apel 14 Agustus", pj_bendahara: "Dewi Lestari", nomor_bukti: "NOT-KNS-0814" },
  { id: "kas_5", tanggal: "2026-08-22", tipe: "Pemasukan", kategori: "Donasi/Sponsor", jumlah: 500000, deskripsi: "Donasi alumni Dewan Kehormatan angkatan 2023 untuk kas operasional ambalan", keterangan: "Donasi alumni Dewan Kehormatan angkatan 2023 untuk kas operasional ambalan", pj_bendahara: "Dewi Lestari", nomor_bukti: "BKT-ALM-0822" },
  { id: "kas_6", tanggal: "2026-09-05", tipe: "Pengeluaran", kategori: "Logistik & Alat", jumlah: 420000, deskripsi: "Pembelian 5 roll tali tambang nilon dan perbaikan 2 set ritsleting tenda dome", keterangan: "Pembelian 5 roll tali tambang nilon dan perbaikan 2 set ritsleting tenda dome", pj_bendahara: "Dewi Lestari", nomor_bukti: "NOT-SAR-0905" },
  { id: "kas_7", tanggal: "2026-09-12", tipe: "Pemasukan", kategori: "Iuran Kas Mingguan", jumlah: 280000, deskripsi: "Iuran kas wajib pekan ke-2 September", keterangan: "Iuran kas wajib pekan ke-2 September", pj_bendahara: "Dewi Lestari", nomor_bukti: "KAS-W2-09" }
];
export const initialKas = initialTransaksiKas;

// --- STRUKTUR RESMI GUGUS DEPAN SMK BAKTI IDHATA (T.A. 2026-2027) ---
// Gudep Putra 06.193 (Ambalan Ki Hajar Dewantara) & Gudep Putri 06.194 (Ambalan Dewi Sartika)

export const initialMabigus: MabigusMember[] = [
  { jabatan: "Ketua Mabigus", nama: "Machfud Yachya, M. Pd", instansi_jabatan: "Ketua Yayasan Bakti Idhata" },
  { jabatan: "Wakil Ketua Mabigus", nama: "Nurman, M. Pd", instansi_jabatan: "Kepala SMK Bakti Idhata" },
  { jabatan: "Sekretaris Mabigus", nama: "Putri Septiningrum", instansi_jabatan: "Tata Usaha Bid. Administrasi" },
  { jabatan: "Bendahara Mabigus", nama: "Taufik Hidayat, S. Pd", instansi_jabatan: "Kepala Tata Usaha SMK" },
  { jabatan: "Anggota Mabigus", nama: "Ayu Risti Widyatiningrum, S. Pd", instansi_jabatan: "Bendahara SMK" },
  { jabatan: "Anggota Mabigus", nama: "Lilis Ayida Santi, S. Pd", instansi_jabatan: "Guru dan Pembina PMR" },
  { jabatan: "Anggota Mabigus", nama: "Sukani, M. Pd", instansi_jabatan: "Wakil Kepala Sekolah Bid. Kurikulum" },
  { jabatan: "Ketua Gugusdepan Putra (Ex-Officio)", nama: "Dhenny Effendi, S. Pd", instansi_jabatan: "Wakil Kepala Sekolah Bid. Kesiswaan", is_ex_officio: true },
  { jabatan: "Ketua Gugusdepan Putri (Ex-Officio)", nama: "Dahlianah, SE., M. Pd", instansi_jabatan: "Wakil Kepala Sekolah Bid. Sarana Prasarana", is_ex_officio: true }
];

export const initialGudepPutra: GudepMember[] = [
  { jabatan: "Ketua Gugusdepan", nama: "Dhenny Effendi, S. Pd", keterangan: "Wakil Kepala Sekolah Bid. Kesiswaan", nomor_gudep: "06.193", ambalan: "Ambalan Ki Hajar Dewantara" },
  { jabatan: "Sekretaris Gugusdepan", nama: "Stefans Khrisna Bayu, S. I. Kom", keterangan: "Kepala Konsentrasi Keahlian DKV", nomor_gudep: "06.193", ambalan: "Ambalan Ki Hajar Dewantara" },
  { jabatan: "Bendahara Gugusdepan", nama: "Wahdi Mulyawan, S. Pd", keterangan: "Guru dan Pembina Osis", nomor_gudep: "06.193", ambalan: "Ambalan Ki Hajar Dewantara" },
  { jabatan: "Ketua Bidang Pembinaan Anggota Muda dan Dewasa", nama: "Sukani, M. Pd", keterangan: "Wakil Kepala Sekolah Bid. Kurikulum", nomor_gudep: "06.193", ambalan: "Ambalan Ki Hajar Dewantara" },
  { jabatan: "Pembina Satuan Putra", nama: "Kak Sultan Haidar Basyar, S. Pd", keterangan: "Wakil Kepala Sekolah Bid. Hubin", nomor_gudep: "06.193", ambalan: "Ambalan Ki Hajar Dewantara" },
  { jabatan: "Pembantu Pembina Satuan", nama: "Fanny Yolanda, S. Kom", keterangan: "Kepala Konsentrasi Keahlian TKJ", nomor_gudep: "06.193", ambalan: "Ambalan Ki Hajar Dewantara" },
  { jabatan: "Pembantu Pembina Satuan", nama: "Deni Ramdani, S. Pd", keterangan: "Guru dan PJ Perpustakaan", nomor_gudep: "06.193", ambalan: "Ambalan Ki Hajar Dewantara" },
  { jabatan: "Pembantu Pembina Satuan", nama: "Prayoga Yuliano Putra, S. Pd", keterangan: "Guru Bimbingan Konseling", nomor_gudep: "06.193", ambalan: "Ambalan Ki Hajar Dewantara" },
  { jabatan: "Pradana Putra (Ex-Officio Anggota)", nama: "Mochammad Erwinsyah, S. Pd", keterangan: "Guru dan Pembina Rohis", nomor_gudep: "06.193", ambalan: "Ambalan Ki Hajar Dewantara", is_ex_officio: true }
];

export const initialGudepPutri: GudepMember[] = [
  { jabatan: "Ketua Gugusdepan", nama: "Dahlianah, SE., M. Pd", keterangan: "Wakil Kepala Sekolah Bid. Sarana Prasarana", nomor_gudep: "06.194", ambalan: "Ambalan Dewi Sartika" },
  { jabatan: "Sekretaris Gugusdepan", nama: "Putri Septiningrum", keterangan: "Tata Usaha Bid. Administrasi", nomor_gudep: "06.194", ambalan: "Ambalan Dewi Sartika" },
  { jabatan: "Bendahara Gugusdepan", nama: "Ayu Risti Widyatiningrum, S. Pd", keterangan: "Bendahara SMK", nomor_gudep: "06.194", ambalan: "Ambalan Dewi Sartika" },
  { jabatan: "Ketua Bidang Pembinaan Anggota Muda dan Dewasa", nama: "Lilis Ayida Santi, S. Pd", keterangan: "Guru dan Pembina PMR", nomor_gudep: "06.194", ambalan: "Ambalan Dewi Sartika" },
  { jabatan: "Pembina Satuan Putri", nama: "Kak Jihan Fadhilah, S. Kom", keterangan: "Guru dan Pembina Pramuka", nomor_gudep: "06.194", ambalan: "Ambalan Dewi Sartika" },
  { jabatan: "Pembantu Pembina Satuan", nama: "Fitri Rizky Aningsih, S. Sn", keterangan: "Guru Produktif", nomor_gudep: "06.194", ambalan: "Ambalan Dewi Sartika" },
  { jabatan: "Pembantu Pembina Satuan", nama: "Sarah Nur Amalia, S. Pd", keterangan: "Guru dan Pembina Eskul", nomor_gudep: "06.194", ambalan: "Ambalan Dewi Sartika" },
  { jabatan: "Pembantu Pembina Satuan", nama: "Diza Ayu Vibrariani, S. Pd", keterangan: "Guru dan PJ Perpustakaan", nomor_gudep: "06.194", ambalan: "Ambalan Dewi Sartika" },
  { jabatan: "Pradana Putri (Ex-Officio Anggota)", nama: "Anisah Meidina", keterangan: "Guru dan Ketua Unit Produksi", nomor_gudep: "06.194", ambalan: "Ambalan Dewi Sartika", is_ex_officio: true }
];

// --- KEPENGURUSAN DEWAN AMBALAN PERIODIK ---
export const initialDewanAmbalan: PeriodeDewanAmbalan[] = [
  {
    id: "da_2026",
    periode: "2026-2027",
    tahun_ajaran: "2026-2027",
    is_active: true,
    is_aktif: true,
    nama_ambalan: "Gudep Putra 06.193 (Ki Hajar Dewantara) & Gudep Putri 06.194 (Dewi Sartika)",
    nomor_gudep_putra: "06.193",
    ambalan_putra: "Ambalan Ki Hajar Dewantara",
    nomor_gudep_putri: "06.194",
    ambalan_putri: "Ambalan Dewi Sartika",
    pembina_satuan_putra: "Kak Sultan Haidar Basyar, S. Pd",
    pembina_satuan_putri: "Kak Jihan Fadhilah, S. Kom",
    pembina_gudep: "Kak Sultan Haidar Basyar, S. Pd & Kak Jihan Fadhilah, S. Kom",
    mabigus: initialMabigus,
    gudep_putra: initialGudepPutra,
    gudep_putri: initialGudepPutri,
    dewan_kehormatan: [
      "Malik Khadafi Al Ghoni (XII TKJ)",
      "Della Rizkyani (XII DKV 2)"
    ],
    pemangku_adat_putra: "Daffa Arya Perkasa (XII RPL)",
    pemangku_adat_putri: "Khalifah Azzahra (XII DKV 2)",
    staff_pemangku_adat: [
      "Sabian Attila Taftazani Artha (XI RPL)",
      "Aurelia Khanza Sabrina Sari (XI RPL)"
    ],
    penegak_pradana_putra: "Raditya (XII DKV 2)",
    penegak_pradana_putri: "Nayla Janeeta (XII DKV 2)",
    staff_penegak_pradana: [
      "Zainun Ghilman Aziz (XI RPL)",
      "Carissa Rahma Zahirah (XI DKV 2)"
    ],
    pradana_putra: "Yasir Hidayatullah (XII TKJ)",
    pradana_putri: "Bilqis Suci Makayla (XII DKV 2)",
    staff_pradana: [
      "Dimas Aditya (XI RPL)",
      "Julfa Khairanih (XI DKV 2)"
    ],
    wakil_pradana_putra: "Rizky Anugrah Ramadhan (XII TKJ)",
    wakil_pradana_putri: "Intan Ayyu Nur Aini (XII DKV 1)",
    staff_wakil_pradana: [
      "Raffael Zaidan Alfaridzi (XI RPL)",
      "Najla Amelia Kirana (XI DKV 2)"
    ],
    kerani: "Fathier Assyarief (XII RPL)",
    kerani_putri: "Siti Humaira Auliahya (XII DKV 2)",
    staff_krani: [
      "Raihan Nur Irsyad (XI RPL)",
      "Nadya Ulya Khairunnisa (XI DKV 2)"
    ],
    bankir: "Sauqi Moebarok (XI DKV 2)",
    bendahara_2: "Hanifah Salsabilla (XI DKV 1)",
    giatop_putra: "Abdul Hafiidz (XI RPL)",
    giatop_putri: "Osriseffita Nurramadhaniah (XI DKV 1)",
    staff_giatop: [
      "Syahrul Sya'ban (XI RPL)",
      "Kanza Dwi Melviana (XI DKV 1)"
    ],
    tekram_list: [
      "Arif Zakariya (XII TKJ)",
      "M. Dwikie Dhermawan As'syidiq (XI TKJ)",
      "Shafa Azalia Andini (XI DKV 2)"
    ],
    staff_tekram: [
      "Raden Ahmad Faisal Mubaroq (XI DKV 1)",
      "Zayden Athaya Nareswara (XI TKJ)"
    ],
    visi_misi: "Mewujudkan Dewan Ambalan Ki Hajar Dewantara & Dewi Sartika SMK Bakti Idhata yang disiplin, berakhlak mulia, berprestasi kepramukaan, berwawasan digital, serta berdaya saing tinggi berlandaskan Trisatya dan Dasa Darma.",
    tanggal_sertijab: "2026-07-20",
    catatan_sertijab: "Dilantik secara resmi pada Upacara Pelantikan dan Ulang Janji Ambalan Ki Hajar Dewantara (Gudep 06.193) dan Dewi Sartika (Gudep 06.194) SMK Bakti Idhata di hadapan Pembina Satuan Putra & Putri serta disaksikan segenap Majelis Pembimbing Gugusdepan (Mabigus).",
    susunan_pengurus: [
      // 1. Dewan Kehormatan Putra & Putri
      { siswa_id: "da_s01", nama: "Malik Khadafi Al Ghoni", jabatan: "Dewan Kehormatan Putra", kelas: "XII TKJ", divisi: "Dewan Kehormatan", jenis_kelamin: "L", tugas_pokok: "Penasehat pertimbangan adat dan kehormatan ambalan putra" },
      { siswa_id: "da_s02", nama: "Della Rizkyani", jabatan: "Dewan Kehormatan Putri", kelas: "XII DKV 2", divisi: "Dewan Kehormatan", jenis_kelamin: "P", tugas_pokok: "Penasehat pertimbangan adat dan kehormatan ambalan putri" },
      // 2. Pemangku Adat Putra & Putri
      { siswa_id: "da_s03", nama: "Daffa Arya Perkasa", jabatan: "Pemangku Adat Putra", kelas: "XII RPL", divisi: "Pemangku Adat", jenis_kelamin: "L", tugas_pokok: "Menegakkan dan mengawasi pelaksanaan adat sandi ambalan putra" },
      { siswa_id: "da_s04", nama: "Khalifah Azzahra", jabatan: "Pemangku Adat Putri", kelas: "XII DKV 2", divisi: "Pemangku Adat", jenis_kelamin: "P", tugas_pokok: "Menegakkan dan mengawasi pelaksanaan adat sandi ambalan putri" },
      { siswa_id: "da_s05", nama: "Sabian Attila Taftazani Artha", jabatan: "Staff Pemangku Adat Putra", kelas: "XI RPL", divisi: "Pemangku Adat", is_staff: true, jenis_kelamin: "L", tugas_pokok: "Pendamping pengawasan tata tertib dan adat ambalan putra" },
      { siswa_id: "da_s06", nama: "Aurelia Khanza Sabrina Sari", jabatan: "Staff Pemangku Adat Putri", kelas: "XI RPL", divisi: "Pemangku Adat", is_staff: true, jenis_kelamin: "P", tugas_pokok: "Pendamping pengawasan tata tertib dan adat ambalan putri" },
      // 3. Penegak Pradana Putra & Putri
      { siswa_id: "da_s07", nama: "Raditya", jabatan: "Penegak Pradana Putra", kelas: "XII DKV 2", divisi: "Penegak Pradana", jenis_kelamin: "L", tugas_pokok: "Pimpinan penegak pengarah kebijakan strategis ambalan putra" },
      { siswa_id: "da_s08", nama: "Nayla Janeeta", jabatan: "Penegak Pradana Putri", kelas: "XII DKV 2", divisi: "Penegak Pradana", jenis_kelamin: "P", tugas_pokok: "Pimpinan penegak pengarah kebijakan strategis ambalan putri" },
      { siswa_id: "da_s09", nama: "Zainun Ghilman Aziz", jabatan: "Staff Penegak Pradana Putra", kelas: "XI RPL", divisi: "Penegak Pradana", is_staff: true, jenis_kelamin: "L", tugas_pokok: "Asisten koordinasi operasional pimpinan penegak putra" },
      { siswa_id: "da_s10", nama: "Carissa Rahma Zahirah", jabatan: "Staff Penegak Pradana Putri", kelas: "XI DKV 2", divisi: "Penegak Pradana", is_staff: true, jenis_kelamin: "P", tugas_pokok: "Asisten koordinasi operasional pimpinan penegak putri" },
      // 4. Pradana Putra & Putri (Ketua Harian)
      { siswa_id: "da_s11", nama: "Yasir Hidayatullah", jabatan: "Pradana Putra", kelas: "XII TKJ", divisi: "Pradana", jenis_kelamin: "L", tugas_pokok: "Ketua Dewan Ambalan putra penanggung jawab harian organisasi" },
      { siswa_id: "da_s12", nama: "Bilqis Suci Makayla", jabatan: "Pradana Putri", kelas: "XII DKV 2", divisi: "Pradana", jenis_kelamin: "P", tugas_pokok: "Ketua Dewan Ambalan putri penanggung jawab harian organisasi" },
      { siswa_id: "da_s13", nama: "Dimas Aditya", jabatan: "Staff Pradana Putra", kelas: "XI RPL", divisi: "Pradana", is_staff: true, jenis_kelamin: "L", tugas_pokok: "Membantu koordinasi dan kelancaran program kerja Pradana putra" },
      { siswa_id: "da_s14", nama: "Julfa Khairanih", jabatan: "Staff Pradana Putri", kelas: "XI DKV 2", divisi: "Pradana", is_staff: true, jenis_kelamin: "P", tugas_pokok: "Membantu koordinasi dan kelancaran program kerja Pradana putri" },
      // 5. Wakil Pradana Putra & Putri
      { siswa_id: "da_s15", nama: "Rizky Anugrah Ramadhan", jabatan: "Wakil Pradana Putra", kelas: "XII TKJ", divisi: "Wakil Pradana", jenis_kelamin: "L", tugas_pokok: "Wakil ketua ambalan putra bidang pengawasan internal sangga" },
      { siswa_id: "da_s16", nama: "Intan Ayyu Nur Aini", jabatan: "Wakil Pradana Putri", kelas: "XII DKV 1", divisi: "Wakil Pradana", jenis_kelamin: "P", tugas_pokok: "Wakil ketua ambalan putri bidang pengawasan internal sangga" },
      { siswa_id: "da_s17", nama: "Raffael Zaidan Alfaridzi", jabatan: "Staff Wakil Pradana Putra", kelas: "XI RPL", divisi: "Wakil Pradana", is_staff: true, jenis_kelamin: "L", tugas_pokok: "Mendukung pengawasan tugas operasional wakil pradana putra" },
      { siswa_id: "da_s18", nama: "Najla Amelia Kirana", jabatan: "Staff Wakil Pradana Putri", kelas: "XI DKV 2", divisi: "Wakil Pradana", is_staff: true, jenis_kelamin: "P", tugas_pokok: "Mendukung pengawasan tugas operasional wakil pradana putri" },
      // 6. Krani Putra & Putri (Sekretariat)
      { siswa_id: "da_s19", nama: "Fathier Assyarief", jabatan: "Krani Putra", kelas: "XII RPL", divisi: "Krani", jenis_kelamin: "L", tugas_pokok: "Pengelolaan surat masuk/keluar, berkas administrasi dan notulensi putra" },
      { siswa_id: "da_s20", nama: "Siti Humaira Auliahya", jabatan: "Krani Putri", kelas: "XII DKV 2", divisi: "Krani", jenis_kelamin: "P", tugas_pokok: "Pengelolaan arsip berkas ambalan, persuratan dan notula putri" },
      { siswa_id: "da_s21", nama: "Raihan Nur Irsyad", jabatan: "Staff Krani Putra", kelas: "XI RPL", divisi: "Krani", is_staff: true, jenis_kelamin: "L", tugas_pokok: "Pengarsipan digital, presensi rapat, dan dokumentasi naskah putra" },
      { siswa_id: "da_s22", nama: "Nadya Ulya Khairunnisa", jabatan: "Staff Krani Putri", kelas: "XI DKV 2", divisi: "Krani", is_staff: true, jenis_kelamin: "P", tugas_pokok: "Pengarsipan digital, presensi rapat, dan dokumentasi naskah putri" },
      // 7. Bendahara Putra & Putri
      { siswa_id: "da_s23", nama: "Sauqi Moebarok", jabatan: "Bendahara Putra", kelas: "XI DKV 2", divisi: "Bendahara", jenis_kelamin: "L", tugas_pokok: "Pengelolaan kas masuk/keluar, buku kas harian dan bukti kwitansi ambalan" },
      { siswa_id: "da_s24", nama: "Hanifah Salsabilla", jabatan: "Bendahara Putri", kelas: "XI DKV 1", divisi: "Bendahara", jenis_kelamin: "P", tugas_pokok: "Pengelolaan iuran mingguan anggota dan anggaran kegiatan ambalan" },
      // 8. Giatop Putra & Putri
      { siswa_id: "da_s25", nama: "Abdul Hafiidz", jabatan: "Giatop Putra", kelas: "XI RPL", divisi: "Giatop", jenis_kelamin: "L", tugas_pokok: "Penyusunan jadwal giat lapangan, apel pembukaan dan penutupan latihan" },
      { siswa_id: "da_s26", nama: "Osriseffita Nurramadhaniah", jabatan: "Giatop Putri", kelas: "XI DKV 1", divisi: "Giatop", jenis_kelamin: "P", tugas_pokok: "Perencanaan agenda latihan mingguan putri, apel, dan perkemahan" },
      { siswa_id: "da_s27", nama: "Syahrul Sya'ban", jabatan: "Staff Giatop Putra", kelas: "XI RPL", divisi: "Giatop", is_staff: true, jenis_kelamin: "L", tugas_pokok: "Mempersiapkan teknis rundown dan perlengkapan kegiatan latihan putra" },
      { siswa_id: "da_s28", nama: "Kanza Dwi Melviana", jabatan: "Staff Giatop Putri", kelas: "XI DKV 1", divisi: "Giatop", is_staff: true, jenis_kelamin: "P", tugas_pokok: "Mempersiapkan teknis rundown dan perlengkapan kegiatan latihan putri" },
      // 9. Tekram Putra & Putri
      { siswa_id: "da_s29", nama: "Arif Zakariya", jabatan: "Tekram Putra", kelas: "XII TKJ", divisi: "Tekram", jenis_kelamin: "L", tugas_pokok: "Instruktur senior pionering, tali temali, sandi, navigasi dan pemetaan" },
      { siswa_id: "da_s30", nama: "M. Dwikie Dhermawan As'syidiq", jabatan: "Tekram Putra", kelas: "XI TKJ", divisi: "Tekram", jenis_kelamin: "L", tugas_pokok: "Instruktur teknik kepramukaan lapangan dan pengujian SKU putra" },
      { siswa_id: "da_s31", nama: "Shafa Azalia Andini", jabatan: "Tekram Putri", kelas: "XI DKV 2", divisi: "Tekram", jenis_kelamin: "P", tugas_pokok: "Instruktur PPGD, semapur, morse dan materi kepanduan putri" },
      { siswa_id: "da_s32", nama: "Raden Ahmad Faisal Mubaroq", jabatan: "Staff Tekram Putra", kelas: "XI DKV 1", divisi: "Tekram", is_staff: true, jenis_kelamin: "L", tugas_pokok: "Asisten instruktur teknik lapangan dan perlengkapan peraga tekpram" },
      { siswa_id: "da_s33", nama: "Zayden Athaya Nareswara", jabatan: "Staff Tekram Putra", kelas: "XI TKJ", divisi: "Tekram", is_staff: true, jenis_kelamin: "L", tugas_pokok: "Asisten instruktur teknik lapangan dan perlengkapan peraga tekpram" }
    ]
  },
  {
    id: "da_2025",
    periode: "2025-2026",
    tahun_ajaran: "2025-2026",
    is_active: false,
    is_aktif: false,
    nama_ambalan: "Ambalan SMK Bakti Idhata",
    pembina_gudep: "Kak Jihan Fadhilah, S. Kom",
    dewan_kehormatan: [
      "Malik Khadafi Al Ghoni (XII TKJ)",
      "Della Rizkyani (XII DKV 2)"
    ],
    pemangku_adat_putra: "Daffa Arya Perkasa (XII RPL)",
    pemangku_adat_putri: "Khalifah Azzahra (XII DKV 2)",
    staff_pemangku_adat: [
      "Sabian Attila Taftazani Artha (XI RPL)",
      "Aurelia Khanza Sabrina Sari (XI RPL)"
    ],
    penegak_pradana_putra: "Raditya (XII DKV 2)",
    penegak_pradana_putri: "Nayla Janeeta (XII DKV 2)",
    staff_penegak_pradana: [
      "Zainun Ghilman Aziz (XI RPL)",
      "Carissa Rahma Zahirah (XI DKV 2)"
    ],
    pradana_putra: "Yasir Hidayatullah (XII TKJ)",
    pradana_putri: "Bilqis Suci Makayla (XII DKV 2)",
    staff_pradana: [
      "Dimas Aditya (XI RPL)",
      "Julfa Khairanih (XI DKV 2)"
    ],
    wakil_pradana_putra: "Rizky Anugrah Ramadhan (XII TKJ)",
    wakil_pradana_putri: "Intan Ayyu Nur Aini (XII DKV 1)",
    staff_wakil_pradana: [
      "Raffael Zaidan Alfaridzi (XI RPL)",
      "Najla Amelia Kirana (XI DKV 2)"
    ],
    kerani: "Fathier Assyarief (XII RPL)",
    kerani_putri: "Siti Humaira Auliahya (XII DKV 2)",
    staff_krani: [
      "Raihan Nur Irsyad (XI RPL)",
      "Nadya Ulya Khairunnisa (XI DKV 2)"
    ],
    bankir: "Sauqi Moebarok (XI DKV 2)",
    bendahara_2: "Hanifah Salsabilla (XI DKV 1)",
    giatop_putra: "Abdul Hafiidz (XI RPL)",
    giatop_putri: "Osriseffita Nurramadhaniah (XI DKV 1)",
    staff_giatop: [
      "Syahrul Sya'ban (XI RPL)",
      "Kanza Dwi Melviana (XI DKV 1)"
    ],
    tekram_list: [
      "Arif Zakariya (XII TKJ)",
      "M. Dwikie Dhermawan As'syidiq (XI TKJ)",
      "Shafa Azalia Andini (XI DKV 2)"
    ],
    staff_tekram: [
      "Raden Ahmad Faisal Mubaroq (XI DKV 1)",
      "Zayden Athaya Nareswara (XI TKJ)"
    ],
    visi_misi: "Mewujudkan Dewan Ambalan SMK Bakti Idhata yang disiplin, berakhlak mulia, berprestasi kepramukaan, serta berdaya saing tinggi berlandaskan Trisatya dan Dasa Darma.",
    tanggal_sertijab: "2025-07-28",
    catatan_sertijab: "Dilantik secara resmi oleh Pembina Gugus Depan SMK Bakti Idhata pada Upacara Pelantikan dan Ulang Janji Ambalan.",
    susunan_pengurus: []
  },
  {
    id: "da_2024",
    periode: "2024-2025",
    tahun_ajaran: "2024-2025",
    is_active: false,
    is_aktif: false,
    pradana_putra: "Rian Hidayat (XII TKJ 1 - Purna)",
    pradana_putri: "Putri Anggraini (XII AKL 1 - Purna)",
    kerani: "Jihan Pratama (saat itu Kelas X)",
    bankir: "Siti Rahmawati (saat itu Kelas XI)",
    pemangku_adat_putra: "Bagas Wicaksono (Purna)",
    pemangku_adat_putri: "Dinda Kirana (Purna)",
    seksi_giatops: "Lee Min-ho Septian",
    seksi_sarpras: "Dimas Arya (Purna)",
    seksi_kajian: "Farhan Mahendra",
    visi_misi: "Membangun soliditas sangga dan kebangkitan prestasi kepramukaan pasca masa pemulihan.",
    tanggal_sertijab: "2024-07-15",
    catatan_sertijab: "Masa bakti selesai dengan sukses menyelenggarakan Kemah Bakti Idhata 2024.",
    susunan_pengurus: []
  }
];
