import { Siswa, StatusSiklus, RiwayatAkademik } from '../types';

/**
 * Parses start year from a Tahun Ajaran string (e.g. "TA. 2024-2025" -> 2024).
 */
export function parseYearFromTA(ta: string): number | null {
  if (!ta) return null;
  const match = ta.match(/(\d{4})\s*[-/]\s*(\d{4})/);
  if (match) {
    return parseInt(match[1], 10);
  }
  const singleMatch = ta.match(/(\d{4})/);
  if (singleMatch) {
    return parseInt(singleMatch[1], 10);
  }
  return null;
}

/**
 * Standardizes and promotes/demotes a class string by a specified number of years.
 * e.g. "X RPL 1" + 1 -> "XI RPL 1"
 * e.g. "XI TKJ" + 1 -> "XII TKJ"
 * e.g. "XII DKV 2" + 1 -> "Alumni / Purna Ambalan"
 * e.g. "XI RPL 2" - 1 -> "X RPL 2"
 */
export function shiftClassLevel(className: string, yearDelta: number): {
  newClass: string;
  isEnrolled: boolean;
  isGraduated: boolean;
} {
  if (!className || className === 'Belum Ditentukan') {
    return { newClass: className || 'Belum Ditentukan', isEnrolled: true, isGraduated: false };
  }

  // Already alumni / purna ambalan
  const lower = className.toLowerCase();
  if (lower.includes('alumni') || lower.includes('lulus') || lower.includes('purna')) {
    return { newClass: 'Alumni / Purna Ambalan', isEnrolled: true, isGraduated: true };
  }

  if (yearDelta === 0) {
    return { newClass: className, isEnrolled: true, isGraduated: false };
  }

  // Match Roman numerals: X, XI, XII
  const romanMatch = className.match(/^(XII|XI|X)(\b|\s*[-_/\s])(.*)$/i);

  if (!romanMatch) {
    // If not standard roman numeral class name, keep as is
    return { newClass: className, isEnrolled: true, isGraduated: false };
  }

  const prefix = romanMatch[1].toUpperCase();
  const separator = romanMatch[2] || ' ';
  const rest = romanMatch[3] || '';

  let currentLevel = 10;
  if (prefix === 'X') currentLevel = 10;
  else if (prefix === 'XI') currentLevel = 11;
  else if (prefix === 'XII') currentLevel = 12;

  const targetLevel = currentLevel + yearDelta;

  if (targetLevel < 10) {
    // Student was not yet enrolled in high school
    return { newClass: `Belum Terdaftar (SMP)`, isEnrolled: false, isGraduated: false };
  }

  if (targetLevel === 10) {
    return { newClass: `X${separator}${rest}`.trim(), isEnrolled: true, isGraduated: false };
  } else if (targetLevel === 11) {
    return { newClass: `XI${separator}${rest}`.trim(), isEnrolled: true, isGraduated: false };
  } else if (targetLevel === 12) {
    return { newClass: `XII${separator}${rest}`.trim(), isEnrolled: true, isGraduated: false };
  } else {
    // targetLevel >= 13 -> Graduated / Alumni
    return { newClass: 'Alumni / Purna Ambalan', isEnrolled: true, isGraduated: true };
  }
}

export interface ResolvedSiswaAcademic {
  kelas: string;
  status_siklus: StatusSiklus;
  status_aktif: boolean;
  isEnrolled: boolean;
  isGraduated: boolean;
  isExplicitHistory: boolean;
}

/**
 * Resolves the student's exact class, cycle status, and enrollment for a specific academic year.
 * Checks explicit historical records first, otherwise applies automatic relational progression.
 */
export function resolveSiswaForTA(
  siswa: Siswa,
  targetTa: string,
  _tahunAjaranList?: string[]
): ResolvedSiswaAcademic {
  // If targetTa is 'all', return current properties directly
  if (!targetTa || targetTa === 'all') {
    const isAlum =
      siswa.status_siklus === 'Purna Ambalan' ||
      siswa.status_siklus === 'Dewan Kehormatan / Alumni' ||
      siswa.kelas.toLowerCase().includes('alumni');

    return {
      kelas: siswa.kelas,
      status_siklus: siswa.status_siklus || (isAlum ? 'Purna Ambalan' : 'Penegak Aktif'),
      status_aktif: siswa.status_aktif,
      isEnrolled: true,
      isGraduated: isAlum,
      isExplicitHistory: false,
    };
  }

  // 1. Check explicit riwayat_kelas first
  if (siswa.riwayat_kelas && Array.isArray(siswa.riwayat_kelas)) {
    const explicitEntry = siswa.riwayat_kelas.find((r) => r.tahun_ajaran === targetTa);
    if (explicitEntry) {
      const isAlum =
        explicitEntry.status_siklus === 'Purna Ambalan' ||
        explicitEntry.status_siklus === 'Dewan Kehormatan / Alumni' ||
        explicitEntry.kelas.toLowerCase().includes('alumni');

      return {
        kelas: explicitEntry.kelas,
        status_siklus:
          explicitEntry.status_siklus ||
          (isAlum ? 'Purna Ambalan' : siswa.status_siklus || 'Penegak Aktif'),
        status_aktif: explicitEntry.status_aktif ?? (isAlum ? false : siswa.status_aktif),
        isEnrolled: true,
        isGraduated: isAlum,
        isExplicitHistory: true,
      };
    }
  }

  // 2. If student base tahun_ajaran matches targetTa
  const baseTa = siswa.tahun_ajaran || 'TA. 2024-2025';
  if (baseTa === targetTa) {
    const isAlum =
      siswa.status_siklus === 'Purna Ambalan' ||
      siswa.status_siklus === 'Dewan Kehormatan / Alumni' ||
      siswa.kelas.toLowerCase().includes('alumni');

    return {
      kelas: siswa.kelas,
      status_siklus: siswa.status_siklus || (isAlum ? 'Purna Ambalan' : 'Penegak Aktif'),
      status_aktif: siswa.status_aktif,
      isEnrolled: true,
      isGraduated: isAlum,
      isExplicitHistory: false,
    };
  }

  // 3. Compute relative progression based on year difference
  const baseYear = parseYearFromTA(baseTa);
  const targetYear = parseYearFromTA(targetTa);

  if (baseYear !== null && targetYear !== null) {
    const delta = targetYear - baseYear;
    const { newClass, isEnrolled, isGraduated } = shiftClassLevel(siswa.kelas, delta);

    if (!isEnrolled) {
      return {
        kelas: newClass,
        status_siklus: 'Calon Penegak',
        status_aktif: false,
        isEnrolled: false,
        isGraduated: false,
        isExplicitHistory: false,
      };
    }

    let resolvedSiklus: StatusSiklus = siswa.status_siklus || 'Penegak Aktif';
    let resolvedAktif = siswa.status_aktif;

    if (isGraduated) {
      resolvedSiklus =
        siswa.status_siklus === 'Dewan Ambalan Aktif'
          ? 'Dewan Kehormatan / Alumni'
          : 'Purna Ambalan';
      resolvedAktif = false;
    } else if (newClass.startsWith('X ') || newClass.startsWith('X-') || newClass === 'X') {
      resolvedSiklus = 'Calon Penegak';
      resolvedAktif = true;
    } else {
      // XI or XII
      if (siswa.status_siklus === 'Dewan Ambalan Aktif') {
        resolvedSiklus = 'Dewan Ambalan Aktif';
      } else {
        resolvedSiklus = 'Penegak Aktif';
      }
      resolvedAktif = true;
    }

    return {
      kelas: newClass,
      status_siklus: resolvedSiklus,
      status_aktif: resolvedAktif,
      isEnrolled: true,
      isGraduated,
      isExplicitHistory: false,
    };
  }

  // Fallback if years cannot be parsed
  return {
    kelas: siswa.kelas,
    status_siklus: siswa.status_siklus || 'Penegak Aktif',
    status_aktif: siswa.status_aktif,
    isEnrolled: true,
    isGraduated: false,
    isExplicitHistory: false,
  };
}

/**
 * Returns a student object updated with an explicit entry in riwayat_kelas.
 */
export function recordStudentClassHistory(
  siswa: Siswa,
  targetTa: string,
  newKelas: string,
  newSiklus?: StatusSiklus,
  isActive?: boolean,
  catatan?: string
): Siswa {
  const currentHistory: RiwayatAkademik[] = Array.isArray(siswa.riwayat_kelas)
    ? [...siswa.riwayat_kelas]
    : [];

  const existingIdx = currentHistory.findIndex((h) => h.tahun_ajaran === targetTa);
  const newEntry: RiwayatAkademik = {
    tahun_ajaran: targetTa,
    kelas: newKelas,
    status_siklus: newSiklus || siswa.status_siklus,
    status_aktif: isActive ?? siswa.status_aktif,
    tanggal_tercatat: new Date().toISOString(),
    catatan: catatan || (existingIdx >= 0 ? 'Pembaruan data historis' : 'Perekaman status akademik baru')
  };

  if (existingIdx >= 0) {
    currentHistory[existingIdx] = newEntry;
  } else {
    currentHistory.push(newEntry);
  }

  return {
    ...siswa,
    riwayat_kelas: currentHistory,
  };
}
