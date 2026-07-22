/**
 * Permission utility helper for PT Maju Jaya Selamanya
 * Supported authorization levels/permissions:
 * - 'All': Full access to all features, including user management & database reset
 * - 'Display Only': Read-only dashboard & transaction viewing, restricted from all mutations
 * - 'View': Read-only viewing of lists, reports, details, and print/export
 * - 'Input': Can add/create new transactions, master data, and import Excel
 * - 'Edit': Can modify/update existing transactions and master data
 * - 'Delete': Can remove/delete existing transactions and master data
 */

export function canView(role: string): boolean {
  if (!role) return false;
  return true; // All authenticated users can view data
}

export function canInput(role: string): boolean {
  if (!role) return false;
  const r = role.toUpperCase();
  if (r === 'ALL') return true;
  return r.includes('INPUT');
}

export function canEdit(role: string): boolean {
  if (!role) return false;
  const r = role.toUpperCase();
  if (r === 'ALL') return true;
  return r.includes('EDIT');
}

export function canDelete(role: string): boolean {
  if (!role) return false;
  const r = role.toUpperCase();
  if (r === 'ALL') return true;
  return r.includes('DELETE');
}

export function canManageUsers(role: string): boolean {
  if (!role) return false;
  const r = role.toUpperCase();
  return r === 'ALL' || r.includes('ADMIN');
}

export function isDisplayOnly(role: string): boolean {
  if (!role) return true;
  const r = role.toUpperCase();
  if (r === 'ALL') return false;
  return r === 'DISPLAY ONLY' || (!canInput(role) && !canEdit(role) && !canDelete(role));
}

export interface PermissionOption {
  id: string;
  label: string;
  desc: string;
  badgeBg: string;
  badgeText: string;
}

export const PERMISSION_OPTIONS: PermissionOption[] = [
  {
    id: 'Display Only',
    label: 'Display Only',
    desc: 'Hanya melihat tampilan/dashboard tanpa akses modifikasi',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900',
    badgeText: 'text-blue-800 dark:text-blue-400',
  },
  {
    id: 'View',
    label: 'View',
    desc: 'Melihat list data, detail transaksi, cetak PDF & export Excel',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-900',
    badgeText: 'text-cyan-800 dark:text-cyan-400',
  },
  {
    id: 'Input',
    label: 'Input',
    desc: 'Memasukkan transaksi penjualan baru, master data, & import Excel',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900',
    badgeText: 'text-amber-800 dark:text-amber-400',
  },
  {
    id: 'Edit',
    label: 'Edit',
    desc: 'Mengubah / mengedit data transaksi penjualan dan master data',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900',
    badgeText: 'text-indigo-800 dark:text-indigo-400',
  },
  {
    id: 'Delete',
    label: 'Delete',
    desc: 'Menghapus data transaksi penjualan dan master data',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900',
    badgeText: 'text-rose-800 dark:text-rose-400',
  },
  {
    id: 'All',
    label: 'All (Full Access)',
    desc: 'Akses penuh ke seluruh sistem, termasuk kelola pengguna & reset database',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900',
    badgeText: 'text-emerald-800 dark:text-emerald-400',
  },
];
