import React, { useState } from 'react';
import { Key, User, ShieldAlert, LogIn, Sun, Moon } from 'lucide-react';

interface SignInProps {
  onSignIn: (username: string, role: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export default function SignIn({ onSignIn, isDarkMode, onToggleTheme }: SignInProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username dan Password tidak boleh kosong');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        onSignIn(resData.username, resData.role);
      } else {
        setError(resData.message || 'Kombinasi Username dan Password salah.');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Gagal menghubungi server untuk autentikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-all duration-300 ${
      isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Top Floating Theme Toggle */}
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-600 rounded-sm flex items-center justify-center font-bold text-white text-sm italic shadow-sm">
            MJS
          </div>
          <span className="text-[11px] font-bold tracking-widest uppercase font-display opacity-80">
            PT MAJU JAYA SELAMANYA
          </span>
        </div>
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Toggle Light/Dark Mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className={`w-full max-w-md p-8 rounded-sm border shadow-xl transition-all ${
          isDarkMode 
            ? 'bg-slate-900 border-slate-800 shadow-emerald-950/20' 
            : 'bg-white border-slate-200 shadow-slate-200/55'
        }`}>
          {/* Brand Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-black uppercase tracking-tight font-display text-emerald-600 dark:text-emerald-400">
              SIGN IN OPERATOR
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 uppercase tracking-wider font-semibold">
              Sistem Penjualan &amp; Logistik Terpadu
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  id="login-username"
                  type="text"
                  required
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-sm border outline-hidden transition-all ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-white focus:ring-1 focus:ring-emerald-500'
                      : 'bg-slate-50 border-slate-300 text-slate-800 focus:ring-1 focus:ring-emerald-600'
                  }`}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Key className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-sm border outline-hidden transition-all ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-white focus:ring-1 focus:ring-emerald-500'
                      : 'bg-slate-50 border-slate-300 text-slate-800 focus:ring-1 focus:ring-emerald-600'
                  }`}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-2.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-sm border border-rose-200 dark:border-rose-900 font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="btn-submit-signin"
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-600 rounded-sm shadow-md transition-all cursor-pointer uppercase tracking-wider"
            >
              <LogIn className="w-4 h-4" />
              {isLoading ? 'Menghubungkan...' : 'Sign In ke Portal'}
            </button>
          </form>

          {/* Quick Demo Help Panel */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Akun Sistem Terintegrasi:</p>
            <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-2 rounded-xs border border-slate-200 dark:border-slate-900 font-mono text-[10px]">
              <div className="flex justify-between">
                <span>User: <strong className="text-emerald-600 dark:text-emerald-400">admin</strong> / pwd: <strong className="text-emerald-600 dark:text-emerald-400">admin</strong></span>
                <span className="text-emerald-500 font-bold">[Otoritas: ALL]</span>
              </div>
              <div className="flex justify-between">
                <span>User: <strong className="text-blue-500">viewer</strong> / pwd: <strong className="text-blue-500">viewer</strong></span>
                <span className="text-blue-500 font-bold">[Otoritas: DISPLAY ONLY]</span>
              </div>
            </div>
            <p className="mt-2 text-[9px] text-slate-400 italic">
              * Perubahan data disinkronkan secara instan untuk semua pengguna yang memegang link aplikasi ini!
            </p>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <footer className="text-center py-4 text-[10px] uppercase tracking-widest text-slate-400">
        © 2026 PT Maju Jaya Selamanya. All rights reserved.
      </footer>
    </div>
  );
}
