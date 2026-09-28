import React, { useState, useEffect } from 'react';
import { Siswa, StatusSiklus, RiwayatAkademik } from '../types';
import { 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Calendar, 
  History,
  Sparkles,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { shiftClassLevel } from '../utils/academicProgression';

interface BatchRolloverModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswaList?: Siswa[];
  siswa?: Siswa[];
  tahunAjaranList?: string[];
  currentTahunAjaran?: string;
  onExecuteRollover: (updatedSiswaList: Siswa[], newTahunAjaran: string) => void;
}

export const BatchRolloverModal: React.FC<BatchRolloverModalProps> = ({
  isOpen,
  onClose,
  siswaList,
  siswa: propSiswa,
  tahunAjaranList = ['TA. 2024-2025', 'TA. 2025-2026', 'TA. 2026-2027', '2026-2027'],
  currentTahunAjaran = '2026-2027',
  onExecuteRollover
}) => {
  const activeStudents = siswaList || propSiswa || [];
  
  // Determine suitable default target TA
  const getInitialTargetTa = () => {
    const currIdx = tahunAjaranList.indexOf(currentTahunAjaran);
    if (currIdx >= 0 && currIdx < tahunAjaranList.length - 1) {
      return tahunAjaranList[currIdx + 1];
    }
    return 'TA. 2026-2027';
  };

  const [targetTahunAjaran, setTargetTahunAjaran] = useState(getInitialTargetTa);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTargetTahunAjaran(getInitialTargetTa());
      setIsConfirmed(false);
    }
  }, [isOpen, currentTahunAjaran]);

  if (!isOpen) return null;

  // Calculate preview of promotions
  const previewList = activeStudents.map(s => {
    const shift = shiftClassLevel(s.kelas, 1);
    const newKelas = shift.newClass;
    const isGraduated = shift.isGraduated;

    let newSiklus: StatusSiklus = s.status_siklus || 'Calon Penegak';
    if (isGraduated) {
      newSiklus = s.status_siklus === 'Dewan Ambalan Aktif' 
        ? 'Dewan Kehormatan / Alumni' 
        : 'Purna Ambalan';
    } else if (newKelas.startsWith('XI') || newKelas.startsWith('XII')) {
      newSiklus = s.status_siklus === 'Dewan Ambalan Aktif' ? 'Dewan Ambalan Aktif' : 'Penegak Aktif';
    }

    return {
      ...s,
      oldKelas: s.kelas,
      newKelas,
      oldSiklus: s.status_siklus || 'Calon Penegak',
      newSiklus,
      isGraduated,
      tahun_ajaran: targetTahunAjaran
    };
  });

  const countPromotedXtoXI = previewList.filter(s => s.oldKelas.startsWith('X ') || s.oldKelas === 'X').length;
  const countPromotedXItoXII = previewList.filter(s => s.oldKelas.startsWith('XI ') || s.oldKelas === 'XI').length;
  const countGraduatedXII = previewList.filter(s => s.isGraduated).length;

  const handleExecute = () => {
    if (!isConfirmed) {
      alert('Centang konfirmasi persetujuan sebelum mengeksekusi roll-over massal!');
      return;
    }

    const updatedSiswa: Siswa[] = previewList.map(item => {
      // Build updated riwayat_kelas preserving previous TA entry
      const existingHistory: RiwayatAkademik[] = Array.isArray(item.riwayat_kelas)
        ? [...item.riwayat_kelas]
        : [];

      // 1. Ensure previous TA is recorded as historical snapshot
      const sourceTa = item.tahun_ajaran_asal || item.tahun_ajaran || currentTahunAjaran || 'TA. 2024-2025';
      if (!existingHistory.some(h => h.tahun_ajaran === sourceTa)) {
        existingHistory.push({
          tahun_ajaran: sourceTa,
          kelas: item.oldKelas,
          status_siklus: item.oldSiklus,
          status_aktif: item.status_aktif,
          tanggal_tercatat: new Date().toISOString(),
          catatan: `Status kelas saat di ${sourceTa}`
        });
      }

      // 2. Add / update target TA entry
      const targetIdx = existingHistory.findIndex(h => h.tahun_ajaran === targetTahunAjaran);
      const newHistoryEntry: RiwayatAkademik = {
        tahun_ajaran: targetTahunAjaran,
        kelas: item.newKelas,
        status_siklus: item.newSiklus,
        status_aktif: !item.isGraduated,
        tanggal_tercatat: new Date().toISOString(),
        catatan: `Dipromosikan dari ${item.oldKelas} pada Roll-over Massal`
      };

      if (targetIdx >= 0) {
        existingHistory[targetIdx] = newHistoryEntry;
      } else {
        existingHistory.push(newHistoryEntry);
      }

      return {
        id: item.id,
        nis: item.nis,
        nisn: item.nisn,
        nis_murid_anggota: item.nis_murid_anggota || item.nisn,
        nama_lengkap: item.nama_lengkap,
        kelas: item.newKelas,
        tahun_ajaran: targetTahunAjaran,
        status_aktif: !item.isGraduated,
        status_pelantikan: item.status_pelantikan,
        tanggal_pelantikan: item.tanggal_pelantikan,
        status_siklus: item.newSiklus,
        jabatan_ambalan: item.jabatan_ambalan,
        email_sekolah: item.email_sekolah,
        riwayat_kelas: existingHistory
      };
    });

    onExecuteRollover(updatedSiswa, targetTahunAjaran);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col justify-between animate-scale-in">
        {/* Header */}
        <div className="pb-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
                <span>Promosi / Naik Kelas Massal (Academic Roll-Over)</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Arsip Historis Aktif
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                Menaikkan tingkat kelas anggota serentak tanpa menghapus data riwayat tahun ajaran sebelumnya.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="my-4 overflow-y-auto pr-1 space-y-4 text-xs">
          {/* Target TA selector */}
          <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 space-y-2">
            <label className="block font-black text-indigo-950">
              Target Tahun Ajaran Baru:
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-2 bg-white border border-indigo-200 rounded-xl px-3 py-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <input
                  type="text"
                  value={targetTahunAjaran}
                  onChange={(e) => setTargetTahunAjaran(e.target.value)}
                  placeholder="misal: TA. 2026-2027"
                  className="font-bold text-gray-800 text-xs focus:outline-none w-36"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {tahunAjaranList.map((ta) => (
                  <button
                    key={ta}
                    type="button"
                    onClick={() => setTargetTahunAjaran(ta)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      targetTahunAjaran === ta
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {ta}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-indigo-800 flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Data kelas pada tahun ajaran lama tetap tersimpan permanen di arsip historis.</span>
            </p>
          </div>

          {/* Roll-Over Rules Explanation */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="font-extrabold text-gray-800 block">Kelas X ➔ XI</span>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                {countPromotedXtoXI} Anggota
              </span>
              <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                Naik ke Penegak Aktif
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="font-extrabold text-gray-800 block">Kelas XI ➔ XII</span>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                {countPromotedXItoXII} Anggota
              </span>
              <span className="text-[10px] text-blue-700 font-bold block mt-1">
                Tingkat Akhir Penegak
              </span>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <span className="font-extrabold text-amber-900 block">Kelas XII ➔ Alumni</span>
              <span className="text-[11px] text-amber-700 block mt-0.5">
                {countGraduatedXII} Anggota
              </span>
              <span className="text-[10px] text-amber-800 font-bold block mt-1">
                Purna Ambalan / DK
              </span>
            </div>
          </div>

          {/* Table Preview */}
          <div>
            <span className="font-black text-gray-700 block mb-1.5">
              Pratinjau Kenaikan Kelas ({previewList.length} Murid Terdaftar):
            </span>
            <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="p-2.5">Nama Murid</th>
                    <th className="p-2.5">Kelas Asal</th>
                    <th className="p-2.5 text-center">➔</th>
                    <th className="p-2.5">Kelas Baru ({targetTahunAjaran})</th>
                    <th className="p-2.5">Status Baru</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/70">
                      <td className="p-2.5 font-semibold text-gray-900">{item.nama_lengkap}</td>
                      <td className="p-2.5 text-gray-500">{item.oldKelas}</td>
                      <td className="p-2.5 text-center text-indigo-500 font-bold">➔</td>
                      <td className="p-2.5 font-bold text-indigo-900 bg-indigo-50/30">
                        {item.newKelas}
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.isGraduated
                            ? 'bg-amber-100 text-amber-800'
                            : item.newKelas.startsWith('XI')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.newSiklus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-xl flex items-start space-x-2.5">
            <input
              type="checkbox"
              id="confirmRollover"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-indigo-600 rounded cursor-pointer"
            />
            <label htmlFor="confirmRollover" className="text-gray-700 text-xs cursor-pointer font-medium">
              Saya mengonfirmasi kenaikan kelas massal untuk <b>{previewList.length}</b> siswa ke Tahun Ajaran <b>{targetTahunAjaran}</b>. Data kelas di tahun ajaran sebelumnya akan diabadikan di arsip historis.
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!isConfirmed}
            onClick={handleExecute}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer ${
              isConfirmed
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Eksekusi Kenaikan Kelas Massal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
