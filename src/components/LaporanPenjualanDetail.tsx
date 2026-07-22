/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Penjualan, Customer, Barang } from '../types';
import {
  Printer,
  FileText,
  Search,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  Settings,
  Info,
  CheckCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface LaporanPenjualanDetailProps {
  data: Penjualan[];
  customerList: Customer[];
  barangList: Barang[];
  operatorName: string;
  operatorRole: string;
}

export default function LaporanPenjualanDetail({
  data,
  customerList,
  barangList,
  operatorName,
  operatorRole,
}: LaporanPenjualanDetailProps) {
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Page setup states for Print/PDF
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'Legal'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [isCompact, setIsCompact] = useState<boolean>(true);

  // Pagination for screen view and print (can be number or 'all')
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(15);

  // Filter the data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      let matches = true;
      if (startDate) matches = matches && item.tanggal >= startDate;
      if (endDate) matches = matches && item.tanggal <= endDate;
      if (selectedCustomerId) matches = matches && item.kodeCustomer === selectedCustomerId;
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        matches = matches && (
          item.noInvoice.toLowerCase().includes(term) ||
          item.namaCustomer.toLowerCase().includes(term) ||
          item.namaBarang.toLowerCase().includes(term) ||
          item.sopir.toLowerCase().includes(term) ||
          item.noPolisi.toLowerCase().includes(term) ||
          item.divisi.toLowerCase().includes(term)
        );
      }
      return matches;
    });
  }, [data, startDate, endDate, selectedCustomerId, searchTerm]);

  // Reset pagination on filter or page size change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, selectedCustomerId, searchTerm, itemsPerPage]);

  // Pagination slice for UI screen representation & matching print sheet exactly
  const paginatedData = useMemo(() => {
    if (itemsPerPage === 'all') return filteredData;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    if (itemsPerPage === 'all') return 1;
    return Math.ceil(filteredData.length / itemsPerPage) || 1;
  }, [filteredData, itemsPerPage]);

  // Grand totals of the filtered dataset (shown in screen-only cards)
  const filteredAggregates = useMemo(() => {
    let totalQty = 0;
    let totalDiskon = 0;
    let totalMel = 0;
    let totalNetto = 0;

    filteredData.forEach((item) => {
      totalQty += item.kuantiti;
      totalDiskon += item.diskon * item.kuantiti;
      totalMel += item.mel * item.kuantiti;
      totalNetto += item.total;
    });

    return { totalQty, totalDiskon, totalMel, totalNetto };
  }, [filteredData]);

  // Active preview page totals (printed on sheet & preview matching)
  const previewAggregates = useMemo(() => {
    let totalQty = 0;
    let totalDiskon = 0;
    let totalMel = 0;
    let totalNetto = 0;

    paginatedData.forEach((item) => {
      totalQty += item.kuantiti;
      totalDiskon += item.diskon * item.kuantiti;
      totalMel += item.mel * item.kuantiti;
      totalNetto += item.total;
    });

    return { totalQty, totalDiskon, totalMel, totalNetto };
  }, [paginatedData]);

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel helper
  const handleExportExcel = () => {
    const rows = filteredData.map((item, idx) => ({
      'No.': idx + 1,
      'Tanggal': item.tanggal,
      'No. Invoice': item.noInvoice,
      'Divisi': item.divisi,
      'Customer ID': item.kodeCustomer,
      'Nama Customer': item.namaCustomer,
      'Barang / Material': item.namaBarang,
      'Alat Berat Terkait': item.namaAlat || '-',
      'Kuantiti': item.kuantiti,
      'Satuan': item.satuan,
      'Harga Satuan (Rp)': item.harga,
      'Diskon Satuan (Rp)': item.diskon,
      'Retribusi MEL (Rp)': item.mel,
      'Tipe Pembayaran': item.tipePenjualan,
      'No. Polisi': item.noPolisi,
      'Sopir': item.sopir,
      'Total Netto (Rp)': item.total,
      'Memo': item.keterangan || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan_Detail');

    // Width adjustments
    worksheet['!cols'] = [
      { wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
      { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 8 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
      { wch: 15 }, { wch: 18 }, { wch: 25 }
    ];

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Laporan_Detail_Penjualan_${today}.xlsx`);
  };

  // Format date readable
  const formattedToday = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date().toLocaleDateString('id-ID', options);
  }, []);

  // Format simple period string
  const periodString = useMemo(() => {
    if (startDate && endDate) return `${startDate} s/d ${endDate}`;
    if (startDate) return `Sejak ${startDate}`;
    if (endDate) return `Hingga ${endDate}`;
    return 'Seluruh Periode';
  }, [startDate, endDate]);

  // CSS page setup string injection for actual print layout sizes
  const dynamicPrintStyle = useMemo(() => {
    const sizeConfig = {
      A4: { portrait: '210mm 297mm', landscape: '297mm 210mm' },
      Letter: { portrait: '8.5in 11in', landscape: '11in 8.5in' },
      Legal: { portrait: '8.5in 14in', landscape: '14in 8.5in' },
    };
    const targetSize = sizeConfig[paperSize]?.[orientation] || '297mm 210mm';

    return `
      @media print {
        /* Hide app chrome completely */
        body {
          background-color: white !important;
          color: black !important;
        }
        header, aside, main > *:not(#printable-report-wrapper), .no-print {
          display: none !important;
        }
        /* Make parent containers un-styled and full-width */
        main {
          padding: 0 !important;
          margin: 0 !important;
          background: transparent !important;
        }
        #printable-report-wrapper {
          display: block !important;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          padding: 0 !important;
          margin: 0 !important;
          box-shadow: none !important;
          border: none !important;
          background: white !important;
        }
        @page {
          size: ${targetSize};
          margin: 12mm 10mm 12mm 10mm;
        }
        tr {
          page-break-inside: avoid !important;
        }
        thead {
          display: table-header-group !important;
        }
      }
    `;
  }, [paperSize, orientation]);

  return (
    <div className="space-y-6">
      {/* Dynamic style tag for standard window.print formatting */}
      <style>{dynamicPrintStyle}</style>

      {/* 1. Header & Quick Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-display uppercase">
            LAPORAN PENJUALAN DETAIL &amp; LOGISTIK
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            Sistem Cetak Dokumen dan Export PDF Terpadu (A4, Letter, Legal)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            id="btn-export-excel-detail"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 rounded-sm border border-slate-300 dark:border-slate-800 transition-colors cursor-pointer uppercase tracking-wider shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Excel
          </button>

          <button
            id="btn-action-print"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-850 rounded-sm shadow-md transition-colors cursor-pointer uppercase tracking-widest"
          >
            <Printer className="w-4 h-4" />
            Cetak / PDF
          </button>
        </div>
      </div>

      {/* 2. Interactive Filtering Panel */}
      <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-sm p-4 shadow-xs transition-colors duration-300 no-print">
        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Konfigurasi Filter Logistik</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Customer Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">
              Customer / Mitra Kerja
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                <User className="h-3.5 w-3.5 text-slate-400" />
              </span>
              <select
                id="detail-report-customer-select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-sm border border-slate-300 bg-white text-slate-800 dark:border-slate-750 dark:bg-slate-850 dark:text-slate-100 outline-hidden font-semibold focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">-- Semua Customer --</option>
                {customerList.map((c) => (
                  <option key={c.id} value={c.kodeCustomer}>
                    {c.kodeCustomer} - {c.namaCustomer}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker Start */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">
              Dari Tanggal (Mulai)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
              </span>
              <input
                id="detail-report-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-sm border border-slate-300 bg-white text-slate-800 dark:border-slate-750 dark:bg-slate-850 dark:text-slate-100 outline-hidden font-mono focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Date Picker End */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">
              Sampai Tanggal (Selesai)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
              </span>
              <input
                id="detail-report-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-sm border border-slate-300 bg-white text-slate-800 dark:border-slate-750 dark:bg-slate-850 dark:text-slate-100 outline-hidden font-mono focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Search Term Text */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">
              Pencarian Kata Kunci
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </span>
              <input
                id="detail-report-keyword-search"
                type="text"
                placeholder="Cari Invoice, Sopir, Plat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-sm border border-slate-300 bg-white text-slate-800 dark:border-slate-750 dark:bg-slate-850 dark:text-slate-100 outline-hidden focus:ring-1 focus:ring-emerald-500 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Filters Reset Button */}
        {(startDate || endDate || selectedCustomerId || searchTerm) && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedCustomerId('');
                setSearchTerm('');
              }}
              className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-450 px-3 py-1 rounded-sm border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer uppercase tracking-wider"
            >
              Reset Filter &amp; Pencarian
            </button>
          </div>
        )}
      </div>

      {/* 3. Paper & Print Configuration Panel */}
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-4 shadow-xs transition-colors duration-300 no-print flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-sm mt-0.5 shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
              Pengaturan Cetakan Kertas
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Format preview kertas visual yang disesuaikan saat diprint atau dijadikan PDF di browser.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
          {/* Paper Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Ukuran Kertas:</span>
            <div className="inline-flex rounded-sm p-0.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              {(['A4', 'Letter', 'Legal'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setPaperSize(size)}
                  className={`px-2.5 py-1 text-[10px] rounded-sm transition-all cursor-pointer ${
                    paperSize === size
                      ? 'bg-slate-800 text-white dark:bg-emerald-600'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Orientation Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Arah / Orientasi:</span>
            <div className="inline-flex rounded-sm p-0.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              {(['portrait', 'landscape'] as const).map((orient) => (
                <button
                  key={orient}
                  onClick={() => setOrientation(orient)}
                  className={`px-2.5 py-1 text-[10px] rounded-sm transition-all cursor-pointer capitalize ${
                    orientation === orient
                      ? 'bg-slate-800 text-white dark:bg-emerald-600'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {orient === 'portrait' ? 'Potrait (Vertikal)' : 'Landscape (Horisontal)'}
                </button>
              ))}
            </div>
          </div>

          {/* Compact Density Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Kerapatan Baris:</span>
            <button
              onClick={() => setIsCompact(!isCompact)}
              className={`px-3 py-1.5 text-[10px] rounded-sm border transition-all cursor-pointer ${
                isCompact
                  ? 'bg-slate-850 border-slate-800 text-white dark:bg-emerald-600 dark:border-emerald-500'
                  : 'bg-white border-slate-250 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              {isCompact ? 'Sangat Padat (Compact)' : 'Normal'}
            </button>
          </div>

          {/* Show Signatures Checkbox */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Tanda Tangan:</span>
            <button
              onClick={() => setShowSignatures(!showSignatures)}
              className={`px-3 py-1.5 text-[10px] rounded-sm border transition-all cursor-pointer ${
                showSignatures
                  ? 'bg-slate-850 border-slate-800 text-white dark:bg-emerald-600 dark:border-emerald-500'
                  : 'bg-white border-slate-250 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              {showSignatures ? 'Ditampilkan' : 'Disembunyikan'}
            </button>
          </div>

          {/* Items Per Page Selector (Matches Preview & Print exactly) */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Baris per Halaman (Cetak):</span>
            <div className="inline-flex rounded-sm p-0.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              {([10, 15, 25, 50, 'all'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 text-[10px] rounded-sm transition-all cursor-pointer font-bold ${
                    itemsPerPage === size
                      ? 'bg-slate-800 text-white dark:bg-emerald-600'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {size === 'all' ? 'Semua' : `${size}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Conversion Tips Alert */}
      <div className="p-3.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-sm text-xs text-blue-800 dark:text-blue-300 flex items-start gap-3 no-print">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 font-semibold">
          <p className="font-bold">💡 Petunjuk Cetak &amp; Save to PDF:</p>
          <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            1. Klik tombol <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">Cetak / PDF</span> di kanan atas.
            <br />
            2. Pada dialog print browser Anda, pilih printer <span className="font-bold">"Save as PDF"</span> atau <span className="font-bold">"Simpan sebagai PDF"</span> untuk mengubah dokumen menjadi file PDF digital.
            <br />
            3. Pastikan memilih <span className="font-bold">Orientasi: {orientation === 'portrait' ? 'Potrait / Vertikal' : 'Landscape / Horisontal'}</span> dan <span className="font-bold">Ukuran Kertas: {paperSize}</span> pada setting lanjutan browser agar rapi sesuai cetakan!
            <br />
            4. Hilangkan centang pada opsi <span className="font-bold">"Headers and footers"</span> (Kepala dan kaki halaman) agar link URL browser tidak ikut tercetak.
          </p>
        </div>
      </div>

      {/* 4. METRICS ROW SUMMARY (No print, screen only) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 p-4 rounded-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Subtotal Omset Terfilter</span>
          <span className="text-lg font-mono font-bold text-slate-800 dark:text-slate-100">Rp {filteredAggregates.totalNetto.toLocaleString('id-ID')}</span>
        </div>
        <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 p-4 rounded-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Volume Terfilter</span>
          <span className="text-lg font-mono font-bold text-slate-800 dark:text-slate-100">{filteredAggregates.totalQty.toLocaleString('id-ID')} Unit</span>
        </div>
        <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 p-4 rounded-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Retribusi MEL Terfilter</span>
          <span className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400">Rp {filteredAggregates.totalMel.toLocaleString('id-ID')}</span>
        </div>
        <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 p-4 rounded-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Diskon Terfilter</span>
          <span className="text-lg font-mono font-bold text-rose-600 dark:text-rose-450">Rp {filteredAggregates.totalDiskon.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* 5. VISUAL PAPER SHEET PREVIEW WRAPPER */}
      <div className="no-print">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Visual Sheet Preview ({paperSize} - {orientation === 'portrait' ? 'Portrait' : 'Landscape'})
          </span>
          <span className="text-[10px] text-slate-450 font-bold font-mono">ALL TRANSACTIONS IN SCOPE ARE RENDERED ON REAL PRINT</span>
        </div>
      </div>

      {/* The Printable Container */}
      <div className="w-full flex justify-center bg-slate-300 dark:bg-slate-950 p-2 sm:p-6 rounded-sm border border-slate-400 dark:border-slate-850 overflow-x-auto">
        <div
          id="printable-report-wrapper"
          className={`bg-white text-slate-900 border border-slate-400 dark:border-transparent shadow-2xl transition-all duration-300 ${
            // Emulate paper dimensions in browser screen mockup
            paperSize === 'A4'
              ? orientation === 'portrait'
                ? 'w-[210mm] min-h-[297mm] p-[15mm]'
                : 'w-[297mm] min-h-[210mm] p-[15mm]'
              : paperSize === 'Letter'
              ? orientation === 'portrait'
                ? 'w-[215mm] min-h-[279mm] p-[15mm]'
                : 'w-[279mm] min-h-[215mm] p-[15mm]'
              : orientation === 'portrait' // Legal
              ? 'w-[215mm] min-h-[355mm] p-[15mm]'
              : 'w-[355mm] min-h-[215mm] p-[15mm]'
          }`}
        >
          {/* PRINT ONLY: Dynamic watermark / header bar */}
          <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-900 text-white flex items-center justify-center font-black text-lg italic tracking-tighter">
                MJS
              </div>
              <div>
                <h1 className="font-black text-sm tracking-widest uppercase">PT MAJU JAYA SELAMANYA</h1>
                <p className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">
                  Sistem Penjualan Tambang &amp; Logistik Terpadu
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] block font-bold text-slate-600">DOKUMEN KELUARAN SISTEM</span>
              <span className="text-[10px] font-mono font-bold">{formattedToday}</span>
            </div>
          </div>

          {/* SCREEN ONLY & PRINT: Business Header Canvas */}
          <div className="border-b border-slate-300 pb-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-emerald-600 text-white rounded-xs flex items-center justify-center font-black text-xs italic">
                    MJS
                  </div>
                  <h3 className="font-extrabold text-base tracking-wide text-slate-900">
                    PT MAJU JAYA SELAMANYA
                  </h3>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold mt-1 max-w-sm leading-relaxed uppercase">
                  Logistik Tambang, Pencucian Material, &amp; Sewa Alat Berat
                  <br />
                  Kec. Grabag, Kab. Magelang, Jawa Tengah
                </p>
              </div>

              <div className="text-left sm:text-right font-semibold">
                <span className="inline-block bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded-xs font-black uppercase tracking-widest">
                  LAPORAN DETAIL PENJUALAN
                </span>
                <div className="text-[10px] text-slate-600 mt-2 font-mono">
                  <p>Tanggal Cetak: <span className="font-bold text-slate-900">{formattedToday}</span></p>
                  <p>Operator Central: <span className="font-bold text-slate-900">{operatorName} ({operatorRole})</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Description Badges */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xs mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Periode Tanggal</span>
              <span className="text-xs font-bold text-slate-800 font-mono">{periodString}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Mitra Kerja / Customer</span>
              <span className="text-xs font-bold text-slate-800">
                {selectedCustomerId ? `${selectedCustomerId} - ${customerList.find(c => c.kodeCustomer === selectedCustomerId)?.namaCustomer || ''}` : 'Seluruh Customer'}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Jumlah Log Logistik</span>
              <span className="text-xs font-bold text-slate-800 font-mono">
                {itemsPerPage === 'all' ? `${filteredData.length} baris` : `${paginatedData.length} dari ${filteredData.length} baris`}
              </span>
            </div>
          </div>
 
          {/* Quick Stats Summary for Paper (Uses previewAggregates so that it displays what is currently previewed/printed) */}
          <div className="grid grid-cols-4 gap-3 border border-slate-300 divide-x divide-slate-300 p-2.5 rounded-xs mb-4 bg-slate-50/50 text-center">
            <div>
              <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest block">Total Netto</span>
              <span className="text-xs font-mono font-bold text-slate-900">Rp {previewAggregates.totalNetto.toLocaleString('id-ID')}</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest block">Total Volume</span>
              <span className="text-xs font-mono font-bold text-slate-900">{previewAggregates.totalQty.toLocaleString('id-ID')} unit</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest block">Total MEL</span>
              <span className="text-xs font-mono font-bold text-slate-900">Rp {previewAggregates.totalMel.toLocaleString('id-ID')}</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest block">Total Diskon</span>
              <span className="text-xs font-mono font-bold text-slate-900">Rp {previewAggregates.totalDiskon.toLocaleString('id-ID')}</span>
            </div>
          </div>
 
          {/* Table Area (Now strictly renders paginatedData so preview and print are always identical) */}
          <div className="border border-slate-300 rounded-xs overflow-hidden mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[9px] font-bold uppercase text-slate-700">
                  <th className="py-2 px-2 text-center w-8">No</th>
                  <th className="py-2 px-2 w-20">Invoice</th>
                  <th className="py-2 px-2 w-16">Tanggal</th>
                  <th className="py-2 px-2">Divisi</th>
                  <th className="py-2 px-2">Mitra Customer</th>
                  <th className="py-2 px-2">Barang &amp; Sewa</th>
                  <th className="py-2 px-2 text-right">Vol</th>
                  <th className="py-2 px-2 text-right">Sat</th>
                  <th className="py-2 px-2 text-right">Harga</th>
                  <th className="py-2 px-2 text-right">Diskon</th>
                  <th className="py-2 px-2 text-right">Ret MEL</th>
                  <th className="py-2 px-2 text-center w-12">Tipe</th>
                  <th className="py-2 px-2 text-right">Total Netto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[10px] text-slate-800">
                {paginatedData.map((item, idx) => {
                  const absoluteNo = itemsPerPage === 'all' 
                    ? idx + 1 
                    : (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50"
                    >
                      <td className="py-1 px-2 text-center font-mono text-[9px] text-slate-400">
                        {absoluteNo}
                      </td>
                      <td className="py-1 px-2 font-mono font-bold text-slate-900">
                        {item.noInvoice}
                      </td>
                      <td className="py-1 px-2 font-mono">
                        {item.tanggal}
                      </td>
                      <td className="py-1 px-2 uppercase font-extrabold text-[8px] text-slate-500">
                        {item.divisi}
                      </td>
                      <td className="py-1 px-2 font-bold text-slate-850">
                        <div>{item.namaCustomer}</div>
                        <div className="text-[8px] text-slate-450 font-mono font-normal">{item.kodeCustomer}</div>
                      </td>
                      <td className="py-1 px-2 font-bold">
                        <div>{item.namaBarang}</div>
                        {item.namaAlat && (
                          <div className="text-[8px] text-amber-700 uppercase">Sewa: {item.namaAlat}</div>
                        )}
                      </td>
                      <td className="py-1 px-2 text-right font-mono font-bold">
                        {item.kuantiti}
                      </td>
                      <td className="py-1 px-2 text-center text-[9px] font-bold text-slate-500 uppercase">
                        {item.satuan}
                      </td>
                      <td className="py-1 px-2 text-right font-mono text-slate-650">
                        {item.harga.toLocaleString('id-ID')}
                      </td>
                      <td className="py-1 px-2 text-right font-mono text-rose-600">
                        {item.diskon > 0 ? `-${item.diskon.toLocaleString('id-ID')}` : '0'}
                      </td>
                      <td className="py-1 px-2 text-right font-mono text-amber-600">
                        {item.mel > 0 ? item.mel.toLocaleString('id-ID') : '0'}
                      </td>
                      <td className="py-1 px-2 text-center">
                        <span className="text-[8px] font-black uppercase">{item.tipePenjualan}</span>
                      </td>
                      <td className="py-1 px-2 text-right font-mono font-extrabold text-slate-950">
                        {item.total.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })}
 
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada transaksi detail yang cocok dengan filter aktif.
                    </td>
                  </tr>
                )}
 
                {/* Subtotal Aggregate Row inside table */}
                {paginatedData.length > 0 && (
                  <tr className="bg-slate-100 font-bold text-[10px] text-slate-900 border-t-2 border-slate-350">
                    <td colSpan={6} className="py-2 px-2 text-right uppercase tracking-wider font-extrabold text-slate-600">
                      {itemsPerPage === 'all' ? 'Jumlah Total Terfilter:' : 'Jumlah Subtotal Halaman:'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-black border-l border-slate-200">
                      {previewAggregates.totalQty.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-2"></td>
                    <td className="py-2 px-2"></td>
                    <td className="py-2 px-2 text-right font-mono text-rose-700">
                      Rp {previewAggregates.totalDiskon.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-amber-700">
                      Rp {previewAggregates.totalMel.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-2"></td>
                    <td className="py-2 px-2 text-right font-mono font-black text-emerald-800 border-l border-slate-200 bg-emerald-50">
                      Rp {previewAggregates.totalNetto.toLocaleString('id-ID')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
 
          {/* Screen-only footer indicating that what you see is what you print */}
          <div className="no-print block text-center py-2.5 px-3 bg-slate-150 rounded-sm text-[10px] font-bold text-slate-600 mb-6 uppercase tracking-wider">
            ✅ WYSIWYG PREVIEW: Laporan yang dicetak / PDF akan sesuai persis dengan isi dan halaman preview aktif di atas ({paginatedData.length} baris). Ganti opsi "Baris per Halaman" di atas jika ingin mencetak lebih banyak data sekaligus!
          </div>
 
          {/* Indonesian operational corporate Signatures Panel */}
          {showSignatures && (
            <div className="grid grid-cols-3 gap-4 text-center text-[10px] font-semibold mt-10">
              <div className="space-y-12">
                <p className="uppercase tracking-wide text-slate-500 font-black">Disiapkan Oleh (Kasir / Staff)</p>
                <div>
                  <p className="font-bold underline text-slate-900 font-mono uppercase">{operatorName}</p>
                  <p className="text-slate-400 uppercase text-[8px] tracking-wide mt-0.5">{operatorRole}</p>
                </div>
              </div>
              <div className="space-y-12">
                <p className="uppercase tracking-wide text-slate-500 font-black">Diperiksa Oleh (Supervisor)</p>
                <div>
                  <p className="font-bold underline text-slate-900 uppercase">....................................</p>
                  <p className="text-slate-400 uppercase text-[8px] tracking-wide mt-0.5">Pengawas Logistik &amp; DO</p>
                </div>
              </div>
              <div className="space-y-12">
                <p className="uppercase tracking-wide text-slate-500 font-black">Disetujui Oleh (Manajer Tambang)</p>
                <div>
                  <p className="font-bold underline text-slate-900 uppercase">....................................</p>
                  <p className="text-slate-400 uppercase text-[8px] tracking-wide mt-0.5">Kepala Operasional Tambang</p>
                </div>
              </div>
            </div>
          )}
 
          {/* Corporate Footer memo line */}
          <div className="mt-12 pt-4 border-t border-slate-200 text-center text-[8px] uppercase tracking-widest text-slate-400">
            Dokumen ini di-generate oleh sistem administrasi logistik PT MAJU JAYA SELAMANYA.
          </div>
        </div>
      </div>
 
      {/* Pagination Footer (For screen view preview ONLY, obviously not shown when printing) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500 dark:text-slate-450 no-print border-t border-slate-200 dark:border-slate-800 pt-4">
        <div>
          {itemsPerPage === 'all' ? (
            <span>Menampilkan seluruh <span className="text-slate-800 dark:text-slate-200 font-bold font-mono">{filteredData.length}</span> baris</span>
          ) : (
            <span>
              Menampilkan baris preview <span className="text-slate-800 dark:text-slate-200 font-bold">
                {filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(filteredData.length, currentPage * itemsPerPage)}
              </span> dari <span className="text-slate-800 dark:text-slate-200 font-bold font-mono">{filteredData.length}</span> baris
            </span>
          )}
        </div>
 
        {itemsPerPage !== 'all' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              Halaman Preview {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
