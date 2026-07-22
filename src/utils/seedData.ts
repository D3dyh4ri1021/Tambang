/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlatBerat, Barang, Kendaraan, Customer, Penjualan } from '../types';

export const INITIAL_ALAT_BERAT: AlatBerat[] = [
  { id: 'ab-1', kodeAlat: 'AB/001', namaAlat: 'Excavator CAT 320D', kategori: 'Excavator', sewaJam: 275000 },
  { id: 'ab-2', kodeAlat: 'AB/002', namaAlat: 'Vibro Roller Bomag BW211', kategori: 'Vibro', sewaJam: 220000 },
  { id: 'ab-3', kodeAlat: 'AB/003', namaAlat: 'Bulldozer Komatsu D65', kategori: 'Doser', sewaJam: 300000 },
  { id: 'ab-4', kodeAlat: 'AB/004', namaAlat: 'Hydraulic Breaker Furukawa F22', kategori: 'Breaker', sewaJam: 250000 },
];

export const INITIAL_BARANG: Barang[] = [
  { id: 'mat-1', kodeBarang: 'MAT/001', namaBarang: 'Pasir Cor Merapi', nilaiMel: 25000 },
  { id: 'mat-2', kodeBarang: 'MAT/002', namaBarang: 'Batu Split 1-2', nilaiMel: 35000 },
  { id: 'mat-3', kodeBarang: 'MAT/003', namaBarang: 'Sirdam (Pasir Makadam)', nilaiMel: 15000 },
  { id: 'mat-4', kodeBarang: 'MAT/004', namaBarang: 'Abu Batu Premium', nilaiMel: 20000 },
  { id: 'mat-5', kodeBarang: 'MAT/005', namaBarang: 'Batu Belah Pondasi', nilaiMel: 30000 },
];

export const INITIAL_KENDARAAN: Kendaraan[] = [
  { noPolisi: 'AD 8124 OA', sopir: 'Slamet Rahardjo', statusKendaraan: 'INTERNAL' },
  { noPolisi: 'AE 9015 UD', sopir: 'Supriyanto', statusKendaraan: 'INTERNAL' },
  { noPolisi: 'B 9235 TQA', sopir: 'Kurniawan', statusKendaraan: 'EKSTERNAL' },
  { noPolisi: 'L 8831 UX', sopir: 'Bambang Hermawan', statusKendaraan: 'INTERNAL' },
  { noPolisi: 'H 1045 CP', sopir: 'Dwi Cahyono', statusKendaraan: 'EKSTERNAL' },
];

export const INITIAL_CUSTOMER: Customer[] = [
  { id: 'cus-1', kodeCustomer: 'CUS/001', namaCustomer: 'PT Maju Karya Bersama', alamat: 'Jl. Raya Solo-Jogja KM 15', noTelp: '081234567890' },
  { id: 'cus-2', kodeCustomer: 'CUS/002', namaCustomer: 'Manyung', alamat: 'Dusun Manyung RT 02/RW 04, Magetan', noTelp: '085712345678' }, // Special customer named "Manyung"
  { id: 'cus-3', kodeCustomer: 'CUS/003', namaCustomer: 'CV Mitra Konstruksi Magetan', alamat: 'Jl. Jenderal Sudirman No. 45, Magetan', noTelp: '081399887766' },
  { id: 'cus-4', kodeCustomer: 'CUS/004', namaCustomer: 'Developer Graha Indah', alamat: 'Kawasan Industri Candi Blok A', noTelp: '082155443322' },
];

export const INITIAL_PENJUALAN: Penjualan[] = [
  {
    id: 'tx-1',
    tanggal: '2026-07-15',
    divisi: 'Tambang',
    tipePenjualan: 'Tunai',
    noInvoice: 'INV/2026/07/001',
    noPolisi: 'AD 8124 OA',
    statusKendaraan: 'INTERNAL',
    sopir: 'Slamet Rahardjo',
    kodeCustomer: 'CUS/001',
    namaCustomer: 'PT Maju Karya Bersama',
    kodeBarang: 'MAT/001',
    namaBarang: 'Pasir Cor Merapi',
    satuan: 'RIT',
    kuantiti: 12,
    harga: 450000,
    diskon: 15000,
    total: 12 * (450000 - 15000), // 5,220,000
    keterangan: 'Pengiriman Tahap 1 Proyek Jembatan',
    kodeAlat: 'AB/001',
    namaAlat: 'Excavator CAT 320D',
    mel: 25000, // Mat-1 MEL value is 25000 (since customer isn't "Manyung")
  },
  {
    id: 'tx-2',
    tanggal: '2026-07-16',
    divisi: 'Cucian',
    tipePenjualan: 'Transfer',
    noInvoice: 'INV/2026/07/002',
    noPolisi: 'AE 9015 UD',
    statusKendaraan: 'INTERNAL',
    sopir: 'Supriyanto',
    kodeCustomer: 'CUS/002', // Customer named "Manyung"
    namaCustomer: 'Manyung',
    kodeBarang: 'MAT/002',
    namaBarang: 'Batu Split 1-2',
    satuan: 'TON',
    kuantiti: 32,
    harga: 180000,
    diskon: 0,
    total: 32 * 180000, // 5,760,000
    keterangan: 'Pembelian langsung warga lokal',
    kodeAlat: '',
    namaAlat: '',
    mel: 0, // Since customer name is "Manyung", MEL must be 0!
  },
  {
    id: 'tx-3',
    tanggal: '2026-07-18',
    divisi: 'Alat Berat',
    tipePenjualan: 'DP',
    noInvoice: 'INV/2026/07/003',
    noPolisi: 'B 9235 TQA',
    statusKendaraan: 'EKSTERNAL',
    sopir: 'Kurniawan',
    kodeCustomer: 'CUS/003',
    namaCustomer: 'CV Mitra Konstruksi Magetan',
    kodeBarang: 'MAT/003',
    namaBarang: 'Sirdam (Pasir Makadam)',
    satuan: 'KUBIK',
    kuantiti: 45,
    harga: 120000,
    diskon: 5000,
    total: 45 * (120000 - 5000), // 5,175,000
    keterangan: 'Uang muka pengurukan jalan desa',
    kodeAlat: 'AB/003',
    namaAlat: 'Bulldozer Komatsu D65',
    mel: 15000,
  },
  {
    id: 'tx-4',
    tanggal: '2026-07-19',
    divisi: 'Transportasi',
    tipePenjualan: 'Non Tunai',
    noInvoice: 'INV/2026/07/004',
    noPolisi: 'L 8831 UX',
    statusKendaraan: 'INTERNAL',
    sopir: 'Bambang Hermawan',
    kodeCustomer: 'CUS/004',
    namaCustomer: 'Developer Graha Indah',
    kodeBarang: 'MAT/004',
    namaBarang: 'Abu Batu Premium',
    satuan: 'TRONTON',
    kuantiti: 3,
    harga: 3200000,
    diskon: 100000,
    total: 3 * (3200000 - 100000), // 9,300,000
    keterangan: 'Pengiriman paving jalan perumahan',
    kodeAlat: 'AB/002',
    namaAlat: 'Vibro Roller Bomag BW211',
    mel: 20000,
  },
  {
    id: 'tx-5',
    tanggal: '2026-07-20',
    divisi: 'Magetan',
    tipePenjualan: 'Tunai',
    noInvoice: 'INV/2026/07/005',
    noPolisi: 'H 1045 CP',
    statusKendaraan: 'EKSTERNAL',
    sopir: 'Dwi Cahyono',
    kodeCustomer: 'CUS/002', // Customer name "Manyung"
    namaCustomer: 'Manyung',
    kodeBarang: 'MAT/005',
    namaBarang: 'Batu Belah Pondasi',
    satuan: 'RIT',
    kuantiti: 8,
    harga: 600000,
    diskon: 20000,
    total: 8 * (600000 - 20000), // 4,640,000
    keterangan: 'Pembangunan Tembok Penahan Tanah',
    kodeAlat: '',
    namaAlat: '',
    mel: 0, // Customer is Manyung, so MEL = 0
  },
];
