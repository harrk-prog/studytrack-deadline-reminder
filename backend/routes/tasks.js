import { Router } from "express";
import { readDB, writeDB } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { deadlineValid, tentukanKategori, urutkanTugas } from "../utils/taskReminder.js";

const router = Router();
const PESAN_DEADLINE_TIDAK_VALID = "Format deadline tidak valid. Contoh: 2026-07-03T23:59.";

// Seluruh endpoint tugas membutuhkan login.
router.use(requireAuth);

/**
 * GET /api/tasks
 * Daftar tugas milik pengguna, tiap tugas diberi kategori,
 * urutannya mendekati, overdue, normal.
 * Response : 200 { tasks }
 */
router.get("/", (req, res) => {
  const db = readDB();
  const now = new Date();
  const tasks = db.tasks
    .filter((t) => t.user_id === req.user.id)
    .map((t) => {
      const course = db.courses.find((c) => c.id === t.mata_kuliah_id);
      return {
        ...t,
        mata_kuliah: course ? course.name : null,
        kategori: tentukanKategori(t, now)
      };
    });

  res.json({ tasks: urutkanTugas(tasks) });
});

/**
 * GET /api/tasks/:id
 * Detail satu tugas milik pengguna yang sedang login.
 *
 * Response : 200 { task } | 404 tidak ditemukan
 */
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  const task = db.tasks.find((t) => t.id === id && t.user_id === req.user.id);
  if (!task) {
    return res.status(404).json({ error: "Tugas tidak ditemukan." });
  }
  res.json({ task });
});

/**
 * POST /api/tasks
 * Menambahkan tugas baru dengan status awal "belum".
 *
 * Body     : { mata_kuliah_id, judul, deadline, deskripsi? }
 * Response : 201 { task } | 400 input tidak valid, deadline tidak valid, atau mata kuliah bukan milik user
 */
router.post("/", (req, res) => {
  const { mata_kuliah_id, judul, deskripsi, deadline } = req.body;
  if (!mata_kuliah_id || !judul || !deadline) {
    return res.status(400).json({ error: "mata_kuliah_id, judul, dan deadline wajib diisi." });
  }
  if (!deadlineValid(deadline)) {
    return res.status(400).json({ error: PESAN_DEADLINE_TIDAK_VALID });
  }

  const db = readDB();
  const course = db.courses.find((c) => c.id === Number(mata_kuliah_id) && c.user_id === req.user.id);
  if (!course) {
    return res.status(400).json({ error: "Mata kuliah tidak ditemukan untuk user ini." });
  }

  const newTask = {
    id: db.nextIds.task++,
    user_id: req.user.id,
    mata_kuliah_id: Number(mata_kuliah_id),
    judul,
    deskripsi: deskripsi || "",
    deadline,
    status: "belum",
    created_at: new Date().toISOString()
  };
  db.tasks.push(newTask);
  writeDB(db);
  res.status(201).json({ task: newTask });
});

/**
 * PUT /api/tasks/:id
 * Memperbarui tugas, termasuk mengubah status. Hanya field yang dikirim yang
 * diubah.
 *
 * Body     : { judul?, deskripsi?, deadline?, status? } (status: "belum" | "selesai")
 * Response : 200 { task } | 400 status atau deadline tidak valid | 404 tidak ditemukan
 */
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  const task = db.tasks.find((t) => t.id === id && t.user_id === req.user.id);
  if (!task) {
    return res.status(404).json({ error: "Tugas tidak ditemukan." });
  }

  const { judul, deskripsi, deadline, status } = req.body;
  if (deadline !== undefined && !deadlineValid(deadline)) {
    return res.status(400).json({ error: PESAN_DEADLINE_TIDAK_VALID });
  }
  if (judul !== undefined) task.judul = judul;
  if (deskripsi !== undefined) task.deskripsi = deskripsi;
  if (deadline !== undefined) task.deadline = deadline;
  if (status !== undefined) {
    if (!["belum", "selesai"].includes(status)) {
      return res.status(400).json({ error: "Status hanya boleh 'belum' atau 'selesai'." });
    }
    task.status = status;
  }
  writeDB(db);
  res.json({ task });
});

/**
 * DELETE /api/tasks/:id
 * Menghapus satu tugas.
 *
 * Response : 200 { success: true } | 404 tidak ditemukan
 */
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  const task = db.tasks.find((t) => t.id === id && t.user_id === req.user.id);
  if (!task) {
    return res.status(404).json({ error: "Tugas tidak ditemukan." });
  }

  db.tasks = db.tasks.filter((t) => t.id !== id);
  writeDB(db);
  res.json({ success: true });
});

export default router;
