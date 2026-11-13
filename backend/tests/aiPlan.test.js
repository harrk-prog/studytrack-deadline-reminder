import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { INSTRUKSI_SISTEM, buatPrompt } from "../utils/aiPlan.js";

const SEKARANG = new Date("2026-07-03T12:00:00+07:00");

const tugas = (ubah) => ({
  judul: "Lab 4",
  mata_kuliah: "Database Systems",
  deskripsi: "Catatan pribadi",
  deadline: "2026-07-04T11:00:00",
  status: "belum",
  kategori: "mendekati",
  ...ubah
});

describe("INSTRUKSI_SISTEM", () => {
  it("meminta AI mengikuti urutan daftar dari backend", () => {
    assert.ok(INSTRUKSI_SISTEM.includes("Ikuti urutan pada daftar"));
    assert.ok(INSTRUKSI_SISTEM.includes("mendekati dulu, lalu overdue, lalu sisanya"));
  });
});

describe("buatPrompt", () => {
  it("tidak memuat tugas berstatus selesai", () => {
    const hasil = buatPrompt([
      tugas({ judul: "Sudah Beres", status: "selesai", kategori: "normal" }),
      tugas({ judul: "Masih Jalan" })
    ], SEKARANG);
    assert.ok(hasil.includes("Masih Jalan"));
    assert.ok(!hasil.includes("Sudah Beres"));
  });

  it("menulis sisa 23 jam sebagai 'sisa 23 jam'", () => {
    const hasil = buatPrompt([tugas()], SEKARANG);
    assert.ok(hasil.includes("- [mendekati] Lab 4 (Database Systems): sisa 23 jam"));
  });

  it("menulis tugas overdue sebagai 'lewat ...'", () => {
    const overdue = tugas({ deadline: "2026-07-02T10:00:00", kategori: "overdue" });
    const hasil = buatPrompt([overdue], SEKARANG);
    assert.ok(hasil.includes("[overdue]"));
    assert.ok(hasil.includes("lewat 26 jam"));
    assert.ok(!hasil.includes("sisa"));
  });

  it("membulatkan sisa 23 jam 40 menit ke bawah menjadi 'sisa 23 jam'", () => {
    const hasil = buatPrompt([tugas({ deadline: "2026-07-04T11:40:00" })], SEKARANG);
    assert.ok(hasil.includes("sisa 23 jam"));
    assert.ok(!hasil.includes("sisa 24 jam"));
  });

  it("menulis lewat 20 menit sebagai 'lewat kurang dari 1 jam'", () => {
    const overdue = tugas({ deadline: "2026-07-03T11:40:00", kategori: "overdue" });
    const hasil = buatPrompt([overdue], SEKARANG);
    assert.ok(hasil.includes("lewat kurang dari 1 jam"));
    assert.ok(!hasil.includes("0 jam"));
  });

  it("memuat waktu sekarang dalam WIB sebagai baris pertama", () => {
    const hasil = buatPrompt([tugas()], SEKARANG);
    assert.ok(hasil.includes("Sekarang: Jumat, 3 Juli 2026 pukul 12.00 WIB"));
    assert.equal(hasil.split("\n")[0], "Sekarang: Jumat, 3 Juli 2026 pukul 12.00 WIB");
  });

  it("tidak memuat deskripsi", () => {
    const hasil = buatPrompt([tugas({ deskripsi: "RAHASIA-DESKRIPSI" })], SEKARANG);
    assert.ok(!hasil.includes("RAHASIA-DESKRIPSI"));
  });

  it("mengembalikan null untuk daftar kosong atau semua selesai", () => {
    assert.equal(buatPrompt([], SEKARANG), null);
    assert.equal(buatPrompt([tugas({ status: "selesai" })], SEKARANG), null);
  });

  it("hanya memuat 10 tugas pertama", () => {
    const banyak = Array.from({ length: 12 }, (_, i) => tugas({ judul: `Tugas ${i + 1}` }));
    const baris = buatPrompt(banyak, SEKARANG).split("\n").filter((b) => b.startsWith("- "));
    assert.equal(baris.length, 10);
    assert.ok(baris[9].includes("Tugas 10"));
  });
});
