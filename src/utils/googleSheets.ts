import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Penjualan, AlatBerat, Barang, Kendaraan, Customer } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add Google Sheets and Drive scopes
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Listen to auth changes
export const initAuth = (
  onAuthSuccess: (user: User, token: string) => void,
  onAuthFailure: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess(user, cachedAccessToken);
      } else {
        // Try to see if we can get it or if we should trigger sign-in.
        // If not in login flow, reset cachedAccessToken.
        if (!isSigningIn) {
          cachedAccessToken = null;
          onAuthFailure();
        }
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure();
    }
  });
};

// Sign in with Google
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Error during Google Sign-In:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Sign out from Google
export const googleSignOut = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Get current cached token or throw error
export const getAccessToken = async (): Promise<string> => {
  if (!cachedAccessToken) {
    throw new Error('User is not authenticated with Google. Please log in.');
  }
  return cachedAccessToken;
};

// Create a new Google Spreadsheet with predefined sheets
export const createSpreadsheet = async (title: string): Promise<string> => {
  const token = await getAccessToken();
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title,
      },
      sheets: [
        { properties: { title: 'Transaksi Penjualan' } },
        { properties: { title: 'Master Alat Berat' } },
        { properties: { title: 'Master Barang' } },
        { properties: { title: 'Master Kendaraan' } },
        { properties: { title: 'Master Customer' } },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create spreadsheet: ${errText}`);
  }

  const data = await response.json();
  return data.spreadsheetId;
};

// Fetch Spreadsheet info
export const getSpreadsheetInfo = async (spreadsheetId: string): Promise<{ title: string; url: string }> => {
  const token = await getAccessToken();
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Spreadsheet with ID ${spreadsheetId} not found or inaccessible.`);
  }

  const data = await response.json();
  return {
    title: data.properties.title,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
};

// Helper to batch update spreadsheet sheet structures if they are missing
export const ensureSheetsExist = async (spreadsheetId: string, sheetTitles: string[]): Promise<void> => {
  const token = await getAccessToken();
  
  // 1. Get current sheets
  const infoRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!infoRes.ok) return;
  const infoData = await infoRes.json();
  const existingTitles: string[] = (infoData.sheets || []).map((s: any) => s.properties.title);

  const missingTitles = sheetTitles.filter(t => !existingTitles.includes(t));
  if (missingTitles.length === 0) return;

  // 2. Create missing sheets
  const requests = missingTitles.map(title => ({
    addSheet: {
      properties: { title }
    }
  }));

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });
};

// Clear and Sync Data to Google Sheet
export const syncDataToSpreadsheet = async (
  spreadsheetId: string,
  data: {
    sales: Penjualan[];
    alat: AlatBerat[];
    barang: Barang[];
    kendaraan: Kendaraan[];
    customer: Customer[];
  }
): Promise<void> => {
  const token = await getAccessToken();

  // Ensure all 5 sheets exist before uploading data
  await ensureSheetsExist(spreadsheetId, [
    'Transaksi Penjualan',
    'Master Alat Berat',
    'Master Barang',
    'Master Kendaraan',
    'Master Customer',
  ]);

  // Define headers and map lists to table grids
  const salesHeaders = [
    'ID Transaksi',
    'Tanggal',
    'Divisi',
    'Tipe Penjualan',
    'No Invoice',
    'No Polisi',
    'Status Kendaraan',
    'Sopir',
    'Kode Customer',
    'Nama Customer',
    'Kode Barang',
    'Nama Barang',
    'Satuan',
    'Kuantiti',
    'Harga',
    'Diskon',
    'Total',
    'Mel (Rp)',
    'Kode Alat',
    'Nama Alat',
    'Keterangan',
  ];
  const salesRows = data.sales.map((item) => [
    item.id,
    item.tanggal,
    item.divisi,
    item.tipePenjualan,
    item.noInvoice,
    item.noPolisi,
    item.statusKendaraan,
    item.sopir,
    item.kodeCustomer,
    item.namaCustomer,
    item.kodeBarang,
    item.namaBarang,
    item.satuan,
    item.kuantiti,
    item.harga,
    item.diskon,
    item.total,
    item.mel || 0,
    item.kodeAlat || '',
    item.namaAlat || '',
    item.keterangan || '',
  ]);

  const alatHeaders = ['ID Alat', 'Kode Alat', 'Nama Alat', 'Kategori', 'Sewa Per Jam'];
  const alatRows = data.alat.map((item) => [
    item.id,
    item.kodeAlat,
    item.namaAlat,
    item.kategori,
    item.sewaJam,
  ]);

  const barangHeaders = ['ID Barang', 'Kode Barang', 'Nama Barang', 'Nilai MEL'];
  const barangRows = data.barang.map((item) => [
    item.id,
    item.kodeBarang,
    item.namaBarang,
    item.nilaiMel,
  ]);

  const kendaraanHeaders = ['No Polisi', 'Sopir', 'Status Kendaraan'];
  const kendaraanRows = data.kendaraan.map((item) => [
    item.noPolisi,
    item.sopir,
    item.statusKendaraan,
  ]);

  const customerHeaders = ['ID Customer', 'Kode Customer', 'Nama Customer', 'Alamat', 'No Telp'];
  const customerRows = data.customer.map((item) => [
    item.id,
    item.kodeCustomer,
    item.namaCustomer,
    item.alamat,
    item.noTelp,
  ]);

  const payloadData = [
    { range: 'Transaksi Penjualan!A1', values: [salesHeaders, ...salesRows] },
    { range: 'Master Alat Berat!A1', values: [alatHeaders, ...alatRows] },
    { range: 'Master Barang!A1', values: [barangHeaders, ...barangRows] },
    { range: 'Master Kendaraan!A1', values: [kendaraanHeaders, ...kendaraanRows] },
    { range: 'Master Customer!A1', values: [customerHeaders, ...customerRows] },
  ];

  // For each sheet, we'll clear old data by sending empty/fewer records, or we can use batchClear,
  // then we update. To make it extremely reliable and simple, we can clear sheets by batchClear first.
  const clearRanges = [
    'Transaksi Penjualan!A1:Z10000',
    'Master Alat Berat!A1:Z1000',
    'Master Barang!A1:Z1000',
    'Master Kendaraan!A1:Z1000',
    'Master Customer!A1:Z1000',
  ];

  // Clear ranges
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ranges: clearRanges }),
  });

  // Write new values
  const writeRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: payloadData,
    }),
  });

  if (!writeRes.ok) {
    const writeErr = await writeRes.text();
    throw new Error(`Failed to write data values: ${writeErr}`);
  }
};
