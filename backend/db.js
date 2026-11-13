/**
 * Penyimpanan data berbasis file JSON (`db.json`).
 *
 * Lokasi berkas: `backend/db.json` saat dijalankan lokal. Di Vercel folder
 * aplikasi bersifat read-only, jadi berkas ditulis ke folder temporary sistem
 * dan datanya ter-reset saat instance dimatikan.
 *
 * Isi berkas:
 *   nextIds : penghitung ID auto-increment untuk tiap entitas
 *   users   : { id, nama, email, password_hash }
 *   courses : { id, user_id, name, kode, dosen }
 *   tasks   : { id, user_id, mata_kuliah_id, judul, deskripsi, deadline, status, created_at }
 *
 * Catatan format waktu pada `tasks`:
 *   - `deadline` disimpan apa adanya dari input `datetime-local`, yaitu waktu
 *     lokal tanpa informasi zona waktu (contoh: "2026-07-03T23:59").
 *   - `created_at` tugas baru berformat ISO 8601 UTC (contoh: "2026-07-03T09:00:00.000Z").
 *     Data seed memakai format lokal tanpa zona waktu.
 */
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.VERCEL
  ? path.join(os.tmpdir(), "db.json")
  : path.join(__dirname, "db.json");

/**
 * Membuat data awal (seed) yang sesuai dengan contoh data pada dokumen studi
 * kasus, Bagian 1 (Konteks Aplikasi).
 *
 * @returns {object} Isi database dalam kondisi awal.
 */
function seedData() {
  const passwordHash = bcrypt.hashSync("demo1234", 10);
  return {
    nextIds: { user: 2, course: 4, task: 4 },
    users: [
      { id: 1, nama: "Demo Mahasiswa", email: "demo@studytrack.test", password_hash: passwordHash }
    ],
    courses: [
      { id: 1, user_id: 1, name: "Database Systems", kode: "CS 186", dosen: "Dr. Andi Wijaya" },
      { id: 2, user_id: 1, name: "Data Structures", kode: "CS 61B", dosen: "Dr. Sari Lestari" },
      { id: 3, user_id: 1, name: "Software Engineering", kode: "CS 169", dosen: "Dr. Budi Santoso" }
    ],
    tasks: [
      {
        id: 1,
        user_id: 1,
        mata_kuliah_id: 1,
        judul: "Lab 4: Query Optimization Report",
        deskripsi: "Laporan hasil eksperimen optimasi query beserta analisis query plan.",
        deadline: "2026-07-03T23:59:00",
        status: "belum",
        created_at: "2026-06-15T09:00:00"
      },
      {
        id: 2,
        user_id: 1,
        mata_kuliah_id: 2,
        judul: "Project 3: BSTMap Implementation",
        deskripsi: "Implementasi BSTMap beserta pengujian dasarnya.",
        deadline: "2026-07-02T10:00:00",
        status: "belum",
        created_at: "2026-06-16T14:00:00"
      },
      {
        id: 3,
        user_id: 1,
        mata_kuliah_id: 3,
        judul: "Sprint 2: Backend API Integration",
        deskripsi: "Integrasi endpoint backend ke frontend untuk sprint 2.",
        deadline: "2026-07-06T23:59:00",
        status: "belum",
        created_at: "2026-06-17T11:00:00"
      }
    ]
  };
}

/**
 * Membaca seluruh isi database. Jika `db.json` belum ada, berkas dibuat
 * terlebih dahulu dari data seed.
 *
 * @returns {object} Isi database.
 */
export function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    writeDB(seedData());
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

/**
 * Menimpa seluruh isi database dengan objek yang diberikan.
 *
 * @param {object} db Isi database yang akan disimpan.
 */
export function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

/**
 * Mengembalikan database ke kondisi seed awal.
 *
 * @returns {object} Isi database setelah direset.
 */
export function resetDB() {
  const db = seedData();
  writeDB(db);
  return db;
}
