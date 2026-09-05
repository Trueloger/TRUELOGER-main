// src/lib/astro-engine/dignity.test.ts
import assert from "node:assert/strict";
import { calculateChart, type ChartData, type ChartPlanetEntry } from "./ephemeris.ts";
import { calculatePlanetaryDignity } from "./dignity.ts";

// --- real charts (a few different real birth inputs) ---
const newDelhi1990 = calculateChart(new Date("1990-08-15T05:00:00Z"), 28.6139, 77.209);
const mumbai2000 = calculateChart(new Date("2000-01-01T12:00:00Z"), 19.076, 72.8777);
const london1985 = calculateChart(new Date("1985-06-21T18:30:00Z"), 51.5074, -0.1278);

for (const chart of [newDelhi1990, mumbai2000, london1985]) {
  const dignity = calculatePlanetaryDignity(chart);

  // Rahu/Ketu/outer planets: no classical dignity system -> null.
  for (const name of ["Rahu", "Ketu", "Uranus", "Neptune", "Pluto"] as const) {
    assert.strictEqual(dignity[name], null, `${name} must be null (no classical dignity system)`);
  }

  // The 7 classical planets always get a result with internally
  // consistent flags.
  for (const name of ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const) {
    const d = dignity[name];
    assert.ok(d, `${name} must have a dignity result`);
    assert.strictEqual(d!.planet, name);
    assert.ok(d!.exaltationStrength >= 0 && d!.exaltationStrength <= 1, "exaltationStrength must be 0-1");
    // Mutually exclusive positional facts.
    assert.ok(!(d!.isExalted && d!.isDebilitated), `${name}: cannot be both exalted and debilitated`);
    if (d!.isMoolatrikona) {
      assert.ok(d!.isOwnSign || name === "Moon", `${name}: Moolatrikona sign must be an own sign (Moon is the documented exception, MT sits in its exaltation sign Taurus)`);
    }
  }
}

// ---------------------------------------------------------------------
// Exact-degree boundary cases via a synthetic ChartData-shaped object
// (constructing a full ChartData with only the fields dignity.ts
// actually reads: planets[name].sign / .degree / .longitude).
// ---------------------------------------------------------------------

function syntheticChart(overrides: Partial<Record<string, { sign: number; degree: number }>>): ChartData {
  const base: Record<string, ChartPlanetEntry> = {};
  const defaults: Record<string, { sign: number; degree: number }> = {
    Sun: { sign: 5, degree: 15 }, // own sign, mid-Leo, not MT
    Moon: { sign: 4, degree: 15 }, // own sign Cancer
    Mars: { sign: 3, degree: 15 }, // Gemini, enemy-ish territory
    Mercury: { sign: 3, degree: 15 }, // own sign Gemini
    Jupiter: { sign: 9, degree: 20 }, // own sign Sagittarius, past MT
    Venus: { sign: 2, degree: 15 }, // own sign Taurus
    Saturn: { sign: 10, degree: 15 }, // own sign Capricorn
  };
  const merged: Record<string, { sign: number; degree: number }> = { ...defaults, ...overrides } as Record<string, { sign: number; degree: number }>;
  for (const [name, point] of Object.entries(merged)) {
    const longitude = (point.sign - 1) * 30 + point.degree;
    base[name] = { longitude, sign: point.sign, degree: point.degree, house: 1, isRetrograde: false, nakshatra: { nakshatraNumber: 1, nakshatraName: "Ashwini", pada: 1 } };
  }
  return {
    birthUtc: new Date().toISOString(),
    latitude: 0,
    longitude: 0,
    ayanamsha: 24,
    ascendant: { longitude: 0, sign: 1, degree: 0 },
    mc: { longitude: 0, sign: 1, degree: 0 },
    planets: base as ChartData["planets"],
  };
}

// Sun at EXACT deep exaltation degree (Aries 10°) -> isExalted, strength = 1.
{
  const chart = syntheticChart({ Sun: { sign: 1, degree: 10 } });
  const d = calculatePlanetaryDignity(chart).Sun!;
  assert.strictEqual(d.isExalted, true);
  assert.ok(Math.abs(d.exaltationStrength - 1) < 1e-9, `expected strength ~1, got ${d.exaltationStrength}`);
  assert.strictEqual(d.dignity, "exalted");
}

// Sun 1 DEGREE PAST its debilitation-adjacent boundary: exactly at the
// debilitation degree (Libra 10°) -> isDebilitated, strength = 0; one
// degree further into Libra (11°) -> still debilitated sign, strength > 0.
{
  const atDebilitation = calculatePlanetaryDignity(syntheticChart({ Sun: { sign: 7, degree: 10 } })).Sun!;
  assert.strictEqual(atDebilitation.isDebilitated, true);
  assert.ok(Math.abs(atDebilitation.exaltationStrength - 0) < 1e-9, `expected strength ~0, got ${atDebilitation.exaltationStrength}`);
  assert.strictEqual(atDebilitation.dignity, "debilitated");

  const pastDebilitation = calculatePlanetaryDignity(syntheticChart({ Sun: { sign: 7, degree: 11 } })).Sun!;
  assert.strictEqual(pastDebilitation.isDebilitated, true);
  assert.ok(pastDebilitation.exaltationStrength > 0, "strength should rise moving away from the exact debilitation degree");
}

// Sun just OUTSIDE Aries (into Taurus 0°) -> not exalted at all.
{
  const d = calculatePlanetaryDignity(syntheticChart({ Sun: { sign: 2, degree: 0 } })).Sun!;
  assert.strictEqual(d.isExalted, false);
}

// --- Moolatrikona degree-range boundary: Sun, Leo 0-20 ---
{
  const justInside = calculatePlanetaryDignity(syntheticChart({ Sun: { sign: 5, degree: 19.99 } })).Sun!;
  assert.strictEqual(justInside.isMoolatrikona, true, "19.99° Leo must be inside Sun's Moolatrikona (0-20)");
  assert.strictEqual(justInside.dignity, "moolatrikona");

  const justOutside = calculatePlanetaryDignity(syntheticChart({ Sun: { sign: 5, degree: 20 } })).Sun!;
  assert.strictEqual(justOutside.isMoolatrikona, false, "exactly 20° Leo must be outside Moolatrikona (own-sign territory instead)");
  assert.strictEqual(justOutside.isOwnSign, true);
  assert.strictEqual(justOutside.dignity, "own-sign");

  const atStart = calculatePlanetaryDignity(syntheticChart({ Sun: { sign: 5, degree: 0 } })).Sun!;
  assert.strictEqual(atStart.isMoolatrikona, true, "0° Leo (range start) must be inside Moolatrikona");
}

// --- Moolatrikona for Mercury: Virgo 15-20 (a mid-sign range, not
// starting at 0°, to exercise the lower boundary too) ---
{
  const belowRange = calculatePlanetaryDignity(syntheticChart({ Mercury: { sign: 6, degree: 14.99 } })).Mercury!;
  assert.strictEqual(belowRange.isMoolatrikona, false, "14.99° Virgo is exaltation territory, not MT");
  assert.strictEqual(belowRange.isExalted, true);

  const atLowerBoundary = calculatePlanetaryDignity(syntheticChart({ Mercury: { sign: 6, degree: 15 } })).Mercury!;
  assert.strictEqual(atLowerBoundary.isMoolatrikona, true, "exactly 15° Virgo must be inside Mercury's MT (15-20)");

  const aboveRange = calculatePlanetaryDignity(syntheticChart({ Mercury: { sign: 6, degree: 20 } })).Mercury!;
  assert.strictEqual(aboveRange.isMoolatrikona, false, "exactly 20° Virgo is past MT, own-house territory");
  assert.strictEqual(aboveRange.isOwnSign, true);
}

// --- Naisargika Maitri asymmetry, isolated and proven at the final
// classification level: the Moon regards Mercury as a FRIEND, but
// Mercury regards the Moon as an ENEMY (a real, sourced non-symmetric
// pair — see NATURAL_FRIENDSHIP doc comment). Two mirrored charts hold
// the TEMPORARY (Tatkalika) component identical (sign-distance 2 =
// "friend" in both cases) so the only thing that can differ is the
// natural-friendship direction — and it does: great-friend vs neutral,
// not the same label both ways. ---
{
  // Moon in Gemini (sign 3, Mercury-ruled); Mercury itself sits 2 signs
  // ahead in Cancer (sign 4) -> temporary = friend (distance 2).
  // Natural (Moon -> Mercury) = friend. friend+friend = great-friend.
  const moonInMercurySign = calculatePlanetaryDignity(
    syntheticChart({ Moon: { sign: 3, degree: 10 }, Mercury: { sign: 4, degree: 10 } })
  ).Moon!;
  assert.strictEqual(moonInMercurySign.signLordRelationship, "great-friend");

  // Mirror image: Mercury in Cancer (sign 4, Moon-ruled); Moon itself
  // sits 2 signs ahead in Leo (sign 5) -> temporary = friend (distance
  // 2, same as above). Natural (Mercury -> Moon) = enemy.
  // friend+enemy = neutral (not great-friend, not great-enemy).
  const mercuryInMoonSign = calculatePlanetaryDignity(
    syntheticChart({ Mercury: { sign: 4, degree: 10 }, Moon: { sign: 5, degree: 10 } })
  ).Mercury!;
  assert.strictEqual(mercuryInMoonSign.signLordRelationship, "neutral");

  assert.notStrictEqual(
    moonInMercurySign.signLordRelationship,
    mercuryInMoonSign.signLordRelationship,
    "identical temporary-friendship distance, opposite natural-friendship direction, must yield different final tiers"
  );
}

// --- own-sign planet gets signLordRelationship === null ---
{
  const d = calculatePlanetaryDignity(syntheticChart({ Sun: { sign: 5, degree: 25 } })).Sun!;
  assert.strictEqual(d.isOwnSign, true);
  assert.strictEqual(d.signLordRelationship, null, "own-sign occupant: sign-lord relationship to self is not meaningful");
}

console.log("dignity.test.ts: all assertions passed");
