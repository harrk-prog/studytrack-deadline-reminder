import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseDeadline, tentukanKategori } from "../utils/taskReminder.js";

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