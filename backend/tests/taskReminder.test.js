import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseDeadline, tentukanKategori, urutkanTugas } from "../utils/taskReminder.js";

const wib = (waktu) => new Date(`${waktu}+07:00`);

describe("parseDeadline", () => {
  const HARAPAN = "2026-07-02T03:00:00.000Z";

  it("membaca format tanpa detik sebagai WIB", () => {
    assert.equal(parseDeadline("2026-07-02T10:00").toISOString(), HARAPAN);
  });

  it("membaca format dengan detik sebagai WIB", () => {
    assert.equal(parseDeadline("2026-07-02T10:00:00").toISOString(), HARAPAN);
  });

  it("hasilnya sama di zona waktu mana pun", () => {
    const zonaAwal = process.env.TZ;
    try {
      for (const zona of ["Asia/Jakarta", "UTC", "America/New_York"]) {
        process.env.TZ = zona;
        assert.equal(parseDeadline("2026-07-02T10:00:00").toISOString(), HARAPAN, zona);
      }
    } finally {
      if (zonaAwal === undefined) delete process.env.TZ;
      else process.env.TZ = zonaAwal;
    }
  });
});

describe("tentukanKategori", () => {
  const PROJECT_3 = { deadline: "2026-07-02T10:00:00", status: "belum" };
  const SELESAI = { ...PROJECT_3, status: "selesai" };

  it("sisa 2 jam jadi mendekati", () => {
    assert.equal(tentukanKategori(PROJECT_3, wib("2026-07-02T08:00:00")), "mendekati");
  });

  it("sisa tepat 0 jadi mendekati", () => {
    assert.equal(tentukanKategori(PROJECT_3, wib("2026-07-02T10:00:00")), "mendekati");
  });

  it("lewat 2 jam jadi overdue", () => {
    assert.equal(tentukanKategori(PROJECT_3, wib("2026-07-02T12:00:00")), "overdue");
  });

  it("sisa tepat 24 jam jadi normal", () => {
    assert.equal(tentukanKategori(PROJECT_3, wib("2026-07-01T10:00:00")), "normal");
  });

  it("selesai dengan deadline dekat tetap normal", () => {
    assert.equal(tentukanKategori(SELESAI, wib("2026-07-02T08:00:00")), "normal");
  });

  it("selesai dengan deadline lewat tetap normal", () => {
    assert.equal(tentukanKategori(SELESAI, wib("2026-07-02T12:00:00")), "normal");
  });

  it("1 milidetik sebelum 24 jam jadi mendekati", () => {
    const now = new Date(wib("2026-07-01T10:00:00").getTime() + 1);
    assert.equal(tentukanKategori(PROJECT_3, now), "mendekati");
  });

  it("1 milidetik setelah deadline jadi overdue", () => {
    const now = new Date(wib("2026-07-02T10:00:00").getTime() + 1);
    assert.equal(tentukanKategori(PROJECT_3, now), "overdue");
  });
});

describe("urutkanTugas", () => { 
  const LAB_4 = { judul: "Lab 4", deadline: "2026-07-03T23:59:00", status: "belum", created_at: "2026-06-15T09:00:00" };
  const PROJECT_3 = { judul: "Project 3", deadline: "2026-07-02T10:00:00", status: "belum", created_at: "2026-06-16T14:00:00" };
  const SPRINT_2 = { judul: "Sprint 2", deadline: "2026-07-06T23:59:00", status: "belum", created_at: "2026-06-17T11:00:00" };

  const beriKategori = (now) =>
    [LAB_4, PROJECT_3, SPRINT_2].map((t) => ({ ...t, kategori: tentukanKategori(t, now) }));

  const urutkanSeperti = (now) =>
    urutkanTugas(beriKategori(now)).map((t) => `${t.judul}: ${t.kategori}`);

  it("menaruh mendekati di atas", () => {
    assert.deepEqual(urutkanSeperti(wib("2026-07-02T08:00:00")), [
      "Project 3: mendekati",
      "Sprint 2: normal",
      "Lab 4: normal",
    ]);
  });

  it("mengurutkan mendekati, overdue, normal", () => {
    assert.deepEqual(urutkanSeperti(wib("2026-07-03T00:00:00")), [
      "Lab 4: mendekati",
      "Project 3: overdue",
      "Sprint 2: normal",
    ]);
  });

  it("tidak mengubah array asli", () => {
    const asli = beriKategori(wib("2026-07-02T08:00:00"));
    const salinan = structuredClone(asli);
    urutkanTugas(asli);
    assert.deepEqual(asli, salinan);
  });
});