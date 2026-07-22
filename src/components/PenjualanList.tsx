/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Penjualan } from '../types';
import { Search, Filter, FileSpreadsheet, Plus, Edit3, Trash2, Calendar, FileText, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

interface PenjualanListProps {
  data: Penjualan[];
  onAddClick: () => void;
  onEditClick: (item: Penjualan) => void;
  onDeleteClick: (id: string) => void;
  onImportClick?: () => void;
}

export default function PenjualanList({
  data,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onImportClick,
}: PenjualanListProps) {
  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivisi, setFilterDivisi] = useState<string>('ALL');
  const [filterTipe, setFilterTipe] = useState<string>('ALL');
  const [filterSatuan, setFilterSatuan] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<keyof Penjualan>('tanggal');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Clear all filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilterDivisi('ALL');
    setFilterTipe('ALL');
    setFilterSatuan('ALL');
    setStartDate('');
    setEndDate('');
  };

  // Sorting handler
  const handleSort = (field: keyof Penjualan) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter application
  const filteredData = data.filter((item) => {
    // 1. Text Search
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      item.noInvoice.toLowerCase().includes(searchLower) ||
      item.noPolisi.toLowerCase().includes(searchLower) ||
      item.sopir.toLowerCase().includes(searchLower) ||
      item.namaCustomer.toLowerCase().includes(searchLower) ||
      item.namaBarang.toLowerCase().includes(searchLower) ||
      (item.namaAlat && item.namaAlat.toLowerCase().includes(searchLower)) ||
      (item.keterangan && item.keterangan.toLowerCase().includes(searchLower));

    // 2. Division Filter
    const matchesDivisi = filterDivisi === 'ALL' || item.divisi === filterDivisi;

    // 3. Tipe Penjualan Filter
    const matchesTipe = filterTipe === 'ALL' || item.tipePenjualan === filterTipe;

    // 4. Satuan Filter
    const matchesSatuan = filterSatuan === 'ALL' || item.satuan === filterSatuan;

    // 5. Date range
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && item.tanggal >= startDate;
    }
    if (endDate) {
      matchesDate = matchesDate && item.tanggal <= endDate;
    }

    return matchesSearch && matchesDivisi && matchesTipe && matchesSatuan && matchesDate;
  });

  // Sort application
  const sortedData = [...filteredData].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = (valB as string).toLowerCase();
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Export to Excel function using sheetjs
  const handleExportExcel = () => {
    const formattedRows = sortedData.map((item, index) => ({
      'No.': index + 1,
      'Tanggal': item.tanggal,
      'Divisi': item.divisi,
      'Tipe Penjualan': item.tipePenjualan,
      'No Invoice / DO': item.noInvoice,
      'No Polisi': item.noPolisi,
      'Sopir': item.sopir,
      'Status Kendaraan': item.statusKendaraan,
      'Kode Customer': item.kodeCustomer,
      'Nama Customer': item.namaCustomer,
      'Kode Barang': item.kodeBarang,
      'Nama Barang': item.namaBarang,
      'Satuan': item.satuan,
      'Kuantiti': item.kuantiti,
      'Harga Satuan (Rp)': item.harga,
      'Diskon (Rp)': item.diskon,
      'Total Penjualan (Rp)': item.total,
      'Kode Alat Berat': item.kodeAlat || '-',
      'Nama Alat Berat': item.namaAlat || '-',
      'Nilai MEL (Rp)': item.mel,
      'Keterangan': item.keterangan || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksi Penjualan');

    // Add styled column widths for Excel
    const wscols = [
      { wch: 5 },  // No.
      { wch: 12 }, // Tanggal
      { wch: 15 }, // Divisi
      { wch: 15 }, // Tipe Penjualan
      { wch: 20 }, // No Invoice / DO
      { wch: 15 }, // No Polisi
      { wch: 20 }, // Sopir
      { wch: 15 }, // Status Kendaraan
      { wch: 15 }, // Kode Customer
      { wch: 25 }, // Nama Customer
      { wch: 15 }, // Kode Barang
      { wch: 25 }, // Nama Barang
      { wch: 10 }, // Satuan
      { wch: 10 }, // Kuantiti
      { wch: 15 }, // Harga Satuan
      { wch: 12 }, // Diskon
      { wch: 18 }, // Total Penjualan
      { wch: 15 }, // Kode Alat
      { wch: 25 }, // Nama Alat
      { wch: 15 }, // Nilai MEL
      { wch: 30 }, // Keterangan
    ];
    worksheet['!cols'] = wscols;

    const todayStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Laporan_Penjualan_Maju_Jaya_${todayStr}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-300 rounded-sm p-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Total Transaksi</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{filteredData.length} records</p>
          <p className="text-[9px] text-slate-400">Sesuai filter aktif</p>
        </div>
        <div className="bg-white border border-slate-300 rounded-sm p-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Total Omset</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5 font-mono">
            Rp {filteredData.reduce((acc, curr) => acc + curr.total, 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[9px] text-slate-400">Sum(qty * (harga-diskon))</p>
        </div>
        <div className="bg-white border border-slate-300 rounded-sm p-3 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">Total Kuantiti</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5 font-mono">
            {filteredData.reduce((acc, curr) => acc + curr.kuantiti, 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[9px] text-slate-400">Total volume ritase/tonase</p>
        </div>
        <div className="bg-white border border-slate-300 rounded-sm p-3 shadow-sm">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest font-display">Total Retribusi MEL</p>
          <p className="text-xl font-bold text-amber-700 mt-0.5 font-mono">
            Rp {filteredData.reduce((acc, curr) => acc + curr.mel * curr.kuantiti, 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[9px] text-slate-400">Mel * Kuantiti (Manyung = 0)</p>
        </div>
      </div>

      {/* 2. Filters Card */}
      <div className="bg-white border border-slate-300 rounded-sm p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-700 text-xs font-display uppercase tracking-wider">Filter &amp; Pencarian Data</h3>
          </div>
          <button
            onClick={resetFilters}
            className="text-[10px] font-bold text-slate-500 hover:text-blue-700 uppercase tracking-wider cursor-pointer"
          >
            Reset Semua Filter
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* General Text Search */}
          <div className="md:col-span-2">
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pencarian Kata Kunci
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                id="search-penjualan"
                type="text"
                placeholder="Cari Invoice, No Polisi, Sopir, Customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-sm bg-slate-50 text-slate-750 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Divisi Filter */}
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Divisi</label>
            <select
              value={filterDivisi}
              onChange={(e) => setFilterDivisi(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-slate-300 rounded-sm bg-slate-50 text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Divisi</option>
              <option value="Tambang">Tambang</option>
              <option value="Cucian">Cucian</option>
              <option value="Transportasi">Transportasi</option>
              <option value="Alat Berat">Alat Berat</option>
              <option value="Holding">Holding</option>
              <option value="Magetan">Magetan</option>
            </select>
          </div>

          {/* Tipe Penjualan Filter */}
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tipe Penjualan
            </label>
            <select
              value={filterTipe}
              onChange={(e) => setFilterTipe(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-slate-300 rounded-sm bg-slate-50 text-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Tipe</option>
              <option value="Tunai">Tunai</option>
              <option value="Non Tunai">Non Tunai</option>
              <option value="Transfer">Transfer</option>
              <option value="DP">DP</option>
            </select>
          </div>

          {/* Satuan Filter */}
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Satuan</label>
            <select
              value={filterSatuan}
              onChange={(e) => setFilterSatuan(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-slate-300 rounded-sm bg-slate-50 text-slate-700 focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Satuan</option>
              <option value="RIT">RIT</option>
              <option value="KUBIK">KUBIK</option>
              <option value="TON">TON</option>
              <option value="TRONTON">TRONTON</option>
            </select>
          </div>

          {/* Date range filters */}
          <div className="flex gap-1.5 md:col-span-1 lg:col-span-1">
            <div className="flex-1">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-1.5 py-1 text-[10px] border border-slate-300 rounded-sm bg-slate-50 text-slate-700 font-mono"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Selesai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-1.5 py-1 text-[10px] border border-slate-300 rounded-sm bg-slate-50 text-slate-700 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Actions Row */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <h3 className="text-xs font-bold text-slate-700 font-display flex items-center gap-1.5 uppercase tracking-wide">
          <FileText className="w-4 h-4 text-blue-600" />
          Daftar Surat Jalan &amp; Invoice Penjualan
        </h3>
        <div className="flex gap-1.5">
          <button
            id="btn-export-excel"
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-300 rounded-sm transition-all cursor-pointer uppercase tracking-wider"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Excel
          </button>
          {onImportClick && (
            <button
              id="btn-import-excel"
              onClick={onImportClick}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-805 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-300 rounded-sm transition-all cursor-pointer uppercase tracking-wider"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Excel
            </button>
          )}
          <button
            id="btn-tambah-transaksi"
            onClick={onAddClick}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-sm transition-all shadow-sm cursor-pointer uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            Posting Transaksi
          </button>
        </div>
      </div>

      {/* 4. Transactions Table */}
      <div className="overflow-hidden bg-white border border-slate-300 rounded-sm shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                <th onClick={() => handleSort('tanggal')} className="px-3.5 py-2 cursor-pointer hover:bg-slate-200/55 select-none border-r border-slate-200">
                  Tanggal {sortField === 'tanggal' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('noInvoice')} className="px-3.5 py-2 cursor-pointer hover:bg-slate-200/55 select-none border-r border-slate-200">
                  No Invoice/DO {sortField === 'noInvoice' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('divisi')} className="px-3.5 py-2 cursor-pointer hover:bg-slate-200/55 select-none border-r border-slate-200">
                  Divisi/Tipe {sortField === 'divisi' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('namaCustomer')} className="px-3.5 py-2 cursor-pointer hover:bg-slate-200/55 select-none border-r border-slate-200">
                  Customer/Barang {sortField === 'namaCustomer' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('noPolisi')} className="px-3.5 py-2 cursor-pointer hover:bg-slate-200/55 select-none border-r border-slate-200">
                  Armada &amp; Sopir {sortField === 'noPolisi' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('kuantiti')} className="px-3.5 py-2 text-right cursor-pointer hover:bg-slate-200/55 select-none border-r border-slate-200">
                  Kuantiti/Satuan {sortField === 'kuantiti' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('total')} className="px-3.5 py-2 text-right cursor-pointer hover:bg-slate-200/55 select-none border-r border-slate-200">
                  Total (Rp) {sortField === 'total' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-3.5 py-2 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px] text-slate-700 font-sans">
              {sortedData.length > 0 ? (
                sortedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {/* Tanggal */}
                    <td className="px-3.5 py-2 font-mono text-slate-600 font-medium border-r border-slate-200 whitespace-nowrap">
                      {item.tanggal}
                    </td>

                    {/* Invoice */}
                    <td className="px-3.5 py-2 border-r border-slate-200">
                      <div className="font-mono font-bold text-slate-800">{item.noInvoice}</div>
                      {item.keterangan && (
                        <div className="text-[10px] text-slate-400 max-w-xs truncate" title={item.keterangan}>
                          {item.keterangan}
                        </div>
                      )}
                    </td>

                    {/* Divisi & Tipe */}
                    <td className="px-3.5 py-2 border-r border-slate-200">
                      <div className="font-semibold text-slate-800">{item.divisi}</div>
                      <div>
                        <span className="text-[9px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded-xs font-semibold">
                          {item.tipePenjualan}
                        </span>
                      </div>
                    </td>

                    {/* Customer & Barang */}
                    <td className="px-3.5 py-2 border-r border-slate-200">
                      <div className="font-semibold text-slate-800">
                        {item.namaCustomer}
                        {item.namaCustomer.toLowerCase() === 'manyung' && (
                          <span className="ml-1 px-1 bg-amber-100 text-amber-800 rounded-xs text-[8px] font-bold">
                            MEL 0
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <span className="text-[9px] bg-slate-100 text-slate-700 px-0.5 rounded-xs font-semibold font-mono">{item.kodeBarang}</span>
                        <span className="truncate max-w-[120px]">{item.namaBarang}</span>
                      </div>
                    </td>

                    {/* Armada & Sopir */}
                    <td className="px-3.5 py-2 border-r border-slate-200">
                      <div className="font-mono font-bold text-slate-700">{item.noPolisi}</div>
                      <div className="text-slate-500 flex items-center gap-1">
                        <span>{item.sopir}</span>
                        <span className={`text-[8px] font-bold px-0.5 rounded-xs ${
                          item.statusKendaraan === 'INTERNAL' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {item.statusKendaraan}
                        </span>
                      </div>
                      {item.kodeAlat && (
                        <div className="text-[9px] text-slate-400 bg-slate-50 border border-slate-200 rounded-xs py-0.2 px-1 mt-1 max-w-fit font-sans">
                          Alat: <span className="font-mono font-bold text-slate-600">{item.kodeAlat}</span>
                        </div>
                      )}
                    </td>

                    {/* Kuantiti & Satuan */}
                    <td className="px-3.5 py-2 text-right font-mono font-bold border-r border-slate-200">
                      <div className="text-slate-800">{item.kuantiti}</div>
                      <div className="text-[9px] text-slate-400 font-sans font-medium uppercase">{item.satuan}</div>
                    </td>

                    {/* Total (Rp) */}
                    <td className="px-3.5 py-2 text-right font-mono font-bold border-r border-slate-200">
                      <div className="text-slate-800">{item.total.toLocaleString('id-ID')}</div>
                      <div className="text-[9px] text-slate-400 font-sans font-normal">
                        MEL: {(item.mel * item.kuantiti).toLocaleString('id-ID')}
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="px-3.5 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          id={`btn-edit-tx-${item.id}`}
                          onClick={() => onEditClick(item)}
                          className="p-1 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-sm"
                          title="Ubah Transaksi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-delete-tx-${item.id}`}
                          onClick={() => {
                            if (confirm(`Hapus transaksi ${item.noInvoice} untuk ${item.namaCustomer}?`)) {
                              onDeleteClick(item.id);
                            }
                          }}
                          className="p-1 text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded-sm"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-sm">
                    Tidak ada transaksi penjualan ditemukan yang cocok dengan kriteria filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
