import React, { useState } from 'react';
import { UserProfile, OFFICIAL_ACCOUNTS, PengawasAccount } from '../types';
import { 
  ShieldCheck, 
  Eye, 
  UserCheck, 
  X, 
  Check, 
  Lock, 
  Unlock, 
  School, 
  Award, 
  Sparkles, 
  LogIn, 
  LogOut,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { googleSignIn, logout, auth } from '../utils/firebaseAuth';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectAccount: (user: UserProfile) => void;
}

export const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectAccount
}) => {
  const [activeTab, setActiveTab] = useState<'pilih' | 'matriks'>('pilih');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Load custom accounts from localStorage
  const registeredAccounts: PengawasAccount[] = (() => {
    try {
      const saved = localStorage.getItem('pramuka_pengawas_accounts');
      if (saved) {
        const parsed: PengawasAccount[] = JSON.parse(saved);
        return parsed.filter(p => p.id !== 'pengawas_dhenny' && p.id !== 'pengawas_sarah' && p.isActive !== false);
      }
    } catch (e) {}
    return [];
  })();

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setAuthNotice(null);
      const res = await googleSignIn();
      if (res && res.user) {
        const email = res.user.email?.toLowerCase() || '';
        // If email matches Pembina Pramuka (jihanminho8@gmail.com)
        if (email.includes('jihanminho8') || email.includes('jihan')) {
          const pembina = OFFICIAL_ACCOUNTS.find(a => a.role === 'admin') || OFFICIAL_ACCOUNTS[0];
          onSelectAccount({
            ...pembina,
            email: res.user.email || pembina.email
          });
          setAuthNotice(`Berhasil masuk sebagai Admin Pembina: ${res.user.displayName || pembina.nama}`);
        } else if (email.includes('dhenny') || email.includes('kurikulum')) {
          const wakasek = OFFICIAL_ACCOUNTS.find(a => a.id === 'acc_wakasek_kurikulum') || OFFICIAL_ACCOUNTS[1];
          onSelectAccount({
            ...wakasek,
            email: res.user.email || wakasek.email
          });
          setAuthNotice(`Berhasil masuk sebagai Wakasek Kurikulum: ${res.user.displayName || wakasek.nama}`);
        } else if (email.includes('sarah') || email.includes('ekskul')) {
          const ekskul = OFFICIAL_ACCOUNTS.find(a => a.id === 'acc_pembina_ekskul') || OFFICIAL_ACCOUNTS[2];
          onSelectAccount({
            ...ekskul,
            email: res.user.email || ekskul.email
          });
          setAuthNotice(`Berhasil masuk sebagai Pembina Ekskul: ${res.user.displayName || ekskul.nama}`);
        } else {
          // Default Google user as viewer
          onSelectAccount({
            id: `google_${res.user.uid}`,
            nama: res.user.displayName || 'Tamu Pengawas',
            email: res.user.email || '',
            jabatan: 'Pengawas Tamu (Hanya Lihat)',
            role: 'viewer',
            inisial: res.user.displayName?.slice(0, 2).toUpperCase() || 'TP',
            keteranganAkses: 'Akses Tamu Terverifikasi Google (Hanya Lihat)',
            avatarColor: 'bg-emerald-600 text-white'
          });
          setAuthNotice(`Masuk dengan akun Google: ${res.user.email} (Mode Hanya Lihat)`);
        }
      }
    } catch (err: any) {
      console.error(err);
      setAuthNotice(`Gagal login Google: ${err.message || 'Coba lagi'}`);
    } finally {
      setGoogleLoading(false);
    }
  };

  const permissionMatrix = [
    { feature: 'Lihat Semua Data (Dashboard, Murid, Laporan)', admin: true, wakasek: true, ekskul: true },
    { feature: 'Lihat Rekapitulasi & Unduh Rapor Nilai Pramuka', admin: true, wakasek: true, ekskul: true },
    { feature: 'Lihat Jurnal Kegiatan & Silabus Latihan', admin: true, wakasek: true, ekskul: true },
    { feature: 'Lihat Keuangan Kas & Inventaris Ambalan', admin: true, wakasek: true, ekskul: true },
    { feature: 'Tambah / Edit / Hapus Data Murid & Kelas', admin: true, wakasek: false, ekskul: false },
    { feature: 'Input Absensi Manual & Generate Sesi QR Code', admin: true, wakasek: false, ekskul: false },
    { feature: 'Uji & Verifikasi Butir SKU Bantara/Laksana', admin: true, wakasek: false, ekskul: false },
    { feature: 'Verifikasi TKK / SKK Digital Murid', admin: true, wakasek: false, ekskul: false },
    { feature: 'Kelola Transaksi Kas & Inventaris Barang', admin: true, wakasek: false, ekskul: false },
    { feature: 'Kenaikan Tingkat & Rollover Tahun Ajaran', admin: true, wakasek: false, ekskul: false },
    { feature: 'Reset Database & Restore Backup JSON', admin: true, wakasek: false, ekskul: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 animate-scale-in max-h-[92vh] overflow-y-auto">
        
        {/* Header Modal */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 leading-tight">
                Hak Akses & Manajemen Akun Pengguna
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                SMK Bakti Idhata • Gugus Depan Jakarta Selatan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Account Banner */}
        <div className="mt-4 p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow-xs ${currentUser.avatarColor}`}>
              {currentUser.inisial}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-gray-900">{currentUser.nama}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                  currentUser.role === 'admin'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {currentUser.role === 'admin' ? 'Admin • Edit Penuh' : 'Viewer • Hanya Lihat'}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 font-medium">{currentUser.jabatan}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{currentUser.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Akun Sedang Aktif</span>
            </span>
          </div>
        </div>

        {authNotice && (
          <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 font-semibold flex items-center space-x-2">
            <Info className="w-4 h-4 shrink-0 text-indigo-600" />
            <span>{authNotice}</span>
          </div>
        )}

        {/* Tabs: Pilih Akun vs Matriks Hak Akses */}
        <div className="flex items-center space-x-1.5 mt-5 border-b border-gray-100 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('pilih')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'pilih'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Pilih 3 Akun Resmi Sekolah
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matriks')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'matriks'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Matriks Perbedaan Hak Akses
          </button>
        </div>

        {/* TAB 1: PILIH AKUN */}
        {activeTab === 'pilih' && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-gray-500 font-medium">
              Pilih profil pengguna untuk menyesuaikan peran dan batasan hak akses fitur:
            </p>

            <div className="grid grid-cols-1 gap-3">
              {OFFICIAL_ACCOUNTS.map((acc) => {
                const isSelected = currentUser.id === acc.id;
                const isAdmin = acc.role === 'admin';

                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      onSelectAccount(acc);
                      onClose();
                    }}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-start sm:items-center space-x-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${acc.avatarColor}`}>
                        {acc.inisial}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xs font-black text-gray-900">{acc.nama}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                            isAdmin
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>
                            {isAdmin ? 'ADMIN • BISA EDIT SEMUA' : 'VIEWER • HANYA LIHAT'}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-gray-700 mt-0.5">{acc.jabatan}</p>
                        <p className="text-[11px] text-gray-500 mt-1 leading-snug">{acc.keteranganAkses}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end sm:justify-center shrink-0">
                      {isSelected ? (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                        >
                          Beralih ke Akun Ini
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Akun Terdaftar Lainnya */}
              {registeredAccounts.map((acc) => {
                const isSelected = currentUser.id === acc.id || currentUser.email.toLowerCase() === acc.email.toLowerCase();
                const isAccountAdmin = acc.role === 'admin';
                const initials = acc.nama
                  .split(' ')
                  .filter(w => !['bapak', 'ibu', 'kak', 's.', 'm.', 'pd', 'kom', 'dr.'].includes(w.toLowerCase().replace('.', '')))
                  .slice(0, 2)
                  .map(w => w[0])
                  .join('')
                  .toUpperCase() || (isAccountAdmin ? 'AD' : 'PA');

                const convertedProfile: UserProfile = {
                  id: acc.id,
                  username: acc.username || acc.email.split('@')[0],
                  nama: acc.nama,
                  email: acc.email,
                  jabatan: acc.jabatan,
                  role: isAccountAdmin ? 'admin' : 'viewer',
                  inisial: initials,
                  keteranganAkses: isAccountAdmin 
                    ? 'Akses Admin Penuh (Dapat mengedit semua fitur dan mengelola seluruh data)' 
                    : `Akses Pengawas (${acc.jabatan}) - Hanya Lihat`,
                  avatarColor: isAccountAdmin ? 'bg-indigo-600 text-white' : 'bg-amber-600 text-white'
                };

                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      onSelectAccount(convertedProfile);
                      onClose();
                    }}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-start sm:items-center space-x-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${convertedProfile.avatarColor}`}>
                        {initials}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xs font-black text-gray-900">{acc.nama}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                            isAccountAdmin
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>
                            {isAccountAdmin ? 'ADMIN • BISA EDIT SEMUA' : 'VIEWER • HANYA LIHAT'}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-gray-700 mt-0.5">{acc.jabatan}</p>
                        <p className="text-[11px] text-gray-500 mt-1 leading-snug">{acc.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end sm:justify-center shrink-0">
                      {isSelected ? (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                        >
                          Beralih ke Akun Ini
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Google Authentication integration */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-500">
                <span className="font-bold text-gray-700 block">Ingin login menggunakan Google SSO?</span>
                <span>Akun Google dengan email <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px] text-indigo-600 font-bold">jihanminho8@gmail.com</code> otomatis menjadi Admin.</span>
              </div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 shadow-2xs transition flex items-center justify-center space-x-2 cursor-pointer shrink-0 disabled:opacity-50"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-600" />
                <span>{googleLoading ? 'Memproses...' : 'Login via Akun Google'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: MATRIKS HAK AKSES */}
        {activeTab === 'matriks' && (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
              <strong>Prinsip Keamanan Data:</strong> Hanya akun <strong>Pembina Pramuka</strong> yang berhak melakukan perubahan dan pemeliharaan database. Akun <strong>Wakasek Kurikulum</strong> dan <strong>Pembina Ekstrakulikuler</strong> berfungsi sebagai pengawas resmi yang dapat memantau seluruh proses kepramukaan tanpa risiko ketidaksengajaan perubahan data.
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-700 font-black border-b border-gray-200 text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Fitur / Operasi Sistem</th>
                    <th className="px-3 py-3 text-center bg-indigo-50/50 text-indigo-900">
                      Pembina Pramuka<br/>
                      <span className="text-[10px] font-normal text-indigo-700">(Kak Jihan - Admin)</span>
                    </th>
                    <th className="px-3 py-3 text-center bg-amber-50/50 text-amber-900">
                      Wakasek Kurikulum<br/>
                      <span className="text-[10px] font-normal text-amber-700">(Pak Dhenny - Viewer)</span>
                    </th>
                    <th className="px-3 py-3 text-center bg-rose-50/50 text-rose-900">
                      Pembina Ekskul<br/>
                      <span className="text-[10px] font-normal text-rose-700">(Bu Sarah - Viewer)</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {permissionMatrix.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-2.5 font-semibold text-gray-800">{item.feature}</td>
                      <td className="px-3 py-2.5 text-center bg-indigo-50/20">
                        {item.admin ? (
                          <span className="inline-flex items-center text-emerald-600 font-bold text-[11px]">
                            <Check className="w-3.5 h-3.5 mr-0.5" /> Ya (Edit)
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center bg-amber-50/20">
                        {item.wakasek ? (
                          <span className="inline-flex items-center text-amber-700 font-bold text-[11px]">
                            <Eye className="w-3.5 h-3.5 mr-0.5" /> Lihat Saja
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-rose-500 font-bold text-[11px]">
                            <Lock className="w-3 h-3 mr-0.5" /> Terkunci
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center bg-rose-50/20">
                        {item.ekskul ? (
                          <span className="inline-flex items-center text-amber-700 font-bold text-[11px]">
                            <Eye className="w-3.5 h-3.5 mr-0.5" /> Lihat Saja
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-rose-500 font-bold text-[11px]">
                            <Lock className="w-3 h-3 mr-0.5" /> Terkunci
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
          >
            Tutup & Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};
