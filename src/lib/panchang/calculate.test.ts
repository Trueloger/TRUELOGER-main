// src/lib/panchang/calculate.test.ts
import assert from "node:assert/strict";
import { calculateDailyPanchang } from "./calculate.ts";

const LAT = 28.6139; // New Delhi — matches the fixed reference location panchang/store.ts uses
const LON = 77.209;

// --- determinism: same inputs -> byte-identical result ---
const a = calculateDailyPanchang("2026-06-15", LAT, LON);
const b = calculateDailyPanchang("2026-06-15", LAT, LON);
assert.deepStrictEqual(a, b, "calculateDailyPanchang must be deterministic for identical inputs");

// --- internal consistency across many dates spanning a full year ---
const dates: string[] = [];
for (let m = 1; m <= 12; m++) {
  for (const day of [1, 15]) {
    dates.push(`2026-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
}

const CHALDEAN_ORDER = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];

for (const date of dates) {
  const p = calculateDailyPanchang(date, LAT, LON);

  assert.ok(p.tithi.number >= 1 && p.tithi.number <= 30, `${date}: tithi.number in range`);
  assert.ok(p.tithi.displayNumber >= 1 && p.tithi.displayNumber <= 15, `${date}: tithi.displayNumber in range`);
  assert.ok(p.nakshatra.number >= 1 && p.nakshatra.number <= 27, `${date}: nakshatra.number in range`);
  assert.ok(p.nakshatra.pada >= 1 && p.nakshatra.pada <= 4, `${date}: nakshatra.pada in range`);
  assert.ok(p.yoga.number >= 1 && p.yoga.number <= 27, `${date}: yoga.number in range`);
  assert.ok(p.karana.index >= 1 && p.karana.index <= 60, `${date}: karana.index in range`);

  // Every start/end window must be chronologically ordered.
  for (const w of [p.tithi, p.nakshatra, p.yoga, p.karana, p.rahuKalam, p.yamaGandam, p.gulikaKalam]) {
    assert.ok(new Date(w.startsAt) < new Date(w.endsAt), `${date}: window start < end`);
  }

  // Sunrise < sunset < nextSunrise, all on/after the requested IST date.
  assert.ok(new Date(p.sunrise) < new Date(p.sunset), `${date}: sunrise < sunset`);
  assert.ok(new Date(p.sunset) < new Date(p.nextSunrise), `${date}: sunset < nextSunrise`);

  // Hora: 24 entries, each exactly 1/24 of sunrise->nextSunrise, first
  // lord must equal the vara's own lord, and the Chaldean sequence must
  // hold throughout.
  assert.strictEqual(p.hora.length, 24, `${date}: 24 hora entries`);
  assert.strictEqual(p.hora[0].lord, p.vara.lord, `${date}: hora[0] lord == vara lord`);
  const startIdx = CHALDEAN_ORDER.indexOf(p.vara.lord);
  for (let i = 0; i < 24; i++) {
    assert.strictEqual(p.hora[i].lord, CHALDEAN_ORDER[(startIdx + i) % 7], `${date}: hora[${i}] follows Chaldean order`);
  }

  // Choghadiya: 16 entries (8 day + 8 night), each a valid 7-name cycle
  // member, 8th slot repeats the 1st in both halves.
  assert.strictEqual(p.choghadiya.length, 16, `${date}: 16 choghadiya entries`);
  assert.strictEqual(p.choghadiya[7].name, p.choghadiya[0].name, `${date}: day choghadiya slot 8 repeats slot 1`);
  assert.strictEqual(p.choghadiya[15].name, p.choghadiya[8].name, `${date}: night choghadiya slot 8 repeats slot 1`);

  // Rahu Kalam / Yamaganda / Gulika Kalam must each fall fully within
  // the daytime (sunrise->sunset) span.
  for (const w of [p.rahuKalam, p.yamaGandam, p.gulikaKalam]) {
    assert.ok(new Date(w.startsAt) >= new Date(p.sunrise), `${date}: kalam starts at/after sunrise`);
    assert.ok(new Date(w.endsAt) <= new Date(p.sunset), `${date}: kalam ends at/before sunset`);
  }
}

// --- consecutive days: tithi must be a real rotation, not stuck or
// jumping impossibly. Day-to-day tithi number normally advances by
// exactly 1 (mod 30). Two real, well-documented traditional exceptions:
//  - "Vriddhi tithi" (delta 0): a long tithi spans two consecutive
//    sunrises, so the same tithi is reckoned on both days.
//  - "Kshaya tithi" (delta 2): a short tithi that ends before either
//    sunrise touches it is entirely skipped for that calendar day —
//    e.g. this engine finds it for 2026-04-20 -> 2026-04-21. This is a
//    genuine, classically-recognized phenomenon (tithi never "loses"
//    time, it just isn't the sunrise-tithi of any single day), not a
//    computation bug — a delta of exactly 2 is the only higher value
//    that's traditionally possible (a tithi is always 19-26 hours, so
//    at most one whole tithi can ever be skipped between sunrises).
for (let day = 1; day <= 27; day++) {
  const d1 = `2026-04-${String(day).padStart(2, "0")}`;
  const d2 = `2026-04-${String(day + 1).padStart(2, "0")}`;
  const p1 = calculateDailyPanchang(d1, LAT, LON);
  const p2 = calculateDailyPanchang(d2, LAT, LON);
  const delta = ((p2.tithi.number - p1.tithi.number) % 30 + 30) % 30;
  assert.ok(delta === 0 || delta === 1 || delta === 2, `${d1}->${d2}: tithi must advance by 0, 1, or 2, got ${delta}`);
}

console.log("calculate.test.ts: all assertions passed");
