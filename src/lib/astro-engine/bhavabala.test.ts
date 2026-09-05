// src/lib/astro-engine/bhavabala.test.ts
import assert from "node:assert/strict";
import { calculateChart, type ChartData } from "./ephemeris.ts";
import { calculateBhavaBala } from "./bhavabala.ts";

// --- a sweep of >=10 real, varied charts: no exceptions, 12 houses
// each, every total a finite number ---
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
  const bhavaBala = calculateBhavaBala(chart);

  assert.strictEqual(bhavaBala.length, 12, "must return exactly 12 houses");

  const seenHouses = new Set<number>();
  for (const result of bhavaBala) {
    assert.ok(result.house >= 1 && result.house <= 12, "house must be 1-12");
    seenHouses.add(result.house);

    assert.ok(Number.isFinite(result.totalStrength), `house ${result.house}: totalStrength must be finite, got ${result.totalStrength}`);
    assert.ok(!Number.isNaN(result.totalStrength), `house ${result.house}: totalStrength must not be NaN`);

    for (const [key, value] of Object.entries(result.strengthComponents)) {
      assert.ok(Number.isFinite(value), `house ${result.house}.strengthComponents.${key} must be finite, got ${value}`);
    }

    assert.ok(Number.isInteger(result.aspectsReceived) && result.aspectsReceived >= 0, `house ${result.house}: aspectsReceived must be a non-negative integer`);
    assert.ok(Array.isArray(result.occupants), `house ${result.house}: occupants must be an array`);
    assert.ok(typeof result.houseLord === "string" && result.houseLord.length > 0, `house ${result.house}: houseLord must be set`);

    // totalStrength must equal the sum of its own named components.
    const sum =
      result.strengthComponents.bhavadhipatiBala +
      result.strengthComponents.bhavaDigBala +
      result.strengthComponents.bhavaDrishtiBala +
      result.strengthComponents.occupantBala;
    assert.ok(Math.abs(result.totalStrength - sum) < 1e-9, `house ${result.house}: totalStrength must equal the sum of strengthComponents`);
  }
  assert.strictEqual(seenHouses.size, 12, "all 12 houses must be represented exactly once");

  // Every planet in the chart must be an occupant of exactly one house,
  // and that house's occupant list must include it.
  for (const [name, entry] of Object.entries(chart.planets)) {
    const houseResult = bhavaBala.find((h) => h.house === entry.house)!;
    assert.ok(houseResult.occupants.includes(name as never), `${name} (house ${entry.house}) must appear in that house's occupants`);
  }
}

// --- determinism ---
{
  const chart = charts[0];
  const a = calculateBhavaBala(chart);
  const b = calculateBhavaBala(chart);
  assert.deepStrictEqual(a, b, "Bhava Bala must be deterministic");
}

// ---------------------------------------------------------------------
// Hand-reasoned sanity check: a Kendra house (1st) must score a higher
// Bhava Digbala sub-component than an Apoklima house (12th) —
// mirrors shadbala.ts's own Kendradi Bala convention, applied to
// houses instead of planets.
// ---------------------------------------------------------------------
{
  const chart = charts[0];
  const bhavaBala = calculateBhavaBala(chart);
  const first = bhavaBala.find((h) => h.house === 1)!;
  const twelfth = bhavaBala.find((h) => h.house === 12)!;
  assert.ok(
    first.strengthComponents.bhavaDigBala > twelfth.strengthComponents.bhavaDigBala,
    "1st house (Kendra) must score higher Bhava Digbala than the 12th (Apoklima)"
  );
  assert.strictEqual(first.strengthComponents.bhavaDigBala, 60, "1st house is a Kendra: must score the max 60");
  assert.strictEqual(twelfth.strengthComponents.bhavaDigBala, 15, "12th house is an Apoklima: must score 15");
}

// --- every house's lord must be one of the 7 classical planets ---
{
  const CLASSICAL = new Set(["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]);
  for (const chart of charts) {
    for (const result of calculateBhavaBala(chart)) {
      assert.ok(CLASSICAL.has(result.houseLord), `house ${result.house}: houseLord must be one of the 7 classical planets, got ${result.houseLord}`);
    }
  }
}

console.log("bhavabala.test.ts: all assertions passed");
