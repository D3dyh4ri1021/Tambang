import React, { useState, useEffect } from 'react';
import { Users, Shield, Trash2, Edit, Lock, RefreshCw, Key, ShieldCheck, Check, CheckSquare, Square } from 'lucide-react';
import { canManageUsers, PERMISSION_OPTIONS } from '../utils/permission';

interface UserItem {
  username: string;
  role: string;
}

interface UserManagementProps {
  currentUser: string;
  currentRole: string;
  isDarkMode: boolean;
}

export default function UserManagement({ currentUser, currentRole, isDarkMode }: UserManagementProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form States
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['Display Only']);
  const [isEditing, setIsEditing] = useState(false);

  const canEditUsers = canManageUsers(currentRole);

  // Helper to format permissions array to single role string
  const getFormattedRoleString = (): string => {
    if (selectedPermissions.includes('All')) return 'All';
    if (selectedPermissions.length === 0) return 'Display Only';
    return selectedPermissions.join(', ');
  };

  // Helper to set selected permissions from a role string
  const setPermissionsFromRole = (roleStr: string) => {
    if (!roleStr) {
      setSelectedPermissions(['Display Only']);
      return;
    }
    if (roleStr.trim().toUpperCase() === 'ALL') {
      setSelectedPermissions(['All']);
      return;
    }
    const parts = roleStr.split(',').map((p) => p.trim()).filter(Boolean);
    setSelectedPermissions(parts.length > 0 ? parts : ['Display Only']);
  };

  const togglePermission = (permId: string) => {
    if (permId === 'All') {
      setSelectedPermissions(['All']);
      return;
    }

    let next = selectedPermissions.filter((p) => p !== 'All');
    if (next.includes(permId)) {
      next = next.filter((p) => p !== permId);
    } else {
      next.push(permId);
    }

    if (next.length === 0) {
      next = ['Display Only'];
    }

    setSelectedPermissions(next);
  };

  // Fetch users list from server
  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError('Gagal memuat daftar pengguna.');
      }
    } catch (err) {
      console.error(err);
      setError('Kesalahan koneksi saat memuat daftar pengguna.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditUsers) {
      setError('Akses ditolak: Akun Anda tidak memiliki otoritas administrator (All) untuk mengedit pengguna.');
      return;
    }

    if (!usernameInput.trim()) {
      setError('Username tidak boleh kosong');
      return;
    }

    if (!isEditing && !passwordInput.trim()) {
      setError('Password wajib ditentukan untuk pengguna baru');
      return;
    }

    const finalRole = getFormattedRoleString();

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: usernameInput.trim(),
          password: passwordInput ? passwordInput : undefined,
          role: finalRole,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess(isEditing ? 'Otorisasi pengguna berhasil diperbarui!' : 'Pengguna baru berhasil ditambahkan!');
        setUsernameInput('');
        setPasswordInput('');
        setSelectedPermissions(['Display Only']);
        setIsEditing(false);
        fetchUsers();
      } else {
        setError(data.message || 'Gagal menyimpan data pengguna');
      }
    } catch (err) {
      console.error(err);
      setError('Kesalahan koneksi saat menyimpan data pengguna.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (targetUsername: string) => {
    if (!canEditUsers) {
      alert('Akses ditolak: Anda tidak memiliki izin untuk menghapus pengguna.');
      return;
    }

    if (targetUsername.toLowerCase() === currentUser.toLowerCase()) {
      alert('Anda tidak bisa menghapus diri Anda sendiri yang sedang aktif digunakan.');
      return;
    }

    if (targetUsername.toLowerCase() === 'admin') {
      alert('Sistem tidak memperbolehkan penghapusan akun administrator default "admin".');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna "${targetUsername}"?`)) {
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/users/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: targetUsername }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess(`Pengguna "${targetUsername}" berhasil dihapus.`);
        fetchUsers();
      } else {
        setError(data.message || 'Gagal menghapus pengguna.');
      }
    } catch (err) {
      console.error(err);
      setError('Kesalahan koneksi saat menghapus pengguna.');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (user: UserItem) => {
    if (!canEditUsers) return;
    setUsernameInput(user.username);
    setPasswordInput('');
    setPermissionsFromRole(user.role);
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const cancelEdit = () => {
    setUsernameInput('');
    setPasswordInput('');
    setSelectedPermissions(['Display Only']);
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  // Helper to render role badge tags
  const renderRoleBadges = (roleStr: string) => {
    if (!roleStr) return null;
    const isAll = roleStr.toUpperCase() === 'ALL';
    if (isAll) {
      return (
        <span className="inline-block text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-sm font-sans bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
          ALL ACCESS
        </span>
      );
    }

    const parts = roleStr.split(',').map((p) => p.trim());
    return (
      <div className="flex flex-wrap justify-center gap-1">
        {parts.map((p) => {
          const opt = PERMISSION_OPTIONS.find((o) => o.id.toLowerCase() === p.toLowerCase());
          const badgeBg = opt ? opt.badgeBg : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
          const badgeText = opt ? opt.badgeText : 'text-slate-700 dark:text-slate-300';
          return (
            <span
              key={p}
              className={`inline-block text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-sm font-sans border ${badgeBg} ${badgeText}`}
            >
              {p}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Tab Header Banner */}
      <div className={`p-5 rounded-sm border shadow-sm transition-all ${
        isDarkMode ? 'bg-slate-900 border-slate-800 shadow-emerald-950/5' : 'bg-white border-slate-200 shadow-slate-100/50'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600/15 rounded-sm flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight font-display">
                MANAJEMEN USER &amp; OTORISASI HAK AKSES
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
                Konfigurasi Otorisasi: Display Only, View, Input, Edit, Delete, &amp; All Access
              </p>
            </div>
          </div>
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className={`p-2 rounded-sm border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold uppercase ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white' 
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
            title="Segarkan daftar pengguna"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Segarkan List
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form (Create/Edit User) */}
        <div className="lg:col-span-1 space-y-4">
          <div className={`p-5 rounded-sm border shadow-sm transition-all ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <Shield className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-display">
                {isEditing ? 'Ubah Otorisasi User' : 'Tambah Operator Baru'}
              </h3>
            </div>

            {!canEditUsers ? (
              <div className="p-4 rounded-sm border border-rose-200 dark:border-rose-950 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-2">
                <Lock className="w-8 h-8 text-rose-500 mx-auto" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600">Akses Terkunci</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                  Akun Anda saat ini memiliki otorisasi <strong className="text-rose-600 uppercase font-bold">[{currentRole}]</strong>. 
                  Hanya pengguna dengan otoritas administrator <strong className="text-emerald-600 uppercase font-bold">[All]</strong> yang dapat memodifikasi hak akses user.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveUser} className="space-y-4">
                {/* Username Input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <input
                    id="user-username"
                    type="text"
                    required
                    placeholder="Contoh: roni_logistik"
                    disabled={isEditing || isLoading}
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-sm border outline-hidden transition-all uppercase font-mono font-bold ${
                      isDarkMode
                        ? 'bg-slate-850 border-slate-700 text-white focus:ring-1 focus:ring-emerald-500 disabled:opacity-50'
                        : 'bg-slate-50 border-slate-300 text-slate-850 focus:ring-1 focus:ring-emerald-600 disabled:opacity-50'
                    }`}
                  />
                  {isEditing && (
                    <span className="text-[9px] text-slate-400 mt-1 block">Username tidak dapat diubah setelah didaftarkan</span>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {isEditing ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password'}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Key className="h-3.5 w-3.5 text-slate-400" />
                    </span>
                    <input
                      id="user-password"
                      type="password"
                      required={!isEditing}
                      placeholder={isEditing ? 'Masukkan password baru' : 'Masukkan password'}
                      disabled={isLoading}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-sm border outline-hidden transition-all ${
                        isDarkMode
                          ? 'bg-slate-850 border-slate-700 text-white focus:ring-1 focus:ring-emerald-500'
                          : 'bg-slate-50 border-slate-300 text-slate-850 focus:ring-1 focus:ring-emerald-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Quick Role Preset Buttons */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Pilihan Preset Hak Akses
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {PERMISSION_OPTIONS.map((opt) => {
                      const isSelected = selectedPermissions.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => togglePermission(opt.id)}
                          className={`px-2 py-1.5 rounded-sm border text-[10px] font-bold uppercase transition-all cursor-pointer text-center truncate ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                              : isDarkMode
                                ? 'bg-slate-850 border-slate-700 text-slate-400 hover:text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                          title={opt.desc}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Granular Checkboxes List */}
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Rincian Otorisasi yang Diberikan:
                  </label>
                  <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-sm border border-slate-200 dark:border-slate-800">
                    {PERMISSION_OPTIONS.map((opt) => {
                      const checked = selectedPermissions.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          onClick={() => togglePermission(opt.id)}
                          className="flex items-start gap-2 cursor-pointer select-none group"
                        >
                          <div className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0">
                            {checked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                          </div>
                          <div>
                            <span className={`text-[11px] font-extrabold uppercase font-sans ${
                              checked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                            }`}>
                              {opt.label}
                            </span>
                            <p className="text-[9px] text-slate-400 leading-tight">
                              {opt.desc}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Notification Indicators */}
                {error && (
                  <div className="p-2.5 rounded-sm bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-semibold dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-2.5 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex gap-2 pt-2">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className={`flex-1 py-2 text-xs font-bold uppercase rounded-sm border cursor-pointer transition-colors ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                          : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-2 py-2 text-xs font-bold uppercase rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isEditing ? 'Simpan Otorisasi' : 'Daftarkan User'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Columns: Registered Users List */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`p-5 rounded-sm border shadow-sm transition-all ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-blue-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-display">
                  Daftar Operator Terdaftar ({users.length})
                </h3>
              </div>
              <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-900 text-slate-500">
                HOST: Cloud Server Instan
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden bg-slate-50/50 dark:bg-slate-950/20">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[9px] font-black uppercase tracking-wider ${
                    isDarkMode ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-250 text-slate-600'
                  }`}>
                    <th className="py-2.5 px-3 text-center w-12">No</th>
                    <th className="py-2.5 px-4">Username</th>
                    <th className="py-2.5 px-4 text-center">Tingkat Hak Akses / Otorisasi</th>
                    <th className="py-2.5 px-3 text-center">Sesi Anda</th>
                    {canEditUsers && <th className="py-2.5 px-4 text-center w-28">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                  {users.map((user, idx) => {
                    const isSelf = user.username.toLowerCase() === currentUser.toLowerCase();
                    return (
                      <tr key={user.username} className={`hover:bg-slate-100/40 dark:hover:bg-slate-900/40 transition-colors ${
                        isSelf ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                      }`}>
                        <td className="py-3 px-3 text-center font-mono text-[10px] text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-mono font-extrabold uppercase text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{user.username}</span>
                          {isSelf && (
                            <span className="text-[8px] bg-emerald-500 text-white font-sans font-black tracking-widest px-1.5 py-0.5 rounded-sm uppercase">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {renderRoleBadges(user.role)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isSelf ? (
                            <span className="text-emerald-500 font-bold font-mono">● ONLINE</span>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>
                        {canEditUsers && (
                          <td className="py-2 px-4 text-center">
                            <div className="inline-flex gap-1.5 justify-center">
                              <button
                                onClick={() => startEdit(user)}
                                disabled={user.username === 'admin'}
                                className="p-1 rounded-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30"
                                title="Ubah Otorisasi Pengguna"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.username)}
                                disabled={isSelf || user.username === 'admin'}
                                className="p-1 rounded-sm border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300 dark:hover:border-rose-900 transition-colors cursor-pointer text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-30"
                                title="Hapus Pengguna"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}

                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium font-mono text-xs">
                        {isLoading ? 'Memuat daftar pengguna dari server...' : 'Tidak ada operator terdaftar.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 rounded-xs border border-blue-150 bg-blue-50/50 dark:bg-blue-950/20 text-[10px] text-blue-800 dark:text-blue-300 font-semibold leading-relaxed">
              💡 INFORMASI OTORISASI: Otorisasi dapat disesuaikan secara khusus dengan kombinasi (Display Only, View, Input, Edit, Delete, atau All Access). Setiap perubahan otorisasi akan langsung tersimpan di Cloud Database dan berlaku instan pada sesi operator.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

