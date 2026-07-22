/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Barang } from '../types';
import { Plus, Search, Trash2, Edit3, Upload, FileSpreadsheet } from 'lucide-react';
import Modal from './Modal';
import * as XLSX from 'xlsx';

interface MasterBarangProps {
  data: Barang[];
  onAdd: (item: Omit<Barang, 'id'>) => void;
  onUpdate: (item: Barang) => void;
  onDelete: (id: string) => void;
  onImportClick?: () => void;
}

export default function MasterBarang({
  data,
  onAdd,
  onUpdate,
  onDelete,
  onImportClick,
}: MasterBarangProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Barang | null>(null);

  // Form State
  const [namaBarang, setNamaBarang] = useState('');
  const [nilaiMel, setNilaiMel] = useState<number>(0);

  // Helper to generate next code
  const getNextCode = () => {
    const codes = data.map((x) => x.kodeBarang);
    const prefix = 'MAT/';
    const numbers = codes
      .map((code) => {
        if (!code.startsWith(prefix)) return 0;
        const part = code.substring(prefix.length);
        const parsed = parseInt(part, 10);
        return isNaN(parsed) ? 0 : parsed;
      });
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setNamaBarang('');
    setNilaiMel(0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Barang) => {
    setEditingItem(item);
    setNamaBarang(item.namaBarang);
    setNilaiMel(item.nilaiMel);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang.trim()) return;

    if (editingItem) {
      onUpdate({
        ...editingItem,
        namaBarang: namaBarang.trim(),
        nilaiMel,
      });
    } else {
      const nextKode = getNextCode();
      onAdd({
        kodeBarang: nextKode,
        namaBarang: namaBarang.trim(),
        nilaiMel,
      });
    }
    setIsModalOpen(false);
  };

  const filteredData = data.filter(
    (item) =>
      item.namaBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kodeBarang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportExcel = () => {
    const formattedRows = filteredData.map((item) => ({
      'Kode Barang': item.kodeBarang,
      'Nama Barang': item.namaBarang,
      'Nilai MEL (Rp)': item.nilaiMel,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Barang');

    const wscols = [
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
    ];
    worksheet['!cols'] = wscols;

    const todayStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Master_Barang_Maju_Jaya_${todayStr}.xlsx`);
  };

  return (
    <div className="space-y-3">
      {/* Search and Action Header */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            id="search-barang"
            type="text"
            placeholder="Cari Barang (Kode, Nama)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-sm bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            id="btn-export-barang"
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-sm transition-all cursor-pointer uppercase tracking-wider"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Excel
          </button>
          {onImportClick && (
            <button
              id="btn-import-barang"
              type="button"
              onClick={onImportClick}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-sm transition-all cursor-pointer uppercase tracking-wider"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Excel
            </button>
          )}
          <button
            id="btn-add-barang"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-sm transition-all shadow-sm cursor-pointer uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Barang
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border border-slate-300 rounded-sm shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-4 py-2 border-r border-slate-200">Kode Barang</th>
                <th className="px-4 py-2 border-r border-slate-200">Nama Barang</th>
                <th className="px-4 py-2 text-right border-r border-slate-200">Nilai MEL</th>
                <th className="px-4 py-2 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px] text-slate-700 font-sans">
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-1.5 font-mono text-[10px] font-bold text-blue-700 bg-blue-50/40 border-r border-slate-200">
                      {item.kodeBarang}
                    </td>
                    <td className="px-4 py-1.5 font-semibold text-slate-800 border-r border-slate-200">{item.namaBarang}</td>
                    <td className="px-4 py-1.5 text-right font-mono font-bold text-slate-800 border-r border-slate-200">
                      Rp {item.nilaiMel.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          id={`btn-edit-barang-${item.id}`}
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-sm"
                          title="Ubah Data"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-delete-barang-${item.id}`}
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus ${item.namaBarang}?`)) {
                              onDelete(item.id);
                            }
                          }}
                          className="p-1 text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded-sm"
                          title="Hapus Data"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    Tidak ada data barang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Ubah Data Barang' : 'Tambah Data Barang'}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Kode Barang (Running Number)
            </label>
            <input
              type="text"
              readOnly
              value={editingItem ? editingItem.kodeBarang : getNextCode()}
              className="w-full px-2 py-1 text-xs bg-slate-100 border border-slate-300 rounded-sm text-slate-500 font-mono focus:outline-hidden"
            />
            <p className="mt-0.5 text-[10px] text-slate-400">
              * Diisi otomatis oleh sistem dengan pola MAT/[Running Number]
            </p>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Nama Barang <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Pasir Cor Merapi"
              value={namaBarang}
              onChange={(e) => setNamaBarang(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-slate-300 rounded-sm bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Nilai MEL (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min={0}
              placeholder="Contoh: 25000"
              value={nilaiMel || ''}
              onChange={(e) => setNilaiMel(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-2 py-1 text-xs border border-slate-300 rounded-sm bg-slate-50 text-slate-700 placeholder-slate-400 font-mono focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-0.5 text-[10px] text-slate-400 font-sans">
              * Nilai ini akan ditarik ke transaksi penjualan kecuali jika customer bernama "Manyung" (otomatis Rp 0)
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-300 mt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm transition-all cursor-pointer uppercase tracking-wider"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border border-blue-700 rounded-sm transition-all shadow-sm cursor-pointer uppercase tracking-wider"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
