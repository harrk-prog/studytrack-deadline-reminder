/**
 * Baca deadline sebagai WIB. Disimpan tanpa zona, jadi tanpa +07:00
 * hasilnya geser 7 jam di server UTC.
 * @param {string} deadline contoh "2026-07-02T10:00" atau "2026-07-02T10:00:00"
 * @returns {Date}
 */
export function parseDeadline(deadline) {
  return new Date(`${deadline}+07:00`);
}