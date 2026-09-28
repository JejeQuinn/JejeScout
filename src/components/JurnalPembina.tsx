import React, { useState } from 'react';
import { Jurnal, Materi } from '../types';
import { BookOpen, Plus, Trash2, Calendar, FileText, UserCheck, CloudUpload, Check, Printer, Download } from 'lucide-react';
import { getAccessToken, uploadJournalFile } from '../utils/firebaseAuth';
import { jsPDF } from 'jspdf';

interface JurnalProps {
  jurnal: Jurnal[];
  materi: Materi[];
  onAdd: (data: Omit<Jurnal, 'id'>) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export const JurnalPembina: React.FC<JurnalProps> = ({
  jurnal,
  materi,
  onAdd,
  onDelete,
  readOnly = false,
}) => {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [judulKegiatan, setJudulKegiatan] = useState('');
  const [materiId, setMateriId] = useState('');
  const [pembinaNama, setPembinaNama] = useState('Kak Jihan Fadhilah, S. Kom');
  const [evaluasiRingkas, setEvaluasiRingkas] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [fotosBase64, setFotosBase64] = useState<string[]>([]);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [succeededIds, setSucceededIds] = useState<string[]>([]);

  // Helper to parse potential multiple photos
  const getPhotosArray = (fotoStr?: string): string[] => {
    if (!fotoStr) return [];
    if (fotoStr.startsWith('[') && fotoStr.endsWith(']')) {
      try {
        return JSON.parse(fotoStr);
      } catch (e) {
        // fallback
      }
    }
    if (fotoStr.includes('|||')) {
      return fotoStr.split('|||');
    }
    return [fotoStr];
  };

  // State filter bulan upload (Format: YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Extract unique months (YYYY-MM) from journals for dropdown listing
  const getUniqueMonths = (): string[] => {
    const months = jurnal
      .map((j) => {
        const d = new Date(j.tanggal);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
      })
      .filter(Boolean);
    return (Array.from(new Set(months)) as string[]).sort((a, b) => b.localeCompare(a));
  };

  // Convert YYYY-MM string to Indonesian Month Name and Year (e.g. "Juli 2026")
  const formatMonthYearID = (yearMonthStr: string) => {
    const [year, month] = yearMonthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const drawKopSurat = (doc: jsPDF) => {
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.text("GERAKAN PRAMUKA KWARTIR CABANG JAKARTA SELATAN", 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text("GUGUS DEPAN PRAMUKA SMK BAKTI IDHATA", 105, 21, { align: 'center' });
    doc.setFontSize(10);
    doc.text("AMBALAN PENEGAK BANTARA - LAKSANA", 105, 26, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.text("Jl. Melati No.25, RT.13/RW.3, Cilandak Barat, Kec. Cilandak, Kota Jakarta Selatan, DKI Jakarta 12430", 105, 31, { align: 'center' });
    
    doc.setLineWidth(0.8);
    doc.line(15, 34, 195, 34);
    doc.setLineWidth(0.2);
    doc.line(15, 35, 195, 35);
  };

  const handleDownloadSinglePDF = (j: Jurnal) => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    drawKopSurat(doc);

    // Title
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.text("LAPORAN MINGGUAN JURNAL LATIHAN PRAMUKA", 105, 45, { align: 'center' });
    
    // Decorative line below title
    doc.setLineWidth(0.3);
    doc.line(40, 47, 170, 47);

    // Document number
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    const mockNum = "0" + Math.floor(Math.random() * 90 + 10) + "/GP-SMKBI/JRN/" + new Date(j.tanggal).getFullYear();
    doc.text(`Nomor: ${mockNum}`, 105, 52, { align: 'center' });

    // Intro paragraph
    let y = 62;
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text("Pada hari ini, dilaporkan pelaksanaan kegiatan latihan mingguan Pramuka Penegak Ambalan SMK Bakti Idhata sebagai berikut:", 15, y, { maxWidth: 180 });
    
    y += 12;

    // Helper to draw clean details row
    const drawDetailsRow = (label: string, val: string) => {
      doc.setFont('times', 'bold');
      doc.text(label, 15, y);
      doc.setFont('times', 'normal');
      doc.text(": " + val, 55, y);
      y += 8;
    };

    const tglFormatted = new Date(j.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    drawDetailsRow("Hari / Tanggal", tglFormatted);
    drawDetailsRow("Pembina Pengajar", j.pembina_nama);
    drawDetailsRow("Agenda Latihan", j.judul_kegiatan);
    
    const linkedMateri = materi.find(m => m.id === j.materi_id);
    drawDetailsRow("Materi Terhubung", linkedMateri ? `${linkedMateri.judul_materi} (${linkedMateri.kategori})` : 'Tidak ada hubungan materi khusus.');

    y += 4;
    doc.setFont('times', 'bold');
    doc.text("Ringkasan Evaluasi & Catatan Kemajuan Latihan:", 15, y);
    y += 6;
    doc.setFont('times', 'italic');
    const splitText = doc.splitTextToSize(j.evaluasi_ringkas, 180);
    doc.text(splitText, 15, y);
    
    y += splitText.length * 5 + 10;

    // Foto / Dokumentasi Section
    const photos = getPhotosArray(j.foto);
    if (photos.length > 0) {
      const rowsCount = Math.ceil(photos.length / 2);
      const requiredHeight = 10 + (rowsCount * 50); // header + padding + rows
      if (y + requiredHeight > 260) {
        doc.addPage();
        drawKopSurat(doc);
        y = 45;
      }
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.text("Foto / Dokumentasi Kegiatan Latihan (Pusat):", 105, y, { align: 'center' });
      y += 8;

      for (let r = 0; r < rowsCount; r++) {
        const startIndex = r * 2;
        const rowPhotos = photos.slice(startIndex, startIndex + 2);
        
        // Calculate centering
        let startX = 15;
        const photoW = 60;
        const photoH = 45;
        const gap = 10;
        
        if (rowPhotos.length === 1) {
          startX = (210 - photoW) / 2; // Centered
        } else {
          const totalW = (photoW * 2) + gap;
          startX = (210 - totalW) / 2; // Centered
        }

        if (y + photoH > 265) {
          doc.addPage();
          drawKopSurat(doc);
          y = 45;
        }

        for (let i = 0; i < rowPhotos.length; i++) {
          const p = rowPhotos[i];
          const x = startX + i * (photoW + gap);
          try {
            let format = 'JPEG';
            if (p.includes('image/png')) {
              format = 'PNG';
            } else if (p.includes('image/webp')) {
              format = 'WEBP';
            }
            doc.setLineWidth(0.2);
            doc.rect(x, y, photoW, photoH); // border box
            doc.addImage(p, format, x + 0.5, y + 0.5, photoW - 1, photoH - 1);
          } catch (err) {
            console.error("Gagal memuat gambar ke PDF: ", err);
            doc.setFont('times', 'italic');
            doc.setFontSize(8);
            doc.text("[Gagal memuat foto]", x + photoW / 2, y + photoH / 2, { align: 'center' });
            doc.setFontSize(10);
          }
        }
        y += photoH + 5;
      }
      y += 5; // extra spacing below photos
    }

    doc.setFont('times', 'normal');
    doc.text("Demikian laporan mingguan jurnal kegiatan latihan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.", 15, y, { maxWidth: 180 });

    // Signature Block - 3 Columns Layout
    y = Math.max(y + 20, 215);
    if (y > 250) {
      doc.addPage();
      drawKopSurat(doc);
      y = 50;
    }

    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);

    // Wakasek
    doc.text("Mengetahui,", 15, y);
    doc.text("Wakasek Bidang Kesiswaan,", 15, y + 5);
    doc.setFont('times', 'bold');
    doc.text("Kak Dhenny Effendi, S. Pd", 15, y + 32);

    // Pembina
    doc.setFont('times', 'normal');
    doc.text("Pelapor,", 85, y);
    doc.text("Pembina Pramuka,", 85, y + 5);
    doc.setFont('times', 'bold');
    doc.text("Kak Jihan Fadhilah, S. Kom", 85, y + 32);

    // Kepala Sekolah
    doc.setFont('times', 'normal');
    doc.text("Mengetahui,", 145, y);
    doc.text("Kepala Sekolah,", 145, y + 5);
    doc.setFont('times', 'bold');
    doc.text("Kak Nurman, M. Pd", 145, y + 32);

    doc.save(`Laporan_Jurnal_Pramuka_${j.tanggal}.pdf`);
  };

  const handleDownloadMonthlyPDF = (monthStr: string) => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    drawKopSurat(doc);

    // Filtered data
    const filtered = jurnal.filter((j) => {
      if (monthStr === 'all') return true;
      const d = new Date(j.tanggal);
      if (isNaN(d.getTime())) return false;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}` === monthStr;
    }).sort((a, b) => a.tanggal.localeCompare(b.tanggal));

    // Title
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.text("REKAPITULASI BULANAN JURNAL LATIHAN PRAMUKA", 105, 45, { align: 'center' });
    
    // Decorative line below title
    doc.setLineWidth(0.3);
    doc.line(30, 47, 180, 47);

    // Document number & Subtitle
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    const mockNum = "0" + Math.floor(Math.random() * 90 + 10) + "/GP-SMKBI/REKAP/" + new Date().getFullYear();
    doc.text(`Nomor: ${mockNum}`, 105, 52, { align: 'center' });

    const periodeStr = monthStr === 'all' ? 'Semua Bulan' : formatMonthYearID(monthStr);
    doc.setFont('times', 'bold');
    doc.text(`Periode: ${periodeStr}`, 15, 62);

    // Table Headers
    let y = 68;
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    
    // Render columns header boxes
    doc.setFillColor(242, 242, 242);
    doc.rect(15, y, 8, 8, 'FD'); // No
    doc.rect(23, y, 25, 8, 'FD'); // Tanggal
    doc.rect(48, y, 40, 8, 'FD'); // Agenda Kegiatan / Materi
    doc.rect(88, y, 27, 8, 'FD'); // Pembina
    doc.rect(115, y, 35, 8, 'FD'); // Dokumentasi (Foto)
    doc.rect(150, y, 45, 8, 'FD'); // Catatan / Evaluasi

    doc.text("No", 19, y + 5.5, { align: 'center' });
    doc.text("Tanggal", 35.5, y + 5.5, { align: 'center' });
    doc.text("Agenda / Materi", 68, y + 5.5, { align: 'center' });
    doc.text("Pembina", 101.5, y + 5.5, { align: 'center' });
    doc.text("Dokumentasi", 132.5, y + 5.5, { align: 'center' });
    doc.text("Evaluasi / Catatan", 172.5, y + 5.5, { align: 'center' });

    y += 8;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);

    if (filtered.length === 0) {
      doc.rect(15, y, 180, 15);
      doc.text("Tidak ada data kegiatan latihan pramuka tercatat pada periode ini.", 105, y + 9, { align: 'center' });
      y += 15;
    } else {
      filtered.forEach((j, index) => {
        // Wrap cells
        const linkedMateri = materi.find(m => m.id === j.materi_id);
        const agendaStr = j.judul_kegiatan + (linkedMateri ? `\nMateri: ${linkedMateri.judul_materi}` : '');
        const agendaText = doc.splitTextToSize(agendaStr, 38);
        const pembinaText = doc.splitTextToSize(j.pembina_nama, 25);
        const evalText = doc.splitTextToSize(j.evaluasi_ringkas, 42);
        
        const rowPhotos = getPhotosArray(j.foto);
        const hasPhotos = rowPhotos.length > 0;
        const photosHeight = hasPhotos ? (rowPhotos.length * 23.25 + (rowPhotos.length - 1) * 2) : 0;
        
        const minHeight = hasPhotos ? (photosHeight + 4) : 10;
        const maxTextLines = Math.max(agendaText.length, pembinaText.length, evalText.length);
        const rowHeight = Math.max(minHeight, maxTextLines * 4.5 + 4);

        // Check page overflow
        if (y + rowHeight > 250) {
          doc.addPage();
          drawKopSurat(doc);
          y = 45;
          // Redraw headers on new page
          doc.setFont('times', 'bold');
          doc.rect(15, y, 8, 8, 'FD');
          doc.rect(23, y, 25, 8, 'FD');
          doc.rect(48, y, 40, 8, 'FD');
          doc.rect(88, y, 27, 8, 'FD');
          doc.rect(115, y, 35, 8, 'FD');
          doc.rect(150, y, 45, 8, 'FD');

          doc.text("No", 19, y + 5.5, { align: 'center' });
          doc.text("Tanggal", 35.5, y + 5.5, { align: 'center' });
          doc.text("Agenda / Materi", 68, y + 5.5, { align: 'center' });
          doc.text("Pembina", 101.5, y + 5.5, { align: 'center' });
          doc.text("Dokumentasi", 132.5, y + 5.5, { align: 'center' });
          doc.text("Evaluasi / Catatan", 172.5, y + 5.5, { align: 'center' });
          y += 8;
          doc.setFont('times', 'normal');
        }

        // Draw boxes
        doc.rect(15, y, 8, rowHeight);
        doc.rect(23, y, 25, rowHeight);
        doc.rect(48, y, 40, rowHeight);
        doc.rect(88, y, 27, rowHeight);
        doc.rect(115, y, 35, rowHeight);
        doc.rect(150, y, 45, rowHeight);

        // Print text
        const tglStr = new Date(j.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        doc.text(String(index + 1), 19, y + 6, { align: 'center' });
        doc.text(tglStr, 35.5, y + 6, { align: 'center' });
        doc.text(agendaText, 49, y + 5);
        doc.text(pembinaText, 89, y + 5);

        // Draw the image(s) if exists, else leave blank
        if (rowPhotos.length > 0) {
          let currentPhotoY = y + 2;
          rowPhotos.forEach((p) => {
            try {
              let format = 'JPEG';
              if (p.includes('image/png')) {
                format = 'PNG';
              } else if (p.includes('image/webp')) {
                format = 'WEBP';
              }
              
              const imgW = 31;
              const imgH = 23.25;
              const imgX = 115 + (35 - imgW) / 2;
              doc.addImage(p, format, imgX, currentPhotoY, imgW, imgH);
              currentPhotoY += imgH + 2;
            } catch (err) {
              console.error("Gagal menambahkan foto rekap: ", err);
              doc.setFont('times', 'italic');
              doc.setFontSize(8);
              doc.text("[Gagal memuat foto]", 132.5, currentPhotoY + 11.5, { align: 'center' });
              doc.setFont('times', 'normal');
              doc.setFontSize(9);
              currentPhotoY += 23.25 + 2;
            }
          });
        }

        doc.text(evalText, 151, y + 5);

        y += rowHeight;
      });
    }

    y += 8;
    doc.setFontSize(10.5);
    doc.text("Demikian rekapitulasi jurnal kegiatan latihan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.", 15, y, { maxWidth: 180 });

    // Signature Block - 3 Columns Layout
    y = Math.max(y + 20, 215);
    if (y > 250) {
      doc.addPage();
      drawKopSurat(doc);
      y = 50;
    }

    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);

    // Wakasek
    doc.text("Mengetahui,", 15, y);
    doc.text("Wakasek Bidang Kesiswaan,", 15, y + 5);
    doc.setFont('times', 'bold');
    doc.text("Kak Dhenny Effendi, S. Pd", 15, y + 32);

    // Pembina
    doc.setFont('times', 'normal');
    doc.text("Pelapor,", 85, y);
    doc.text("Pembina Pramuka,", 85, y + 5);
    doc.setFont('times', 'bold');
    doc.text("Kak Jihan Fadhilah, S. Kom", 85, y + 32);

    // Kepala Sekolah
    doc.setFont('times', 'normal');
    doc.text("Mengetahui,", 145, y);
    doc.text("Kepala Sekolah,", 145, y + 5);
    doc.setFont('times', 'bold');
    doc.text("Kak Nurman, M. Pd", 145, y + 32);

    doc.save(`Rekap_Bulanan_Jurnal_${monthStr}.pdf`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newPhotos: string[] = [];
      let oversize = false;
      let countProcessed = 0;
      const totalFiles = files.length;
      
      const filesArr = Array.from(files) as File[];
      filesArr.forEach((file) => {
        if (file.size > 2 * 1024 * 1024) {
          oversize = true;
          countProcessed++;
          if (countProcessed === totalFiles && newPhotos.length > 0) {
            setFotosBase64((prev) => [...prev, ...newPhotos]);
          }
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          newPhotos.push(reader.result as string);
          countProcessed++;
          if (countProcessed === totalFiles) {
            setFotosBase64((prev) => [...prev, ...newPhotos]);
          }
        };
        reader.readAsDataURL(file);
      });

      if (oversize) {
        alert('Beberapa file foto terlalu besar! Maksimal 2MB per file.');
      }
    }
  };

  const removePhotoDraft = (index: number) => {
    setFotosBase64((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExportToDrive = async (j: Jurnal) => {
    setExportingId(j.id);
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Silakan hubungkan akun Google Drive Anda terlebih dahulu di menu Google Drive Backup!');
        return;
      }

      const linkedMateri = materi.find((m) => m.id === j.materi_id);
      const materiText = linkedMateri ? `${linkedMateri.judul_materi} (${linkedMateri.kategori})` : 'Tidak ada';

      const fileContent = `==================================================
LAPORAN JURNAL KEGIATAN LATIHAN PRAMUKA
AMBALAN SMK BAKTI IDHATA JAKARTA
==================================================
ID Jurnal  : ${j.id}
Tanggal    : ${new Date(j.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
Judul      : ${j.judul_kegiatan}
Pembina    : ${j.pembina_nama}
Materi     : ${materiText}
--------------------------------------------------
EVALUASI RINGKAS & CATATAN KEMAJUAN:
${j.evaluasi_ringkas}
==================================================
Sistem Informasi Pramuka (SI-Pramuka) - Cloud Report
`;

      const safeTitle = j.judul_kegiatan.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `SI_Pramuka_Jurnal_${j.tanggal}_${safeTitle}.txt`;

      await uploadJournalFile(token, filename, fileContent);
      setSucceededIds((prev) => [...prev, j.id]);
      setTimeout(() => {
        setSucceededIds((prev) => prev.filter((id) => id !== j.id));
      }, 5000);
    } catch (error: any) {
      console.error(error);
      alert('Gagal mengekspor laporan jurnal ke Google Drive: ' + error.message);
    } finally {
      setExportingId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!tanggal || !judulKegiatan.trim() || !pembinaNama.trim() || !evaluasiRingkas.trim()) {
      setErrorMsg('Semua kolom wajib diisi!');
      return;
    }

    onAdd({
      tanggal,
      judul_kegiatan: judulKegiatan.trim(),
      materi_id: materiId,
      pembina_nama: pembinaNama.trim(),
      evaluasi_ringkas: evaluasiRingkas.trim(),
      foto: fotosBase64.length > 0 ? JSON.stringify(fotosBase64) : undefined,
    });

    // Reset inputs
    setJudulKegiatan('');
    setEvaluasiRingkas('');
    setFotosBase64([]);
  };

  return (
    <div className="space-y-6" id="jurnal_pembina_module">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Jurnal Kegiatan Pembina</h2>
        <p className="text-sm text-gray-400 mt-1">Dokumentasikan seluruh laporan evaluasi mengajar pembina setelah menyelesaikan agenda latihan mingguan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Panel */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 h-fit space-y-4">
          <h3 className="text-sm font-black text-gray-800 flex items-center pb-3 border-b border-gray-50">
            <Plus className="w-4 h-4 mr-1 text-indigo-600" />
            Buat Laporan Jurnal Baru
          </h3>

          {errorMsg && (
            <div className="bg-rose-50 text-rose-700 border border-rose-200 p-3 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tanggal Kegiatan</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Judul Agenda Kegiatan</label>
              <input
                type="text"
                placeholder="Contoh: Gladian Pemimpin Satuan (Dianpinru)"
                value={judulKegiatan}
                onChange={(e) => setJudulKegiatan(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Hubungkan ke Materi Latihan (Opsional)</label>
              <select
                value={materiId}
                onChange={(e) => setMateriId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="">-- Tanpa Hubungan Materi --</option>
                {materi.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.judul_materi} ({m.kategori})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nama Pembina Pengajar</label>
              <input
                type="text"
                placeholder="Contoh: Kak Jihan Fadhilah, S. Kom"
                value={pembinaNama}
                onChange={(e) => setPembinaNama(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Evaluasi Ringkas & Catatan Kemajuan</label>
              <textarea
                rows={4}
                placeholder="Tuliskan rekapitulasi evaluasi latihan, misal: Pemahaman materi simpul 90% lulus, sisa 2 murid perlu remidi minggu depan."
                value={evaluasiRingkas}
                onChange={(e) => setEvaluasiRingkas(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Foto Dokumentasi Kegiatan (Bisa Lebih Dari 1) (Opsional)</label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="block w-full text-xs text-gray-500
                    file:mr-4 file:py-1.5 file:px-3
                    file:rounded-xl file:border-0
                    file:text-xs file:font-bold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100 cursor-pointer"
                />
                {fotosBase64.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {fotosBase64.map((p, index) => (
                      <div key={index} className="relative border border-gray-100 rounded-xl overflow-hidden p-1 bg-gray-50">
                        <img
                          src={p}
                          alt={`Preview ${index + 1}`}
                          className="h-20 w-full object-cover rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => removePhotoDraft(index)}
                          className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1.5 shadow-xs transition cursor-pointer"
                          title="Hapus foto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {!readOnly ? (
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition cursor-pointer"
              >
                Simpan Laporan Jurnal
              </button>
            ) : (
              <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-center text-xs font-bold">
                Mode Pengawas: Hanya Lihat
              </div>
            )}
          </form>
        </div>

        {/* History List Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs">
            <h3 className="text-sm font-black text-gray-800 flex items-center">
              <FileText className="w-4 h-4 mr-1.5 text-indigo-600" />
              Kumpulan Jurnal Latihan Pramuka
            </h3>

            {/* Monthly Filter Dropdown */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto shrink-0">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-40"
              >
                <option value="all">Semua Bulan ({jurnal.length})</option>
                {getUniqueMonths().map((ym) => (
                  <option key={ym} value={ym}>
                    {formatMonthYearID(ym)}
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleDownloadMonthlyPDF(selectedMonth)}
                className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-black px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs w-full sm:w-auto justify-center"
                title="Ekspor PDF Rekapitulasi Jurnal Kegiatan Latihan"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-300" />
                <span>Ekspor PDF Rekap</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
            {(() => {
              const filteredJurnal = jurnal.filter((j) => {
                if (selectedMonth === 'all') return true;
                const d = new Date(j.tanggal);
                if (isNaN(d.getTime())) return false;
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                return `${year}-${month}` === selectedMonth;
              });

              if (filteredJurnal.length === 0) {
                return (
                  <p className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-xs">
                    Belum ada laporan jurnal kegiatan mengajar yang direkam untuk periode ini.
                  </p>
                );
              }

              return [...filteredJurnal]
                .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
                .map((j) => {
                  const linkedMateri = materi.find((m) => m.id === j.materi_id);
                  return (
                    <div key={j.id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 relative hover:shadow-xs transition">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-50 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-extrabold">
                            <span className="flex items-center">
                              <Calendar className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                              {new Date(j.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            <span>&bull;</span>
                            <span className="flex items-center text-indigo-600">
                              <UserCheck className="w-3.5 h-3.5 mr-1" />
                              {j.pembina_nama}
                            </span>
                          </div>

                          <h4 className="text-base font-extrabold text-gray-800">{j.judul_kegiatan}</h4>
                        </div>

                        {/* Top Right Action Buttons */}
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDownloadSinglePDF(j)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#1B4332] border border-emerald-200/80 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                            title="Ekspor Laporan Jurnal Mingguan ke Format PDF"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Ekspor PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExportToDrive(j)}
                            disabled={exportingId === j.id}
                            className={`p-2 rounded-xl border text-xs font-extrabold transition cursor-pointer flex items-center space-x-1 ${
                              succeededIds.includes(j.id)
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : exportingId === j.id
                                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200 animate-pulse'
                                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-indigo-600'
                            }`}
                            title="Ekspor Laporan ke Google Drive"
                          >
                            {succeededIds.includes(j.id) ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : (
                              <CloudUpload className="w-4 h-4 text-indigo-600" />
                            )}
                          </button>

                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Hapus laporan jurnal mengajar ini?')) {
                                  onDelete(j.id);
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition cursor-pointer"
                              title="Hapus Jurnal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                    {linkedMateri && (
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100/50 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4 text-indigo-500" />
                          <div>
                            <p className="text-[9px] uppercase font-bold text-gray-400">Materi Terhubung</p>
                            <p className="font-bold text-gray-700">{linkedMateri.judul_materi}</p>
                          </div>
                        </div>
                        <span className="bg-indigo-50 text-indigo-700 font-black px-2 py-0.5 rounded text-[9px] uppercase">
                          {linkedMateri.kategori}
                        </span>
                      </div>
                    )}

                    {(() => {
                      const photosList = getPhotosArray(j.foto);
                      if (photosList.length === 0) return null;
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                          {photosList.map((p, pIdx) => (
                            <div key={pIdx} className="relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50 aspect-video flex items-center justify-center">
                              <img
                                src={p}
                                alt={`Dokumentasi Latihan ${pIdx + 1}`}
                                className="object-cover w-full h-full"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    <div className="text-xs text-gray-500 font-medium leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200">
                      <p className="font-extrabold text-gray-700 mb-1">Catatan Evaluasi:</p>
                      {j.evaluasi_ringkas}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
