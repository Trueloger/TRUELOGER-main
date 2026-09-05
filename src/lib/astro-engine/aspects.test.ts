// src/lib/astro-engine/aspects.test.ts
import assert from "node:assert/strict";
import { calculateChart, type ChartData, type ChartPlanetEntry } from "./ephemeris.ts";
import { calculateAspects, aspectsToSign } from "./aspects.ts";

function signOffset(sign: number, offset: number): number {
  return ((sign - 1 + offset) % 12) + 1;
}

function syntheticChart(overrides: Partial<Record<string, { sign: number }>>): ChartData {
  const nakshatra = { nakshatraNumber: 1, nakshatraName: "Ashwini" as const, pada: 1 };
  const planets: Record<string, ChartPlanetEntry> = {};
  const defaults: Record<string, number> = {
    Sun: 1, Moon: 1, Mars: 1, Mercury: 1, Jupiter: 1, Venus: 1, Saturn: 1, Rahu: 1, Ketu: 7,
  };
  for (const [name, sign] of Object.entries({ ...defaults, ...Object.fromEntries(Object.entries(overrides).map(([k, v]) => [k, v!.sign])) })) {
    planets[name] = { longitude: (sign - 1) * 30, sign, degree: 0, house: 1, isRetrograde: false, nakshatra };
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

// --- real chart sanity: every classical planet's 7th aspect present ---
{
  const chart = calculateChart(new Date("1990-08-15T05:00:00Z"), 28.6139, 77.209);
  const aspects = calculateAspects(chart);
  for (const planet of ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const) {
    const fromSign = chart.planets[planet].sign;
    const expectedSeventh = signOffset(fromSign, 6);
    assert.ok(
      aspects.some((a) => a.fromPlanet === planet && a.aspectType === "7th" && a.toSign === expectedSeventh),
      `${planet} must cast its 7th-sign aspect`
    );
  }
  // No Rahu/Ketu aspects by default.
  assert.ok(!aspects.some((a) => a.fromPlanet === "Rahu" || a.fromPlanet === "Ketu"), "default: no node aspects");
}

// --- Mars from Aries (sign 1): universal 7th (Libra=7), special 4th
// (Cancer=4) and 8th (Scorpio=8) ---
{
  const chart = syntheticChart({ Mars: { sign: 1 } });
  const aspects = calculateAspects(chart).filter((a) => a.fromPlanet === "Mars");
  assert.strictEqual(aspects.length, 3, "Mars must cast exactly 3 aspects (7th, 4th, 8th)");
  assert.ok(aspects.some((a) => a.aspectType === "7th" && a.toSign === 7));
  assert.ok(aspects.some((a) => a.aspectType === "4th" && a.toSign === 4));
  assert.ok(aspects.some((a) => a.aspectType === "8th" && a.toSign === 8));
}

// --- Jupiter from Aries: universal 7th (Libra=7), special 5th
// (Leo=5) and 9th (Sagittarius=9) ---
{
  const chart = syntheticChart({ Jupiter: { sign: 1 } });
  const aspects = calculateAspects(chart).filter((a) => a.fromPlanet === "Jupiter");
  assert.strictEqual(aspects.length, 3);
  assert.ok(aspects.some((a) => a.aspectType === "7th" && a.toSign === 7));
  assert.ok(aspects.some((a) => a.aspectType === "5th" && a.toSign === 5));
  assert.ok(aspects.some((a) => a.aspectType === "9th" && a.toSign === 9));
}

// --- Saturn from Aries: universal 7th (Libra=7), special 3rd
// (Gemini=3) and 10th (Capricorn=10) ---
{
  const chart = syntheticChart({ Saturn: { sign: 1 } });
  const aspects = calculateAspects(chart).filter((a) => a.fromPlanet === "Saturn");
  assert.strictEqual(aspects.length, 3);
  assert.ok(aspects.some((a) => a.aspectType === "7th" && a.toSign === 7));
  assert.ok(aspects.some((a) => a.aspectType === "3rd" && a.toSign === 3));
  assert.ok(aspects.some((a) => a.aspectType === "10th" && a.toSign === 10));
}

// --- Sun/Moon/Mercury/Venus: ONLY the universal 7th, no special aspects ---
{
  const chart = syntheticChart({ Sun: { sign: 1 }, Moon: { sign: 1 }, Mercury: { sign: 1 }, Venus: { sign: 1 } });
  const aspects = calculateAspects(chart);
  for (const planet of ["Sun", "Moon", "Mercury", "Venus"] as const) {
    const own = aspects.filter((a) => a.fromPlanet === planet);
    assert.strictEqual(own.length, 1, `${planet} must cast exactly 1 aspect (7th only)`);
    assert.strictEqual(own[0].aspectType, "7th");
    assert.strictEqual(own[0].toSign, 7);
  }
}

// --- includeNodeAspects opt-in ---
{
  const chart = syntheticChart({ Rahu: { sign: 1 }, Ketu: { sign: 7 } });
  const withoutNodes = calculateAspects(chart);
  assert.ok(!withoutNodes.some((a) => a.fromPlanet === "Rahu" || a.fromPlanet === "Ketu"));

  const withNodes = calculateAspects(chart, { includeNodeAspects: true });
  assert.ok(withNodes.some((a) => a.fromPlanet === "Rahu" && a.aspectType === "7th" && a.toSign === 7));
  assert.ok(withNodes.some((a) => a.fromPlanet === "Ketu" && a.aspectType === "7th" && a.toSign === 1));
}

// --- aspectsToSign helper ---
{
  const chart = syntheticChart({ Mars: { sign: 1 }, Saturn: { sign: 1 } });
  // Both Mars (8th) and Saturn (10th, since Saturn's special aspects
  // are 3rd/10th) land on sign 8/10 respectively — check sign 8 gets
  // only Mars's 8th aspect, and that other planets' 7th aspects (all
  // pinned to sign 1 by default -> 7th = sign 7) don't leak in.
  const toSign8 = aspectsToSign(chart, 8);
  assert.ok(toSign8.some((a) => a.fromPlanet === "Mars" && a.aspectType === "8th"));
  assert.ok(toSign8.every((a) => a.toSign === 8), "aspectsToSign must only return aspects landing on the requested sign");

  const toSign7 = aspectsToSign(chart, 7);
  // Sun/Moon/Mercury/Venus/Jupiter (default sign 1) all cast a 7th
  // aspect to sign 7; Mars and Saturn (also sign 1) also cast their
  // universal 7th to sign 7.
  assert.ok(toSign7.length >= 7);
}

console.log("aspects.test.ts: all assertions passed");
