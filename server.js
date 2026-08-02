const express = require("express");
const multer = require("multer");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// ---------------------------------------------------------------------------
// Storage location. On Railway, set DATA_DIR to the mount path of an
// attached volume (e.g. /data) so the database and cover images survive
// deploys and restarts. Locally it just defaults to ./data.
// ---------------------------------------------------------------------------
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "inventory.db"));
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    location TEXT,
    image_path TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ---------------------------------------------------------------------------
// Image upload config
// ---------------------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").slice(0, 10);
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

function deleteImageFile(imagePath) {
  if (!imagePath) return;
  const full = path.join(DATA_DIR, imagePath.replace(/^\/+/, ""));
  fs.unlink(full, () => {});
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR, { maxAge: "7d" }));
app.use(express.static(path.join(__dirname, "public")));

const toBook = (row) => ({
  id: row.id,
  title: row.title,
  quantity: row.quantity,
  location: row.location || "",
  imageUrl: row.image_path ? `/uploads/${row.image_path}` : null,
  createdAt: row.created_at,
});

app.get("/api/books", (req, res) => {
  const rows = db.prepare("SELECT * FROM books ORDER BY created_at DESC").all();
  res.json(rows.map(toBook));
});

app.post("/api/books", upload.single("image"), (req, res) => {
  const title = (req.body.title || "").trim();
  if (!title) return res.status(400).json({ error: "Title is required." });

  let quantity = parseInt(req.body.quantity, 10);
  if (!Number.isFinite(quantity) || quantity < 0) quantity = 1;

  const location = (req.body.location || "").trim();
  const imagePath = req.file ? req.file.filename : null;

  const info = db
    .prepare(
      "INSERT INTO books (title, quantity, location, image_path) VALUES (?, ?, ?, ?)"
    )
    .run(title, quantity, location || null, imagePath);

  const row = db.prepare("SELECT * FROM books WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(toBook(row));
});

app.put("/api/books/:id", upload.single("image"), (req, res) => {
  const existing = db.prepare("SELECT * FROM books WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Book not found." });

  const title = req.body.title !== undefined ? req.body.title.trim() : existing.title;
  if (!title) return res.status(400).json({ error: "Title is required." });

  let quantity = existing.quantity;
  if (req.body.quantity !== undefined) {
    const q = parseInt(req.body.quantity, 10);
    if (Number.isFinite(q) && q >= 0) quantity = q;
  }

  const location =
    req.body.location !== undefined ? req.body.location.trim() : existing.location;

  let imagePath = existing.image_path;
  if (req.file) {
    deleteImageFile(imagePath);
    imagePath = req.file.filename;
  } else if (req.body.removeImage === "true") {
    deleteImageFile(imagePath);
    imagePath = null;
  }

  db.prepare(
    "UPDATE books SET title = ?, quantity = ?, location = ?, image_path = ? WHERE id = ?"
  ).run(title, quantity, location || null, imagePath, req.params.id);

  const row = db.prepare("SELECT * FROM books WHERE id = ?").get(req.params.id);
  res.json(toBook(row));
});

app.delete("/api/books/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM books WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Book not found." });
  deleteImageFile(existing.image_path);
  db.prepare("DELETE FROM books WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

// Friendly error handler for multer / upload issues
app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message || "Upload error" });
  next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`BackOfficeBooks running on port ${PORT} — data dir: ${DATA_DIR}`);
});
