// src/lib/astro-engine/shadbala.test.ts
import assert from "node:assert/strict";
import { calculateChart, type ChartData, type ChartPlanetEntry } from "./ephemeris.ts";
import { calculateShadbala } from "./shadbala.ts";

const CLASSICAL_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;
const NON_CLASSICAL = ["Rahu", "Ketu", "Uranus", "Neptune", "Pluto"] as const;

// --- a sweep of >=10 real, varied charts: no exceptions, no NaN/Infinity ---
const charts: ChartData[] = [
  calculateChart(new Date("1990-08-15T05:00:00Z"), 28.6139, 77.209), // New Delhi
  calculateChart(new Date("2000-01-01T12:00:00Z"), 19.076, 72.8777), // Mumbai
  calculateChart(new Date("1985-06-21T18:30:00Z"), 51.5074, -0.1278), // London
  calculateChart(new Date("1975-12-25T00:00:00Z"), 40.7128, -74.006), // New York
  calculateChart(new Date("2010-03-14T09:15:00Z"), -33.8688, 151.2093), // Sydney
  calculateChart(new Date("1960-07-04T06:45:00Z"), 35.6762, 139.6503), // Tokyo
  calculateChart(new Date("1995-11-11T23:59:00Z"), -1.2921, 36.8219), // Nairobi
  calculateChart(new Date("2020-02-29T03:33:00Z"), 55.7558, 37.6173), // Moscow
  calculateChart(new Date("1888-01-01T12:00:00Z"), 28.6139, 77.209), // pre-1945, New Delhi
  calculateChart(new Date("2023-09-23T00:00:00Z"), 0, 0), // equator/prime meridian
  calculateChart(new Date("1950-06-15T12:00:00Z"), 60, 0), // high latitude
];

assert.ok(charts.length >= 10, "must sweep at least 10 real charts");

for (const chart of charts) {
  const shadbala = calculateShadbala(chart);

  for (const name of NON_CLASSICAL) {
    assert.strictEqual(shadbala[name], null, `${name} must have no Shadbala`);
  }

  for (const name of CLASSICAL_PLANETS) {
    const s = shadbala[name];
    assert.ok(s, `${name} must have a Shadbala result`);
    assert.strictEqual(s!.planet, name);

    for (const [key, value] of Object.entries(s!)) {
      if (typeof value === "number") {
        assert.ok(Number.isFinite(value), `${name}.${key} must be finite, got ${value}`);
      }
    }

    if (name === "Sun" || name === "Moon") {
      assert.strictEqual(s!.cheshtaBala, null, `${name}: cheshtaBala must be null`);
    } else {
      assert.ok(typeof s!.cheshtaBala === "number", `${name}: cheshtaBala must be a number`);
      assert.ok(s!.cheshtaBala! >= 0 && s!.cheshtaBala! <= 60, `${name}: cheshtaBala must be 0-60`);
    }

    assert.ok(s!.digBala >= 0 && s!.digBala <= 60, `${name}: digBala must be 0-60`);
    assert.ok(s!.naisargikaBala > 0 && s!.naisargikaBala <= 60, `${name}: naisargikaBala must be 0-60`);
    assert.strictEqual(s!.totalRupas, s!.totalVirupas / 60);
    assert.ok(s!.requiredRupas > 0, `${name}: requiredRupas must be sourced/positive`);
    assert.strictEqual(s!.meetsRequirement, s!.totalRupas >= s!.requiredRupas);
  }
}

// --- determinism: same chart, same result ---
{
  const chart = charts[0];
  const a = calculateShadbala(chart);
  const b = calculateShadbala(chart);
  for (const name of CLASSICAL_PLANETS) {
    assert.deepStrictEqual(a[name], b[name], `${name}: Shadbala must be deterministic`);
  }
}

// --- Naisargika Bala: fixed classical ranking, chart-independent ---
{
  const s = calculateShadbala(charts[0]);
  assert.ok(s.Sun!.naisargikaBala > s.Moon!.naisargikaBala, "Sun > Moon naisargika");
  assert.ok(s.Moon!.naisargikaBala > s.Venus!.naisargikaBala, "Moon > Venus naisargika");
  assert.ok(s.Venus!.naisargikaBala > s.Jupiter!.naisargikaBala, "Venus > Jupiter naisargika");
  assert.ok(s.Jupiter!.naisargikaBala > s.Mercury!.naisargikaBala, "Jupiter > Mercury naisargika");
  assert.ok(s.Mercury!.naisargikaBala > s.Mars!.naisargikaBala, "Mercury > Mars naisargika");
  assert.ok(s.Mars!.naisargikaBala > s.Saturn!.naisargikaBala, "Mars > Saturn naisargika");
  assert.ok(Math.abs(s.Sun!.naisargikaBala - 60) < 1e-9, "Sun naisargika must be exactly 60");
  // Same chart-independent value across all charts.
  const s2 = calculateShadbala(charts[1]);
  assert.strictEqual(s.Saturn!.naisargikaBala, s2.Saturn!.naisargikaBala);
}

// ---------------------------------------------------------------------
// Hand-reasoned sanity check: a planet at its EXACT exaltation degree
// must score a higher Sthana Bala (via Uchcha Bala) than the same
// planet at its EXACT debilitation degree, via a synthetic chart.
// ---------------------------------------------------------------------
function syntheticChart(overrides: Partial<Record<string, { sign: number; degree: number }>>): ChartData {
  const base: Record<string, ChartPlanetEntry> = {};
  const defaults: Record<string, { sign: number; degree: number }> = {
    Sun: { sign: 5, degree: 15 },
    Moon: { sign: 4, degree: 15 },
    Mars: { sign: 3, degree: 15 },
    Mercury: { sign: 3, degree: 15 },
    Jupiter: { sign: 9, degree: 20 },
    Venus: { sign: 2, degree: 15 },
    Saturn: { sign: 10, degree: 15 },
  };
  const merged: Record<string, { sign: number; degree: number }> = { ...defaults, ...overrides } as Record<string, { sign: number; degree: number }>;
  for (const [name, point] of Object.entries(merged)) {
    const longitude = (point.sign - 1) * 30 + point.degree;
    base[name] = { longitude, sign: point.sign, degree: point.degree, house: 1, isRetrograde: false, nakshatra: { nakshatraNumber: 1, nakshatraName: "Ashwini", pada: 1 } };
  }
  return {
    birthUtc: new Date("2000-01-01T12:00:00Z").toISOString(),
    latitude: 28.6139,
    longitude: 77.209,
    ayanamsha: 24,
    ascendant: { longitude: 0, sign: 1, degree: 0 },
    mc: { longitude: 270, sign: 10, degree: 0 },
    planets: base as ChartData["planets"],
  };
}

{
  // Sun exact exaltation (Aries 10deg) vs exact debilitation (Libra 10deg).
  const exalted = calculateShadbala(syntheticChart({ Sun: { sign: 1, degree: 10 } })).Sun!;
  const debilitated = calculateShadbala(syntheticChart({ Sun: { sign: 7, degree: 10 } })).Sun!;
  assert.ok(
    exalted.sthanaBalaComponents.uchchaBala > debilitated.sthanaBalaComponents.uchchaBala,
    "Sun at exact exaltation must have higher Uchcha Bala than Sun at exact debilitation"
  );
  assert.ok(
    Math.abs(exalted.sthanaBalaComponents.uchchaBala - 60) < 1e-9,
    "Uchcha Bala at exact exaltation must be the max, 60 Virupas"
  );
  assert.ok(
    Math.abs(debilitated.sthanaBalaComponents.uchchaBala - 0) < 1e-9,
    "Uchcha Bala at exact debilitation must be 0"
  );
  assert.ok(exalted.sthanaBala > debilitated.sthanaBala, "Sun exalted: overall Sthana Bala must also be higher");
}

// --- Dig Bala sanity: Sun at the Midheaven (its strongest point) must
// score the Dig Bala max (60); Sun at the IC (its weakest point) must
// score the min (0). ---
{
  const atMc = syntheticChart({});
  atMc.mc = { longitude: (atMc.planets.Sun.sign - 1) * 30 + atMc.planets.Sun.degree, sign: 1, degree: 0 };
  const sunAtMc = calculateShadbala(atMc).Sun!;
  assert.ok(Math.abs(sunAtMc.digBala - 60) < 1e-6, `Sun at its own Dig-Bala strongest point (MC) must score ~60, got ${sunAtMc.digBala}`);

  const atIc = syntheticChart({});
  atIc.mc = {
    longitude: normalizeToTest(((atIc.planets.Sun.sign - 1) * 30 + atIc.planets.Sun.degree) + 180),
    sign: 1,
    degree: 0,
  };
  const sunAtIc = calculateShadbala(atIc).Sun!;
  assert.ok(Math.abs(sunAtIc.digBala - 0) < 1e-6, `Sun at its own Dig-Bala weakest point (IC) must score ~0, got ${sunAtIc.digBala}`);
}

function normalizeToTest(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

// --- Paksha Bala sanity: full Moon (elongation 180) scores the Moon's
// own Paksha Bala max (60); new Moon (elongation 0) scores the min (0). ---
{
  const fullMoon = syntheticChart({ Moon: { sign: 5, degree: 15 }, Sun: { sign: 11, degree: 15 } }); // 180 deg apart
  const s1 = calculateShadbala(fullMoon).Moon!;
  assert.ok(Math.abs(s1.kalaBalaComponents.pakshaBala - 60) < 1e-6, `full Moon must score ~60 Paksha Bala, got ${s1.kalaBalaComponents.pakshaBala}`);

  const newMoon = syntheticChart({ Moon: { sign: 5, degree: 15 }, Sun: { sign: 5, degree: 15 } }); // conjunct
  const s2 = calculateShadbala(newMoon).Moon!;
  assert.ok(Math.abs(s2.kalaBalaComponents.pakshaBala - 0) < 1e-6, `new Moon must score ~0 Paksha Bala, got ${s2.kalaBalaComponents.pakshaBala}`);
}

console.log("shadbala.test.ts: all assertions passed");
