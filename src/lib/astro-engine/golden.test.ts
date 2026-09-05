// src/lib/astro-engine/golden.test.ts
//
// PERMANENT golden-test-case suite (per the original task spec's Phase
// 40): a small, hand-picked set of REAL, independently-sourced birth
// charts with EXACT expected sidereal (Lahiri) values, pinned here as a
// regression trip-wire distinct from this repo's other astro-engine
// tests (aspects.test.ts, dignity.test.ts, etc.), which mostly check
// internal consistency/determinism rather than known-correct numbers.
//
// >>> THE EXPECTED VALUES BELOW MUST NEVER BE SILENTLY UPDATED TO <<<
// >>> MATCH A CHANGED ENGINE OUTPUT. If this file starts failing,  <<<
// >>> that means STOP AND INVESTIGATE THE ENGINE (ayanamsha,        <<<
// >>> ascendant formula, nakshatra/pada math, sign boundaries,      <<<
// >>> retrograde detection, etc.) for a real regression — it does  <<<
// >>> NOT mean "the test's expected value is stale, fix the test".  <<<
// >>> Any change to an `expected` block below requires an explicit  <<<
// >>> human review of *why* the real-world cross-check changed,    <<<
// >>> not an automatic edit to make the suite green again.          <<<
//
// Style matches this repo's other engine tests (see
// src/lib/ashtakoot/calculate.test.ts, src/lib/panchang/festivals.test.ts,
// isolation.test.ts): plain node:assert/strict script, no test
// framework, run directly via `node src/lib/astro-engine/golden.test.ts`.
import assert from "node:assert/strict";
import { calculateChart } from "./ephemeris.ts";

type GoldenCase = {
  id: string;
  description: string; // cites the real-world source of the expected values
  birthUtc: string; // ISO
  latitude: number;
  longitude: number;
  expected: {
    ascendantSign: number;
    moonSign: number;
    moonNakshatra: string;
    moonNakshatraPada: number;
    marsSign: number;
  };
};

const GOLDEN_CASES: GoldenCase[] = [
  {
    id: "delhi-1990-08-15",
    description:
      "Reused EXACTLY from scripts/dev/verify-astro-engine.ts's ground-truth " +
      "case: a real FreeAstrologyAPI (POST /planets/extended, Lahiri, " +
      "topocentric) live cross-check captured for New Delhi, 1990-08-15 " +
      "10:30 IST local time = 1990-08-15T05:00:00.000Z UTC, " +
      "lat 28.6139, lon 77.2090. Source method: Path A (live API).",
    birthUtc: "1990-08-15T05:00:00.000Z",
    latitude: 28.6139,
    longitude: 77.209,
    expected: {
      ascendantSign: 6, // Virgo
      moonSign: 2, // Taurus
      moonNakshatra: "Rohini",
      moonNakshatraPada: 3,
      marsSign: 1, // Aries
    },
  },
  {
    id: "mumbai-1985-11-23",
    description:
      "Path A (live API): real FreeAstrologyAPI (POST /planets/extended, " +
      "Lahiri, topocentric) cross-check captured live during this task, " +
      "for Mumbai, 1985-11-23 14:15 IST local time = " +
      "1985-11-23T08:45:00.000Z UTC, lat 19.0760, lon 72.8777. " +
      "Live response: Ascendant fullDegree=331.726 (Pisces), Moon " +
      "fullDegree=352.967 (Pisces, Revati pada 2), Mars fullDegree=173.060 " +
      "(Virgo).",
    birthUtc: "1985-11-23T08:45:00.000Z",
    latitude: 19.076,
    longitude: 72.8777,
    expected: {
      ascendantSign: 12, // Pisces
      moonSign: 12, // Pisces
      moonNakshatra: "Revati",
      moonNakshatraPada: 2,
      marsSign: 6, // Virgo
    },
  },
  {
    id: "kolkata-2005-03-10",
    description:
      "Path A (live API): real FreeAstrologyAPI (POST /planets/extended, " +
      "Lahiri, topocentric) cross-check captured live during this task, " +
      "for Kolkata, 2005-03-10 08:45 IST local time = " +
      "2005-03-10T03:15:00.000Z UTC, lat 22.5726, lon 88.3639. Live " +
      "response: Ascendant fullDegree=20.470 (Aries), Moon " +
      "fullDegree=322.778 (Aquarius; API names this nakshatra " +
      "'Poorvaabhadra' pada 1 — this engine's own naming convention for " +
      "the same nakshatra is 'Purva Bhadrapada', see derive.ts's " +
      "NAKSHATRA_NAMES; the pada and sign are the cross-checked facts, " +
      "the spelling is just this engine's own list), Mars " +
      "fullDegree=268.449 (Sagittarius).",
    birthUtc: "2005-03-10T03:15:00.000Z",
    latitude: 22.5726,
    longitude: 88.3639,
    expected: {
      ascendantSign: 1, // Aries
      moonSign: 11, // Aquarius
      moonNakshatra: "Purva Bhadrapada",
      moonNakshatraPada: 1,
      marsSign: 9, // Sagittarius
    },
  },
  {
    id: "delhi-1990-08-16-boundary-BOUNDARY-CASE",
    description:
      "BOUNDARY CASE — Path A (live API). Derived by taking the same " +
      "New Delhi location as the delhi-1990-08-15 case above and probing " +
      "FreeAstrologyAPI (POST /planets/extended, Lahiri, topocentric) at " +
      "several times ~21-22h later (the Moon needed +~11.7 deg from its " +
      "48.30 deg starting point to approach the Taurus/Gemini cusp at " +
      "60 deg, i.e. roughly a day at the Moon's ~13.2 deg/day rate). A " +
      "live search across 1990-08-16 IST times found the real crossing " +
      "between 03:45 IST (Moon fullDegree=59.9644, still Taurus, only " +
      "0.036 deg — about 2 arcminutes — before the boundary) and 04:00 " +
      "IST (fullDegree=60.0913, just into Gemini). This case pins the " +
      "03:45 IST moment = 1990-08-15T22:15:00.000Z UTC, where the live " +
      "API places the Moon at Taurus 29 deg 57' 51.7\" (Mrigasira/" +
      "Mrigashira pada 2), a hair's-breadth from the sign cusp — exactly " +
      "the kind of moment that catches an off-by-a-few-arcminutes " +
      "regression in the ayanamsha or ecliptic-longitude math that a " +
      "mid-sign case like the other 3 cases above would never expose. " +
      "This engine's own computed Moon longitude for this same moment is " +
      "~59.85 deg (still Taurus, ~0.15 deg from the boundary) — a small, " +
      "expected topocentric/ephemeris-method difference from the API's " +
      "59.9644 deg, but landing on the SAME side of the Taurus/Gemini " +
      "cusp with the SAME nakshatra pada, which is the fact this case " +
      "actually pins down.",
    birthUtc: "1990-08-15T22:15:00.000Z",
    latitude: 28.6139,
    longitude: 77.209,
    expected: {
      ascendantSign: 4, // Cancer
      moonSign: 2, // Taurus (barely — see description)
      moonNakshatra: "Mrigashira",
      moonNakshatraPada: 2,
      marsSign: 1, // Aries
    },
  },
];

for (const testCase of GOLDEN_CASES) {
  const chart = calculateChart(new Date(testCase.birthUtc), testCase.latitude, testCase.longitude);
  const { expected } = testCase;

  assert.strictEqual(
    chart.ascendant.sign,
    expected.ascendantSign,
    `[${testCase.id}] Ascendant sign mismatch — engine=${chart.ascendant.sign} expected=${expected.ascendantSign}. ${testCase.description}`
  );
  assert.strictEqual(
    chart.planets.Moon.sign,
    expected.moonSign,
    `[${testCase.id}] Moon sign mismatch — engine=${chart.planets.Moon.sign} expected=${expected.moonSign}. ${testCase.description}`
  );
  assert.strictEqual(
    chart.planets.Moon.nakshatra.nakshatraName,
    expected.moonNakshatra,
    `[${testCase.id}] Moon Nakshatra mismatch — engine=${chart.planets.Moon.nakshatra.nakshatraName} expected=${expected.moonNakshatra}. ${testCase.description}`
  );
  assert.strictEqual(
    chart.planets.Moon.nakshatra.pada,
    expected.moonNakshatraPada,
    `[${testCase.id}] Moon Pada mismatch — engine=${chart.planets.Moon.nakshatra.pada} expected=${expected.moonNakshatraPada}. ${testCase.description}`
  );
  assert.strictEqual(
    chart.planets.Mars.sign,
    expected.marsSign,
    `[${testCase.id}] Mars sign mismatch — engine=${chart.planets.Mars.sign} expected=${expected.marsSign}. ${testCase.description}`
  );

  console.log(`PASS [${testCase.id}]`);
}

console.log(`\nAll ${GOLDEN_CASES.length} golden cases PASSED.`);
