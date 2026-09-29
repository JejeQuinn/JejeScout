import type { Config, Context } from '@netlify/functions';

// 3. Secret Administrator Authentication Endpoint (Backend-only credentials)
// Credentials are strictly stored on the server and never exposed in the client-side bundle.
const VALID_ADMIN_PASSWORDS = new Set(
  [
    'PramukaBakti#2026!',
    process.env.ADMIN_SECRET_PASSWORD,
    'admin123',
    'pembina123',
  ].filter(Boolean) as string[]
);

const BACKEND_ADMIN_CREDENTIALS = {
  usernames: ['admin', 'pembina', 'admin.pramuka', 'kakjihan.admin', 'jihanminho8@gmail.com'],
  userProfile: {
    id: 'acc_pembina',
    username: 'admin.pramuka',
    nama: 'Kak Jihan Fadhilah, S. Kom',
    email: 'jihanminho8@gmail.com',
    jabatan: 'Pembina Pramuka & Super Admin',
    role: 'admin' as const,
    inisial: 'JF',
    keteranganAkses: 'Akses Admin Penuh (Super Admin - Kredensial Peladen Resmi)',
    avatarColor: 'bg-indigo-600 text-white',
  },
};

const BACKEND_PENGAWAS_CREDENTIALS: Record<string, { password: string; profile: any }> = {
  'kurikulum': {
    password: 'kurikulum123',
    profile: {
      id: 'pengawas_dhenny',
      nama: 'Bapak Dhenny Effendi, S. Pd',
      email: 'dhenny.effendi@smkbaktiidhata.sch.id',
      username: 'kurikulum',
      jabatan: 'Wakil Kepala Sekolah Bidang Kurikulum',
      role: 'viewer',
      inisial: 'DE',
      keteranganAkses: 'Akses Pengawas (Wakil Kepala Sekolah Bidang Kurikulum) - Hanya Lihat',
      avatarColor: 'bg-amber-600 text-white'
    }
  },
  'ekskul': {
    password: 'ekskul123',
    profile: {
      id: 'pengawas_sarah',
      nama: 'Ibu Sarah Nur Amalia, S. Pd',
      email: 'sarah.amalia@smkbaktiidhata.sch.id',
      username: 'ekskul',
      jabatan: 'Pembina Ekstrakulikuler',
      role: 'viewer',
      inisial: 'SN',
      keteranganAkses: 'Akses Pengawas (Pembina Ekstrakulikuler) - Hanya Lihat',
      avatarColor: 'bg-rose-600 text-white'
    }
  }
};

// Simple in-memory (per function instance) rate limiting for brute-force protection
const failedLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return Response.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  let identifier: unknown;
  let password: unknown;
  try {
    ({ identifier, password } = await req.json());
  } catch {
    // fall through to validation below
  }
  const clientIp = context.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const ipKey = String(clientIp);

  // Check rate limiting
  const attemptInfo = failedLoginAttempts.get(ipKey);
  const now = Date.now();
  if (attemptInfo && attemptInfo.lockedUntil > now) {
    const remainingSeconds = Math.ceil((attemptInfo.lockedUntil - now) / 1000);
    return Response.json({
      success: false,
      message: `Terlalu banyak percobaan masuk yang salah. Harap tunggu ${remainingSeconds} detik sebelum mencoba lagi.`,
    }, { status: 429 });
  }

  if (!identifier || !password) {
    return Response.json({
      success: false,
      message: 'ID Pengguna / Email dan Kata Sandi wajib diisi.',
    }, { status: 400 });
  }

  const cleanIdentifier = String(identifier).trim().toLowerCase();
  const rawPassword = String(password).trim();

  // 1. Validate against server-only secret administrator credentials
  const isSecretAdminUser = BACKEND_ADMIN_CREDENTIALS.usernames.some(
    (u) => u.toLowerCase() === cleanIdentifier
  );

  if (isSecretAdminUser && VALID_ADMIN_PASSWORDS.has(rawPassword)) {
    // Clear failed attempts on success
    failedLoginAttempts.delete(ipKey);

    // Return authenticated user profile and secure session token
    const sessionToken = `adm_sec_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    return Response.json({
      success: true,
      user: BACKEND_ADMIN_CREDENTIALS.userProfile,
      token: sessionToken,
      message: 'Autentikasi Administrator Berhasil.',
    });
  }

  // 2. Validate against official pengawas credentials
  const pengawasMatch = BACKEND_PENGAWAS_CREDENTIALS[cleanIdentifier];
  if (pengawasMatch && pengawasMatch.password === rawPassword) {
    failedLoginAttempts.delete(ipKey);
    const sessionToken = `pgw_sec_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    return Response.json({
      success: true,
      user: pengawasMatch.profile,
      token: sessionToken,
      message: 'Autentikasi Pengawas Berhasil.',
    });
  }

  // Record failed attempt
  const currentCount = (attemptInfo?.count || 0) + 1;
  if (currentCount >= 5) {
    failedLoginAttempts.set(ipKey, { count: currentCount, lockedUntil: now + 60000 });
    return Response.json({
      success: false,
      message: 'Terlalu banyak percobaan salah. Akses ditangguhkan selama 60 detik.',
    }, { status: 429 });
  } else {
    failedLoginAttempts.set(ipKey, { count: currentCount, lockedUntil: 0 });
    return Response.json({
      success: false,
      message: 'ID Pengguna atau Kata Sandi tidak cocok.',
      attemptsLeft: 5 - currentCount,
    }, { status: 401 });
  }
};

export const config: Config = {
  path: '/api/auth/login',
};
