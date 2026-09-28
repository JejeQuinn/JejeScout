import React, { useState } from 'react';
import { ModulMateri, SilabusLatihan } from '../types';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Calendar, 
  Sparkles, 
  FileText, 
  Bookmark, 
  Compass, 
  Radio, 
  HeartHandshake, 
  Flame, 
  Clock, 
  CheckCircle2, 
  X, 
  Tag, 
  ChevronRight, 
  Lightbulb,
  ExternalLink,
  Layers,
  GraduationCap
} from 'lucide-react';

interface ELibraryMateriManagerProps {
  modulMateri: ModulMateri[];
  silabus: SilabusLatihan[];
  onAddModul?: (modul: Omit<ModulMateri, 'id'>) => void;
  onAddSilabus?: (silabus: Omit<SilabusLatihan, 'id'>) => void;
  onUpdateSilabus?: (silabus: SilabusLatihan) => void;
  readOnly?: boolean;
}

export const ELibraryMateriManager: React.FC<ELibraryMateriManagerProps> = ({
  modulMateri,
  silabus,
  onAddModul,
  onAddSilabus,
  onUpdateSilabus,
  readOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<'modul' | 'silabus'>('modul');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('all');
  const [selectedTingkat, setSelectedTingkat] = useState<string>('all');

  // Reader Modal State
  const [activeReadingModul, setActiveReadingModul] = useState<ModulMateri | null>(null);

  // New Modul Modal State
  const [isNewModulModalOpen, setIsNewModulModalOpen] = useState(false);
  const [newJudul, setNewJudul] = useState('');
  const [newKategori, setNewKategori] = useState<ModulMateri['kategori']>('Sandi & Komunikasi');
  const [newTingkat, setNewTingkat] = useState<'Semua' | 'Bantara' | 'Laksana'>('Semua');
  const [newRingkasan, setNewRingkasan] = useState('');
  const [newIsiMateri, setNewIsiMateri] = useState('');
  const [newTipsPraktek, setNewTipsPraktek] = useState('');
  const [newPenulis, setNewPenulis] = useState('Dewan Kerja Ambalan');

  // New Silabus Modal State
  const [isNewSilabusModalOpen, setIsNewSilabusModalOpen] = useState(false);
  const [silabusMingguKe, setSilabusMingguKe] = useState(1);
  const [silabusBulan, setSilabusBulan] = useState('Oktober 2026');
  const [silabusTopik, setSilabusTopik] = useState('');
  const [silabusTargetSku, setSilabusTargetSku] = useState('');
  const [silabusInstruktur, setSilabusInstruktur] = useState('Kak Jihan Fadhilah, S. Kom');
  const [silabusPerlengkapan, setSilabusPerlengkapan] = useState('Tongkat pramuka, tali marlon, buku saku');
  const [silabusDeskripsi, setSilabusDeskripsi] = useState('');

  const uniqueKategori = Array.from(new Set(modulMateri.map(m => m.kategori))).filter(Boolean);

  // Filtered Modul
  const filteredModul = modulMateri.filter(m => {
    const matchKat = selectedKategori === 'all' || m.kategori === selectedKategori;
    const matchTingkat = selectedTingkat === 'all' || m.tingkat === selectedTingkat || m.tingkat === 'Semua';
    const matchSearch = 
      m.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.ringkasan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.isi_materi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchKat && matchTingkat && matchSearch;
  });

  const handleCreateModul = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudul.trim()) {
      alert('Judul materi wajib diisi!');
      return;
    }

    if (onAddModul) {
      onAddModul({
        judul: newJudul.trim(),
        kategori: newKategori,
        tingkat: newTingkat,
        ringkasan: newRingkasan.trim() || 'Modul pembelajaran Pramuka Penegak',
        isi_materi: newIsiMateri.trim(),
        tips_praktek: newTipsPraktek.trim() || undefined,
        penulis: newPenulis.trim()
      });
    }

    setIsNewModulModalOpen(false);
    setNewJudul('');
    setNewRingkasan('');
    setNewIsiMateri('');
    setNewTipsPraktek('');
  };

  const handleCreateSilabus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!silabusTopik.trim()) {
      alert('Topik materi wajib diisi!');
      return;
    }

    if (onAddSilabus) {
      onAddSilabus({
        minggu_ke: silabusMingguKe,
        bulan: silabusBulan.trim(),
        topik: silabusTopik.trim(),
        target_sku_skk: silabusTargetSku.trim() || 'Syarat Kecakapan Umum',
        instruktur: silabusInstruktur.trim(),
        perlengkapan_wajib: silabusPerlengkapan.split(',').map(s => s.trim()).filter(Boolean),
        deskripsi_kegiatan: silabusDeskripsi.trim() || 'Latihan teori dan praktek lapangan',
        is_selesai: false
      });
    }

    setIsNewSilabusModalOpen(false);
    setSilabusTopik('');
    setSilabusTargetSku('');
    setSilabusDeskripsi('');
  };

  const handleToggleSilabusStatus = (item: SilabusLatihan) => {
    if (onUpdateSilabus) {
      onUpdateSilabus({
        ...item,
        is_selesai: !item.is_selesai
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 bg-sky-50 text-sky-700 rounded-2xl flex items-center justify-center border border-sky-200 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                  E-Library Pramuka
                </span>
                <span className="text-xs text-gray-400 font-bold">• Materi Digital & Silabus</span>
              </div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight mt-0.5">
                Pusat Materi & Silabus Latihan Mingguan
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Modul sandi, simpul pionering, navigasi darat, PPGD, serta rencana kurikulum mingguan ambalan.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {!readOnly ? (
              <>
                {activeTab === 'modul' && onAddModul && (
                  <button
                    type="button"
                    onClick={() => setIsNewModulModalOpen(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Modul Materi</span>
                  </button>
                )}

                {activeTab === 'silabus' && onAddSilabus && (
                  <button
                    type="button"
                    onClick={() => setIsNewSilabusModalOpen(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Jadwal Silabus</span>
                  </button>
                )}
              </>
            ) : (
              <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl">
                Mode Pengawas: Hanya Lihat
              </span>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setActiveTab('modul')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'modul'
                ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Modul Pembelajaran Digital ({modulMateri.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('silabus')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'silabus'
                ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Silabus & Rencana Latihan Mingguan ({silabus.length})
          </button>
        </div>
      </div>

      {/* 1. MODUL DIGITAL TAB */}
      {activeTab === 'modul' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari sandi, simpul, PPGD, kompas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedKategori}
                onChange={(e) => setSelectedKategori(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="all">Semua Kategori Modul</option>
                {uniqueKategori.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>

              <select
                value={selectedTingkat}
                onChange={(e) => setSelectedTingkat(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="all">Semua Tingkat (Bantara & Laksana)</option>
                <option value="Bantara">Khusus Bantara</option>
                <option value="Laksana">Khusus Laksana</option>
              </select>
            </div>
          </div>

          {/* Modul Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModul.map((modul) => (
              <div 
                key={modul.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-50 text-sky-800 border border-sky-200">
                      {modul.kategori}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {modul.tingkat === 'Semua' ? 'Umum / Penegak' : `Penegak ${modul.tingkat}`}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-gray-900 mt-2.5 leading-snug">
                    {modul.judul}
                  </h3>

                  <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                    {modul.ringkasan}
                  </p>

                  {modul.tips_praktek && (
                    <div className="mt-3 p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 flex items-start space-x-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2"><strong>Tips:</strong> {modul.tips_praktek}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-semibold truncate max-w-[120px]">
                    Oleh: {modul.penulis}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveReadingModul(modul)}
                    className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Baca Lengkap</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. SILABUS LATIHAN MINGGUAN TAB */}
      {activeTab === 'silabus' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-gray-800">
                  Kalender Silabus & Rencana Latihan Mingguan
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Jadwal terencana memudahkan Dewan Kerja mempersiapkan perlengkapan sebelum latihan.
                </p>
              </div>
              <span className="text-xs font-bold text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                {silabus.filter(s => s.is_selesai).length} Selesai dari {silabus.length} Sesi
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {silabus.map((item) => (
                <div 
                  key={item.id}
                  className={`p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    item.is_selesai ? 'bg-gray-50/60 opacity-80' : 'bg-white hover:bg-sky-50/20'
                  }`}
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-800">
                        Minggu ke-{item.minggu_ke} ({item.bulan})
                      </span>
                      <span className="text-xs text-gray-400 font-bold">•</span>
                      <span className="text-xs font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Target: {item.target_sku_skk}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-gray-900">
                      {item.topik}
                    </h4>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      {item.deskripsi_kegiatan}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-gray-500">
                      <span><strong>Instruktur:</strong> {item.instruktur}</span>
                      <span>•</span>
                      <span>
                        <strong>Perlengkapan Wajib:</strong> {item.perlengkapan_wajib.join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleSilabusStatus(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                        item.is_selesai
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{item.is_selesai ? 'Selesai Dilaksanakan' : 'Tandai Selesai'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* READER MODAL MODUL */}
      {activeReadingModul && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-100 max-h-[85vh] flex flex-col justify-between animate-scale-in">
            <div className="pb-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-50 text-sky-800 border border-sky-200">
                    {activeReadingModul.kategori}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">
                    Tingkat: {activeReadingModul.tingkat}
                  </span>
                </div>
                <h3 className="font-black text-base text-gray-900 mt-1">
                  {activeReadingModul.judul}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveReadingModul(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="my-4 overflow-y-auto pr-2 space-y-4 text-xs leading-relaxed text-gray-700">
              <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 text-sky-950 font-semibold">
                {activeReadingModul.ringkasan}
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 font-mono text-[11px] whitespace-pre-line text-gray-800">
                {activeReadingModul.isi_materi}
              </div>

              {activeReadingModul.tips_praktek && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start space-x-2 text-amber-900">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black block">Tips Pembina / Penguji Lapangan:</span>
                    <span className="text-[11px] mt-0.5 block leading-normal">{activeReadingModul.tips_praktek}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400 font-semibold">
                Penulis: {activeReadingModul.penulis}
              </span>
              <button
                type="button"
                onClick={() => setActiveReadingModul(null)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Tutup Modul
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW MODUL MODAL */}
      {isNewModulModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-sky-600" />
                <h3 className="font-black text-sm text-gray-800">Tambah Modul Materi Digital</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModulModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateModul} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-black text-gray-700 mb-1">Judul Materi</label>
                <input
                  type="text"
                  placeholder="misal: Sandi Morse & Semaphore Lengkap"
                  value={newJudul}
                  onChange={(e) => setNewJudul(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-gray-700 mb-1">Kategori</label>
                  <select
                    value={newKategori}
                    onChange={(e) => setNewKategori(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Sandi & Komunikasi">Sandi & Komunikasi</option>
                    <option value="Tali Temali & Pionering">Tali Temali & Pionering</option>
                    <option value="Navigasi & Kompas">Navigasi & Kompas</option>
                    <option value="PPGD & P3K">PPGD & P3K</option>
                    <option value="Sejarah & Organisasi">Sejarah & Organisasi</option>
                    <option value="Survival & Alam Bebas">Survival & Alam Bebas</option>
                  </select>
                </div>
                <div>
                  <label className="block font-black text-gray-700 mb-1">Tingkat Penegak</label>
                  <select
                    value={newTingkat}
                    onChange={(e) => setNewTingkat(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Semua">Semua Tingkat</option>
                    <option value="Bantara">Penegak Bantara</option>
                    <option value="Laksana">Penegak Laksana</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Ringkasan Singkat</label>
                <input
                  type="text"
                  placeholder="Penjelasan 1 kalimat tentang apa yang dipelajari..."
                  value={newRingkasan}
                  onChange={(e) => setNewRingkasan(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Isi Modul / Rumus / Langkah-langkah</label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan rumus sandi, langkah ikatan, atau instruksi lengkap..."
                  value={newIsiMateri}
                  onChange={(e) => setNewIsiMateri(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Tips Praktek Cepat (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh trik mengingat rumus atau cara simpul..."
                  value={newTipsPraktek}
                  onChange={(e) => setNewTipsPraktek(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewModulModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center space-x-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Simpan Modul</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW SILABUS MODAL */}
      {isNewSilabusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-sky-600" />
                <h3 className="font-black text-sm text-gray-800">Tambah Jadwal Silabus Mingguan</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewSilabusModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSilabus} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-gray-700 mb-1">Minggu Ke-</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={silabusMingguKe}
                    onChange={(e) => setSilabusMingguKe(parseInt(e.target.value) || 1)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-black text-gray-700 mb-1">Bulan & Tahun</label>
                  <input
                    type="text"
                    placeholder="misal: Oktober 2026"
                    value={silabusBulan}
                    onChange={(e) => setSilabusBulan(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Topik Latihan</label>
                <input
                  type="text"
                  placeholder="misal: Pendalaman Sandi Kotak & Morse di Lapangan"
                  value={silabusTopik}
                  onChange={(e) => setSilabusTopik(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800"
                  required
                />
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Target Poin SKU / SKK</label>
                <input
                  type="text"
                  placeholder="misal: SKU Bantara Poin 19 (Sandi & Semaphore)"
                  value={silabusTargetSku}
                  onChange={(e) => setSilabusTargetSku(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800"
                />
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Instruktur Penanggung Jawab</label>
                <input
                  type="text"
                  value={silabusInstruktur}
                  onChange={(e) => setSilabusInstruktur(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800"
                  required
                />
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Perlengkapan Wajib (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  placeholder="Tongkat pramuka, peluit morse, buku saku"
                  value={silabusPerlengkapan}
                  onChange={(e) => setSilabusPerlengkapan(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800"
                />
              </div>

              <div>
                <label className="block font-black text-gray-700 mb-1">Deskripsi & Skenario Kegiatan</label>
                <textarea
                  rows={2}
                  placeholder="Alur latihan 15:00 - 17:30 WIB..."
                  value={silabusDeskripsi}
                  onChange={(e) => setSilabusDeskripsi(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewSilabusModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center space-x-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Jadwalkan Silabus</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
