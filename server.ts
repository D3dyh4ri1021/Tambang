import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "majujaya_db.json");

// Helper to load database
function loadDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    // Return empty structures, which will be hydrated with demo presets on client if empty
    return {
      sales: [],
      alat: [],
      barang: [],
      kendaraan: [],
      customer: [],
      users: [
        { username: "admin", password: "admin", role: "All" },
        { username: "viewer", password: "viewer", role: "Display Only" }
      ]
    };
  }
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file, returning default structure", err);
    return {
      sales: [],
      alat: [],
      barang: [],
      kendaraan: [],
      customer: [],
      users: [
        { username: "admin", password: "admin", role: "All" },
        { username: "viewer", password: "viewer", role: "Display Only" }
      ]
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
  app.use(express.json());

  // API: Get entire system data
  app.get("/api/data", (req, res) => {
    const db = loadDatabase();
    res.json({
      sales: db.sales || [],
      alat: db.alat || [],
      barang: db.barang || [],
      kendaraan: db.kendaraan || [],
      customer: db.customer || []
    });
  });

  // API: Update entire system data (controlled by permission checked on the front-end)
  app.post("/api/data", (req, res) => {
    const { sales, alat, barang, kendaraan, customer } = req.body;
    const db = loadDatabase();

    if (sales !== undefined) db.sales = sales;
    if (alat !== undefined) db.alat = alat;
    if (barang !== undefined) db.barang = barang;
    if (kendaraan !== undefined) db.kendaraan = kendaraan;
    if (customer !== undefined) db.customer = customer;

    saveDatabase(db);
    res.json({ success: true, message: "Database synchronized successfully" });
  });

  // API: Get all users
  app.get("/api/users", (req, res) => {
    const db = loadDatabase();
    // Return users without passwords for security
    const safeUsers = (db.users || []).map((u: any) => ({
      username: u.username,
      role: u.role
    }));
    res.json(safeUsers);
  });

  // API: Create or update a user
  app.post("/api/users", (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !role) {
      return res.status(400).json({ success: false, message: "Username dan role wajib diisi" });
    }

    const db = loadDatabase();
    if (!db.users) db.users = [];

    const existingIndex = db.users.findIndex((u: any) => u.username.toLowerCase() === username.toLowerCase());

    if (existingIndex >= 0) {
      // Update role and password if provided
      db.users[existingIndex].role = role;
      if (password) {
        db.users[existingIndex].password = password;
      }
    } else {
      // Add new user
      if (!password) {
        return res.status(400).json({ success: false, message: "Password wajib diisi untuk pengguna baru" });
      }
      db.users.push({ username, password, role });
    }

    saveDatabase(db);
    res.json({ success: true, message: "User berhasil disimpan" });
  });

  // API: Delete user
  app.post("/api/users/delete", (req, res) => {
    const { username } = req.body;
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
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
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
