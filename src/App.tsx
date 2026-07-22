/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Penjualan, AlatBerat, Barang, Kendaraan, Customer } from './types';
import {
  INITIAL_ALAT_BERAT,
  INITIAL_BARANG,
  INITIAL_KENDARAAN,
  INITIAL_CUSTOMER,
  INITIAL_PENJUALAN,
} from './utils/seedData';
import { canInput, canEdit, canDelete, isDisplayOnly, canManageUsers } from './utils/permission';

// Component Imports
import PenjualanList from './components/PenjualanList';
import PenjualanForm from './components/PenjualanForm';
import LaporanPenjualan from './components/LaporanPenjualan';
import LaporanPenjualanDetail from './components/LaporanPenjualanDetail';
import MasterAlatBerat from './components/MasterAlatBerat';
import MasterBarang from './components/MasterBarang';
import MasterKendaraan from './components/MasterKendaraan';
import MasterCustomer from './components/MasterCustomer';
import Modal from './components/Modal';
import ImportModal from './components/ImportModal';
import SignIn from './components/SignIn';
import UserManagement from './components/UserManagement';
import GoogleSheetsSync from './components/GoogleSheetsSync';

// Icon Imports
import {
  Coins,
  HardHat,
  RotateCcw,
  Package,
  Truck,
  Users,
  TrendingUp,
  FileText,
  Activity,
  Sun,
  Moon,
  LogIn,
  LogOut,
  Key,
  Printer,
  Trash2,
  Shield,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';

export default function App() {
  // 1. Top-Level States (Synced with LocalStorage and central server)
  const [salesList, setSalesList] = useState<Penjualan[]>([]);
  const [alatBeratList, setAlatBeratList] = useState<AlatBerat[]>([]);
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [kendaraanList, setKendaraanList] = useState<Kendaraan[]>([]);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Auth States
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('majujaya_loggedin') === 'true';
  });
  const [operatorName, setOperatorName] = useState<string>(() => {
    return localStorage.getItem('majujaya_operator_name') || 'ADMIN';
  });
  const [operatorRole, setOperatorRole] = useState<string>(() => {
    return localStorage.getItem('majujaya_operator_role') || 'All';
  });

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('majujaya_theme') === 'dark';
  });

  // 2. Navigation State
  const [activeTab, setActiveTab] = useState<'penjualan' | 'laporan' | 'laporan_detail' | 'master' | 'users' | 'sheets'>('penjualan');
  const [activeMasterSubTab, setActiveMasterSubTab] = useState<'alat' | 'barang' | 'kendaraan' | 'customer'>('alat');

  // 3. Form & Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Penjualan | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importType, setImportType] = useState<'penjualan' | 'alat' | 'barang' | 'kendaraan' | 'customer'>('penjualan');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearSelection, setClearSelection] = useState({
    sales: false,
    alat: false,
    barang: false,
    kendaraan: false,
    customer: false,
  });

  // 4. Live Clock State
  const [timeString, setTimeString] = useState('');

  // Server data fetching
  const fetchServerData = async (forceInitialSeed = false) => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/data');
      if (response.ok) {
        const data = await response.json();
        
        // Check if database is completely empty on the server
        const isEmpty = 
          (!data.sales || data.sales.length === 0) &&
          (!data.alat || data.alat.length === 0) &&
          (!data.barang || data.barang.length === 0) &&
          (!data.kendaraan || data.kendaraan.length === 0) &&
          (!data.customer || data.customer.length === 0);

        if (isEmpty && forceInitialSeed) {
          // Seed the server database with initial presets
          console.log('Server database is empty. Seeding with default data...');
          await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sales: INITIAL_PENJUALAN,
              alat: INITIAL_ALAT_BERAT,
              barang: INITIAL_BARANG,
              kendaraan: INITIAL_KENDARAAN,
              customer: INITIAL_CUSTOMER
            })
          });
          setSalesList(INITIAL_PENJUALAN);
          setAlatBeratList(INITIAL_ALAT_BERAT);
          setBarangList(INITIAL_BARANG);
          setKendaraanList(INITIAL_KENDARAAN);
          setCustomerList(INITIAL_CUSTOMER);
        } else {
          // Normal hydration from server, only update state if data changed to preserve references
          const newSales = data.sales || [];
          const newAlat = data.alat || [];
          const newBarang = data.barang || [];
          const newKendaraan = data.kendaraan || [];
          const newCustomer = data.customer || [];

          setSalesList((prev) => (JSON.stringify(prev) === JSON.stringify(newSales) ? prev : newSales));
          setAlatBeratList((prev) => (JSON.stringify(prev) === JSON.stringify(newAlat) ? prev : newAlat));
          setBarangList((prev) => (JSON.stringify(prev) === JSON.stringify(newBarang) ? prev : newBarang));
          setKendaraanList((prev) => (JSON.stringify(prev) === JSON.stringify(newKendaraan) ? prev : newKendaraan));
          setCustomerList((prev) => (JSON.stringify(prev) === JSON.stringify(newCustomer) ? prev : newCustomer));
        }
      }
    } catch (err) {
      console.error('Error fetching data from server', err);
    } finally {
      setIsSyncing(false);
      setIsHydrated(true);
    }
  };

  // Helper to push modified state to server
  const pushDataToServer = async (
    sales: Penjualan[],
    alat: AlatBerat[],
    barang: Barang[],
    kendaraan: Kendaraan[],
    customer: Customer[]
  ) => {
    if (isDisplayOnly(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) hanya "Display Only" / Read Only. Anda tidak diizinkan memodifikasi data.`);
      return false;
    }
    setIsSyncing(true);
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sales, alat, barang, kendaraan, customer })
      });
      if (!response.ok) {
        throw new Error('Sync failed');
      }
      return true;
    } catch (err) {
      console.error('Failed to sync changes with server:', err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // 5. Initial Hydration
  useEffect(() => {
    // 1. First check local storage as quick feedback
    const localSales = localStorage.getItem('majujaya_sales');
    const localAlat = localStorage.getItem('majujaya_alat');
    const localBarang = localStorage.getItem('majujaya_barang');
    const localKendaraan = localStorage.getItem('majujaya_kendaraan');
    const localCustomer = localStorage.getItem('majujaya_customer');

    if (localSales) setSalesList(JSON.parse(localSales));
    if (localAlat) setAlatBeratList(JSON.parse(localAlat));
    if (localBarang) setBarangList(JSON.parse(localBarang));
    if (localKendaraan) setKendaraanList(JSON.parse(localKendaraan));
    if (localCustomer) setCustomerList(JSON.parse(localCustomer));

    // 2. Hydrate & seed from central server
    fetchServerData(true);
  }, []);

  // 5b. Background Real-time Sync Polling
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      fetchServerData(false);
    }, 5000); // Poll server every 5 seconds for live multi-user sync
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Save to local storage cache when state changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('majujaya_sales', JSON.stringify(salesList));
      localStorage.setItem('majujaya_alat', JSON.stringify(alatBeratList));
      localStorage.setItem('majujaya_barang', JSON.stringify(barangList));
      localStorage.setItem('majujaya_kendaraan', JSON.stringify(kendaraanList));
      localStorage.setItem('majujaya_customer', JSON.stringify(customerList));
    }
  }, [salesList, alatBeratList, barangList, kendaraanList, customerList, isHydrated]);

  // Live Clock Updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTimeString(`${day}-${month}-${year} ${hours}:${minutes}:${seconds}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset to Presets / Demo Data
  const handleResetDatabase = async () => {
    if (!canManageUsers(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki otoritas administrator (All) untuk mengatur ulang database.`);
      return;
    }
    if (confirm('Apakah Anda yakin ingin mengatur ulang seluruh database ke data demo awal? Semua perubahan data baru Anda akan hilang.')) {
      const ok = await pushDataToServer(INITIAL_PENJUALAN, INITIAL_ALAT_BERAT, INITIAL_BARANG, INITIAL_KENDARAAN, INITIAL_CUSTOMER);
      if (ok) {
        setSalesList(INITIAL_PENJUALAN);
        setAlatBeratList(INITIAL_ALAT_BERAT);
        setBarangList(INITIAL_BARANG);
        setKendaraanList(INITIAL_KENDARAAN);
        setCustomerList(INITIAL_CUSTOMER);
        alert('Database berhasil di-reset ke data demo!');
      } else {
        alert('Gagal menyinkronkan data reset ke server.');
      }
    }
  };

  // Kosongkan Data Terpilih
  const handleEmptySelectedData = async (options: {
    sales: boolean;
    alat: boolean;
    barang: boolean;
    kendaraan: boolean;
    customer: boolean;
  }) => {
    if (!canDelete(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk mengosongkan / menghapus database.`);
      return;
    }
    const selectedKeys: string[] = [];
    if (options.sales) selectedKeys.push('Main Menu (Transaksi Penjualan & Logistik)');
    if (options.alat) selectedKeys.push('Master Data Alat Berat');
    if (options.barang) selectedKeys.push('Master Data Barang');
    if (options.kendaraan) selectedKeys.push('Master Data Kendaraan');
    if (options.customer) selectedKeys.push('Master Data Customer');

    if (selectedKeys.length === 0) {
      alert('Silakan pilih setidaknya satu jenis data untuk dikosongkan.');
      return;
    }

    const message = `Apakah Anda yakin ingin MENGOSONGKAN data berikut secara permanen?\n\n${selectedKeys.map((k) => `- ${k}`).join('\n')}\n\nTindakan ini tidak dapat dibatalkan!`;
    
    if (confirm(message)) {
      const nextSales = options.sales ? [] : salesList;
      const nextAlat = options.alat ? [] : alatBeratList;
      const nextBarang = options.barang ? [] : barangList;
      const nextKendaraan = options.kendaraan ? [] : kendaraanList;
      const nextCustomer = options.customer ? [] : customerList;

      const ok = await pushDataToServer(nextSales, nextAlat, nextBarang, nextKendaraan, nextCustomer);
      if (ok) {
        if (options.sales) setSalesList([]);
        if (options.alat) setAlatBeratList([]);
        if (options.barang) setBarangList([]);
        if (options.kendaraan) setKendaraanList([]);
        if (options.customer) setCustomerList([]);
        alert('Data terpilih berhasil dikosongkan!');
        setIsClearModalOpen(false);
      } else {
        alert('Gagal menyinkronkan pengosongan data ke server.');
      }
    }
  };

  // --- CRUD Handlers for TRANSACTIONS ---
  const handleAddTransaction = async (payload: Omit<Penjualan, 'id'>) => {
    if (!canInput(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Menambah Data (Input).`);
      return;
    }
    const newTx: Penjualan = {
      ...payload,
      id: `tx-${Date.now()}`,
    };
    const updated = [newTx, ...salesList];
    const ok = await pushDataToServer(updated, alatBeratList, barangList, kendaraanList, customerList);
    if (ok) {
      setSalesList(updated);
      setIsFormOpen(false);
    } else {
      alert('Gagal menyimpan transaksi ke server.');
    }
  };

  const handleUpdateTransaction = async (payload: Penjualan) => {
    if (!canEdit(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Mengubah Data (Edit).`);
      return;
    }
    const updated = salesList.map((x) => (x.id === payload.id ? payload : x));
    const ok = await pushDataToServer(updated, alatBeratList, barangList, kendaraanList, customerList);
    if (ok) {
      setSalesList(updated);
      setIsFormOpen(false);
    } else {
      alert('Gagal memperbarui transaksi ke server.');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!canDelete(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Menghapus Data (Delete).`);
      return;
    }
    const updated = salesList.filter((x) => x.id !== id);
    const ok = await pushDataToServer(updated, alatBeratList, barangList, kendaraanList, customerList);
    if (ok) {
      setSalesList(updated);
    } else {
      alert('Gagal menghapus transaksi dari server.');
    }
  };

  // --- CRUD Handlers for MASTER ALAT BERAT ---
  const handleAddAlatBerat = async (item: Omit<AlatBerat, 'id'>) => {
    if (!canInput(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Menambah Data (Input).`);
      return;
    }
    const newItem: AlatBerat = { ...item, id: `ab-${Date.now()}` };
    const updated = [...alatBeratList, newItem];
    const ok = await pushDataToServer(salesList, updated, barangList, kendaraanList, customerList);
    if (ok) {
      setAlatBeratList(updated);
    } else {
      alert('Gagal menyimpan data master ke server.');
    }
  };

  const handleUpdateAlatBerat = async (item: AlatBerat) => {
    if (!canEdit(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Mengubah Data (Edit).`);
      return;
    }
    const updated = alatBeratList.map((x) => (x.id === item.id ? item : x));
    const ok = await pushDataToServer(salesList, updated, barangList, kendaraanList, customerList);
    if (ok) {
      setAlatBeratList(updated);
    } else {
      alert('Gagal memperbarui data master ke server.');
    }
  };

  const handleDeleteAlatBerat = async (id: string) => {
    if (!canDelete(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Menghapus Data (Delete).`);
      return;
    }
    const updated = alatBeratList.filter((x) => x.id !== id);
    const ok = await pushDataToServer(salesList, updated, barangList, kendaraanList, customerList);
    if (ok) {
      setAlatBeratList(updated);
    } else {
      alert('Gagal menghapus data master dari server.');
    }
  };

  // --- CRUD Handlers for MASTER BARANG ---
  const handleAddBarang = async (item: Omit<Barang, 'id'>) => {
    if (!canInput(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Menambah Data (Input).`);
      return;
    }
    const newItem: Barang = { ...item, id: `mat-${Date.now()}` };
    const updated = [...barangList, newItem];
    const ok = await pushDataToServer(salesList, alatBeratList, updated, kendaraanList, customerList);
    if (ok) {
      setBarangList(updated);
    } else {
      alert('Gagal menyimpan data master ke server.');
    }
  };

  const handleUpdateBarang = async (item: Barang) => {
    if (!canEdit(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Mengubah Data (Edit).`);
      return;
    }
    const updated = barangList.map((x) => (x.id === item.id ? item : x));
    const ok = await pushDataToServer(salesList, alatBeratList, updated, kendaraanList, customerList);
    if (ok) {
      setBarangList(updated);
    } else {
      alert('Gagal memperbarui data master ke server.');
    }
  };

  const handleDeleteBarang = async (id: string) => {
    if (!canDelete(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Menghapus Data (Delete).`);
      return;
    }
    const updated = barangList.filter((x) => x.id !== id);
    const ok = await pushDataToServer(salesList, alatBeratList, updated, kendaraanList, customerList);
    if (ok) {
      setBarangList(updated);
    } else {
      alert('Gagal menghapus data master dari server.');
    }
  };

  // --- CRUD Handlers for MASTER KENDARAAN ---
  const handleAddKendaraan = async (item: Kendaraan) => {
    if (!canInput(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Menambah Data (Input).`);
      return;
    }
    const updated = [...kendaraanList, item];
    const ok = await pushDataToServer(salesList, alatBeratList, barangList, updated, customerList);
    if (ok) {
      setKendaraanList(updated);
    } else {
      alert('Gagal menyimpan data master ke server.');
    }
  };

  const handleUpdateKendaraan = async (item: Kendaraan) => {
    if (!canEdit(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Mengubah Data (Edit).`);
      return;
    }
    const updated = kendaraanList.map((x) => (x.noPolisi === item.noPolisi ? item : x));
    const ok = await pushDataToServer(salesList, alatBeratList, barangList, updated, customerList);
    if (ok) {
      setKendaraanList(updated);
    } else {
      alert('Gagal memperbarui data master ke server.');
    }
  };

  const handleDeleteKendaraan = async (noPolisi: string) => {
    if (!canDelete(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Menghapus Data (Delete).`);
      return;
    }
    const updated = kendaraanList.filter((x) => x.noPolisi !== noPolisi);
    const ok = await pushDataToServer(salesList, alatBeratList, barangList, updated, customerList);
    if (ok) {
      setKendaraanList(updated);
    } else {
      alert('Gagal menghapus data master dari server.');
    }
  };

  // --- CRUD Handlers for MASTER CUSTOMER ---
  const handleAddCustomer = async (item: Omit<Customer, 'id'>) => {
    if (!canInput(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Menambah Data (Input).`);
      return;
    }
    const newItem: Customer = { ...item, id: `cus-${Date.now()}` };
    const updated = [...customerList, newItem];
    const ok = await pushDataToServer(salesList, alatBeratList, barangList, kendaraanList, updated);
    if (ok) {
      setCustomerList(updated);
    } else {
      alert('Gagal menyimpan data master ke server.');
    }
  };

  const handleUpdateCustomer = async (item: Customer) => {
    if (!canEdit(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Mengubah Data (Edit).`);
      return;
    }
    const updated = customerList.map((x) => (x.id === item.id ? item : x));
    const ok = await pushDataToServer(salesList, alatBeratList, barangList, kendaraanList, updated);
    if (ok) {
      setCustomerList(updated);
    } else {
      alert('Gagal memperbarui data master ke server.');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!canDelete(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Menghapus Data (Delete).`);
      return;
    }
    const updated = customerList.filter((x) => x.id !== id);
    const ok = await pushDataToServer(salesList, alatBeratList, barangList, kendaraanList, updated);
    if (ok) {
      setCustomerList(updated);
    } else {
      alert('Gagal menghapus data master dari server.');
    }
  };

  // --- IMPORT EXCEL HANDLERS ---
  const handleImportSales = async (imported: Penjualan[]) => {
    if (!canInput(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Import Data (Input).`);
      return;
    }
    const updated = [...imported, ...salesList];
    const ok = await pushDataToServer(updated, alatBeratList, barangList, kendaraanList, customerList);
    if (ok) {
      setSalesList(updated);
    } else {
      alert('Gagal menyimpan data import ke server.');
    }
  };

  const handleImportAlatBerat = async (imported: AlatBerat[]) => {
    if (!canInput(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Import Data (Input).`);
      return;
    }
    const updated = [...alatBeratList, ...imported];
    const ok = await pushDataToServer(salesList, updated, barangList, kendaraanList, customerList);
    if (ok) {
      setAlatBeratList(updated);
    } else {
      alert('Gagal menyimpan data import ke server.');
    }
  };

  const handleImportBarang = async (imported: Barang[]) => {
    if (!canInput(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Import Data (Input).`);
      return;
    }
    const updated = [...barangList, ...imported];
    const ok = await pushDataToServer(salesList, alatBeratList, updated, kendaraanList, customerList);
    if (ok) {
      setBarangList(updated);
    } else {
      alert('Gagal menyimpan data import ke server.');
    }
  };

  const handleImportKendaraan = async (imported: Kendaraan[]) => {
    if (!canInput(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Import Data (Input).`);
      return;
    }
    const existingNopol = new Set(kendaraanList.map((k) => k.noPolisi.toUpperCase()));
    const filteredImport = imported.filter((k) => !existingNopol.has(k.noPolisi.toUpperCase()));
    const updated = [...kendaraanList, ...filteredImport];
    const ok = await pushDataToServer(salesList, alatBeratList, barangList, updated, customerList);
    if (ok) {
      setKendaraanList(updated);
    } else {
      alert('Gagal menyimpan data import ke server.');
    }
  };

  const handleImportCustomer = async (imported: Customer[]) => {
    if (!canInput(operatorRole)) {
      alert(`Akses Ditolak: Hak akses Anda (${operatorRole}) tidak memiliki izin untuk Import Data (Input).`);
      return;
    }
    const updated = [...customerList, ...imported];
    const ok = await pushDataToServer(salesList, alatBeratList, barangList, kendaraanList, updated);
    if (ok) {
      setCustomerList(updated);
    } else {
      alert('Gagal menyimpan data import ke server.');
    }
  };

  const toggleTheme = () => {
    const nextTheme = !isDarkMode ? 'dark' : 'light';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('majujaya_theme', nextTheme);
  };

  const handleLogin = (username: string, role: string) => {
    setIsLoggedIn(true);
    setOperatorName(username.toUpperCase());
    setOperatorRole(role);
    localStorage.setItem('majujaya_loggedin', 'true');
    localStorage.setItem('majujaya_operator_name', username.toUpperCase());
    localStorage.setItem('majujaya_operator_role', role);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('majujaya_loggedin', 'false');
  };

  if (!isLoggedIn) {
    return (
      <SignIn
        onSignIn={handleLogin}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className={`h-screen flex flex-col font-sans overflow-hidden select-none transition-colors duration-300 ${
      isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-[#F2F2F2] text-slate-800'
    }`}>
      {/* 1. Header Canvas */}
      <header className={`px-5 py-2.5 flex justify-between items-center border-b shrink-0 transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-900 text-white border-slate-800' : 'bg-[#1E293B] text-white border-slate-700'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-sm flex items-center justify-center font-bold text-base italic shadow-md">
            MJS
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase font-display">
              Sistem Penjualan &amp; Logistik Terpadu
            </h1>
            <p className="text-[9px] text-slate-300 font-medium tracking-wide uppercase">
              PT Maju Jaya Selamanya — Unit Tambang, Cucian, &amp; Alat Berat
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full hover:bg-slate-800/80 dark:hover:bg-slate-800/80 transition-colors cursor-pointer text-slate-300 hover:text-white"
            title="Toggle Light/Dark Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>

          <div className="flex flex-col items-end border-l border-slate-700/60 pl-3">
            <span className="opacity-70 uppercase tracking-widest text-[8px] font-semibold">{operatorRole}</span>
            <span className="font-mono text-[10px] font-bold text-emerald-400">{operatorName}</span>
          </div>

          <button
            onClick={() => {
              setClearSelection({
                sales: false,
                alat: false,
                barang: false,
                kendaraan: false,
                customer: false,
              });
              setIsClearModalOpen(true);
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white px-2 py-1.5 rounded-sm font-bold uppercase tracking-wider text-[10px] transition-colors flex items-center gap-1 shadow-sm border border-amber-500 cursor-pointer"
            title="Pilih data yang akan dikosongkan"
          >
            <Trash2 className="w-3 h-3" />
            Kosongkan Data
          </button>

          <button
            onClick={handleResetDatabase}
            className="bg-rose-700 hover:bg-rose-800 text-white px-2 py-1.5 rounded-sm font-bold uppercase tracking-wider text-[10px] transition-colors flex items-center gap-1 shadow-sm border border-rose-600 cursor-pointer"
            title="Reset seluruh database ke data demo"
          >
            <RotateCcw className="w-3 h-3" />
            Reset DB
          </button>

          <button
            onClick={handleLogout}
            className="bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white px-2.5 py-1.5 rounded-sm font-bold uppercase tracking-wider text-[10px] transition-colors flex items-center gap-1 border border-slate-700 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3 h-3 text-rose-400" />
            Sign Out
          </button>
        </div>
      </header>

      {/* 2. Main Sidebar & Content View Wrapper */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Panel */}
        <aside className={`w-52 border-r flex flex-col justify-between shrink-0 transition-colors duration-300 ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-[#E5E7EB] border-slate-300 text-slate-800'
        }`}>
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {/* Main Menu Label */}
            <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest font-display ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Main Menu
            </div>
            <button
              onClick={() => setActiveTab('penjualan')}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-sm text-left transition-all text-xs font-semibold ${
                activeTab === 'penjualan'
                  ? isDarkMode
                    ? 'bg-slate-800 shadow-sm text-emerald-400 border-l-4 border-emerald-500 font-bold'
                    : 'bg-white shadow-sm text-blue-700 border-l-4 border-blue-600 font-bold'
                  : isDarkMode
                    ? 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
                    : 'hover:bg-white/55 text-slate-600 hover:text-slate-950'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Penjualan &amp; DO</span>
            </button>
            <button
              onClick={() => setActiveTab('laporan')}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-sm text-left transition-all text-xs font-semibold ${
                activeTab === 'laporan'
                  ? isDarkMode
                    ? 'bg-slate-800 shadow-sm text-emerald-400 border-l-4 border-emerald-500 font-bold'
                    : 'bg-white shadow-sm text-blue-700 border-l-4 border-blue-600 font-bold'
                  : isDarkMode
                    ? 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
                    : 'hover:bg-white/55 text-slate-600 hover:text-slate-950'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>Laporan Analitik</span>
            </button>
            <button
              onClick={() => setActiveTab('laporan_detail')}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-sm text-left transition-all text-xs font-semibold ${
                activeTab === 'laporan_detail'
                  ? isDarkMode
                    ? 'bg-slate-800 shadow-sm text-emerald-400 border-l-4 border-emerald-500 font-bold'
                    : 'bg-white shadow-sm text-blue-700 border-l-4 border-blue-600 font-bold'
                  : isDarkMode
                    ? 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
                    : 'hover:bg-white/55 text-slate-600 hover:text-slate-950'
              }`}
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span>Laporan Detail (Cetak)</span>
            </button>

            {/* Master Database Label */}
            <div className={`px-3 py-3 text-[10px] font-bold uppercase tracking-widest font-display border-t mt-3 ${
              isDarkMode ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-300'
            }`}>
              Master Database
            </div>
            <button
              onClick={() => {
                setActiveTab('master');
                setActiveMasterSubTab('alat');
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-sm text-left transition-all text-xs font-semibold ${
                activeTab === 'master' && activeMasterSubTab === 'alat'
                  ? isDarkMode
                    ? 'bg-slate-800 shadow-sm text-emerald-400 border-l-4 border-emerald-500 font-bold'
                    : 'bg-white shadow-sm text-blue-700 border-l-4 border-blue-600 font-bold'
                  : isDarkMode
                    ? 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
                    : 'hover:bg-white/55 text-slate-600 hover:text-slate-950'
              }`}
            >
              <span className="flex items-center gap-3">
                <HardHat className="w-3.5 h-3.5 shrink-0" />
                <span>Alat Berat</span>
              </span>
              <span className="font-mono text-[9px] opacity-60">AB/</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('master');
                setActiveMasterSubTab('barang');
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-sm text-left transition-all text-xs font-semibold ${
                activeTab === 'master' && activeMasterSubTab === 'barang'
                  ? isDarkMode
                    ? 'bg-slate-800 shadow-sm text-emerald-400 border-l-4 border-emerald-500 font-bold'
                    : 'bg-white shadow-sm text-blue-700 border-l-4 border-blue-600 font-bold'
                  : isDarkMode
                    ? 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
                    : 'hover:bg-white/55 text-slate-600 hover:text-slate-950'
              }`}
            >
              <span className="flex items-center gap-3">
                <Package className="w-3.5 h-3.5 shrink-0" />
                <span>Data Barang</span>
              </span>
              <span className="font-mono text-[9px] opacity-60">MAT/</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('master');
                setActiveMasterSubTab('kendaraan');
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-sm text-left transition-all text-xs font-semibold ${
                activeTab === 'master' && activeMasterSubTab === 'kendaraan'
                  ? isDarkMode
                    ? 'bg-slate-800 shadow-sm text-emerald-400 border-l-4 border-emerald-500 font-bold'
                    : 'bg-white shadow-sm text-blue-700 border-l-4 border-blue-600 font-bold'
                  : isDarkMode
                    ? 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
                    : 'hover:bg-white/55 text-slate-600 hover:text-slate-950'
              }`}
            >
              <span className="flex items-center gap-3">
                <Truck className="w-3.5 h-3.5 shrink-0" />
                <span>Kendaraan</span>
              </span>
              <span className="font-mono text-[9px] opacity-60">KND/</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('master');
                setActiveMasterSubTab('customer');
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-sm text-left transition-all text-xs font-semibold ${
                activeTab === 'master' && activeMasterSubTab === 'customer'
                  ? isDarkMode
                    ? 'bg-slate-800 shadow-sm text-emerald-400 border-l-4 border-emerald-500 font-bold'
                    : 'bg-white shadow-sm text-blue-700 border-l-4 border-blue-600 font-bold'
                  : isDarkMode
                    ? 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
                    : 'hover:bg-white/55 text-slate-600 hover:text-slate-950'
              }`}
            >
              <span className="flex items-center gap-3">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Customer</span>
              </span>
              <span className="font-mono text-[9px] opacity-60">CUS/</span>
            </button>

            {/* User administration */}
            <div className={`px-3 py-3 text-[10px] font-bold uppercase tracking-widest font-display border-t mt-3 ${
              isDarkMode ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-300'
            }`}>
              Administrasi
            </div>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-sm text-left transition-all text-xs font-semibold ${
                activeTab === 'users'
                  ? isDarkMode
                    ? 'bg-slate-800 shadow-sm text-emerald-400 border-l-4 border-emerald-500 font-bold'
                    : 'bg-white shadow-sm text-blue-700 border-l-4 border-blue-600 font-bold'
                  : isDarkMode
                    ? 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
                    : 'hover:bg-white/55 text-slate-600 hover:text-slate-950'
              }`}
            >
              <Shield className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              <span>Otorisasi &amp; Pengguna</span>
            </button>
            <button
              onClick={() => setActiveTab('sheets')}
              className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-sm text-left transition-all text-xs font-semibold ${
                activeTab === 'sheets'
                  ? isDarkMode
                    ? 'bg-slate-800 shadow-sm text-emerald-400 border-l-4 border-emerald-500 font-bold'
                    : 'bg-white shadow-sm text-blue-700 border-l-4 border-blue-600 font-bold'
                  : isDarkMode
                    ? 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
                    : 'hover:bg-white/55 text-slate-600 hover:text-slate-950'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              <span>Sinkronisasi Google Sheets</span>
            </button>
          </nav>

          {/* System Status Block */}
          <div className={`p-3 border-t transition-colors duration-300 ${
            isDarkMode ? 'border-slate-800 bg-slate-950/40 text-slate-400' : 'border-slate-300 bg-slate-200/50'
          }`}>
            <div className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wide flex items-center justify-between">
              <span>Sync Status:</span>
              {isSyncing && <RefreshCw className="w-2.5 h-2.5 animate-spin text-emerald-500" />}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className={`text-[10px] font-bold uppercase font-mono tracking-wider ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {isSyncing ? 'Synchronizing' : 'Terhubung'}
              </span>
            </div>
          </div>
        </aside>

        {/* Content Workspace Panel */}
        <main className={`flex-1 p-5 overflow-y-auto flex flex-col gap-5 min-w-0 transition-colors duration-300 ${
          isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F2F2F2] text-slate-800'
        }`}>
          {activeTab === 'penjualan' && (
            <PenjualanList
              data={salesList}
              onAddClick={() => {
                setSelectedTx(null);
                setIsFormOpen(true);
              }}
              onEditClick={(item) => {
                setSelectedTx(item);
                setIsFormOpen(true);
              }}
              onDeleteClick={handleDeleteTransaction}
              onImportClick={() => {
                setImportType('penjualan');
                setIsImportOpen(true);
              }}
            />
          )}

          {activeTab === 'laporan' && (
            <LaporanPenjualan
              data={salesList}
              customerList={customerList}
              barangList={barangList}
            />
          )}

          {activeTab === 'laporan_detail' && (
            <LaporanPenjualanDetail
              data={salesList}
              customerList={customerList}
              barangList={barangList}
              operatorName={operatorName}
              operatorRole={operatorRole}
            />
          )}

          {activeTab === 'master' && (
            <div className="space-y-4">
              {/* Inner Database Selector Header */}
              <div className={`border shadow-sm rounded-sm p-3 flex justify-between items-center transition-colors duration-300 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
              }`}>
                <div className={`flex items-center gap-1 text-xs font-bold uppercase font-display ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <Coins className="w-4 h-4 text-slate-600" />
                  <span>Navigasi Master Database</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setActiveMasterSubTab('alat')}
                    className={`px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      activeMasterSubTab === 'alat'
                        ? isDarkMode ? 'bg-emerald-600 text-white' : 'bg-[#1E293B] text-white'
                        : isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Alat Berat
                  </button>
                  <button
                    onClick={() => setActiveMasterSubTab('barang')}
                    className={`px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      activeMasterSubTab === 'barang'
                        ? isDarkMode ? 'bg-emerald-600 text-white' : 'bg-[#1E293B] text-white'
                        : isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Barang
                  </button>
                  <button
                    onClick={() => setActiveMasterSubTab('kendaraan')}
                    className={`px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      activeMasterSubTab === 'kendaraan'
                        ? isDarkMode ? 'bg-emerald-600 text-white' : 'bg-[#1E293B] text-white'
                        : isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Kendaraan
                  </button>
                  <button
                    onClick={() => setActiveMasterSubTab('customer')}
                    className={`px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      activeMasterSubTab === 'customer'
                        ? isDarkMode ? 'bg-emerald-600 text-white' : 'bg-[#1E293B] text-white'
                        : isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Customer
                  </button>
                </div>
              </div>

              {/* Sub-tab views render */}
              <div className={`border shadow-sm rounded-sm p-5 transition-colors duration-300 ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
              }`}>
                {activeMasterSubTab === 'alat' && (
                  <MasterAlatBerat
                    data={alatBeratList}
                    onAdd={handleAddAlatBerat}
                    onUpdate={handleUpdateAlatBerat}
                    onDelete={handleDeleteAlatBerat}
                    onImportClick={() => {
                      setImportType('alat');
                      setIsImportOpen(true);
                    }}
                  />
                )}

                {activeMasterSubTab === 'barang' && (
                  <MasterBarang
                    data={barangList}
                    onAdd={handleAddBarang}
                    onUpdate={handleUpdateBarang}
                    onDelete={handleDeleteBarang}
                    onImportClick={() => {
                      setImportType('barang');
                      setIsImportOpen(true);
                    }}
                  />
                )}

                {activeMasterSubTab === 'kendaraan' && (
                  <MasterKendaraan
                    data={kendaraanList}
                    onAdd={handleAddKendaraan}
                    onUpdate={handleUpdateKendaraan}
                    onDelete={handleDeleteKendaraan}
                    onImportClick={() => {
                      setImportType('kendaraan');
                      setIsImportOpen(true);
                    }}
                  />
                )}

                {activeMasterSubTab === 'customer' && (
                  <MasterCustomer
                    data={customerList}
                    onAdd={handleAddCustomer}
                    onUpdate={handleUpdateCustomer}
                    onDelete={handleDeleteCustomer}
                    onImportClick={() => {
                      setImportType('customer');
                      setIsImportOpen(true);
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <UserManagement
              currentUser={operatorName}
              currentRole={operatorRole}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'sheets' && (
            <GoogleSheetsSync
              isDarkMode={isDarkMode}
              salesList={salesList}
              alatBeratList={alatBeratList}
              barangList={barangList}
              kendaraanList={kendaraanList}
              customerList={customerList}
            />
          )}
        </main>
      </div>

      {/* 3. Footer Telemetry */}
      <footer className="bg-slate-200 h-6 border-t border-slate-300 flex items-center justify-between px-4 text-[9px] font-mono text-slate-500 shrink-0">
        <div>
          SISTEM PENJUALAN V.2.1 | LICENSED TO PT MAJU JAYA SELAMANYA HOLDING CORP
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="inline-block w-1 h-1 bg-blue-500 rounded-full"></span>
            CPU: 12%
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-1 h-1 bg-blue-500 rounded-full"></span>
            MEM: 480MB
          </span>
          <span className="text-slate-800 font-bold tracking-wider">{timeString || '24-10-2023 15:42:01'}</span>
        </div>
      </footer>

      {/* 4. Sales Form Modal Overlay */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedTx ? 'Ubah Slip Transaksi Penjualan' : 'Form Posting Penjualan Baru'}
        size="2xl"
      >
        <PenjualanForm
          initialData={selectedTx}
          salesList={salesList}
          kendaraanList={kendaraanList}
          customerList={customerList}
          barangList={barangList}
          alatBeratList={alatBeratList}
          onSubmit={(payload) => {
            if (selectedTx) {
              handleUpdateTransaction(payload as Penjualan);
            } else {
              handleAddTransaction(payload as Omit<Penjualan, 'id'>);
            }
          }}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* 5. Import Excel / CSV Modal Overlay */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        type={importType}
        barangList={barangList}
        customerList={customerList}
        onImport={(importedData) => {
          if (importType === 'penjualan') {
            handleImportSales(importedData);
          } else if (importType === 'alat') {
            handleImportAlatBerat(importedData);
          } else if (importType === 'barang') {
            handleImportBarang(importedData);
          } else if (importType === 'kendaraan') {
            handleImportKendaraan(importedData);
          } else if (importType === 'customer') {
            handleImportCustomer(importedData);
          }
        }}
      />

      {/* 6. Custom Clear Data Selection Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Pilih Data Yang Akan Dikosongkan"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xs text-xs text-amber-800 dark:text-amber-350">
            <p className="font-bold">⚠️ PERINGATAN:</p>
            <p className="mt-1 font-medium leading-relaxed">
              Data yang Anda pilih di bawah ini akan dihapus secara **permanen** dari penyimpanan lokal browser. Tindakan ini tidak dapat dibatalkan!
            </p>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Daftar Penyimpanan Data</span>
            <div className="flex gap-2 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setClearSelection({ sales: true, alat: true, barang: true, kendaraan: true, customer: true })}
                className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Pilih Semua
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setClearSelection({ sales: false, alat: false, barang: false, kendaraan: false, customer: false })}
                className="text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
              >
                Hapus Pilihan
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {/* Sales Option */}
            <label className="flex items-start gap-3 p-2.5 rounded-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={clearSelection.sales}
                onChange={(e) => setClearSelection(prev => ({ ...prev, sales: e.target.checked }))}
                className="mt-1 rounded-xs border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Main Menu (Transaksi Penjualan &amp; Logistik)
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Menghapus {salesList.length} riwayat slip penjualan, retribusi MEL, dan rincian logistik.
                </span>
              </div>
            </label>

            {/* Alat Berat Option */}
            <label className="flex items-start gap-3 p-2.5 rounded-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={clearSelection.alat}
                onChange={(e) => setClearSelection(prev => ({ ...prev, alat: e.target.checked }))}
                className="mt-1 rounded-xs border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Master Data Alat Berat
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Menghapus {alatBeratList.length} daftar armada excavator, loader, dll.
                </span>
              </div>
            </label>

            {/* Barang/Material Option */}
            <label className="flex items-start gap-3 p-2.5 rounded-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={clearSelection.barang}
                onChange={(e) => setClearSelection(prev => ({ ...prev, barang: e.target.checked }))}
                className="mt-1 rounded-xs border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Master Data Barang / Material
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Menghapus {barangList.length} komoditas material (Pasir, Batu, dll).
                </span>
              </div>
            </label>

            {/* Kendaraan Option */}
            <label className="flex items-start gap-3 p-2.5 rounded-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={clearSelection.kendaraan}
                onChange={(e) => setClearSelection(prev => ({ ...prev, kendaraan: e.target.checked }))}
                className="mt-1 rounded-xs border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Master Data Kendaraan / Truk
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Menghapus {kendaraanList.length} daftar nomor polisi armada logistik terdaftar.
                </span>
              </div>
            </label>

            {/* Customer Option */}
            <label className="flex items-start gap-3 p-2.5 rounded-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={clearSelection.customer}
                onChange={(e) => setClearSelection(prev => ({ ...prev, customer: e.target.checked }))}
                className="mt-1 rounded-xs border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Master Data Mitra / Customer
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Menghapus {customerList.length} pelanggan/perusahaan rekanan.
                </span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setIsClearModalOpen(false)}
              className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all rounded-xs cursor-pointer uppercase tracking-wider"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleEmptySelectedData(clearSelection)}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xs shadow-md transition-all cursor-pointer uppercase tracking-widest"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Kosongkan Data Terpilih
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

