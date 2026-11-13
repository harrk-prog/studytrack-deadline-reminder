export const JEDA_SARAN_MS = 30 * 1000;

/**
 * Membuat pembatas permintaan: tiap pengguna harus menunggu `jedaMs`
 * sejak permintaan terakhirnya. Tiap pembatas punya riwayat sendiri, jadi
 * tes bisa membuat pembatas baru yang kosong.
 *
 * Riwayat disimpan di memori per instance server. Di Vercel, memori hilang
 * saat instance di-reset dan tiap instance punya catatannya sendiri, jadi
 * pembatasan ini bersifat best effort.
 * @param {number} jedaMs
 * @returns {{sisaJeda: (userId: number, now: Date) => number, catat: (userId: number, now: Date) => void}}
 */
export function buatPembatas(jedaMs) {
  const riwayat = new Map();

  return {
    /**
     * Sisa milidetik yang harus ditunggu pengguna.
     * 0 kalau belum pernah meminta atau jedanya sudah lewat (tepat habis dianggap lewat).
     */
    sisaJeda(userId, now) {
      const terakhir = riwayat.get(userId);
      if (terakhir === undefined) return 0;
      return Math.max(0, terakhir + jedaMs - now.getTime());
    },

    /** Menyimpan `now` sebagai waktu permintaan terakhir pengguna. */
    catat(userId, now) {
      riwayat.set(userId, now.getTime());
    }
  };
}

/** Satu instance yang dipakai route saran. */
export const pembatasSaran = buatPembatas(JEDA_SARAN_MS);
