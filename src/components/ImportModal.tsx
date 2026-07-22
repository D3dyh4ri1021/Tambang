import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Download, X } from 'lucide-react';
import { Penjualan, AlatBerat, Barang, Kendaraan, Customer } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'penjualan' | 'alat' | 'barang' | 'kendaraan' | 'customer';
  onImport: (importedData: any[]) => void;
  barangList?: Barang[];
  customerList?: Customer[];
}

export default function ImportModal({ isOpen, onClose, type, onImport, barangList, customerList }: ImportModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Metadata per Type
  const typeMeta = {
    penjualan: {
      title: 'Import Transaksi Penjualan & DO',
      filename: 'Template_Import_Penjualan.xlsx',
      columns: [
        'Tanggal (YYYY-MM-DD)',
        'Divisi (Tambang/Cucian/Transportasi/Alat Berat/Holding/Magetan)',
        'Tipe Penjualan (Tunai/Non Tunai/Transfer/DP)',
        'No Invoice / DO',
        'No Polisi',
        'Status Kendaraan (INTERNAL/EKSTERNAL)',
        'Sopir',
        'Kode Customer',
        'Nama Customer',
        'Kode Barang',
        'Nama Barang',
        'Satuan (RIT/KUBIK/TON/TRONTON)',
        'Kuantiti',
        'Harga Satuan',
        'Diskon',
        'Nilai MEL (Rp)',
        'Kode Alat Berat',
        'Nama Alat Berat',
        'Keterangan',
      ],
      sample: [
        {
          'Tanggal (YYYY-MM-DD)': '2026-07-20',
          'Divisi (Tambang/Cucian/Transportasi/Alat Berat/Holding/Magetan)': 'Tambang',
          'Tipe Penjualan (Tunai/Non Tunai/Transfer/DP)': 'Tunai',
          'No Invoice / DO': 'INV/2026/07/010',
          'No Polisi': 'AD 8124 OA',
          'Status Kendaraan (INTERNAL/EKSTERNAL)': 'INTERNAL',
          'Sopir': 'Slamet Rahardjo',
          'Kode Customer': 'CUS/001',
          'Nama Customer': 'PT Maju Karya Bersama',
          'Kode Barang': 'MAT/001',
          'Nama Barang': 'Pasir Cor Merapi',
          'Satuan (RIT/KUBIK/TON/TRONTON)': 'RIT',
          'Kuantiti': 10,
          'Harga Satuan': 450000,
          'Diskon': 10000,
          'Nilai MEL (Rp)': 25000,
          'Kode Alat Berat': 'AB/001',
          'Nama Alat Berat': 'Excavator CAT 320D',
          'Keterangan': 'Import data uji coba',
        },
      ],
    },
    alat: {
      title: 'Import Master Alat Berat',
      filename: 'Template_Import_Alat_Berat.xlsx',
      columns: ['Kode Alat', 'Nama Alat', 'Kategori (Excavator/Vibro/Doser/Breaker)', 'Harga Sewa / Jam'],
      sample: [
        {
          'Kode Alat': 'AB/101',
          'Nama Alat': 'Excavator Kobelco SK200',
          'Kategori (Excavator/Vibro/Doser/Breaker)': 'Excavator',
          'Harga Sewa / Jam': 260000,
        },
      ],
    },
    barang: {
      title: 'Import Master Data Barang',
      filename: 'Template_Import_Barang.xlsx',
      columns: ['Kode Barang', 'Nama Barang', 'Nilai MEL (Rp)'],
      sample: [
        {
          'Kode Barang': 'MAT/101',
          'Nama Barang': 'Pasir Pasang Kaliurang',
          'Nilai MEL (Rp)': 22000,
        },
      ],
    },
    kendaraan: {
      title: 'Import Master Kendaraan',
      filename: 'Template_Import_Kendaraan.xlsx',
      columns: ['No Polisi', 'Nama Sopir', 'Status Kendaraan (INTERNAL/EKSTERNAL)'],
      sample: [
        {
          'No Polisi': 'AD 1234 BZ',
          'Nama Sopir': 'Joko Susilo',
          'Status Kendaraan (INTERNAL/EKSTERNAL)': 'INTERNAL',
        },
      ],
    },
    customer: {
      title: 'Import Master Customer',
      filename: 'Template_Import_Customer.xlsx',
      columns: ['Kode Customer', 'Nama Customer', 'Alamat', 'No Telepon'],
      sample: [
        {
          'Kode Customer': 'CUS/101',
          'Nama Customer': 'PT Sentosa Abadi',
          'Alamat': 'Jl. Diponegoro No. 12, Solo',
          'No Telepon': '081233445566',
        },
      ],
    },
  };

  const meta = typeMeta[type];

  // Excel/CSV Template Downloader
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(meta.sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, meta.filename);
  };

  // Parsing & Mapping File Data
  const handleFile = (file: File) => {
    setError(null);
    setSuccessCount(null);
    setParsedRows([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (json.length === 0) {
          setError('File kosong atau tidak memiliki data yang valid.');
          return;
        }

        // Validate headers loosely (check if at least some required headers exist)
        const fileHeaders = Object.keys(json[0]);
        const matchedCount = fileHeaders.filter(h => meta.columns.some(col => col.toLowerCase().includes(h.toLowerCase()) || h.toLowerCase().includes(col.toLowerCase()))).length;

        if (matchedCount === 0) {
          setError('Struktur kolom file tidak sesuai dengan template. Silakan unduh template terlebih dahulu.');
          return;
        }

        // Process rows according to type
        const mapped: any[] = [];
        let rowCount = 0;

        for (const row of json) {
          rowCount++;
          if (type === 'penjualan') {
            const tgl = String(row['Tanggal (YYYY-MM-DD)'] || row['Tanggal'] || new Date().toISOString().slice(0, 10)).trim();
            const div = String(row['Divisi (Tambang/Cucian/Transportasi/Alat Berat/Holding/Magetan)'] || row['Divisi'] || 'Tambang').trim();
            const tipe = String(row['Tipe Penjualan (Tunai/Non Tunai/Transfer/DP)'] || row['Tipe Penjualan'] || 'Tunai').trim();
            const inv = String(row['No Invoice / DO'] || row['No Invoice'] || `INV-IMP-${Date.now()}-${rowCount}`).trim();
            const nopol = String(row['No Polisi'] || row['Nomor Polisi'] || '-').trim().toUpperCase();
            const statKend = String(row['Status Kendaraan (INTERNAL/EKSTERNAL)'] || row['Status Kendaraan'] || 'INTERNAL').trim().toUpperCase() === 'EKSTERNAL' ? 'EKSTERNAL' : 'INTERNAL';
            const sop = String(row['Sopir'] || row['Nama Sopir'] || '-').trim();
            const cusKd = String(row['Kode Customer'] || 'CUS/999').trim();
            const cusNm = String(row['Nama Customer'] || 'Cash Customer').trim();
            const brgKd = String(row['Kode Barang'] || 'MAT/999').trim();
            const brgNm = String(row['Nama Barang'] || 'Bahan').trim();
            const sat = String(row['Satuan (RIT/KUBIK/TON/TRONTON)'] || row['Satuan'] || 'RIT').trim().toUpperCase();
            const qty = Math.max(1, parseFloat(row['Kuantiti'] || row['Qty'] || '1') || 1);
            const prc = Math.max(0, parseFloat(row['Harga Satuan'] || row['Harga'] || '0') || 0);
            const disc = Math.max(0, parseFloat(row['Diskon'] || '0') || 0);
            const ket = String(row['Keterangan'] || '').trim();
            const abKd = String(row['Kode Alat Berat'] || row['Kode Alat'] || '').trim();
            const abNm = String(row['Nama Alat Berat'] || row['Nama Alat'] || '').trim();

            // Special rules calculations
            // Rule 1: Customer 'Manyung' (case-insensitive) is exempt (MEL = 0)
            const isManyung = cusNm.trim().toLowerCase() === 'manyung';
            let melValue = 0;

            if (isManyung) {
              melValue = 0;
            } else {
              // Check if Excel explicitly provided Nilai MEL / MEL column
              const rawMel =
                row['Nilai MEL (Rp)'] ??
                row['Nilai MEL'] ??
                row['Mel (Rp)'] ??
                row['MEL'] ??
                row['Mel'] ??
                row['Retribusi MEL (Rp)'];

              if (rawMel !== undefined && rawMel !== null && String(rawMel).trim() !== '') {
                const parsedMel = parseFloat(String(rawMel));
                melValue = isNaN(parsedMel) ? 0 : Math.max(0, parsedMel);
              } else {
                // Look up from Master Barang list (barangList) by kodeBarang or namaBarang
                const matchedBarang = barangList?.find(
                  (b) =>
                    (b.kodeBarang && b.kodeBarang.trim().toLowerCase() === brgKd.trim().toLowerCase()) ||
                    (b.namaBarang && b.namaBarang.trim().toLowerCase() === brgNm.trim().toLowerCase())
                );
                melValue = matchedBarang ? matchedBarang.nilaiMel : 0;
              }
            }

            const totalVal = qty * (prc - disc);

            const tx: Penjualan = {
              id: `tx-imp-${Date.now()}-${rowCount}`,
              tanggal: tgl,
              divisi: div as any,
              tipePenjualan: tipe as any,
              noInvoice: inv,
              noPolisi: nopol,
              statusKendaraan: statKend,
              sopir: sop,
              kodeCustomer: cusKd,
              namaCustomer: cusNm,
              kodeBarang: brgKd,
              namaBarang: brgNm,
              satuan: sat as any,
              kuantiti: qty,
              harga: prc,
              diskon: disc,
              total: totalVal,
              keterangan: ket,
              kodeAlat: abKd,
              namaAlat: abNm,
              mel: melValue,
            };
            mapped.push(tx);
          } else if (type === 'alat') {
            const kd = String(row['Kode Alat'] || `AB/IMP-${rowCount}`).trim();
            const nm = String(row['Nama Alat'] || 'Alat Berat Tanpa Nama').trim();
            const kat = String(row['Kategori (Excavator/Vibro/Doser/Breaker)'] || row['Kategori'] || 'Excavator').trim();
            const sewa = Math.max(0, parseInt(row['Harga Sewa / Jam'] || row['Sewa / Jam'] || '0') || 0);

            const ab: AlatBerat = {
              id: `ab-imp-${Date.now()}-${rowCount}`,
              kodeAlat: kd,
              namaAlat: nm,
              kategori: kat as any,
              sewaJam: sewa,
            };
            mapped.push(ab);
          } else if (type === 'barang') {
            const kd = String(row['Kode Barang'] || `MAT/IMP-${rowCount}`).trim();
            const nm = String(row['Nama Barang'] || 'Material Tanpa Nama').trim();
            const mel = Math.max(0, parseInt(row['Nilai MEL (Rp)'] || row['Nilai MEL'] || '0') || 0);

            const brg: Barang = {
              id: `mat-imp-${Date.now()}-${rowCount}`,
              kodeBarang: kd,
              namaBarang: nm,
              nilaiMel: mel,
            };
            mapped.push(brg);
          } else if (type === 'kendaraan') {
            const nopol = String(row['No Polisi'] || row['Nomor Polisi'] || `AD ${rowCount} IMP`).trim().toUpperCase();
            const sop = String(row['Nama Sopir'] || row['Sopir'] || 'Sopir Cadangan').trim();
            const stat = String(row['Status Kendaraan (INTERNAL/EKSTERNAL)'] || row['Status'] || 'INTERNAL').trim().toUpperCase() === 'EKSTERNAL' ? 'EKSTERNAL' : 'INTERNAL';

            const knd: Kendaraan = {
              noPolisi: nopol,
              sopir: sop,
              statusKendaraan: stat,
            };
            mapped.push(knd);
          } else if (type === 'customer') {
            const kd = String(row['Kode Customer'] || `CUS/IMP-${rowCount}`).trim();
            const nm = String(row['Nama Customer'] || 'Customer Tanpa Nama').trim();
            const almt = String(row['Alamat'] || '-').trim();
            const tlp = String(row['No Telepon'] || row['No. Telp'] || '-').trim();

            const cus: Customer = {
              id: `cus-imp-${Date.now()}-${rowCount}`,
              kodeCustomer: kd,
              namaCustomer: nm,
              alamat: almt,
              noTelp: tlp,
            };
            mapped.push(cus);
          }
        }

        setPreviewColumns(Object.keys(json[0]));
        setParsedRows(mapped);
      } catch (err: any) {
        setError(`Gagal membaca file: ${err.message || 'Format tidak valid.'}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Drag and Drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (parsedRows.length === 0) return;
    onImport(parsedRows);
    setSuccessCount(parsedRows.length);
    setTimeout(() => {
      onClose();
      // Clean up states
      setParsedRows([]);
      setSuccessCount(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-300 w-full max-w-3xl rounded-sm shadow-xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#1E293B] text-white px-4 py-3 flex justify-between items-center shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider font-display">
              {meta.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Step 1: Download Template */}
          <div className="bg-slate-50 border border-slate-300 p-3 rounded-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Langkah 1: Unduh Format Template Excel
              </p>
              <p className="text-[10px] text-slate-500 font-sans">
                Gunakan file excel standar agar sistem mengenali data import Anda secara akurat.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-sm uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Template Excel
            </button>
          </div>

          {/* Step 2: Upload Zone */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Langkah 2: Unggah File Data (Excel / CSV)
            </p>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-blue-600 bg-blue-50/40'
                  : parsedRows.length > 0
                  ? 'border-emerald-500 bg-emerald-50/20'
                  : 'border-slate-300 hover:border-blue-500 bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <Upload
                  className={`w-8 h-8 ${
                    parsedRows.length > 0 ? 'text-emerald-500' : 'text-slate-400'
                  }`}
                />
                {parsedRows.length > 0 ? (
                  <div>
                    <p className="text-xs font-bold text-emerald-800">
                      File Berhasil Terbaca!
                    </p>
                    <p className="text-[10px] text-emerald-600 font-mono mt-0.5">
                      Menemukan {parsedRows.length} baris data siap import
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      Tarik &amp; lepas file Anda di sini, atau klik untuk memilih
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                      Format didukung: XLS, XLSX, CSV
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-300 p-3 rounded-sm text-rose-700 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-[11px] font-medium leading-relaxed font-sans">
                <p className="font-bold uppercase tracking-wide">Gagal Parsing File</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successCount !== null && (
            <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-sm text-emerald-800 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-[11px] font-medium leading-relaxed font-sans">
                <p className="font-bold uppercase tracking-wide">Data Berhasil Diimport!</p>
                <p className="mt-0.5">{successCount} baris data dimasukkan ke sistem database.</p>
              </div>
            </div>
          )}

          {/* Table Preview */}
          {parsedRows.length > 0 && successCount === null && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Pratinjau Data ({Math.min(5, parsedRows.length)} dari {parsedRows.length} baris)
                </p>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 border border-amber-300 rounded-sm font-sans uppercase tracking-wide">
                  Butuh Konfirmasi
                </span>
              </div>
              <div className="border border-slate-300 rounded-sm overflow-hidden bg-white shadow-xs max-h-48 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[9px] font-bold uppercase text-slate-600 tracking-wider">
                      <th className="px-3 py-1.5 border-r border-slate-200">#</th>
                      {previewColumns.slice(0, 5).map((col, idx) => (
                        <th key={idx} className="px-3 py-1.5 border-r border-slate-200">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[10px] text-slate-600 font-mono">
                    {parsedRows.slice(0, 5).map((row: any, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        <td className="px-3 py-1 border-r border-slate-200 font-bold text-blue-700 bg-blue-50/30">
                          {rIdx + 1}
                        </td>
                        {previewColumns.slice(0, 5).map((col, cIdx) => {
                          const val = row[col] || row[Object.keys(row)[cIdx]] || '-';
                          return (
                            <td key={cIdx} className="px-3 py-1 border-r border-slate-200 truncate max-w-[120px]">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 border-t border-slate-300 px-4 py-3 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-200 border border-slate-300 rounded-sm uppercase tracking-wider transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={parsedRows.length === 0 || successCount !== null}
            onClick={handleSubmit}
            className={`px-3 py-1.5 text-xs font-bold text-white border rounded-sm uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm ${
              parsedRows.length === 0 || successCount !== null
                ? 'bg-slate-400 border-slate-400 cursor-not-allowed opacity-60'
                : 'bg-blue-600 hover:bg-blue-700 border-blue-700 cursor-pointer'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Simpan Data Import
          </button>
        </div>
      </div>
    </div>
  );
}
