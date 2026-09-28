import React, { useState } from 'react';
import { phpCodeTemplates } from '../data/phpCodeTemplates';
import { Clipboard, Check, Download, Code2, Database, ShieldAlert, Key } from 'lucide-react';

export const CodeViewer: React.FC = () => {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeFile = phpCodeTemplates[activeTabIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([activeFile.content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = activeFile.filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6" id="source_code_explorer_module">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Kode Sumber PHP PDO & MySQL (Pristine Stack)</h2>
        <p className="text-sm text-gray-400 mt-1">
          Gunakan panel ini untuk mengeksplorasi, menyalin, dan mengunduh seluruh berkas kode backend Native PHP + PDO dan skema basis data MySQL relasional yang telah didesain khusus untuk SMK Bakti Idhata.
        </p>
      </div>

      {/* Security Features Banner */}
      <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-start space-x-3 text-xs">
          <div className="p-2 bg-emerald-500 text-white rounded-lg flex-shrink-0">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-emerald-950 mb-0.5">Keamanan SQL Injection</h4>
            <p className="text-emerald-800 leading-relaxed font-medium">Menggunakan <b>PDO Prepared Statements</b> secara menyeluruh. Input tidak disatukan langsung ke dalam string query, mengeliminasi risiko peretasan injeksi SQL.</p>
          </div>
        </div>

        <div className="flex items-start space-x-3 text-xs">
          <div className="p-2 bg-emerald-500 text-white rounded-lg flex-shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-emerald-950 mb-0.5">Relasi Tangguh & Cascade</h4>
            <p className="text-emerald-800 leading-relaxed font-medium">Skema DDL MySQL dilengkapi dengan constraint <b>Foreign Key ON DELETE CASCADE</b>. Jika murid dihapus, relasi absensi dan SKU ikut terhapus aman tanpa merusak integritas data.</p>
          </div>
        </div>

        <div className="flex items-start space-x-3 text-xs">
          <div className="p-2 bg-emerald-500 text-white rounded-lg flex-shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-emerald-950 mb-0.5">Validasi Input Kuat</h4>
            <p className="text-emerald-800 leading-relaxed font-medium">Setiap file CRUD dilengkapi validasi backend untuk menjamin format NIS Murid Anggota serta pengondisian input nilai agar tidak melebihi skala normal (0 - 100).</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Tab Switcher list */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 h-fit space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Berkas Pendukung</h3>
          
          <div className="space-y-1">
            {phpCodeTemplates.map((file, idx) => (
              <button
                key={file.filename}
                onClick={() => {
                  setActiveTabIdx(idx);
                  setCopied(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeTabIdx === idx
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-50/50 hover:bg-gray-100 text-gray-600'
                }`}
              >
                <span className="flex items-center">
                  {file.filename.endsWith('.sql') ? <Database className="w-3.5 h-3.5 mr-2" /> : <Code2 className="w-3.5 h-3.5 mr-2" />}
                  {file.filename}
                </span>
                <span className="text-[9px] opacity-75 font-mono uppercase">
                  {file.language}
                </span>
              </button>
            ))}
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-[11px] text-gray-500 font-medium leading-relaxed">
            <p className="font-bold text-gray-700 mb-1">Cara Penggunaan:</p>
            1. Salin/Unduh skema SQL lalu jalankan di phpMyAdmin untuk membuat basis data.<br />
            2. Tempatkan koneksi.php dan hitung_nilai.php dalam folder server Anda.<br />
            3. Jalankan index.php, siswa.php, materi.php, dan sku.php menggunakan server Apache/XAMPP.
          </div>
        </div>

        {/* Right: Code area and controls */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col justify-between">
          
          {/* File description and buttons */}
          <div className="bg-gray-50/80 p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black text-gray-800">{activeFile.filename}</span>
                <span className="bg-indigo-100 text-indigo-800 font-extrabold text-[9px] px-1.5 py-0.5 rounded uppercase">
                  {activeFile.language}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">{activeFile.description}</p>
            </div>

            <div className="flex space-x-2 self-stretch sm:self-auto justify-end">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-extrabold text-gray-700 transition cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Clipboard className="w-4 h-4" />}
                <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-extrabold transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Berkas</span>
              </button>
            </div>
          </div>

          {/* Actual Code syntax visualization container */}
          <div className="flex-1 bg-indigo-950 p-5 overflow-auto max-h-[480px]">
            <pre className="text-left font-mono text-[11px] text-indigo-100 leading-relaxed selection:bg-indigo-500/30 whitespace-pre">
              <code>{activeFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
