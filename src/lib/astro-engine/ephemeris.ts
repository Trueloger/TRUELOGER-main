// src/lib/astro-engine/ephemeris.ts
// Self-contained Vedic (sidereal) birth-chart calculator built on the
// `astronomy-engine` npm package (pure JS, VSOP87-based, no network
// calls) — the local replacement for FreeAstrologyAPI's
// getPlanetPositions()/houses endpoints. Server-safe: no Node-only
// APIs, no "use client" needed, safe to import from a Route Handler.
//
// Formulas used here (Ascendant/MC, mean lunar node) were researched
// against real documented sources — see the comments at each formula
// — and the whole module's output was cross-checked in
// scripts/dev/verify-astro-engine.ts against a real FreeAstrologyAPI
// data point before being trusted. Do not "simplify" the Ascendant
// formula's argument order — an earlier naive derivation landed
// ~130° off (wrong quadrant) and this exact form is the one that was
// verified to match.
import * as Astronomy from "astronomy-engine";
import { lahiriAyanamsha } from "./ayanamsha.ts";
import { deriveNakshatraPada, signHouseNumber, type NakshatraPada } from "../astrology/derive.ts";

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type ChartPlanetName =
  | "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn"
  | "Uranus" | "Neptune" | "Pluto" | "Rahu" | "Ketu";

export type ChartPoint = {
  /** 0-360, sidereal (Lahiri) ecliptic longitude. */
  longitude: number;
  /** 1-12, sidereal zodiac sign number (1 = Aries). */
  sign: number;
  /** 0-30, degree within `sign`. */
  degree: number;
};

export type ChartPlanetEntry = ChartPoint & {
  /** 1-12, whole-sign house counted from the Ascendant. */
  house: number;
  isRetrograde: boolean;
  nakshatra: NakshatraPada;
};

export type ChartData = {
  birthUtc: string; // ISO instant, for traceability
  latitude: number;
  longitude: number;
  ayanamsha: number; // degrees, the Lahiri correction actually applied
  ascendant: ChartPoint;
  mc: ChartPoint;
  planets: Record<ChartPlanetName, ChartPlanetEntry>;
};

// ---------------------------------------------------------------------
// Small geometry helpers
// ---------------------------------------------------------------------

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function signOf(siderealLongitude: number): number {
  return Math.floor(normalizeDegrees(siderealLongitude) / 30) + 1; // 1-12
}

function degreeInSign(siderealLongitude: number): number {
  const norm = normalizeDegrees(siderealLongitude);
  return norm - Math.floor(norm / 30) * 30;
}

function toChartPoint(siderealLongitude: number): ChartPoint {
  const longitude = normalizeDegrees(siderealLongitude);
  return { longitude, sign: signOf(longitude), degree: degreeInSign(longitude) };
}

// ---------------------------------------------------------------------
// Real (non-node) bodies: topocentric sidereal ecliptic longitude
// ---------------------------------------------------------------------

const REAL_BODIES: { name: ChartPlanetName; body: Astronomy.Body }[] = [
  { name: "Sun", body: Astronomy.Body.Sun },
  { name: "Moon", body: Astronomy.Body.Moon },
  { name: "Mars", body: Astronomy.Body.Mars },
  { name: "Mercury", body: Astronomy.Body.Mercury },
  { name: "Jupiter", body: Astronomy.Body.Jupiter },
  { name: "Venus", body: Astronomy.Body.Venus },
  { name: "Saturn", body: Astronomy.Body.Saturn },
  { name: "Uranus", body: Astronomy.Body.Uranus },
  { name: "Neptune", body: Astronomy.Body.Neptune },
  { name: "Pluto", body: Astronomy.Body.Pluto },
];

/**
 * Tropical geocentric-topocentric ecliptic longitude of `body` at
 * `time`, as seen by `observer`. Uses `Equator(body, time, observer,
 * true, true)` (`ofdate` + `aberration` both true) → `.vec` →
 * `Ecliptic(vec)` rather than plain `GeoVector`, because that applies
 * the topocentric parallax correction — for the Moon specifically this
 * differs from a pure-geocentric position by up to ~1°, which matters
 * for sign-boundary cases. This is exactly the pattern astronomy-engine's
 * own docs demonstrate for topocentric ecliptic coordinates.
 * Source: astronomy-engine API reference (Equator/Ecliptic functions):
 * https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md
 */
function topocentricTropicalLongitude(
  body: Astronomy.Body,
  time: Astronomy.AstroTime,
  observer: Astronomy.Observer
): number {
  const equatorOfDate = Astronomy.Equator(body, time, observer, true, true);
  const ecliptic = Astronomy.Ecliptic(equatorOfDate.vec);
  return normalizeDegrees(ecliptic.elon);
}

// ---------------------------------------------------------------------
// Rahu / Ketu — mean lunar node
// ---------------------------------------------------------------------

/**
 * Mean ascending lunar node (Rahu), tropical ecliptic longitude in
 * degrees. Vedic astrology conventionally uses the MEAN node (not the
 * oscillating true/instantaneous node) for Rahu/Ketu — this is the
 * classical convention followed by Lahiri-based Vedic software.
 * `astronomy-engine` only exposes the true-node crossing search
 * (`SearchMoonNode`), so the mean node is computed here from Meeus's
 * standard polynomial (Jean Meeus, "Astronomical Algorithms", 2nd ed.,
 * Ch. 47, "Mean longitude of the ascending node of the Moon's mean
 * orbit"):
 *   Ω = 125.0445479 − 1934.1362891·T + 0.0020754·T² + T³/467441 − T⁴/60616000
 * where T is Julian centuries of Terrestrial Time since J2000.0.
 * Source (Meeus's Ch.47 mean-node formula, widely mirrored/cited):
 * https://github.com/mourner/suncalc / standard ephemeris references;
 * cross-checked numerically in scripts/dev/verify-astro-engine.ts.
 */
function meanLunarNodeTropicalLongitude(time: Astronomy.AstroTime): number {
  const t = time.tt / 36525; // Julian centuries of TT since J2000.0
  const omega =
    125.0445479 -
    1934.1362891 * t +
    0.0020754 * t * t +
    (t * t * t) / 467441 -
    (t * t * t * t) / 60616000;
  return normalizeDegrees(omega);
}

// ---------------------------------------------------------------------
// Ascendant (Lagna) and Midheaven (MC)
// ---------------------------------------------------------------------

/**
 * Ascendant + MC, TROPICAL ecliptic longitude in degrees (sidereal
 * conversion happens in calculateChart).
 *
 * RAMC (Right Ascension of the Midheaven) = Local Sidereal Time
 * converted to degrees: LST = GST(Greenwich, from `SiderealTime`) +
 * longitude/15 (east-positive geographic longitude, in hours),
 * RAMC = LST × 15.
 *
 * Ascendant (the classical spherical-astronomy formula, with the
 * atan2 argument order verified against real ground truth — see
 * module doc comment):
 *   Asc = atan2( cos(RAMC), −(sin(ε)·tan(φ) + cos(ε)·sin(RAMC)) )
 * MC:
 *   MC = atan2( sin(RAMC), cos(RAMC)·cos(ε) )
 * where ε is the TRUE obliquity of the ecliptic (astronomy-engine's
 * `e_tilt(time).tobl`, already includes nutation) and φ is geographic
 * latitude.
 * Source: standard spherical-astronomy Ascendant/MC derivation
 * (RAMC → ecliptic longitude via atan2, obliquity + latitude terms),
 * as documented in widely-mirrored ascendant-calculation references,
 * e.g. https://en.wikipedia.org/wiki/Equatorial_ascendant and
 * general "Ascendant Calculation Formula" references. VERIFIED
 * numerically in scripts/dev/verify-astro-engine.ts against a real
 * FreeAstrologyAPI ground-truth Ascendant (New Delhi, 1990-08-15
 * 05:00 UTC → sidereal Virgo) — this exact atan2 argument order
 * reproduces that sign; the mirror-image form (swapped/negated
 * arguments) does not (it lands 180° off).
 */
function ascendantAndMc(
  time: Astronomy.AstroTime,
  latitude: number,
  longitude: number
): { ascendantTropical: number; mcTropical: number } {
  const gstHours = Astronomy.SiderealTime(time); // Greenwich apparent sidereal time, hours
  const lstHours = normalizeDegrees((gstHours + longitude / 15) * 15) / 15; // wrap via degrees, back to hours
  const ramcDeg = lstHours * 15;
  const ramc = ramcDeg * DEG2RAD;

  const trueObliquityDeg = Astronomy.e_tilt(time).tobl;
  const eps = trueObliquityDeg * DEG2RAD;
  const phi = latitude * DEG2RAD;

  const ascRad = Math.atan2(Math.cos(ramc), -(Math.sin(eps) * Math.tan(phi) + Math.cos(eps) * Math.sin(ramc)));
  const mcRad = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps));

  return {
    ascendantTropical: normalizeDegrees(ascRad * RAD2DEG),
    mcTropical: normalizeDegrees(mcRad * RAD2DEG),
  };
}

// ---------------------------------------------------------------------
// Retrograde detection
// ---------------------------------------------------------------------

const RETROGRADE_SAMPLE_HOURS = 6;

/**
 * Apparent retrograde motion: compare a body's tropical ecliptic
 * longitude at `time` vs `RETROGRADE_SAMPLE_HOURS` later — if
 * longitude has decreased (accounting for 0/360 wraparound), the body
 * is apparently retrograde. Sun and Moon are never retrograde (never
 * called for them below).
 */
function isRetrograde(
  body: Astronomy.Body,
  time: Astronomy.AstroTime,
  observer: Astronomy.Observer
): boolean {
  const lonNow = topocentricTropicalLongitude(body, time, observer);
  const later = time.AddDays(RETROGRADE_SAMPLE_HOURS / 24);
  const lonLater = topocentricTropicalLongitude(body, later, observer);
  // Signed shortest angular difference, later - now, in (-180, 180].
  let delta = lonLater - lonNow;
  delta = ((delta + 180) % 360 + 360) % 360 - 180;
  return delta < 0;
}

// ---------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------

/**
 * Compute a full sidereal (Lahiri) Vedic birth chart for a given
 * birth moment (UTC) and geographic location. Pure local computation
 * — no network calls, no rate limits.
 */
export function calculateChart(birthUtc: Date, latitude: number, longitude: number): ChartData {
  const time = Astronomy.MakeTime(birthUtc);
  const observer = new Astronomy.Observer(latitude, longitude, 0);
  const ayanamsha = lahiriAyanamsha(birthUtc);

  const { ascendantTropical, mcTropical } = ascendantAndMc(time, latitude, longitude);
  const ascendantSidereal = normalizeDegrees(ascendantTropical - ayanamsha);
  const mcSidereal = normalizeDegrees(mcTropical - ayanamsha);
  const ascendant = toChartPoint(ascendantSidereal);
  const mc = toChartPoint(mcSidereal);

  const planets = {} as Record<ChartPlanetName, ChartPlanetEntry>;

  for (const { name, body } of REAL_BODIES) {
    const tropical = topocentricTropicalLongitude(body, time, observer);
    const sidereal = normalizeDegrees(tropical - ayanamsha);
    const point = toChartPoint(sidereal);
    const retro = name === "Sun" || name === "Moon" ? false : isRetrograde(body, time, observer);
    planets[name] = {
      ...point,
      house: signHouseNumber(ascendant.sign, point.sign),
      isRetrograde: retro,
      nakshatra: deriveNakshatraPada(sidereal),
    };
  }

  const rahuTropical = meanLunarNodeTropicalLongitude(time);
  const rahuSidereal = normalizeDegrees(rahuTropical - ayanamsha);
  const rahuPoint = toChartPoint(rahuSidereal);
  planets.Rahu = {
    ...rahuPoint,
    house: signHouseNumber(ascendant.sign, rahuPoint.sign),
    isRetrograde: true, // lunar nodes are always regressing (classical convention)
    nakshatra: deriveNakshatraPada(rahuSidereal),
  };

  const ketuSidereal = normalizeDegrees(rahuSidereal + 180);
  const ketuPoint = toChartPoint(ketuSidereal);
  planets.Ketu = {
    ...ketuPoint,
    house: signHouseNumber(ascendant.sign, ketuPoint.sign),
    isRetrograde: true,
    nakshatra: deriveNakshatraPada(ketuSidereal),
  };

  return {
    birthUtc: birthUtc.toISOString(),
    latitude,
    longitude,
    ayanamsha,
    ascendant,
    mc,
    planets,
  };
}
