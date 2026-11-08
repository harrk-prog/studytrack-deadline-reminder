import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseDeadline } from "../utils/taskReminder.js";

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