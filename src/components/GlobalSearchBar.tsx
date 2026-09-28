import React, { useState, useRef, useEffect } from 'react';
import { Siswa } from '../types';
import { Search, User, X, ChevronRight, GraduationCap, Clock, Trash2, History } from 'lucide-react';

interface GlobalSearchBarProps {
  siswa: Siswa[];
  onSelectStudent: (studentId: string) => void;
}

const RECENT_SEARCHES_KEY = 'sipramuka_recent_searches';

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  siswa,
  onSelectStudent,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter student results by name, NIS, or class
  const filteredStudents = query.trim()
    ? siswa.filter(
        (s) =>
          s.nama_lengkap.toLowerCase().includes(query.toLowerCase()) ||
          s.nis.includes(query.trim()) ||
          s.kelas.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6) // Top 6 matching results
    : [];

  // Get recent student objects matching existing students list
  const recentStudents = recentIds
    .map((id) => siswa.find((s) => s.id === id))
    .filter((s): s is Siswa => s !== undefined);

  const addRecentSearch = (studentId: string) => {
    const updated = [studentId, ...recentIds.filter((id) => id !== studentId)].slice(0, 5);
    setRecentIds(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore write errors
    }
  };

  const removeRecentSearch = (studentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentIds.filter((id) => id !== studentId);
    setRecentIds(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore write errors
    }
  };

  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentIds([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore write errors
    }
  };

  const handleSelect = (studentId: string) => {
    addRecentSearch(studentId);
    onSelectStudent(studentId);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentList = query.trim() ? filteredStudents : recentStudents;
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && currentList.length > 0) setIsOpen(true);
      setSelectedIndex((prev) => (prev < currentList.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : currentList.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < currentList.length) {
        e.preventDefault();
        handleSelect(currentList[selectedIndex].id);
      } else if (currentList.length > 0) {
        e.preventDefault();
        handleSelect(currentList[0].id);
      }
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto sm:mx-0" ref={containerRef}>
      <div className="relative flex items-center">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Cari anggota (Nama / NIS / Kelas)..."
          className="w-full bg-gray-50/80 hover:bg-gray-100/80 focus:bg-white border border-gray-200/80 focus:border-indigo-500 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition shadow-2xs"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(true);
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Results & Recent Searches Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden z-50 animate-fade-in divide-y divide-gray-50">
          
          {/* Mode 1: Query is empty - Show Recent Searches */}
          {query.trim() === '' ? (
            recentStudents.length > 0 ? (
              <div>
                <div className="px-3.5 py-2 bg-gray-50/90 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <span className="flex items-center text-indigo-700">
                    <History className="w-3 h-3 mr-1 text-indigo-500" />
                    Pencarian Terakhir ({recentStudents.length})
                  </span>
                  <button
                    type="button"
                    onClick={clearAllRecent}
                    className="text-rose-500 hover:text-rose-700 font-bold transition flex items-center space-x-0.5 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus Riwayat</span>
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {recentStudents.map((s, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleSelect(s.id)}
                        className={`w-full p-2.5 flex items-center justify-between text-left transition cursor-pointer ${
                          isSelected ? 'bg-indigo-50/80' : 'hover:bg-gray-50/80'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-black text-xs shrink-0 border border-gray-200">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-gray-800 truncate">
                                {s.nama_lengkap}
                              </span>
                              <span className="text-[10px] font-mono text-gray-400">
                                #{s.nis}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium block">
                              Kelas {s.kelas} &bull; {s.status_pelantikan || 'Calon Penegak'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={(e) => removeRecentSearch(s.id, e)}
                            className="p-1 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus dari riwayat"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null
          ) : (
            /* Mode 2: Query entered - Show Search Results */
            <div>
              <div className="px-3.5 py-2 bg-gray-50/80 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
                <span>Hasil Pencarian Anggota ({filteredStudents.length})</span>
                <span className="text-indigo-600 font-bold">Tekan Enter untuk pilih</span>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400 font-medium">
                  Tidak ditemukan anggota dengan kata kunci "<span className="text-gray-700 font-bold">{query}</span>"
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {filteredStudents.map((s, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelect(s.id)}
                        className={`w-full p-3 flex items-center justify-between text-left transition cursor-pointer ${
                          isSelected ? 'bg-indigo-50/80' : 'hover:bg-gray-50/80'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0 border border-indigo-200">
                            {s.nama_lengkap.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-extrabold text-gray-800 truncate">
                                {s.nama_lengkap}
                              </span>
                              <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold shrink-0">
                                NIS: {s.nis}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-gray-500 font-medium">
                              <span className="flex items-center">
                                <GraduationCap className="w-3 h-3 mr-0.5 text-gray-400" />
                                Kelas {s.kelas}
                              </span>
                              <span>&bull;</span>
                              <span className={`font-bold ${
                                s.status_pelantikan === 'Penegak Laksana' ? 'text-purple-700' :
                                s.status_pelantikan === 'Penegak Bantara' ? 'text-indigo-700' :
                                'text-amber-700'
                              }`}>
                                {s.status_pelantikan || 'Calon Penegak'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0 ml-2">
                          <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full ${
                            s.status_aktif ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {s.status_aktif ? 'Aktif' : 'Nonaktif'}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

