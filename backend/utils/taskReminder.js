const SATU_HARI_MS = 24 * 60 * 60 * 1000;
const SELISIH_WIB_MS = 7 * 60 * 60 * 1000;
const FORMAT_DEADLINE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

/**
 * Baca deadline sebagai WIB. Disimpan tanpa zona, jadi tanpa +07:00
 * hasilnya geser 7 jam di server UTC.
 * @param {string} deadline contoh "2026-07-02T10:00:00"
 * @returns {Date}
 */
export function parseDeadline(deadline) {
  return new Date(`${deadline}+07:00`);
}

/**
 * Menentukan kategori tugas pada waktu `now`.
 * Sisa tepat 0 masuk "mendekati", sisa tepat 24 jam sudah "normal".
 * Tugas "selesai" selalu "normal".
 * @param {{status: string, deadline: string}} tugas
 * @param {Date} now
 * @returns {"mendekati" | "overdue" | "normal"}
 */
export function tentukanKategori(tugas, now) {
  if (tugas.status === "selesai") return "normal";
  const sisaMs = parseDeadline(tugas.deadline) - now;
  if (sisaMs < 0) return "overdue";
  if (sisaMs < SATU_HARI_MS) return "mendekati";
  return "normal";
}

/**
 * Mengurutkan tugas per kategori: mendekati (deadline terdekat dulu),
 * overdue (deadline paling baru terlewat dulu), lalu normal (created_at terbaru dulu).
 * Array asli tidak berubah.
 * @param {Array<{deadline: string, created_at: string, kategori: string}>} daftar
 * @returns {Array} array baru yang sudah terurut
 */
export function urutkanTugas(daftar) {
  const grup = (kategori) => daftar.filter((t) => t.kategori === kategori);
  const mendekati = grup("mendekati")
    .sort((a, b) => parseDeadline(a.deadline) - parseDeadline(b.deadline));
  const overdue = grup("overdue")
    .sort((a, b) => parseDeadline(b.deadline) - parseDeadline(a.deadline));
  const normal = grup("normal")
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return [...mendekati, ...overdue, ...normal];
}

/**
 * Memeriksa apakah deadline bisa dipakai: berupa string berformat
 * YYYY-MM-DDTHH:mm (detik opsional), waktunya sah, dan tanggalnya benar-benar ada.
 * Pemeriksaan terakhir perlu karena JavaScript menggeser tanggal yang tidak ada,
 * misalnya 31 Februari menjadi 3 Maret, tanpa error.
 * @param {unknown} deadline
 * @returns {boolean}
 */
export function deadlineValid(deadline) {
  if (typeof deadline !== "string" || !FORMAT_DEADLINE.test(deadline)) return false;
  const waktu = parseDeadline(deadline);
  if (Number.isNaN(waktu.getTime())) return false;
  const kembaliKeWib = new Date(waktu.getTime() + SELISIH_WIB_MS).toISOString();
  return kembaliKeWib.slice(0, 16) === deadline.slice(0, 16);
}
