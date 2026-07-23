import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import {
  INITIAL_ALAT_BERAT,
  INITIAL_BARANG,
  INITIAL_KENDARAAN,
  INITIAL_CUSTOMER,
  INITIAL_PENJUALAN
} from "./src/utils/seedData";

const PORT = 3000;
const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
const DB_FILE = isVercel
  ? path.join("/tmp", "majujaya_db.json")
  : path.join(process.cwd(), "majujaya_db.json");

// Helper to load database
function loadDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    return {
      sales: INITIAL_PENJUALAN,
      alat: INITIAL_ALAT_BERAT,
      barang: INITIAL_BARANG,
      kendaraan: INITIAL_KENDARAAN,
      customer: INITIAL_CUSTOMER,
      users: [
        { username: "admin", password: "admin", role: "All" },
        { username: "viewer", password: "viewer", role: "Display Only" }
      ],
      lastUpdated: 1000000
    };
  }
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file", err);
    return {
      sales: INITIAL_PENJUALAN,
      alat: INITIAL_ALAT_BERAT,
      barang: INITIAL_BARANG,
      kendaraan: INITIAL_KENDARAAN,
      customer: INITIAL_CUSTOMER,
      users: [
        { username: "admin", password: "admin", role: "All" },
        { username: "viewer", password: "viewer", role: "Display Only" }
      ],
      lastUpdated: 1000000
    };
  }
}

// Helper to save database
function saveDatabase(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file", err);
  }
}

async function startServer() {
  const app = express();

  // Enable CORS
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }
    next();
  });

  app.use(express.json());

  // Router for API endpoints
  const router = express.Router();

  router.get("/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API: Get entire system data
  router.get("/data", (req, res) => {
    const db = loadDatabase();
    res.json({
      sales: db.sales || [],
      alat: db.alat || [],
      barang: db.barang || [],
      kendaraan: db.kendaraan || [],
      customer: db.customer || [],
      lastUpdated: db.lastUpdated || 0
    });
  });

  // API: Update entire system data
  router.post("/data", (req, res) => {
    const { sales, alat, barang, kendaraan, customer, lastUpdated } = req.body || {};
    const db = loadDatabase();

    if (sales !== undefined) db.sales = sales;
    if (alat !== undefined) db.alat = alat;
    if (barang !== undefined) db.barang = barang;
    if (kendaraan !== undefined) db.kendaraan = kendaraan;
    if (customer !== undefined) db.customer = customer;
    db.lastUpdated = lastUpdated || Date.now();

    saveDatabase(db);
    res.json({ success: true, message: "Database synchronized successfully", lastUpdated: db.lastUpdated });
  });

  // API: Get all users
  router.get("/users", (req, res) => {
    const db = loadDatabase();
    const safeUsers = (db.users || []).map((u: any) => ({
      username: u.username,
      role: u.role
    }));
    res.json(safeUsers);
  });

  // API: Create or update a user
  router.post("/users", (req, res) => {
    const { username, password, role } = req.body || {};
    if (!username || !role) {
      return res.status(400).json({ success: false, message: "Username dan role wajib diisi" });
    }

    const db = loadDatabase();
    if (!db.users) db.users = [];

    const existingIndex = db.users.findIndex((u: any) => u.username.toLowerCase() === username.toLowerCase());

    if (existingIndex >= 0) {
      db.users[existingIndex].role = role;
      if (password) {
        db.users[existingIndex].password = password;
      }
    } else {
      if (!password) {
        return res.status(400).json({ success: false, message: "Password wajib diisi untuk pengguna baru" });
      }
      db.users.push({ username, password, role });
    }

    saveDatabase(db);
    res.json({ success: true, message: "User berhasil disimpan" });
  });

  // API: Delete user
  router.post("/users/delete", (req, res) => {
    const { username } = req.body || {};
    if (!username) {
      return res.status(400).json({ success: false, message: "Username wajib ditentukan" });
    }

    const db = loadDatabase();
    if (!db.users) db.users = [];

    const filtered = db.users.filter((u: any) => u.username.toLowerCase() !== username.toLowerCase());
    db.users = filtered;

    saveDatabase(db);
    res.json({ success: true, message: "User berhasil dihapus" });
  });

  // API: Login verification
  router.post("/auth/login", (req, res) => {
    const { username, password } = req.body || {};
    const db = loadDatabase();
    if (!db.users) db.users = [];

    const user = db.users.find(
      (u: any) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (user) {
      res.json({ success: true, username: user.username, role: user.role });
    } else {
      res.status(401).json({ success: false, message: "Username atau password salah" });
    }
  });

  app.use("/api", router);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PT Maju Jaya Selamanya fullstack server running on http://localhost:${PORT}`);
  });
}

startServer();
