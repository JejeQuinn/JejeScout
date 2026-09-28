import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Search, 
  Mail, 
  User, 
  Briefcase, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Lock,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  Edit,
  X,
  Key,
  Shield,
  Filter,
  UserX,
  Power,
  RefreshCw,
  Info
} from 'lucide-react';
import { PengawasAccount, UserProfile, UserRole } from '../types';
import { setFirestoreDoc, deleteFirestoreDoc, COLLECTIONS } from '../utils/firestoreService';

interface PengawasAccountManagerProps {
  currentUser: UserProfile;
  accounts: PengawasAccount[];
  onAddAccount: (acc: PengawasAccount) => void;
  onUpdateAccount: (acc: PengawasAccount) => void;
  onDeleteAccount: (id: string) => void;
}

export const PengawasAccountManager: React.FC<PengawasAccountManagerProps> = ({
  currentUser,
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount
}) => {
  // Form Create State
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [showPassword, setShowPassword] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'viewer' | 'inactive'>('all');

  // Modal Edit State
  const [editingAccount, setEditingAccount] = useState<PengawasAccount | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editJabatan, setEditJabatan] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('viewer');
  const [editIsActive, setEditIsActive] = useState(true);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Delete Confirmation Modal State
  const [accountToDelete, setAccountToDelete] = useState<PengawasAccount | null>(null);

  // Alerts & UX State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const isAdmin = currentUser.role === 'admin' || currentUser.email === 'jihanminho8@gmail.com';

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate a random secure default password
  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  // --- 1. TAMBAH AKUN BARU ---
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isAdmin) {
      setErrorMsg('Hanya Admin Utama (Kak Jihan Fadhilah, S. Kom) yang dapat menambahkan akun baru.');
      return;
    }

    const cleanNama = nama.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanJabatan = jabatan.trim();
    const cleanUsername = username.trim().toLowerCase() || cleanEmail.split('@')[0];
    const cleanPassword = password.trim() || (role === 'admin' ? 'pembina123' : 'pengawas123');

    if (!cleanNama || !cleanEmail || !cleanJabatan) {
      setErrorMsg('Semua kolom wajib diisi (Nama Lengkap, Email Google/Sekolah, dan Jabatan).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg('Format email tidak valid. Harap masukkan alamat email yang benar.');
      return;
    }

    if (cleanEmail === 'jihanminho8@gmail.com') {
      setErrorMsg('Email jihanminho8@gmail.com adalah akun Admin Utama permanen.');
      return;
    }

    // Check email uniqueness
    const emailExists = accounts.some(acc => acc.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      setErrorMsg(`Email "${cleanEmail}" sudah terdaftar dalam sistem ambalan.`);
      return;
    }

    setIsSubmitting(true);

    const newId = `acc_${Date.now()}`;
    const newAccount: PengawasAccount = {
      id: newId,
      nama: cleanNama,
      email: cleanEmail,
      username: cleanUsername,
      password: cleanPassword,
      jabatan: cleanJabatan,
      role: role,
      tanggalDitambahkan: new Date().toISOString().split('T')[0],
      ditambahkanOleh: `${currentUser.nama} (${currentUser.email})`,
      isActive: true,
      avatarColor: role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-amber-600 text-white'
    };

    try {
      // Save to Firestore
      await setFirestoreDoc(COLLECTIONS.PENGAWAS_ACCOUNTS, newId, newAccount);
      
      // Update local storage password lookup for offline/immediate manual login
      try {
        const storedPasswords = JSON.parse(localStorage.getItem('pramuka_user_passwords') || '{}');
        storedPasswords[newId] = cleanPassword;
        storedPasswords[cleanUsername] = cleanPassword;
        storedPasswords[cleanEmail] = cleanPassword;
        localStorage.setItem('pramuka_user_passwords', JSON.stringify(storedPasswords));
      } catch (e) {
        console.warn(e);
      }

      // Update state in parent
      onAddAccount(newAccount);

      setSuccessMsg(`Berhasil mendaftarkan akun baru untuk "${cleanNama}" (${cleanEmail}) sebagai ${role === 'admin' ? 'Administrator' : 'Pengawas'}.`);
      setNama('');
      setEmail('');
      setUsername('');
      setPassword('');
      setJabatan('');
      setRole('viewer');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Gagal menyimpan akun: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 2. PERSIAPAN EDIT AKUN ---
  const handleOpenEdit = (acc: PengawasAccount) => {
    setEditingAccount(acc);
    setEditNama(acc.nama);
    setEditEmail(acc.email);
    setEditUsername(acc.username || acc.email.split('@')[0]);
    
    // Retrieve stored password if available
    let existingPwd = acc.password || '';
    if (!existingPwd) {
      try {
        const storedPasswords = JSON.parse(localStorage.getItem('pramuka_user_passwords') || '{}');
        existingPwd = storedPasswords[acc.id] || storedPasswords[acc.email.toLowerCase()] || '';
      } catch (e) {}
    }
    setEditPassword(existingPwd || (acc.role === 'admin' ? 'pembina123' : 'pengawas123'));
    setEditJabatan(acc.jabatan);
    setEditRole(acc.role || 'viewer');
    setEditIsActive(acc.isActive !== false);
    setShowEditPassword(false);
  };

  // --- 3. SIMPAN PERUBAHAN EDIT AKUN ---
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanNama = editNama.trim();
    const cleanEmail = editEmail.trim().toLowerCase();
    const cleanJabatan = editJabatan.trim();
    const cleanUsername = editUsername.trim().toLowerCase() || cleanEmail.split('@')[0];
    const cleanPassword = editPassword.trim();

    if (!cleanNama || !cleanEmail || !cleanJabatan) {
      alert('Nama, Email, dan Jabatan wajib diisi.');
      return;
    }

    // Check email clash with other accounts
    const emailClash = accounts.some(
      a => a.id !== editingAccount.id && a.email.toLowerCase() === cleanEmail
    );
    if (emailClash) {
      alert(`Email "${cleanEmail}" sudah digunakan oleh akun lain.`);
      return;
    }

    setIsEditSubmitting(true);

    const updatedAccount: PengawasAccount = {
      ...editingAccount,
      nama: cleanNama,
      email: cleanEmail,
      username: cleanUsername,
      password: cleanPassword,
      jabatan: cleanJabatan,
      role: editRole,
      isActive: editIsActive,
      avatarColor: editRole === 'admin' ? 'bg-indigo-600 text-white' : 'bg-amber-600 text-white'
    };

    try {
      // Save to Firestore
      await setFirestoreDoc(COLLECTIONS.PENGAWAS_ACCOUNTS, updatedAccount.id, updatedAccount);

      // Update password storage
      if (cleanPassword) {
        try {
          const storedPasswords = JSON.parse(localStorage.getItem('pramuka_user_passwords') || '{}');
          storedPasswords[updatedAccount.id] = cleanPassword;
          storedPasswords[cleanUsername] = cleanPassword;
          storedPasswords[cleanEmail] = cleanPassword;
          localStorage.setItem('pramuka_user_passwords', JSON.stringify(storedPasswords));
        } catch (e) {
          console.warn(e);
        }
      }

      onUpdateAccount(updatedAccount);

      setSuccessMsg(`Data akun "${cleanNama}" berhasil diperbarui.`);
      setEditingAccount(null);
    } catch (err: any) {
      console.error(err);
      alert('Gagal memperbarui data akun: ' + err.message);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // --- 4. TOGGLE CEPAT STATUS AKTIF ---
  const handleToggleActive = async (account: PengawasAccount) => {
    if (!isAdmin) {
      alert('Hanya Admin yang dapat mengubah status akun.');
      return;
    }

    const nextStatus = !account.isActive;
    const updatedAccount: PengawasAccount = {
      ...account,
      isActive: nextStatus
    };

    try {
      await setFirestoreDoc(COLLECTIONS.PENGAWAS_ACCOUNTS, account.id, updatedAccount);
      onUpdateAccount(updatedAccount);
      setSuccessMsg(
        `Akun "${account.nama}" kini berstatus: ${nextStatus ? 'AKTIF' : 'DITANGGUHKAN / NON-AKTIF'}.`
      );
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengubah status akun: ' + err.message);
    }
  };

  // --- 5. HAPUS AKUN ---
  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;

    if (!isAdmin) {
      alert('Hanya Admin yang memiliki hak untuk mencabut atau menghapus akun.');
      return;
    }

    try {
      await deleteFirestoreDoc(COLLECTIONS.PENGAWAS_ACCOUNTS, accountToDelete.id);
      
      // Clean up password cache
      try {
        const storedPasswords = JSON.parse(localStorage.getItem('pramuka_user_passwords') || '{}');
        delete storedPasswords[accountToDelete.id];
        if (accountToDelete.username) delete storedPasswords[accountToDelete.username];
        delete storedPasswords[accountToDelete.email.toLowerCase()];
        localStorage.setItem('pramuka_user_passwords', JSON.stringify(storedPasswords));
      } catch (e) {}

      onDeleteAccount(accountToDelete.id);
      setSuccessMsg(`Akun "${accountToDelete.nama}" (${accountToDelete.email}) berhasil dihapus.`);
      setAccountToDelete(null);
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghapus akun: ' + err.message);
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter(acc => {
    const matchSearch = 
      acc.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.jabatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.username && acc.username.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;

    if (filterRole === 'admin') return acc.role === 'admin';
    if (filterRole === 'viewer') return acc.role !== 'admin';
    if (filterRole === 'inactive') return acc.isActive === false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner / Heading */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Manajemen Akun Pengguna & Hak Akses Web/Aplikasi</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Kelola Data Akun Pengguna & Pengawas
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/80 max-w-2xl leading-relaxed">
              Tambahkan, edit data identitas, reset kata sandi, ubah wewenang hak akses (Admin / Pengawas), 
              atau hapus akun pengguna untuk sistem informasi pramuka SMK Bakti Idhata.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0 text-xs space-y-2 self-start md:self-auto max-w-xs">
            <div className="text-indigo-200 font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Metode Masuk Ganda</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-snug">
              Semua akun dapat masuk menggunakan <strong>Google Sign-In</strong> (Email) maupun <strong>Login Manual</strong> (ID Pengguna & Kata Sandi).
            </p>
          </div>
        </div>
      </div>

      {/* Alert Notices */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start space-x-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMsg}</div>
          <button 
            type="button" 
            onClick={() => setErrorMsg(null)}
            className="text-rose-400 hover:text-rose-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start space-x-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMsg}</div>
          <button 
            type="button" 
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-400 hover:text-emerald-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Form Tambah (Kiri) & Daftar Akun (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form Tambah Akun Baru */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 sticky top-6">
            <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900">Tambah Akun Baru</h2>
                  <p className="text-[11px] text-gray-500">Daftarkan akun pengguna atau pengawas</p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Formulir
              </span>
            </div>

            {!isAdmin ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-600" />
                  Mode Hanya Lihat
                </p>
                <p className="text-[11px] leading-relaxed">
                  Hanya Admin Utama yang berhak menambah, mengedit, atau menghapus akun pengguna sistem.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddAccount} className="space-y-3.5">
                
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Contoh: Bapak Ahmad Fauzi, M. Pd"
                      className="block w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-900"
                      required
                    />
                  </div>
                </div>

                {/* Email Google / Sekolah */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Alamat Email (Google SSO) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Contoh: ahmad.fauzi@gmail.com"
                      className="block w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-900 lowercase"
                      required
                    />
                  </div>
                </div>

                {/* ID Pengguna (Username) & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
                      ID Pengguna (Username)
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Contoh: ahmad123"
                      className="block w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900 lowercase"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                        Kata Sandi
                      </label>
                      <button
                        type="button"
                        onClick={() => setPassword(generateRandomPassword())}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                        title="Acak Kata Sandi"
                      >
                        Acak
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Default: pengawas123"
                        className="block w-full pl-3 pr-8 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Jabatan / Unit Tugas */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Jabatan / Unit Tugas <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                      placeholder="Contoh: Pembina Pendamping / Wali Kelas X"
                      className="block w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-900"
                      required
                    />
                  </div>
                </div>

                {/* Peran & Hak Akses (Role) */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Tingkat Hak Akses (Role)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('viewer')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        role === 'viewer'
                          ? 'border-amber-500 bg-amber-50/70 text-amber-900 shadow-xs'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">Pengawas</span>
                        <Eye className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1">Hanya Lihat (Aman)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        role === 'admin'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">Administrator</span>
                        <Shield className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1">Akses Edit Penuh</span>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl text-xs font-black tracking-wide shadow-md shadow-indigo-600/20 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Menyimpan ke Cloud...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Simpan & Daftarkan Akun</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Daftar Akun Terdaftar & Kontrol */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Card Header & Search / Filters */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <span>Daftar Akun Pengguna</span>
                  <span className="text-xs px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-bold">
                    {accounts.length + 1} Akun Terdata
                  </span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  1 Admin Utama Superuser & {accounts.length} Akun Terdaftar
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, email, username..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setFilterRole('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  filterRole === 'all'
                    ? 'bg-gray-900 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Semua Akun ({accounts.length + 1})
              </button>
              <button
                type="button"
                onClick={() => setFilterRole('admin')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  filterRole === 'admin'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                Administrator ({accounts.filter(a => a.role === 'admin').length + 1})
              </button>
              <button
                type="button"
                onClick={() => setFilterRole('viewer')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  filterRole === 'viewer'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Pengawas / Viewer ({accounts.filter(a => a.role !== 'admin').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterRole('inactive')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  filterRole === 'inactive'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Non-Aktif ({accounts.filter(a => a.isActive === false).length})
              </button>
            </div>

            {/* Permanent Superadmin Card (Kak Jihan Fadhilah, S. Kom) */}
            {(filterRole === 'all' || filterRole === 'admin') && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-indigo-50/50 to-white border-2 border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-600/20 shrink-0">
                    JF
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xs font-black text-gray-900">
                        Kak Jihan Fadhilah, S. Kom
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-2xs">
                        Admin Utama • Pemilik
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-900 font-bold mt-0.5">
                      Pembina Pramuka Gugus Depan SMK Bakti Idhata
                    </p>
                    <div className="flex items-center space-x-2 text-[11px] text-gray-600 mt-1">
                      <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-indigo-100 text-indigo-700 font-semibold">
                        jihanminho8@gmail.com
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText('jihanminho8@gmail.com', 'admin_jihan_email')}
                        className="text-gray-400 hover:text-indigo-600 transition cursor-pointer p-0.5"
                        title="Salin Email"
                      >
                        {copiedId === 'admin_jihan_email' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="text-[10px] text-gray-400">
                        • Username: <code className="bg-gray-100 px-1 py-0.2 rounded font-mono">pembina</code>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    <ShieldCheck className="w-3 h-3 mr-1 text-indigo-600" />
                    Admin Permanen
                  </span>
                </div>
              </div>
            )}

            {/* List of Registered Accounts */}
            <div className="space-y-2.5 pt-2">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-500 px-1">
                Daftar Akun Lainnya
              </h4>

              {filteredAccounts.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200">
                  <Eye className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-xs font-bold text-gray-700">Tidak ada akun yang sesuai filter</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {searchQuery ? 'Coba ubah kata kunci pencarian Anda' : 'Belum ada akun yang didaftarkan pada kategori ini'}
                  </p>
                </div>
              ) : (
                filteredAccounts.map((account) => {
                  const isAccountAdmin = account.role === 'admin';
                  const initials = account.nama
                    .split(' ')
                    .filter(w => !['bapak', 'ibu', 'kak', 's.', 'm.', 'pd', 'kom', 'dr.'].includes(w.toLowerCase().replace('.', '')))
                    .slice(0, 2)
                    .map(w => w[0])
                    .join('')
                    .toUpperCase() || 'AK';

                  return (
                    <div
                      key={account.id}
                      className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                        account.isActive === false
                          ? 'bg-gray-100/70 border-gray-300 opacity-75'
                          : isAccountAdmin
                            ? 'bg-indigo-50/20 border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50/30'
                            : 'bg-gray-50/80 border-gray-200 hover:border-gray-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                          account.isActive === false
                            ? 'bg-gray-300 text-gray-600'
                            : isAccountAdmin
                              ? 'bg-indigo-600 text-white'
                              : 'bg-amber-500 text-white'
                        }`}>
                          {initials}
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <h3 className="text-xs font-black text-gray-900 truncate">
                              {account.nama}
                            </h3>
                            
                            {/* Role Badge */}
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              isAccountAdmin
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                : 'bg-amber-100 text-amber-900 border-amber-200'
                            }`}>
                              {isAccountAdmin ? 'Admin Penuh' : 'Pengawas (Lihat)'}
                            </span>

                            {/* Active Status Badge */}
                            {account.isActive === false ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                                Non-Aktif
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Aktif
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[11px] text-gray-600 font-medium truncate mt-0.5">
                            {account.jabatan}
                          </p>

                          {/* Email & Username */}
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-gray-500 mt-1">
                            <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-gray-200 text-gray-800 font-medium flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {account.email}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleCopyText(account.email, `mail_${account.id}`)}
                              className="text-gray-400 hover:text-indigo-600 transition cursor-pointer p-0.5"
                              title="Salin Email"
                            >
                              {copiedId === `mail_${account.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>

                            {account.username && (
                              <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                User: <strong>{account.username}</strong>
                              </span>
                            )}

                            {account.password && (
                              <button
                                type="button"
                                onClick={() => handleCopyText(account.password || '', `pwd_${account.id}`)}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-mono bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-1"
                                title="Salin Kata Sandi"
                              >
                                <Key className="w-3 h-3" />
                                <span>{copiedId === `pwd_${account.id}` ? 'Tersalin!' : 'Salin Sandi'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Buttons: Edit, Toggle Active, Delete */}
                      <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-auto pt-2 sm:pt-0">
                        {/* Toggle Active Button */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(account)}
                            className={`p-1.5 rounded-xl border transition cursor-pointer ${
                              account.isActive === false
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                            }`}
                            title={account.isActive === false ? 'Aktifkan Akun' : 'Non-aktifkan Akun'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}

                        {/* Edit Button */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(account)}
                            className="p-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition cursor-pointer flex items-center space-x-1 text-xs font-bold"
                            title="Edit Data Akun"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="hidden md:inline">Edit</span>
                          </button>
                        )}

                        {/* Delete Button */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setAccountToDelete(account)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-transparent hover:border-rose-200"
                            title="Hapus Akun Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Guide Card */}
          <div className="p-5 bg-gradient-to-r from-indigo-50/70 to-blue-50/70 border border-indigo-100 rounded-3xl text-xs text-indigo-950 space-y-3">
            <h4 className="font-bold flex items-center gap-1.5 text-indigo-950">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Panduan Akses & Keamanan Akun
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-indigo-900/80 leading-relaxed">
              <div className="bg-white/70 p-3 rounded-2xl border border-indigo-100/80">
                <span className="font-bold text-indigo-950 block mb-1">Masuk dengan Akun Google (SSO)</span>
                Pemilik akun cukup mengklik tombol "Masuk dengan Akun Google" dan memilih email Google mereka yang sudah didaftarkan oleh admin.
              </div>
              <div className="bg-white/70 p-3 rounded-2xl border border-indigo-100/80">
                <span className="font-bold text-indigo-950 block mb-1">Masuk Manual (ID Pengguna & Sandi)</span>
                Pengguna juga dapat masuk manual dengan memasukkan Username / Email beserta Kata Sandi yang telah ditentukan oleh admin.
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL EDIT AKUN */}
      {/* ========================================================================= */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-scale-in max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Edit Data Akun</h3>
                  <p className="text-[11px] text-gray-500">Perbarui identitas, hak akses, atau kata sandi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5">
              
              {/* Nama Lengkap */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="block w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Alamat Email (Google SSO) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="block w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900 lowercase"
                  required
                />
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    ID Pengguna (Username)
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="block w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900 lowercase"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                      Kata Sandi Baru
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditPassword(generateRandomPassword())}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                    >
                      Acak
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Masukkan kata sandi baru"
                      className="block w-full pl-3 pr-8 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Jabatan */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Jabatan / Unit Tugas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editJabatan}
                  onChange={(e) => setEditJabatan(e.target.value)}
                  className="block w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900"
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Peran & Tingkat Wewenang
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRole('viewer')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      editRole === 'viewer'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Pengawas</span>
                      <Eye className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <span className="text-[10px] text-gray-500 block font-normal mt-0.5">Hanya Lihat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('admin')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      editRole === 'admin'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Administrator</span>
                      <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <span className="text-[10px] text-gray-500 block font-normal mt-0.5">Edit & Kelola Penuh</span>
                  </button>
                </div>
              </div>

              {/* Status Akun Aktif / Non-aktif */}
              <div className="pt-1">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-800">Akun Aktif (Dapat Masuk ke Sistem)</span>
                    <p className="text-[10px] text-gray-500">
                      Jika dinonaktifkan, akun ini tidak akan bisa login lewat Google ataupun kata sandi.
                    </p>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center space-x-2 disabled:opacity-60"
                >
                  {isEditSubmitting ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI HAPUS AKUN */}
      {/* ========================================================================= */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scale-in">
            <div className="flex items-center space-x-3 text-rose-600 pb-3 border-b border-rose-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Hapus Akun Pengguna</h3>
                <p className="text-[11px] text-gray-500">Konfirmasi pencabutan akses permanen</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs text-gray-700">
              <p>Apakah Anda yakin ingin menghapus akun berikut dari pangkalan data sistem?</p>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-1 text-[11px]">
                <div><strong>Nama:</strong> {accountToDelete.nama}</div>
                <div><strong>Email:</strong> {accountToDelete.email}</div>
                <div><strong>Jabatan:</strong> {accountToDelete.jabatan}</div>
                <div><strong>Hak Akses:</strong> {accountToDelete.role === 'admin' ? 'Administrator' : 'Pengawas (Hanya Lihat)'}</div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800">
                <strong>Peringatan:</strong> Setelah dihapus, pengguna ini tidak lagi dapat masuk ke sistem menggunakan akun Google maupun kata sandi manual.
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
