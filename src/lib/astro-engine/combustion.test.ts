// src/lib/astro-engine/combustion.test.ts
import assert from "node:assert/strict";
import { calculateChart, type ChartData, type ChartPlanetEntry } from "./ephemeris.ts";
import { calculateCombustion } from "./combustion.ts";

// --- real charts ---
const newDelhi1990 = calculateChart(new Date("1990-08-15T05:00:00Z"), 28.6139, 77.209);
const mumbai2000 = calculateChart(new Date("2000-01-01T12:00:00Z"), 19.076, 72.8777);

for (const chart of [newDelhi1990, mumbai2000]) {
  const combustion = calculateCombustion(chart);

  // Sun's own entry is trivial.
  assert.strictEqual(combustion.Sun.isCombust, false);
  assert.strictEqual(combustion.Sun.sunDistance, 0);
  assert.strictEqual(combustion.Sun.threshold, 0);

  // Rahu/Ketu/outer planets: never combust, threshold marked 0.
  for (const name of ["Rahu", "Ketu", "Uranus", "Neptune", "Pluto"] as const) {
    assert.strictEqual(combustion[name].isCombust, false, `${name} must never be combust`);
    assert.strictEqual(combustion[name].threshold, 0, `${name}: threshold not classically applicable`);
  }

  // sunDistance always 0-180 for every planet.
  for (const name of Object.keys(chart.planets) as (keyof typeof chart.planets)[]) {
    const d = combustion[name].sunDistance;
    assert.ok(d >= 0 && d <= 180, `${name}: sunDistance ${d} out of 0-180 range`);
  }
}

// ---------------------------------------------------------------------
// Synthetic boundary cases: exact per-planet threshold + retrograde
// difference.
// ---------------------------------------------------------------------

function syntheticChart(sunDegree: number, overrides: Record<string, { sign: number; degree: number; isRetrograde?: boolean }>): ChartData {
  const planets: Record<string, ChartPlanetEntry> = {};
  const nakshatra = { nakshatraNumber: 1, nakshatraName: "Ashwini" as const, pada: 1 };
  planets.Sun = { longitude: sunDegree, sign: Math.floor(sunDegree / 30) + 1, degree: sunDegree % 30, house: 1, isRetrograde: false, nakshatra };

  for (const [name, point] of Object.entries(overrides)) {
    const longitude = (point.sign - 1) * 30 + point.degree;
    planets[name] = { longitude, sign: point.sign, degree: point.degree, house: 1, isRetrograde: point.isRetrograde ?? false, nakshatra };
  }

  return {
    birthUtc: new Date().toISOString(),
    latitude: 0,
    longitude: 0,
    ayanamsha: 24,
    ascendant: { longitude: 0, sign: 1, degree: 0 },
    mc: { longitude: 0, sign: 1, degree: 0 },
    planets: planets as ChartData["planets"],
  };
}

// --- Moon: threshold 12°, same direct/retrograde (Moon is never
// retrograde in this engine anyway, but the threshold itself doesn't
// vary by direction per the researched table). ---
{
  // Sun at 0° Aries. Moon at exactly 12° away -> combust (<=).
  const atThreshold = calculateCombustion(syntheticChart(0, { Moon: { sign: 1, degree: 12 } })).Moon;
  assert.strictEqual(atThreshold.threshold, 12);
  assert.strictEqual(atThreshold.sunDistance, 12);
  assert.strictEqual(atThreshold.isCombust, true);

  // Just past threshold -> not combust.
  const pastThreshold = calculateCombustion(syntheticChart(0, { Moon: { sign: 1, degree: 12.5 } })).Moon;
  assert.strictEqual(pastThreshold.isCombust, false);
}

// --- Jupiter: threshold 11° (different from Moon's 12°) ---
{
  const atThreshold = calculateCombustion(syntheticChart(0, { Jupiter: { sign: 1, degree: 11 } })).Jupiter;
  assert.strictEqual(atThreshold.threshold, 11);
  assert.strictEqual(atThreshold.isCombust, true);

  const pastThreshold = calculateCombustion(syntheticChart(0, { Jupiter: { sign: 1, degree: 11.5 } })).Jupiter;
  assert.strictEqual(pastThreshold.isCombust, false);

  // Confirm the two thresholds actually differ (Moon 12 vs Jupiter 11).
  assert.notStrictEqual(atThreshold.threshold, 12);
}

// --- Mercury: 14° direct, 12° retrograde (narrower when retrograde) ---
{
  const direct = calculateCombustion(
    syntheticChart(0, { Mercury: { sign: 1, degree: 13, isRetrograde: false } })
  ).Mercury;
  assert.strictEqual(direct.threshold, 14);
  assert.strictEqual(direct.isCombust, true); // 13 <= 14

  const retrogradeSameDistance = calculateCombustion(
    syntheticChart(0, { Mercury: { sign: 1, degree: 13, isRetrograde: true } })
  ).Mercury;
  assert.strictEqual(retrogradeSameDistance.threshold, 12);
  assert.strictEqual(retrogradeSameDistance.isCombust, false); // 13 > 12, now NOT combust while retrograde

  assert.ok(direct.isCombust && !retrogradeSameDistance.isCombust, "same distance, direct combust but retrograde not, proving the retrograde threshold is narrower and actually applied");
}

// --- Venus: 10° direct, 8° retrograde ---
{
  const direct = calculateCombustion(
    syntheticChart(0, { Venus: { sign: 1, degree: 9, isRetrograde: false } })
  ).Venus;
  assert.strictEqual(direct.threshold, 10);
  assert.strictEqual(direct.isCombust, true);

  const retrograde = calculateCombustion(
    syntheticChart(0, { Venus: { sign: 1, degree: 9, isRetrograde: true } })
  ).Venus;
  assert.strictEqual(retrograde.threshold, 8);
  assert.strictEqual(retrograde.isCombust, false); // 9 > 8
}

// --- shortest-path wraparound: Sun near 359°, planet near 1° should
// still read as a small distance, not ~358°. ---
{
  const chart = syntheticChart(359, { Mars: { sign: 1, degree: 1 } }); // Sun at 359°, Mars at 1°
  const mars = calculateCombustion(chart).Mars;
  assert.ok(Math.abs(mars.sunDistance - 2) < 1e-9, `expected wraparound distance ~2°, got ${mars.sunDistance}`);
}

console.log("combustion.test.ts: all assertions passed");
