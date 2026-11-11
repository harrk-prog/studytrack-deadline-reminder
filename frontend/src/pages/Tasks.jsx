import React, { useEffect, useState } from "react";
import api from "../api.js";
import Navbar from "../components/Navbar.jsx";
import TaskCard from "../components/TaskCard.jsx";

const JEDA_MUAT_ULANG_MS = 60 * 1000;

/**
 * Halaman Daftar Tugas: form tambah tugas dan daftar seluruh tugas pengguna
 * lintas mata kuliah, sesuai urutan yang dikirim backend.
 */
export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    const [tasksRes, coursesRes] = await Promise.all([api.get("/tasks"), api.get("/courses")]);
    setTasks(tasksRes.data.tasks);
    setCourses(coursesRes.data.courses);
  }

  // Kategori tugas dihitung backend berdasarkan waktu, jadi daftar dimuat ulang
  // berkala dan saat tab aktif kembali.
  useEffect(() => {
    const muatUlang = () => {
      loadData().catch(() => {});
    };
    const saatTerlihat = () => {
      if (document.visibilityState === "visible") muatUlang();
    };

    muatUlang();
    const timer = setInterval(muatUlang, JEDA_MUAT_ULANG_MS);
    document.addEventListener("visibilitychange", saatTerlihat);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", saatTerlihat);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!courseId) {
      setError("Pilih mata kuliah terlebih dahulu.");
      return;
    }
    try {
      await api.post("/tasks", { mata_kuliah_id: courseId, judul, deskripsi, deadline });
      setJudul("");
      setDeskripsi("");
      setDeadline("");
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menambahkan tugas.");
    }
  }

  async function handleToggleStatus(task) {
    const newStatus = task.status === "selesai" ? "belum" : "selesai";
    await api.put(`/tasks/${task.id}`, { status: newStatus });
    loadData();
  }

  async function handleDelete(id) {
    await api.delete(`/tasks/${id}`);
    loadData();
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>Daftar Tugas</h1>

        <div className="card">
          <h2>Tambah Tugas</h2>
          <form onSubmit={handleSubmit}>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
              <option value="">-- Pilih Mata Kuliah --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Judul Tugas"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              required
            />
            <textarea
              placeholder="Deskripsi (opsional)"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={2}
            />
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
            {error && <p className="error">{error}</p>}
            <button type="submit">Tambah Tugas</button>
          </form>
        </div>

        {tasks.length === 0 && <p>Belum ada tugas. Tambahkan tugas pertama Anda di atas.</p>}

        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onToggleStatus={handleToggleStatus} onDelete={handleDelete} />
        ))}
      </div>
    </>
  );
}
