// src/lib/dasha/pratyantar.test.ts
// Force UTC so parseApiDate's local-time Date parsing (see format.ts's
// doc comment) round-trips exactly against calculate.ts's UTC-based
// formatDashaDate output, regardless of the machine running this test.
process.env.TZ = "UTC";

import assert from "node:assert/strict";
import {
  DASHA_LORD_SEQUENCE,
  DASHA_LORD_YEARS,
  buildPratyantarDashas,
  vimshottariDasha,
} from "./calculate.ts";
import { mahaDashaTimeline, parseApiDate } from "./format.ts";

// --- contiguity + total span: pratyantar-dashas must exactly tile their
// parent antar-dasha, no gaps, no overlap ---
function assertContiguousAndSpans(
  pratyantarMap: Record<string, { start_time: string; end_time: string }>,
  antarStartMs: number,
  antarEndMs: number
) {
  const entries = Object.values(pratyantarMap);
  assert.strictEqual(entries.length, 9, "all 9 lords must appear");

  // Sort by start_time (map insertion order already matches, but don't
  // trust that — mirrors format.ts's own sort-by-start_time discipline).
  const sorted = [...entries].sort(
    (a, b) => parseApiDate(a.start_time).getTime() - parseApiDate(b.start_time).getTime()
  );

  assert.strictEqual(
    parseApiDate(sorted[0].start_time).getTime(),
    antarStartMs,
    "first pratyantar-dasha must start exactly when the antar-dasha starts"
  );

  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = parseApiDate(sorted[i - 1].end_time).getTime();
    const nextStart = parseApiDate(sorted[i].start_time).getTime();
    assert.strictEqual(
      prevEnd,
      nextStart,
      `pratyantar-dasha ${i - 1} -> ${i} must be contiguous (no gap, no overlap)`
    );
  }

  const lastEnd = parseApiDate(sorted[sorted.length - 1].end_time).getTime();
  // Allow a sub-millisecond rounding slop from repeated float division —
  // real dasha-year fractions rarely divide evenly.
  assert.ok(
    Math.abs(lastEnd - antarEndMs) <= 1,
    `total pratyantar span (ends ${lastEnd}) must equal antar-dasha span (ends ${antarEndMs})`
  );
}

// --- basic case: a round antar-dasha duration ---
const antarStart = new Date("2000-01-01T00:00:00Z").getTime();
const antarYears = 20; // arbitrary, mirrors e.g. a full Venus antar-dasha
const pratyantar = buildPratyantarDashas("Mars", antarYears, antarStart);
const antarEnd =
  antarStart +
  antarYears * 365.25 * 24 * 60 * 60 * 1000;
assertContiguousAndSpans(pratyantar, antarStart, antarEnd);

// --- pratyantar lord sequence starts from the antar-dasha's OWN lord,
// not index 0 / not the maha-dasha's lord ---
const marsIndex = DASHA_LORD_SEQUENCE.indexOf("Mars");
const expectedFirstLord = DASHA_LORD_SEQUENCE[marsIndex];
const firstByStart = Object.entries(pratyantar).sort(
  (a, b) => parseApiDate(a[1].start_time).getTime() - parseApiDate(b[1].start_time).getTime()
)[0][0];
assert.strictEqual(firstByStart, expectedFirstLord, "pratyantar sequence starts from the antar-dasha's own lord (Mars)");

// Confirm every one of the 9 lords is present exactly once, in cyclic
// order starting from Mars.
const orderedByStart = Object.entries(pratyantar)
  .sort((a, b) => parseApiDate(a[1].start_time).getTime() - parseApiDate(b[1].start_time).getTime())
  .map(([lord]) => lord);
const expectedOrder = Array.from(
  { length: 9 },
  (_, i) => DASHA_LORD_SEQUENCE[(marsIndex + i) % 9]
);
assert.deepStrictEqual(orderedByStart, expectedOrder);

// --- proportional-subdivision formula: each pratyantar's duration must
// equal (antarDashaYears * pratyantarLordYears) / 120 ---
for (const lord of DASHA_LORD_SEQUENCE) {
  const period = pratyantar[lord];
  const actualMs = parseApiDate(period.end_time).getTime() - parseApiDate(period.start_time).getTime();
  const expectedYears = (antarYears * DASHA_LORD_YEARS[lord]) / 120;
  const expectedMs = expectedYears * 365.25 * 24 * 60 * 60 * 1000;
  assert.ok(
    Math.abs(actualMs - expectedMs) <= 1,
    `${lord} pratyantar duration mismatch: got ${actualMs}ms, expected ${expectedMs}ms`
  );
}

// --- determinism: same inputs, same output ---
const repeat1 = buildPratyantarDashas("Rahu", 18, antarStart);
const repeat2 = buildPratyantarDashas("Rahu", 18, antarStart);
assert.deepStrictEqual(repeat1, repeat2, "buildPratyantarDashas must be deterministic");

// Sweep every possible antar-dasha lord as the starting lord — contiguity
// and span-matching must hold no matter which lord's own antar-dasha is
// being subdivided.
for (const lord of DASHA_LORD_SEQUENCE) {
  const years = DASHA_LORD_YEARS[lord];
  const map = buildPratyantarDashas(lord, years, antarStart);
  const end = antarStart + years * 365.25 * 24 * 60 * 60 * 1000;
  assertContiguousAndSpans(map, antarStart, end);
  const firstLord = Object.entries(map).sort(
    (a, b) => parseApiDate(a[1].start_time).getTime() - parseApiDate(b[1].start_time).getTime()
  )[0][0];
  assert.strictEqual(firstLord, lord, `pratyantar sequence for ${lord}'s own antar-dasha must start from ${lord}`);
}

// --- realistic full chain: birth -> maha lord -> antar lord ->
// pratyantar timeline, all real computed dates, chronologically ordered,
// none in the deep past relative to birth ---
const birthUtc = new Date("1990-06-15T08:30:00Z");
// A representative sidereal Moon longitude (mid-Ardra nakshatra, ruled
// by Rahu) — an arbitrary but valid 0-360 value, not fabricated data
// claimed to be a real chart.
const moonLongitude = 65.0;
const dasha = vimshottariDasha(moonLongitude, birthUtc);

const timeline = mahaDashaTimeline(dasha);
assert.ok(timeline.length > 0, "must produce at least one maha-dasha");

const firstMaha = timeline[0];
assert.ok(
  parseApiDate(firstMaha.start_time).getTime() >= birthUtc.getTime() - 1,
  "first maha-dasha must not start before birth"
);

const antarMap = dasha[firstMaha.lord];
const antarEntries = Object.entries(antarMap).sort(
  (a, b) => parseApiDate(a[1].start_time).getTime() - parseApiDate(b[1].start_time).getTime()
);
const [firstAntarLord, firstAntarPeriod] = antarEntries[0];

const antarStartMs = parseApiDate(firstAntarPeriod.start_time).getTime();
const antarEndMs = parseApiDate(firstAntarPeriod.end_time).getTime();
const antarYearsChain = (antarEndMs - antarStartMs) / (365.25 * 24 * 60 * 60 * 1000);

const pratyantarChain = buildPratyantarDashas(
  firstAntarLord as (typeof DASHA_LORD_SEQUENCE)[number],
  antarYearsChain,
  antarStartMs
);
assertContiguousAndSpans(pratyantarChain, antarStartMs, antarEndMs);

const pratyantarChainOrdered = Object.entries(pratyantarChain).sort(
  (a, b) => parseApiDate(a[1].start_time).getTime() - parseApiDate(b[1].start_time).getTime()
);
console.log(
  `chain: birth ${birthUtc.toISOString()} -> maha ${firstMaha.lord} (${firstMaha.start_time} - ${firstMaha.end_time}) ` +
    `-> antar ${firstAntarLord} (${firstAntarPeriod.start_time} - ${firstAntarPeriod.end_time})`
);
for (const [lord, period] of pratyantarChainOrdered) {
  console.log(`  pratyantar ${lord}: ${period.start_time} - ${period.end_time}`);
  const startMs = parseApiDate(period.start_time).getTime();
  const endMs = parseApiDate(period.end_time).getTime();
  assert.ok(startMs >= birthUtc.getTime(), `${lord} pratyantar must not start before birth`);
  assert.ok(endMs > startMs, `${lord} pratyantar end must be after its start`);
}
// Chronological ordering across the whole chain.
assert.ok(parseApiDate(firstMaha.start_time).getTime() <= antarStartMs);
assert.ok(antarStartMs <= parseApiDate(pratyantarChainOrdered[0][1].start_time).getTime());

console.log("pratyantar.test.ts: all assertions passed");
