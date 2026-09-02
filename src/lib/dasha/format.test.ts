// src/lib/dasha/format.test.ts
import assert from "node:assert/strict";
import {
  parseApiDate,
  mahaDashaSpan,
  mahaDashaTimeline,
  findCurrentMahaDasha,
  findCurrentAntarDasha,
} from "./format.ts";
import type { VimshottariDashaResult } from "../astrology/types.ts";

// --- parseApiDate ---------------------------------------------------------
// Fractional-seconds form (as returned by the real API).
assert.strictEqual(isNaN(parseApiDate("1984-05-25 03:34:05.385290").getTime()), false);
// Whole-seconds form.
assert.strictEqual(isNaN(parseApiDate("1984-05-25 03:34:05").getTime()), false);
// Ordering is preserved across a parse.
assert.ok(
  parseApiDate("1984-05-25 03:34:05").getTime() < parseApiDate("1990-01-01 00:00:00").getTime()
);

// --- mahaDashaSpan ---------------------------------------------------------
const sunAntarMap = {
  Sun: { start_time: "2000-01-01 00:00:00", end_time: "2000-04-01 00:00:00" },
  Moon: { start_time: "2000-04-01 00:00:00", end_time: "2000-08-01 00:00:00" },
  Mars: { start_time: "2000-08-01 00:00:00", end_time: "2001-01-01 00:00:00" },
};
const sunSpan = mahaDashaSpan(sunAntarMap);
assert.strictEqual(sunSpan.start_time, "2000-01-01 00:00:00");
assert.strictEqual(sunSpan.end_time, "2001-01-01 00:00:00");

assert.throws(() => mahaDashaSpan({}), /no antar-dasha entries/);

// --- mahaDashaTimeline ------------------------------------------------------
// Keys deliberately out of chronological order — the function must sort
// by start_time rather than trust object key order.
const dasha: VimshottariDashaResult = {
  Moon: {
    X: { start_time: "1995-01-01 00:00:00", end_time: "2005-01-01 00:00:00" },
  },
  Sun: {
    X: { start_time: "1985-01-01 00:00:00", end_time: "1995-01-01 00:00:00" },
  },
  Mars: {
    X: { start_time: "2005-01-01 00:00:00", end_time: "2012-01-01 00:00:00" },
  },
};
const timeline = mahaDashaTimeline(dasha);
assert.deepStrictEqual(
  timeline.map((t) => t.lord),
  ["Sun", "Moon", "Mars"],
  "sorted chronologically by start_time, not by input key order"
);

// --- findCurrentMahaDasha ---------------------------------------------------
const current = findCurrentMahaDasha(dasha, new Date("1998-06-01T00:00:00Z"));
assert.strictEqual(current?.lord, "Moon");

const outsideRange = findCurrentMahaDasha(dasha, new Date("2030-01-01T00:00:00Z"));
assert.strictEqual(outsideRange, null);

// --- findCurrentAntarDasha ---------------------------------------------------
const currentAntar = findCurrentAntarDasha(sunAntarMap, new Date("2000-05-01T00:00:00Z"));
assert.strictEqual(currentAntar?.lord, "Moon");

const noAntar = findCurrentAntarDasha(sunAntarMap, new Date("2010-01-01T00:00:00Z"));
assert.strictEqual(noAntar, null);

console.log("format.test.ts: all assertions passed");
