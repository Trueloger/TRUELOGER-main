// src/lib/panchang/festivals.test.ts
import assert from "node:assert/strict";
import { computeYearFestivals } from "./festivals.ts";

const LAT = 28.6139; // New Delhi — same reference location as calculate.test.ts / store.ts
const LON = 77.209;

const events2026 = computeYearFestivals(2026, LAT, LON);

// --- determinism: same inputs -> identical (date, name) pairs ---
const events2026Again = computeYearFestivals(2026, LAT, LON);
assert.deepStrictEqual(
  events2026.map((e) => [e.date, e.name]),
  events2026Again.map((e) => [e.date, e.name]),
  "computeYearFestivals must be deterministic for identical inputs"
);

// --- Makar Sankranti: solar event, published 2026 date is 14 January
// (drikpanchang-derived aggregation) — assert it lands on 14 or 15
// (the well-documented +/- 1 day drift possible from sunrise-sample
// granularity), not some unrelated month. ---
const makarSankranti = events2026.find((e) => e.name === "Makar Sankranti");
assert.ok(makarSankranti, "Makar Sankranti must be present");
assert.ok(
  makarSankranti!.date === "2026-01-14" || makarSankranti!.date === "2026-01-15",
  `Makar Sankranti expected 2026-01-14/15, got ${makarSankranti!.date}`
);

function assertMonth(name: string, expectedMonth: string, label: string) {
  const found = events2026.find((e) => e.name === name);
  assert.ok(found, `${label} ("${name}") must be present`);
  assert.ok(
    found!.date.startsWith(`2026-${expectedMonth}`),
    `${label} expected month 2026-${expectedMonth}, got ${found!.date}`
  );
}

// Cross-checked published 2026 dates (see festivals.ts header comments
// and the task's final report for sources) — assert exact date where
// research gave a confident single answer, month-only where day-level
// granularity/regional variance makes an exact match riskier for a test.
assert.ok(
  events2026.some((e) => e.name === "Holi" && e.date === "2026-03-04"),
  "Holi expected 2026-03-04"
);
assert.ok(
  events2026.some((e) => e.name === "Maha Shivratri" && e.date === "2026-02-15"),
  "Maha Shivratri expected 2026-02-15"
);
assertMonth("Krishna Janmashtami", "09", "Krishna Janmashtami");
assertMonth("Navratri (Shardiya) Begins", "10", "Navratri (Shardiya) start");
assertMonth("Diwali (Lakshmi Puja)", "11", "Diwali");

// --- No duplicate festival on the exact same date+name. ---
const seen = new Set<string>();
for (const e of events2026) {
  const key = `${e.date}|${e.name}`;
  assert.ok(!seen.has(key), `duplicate festival entry: ${key}`);
  seen.add(key);
}

// --- Every Ekadashi is 2 per lunar month present in the year, ideally
// 24-26 total — but a lunar month's own boundary tithis (Jan's opening
// masa, Dec's closing masa) are naturally truncated to 1 by the
// calendar-year cut, and a Kshaya Ekadashi (the tithi genuinely never
// landing on any sunrise — confirmed directly against this engine's
// own output for 2026-07-11, where tithi jumps Dashami(25)->Dwadashi(27),
// skipping Ekadashi entirely, a real classical phenomenon also
// exercised in calculate.test.ts's own delta-2 cases) can likewise
// leave a masa with only 1. So the realistic bound for 2026 is 22-26,
// and a per-masa count of 1 or 2 (never 0, never >2). ---
const ekadashiEvents = events2026.filter((e) => e.category === "ekadashi");
assert.ok(
  ekadashiEvents.length >= 22 && ekadashiEvents.length <= 26,
  `expected 22-26 Ekadashi events for 2026, got ${ekadashiEvents.length}`
);
const byMasaAdhika = new Map<string, number>();
for (const e of ekadashiEvents) {
  const key = `${e.tithi!.masa}|${e.isAdhikaMasa ? "adhika" : "nija"}`;
  byMasaAdhika.set(key, (byMasaAdhika.get(key) ?? 0) + 1);
}
for (const [key, count] of byMasaAdhika) {
  assert.ok(count === 1 || count === 2, `expected 1 or 2 Ekadashis for ${key}, got ${count}`);
}

// --- 2026 has exactly one Adhika Masa occurrence (verified via
// WebSearch — see festivals.ts header comment; the astronomical
// determination of exactly WHICH masa name it carries is a documented,
// razor-thin edge case this year, also covered in festivals.ts) —
// assert it shows up flagged, paired with its own Nija occurrence of
// the identical masa name, and that Ganga Dussehra (Jyeshtha Shukla
// Dashami) fires exactly once, not zero or twice. ---
const adhikaMasaName = events2026.find((e) => e.isAdhikaMasa === true)?.tithi?.masa;
assert.ok(adhikaMasaName, "2026 must contain an Adhika Masa occurrence");
assert.ok(
  events2026.some((e) => e.tithi?.masa === adhikaMasaName && e.isAdhikaMasa === false),
  `2026 must also contain the regular (Nija) ${adhikaMasaName} occurrence`
);
const gangaDussehraCount = events2026.filter((e) => e.name === "Ganga Dussehra").length;
assert.strictEqual(gangaDussehraCount, 1, "Ganga Dussehra must fire exactly once (Nija Jyeshtha only)");

console.log("festivals.test.ts: all assertions passed");
