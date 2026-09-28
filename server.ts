import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json());

// Set Keep-Alive headers on all responses to stabilize connections through Cloud Run proxy
app.use((req, res, next) => {
  res.setHeader('Keep-Alive', 'timeout=120, max=1000');
  next();
});

// 1. Healthcheck & Heartbeat API for background tab keep-alive
app.get(['/api/health', '/api/heartbeat'], (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    status: 'ok',
    service: 'SI-Pramuka SMK Bakti Idhata',
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
});

// 2. Google OAuth UserInfo Proxy to prevent browser CORS blocks
app.get('/api/google-userinfo', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: authHeader },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!googleRes.ok) {
      return res.status(googleRes.status).json({ error: 'Failed to fetch userinfo from Google' });
    }

    const data = await googleRes.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Google userinfo proxy timeout' });
  }
});

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

// Simple in-memory rate limiting for brute-force protection
const failedLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const ipKey = String(clientIp);

  // Check rate limiting
  const attemptInfo = failedLoginAttempts.get(ipKey);
  const now = Date.now();
  if (attemptInfo && attemptInfo.lockedUntil > now) {
    const remainingSeconds = Math.ceil((attemptInfo.lockedUntil - now) / 1000);
    return res.status(429).json({
      success: false,
      message: `Terlalu banyak percobaan masuk yang salah. Harap tunggu ${remainingSeconds} detik sebelum mencoba lagi.`,
    });
  }

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'ID Pengguna / Email dan Kata Sandi wajib diisi.',
    });
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
    return res.json({
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
    return res.json({
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
    return res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan salah. Akses ditangguhkan selama 60 detik.',
    });
  } else {
    failedLoginAttempts.set(ipKey, { count: currentCount, lockedUntil: 0 });
    return res.status(401).json({
      success: false,
      message: 'ID Pengguna atau Kata Sandi tidak cocok.',
      attemptsLeft: 5 - currentCount,
    });
  }
});

// Vite Middleware for development / Static files for production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] SI-Pramuka server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Error]', err);
});
