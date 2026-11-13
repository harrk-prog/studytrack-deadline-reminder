/**
 * Entry point backend StudyTrack.
 *
 * Menyiapkan Express, mendaftarkan route tiap modul (auth, courses, tasks),
 * lalu menjalankan server.
 */
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";

import { PORT } from "./config.js";
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import taskRoutes from "./routes/tasks.js";
import { resetDB } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
app.use(express.json());

// GET /api/health - cek apakah server sedang berjalan
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "StudyTrack backend is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/tasks", taskRoutes);

/*
 * POST /api/dev/reset - mengembalikan data ke kondisi seed awal.
 *
 * Endpoint ini tidak memerlukan login, jadi hanya didaftarkan di luar mode
 * production supaya data tidak bisa direset oleh siapa pun setelah di-deploy.
 */
if (process.env.NODE_ENV !== "production") {
  app.post("/api/dev/reset", (req, res) => {
    resetDB();
    res.json({ success: true, message: "Database direset ke data seed awal." });
  });
}

/*
 * Menyajikan hasil build frontend (frontend/dist) dari server yang sama,
 * sehingga halaman dan API berada di satu origin saat di-deploy.
 */
const folderDist = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(folderDist));

// Halaman React Router (/login, /tasks) tetap terbuka saat di-refresh.
// Pola (?!api) memastikan path /api/... tidak ikut ditangkap, sehingga
// endpoint yang salah tetap mendapat 404 JSON, bukan HTML.
app.get(/^\/(?!api(\/|$)).*/, (req, res) => {
  res.sendFile(path.join(folderDist, "index.html"));
});

// Fallback untuk endpoint yang tidak terdaftar
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan." });
});

app.listen(PORT, () => {
  console.log(`StudyTrack backend berjalan di http://localhost:${PORT}`);
});
