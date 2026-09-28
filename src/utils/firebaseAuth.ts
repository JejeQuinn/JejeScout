import { 
  signInWithPopup, 
  signInWithCredential, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import { auth } from './firebaseClient';
import { UserProfile, OFFICIAL_ACCOUNTS, PengawasAccount } from '../types';
export { auth };

// Official Google OAuth Client ID for SI-Pramuka SMK Bakti Idhata
export const GOOGLE_OAUTH_CLIENT_ID = '720754345724-8qpfucf1g7rjoboq8ah4d8tbc6pmrit4.apps.googleusercontent.com';

// Standard login provider (only email & profile, zero unverified app warnings)
export const loginProvider = new GoogleAuthProvider();
loginProvider.setCustomParameters({ prompt: 'select_account' });

// Dedicated Drive backup provider (includes drive.file scope)
export const driveProvider = new GoogleAuthProvider();
driveProvider.addScope('https://www.googleapis.com/auth/drive.file');
driveProvider.setCustomParameters({ prompt: 'select_account' });

// Backward compatibility alias
const provider = loginProvider;

let isSigningIn = false;

// Read cached access token from persistent storage
const TOKEN_KEY = 'pramuka_google_access_token';
const SESSION_KEY = 'pramuka_auth_session';

export interface AuthSession {
  userId: string;
  email: string;
  nama: string;
  role: 'admin' | 'viewer';
  jabatan: string;
  token?: string;
  loginAt: number;
}

/**
 * Decodes a JWT token without requiring external libraries or network requests
 */
export function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

/**
 * Ensures Google Identity Services (GIS) client library is loaded and ready.
 */
export const loadGisScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).google?.accounts?.oauth2) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      const checkInterval = setInterval(() => {
        if ((window as any).google?.accounts?.oauth2) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(Boolean((window as any).google?.accounts?.oauth2));
      }, 3000);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve(Boolean((window as any).google?.accounts?.oauth2));
    };
    script.onerror = () => {
      resolve(false);
    };
    document.head.appendChild(script);
  });
};

export function saveAuthSession(session: AuthSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem('pramuka_is_authenticated', 'true');
    localStorage.setItem('pramuka_current_user_id', session.userId);
  } catch (e) {
    console.warn('Error saving auth session:', e);
  }
}

export function getAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading auth session:', e);
  }
  return null;
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('pramuka_is_authenticated');
    localStorage.removeItem('pramuka_current_user_id');
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem('pramuka_session_user_id');
  } catch (e) {
    console.warn('Error clearing auth session:', e);
  }
}

/**
 * Validates whether an email belongs to an authorized user and resolves their specific RBAC role.
 * - Admin: Full access (jihanminho8@gmail.com and admin accounts)
 * - Pengawas: Read-only access (school supervisors and viewer accounts)
 * - Unregistered: Denied (returns null)
 */
export function resolveUserRole(email: string, pengawasAccounts: PengawasAccount[] = []): UserProfile | null {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail) return null;

  // 1. Super Admin: jihanminho8@gmail.com (Always full Admin privileges)
  if (cleanEmail === 'jihanminho8@gmail.com') {
    const admin = OFFICIAL_ACCOUNTS.find(a => a.id === 'acc_pembina') || OFFICIAL_ACCOUNTS[0];
    return {
      ...admin,
      email: cleanEmail,
      role: 'admin',
      keteranganAkses: 'Akses Admin Penuh (Super Admin - Dapat mengedit semua fitur dan mengelola seluruh data)'
    };
  }

  // 2. Official predefined accounts
  const official = OFFICIAL_ACCOUNTS.find(a => a.email.toLowerCase().trim() === cleanEmail);
  if (official) {
    return official;
  }

  // 3. Accounts registered in Pengawas database (Firestore)
  const matched = pengawasAccounts.find(p => p.email.toLowerCase().trim() === cleanEmail);
  if (matched) {
    if (matched.isActive === false) {
      return null; // Deactivated by admin
    }
    const isAccountAdmin = matched.role === 'admin';
    const initials = matched.nama
      .split(' ')
      .filter((w) => !['bapak', 'ibu', 'kak', 's.', 'm.', 'pd', 'kom', 'dr.'].includes(w.toLowerCase().replace('.', '')))
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || (isAccountAdmin ? 'AD' : 'PA');

    return {
      id: matched.id,
      username: matched.username || cleanEmail.split('@')[0],
      nama: matched.nama,
      email: cleanEmail,
      jabatan: matched.jabatan,
      role: isAccountAdmin ? 'admin' : 'viewer',
      inisial: initials,
      keteranganAkses: isAccountAdmin
        ? 'Akses Admin Penuh (Dapat mengedit semua fitur dan mengelola seluruh data)'
        : `Akses Pengawas (${matched.jabatan}) - Hanya Lihat`,
      avatarColor: isAccountAdmin ? 'bg-indigo-600 text-white' : 'bg-amber-600 text-white'
    };
  }

  return null;
}

let cachedAccessToken: string | null = (typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);

// Listen to auth state and maintain the session across refreshes
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        cachedAccessToken = storedToken;
        if (onAuthSuccess) onAuthSuccess(user, storedToken);
      } else {
        try {
          const idToken = await user.getIdToken();
          cachedAccessToken = idToken;
          localStorage.setItem(TOKEN_KEY, idToken);
          if (onAuthSuccess) onAuthSuccess(user, idToken);
        } catch (e) {
          if (onAuthSuccess) onAuthSuccess(user, '');
        }
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export interface GoogleAuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  getIdToken?: () => Promise<string>;
}

export interface GoogleSignInResult {
  user: GoogleAuthUser;
  accessToken: string;
}

// Helper to fetch user profile using access token without CORS blocking
async function fetchGoogleUserProfile(accessToken: string): Promise<any> {
  // 1. Primary: Server-side proxy through Vite to avoid browser CORS
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('/api/google-userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.email) return data;
    }
  } catch (e) {
    // If proxy request fails, try direct endpoints
  }

  // 2. Direct userinfo request with short timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.email) return data;
    }
  } catch (e) {}

  return null;
}

// Sign in with Google Popup using Google Identity Services (GIS) OAuth SDK with Firebase fallback
export const googleSignIn = async (options?: { requestDriveScope?: boolean }): Promise<GoogleSignInResult | null> => {
  try {
    isSigningIn = true;

    // Ensure GIS client is loaded
    await loadGisScript();

    const google = typeof window !== 'undefined' ? (window as any).google : null;
    const requestedScope = options?.requestDriveScope 
      ? 'email profile https://www.googleapis.com/auth/drive.file'
      : 'email profile';

    // Strategy 1: Google Identity Services (GIS) Token Client - Native Official Google OAuth Popup
    if (google?.accounts?.oauth2) {
      const gisResult = await new Promise<GoogleSignInResult | null>((resolve, reject) => {
        let isSettled = false;

        // Bounded safety timeout (60s): Gives user plenty of time to choose account
        const safetyTimer = setTimeout(() => {
          if (!isSettled) {
            cleanup();
            console.warn('[Google Auth] Timeout reached, unlocking button.');
            resolve(null);
          }
        }, 60000);

        // Window focus detection: If user closes the popup window without selecting an account,
        // the main window regains focus. After a brief grace period (2.5s), if no callback arrived,
        // we safely conclude the popup was closed and reset the button state.
        let focusTimer: any = null;
        const handleWindowFocus = () => {
          if (focusTimer) clearTimeout(focusTimer);
          focusTimer = setTimeout(() => {
            if (!isSettled) {
              cleanup();
              resolve(null);
            }
          }, 2500);
        };

        const cleanup = () => {
          clearTimeout(safetyTimer);
          if (focusTimer) clearTimeout(focusTimer);
          if (typeof window !== 'undefined') {
            window.removeEventListener('focus', handleWindowFocus);
          }
          isSettled = true;
          isSigningIn = false;
        };

        if (typeof window !== 'undefined') {
          window.addEventListener('focus', handleWindowFocus);
        }

        try {
          const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_OAUTH_CLIENT_ID,
            scope: requestedScope,
            error_callback: (err: any) => {
              if (isSettled) return;
              cleanup();

              if (
                err?.type === 'popup_closed' || 
                err?.type === 'popup_closed_by_user' || 
                err?.message?.includes('closed')
              ) {
                // User closed popup
                resolve(null);
                return;
              }

              if (err?.type === 'popup_blocked_by_browser') {
                reject(new Error('Jendela pop-up Google diblokir oleh browser. Izinkan pop-up untuk situs ini lalu coba lagi.'));
                return;
              }

              resolve(null);
            },
            callback: async (tokenResponse: any) => {
              if (isSettled) return;

              if (!tokenResponse || tokenResponse.error) {
                cleanup();
                if (tokenResponse?.error === 'popup_closed_by_user' || tokenResponse?.error === 'access_denied') {
                  resolve(null);
                  return;
                }
                reject(new Error(tokenResponse?.error_description || tokenResponse?.error || 'Gagal login dengan akun Google.'));
                return;
              }

              try {
                const accessToken = tokenResponse.access_token;
                if (!accessToken) {
                  cleanup();
                  reject(new Error('Google OAuth tidak mengembalikan token akses.'));
                  return;
                }

                cachedAccessToken = accessToken;
                localStorage.setItem(TOKEN_KEY, accessToken);

                // Check if id_token was included and parse immediately
                let profile: any = null;
                if (tokenResponse.id_token) {
                  profile = parseJwt(tokenResponse.id_token);
                }

                // If no profile from id_token, fetch via proxy
                if (!profile || !profile.email) {
                  profile = await fetchGoogleUserProfile(accessToken);
                }

                if (!profile || !profile.email) {
                  cleanup();
                  reject(new Error('Gagal mengambil data email dari profil Google. Silakan periksa koneksi internet Anda atau coba lagi.'));
                  return;
                }

                const googleUser: GoogleAuthUser = {
                  uid: profile.sub || profile.id || Date.now().toString(),
                  email: profile.email.toLowerCase().trim(),
                  displayName: profile.name || profile.displayName || profile.email || 'Pengguna Google',
                  photoURL: profile.picture,
                  getIdToken: async () => accessToken
                };

                cleanup();
                resolve({
                  user: googleUser,
                  accessToken
                });
              } catch (fetchErr: any) {
                cleanup();
                reject(new Error(`Gagal memproses profil Google: ${fetchErr.message || 'Koneksi terputus.'}`));
              }
            }
          });

          // Launch Google's account selection popup window
          tokenClient.requestAccessToken({ prompt: 'select_account' });
        } catch (initErr: any) {
          cleanup();
          reject(initErr);
        }
      });

      return gisResult;
    }

    // Strategy 2: Firebase Auth signInWithPopup fallback (Only when GIS SDK is unavailable)
    const targetProvider = options?.requestDriveScope ? driveProvider : loginProvider;
    const result = await signInWithPopup(auth, targetProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || (await result.user.getIdToken());
    cachedAccessToken = accessToken;
    localStorage.setItem(TOKEN_KEY, accessToken);

    return {
      user: {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || result.user.email || '',
        photoURL: result.user.photoURL || undefined,
        getIdToken: async () => result.user.getIdToken()
      },
      accessToken
    };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      (typeof error?.message === 'string' && error.message.includes('auth/popup-closed-by-user'))
    ) {
      // User closed popup
      return null;
    }
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Get the current cached access token
export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      cachedAccessToken = saved;
      return saved;
    }
  }
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      cachedAccessToken = token;
      localStorage.setItem(TOKEN_KEY, token);
      return token;
    } catch (e) {}
  }
  return null;
};

// Sign out
export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  clearAuthSession();
};

// Google Drive API Helpers
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}

// 1. List SI-Pramuka files on Google Drive
export const listBackupFiles = async (token: string): Promise<DriveFile[]> => {
  const query = encodeURIComponent("name contains 'SI_Pramuka_Backup_' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,createdTime,modifiedTime,size)&orderBy=createdTime desc`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Gagal mengambil daftar file dari Google Drive');
  }

  const data = await res.json();
  return data.files || [];
};

// 2. Upload Backup File (Multipart)
export const uploadBackupFile = async (token: string, filename: string, content: any): Promise<DriveFile> => {
  const boundary = '314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const contentType = 'application/json';
  const metadata = {
    name: filename,
    mimeType: contentType,
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: ' + contentType + '\r\n\r\n' +
    JSON.stringify(content, null, 2) +
    close_delim;

  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Gagal mengunggah file ke Google Drive');
  }

  return await res.json();
};

// 3. Upload text Jurnal file to Google Drive
export const uploadJournalFile = async (token: string, filename: string, textContent: string): Promise<DriveFile> => {
  const boundary = '314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const contentType = 'text/plain';
  const metadata = {
    name: filename,
    mimeType: contentType,
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: ' + contentType + '; charset=UTF-8\r\n\r\n' +
    textContent +
    close_delim;

  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Gagal mengunggah laporan jurnal ke Google Drive');
  }

  return await res.json();
};

// 4. Download backup file content
export const downloadBackupContent = async (token: string, fileId: string): Promise<any> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Gagal mengunduh isi file backup dari Google Drive');
  }

  return await res.json();
};

// 5. Delete backup file (requires user confirmation before calling)
export const deleteDriveFile = async (token: string, fileId: string): Promise<void> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Gagal menghapus file dari Google Drive');
  }
};
