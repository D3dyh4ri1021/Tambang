/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AlatBerat {
  id: string;
  kodeAlat: string; // Format: "AB/001", "AB/002", etc.
  namaAlat: string;
  kategori: 'Excavator' | 'Vibro' | 'Doser' | 'Breaker';
  sewaJam: number;
}

export interface Barang {
  id: string;
  kodeBarang: string; // Format: "MAT/001", "MAT/002", etc.
  namaBarang: string;
  nilaiMel: number;
}

export interface Kendaraan {
  noPolisi: string; // Unique primary key
  sopir: string;
  statusKendaraan: 'INTERNAL' | 'EKSTERNAL';
}

export interface Customer {
  id: string;
  kodeCustomer: string; // Format: "CUS/001", "CUS/002", etc.
  namaCustomer: string;
  alamat: string;
  noTelp: string;
}

export interface Penjualan {
  id: string;
  tanggal: string; // ISO format "YYYY-MM-DD"
  divisi: 'Tambang' | 'Cucian' | 'Transportasi' | 'Alat Berat' | 'Holding' | 'Magetan';
  tipePenjualan: 'Tunai' | 'Non Tunai' | 'Transfer' | 'DP';
  noInvoice: string;
  noPolisi: string;
  statusKendaraan: 'INTERNAL' | 'EKSTERNAL';
  sopir: string;
  kodeCustomer: string;
  namaCustomer: string;
  kodeBarang: string;
  namaBarang: string;
  satuan: 'RIT' | 'KUBIK' | 'TON' | 'TRONTON';
  kuantiti: number;
  harga: number;
  diskon: number;
  total: number; // Calculated: kuantiti * (harga - diskon)
  keterangan: string;
  kodeAlat: string; // Can be empty if not using heavy equipment
  namaAlat: string;
  mel: number; // Calculated: if namaCustomer is "Manyung" -> 0, else -> nilaiMel of selected item
}
