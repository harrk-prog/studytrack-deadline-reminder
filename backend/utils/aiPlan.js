import { GoogleGenAI } from "@google/genai";
import { parseDeadline } from "./taskReminder.js";

const SATU_JAM_MS = 60 * 60 * 1000;
const MAKS_TUGAS = 10;

/**
 * Aturan untuk AI. Kategori, sisa waktu, dan urutan sudah ditentukan backend,
 * jadi AI hanya diminta menyusun kalimat saran dari daftar yang diberikan.
 */
export const INSTRUKSI_SISTEM = [
  "Kamu membantu mahasiswa mengatur urutan pengerjaan tugas.",
  "Jawab dalam bahasa Indonesia, 3 sampai 5 kalimat, berupa teks biasa tanpa markdown atau bullet.",
  "Bahas hanya tugas yang ada di daftar. Jangan mengarang tugas dan jangan mengubah deadline.",
  "Ikuti urutan pada daftar, yang sudah diurutkan: mendekati dulu, lalu overdue, lalu sisanya."
].join("\n");

/**
 * Menulis waktu sekarang dalam WIB, misalnya "Jumat, 3 Juli 2026 pukul 12.00 WIB".
 * Zona waktunya dikunci, jadi hasilnya sama di server UTC seperti Vercel.
 * @param {Date} now
 * @returns {string}
 */
function formatWaktuWib(now) {
  const waktu = now.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  return `${waktu} WIB`;
}

/**
 * Menyusun prompt dari tugas yang belum selesai, maksimal 10 tugas pertama.
 * Baris pertama memuat waktu sekarang (WIB) supaya AI paham konteks waktu.
 * Deskripsi tugas sengaja tidak ikut dikirim.
 * @param {Array<{judul: string, mata_kuliah: string, deadline: string, status: string, kategori: string}>} daftar
 *   tugas yang sudah punya kategori dan sudah terurut dari route
 *   Jam dibulatkan ke bawah supaya teks tidak bertentangan dengan kategori
 *   (sisa 23 jam 40 menit tetap "sisa 23 jam", bukan 24).
 * @param {Date} now
 * @returns {string | null} null kalau tidak ada tugas aktif
 */
export function buatPrompt(daftar, now) {
  const aktif = daftar.filter((t) => t.status !== "selesai").slice(0, MAKS_TUGAS);
  if (aktif.length === 0) return null;

  const baris = aktif.map((t) => {
    const selisihMs = parseDeadline(t.deadline) - now;
    const jam = Math.floor(Math.abs(selisihMs) / SATU_JAM_MS);
    const kata = selisihMs < 0 ? "lewat" : "sisa";
    const durasi = jam === 0 ? "kurang dari 1 jam" : `${jam} jam`;
    return `- [${t.kategori}] ${t.judul} (${t.mata_kuliah}): ${kata} ${durasi}`;
  });
  return [`Sekarang: ${formatWaktuWib(now)}`, "Daftar tugas yang belum selesai:", ...baris].join("\n");
}

/**
 * Meminta saran urutan pengerjaan ke Gemini. Kunci dan nama model dibaca di
 * dalam fungsi supaya nilainya sudah terisi dari `.env` saat dipanggil.
 * Tidak dites lewat `npm test` karena butuh internet dan kuota.
 * @param {string} prompt hasil `buatPrompt`
 * @returns {Promise<string | null>} teks saran, atau null kalau kunci atau model belum diisi
 */
export async function mintaSaran(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey || !model) return null;

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { systemInstruction: INSTRUKSI_SISTEM }
  });
  return response.text.trim();
}
