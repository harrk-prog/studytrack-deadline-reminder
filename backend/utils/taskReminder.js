const SATU_HARI_MS = 24 * 60 * 60 * 1000;

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