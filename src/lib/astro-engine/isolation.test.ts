// src/lib/astro-engine/isolation.test.ts
// Concurrency / person-data isolation audit for the two-person tools
// (Kundli Matching, Compatibility) — see src/app/api/kundli-matching/route.ts
// and src/app/api/compatibility/route.ts. Both routes call calculateChart()
// (this module) and calculateAshtakoot() (src/lib/ashtakoot/calculate.ts)
// once per person, per request. This file verifies:
//
//   1. calculateChart() and calculateAshtakoot() never mix up which
//      inputs belong to which call, even when many calls for several
//      distinct synthetic people run concurrently (interleaved via
//      Promise.all / microtask scheduling) — i.e. there is no shared
//      mutable "current chart" state a concurrent request could clobber
//      before another request reads it.
//   2. calculateAshtakoot() is symmetric under swapping personA/personB
//      for every koota EXCEPT Varna, which is intentionally directional
//      (documented in calculate.ts) — swapping bride/groom swaps the
//      Varna score too, so the /36 total can differ by exactly the
//      Varna delta, never by anything else.
//
// Matches this repo's existing engine-test convention (see
// src/lib/ashtakoot/calculate.test.ts): plain node:assert/strict script,
// no test framework, run directly via `node src/lib/astro-engine/isolation.test.ts`.
import assert from "node:assert/strict";
import { calculateChart, type ChartData } from "./ephemeris.ts";
import { calculateAshtakoot, type AshtakootPerson } from "../ashtakoot/calculate.ts";

// ---------------------------------------------------------------------
// Four clearly-distinguishable synthetic birth inputs — different
// date, time, latitude AND longitude, so any cross-contamination
// (wrong person's chart, or a swapped moon sign/nakshatra/ascendant)
// is virtually certain to produce a detectably wrong result rather
// than an accidental match.
// ---------------------------------------------------------------------

type SyntheticPerson = { label: string; utc: Date; latitude: number; longitude: number };

const PERSON_A: SyntheticPerson = {
  label: "A",
  utc: new Date(Date.UTC(1990, 0, 15, 3, 30, 0)), // 1990-01-15 03:30 UTC
  latitude: 28.6139, // New Delhi
  longitude: 77.209,
};

const PERSON_B: SyntheticPerson = {
  label: "B",
  utc: new Date(Date.UTC(1988, 6, 22, 14, 45, 0)), // 1988-07-22 14:45 UTC
  latitude: 19.076, // Mumbai
  longitude: 72.8777,
};

const PERSON_C: SyntheticPerson = {
  label: "C",
  utc: new Date(Date.UTC(1975, 10, 3, 9, 5, 0)), // 1975-11-03 09:05 UTC
  latitude: 13.0827, // Chennai
  longitude: 80.2707,
};

const PERSON_D: SyntheticPerson = {
  label: "D",
  utc: new Date(Date.UTC(2001, 3, 30, 20, 15, 0)), // 2001-04-30 20:15 UTC
  latitude: 22.5726, // Kolkata
  longitude: 88.3639,
};

const ALL_PEOPLE = [PERSON_A, PERSON_B, PERSON_C, PERSON_D];

// Reference results computed serially, one at a time, with no
// concurrency at all — the ground truth every concurrent call below
// must match exactly.
const referenceCharts = new Map<string, ChartData>();
for (const p of ALL_PEOPLE) {
  referenceCharts.set(p.label, calculateChart(p.utc, p.latitude, p.longitude));
}

// Sanity: the four synthetic people really do produce different charts
// (otherwise a swap bug could hide behind coincidentally-equal data).
const refMoonSigs = ALL_PEOPLE.map((p) => referenceCharts.get(p.label)!.planets.Moon.sign);
const refMoonNaks = ALL_PEOPLE.map(
  (p) => referenceCharts.get(p.label)!.planets.Moon.nakshatra.nakshatraNumber
);
const refAscendants = ALL_PEOPLE.map((p) => referenceCharts.get(p.label)!.ascendant.sign);
assert.ok(
  new Set(refMoonSigs.map((s, i) => `${s}-${refMoonNaks[i]}-${refAscendants[i]}`)).size === 4,
  "test setup: the 4 synthetic people must produce 4 distinct (moonSign, nakshatra, ascendant) triples"
);

function assertChartMatchesReference(label: string, chart: ChartData) {
  const ref = referenceCharts.get(label)!;
  assert.strictEqual(
    chart.planets.Moon.sign,
    ref.planets.Moon.sign,
    `Person ${label}: moon sign was swapped with another person's chart`
  );
  assert.strictEqual(
    chart.planets.Moon.nakshatra.nakshatraNumber,
    ref.planets.Moon.nakshatra.nakshatraNumber,
    `Person ${label}: moon nakshatra was swapped with another person's chart`
  );
  assert.strictEqual(
    chart.ascendant.sign,
    ref.ascendant.sign,
    `Person ${label}: ascendant was swapped with another person's chart`
  );
  assert.strictEqual(chart.birthUtc, ref.birthUtc, `Person ${label}: birthUtc mismatch`);
}

// A microtask-interleaving wrapper: forces calculateChart() calls fired
// "together" via Promise.all to actually interleave at the microtask
// level (rather than one finishing fully before the next even starts),
// which is the shape a shared mutable "current chart" bug would need to
// manifest under.
async function interleavedCalculateChart(p: SyntheticPerson): Promise<ChartData> {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 5));
  return calculateChart(p.utc, p.latitude, p.longitude);
}

async function runConcurrencyAudit() {
  // 20+ concurrent calculateChart() calls: mixes (A,B), (C,D), (B,A)
  // reversed order, and repeated identical calls to the same person.
  const jobs: { label: string; promise: Promise<ChartData> }[] = [
    { label: "A", promise: interleavedCalculateChart(PERSON_A) },
    { label: "B", promise: interleavedCalculateChart(PERSON_B) },
    { label: "C", promise: interleavedCalculateChart(PERSON_C) },
    { label: "D", promise: interleavedCalculateChart(PERSON_D) },
    { label: "B", promise: interleavedCalculateChart(PERSON_B) }, // reversed order vs above
    { label: "A", promise: interleavedCalculateChart(PERSON_A) },
    { label: "D", promise: interleavedCalculateChart(PERSON_D) },
    { label: "C", promise: interleavedCalculateChart(PERSON_C) },
  ];
  // Repeated identical calls (same person, many times) mixed in.
  for (let i = 0; i < 12; i++) {
    const p = ALL_PEOPLE[i % ALL_PEOPLE.length];
    jobs.push({ label: p.label, promise: interleavedCalculateChart(p) });
  }
  assert.ok(jobs.length >= 20, "need at least 20 concurrent calls for this audit");

  const settled = await Promise.all(jobs.map((j) => j.promise));
  settled.forEach((chart, i) => assertChartMatchesReference(jobs[i].label, chart));

  // Same audit, but pairing each call with the matching calculateAshtakoot()
  // call, exactly as both route.ts files do — interleaving (A,B), (C,D),
  // (B,A) reversed, and repeats, all concurrently.
  type MatchJob = { aLabel: string; bLabel: string; promise: Promise<ReturnType<typeof calculateAshtakoot>> };

  async function interleavedMatch(pa: SyntheticPerson, pb: SyntheticPerson): Promise<ReturnType<typeof calculateAshtakoot>> {
    const [chartA, chartB] = await Promise.all([
      interleavedCalculateChart(pa),
      interleavedCalculateChart(pb),
    ]);
    const personA: AshtakootPerson = {
      moonSign: chartA.planets.Moon.sign,
      nakshatraNumber: chartA.planets.Moon.nakshatra.nakshatraNumber,
    };
    const personB: AshtakootPerson = {
      moonSign: chartB.planets.Moon.sign,
      nakshatraNumber: chartB.planets.Moon.nakshatra.nakshatraNumber,
    };
    return calculateAshtakoot(personA, personB);
  }

  const matchJobs: MatchJob[] = [
    { aLabel: "A", bLabel: "B", promise: interleavedMatch(PERSON_A, PERSON_B) },
    { aLabel: "C", bLabel: "D", promise: interleavedMatch(PERSON_C, PERSON_D) },
    { aLabel: "B", bLabel: "A", promise: interleavedMatch(PERSON_B, PERSON_A) }, // reversed
    { aLabel: "D", bLabel: "C", promise: interleavedMatch(PERSON_D, PERSON_C) }, // reversed
    { aLabel: "A", bLabel: "A", promise: interleavedMatch(PERSON_A, PERSON_A) }, // repeated identical
    { aLabel: "B", bLabel: "B", promise: interleavedMatch(PERSON_B, PERSON_B) },
    { aLabel: "A", bLabel: "C", promise: interleavedMatch(PERSON_A, PERSON_C) },
    { aLabel: "B", bLabel: "D", promise: interleavedMatch(PERSON_B, PERSON_D) },
    { aLabel: "C", bLabel: "A", promise: interleavedMatch(PERSON_C, PERSON_A) },
    { aLabel: "D", bLabel: "B", promise: interleavedMatch(PERSON_D, PERSON_B) },
  ];
  assert.ok(matchJobs.length >= 10, "need a healthy mix of concurrent match jobs");

  const matchResults = await Promise.all(matchJobs.map((j) => j.promise));

  // Build the same reference (serial, one calculateAshtakoot call at a
  // time) input from each person's already-verified reference chart,
  // and assert every concurrent result matches its own reference exactly.
  function referenceAshtakootPerson(label: string): AshtakootPerson {
    const chart = referenceCharts.get(label)!;
    return {
      moonSign: chart.planets.Moon.sign,
      nakshatraNumber: chart.planets.Moon.nakshatra.nakshatraNumber,
    };
  }

  matchResults.forEach((result, i) => {
    const { aLabel, bLabel } = matchJobs[i];
    const expected = calculateAshtakoot(referenceAshtakootPerson(aLabel), referenceAshtakootPerson(bLabel));
    assert.deepStrictEqual(
      result,
      expected,
      `match job #${i} (${aLabel},${bLabel}): concurrent result diverged from the serial reference — possible cross-request data mixing`
    );
  });

  console.log("isolation.test.ts: concurrency audit passed (20 chart calls + 10 match calls, all correctly isolated)");
}

// ---------------------------------------------------------------------
// Symmetry: calculateAshtakoot(A, B) vs calculateAshtakoot(B, A).
// Every koota except Varna is direction-agnostic (see calculate.ts's
// doc comments — Varna is the one documented exception: personA is
// conventionally bride/"you" and personB groom/"partner", and Varna's
// rule explicitly depends on that ordering). So swapping A/B must:
//   - leave vashya/tara/yoni/grahaMaitri/gana/bhakoot/nadi scores
//     identical (with personA/personB fields swapped);
//   - possibly change ONLY the varna score, hence possibly the total.
// ---------------------------------------------------------------------

function assertSymmetricExceptVarna(a: AshtakootPerson, b: AshtakootPerson, label: string) {
  const forward = calculateAshtakoot(a, b);
  const backward = calculateAshtakoot(b, a);

  for (const key of ["vashya", "tara", "yoni", "grahaMaitri", "gana", "bhakoot", "nadi"] as const) {
    assert.strictEqual(
      forward[key].score,
      backward[key].score,
      `${label}: ${key} koota must be symmetric under personA/personB swap`
    );
    assert.strictEqual(forward[key].personA, backward[key].personB, `${label}: ${key} personA/personB should swap`);
    assert.strictEqual(forward[key].personB, backward[key].personA, `${label}: ${key} personA/personB should swap`);
  }

  // Varna is the one documented directional exception.
  const varnaDelta = forward.varna.score - backward.varna.score;
  assert.ok(
    varnaDelta === 0 || Math.abs(varnaDelta) === 1,
    `${label}: varna score swap delta must be 0 or +/-1 (it's a 0/1 koota)`
  );

  // The total score can only differ by exactly the Varna delta — every
  // other koota is proven symmetric above.
  assert.strictEqual(
    forward.totalScore - backward.totalScore,
    varnaDelta,
    `${label}: total score swap delta must equal the varna delta exactly (every other koota is symmetric)`
  );
}

function runSymmetryAudit() {
  const personA = referenceAshtakootPersonFromChart(PERSON_A);
  const personB = referenceAshtakootPersonFromChart(PERSON_B);
  const personC = referenceAshtakootPersonFromChart(PERSON_C);
  const personD = referenceAshtakootPersonFromChart(PERSON_D);

  assertSymmetricExceptVarna(personA, personB, "A/B");
  assertSymmetricExceptVarna(personC, personD, "C/D");
  assertSymmetricExceptVarna(personA, personD, "A/D");
  assertSymmetricExceptVarna(personB, personC, "B/C");

  // Identical-person pairs: varna is reflexive (a rashi's own rank is
  // always >= itself), so forward === backward exactly, total score
  // included.
  const identicalResult = calculateAshtakoot(personA, personA);
  const identicalReversed = calculateAshtakoot(personA, personA);
  assert.deepStrictEqual(identicalResult, identicalReversed, "identical-person pair must be perfectly symmetric");

  console.log(
    "isolation.test.ts: symmetry audit passed (every koota symmetric under A/B swap except Varna, " +
      "which is the sole documented directional exception; total-score delta always equals the varna delta)"
  );
}

function referenceAshtakootPersonFromChart(p: SyntheticPerson): AshtakootPerson {
  const chart = referenceCharts.get(p.label)!;
  return {
    moonSign: chart.planets.Moon.sign,
    nakshatraNumber: chart.planets.Moon.nakshatra.nakshatraNumber,
  };
}

// ---------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------

await runConcurrencyAudit();
runSymmetryAudit();
