/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Penjualan, Customer, Barang } from '../types';
import {
  Calendar,
  TrendingUp,
  ShieldAlert,
  Award,
  Database,
  Percent,
  Search,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface LaporanPenjualanProps {
  data: Penjualan[];
  customerList: Customer[];
  barangList: Barang[];
}

export default function LaporanPenjualan({
  data,
  customerList,
  barangList,
}: LaporanPenjualanProps) {
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  // Detail table search & pagination state
  const [searchTermDetail, setSearchTermDetail] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter data based on date and customer selection
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      let matches = true;
      if (startDate) matches = matches && item.tanggal >= startDate;
      if (endDate) matches = matches && item.tanggal <= endDate;
      if (selectedCustomerId) matches = matches && item.kodeCustomer === selectedCustomerId;
      return matches;
    });
  }, [data, startDate, endDate, selectedCustomerId]);

  // Calculations for KPI Cards & Graphs
  const metrics = useMemo(() => {
    let totalSales = 0;
    let totalDiscount = 0;
    let totalMel = 0;
    let totalQty = 0;

    // Satuan totals
    const qtyBySatuan: Record<string, number> = { RIT: 0, KUBIK: 0, TON: 0, TRONTON: 0 };

    // Division totals
    const salesByDivisi: Record<string, number> = {
      Tambang: 0,
      Cucian: 0,
      Transportasi: 0,
      'Alat Berat': 0,
      Holding: 0,
      Magetan: 0,
    };

    // Tipe Penjualan totals
    const salesByTipe: Record<string, number> = {
      Tunai: 0,
      'Non Tunai': 0,
      Transfer: 0,
      DP: 0,
    };

    // Customer totals
    const salesByCustomer: Record<string, { name: string; total: number; qty: number }> = {};

    // Material totals
    const salesByBarang: Record<string, { name: string; melTotal: number; salesTotal: number }> = {};

    filteredData.forEach((item) => {
      totalSales += item.total;
      totalDiscount += item.diskon * item.kuantiti;
      totalMel += item.mel * item.kuantiti;
      totalQty += item.kuantiti;

      if (qtyBySatuan[item.satuan] !== undefined) {
        qtyBySatuan[item.satuan] += item.kuantiti;
      }

      if (salesByDivisi[item.divisi] !== undefined) {
        salesByDivisi[item.divisi] += item.total;
      }

      if (salesByTipe[item.tipePenjualan] !== undefined) {
        salesByTipe[item.tipePenjualan] += item.total;
      }

      // Customer
      if (!salesByCustomer[item.kodeCustomer]) {
        salesByCustomer[item.kodeCustomer] = { name: item.namaCustomer, total: 0, qty: 0 };
      }
      salesByCustomer[item.kodeCustomer].total += item.total;
      salesByCustomer[item.kodeCustomer].qty += item.kuantiti;

      // Material MEL
      if (!salesByBarang[item.kodeBarang]) {
        salesByBarang[item.kodeBarang] = { name: item.namaBarang, melTotal: 0, salesTotal: 0 };
      }
      salesByBarang[item.kodeBarang].melTotal += item.mel * item.kuantiti;
      salesByBarang[item.kodeBarang].salesTotal += item.total;
    });

    return {
      totalSales,
      totalDiscount,
      totalMel,
      totalQty,
      qtyBySatuan,
      salesByDivisi,
      salesByTipe,
      salesByCustomer: Object.values(salesByCustomer).sort((a, b) => b.total - a.total),
      salesByBarang: Object.values(salesByBarang).sort((a, b) => b.melTotal - a.melTotal),
    };
  }, [filteredData]);

  // Filter detailed list based on additional detail search bar
  const finalDetailedList = useMemo(() => {
    return filteredData.filter((item) => {
      if (!searchTermDetail) return true;
      const term = searchTermDetail.toLowerCase();
      return (
        item.noInvoice.toLowerCase().includes(term) ||
        item.namaCustomer.toLowerCase().includes(term) ||
        item.namaBarang.toLowerCase().includes(term) ||
        item.sopir.toLowerCase().includes(term) ||
        item.noPolisi.toLowerCase().includes(term) ||
        item.divisi.toLowerCase().includes(term) ||
        item.tipePenjualan.toLowerCase().includes(term)
      );
    });
  }, [filteredData, searchTermDetail]);

  // Reset pagination when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTermDetail, selectedCustomerId, startDate, endDate]);

  // Paginated data
  const paginatedDetails = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return finalDetailedList.slice(startIndex, startIndex + itemsPerPage);
  }, [finalDetailedList, currentPage]);

  const totalPages = Math.ceil(finalDetailedList.length / itemsPerPage) || 1;

  // Export Filtered/Detailed Sales Data to Excel
  const handleExportDetailExcel = () => {
    const formattedRows = finalDetailedList.map((item, idx) => ({
      'No.': idx + 1,
      'Tanggal': item.tanggal,
      'No. Invoice': item.noInvoice,
      'Divisi': item.divisi,
      'Customer ID': item.kodeCustomer,
      'Nama Customer': item.namaCustomer,
      'Barang / Material': item.namaBarang,
      'Kuantiti': item.kuantiti,
      'Satuan': item.satuan,
      'Harga Satuan (Rp)': item.harga,
      'Diskon Satuan (Rp)': item.diskon,
      'Retribusi MEL (Rp)': item.mel,
      'Tipe Pembayaran': item.tipePenjualan,
      'No. Polisi': item.noPolisi,
      'Sopir': item.sopir,
      'Status Kendaraan': item.statusKendaraan,
      'Total Netto (Rp)': item.total,
      'Keterangan / Memo': item.keterangan || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Penjualan Detail');

    // Sizing columns
    const wscols = [
      { wch: 5 },   // No.
      { wch: 12 },  // Tanggal
      { wch: 15 },  // No Invoice
      { wch: 12 },  // Divisi
      { wch: 12 },  // Customer ID
      { wch: 25 },  // Nama Customer
      { wch: 20 },  // Barang / Material
      { wch: 10 },  // Kuantiti
      { wch: 8 },   // Satuan
      { wch: 15 },  // Harga Satuan
      { wch: 15 },  // Diskon
      { wch: 15 },  // Retribusi MEL
      { wch: 15 },  // Tipe Pembayaran
      { wch: 12 },  // No. Polisi
      { wch: 15 },  // Sopir
      { wch: 12 },  // Status Kendaraan
      { wch: 18 },  // Total Netto
      { wch: 25 },  // Keterangan
    ];
    worksheet['!cols'] = wscols;

    const todayStr = new Date().toISOString().slice(0, 10);
    let filename = `Laporan_Penjualan_Detail_${todayStr}.xlsx`;
    if (selectedCustomerId) {
      filename = `Laporan_Penjualan_${selectedCustomerId}_Detail_${todayStr}.xlsx`;
    }
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="space-y-6">
      {/* 1. Filtering & Control Panel */}
      <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-sm p-5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors duration-300">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-display flex items-center gap-1.5 uppercase tracking-wide">
            <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Filter &amp; Analisis Laporan Penjualan
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Terfilter <span className="font-bold text-emerald-600 dark:text-emerald-400">{filteredData.length}</span> dari <span className="font-mono">{data.length}</span> total transaksi logistik.
          </p>
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Customer Selection */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              Customer:
            </span>
            <select
              id="report-filter-customer"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-sm border border-slate-300 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-hidden font-semibold focus:ring-1 focus:ring-emerald-500 transition-all"
            >
              <option value="">-- Semua Customer --</option>
              {customerList.map((c) => (
                <option key={c.id} value={c.kodeCustomer}>
                  {c.kodeCustomer} - {c.namaCustomer}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker - Start */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dari:</span>
            <input
              id="report-filter-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-sm border border-slate-300 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-hidden font-mono focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Date Picker - End */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sampai:</span>
            <input
              id="report-filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-sm border border-slate-300 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-hidden font-mono focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Reset button if filter is active */}
          {(startDate || endDate || selectedCustomerId) && (
            <button
              id="btn-reset-report-filters"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedCustomerId('');
              }}
              className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-400 px-3 py-1.5 rounded-sm border border-rose-200 dark:border-rose-900 transition-all cursor-pointer uppercase tracking-wider"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Omset */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-sm p-5 shadow-md relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-10">
            <TrendingUp className="w-32 h-32" />
          </div>
          <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest">Total Nilai Penjualan</p>
          <h2 className="text-xl lg:text-2xl font-black font-mono tracking-tight mt-1">
            Rp {metrics.totalSales.toLocaleString('id-ID')}
          </h2>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-100 mt-2.5 font-semibold tracking-wide uppercase">
            <span>Rerata: Rp {filteredData.length ? Math.round(metrics.totalSales / filteredData.length).toLocaleString('id-ID') : 0} / tx</span>
          </div>
        </div>

        {/* Total Diskon */}
        <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-sm p-5 shadow-xs flex items-start gap-4 transition-colors duration-300">
          <div className="p-3 bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 rounded-sm">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Diskon Diberikan</p>
            <h2 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight mt-0.5">
              Rp {metrics.totalDiscount.toLocaleString('id-ID')}
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {metrics.totalSales ? ((metrics.totalDiscount / (metrics.totalSales + metrics.totalDiscount)) * 100).toFixed(1) : 0}% dari subtotal kotor
            </p>
          </div>
        </div>

        {/* Total Retribusi MEL */}
        <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-sm p-5 shadow-xs flex items-start gap-4 transition-colors duration-300">
          <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 rounded-sm">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pendapatan MEL</p>
            <h2 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight mt-0.5">
              Rp {metrics.totalMel.toLocaleString('id-ID')}
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              Retribusi Material Lingkungan
            </p>
          </div>
        </div>

        {/* Total Kuantiti / Volume */}
        <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-sm p-5 shadow-xs flex items-start gap-4 transition-colors duration-300">
          <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 rounded-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Volume Terjual</p>
            <h2 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight mt-0.5">
              {metrics.totalQty.toLocaleString('id-ID')}
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              Kumulatif seluruh komoditas
            </p>
          </div>
        </div>
      </div>

      {/* 3. Volume Breakdown Block */}
      <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-sm p-4 shadow-xs transition-colors duration-300">
        <h4 className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
          Volume Penjualan Berdasarkan Satuan Ukur
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {(Object.entries(metrics.qtyBySatuan) as [string, number][]).map(([sat, qty]) => (
            <div key={sat} className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-sm border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 tracking-wider block mb-1 uppercase">{sat}</span>
              <span className="text-lg font-mono font-bold text-slate-800 dark:text-slate-200">{qty.toLocaleString('id-ID')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Graphical Analytics (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Omset per Divisi */}
        <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-sm p-5 shadow-xs flex flex-col justify-between transition-colors duration-300">
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-4">
              Omset Penjualan Berdasarkan Divisi
            </h4>
            <div className="space-y-4">
              {(Object.entries(metrics.salesByDivisi) as [string, number][]).map(([divisi, sales]) => {
                const percentage = metrics.totalSales ? (sales / metrics.totalSales) * 100 : 0;
                return (
                  <div key={divisi} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-650 dark:text-slate-350 font-bold">{divisi}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono font-semibold">
                        Rp {sales.toLocaleString('id-ID')} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-sm overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-sm transition-all duration-500"
                        style={{ width: `${Math.max(1, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 2: Pembayaran */}
        <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-sm p-5 shadow-xs flex flex-col justify-between transition-colors duration-300">
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-4">
              Pola Pembayaran (Tipe Penjualan)
            </h4>
            <div className="space-y-4">
              {(Object.entries(metrics.salesByTipe) as [string, number][]).map(([tipe, sales]) => {
                const percentage = metrics.totalSales ? (sales / metrics.totalSales) * 100 : 0;
                return (
                  <div key={tipe} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-650 dark:text-slate-350 font-bold">{tipe}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-mono font-semibold">
                        Rp {sales.toLocaleString('id-ID')} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-sm overflow-hidden">
                      <div
                        className="bg-[#1E293B] dark:bg-emerald-500 h-full rounded-sm transition-all duration-500"
                        style={{ width: `${Math.max(1, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Customers & MEL Contribution grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-sm p-5 shadow-xs transition-colors duration-300">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-3 flex items-center justify-between">
            <span>Top Customer Terbesar</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Urutan Omset</span>
          </h4>
          <div className="divide-y divide-slate-150 dark:divide-slate-800">
            {metrics.salesByCustomer.slice(0, 5).map((cust, i) => (
              <div key={cust.name} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-800' : i === 1 ? 'bg-slate-150 text-slate-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cust.name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{cust.qty.toLocaleString('id-ID')} unit volume</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">Rp {cust.total.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
            {metrics.salesByCustomer.length === 0 && (
              <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">Belum ada data customer terdaftar.</div>
            )}
          </div>
        </div>

        {/* MEL Contribution per Material */}
        <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-sm p-5 shadow-xs transition-colors duration-300">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 mb-3 flex items-center justify-between">
            <span>Kontribusi MEL per Material</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Urutan MEL</span>
          </h4>
          <div className="divide-y divide-slate-150 dark:divide-slate-800">
            {metrics.salesByBarang.map((b) => (
              <div key={b.name} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{b.name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Total Omset: Rp {b.salesTotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900 px-2.5 py-1 rounded-sm">
                    MEL: Rp {b.melTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
            {metrics.salesByBarang.length === 0 && (
              <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">Belum ada data barang terdaftar.</div>
            )}
          </div>
        </div>
      </div>

      {/* 6. NEW SECTION: LAPORAN PENJUALAN DETAIL TABLE WITH EXCEL EXPORT */}
      <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-sm p-5 shadow-md transition-colors duration-300">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-150 dark:border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm font-display uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Laporan Penjualan Detail &amp; Log Logistik
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-0.5">
              Menampilkan rincian baris demi baris transaksi sesuai filter aktif.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </span>
              <input
                id="report-detail-search"
                type="text"
                placeholder="Cari Invoice, Sopir, Barang..."
                value={searchTermDetail}
                onChange={(e) => setSearchTermDetail(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-sm border border-slate-300 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 outline-hidden w-56 focus:ring-1 focus:ring-emerald-500 font-semibold"
              />
            </div>

            {/* Export Excel Button */}
            <button
              id="btn-export-report-excel"
              onClick={handleExportDetailExcel}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900 rounded-sm transition-all cursor-pointer uppercase tracking-wider"
              title="Download detail filter ke file Excel spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Excel Detail ({finalDetailedList.length})
            </button>
          </div>
        </div>

        {/* Detailed Data Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-3 text-center w-10">No</th>
                <th className="py-2.5 px-3">Invoice</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Divisi</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Barang/Material</th>
                <th className="py-2.5 px-3 text-right">Kuantiti</th>
                <th className="py-2.5 px-3 text-right">Harga</th>
                <th className="py-2.5 px-3 text-right">Diskon</th>
                <th className="py-2.5 px-3 text-right">MEL</th>
                <th className="py-2.5 px-3 text-center">Tipe</th>
                <th className="py-2.5 px-3 text-right">Total Netto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-850 text-xs text-slate-700 dark:text-slate-300">
              {paginatedDetails.map((item, index) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors"
                  >
                    <td className="py-2 px-3 text-center font-mono text-[10px] text-slate-400">
                      {globalIndex}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-[11px] text-slate-900 dark:text-slate-200">
                      {item.noInvoice}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px]">
                      {item.tanggal}
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold rounded-sm uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.divisi}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-850 dark:text-slate-200">
                        {item.namaCustomer}
                      </div>
                      <div className="text-[10px] text-slate-450 dark:text-slate-500 font-mono">
                        {item.kodeCustomer}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-semibold">{item.namaBarang}</div>
                      {item.namaAlat && (
                        <div className="text-[9px] text-amber-600 dark:text-amber-450 font-bold uppercase tracking-wide">
                          Sewa: {item.namaAlat}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold">
                      {item.kuantiti.toLocaleString('id-ID')} <span className="text-[9px] font-bold text-slate-400 uppercase">{item.satuan}</span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      Rp {item.harga.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-rose-600 dark:text-rose-450">
                      Rp {item.diskon.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-amber-600 dark:text-amber-450">
                      Rp {item.mel.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-block px-1.5 py-0.5 text-[9px] font-extrabold rounded-sm uppercase tracking-wide ${
                        item.tipePenjualan === 'Tunai'
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-450'
                          : item.tipePenjualan === 'Transfer'
                          ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-450'
                          : 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-450'
                      }`}>
                        {item.tipePenjualan}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-emerald-400">
                      Rp {item.total.toLocaleString('id-ID')}
                    </td>
                  </tr>
                );
              })}
              {finalDetailedList.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                    Tidak ada transaksi detail yang cocok dengan kriteria filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer bar */}
        {finalDetailedList.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 text-xs font-semibold text-slate-500 dark:text-slate-450">
            <div>
              Menampilkan <span className="text-slate-800 dark:text-slate-200 font-bold">{Math.min(finalDetailedList.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(finalDetailedList.length, currentPage * itemsPerPage)}</span> dari <span className="text-slate-800 dark:text-slate-200 font-bold font-mono">{finalDetailedList.length}</span> baris
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
