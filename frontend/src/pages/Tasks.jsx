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
  const [saran, setSaran] = useState("");
  const [memuatSaran, setMemuatSaran] = useState(false);
  const [errorSaran, setErrorSaran] = useState("");

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

  // Pesan error dari backend (503, 429, 502) sudah ramah pengguna, jadi diteruskan apa adanya.
  async function handleSaran() {
    setSaran("");
    setErrorSaran("");
    setMemuatSaran(true);
    try {
      const res = await api.post("/tasks/saran");
      setSaran(res.data.saran);
    } catch (err) {
      setErrorSaran(err.response?.data?.error || "Gagal meminta saran.");
    } finally {
      setMemuatSaran(false);
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

        <div className="card">
          <h2>Saran Rencana</h2>
          <button
            type="button"
            className="btn"
            onClick={handleSaran}
            disabled={memuatSaran || tasks.length === 0}
          >
            {memuatSaran ? "Menyusun saran..." : "Minta Saran"}
          </button>
          {errorSaran && <p className="error">{errorSaran}</p>}
          {saran && <p className="saran">{saran}</p>}
          <p className="catatan-ai">
            Saran dibuat AI dan bisa keliru. Label dan urutan tugas tetap mengikuti aturan aplikasi.
          </p>
        </div>

        {tasks.length === 0 && <p>Belum ada tugas. Tambahkan tugas pertama Anda di atas.</p>}

        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onToggleStatus={handleToggleStatus} onDelete={handleDelete} />
        ))}
      </div>
    </>
  );
}
