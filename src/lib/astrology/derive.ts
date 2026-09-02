// src/lib/astrology/derive.ts
// Pure functions only — every value here is arithmetic performed on a
// real field already returned by freeastrologyapi.ts. Nothing in this
// file invents, guesses, or hardcodes an astrological result; each
// function's doc comment cites the exact traditional rule it
// implements and which raw API field feeds it.
import type { PlanetName, PlanetPositionsResult } from "./types.ts";

// ---------------------------------------------------------------------
// Rashi (Moon sign)
// ---------------------------------------------------------------------

const RASHI_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export type Rashi = { signNumber: number; signName: (typeof RASHI_NAMES)[number] };

/** Rashi (Moon sign): the sidereal zodiac sign containing a given
 * absolute longitude, 0-360°, divided into twelve 30° signs starting
 * at Aries (0-30°). Feed this the Moon's `fullDegree` from
 * getPlanetPositions()'s output.Moon to get the natal Rashi, or any
 * other planet's fullDegree for its own sign. (getPlanetPositions
 * already returns `current_sign`/`zodiac_sign_name` directly — this
 * function exists so the same deterministic formula is available for
 * any raw longitude, e.g. a transit longitude computed elsewhere.) */
export function deriveRashi(fullDegree: number): Rashi {
  const normalized = ((fullDegree % 360) + 360) % 360;
  const signNumber = Math.floor(normalized / 30) + 1; // 1-12
  return { signNumber, signName: RASHI_NAMES[signNumber - 1] };
}

// ---------------------------------------------------------------------
// Nakshatra + Pada
// ---------------------------------------------------------------------

const NAKSHATRA_NAMES = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
] as const;

export type NakshatraPada = {
  nakshatraNumber: number; // 1-27
  nakshatraName: (typeof NAKSHATRA_NAMES)[number];
  pada: number; // 1-4
};

const NAKSHATRA_SPAN_DEGREES = 360 / 27; // 13°20'
const PADA_SPAN_DEGREES = NAKSHATRA_SPAN_DEGREES / 4; // 3°20'

/** Nakshatra + Pada: the standard 27-nakshatra division of the 360°
 * ecliptic (each nakshatra spanning 13°20', each divided into four
 * 3°20' padas), applied to a real absolute sidereal longitude. Feed
 * this the Moon's `fullDegree` from getPlanetPositions()'s
 * output.Moon for the natal Nakshatra/Pada.
 * (getPlanetPositions's /planets/extended already returns
 * nakshatra_number/nakshatra_name/nakshatra_pada directly for every
 * planet — this function exists for endpoints/longitudes that don't,
 * e.g. the plain /planets endpoint, or a transit longitude.) */
export function deriveNakshatraPada(fullDegree: number): NakshatraPada {
  const normalized = ((fullDegree % 360) + 360) % 360;
  const nakshatraIndex = Math.floor(normalized / NAKSHATRA_SPAN_DEGREES); // 0-26
  const degreeIntoNakshatra = normalized - nakshatraIndex * NAKSHATRA_SPAN_DEGREES;
  const pada = Math.floor(degreeIntoNakshatra / PADA_SPAN_DEGREES) + 1; // 1-4

  return {
    nakshatraNumber: nakshatraIndex + 1,
    nakshatraName: NAKSHATRA_NAMES[nakshatraIndex],
    pada,
  };
}

// ---------------------------------------------------------------------
// Mangal Dosha (Kuja Dosha)
// ---------------------------------------------------------------------

/** Whole-sign house count from `baseSign` to `targetSign` (both 1-12,
 * sidereal sign numbers): 1 if they're the same sign, counting
 * upward/wrapping otherwise. This is exactly how Vedic whole-sign
 * houses are counted from any reference point (Ascendant, Moon, ...),
 * and is what PlanetExtendedEntry.house_number already applies
 * relative to the Ascendant specifically. */
export function signHouseNumber(baseSign: number, targetSign: number): number {
  return (((targetSign - baseSign) % 12) + 12) % 12 + 1;
}

const MANGAL_DOSHA_HOUSES = new Set([1, 2, 4, 7, 8, 12]);

export type MangalDoshaResult = {
  hasDosha: boolean;
  houseFromAscendant: number;
  houseFromMoon: number;
  /** true if Mars falls in a dosha house counted from the Ascendant */
  fromAscendant: boolean;
  /** true if Mars falls in a dosha house counted from the Moon */
  fromMoon: boolean;
};

/** Mangal Dosha (Kuja Dosha): present when Mars occupies house 1, 2,
 * 4, 7, 8, or 12 counted from EITHER the Ascendant OR the natal Moon
 * — the traditional rule combining both the Lagna-based and
 * Moon-based checks used across classical sources. Reads real
 * `current_sign` values for Ascendant, Moon, and Mars straight out of
 * getPlanetPositions()'s output (Mars's own `house_number` field
 * already gives the Ascendant-based count directly, but this
 * recomputes it from current_sign so the same formula also covers the
 * Moon-based count, which the API does not return). */
export function deriveMangalDosha(
  planets: PlanetPositionsResult["output"]
): MangalDoshaResult {
  const ascendant = requirePlanet(planets, "Ascendant");
  const moon = requirePlanet(planets, "Moon");
  const mars = requirePlanet(planets, "Mars");

  const houseFromAscendant = signHouseNumber(ascendant.current_sign, mars.current_sign);
  const houseFromMoon = signHouseNumber(moon.current_sign, mars.current_sign);

  const fromAscendant = MANGAL_DOSHA_HOUSES.has(houseFromAscendant);
  const fromMoon = MANGAL_DOSHA_HOUSES.has(houseFromMoon);

  return {
    hasDosha: fromAscendant || fromMoon,
    houseFromAscendant,
    houseFromMoon,
    fromAscendant,
    fromMoon,
  };
}

function requirePlanet(
  planets: PlanetPositionsResult["output"],
  name: PlanetName
): NonNullable<PlanetPositionsResult["output"][PlanetName]> {
  const entry = planets[name];
  if (!entry) throw new Error(`deriveMangalDosha: missing "${name}" in planets response`);
  return entry;
}

// ---------------------------------------------------------------------
// Sade Sati
// ---------------------------------------------------------------------

export type SadeSatiPhase = "rising" | "peak" | "setting";

export type SadeSatiResult = {
  active: boolean;
  phase: SadeSatiPhase | null;
  /** whole-sign house of transiting Saturn counted from the natal Moon sign (1-12) */
  houseFromNatalMoon: number;
};

/** Sade Sati: active when transiting Saturn is in the 12th, 1st, or
 * 2nd sign counted from the natal Moon's Rashi — the classical
 * three-phase rule ("rising" while in the 12th, "peak" while
 * transiting the Moon's own sign, "setting" while in the 2nd).
 * Callers derive `natalMoonSign` from a birth-moment
 * getPlanetPositions() call's output.Moon.current_sign, and
 * `transitingSaturnSign` from a CURRENT-moment getPlanetPositions()
 * call's output.Saturn.current_sign (same function, different
 * date/time — Saturn's sidereal sign is effectively
 * location-independent, so `settings.observation_point: "geocentric"`
 * is the appropriate choice for that current-moment call). */
export function deriveSadeSati(natalMoonSign: number, transitingSaturnSign: number): SadeSatiResult {
  const houseFromNatalMoon = signHouseNumber(natalMoonSign, transitingSaturnSign);

  let phase: SadeSatiPhase | null = null;
  if (houseFromNatalMoon === 12) phase = "rising";
  else if (houseFromNatalMoon === 1) phase = "peak";
  else if (houseFromNatalMoon === 2) phase = "setting";

  return { active: phase !== null, phase, houseFromNatalMoon };
}
