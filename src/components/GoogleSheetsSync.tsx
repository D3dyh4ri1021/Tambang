import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  googleSignOut,
  initAuth,
  createSpreadsheet,
  getSpreadsheetInfo,
  syncDataToSpreadsheet,
} from '../utils/googleSheets';
import { Penjualan, AlatBerat, Barang, Kendaraan, Customer } from '../types';
import {
  CloudLightning,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Lock,
  Database,
  Link,
  LogOut,
  FileSpreadsheet,
} from 'lucide-react';

interface GoogleSheetsSyncProps {
  isDarkMode: boolean;
  salesList: Penjualan[];
  alatBeratList: AlatBerat[];
  barangList: Barang[];
  kendaraanList: Kendaraan[];
  customerList: Customer[];
}

export default function GoogleSheetsSync({
  isDarkMode,
  salesList,
  alatBeratList,
  barangList,
  kendaraanList,
  customerList,
}: GoogleSheetsSyncProps) {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Spreadsheet state
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('mjs_sheets_spreadsheet_id') || '';
  });
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('');
  const [lastSynced, setLastSynced] = useState<string>(() => {
    return localStorage.getItem('mjs_sheets_last_synced') || 'Belum pernah disinkronkan';
  });

  const [manualSheetId, setManualSheetId] = useState<string>('');

  // Hydrate auth status on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, accessToken) => {
        setGoogleUser(user);
        setToken(accessToken);
        setLoading(false);
      },
      () => {
        setGoogleUser(null);
        setToken(null);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch spreadsheet info if ID exists
  useEffect(() => {
    if (token && spreadsheetId) {
      getSpreadsheetInfo(spreadsheetId)
        .then((info) => {
          setSpreadsheetTitle(info.title);
          setSpreadsheetUrl(info.url);
          setError('');
        })
        .catch((err) => {
          console.error('Error fetching spreadsheet details:', err);
          setError('Gagal mengakses lembar kerja Google Sheets yang ditautkan. Pastikan ID valid.');
        });
    }
  }, [token, spreadsheetId]);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setToken(result.accessToken);
        setSuccessMsg('Berhasil masuk menggunakan Akun Google!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setError('Masuk Google dibatalkan atau gagal memberikan hak izin.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Logout
  const handleGoogleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin memutus koneksi Akun Google Anda?')) {
      await googleSignOut();
      setGoogleUser(null);
      setToken(null);
      setError('');
    }
  };

  // Create a brand new Google Sheet
  const handleCreateNewSheet = async () => {
    setError('');
    setSyncing(true);
    try {
      const title = `MJS_Database_Sync_${new Date().getFullYear()}_${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const newId = await createSpreadsheet(title);
      setSpreadsheetId(newId);
      localStorage.setItem('mjs_sheets_spreadsheet_id', newId);
      
      const info = await getSpreadsheetInfo(newId);
      setSpreadsheetTitle(info.title);
      setSpreadsheetUrl(info.url);
      setSuccessMsg('Berhasil membuat & menautkan Google Spreadsheet baru!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setError('Gagal membuat Spreadsheet baru di Google Drive Anda.');
    } finally {
      setSyncing(false);
    }
  };

  // Link an existing Spreadsheet by ID manually
  const handleLinkExistingSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSheetId.trim()) return;

    // Extracted ID if they entered the full URL
    let extractedId = manualSheetId.trim();
    if (extractedId.includes('/d/')) {
      const parts = extractedId.split('/d/');
      if (parts[1]) {
        extractedId = parts[1].split('/')[0];
      }
    }

    setError('');
    setSyncing(true);
    try {
      const info = await getSpreadsheetInfo(extractedId);
      setSpreadsheetId(extractedId);
      localStorage.setItem('mjs_sheets_spreadsheet_id', extractedId);
      setSpreadsheetTitle(info.title);
      setSpreadsheetUrl(info.url);
      setManualSheetId('');
      setSuccessMsg('Berhasil menautkan ke Spreadsheet eksternal!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setError('Gagal menautkan. Pastikan ID Spreadsheet benar dan akun Google Anda memiliki hak akses edit.');
    } finally {
      setSyncing(false);
    }
  };

  // Perform full database sync to Google Sheet
  const handleSyncDatabase = async () => {
    if (!spreadsheetId) {
      setError('Pilih atau buat Google Spreadsheet terlebih dahulu.');
      return;
    }

    setError('');
    setSyncing(true);
    try {
      await syncDataToSpreadsheet(spreadsheetId, {
        sales: salesList,
        alat: alatBeratList,
        barang: barangList,
        kendaraan: kendaraanList,
        customer: customerList,
      });

      const now = new Date();
      const timestamp = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setLastSynced(timestamp);
      localStorage.setItem('mjs_sheets_last_synced', timestamp);

      setSuccessMsg('Sinkronisasi data ke Google Sheets berhasil diselesaikan!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      console.error(err);
      setError(`Gagal melakukan pengunggahan data: ${err.message || err}`);
    } finally {
      setSyncing(false);
    }
  };

  // Unlink active spreadsheet
  const handleUnlinkSheet = () => {
    if (confirm('Apakah Anda yakin ingin melepas tautan spreadsheet aktif? Tautan akan dihapus, namun file asli di Google Drive tidak akan dihapus.')) {
      setSpreadsheetId('');
      setSpreadsheetTitle('');
      setSpreadsheetUrl('');
      localStorage.removeItem('mjs_sheets_spreadsheet_id');
      setError('');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="text-xs font-semibold mt-3 text-slate-500 uppercase tracking-widest">
          Memeriksa Otorisasi Google...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className={`p-6 rounded-sm border ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-sm text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-slate-100 font-display">
                Integrasi &amp; Sinkronisasi Google Sheets
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Fitur ini menghubungkan sistem internal logistik MJS secara langsung dengan Google Sheets. Seluruh tabel transaksi penjualan serta data master akan diunggah secara instan ke dalam 5 worksheet terpisah.
              </p>
            </div>
          </div>
          
          {/* Quick Stats of local data to sync */}
          <div className="flex gap-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-xs border border-slate-200 dark:border-slate-800 font-mono text-[10px]">
            <div className="text-center">
              <div className="font-bold text-emerald-600 dark:text-emerald-400">{salesList.length}</div>
              <div className="text-slate-500">Sales</div>
            </div>
            <div className="border-r border-slate-200 dark:border-slate-800"></div>
            <div className="text-center">
              <div className="font-bold text-emerald-600 dark:text-emerald-400">{alatBeratList.length}</div>
              <div className="text-slate-500">Alat</div>
            </div>
            <div className="border-r border-slate-200 dark:border-slate-800"></div>
            <div className="text-center">
              <div className="font-bold text-emerald-600 dark:text-emerald-400">{barangList.length}</div>
              <div className="text-slate-500">Barang</div>
            </div>
            <div className="border-r border-slate-200 dark:border-slate-800"></div>
            <div className="text-center">
              <div className="font-bold text-emerald-600 dark:text-emerald-400">{customerList.length}</div>
              <div className="text-slate-500">Cust</div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="mt-4 flex items-center gap-2.5 p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-sm border border-rose-200 dark:border-rose-900 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 flex items-center gap-2.5 p-3 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-sm border border-emerald-200 dark:border-emerald-900 font-medium">
            <CheckCircle className="w-4 h-4 shrink-0 animate-bounce" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {!googleUser ? (
        /* STEP 1: Connect Google Account */
        <div className={`p-8 rounded-sm border text-center space-y-6 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
        }`}>
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 rounded-full flex items-center justify-center mx-auto text-blue-500 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-display">
              Otorisasi Google Sheets Diperlukan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
              Untuk mengekspor atau menyinkronkan data langsung ke Google Sheets Anda, hubungkan portal logistik ini ke akun Google Anda secara aman.
            </p>

            <button
              onClick={handleGoogleLogin}
              className="mx-auto flex items-center justify-center gap-3 px-5 py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-bold rounded-sm shadow-md transition-all cursor-pointer select-none"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>Hubungkan Akun Google</span>
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2: Main Sync Controls */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Active Google Account Info */}
          <div className={`p-5 rounded-sm border space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
          }`}>
            <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-400 font-display">
              Akun Google Terhubung
            </h2>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xs border border-slate-200 dark:border-slate-800">
              {googleUser.photoURL ? (
                <img src={googleUser.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-emerald-500" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                  {googleUser.displayName?.charAt(0) || 'G'}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold truncate text-slate-800 dark:text-slate-250">
                  {googleUser.displayName || 'Google User'}
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                  {googleUser.email}
                </div>
              </div>
            </div>

            <button
              onClick={handleGoogleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 bg-rose-50/20 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 text-xs font-semibold rounded-xs transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Putuskan Akun Google</span>
            </button>
          </div>

          {/* Spreadsheet Target Linker */}
          <div className={`col-span-1 md:col-span-2 p-5 rounded-sm border space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
          }`}>
            <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-400 font-display">
              Tautan Google Spreadsheet
            </h2>

            {spreadsheetId ? (
              /* Spreadsheet is Connected */
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/10 rounded-xs border border-emerald-200/50 dark:border-emerald-900/40">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="inline-block px-1.5 py-0.5 bg-emerald-600 text-white text-[8px] font-bold uppercase rounded-xs tracking-wider">
                        Terkoneksi
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-display mt-1">
                        {spreadsheetTitle || 'Memuat Detail Spreadsheet...'}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-500 break-all select-all">
                        ID: {spreadsheetId}
                      </p>
                    </div>
                    {spreadsheetUrl && (
                      <a
                        href={spreadsheetUrl}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        rel="noreferrer"
                        className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-sm text-slate-600 dark:text-slate-300 hover:text-emerald-500 shadow-sm transition-all shrink-0"
                        title="Buka Spreadsheet di Tab Baru"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between text-[10px] text-slate-500">
                    <span>Terakhir sinkronisasi:</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {lastSynced}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={handleSyncDatabase}
                    disabled={syncing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-600 text-white text-xs font-bold rounded-xs shadow-md transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? 'Menyinkronkan...' : 'SINKRONISASIKAN SEKARANG'}</span>
                  </button>
                  <button
                    onClick={handleUnlinkSheet}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold rounded-xs transition-all cursor-pointer uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >
                    Putuskan Tautan
                  </button>
                </div>
              </div>
            ) : (
              /* Spreadsheet is Not Connected */
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Create New Option */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                        Buat Baru di Google Drive
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                        Sistem akan membuat file spreadsheet baru bernama "MJS_Database_Sync" dan mengonfigurasi sheet di dalamnya secara otomatis.
                      </p>
                    </div>
                    <button
                      onClick={handleCreateNewSheet}
                      disabled={syncing}
                      className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xs transition-all cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Buat Spreadsheet Baru</span>
                    </button>
                  </div>

                  {/* Connect Existing Option */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xs border border-slate-200 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                      Tautkan Spreadsheet ID
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                      Masukkan ID Google Spreadsheet atau salin tautan URL spreadsheet yang sudah ada untuk disinkronkan.
                    </p>

                    <form onSubmit={handleLinkExistingSheet} className="mt-3 space-y-2">
                      <input
                        type="text"
                        placeholder="Contoh: 1aBcDeFgHiJkLmNoP..."
                        value={manualSheetId}
                        onChange={(e) => setManualSheetId(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
                        required
                      />
                      <button
                        type="submit"
                        disabled={syncing}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-[#1E293B] hover:bg-slate-800 text-white text-xs font-bold rounded-xs transition-all cursor-pointer"
                      >
                        <Link className="w-3.5 h-3.5" />
                        <span>Tautkan Sekarang</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Structured Guidelines Section */}
      <div className={`p-5 rounded-sm border ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
      }`}>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-850 dark:text-slate-200 font-display flex items-center gap-2">
          <CloudLightning className="w-4 h-4 text-amber-500" />
          <span>Panduan Penggunaan Google Sheets Integration</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-[11px] text-slate-500 leading-relaxed font-sans">
          <div className="space-y-2">
            <p>
              <strong className="text-slate-700 dark:text-slate-300">1. Pembagian Lembar Kerja (Worksheets):</strong>
              <br />
              Data akan diunggah ke dalam tab worksheet terpisah: <strong>Transaksi Penjualan</strong>, <strong>Master Alat Berat</strong>, <strong>Master Barang</strong>, <strong>Master Kendaraan</strong>, dan <strong>Master Customer</strong>. Jika tabs tersebut belum ada, sistem akan membuatnya secara dinamis.
            </p>
            <p>
              <strong className="text-slate-700 dark:text-slate-300">2. Menjaga Struktur Header:</strong>
              <br />
              Sistem akan menghapus data lama pada baris di bawah header dan mengunggah database saat ini. Jangan menghapus kolom header agar visualisasi data pihak ketiga (misalnya Looker Studio atau PowerBI) tidak terganggu.
            </p>
          </div>
          <div className="space-y-2">
            <p>
              <strong className="text-slate-700 dark:text-slate-300">3. Keamanan Otorisasi:</strong>
              <br />
              Token otentikasi Google hanya disimpan di dalam memori aktif aplikasi (in-memory caching) untuk menjamin perlindungan privasi. Ketika Anda menutup tab browser atau keluar dari sistem, otentikasi Google akan otomatis dinonaktifkan demi privasi.
            </p>
            <p>
              <strong className="text-slate-700 dark:text-slate-300">4. Alur Integrasi Real-Time:</strong>
              <br />
              Setelah menautkan spreadsheet, Anda cukup menekan tombol "Sinkronisasikan Sekarang" kapan saja untuk memperbarui data spreadsheet di cloud dengan perubahan lokal Anda terbaru.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
