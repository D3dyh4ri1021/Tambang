/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Kendaraan } from '../types';
import { Plus, Search, Trash2, Edit3, Upload, FileSpreadsheet } from 'lucide-react';
import Modal from './Modal';
import * as XLSX from 'xlsx';

interface MasterKendaraanProps {
  data: Kendaraan[];
  onAdd: (item: Kendaraan) => void;
  onUpdate: (item: Kendaraan) => void;
  onDelete: (noPolisi: string) => void;
  onImportClick?: () => void;
}

export default function MasterKendaraan({
  data,
  onAdd,
  onUpdate,
  onDelete,
  onImportClick,
}: MasterKendaraanProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Kendaraan | null>(null);

  // Form State
  const [noPolisi, setNoPolisi] = useState('');
  const [sopir, setSopir] = useState('');
  const [statusKendaraan, setStatusKendaraan] = useState<Kendaraan['statusKendaraan']>('INTERNAL');
  const [error, setError] = useState('');

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setNoPolisi('');
    setSopir('');
    setStatusKendaraan('INTERNAL');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Kendaraan) => {
    setEditingItem(item);
    setNoPolisi(item.noPolisi);
    setSopir(item.sopir);
    setStatusKendaraan(item.statusKendaraan);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedNoPolisi = noPolisi.trim().toUpperCase();
    if (!formattedNoPolisi || !sopir.trim()) return;

    // Check if No Polisi already exists for a new entry
    if (!editingItem && data.some((x) => x.noPolisi.toUpperCase() === formattedNoPolisi)) {
      setError('Nomor Polisi ini sudah terdaftar dalam database!');
      return;
    }

    if (editingItem) {
      onUpdate({
        noPolisi: formattedNoPolisi,
        sopir: sopir.trim(),
        statusKendaraan,
      });
    } else {
      onAdd({
        noPolisi: formattedNoPolisi,
        sopir: sopir.trim(),
        statusKendaraan,
      });
    }
    setIsModalOpen(false);
  };

  const filteredData = data.filter(
    (item) =>
      item.noPolisi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sopir.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.statusKendaraan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportExcel = () => {
    const formattedRows = filteredData.map((item) => ({
      'No Polisi': item.noPolisi,
      'Sopir': item.sopir,
      'Status Kendaraan': item.statusKendaraan,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Kendaraan');

    const wscols = [
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
    ];
    worksheet['!cols'] = wscols;

    const todayStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Master_Kendaraan_Maju_Jaya_${todayStr}.xlsx`);
  };

  return (
    <div className="space-y-3">
      {/* Search and Action Header */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            id="search-kendaraan"
            type="text"
            placeholder="Cari Kendaraan (No Polisi, Sopir, Status)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-sm bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            id="btn-export-kendaraan"
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-sm transition-all cursor-pointer uppercase tracking-wider"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Excel
          </button>
          {onImportClick && (
            <button
              id="btn-import-kendaraan"
              type="button"
              onClick={onImportClick}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-sm transition-all cursor-pointer uppercase tracking-wider"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Excel
            </button>
          )}
          <button
            id="btn-add-kendaraan"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-sm transition-all shadow-sm cursor-pointer uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Kendaraan
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border border-slate-300 rounded-sm shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-4 py-2 border-r border-slate-200">No Polisi</th>
                <th className="px-4 py-2 border-r border-slate-200">Sopir</th>
                <th className="px-4 py-2 border-r border-slate-200">Status Kendaraan</th>
                <th className="px-4 py-2 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px] text-slate-700 font-sans">
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.noPolisi} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-1.5 font-mono text-[10px] font-bold text-slate-800 uppercase tracking-wide bg-slate-50 border-r border-slate-200">
                      {item.noPolisi}
                    </td>
                    <td className="px-4 py-1.5 font-semibold text-slate-800 border-r border-slate-200">{item.sopir}</td>
                    <td className="px-4 py-1.5 border-r border-slate-200">
                      <span className={`text-[9px] px-1 py-0.2 rounded-xs font-semibold uppercase ${
                        item.statusKendaraan === 'INTERNAL'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {item.statusKendaraan}
                      </span>
                    </td>
                    <td className="px-4 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          id={`btn-edit-kendaraan-${item.noPolisi}`}
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-sm"
                          title="Ubah Data"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-delete-kendaraan-${item.noPolisi}`}
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus kendaraan dengan No Polisi ${item.noPolisi}?`)) {
                              onDelete(item.noPolisi);
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
                    Tidak ada data kendaraan ditemukan.
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
        title={editingItem ? 'Ubah Data Kendaraan' : 'Tambah Data Kendaraan'}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-2 text-[10px] font-bold bg-rose-50 text-rose-700 rounded-sm border border-rose-300 uppercase tracking-wide">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Nomor Polisi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!!editingItem}
              placeholder="Contoh: AD 8124 OA"
              value={noPolisi}
              onChange={(e) => setNoPolisi(e.target.value)}
              className={`w-full px-2 py-1 text-xs border rounded-sm font-mono uppercase tracking-wider focus:outline-hidden focus:ring-1 focus:ring-blue-500 ${
                editingItem ? 'bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-50 border-slate-300 text-slate-700 placeholder-slate-400'
              }`}
            />
            {editingItem && (
              <p className="mt-0.5 text-[10px] text-slate-400">
                * Nomor Polisi tidak dapat diubah setelah disimpan. Silakan hapus dan tambah baru bila salah input.
              </p>
            )}
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Nama Sopir <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Slamet Rahardjo"
              value={sopir}
              onChange={(e) => setSopir(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-slate-300 rounded-sm bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status Kendaraan <span className="text-rose-500">*</span>
            </label>
            <select
              value={statusKendaraan}
              onChange={(e) => setStatusKendaraan(e.target.value as Kendaraan['statusKendaraan'])}
              className="w-full px-2 py-1 text-xs border border-slate-300 rounded-sm bg-slate-50 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="INTERNAL">INTERNAL</option>
              <option value="EKSTERNAL">EKSTERNAL</option>
            </select>
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
