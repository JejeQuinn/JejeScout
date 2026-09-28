import { Siswa, Kehadiran, Materi, SKU, NilaiAkhir, SKUItemDef } from '../types';

export function calculateNilaiSiswa(
  siswa: Siswa,
  kehadiranList: Kehadiran[],
  materiList: Materi[],
  skuList: SKU[],
  skuDefsList?: SKUItemDef[]
): NilaiAkhir {
  const siswa_id = siswa.id;

  // 1. KEHADIRAN (Bobot 30%)
  const siswaKehadiran = kehadiranList.filter((k) => k.siswa_id === siswa_id);
  const totalPertemuan = siswaKehadiran.length;
  const jumlahHadir = siswaKehadiran.filter((k) => k.status === 'Hadir').length;

  // Persentase kehadiran (Hadir/Total * 100). Jika tidak ada pertemuan, asumsikan default 100% atau 0%?
  // Kita asumsikan default 100% jika belum mulai, agar adil, atau 0% jika belum diabsen. Mari gunakan 100% jika total = 0.
  const persenKehadiran = totalPertemuan > 0 ? (jumlahHadir / totalPertemuan) * 100 : 100;
  const skorKehadiran = persenKehadiran * 0.30;

  // 2. PENGUASAAN MATERI (Bobot 30%)
  // Cari semua materi selesai di mana siswa mendapat nilai
  let totalMateriNilai = 0;
  let jumlahMateriDinilai = 0;

  materiList.forEach((m) => {
    if (m.status === 'Selesai' && m.nilai_evaluasi && m.nilai_evaluasi[siswa_id] !== undefined) {
      totalMateriNilai += m.nilai_evaluasi[siswa_id];
      jumlahMateriDinilai++;
    }
  });

  const rataRataMateri = jumlahMateriDinilai > 0 ? totalMateriNilai / jumlahMateriDinilai : 0;
  const skorMateri = rataRataMateri * 0.30;

  // 3. PROGRES SKU (Bobot 40%)
  // Hitung jumlah item SKU yang sudah diverifikasi (status_verifikasi = true) untuk siswa ini
  const skuLulus = skuList.filter((s) => s.siswa_id === siswa_id && s.status_verifikasi && (s.tingkat === 'Bantara' || !s.tingkat)).length;
  const skuLaksanaLulus = skuList.filter((s) => s.siswa_id === siswa_id && s.status_verifikasi && s.tingkat === 'Laksana').length;

  let totalBantara = 23;
  let totalLaksana = 22;

  if (skuDefsList) {
    const bDefs = skuDefsList.filter((d) => d.tingkat === 'Bantara');
    const lDefs = skuDefsList.filter((d) => d.tingkat === 'Laksana');
    if (bDefs.length > 0) totalBantara = bDefs.length;
    if (lDefs.length > 0) totalLaksana = lDefs.length;
  }

  // Total item SKU Bantara, Laksana
  const bantaraPct = (skuLulus / totalBantara) * 100;
  const laksanaPct = (skuLaksanaLulus / totalLaksana) * 100;
  const persenSKU = skuLaksanaLulus > 0 ? (bantaraPct + laksanaPct) / 2 : bantaraPct;
  const skorSKU = persenSKU * 0.40;

  // 4. TOTAL AKHIR & PREDIKAT
  const nilaiTotal = Math.round((skorKehadiran + skorMateri + skorSKU) * 100) / 100;

  let predikat: 'A' | 'B' | 'C' | 'D' = 'D';
  if (nilaiTotal >= 85) {
    predikat = 'A';
  } else if (nilaiTotal >= 70) {
    predikat = 'B';
  } else if (nilaiTotal >= 55) {
    predikat = 'C';
  } else {
    predikat = 'D';
  }

  return {
    siswa_id,
    persen_kehadiran: Math.round(persenKehadiran * 10) / 10,
    skor_kehadiran: Math.round(skorKehadiran * 100) / 100,
    skor_materi: Math.round(skorMateri * 100) / 100,
    skor_sku: Math.round(skorSKU * 100) / 100,
    sku_lulus: skuLulus,
    sku_laksana_lulus: skuLaksanaLulus,
    nilai_total: nilaiTotal,
    predikat,
  };
}
