import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { JEDA_SARAN_MS, buatPembatas } from "../utils/batasSaran.js";

const DETIK_0 = new Date("2026-07-03T12:00:00+07:00");
const setelah = (detik) => new Date(DETIK_0.getTime() + detik * 1000);

describe("buatPembatas", () => {
  it("permintaan pertama menghasilkan sisaJeda 0", () => {
    const pembatas = buatPembatas(JEDA_SARAN_MS);
    assert.equal(pembatas.sisaJeda(1, DETIK_0), 0);
  });

  it("setelah catat di detik 0, sisaJeda di detik 10 adalah 20.000 ms", () => {
    const pembatas = buatPembatas(JEDA_SARAN_MS);
    pembatas.catat(1, DETIK_0);
    assert.equal(pembatas.sisaJeda(1, setelah(10)), 20000);
  });

  it("tepat 30 detik sudah boleh", () => {
    const pembatas = buatPembatas(JEDA_SARAN_MS);
    pembatas.catat(1, DETIK_0);
    assert.equal(pembatas.sisaJeda(1, setelah(30)), 0);
  });

  it("pengguna lain tidak ikut terkena jeda", () => {
    const pembatas = buatPembatas(JEDA_SARAN_MS);
    pembatas.catat(1, DETIK_0);
    assert.equal(pembatas.sisaJeda(2, setelah(1)), 0);
  });
});
