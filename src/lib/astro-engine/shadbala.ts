// src/lib/astro-engine/shadbala.ts
// Shadbala — the classical six-fold planetary strength system, for the
// 7 classical ("Graha") planets only (Sun through Saturn). Rahu/Ketu
// and the outer planets (Uranus/Neptune/Pluto) have NO classical
// Shadbala — Brihat Parashara Hora Shastra ch. 27 opens with "These
// strengths are computed for the seven Planets from Sun to Saturn.
// The nodes are not considered." (see full-chapter source below) —
// so this module returns `null` for those five bodies.
//
// ============================================================================
// HONESTY NOTICE — read before trusting any number this module returns
// ============================================================================
// Classical Shadbala (per BPHS ch. 27) has ~20 named sub-components
// spread across its 6 Balas, several of which need data this repo does
// not compute anywhere (a Seeghrocha/apogee table for true Cheshta
// Bala, an Ahargana calendar epoch for Varsha/Masa/Dina/Hora Bala, a
// Trimsamsa (D30) divisional chart for full Saptavargaja Bala, a
// graduated per-degree "Drishti Pinda" aspect-strength table for full
// Drik Bala). This module implements a well-sourced CORE subset of
// each Bala — the sub-components that ARE fully and correctly
// computable from what this repo already has — and explicitly SKIPS
// the rest, documented sub-component by sub-component below rather
// than silently guessing a formula for missing data. Treat every
// number here as a "core Shadbala", not the complete BPHS figure —
// this is stated again on `ShadbalaResult` itself.
//
// Primary source for the classical formulas/values cited throughout
// this file (an English translation of BPHS ch. 27, "Evaluation Of
// Strengths", reproducing Parashara's actual verses with sloka
// numbers — used as the primary citation everywhere below unless a
// different source is named): http://bphs.blogspot.com/2008/03/ch-27-evaluation-of-strengths.html
// Secondary sources (used to cross-check specific values, cited
// per-component below): https://saravali.github.io/astrology/bala_sthana.html
// and https://saravali.github.io/astrology/bala_dig.html (a
// documented open-source Jyotish engine's own worked-example
// write-up of Sthana/Dig Bala, independently matching the BPHS verses).
import * as Astronomy from "astronomy-engine";
import { calculateChart, type ChartData, type ChartPlanetEntry, type ChartPlanetName } from "./ephemeris.ts";
import { calculatePlanetaryDignity } from "./dignity.ts";
import { calculateDivisionalChart } from "./divisional.ts";
import { calculateAspects } from "./aspects.ts";

// ---------------------------------------------------------------------
// The 7 classical planets this module covers (same set as dignity.ts).
// ---------------------------------------------------------------------

export type ClassicalPlanetName = "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn";

const CLASSICAL_PLANETS: readonly ClassicalPlanetName[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
];

function isClassicalPlanet(name: ChartPlanetName): name is ClassicalPlanetName {
  return (CLASSICAL_PLANETS as readonly string[]).includes(name);
}

function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Shortest angular separation between two absolute longitudes, 0-180°. */
function angularSeparation(a: number, b: number): number {
  const diff = Math.abs(normalizeDegrees(a) - normalizeDegrees(b)) % 360;
  return diff > 180 ? 360 - diff : diff;
}

// =======================================================================
// 1. STHANA BALA (positional strength)
// =======================================================================
//
// BPHS lists 5 sub-components (sloka 1-6): Uchcha Bala, Saptavargaja
// Bala, Ojhayugmarasyamsa Bala, Kendradi Bala, Drekkana Bala.
//
// IMPLEMENTED (4 of 5, each independently sourced below):
//   - Uchcha Bala
//   - Ojayugmarasyamsa Bala
//   - Kendradi Bala
//   - Drekkana Bala
// SKIPPED: Saptavargaja Bala. It needs a Panchadha-Maitri-style
// friend/enemy classification of the planet's sign IN EACH of 7
// divisional charts (Rasi, Hora, Drekkana, Saptamsa, Navamsa,
// Dwadasamsa, Trimsamsa) — this repo's divisional.ts implements 6 of
// those 7 (D1/D2/D3/D7/D9/D12) but NOT D30 (Trimsamsa), so even a
// "6 of 7 vargas" partial version would already be missing a whole
// varga's contribution, on top of needing a full varga-sign
// friendship classifier this module does not otherwise need. Per the
// task's explicit instruction ("if the full Saptavargaja needs vargas
// not yet implemented, document that gap ... or skip it entirely and
// say so — do not guess a formula for a missing varga"), this
// component is skipped entirely rather than shipped as a half system.
// `sthanaBalaComponents` below therefore sums to a documented subset
// of the true classical Sthana Bala, not the full ~200-Virupa maximum.

/** Uchcha Bala (exaltation strength): "Deduct from the longitude of
 * the Planet its (deep) debilitation point. If the sum is less than 6
 * Rasis, consider it as it is; if it exceeds 6 Rasis, deduct the same
 * from 12 Rasis. The sum so got be converted into degrees ... and
 * divided by 3, which is the Planet's Uchch Bala in Virupas." (BPHS
 * ch.27 sloka 1). This is EXACTLY the fold-onto-0-180-from-debilitation
 * distance dignity.ts's `exaltationStrength` already computes (as a
 * 0-1 fraction of the 180° debilitation-to-exaltation axis) — so
 * Uchcha Bala in Virupas is simply that 0-1 fraction × 60 (60 Virupas
 * = 180°/3, the maximum at the exact exaltation degree). Reused
 * directly via `calculatePlanetaryDignity` rather than duplicated. */
function uchchaBala(planet: ClassicalPlanetName, chart: ChartData): number {
  const dignity = calculatePlanetaryDignity(chart)[planet];
  // Always non-null for a classical planet (see dignity.ts).
  return dignity!.exaltationStrength * 60;
}

const FEMALE_PLANETS = new Set<ClassicalPlanetName>(["Moon", "Venus"]);

function isOddSign(sign: number): boolean {
  return sign % 2 === 1;
}

/** Ojayugmarasyamsa Bala: "Each of Venus and Moon in even Rasis and
 * others [Sun, Mars, Jupiter, Mercury, Saturn] in odd Rasis acquire a
 * quarter of Rupa [15 Virupas]. These are applicable to such Navamsas
 * also." (BPHS ch.27 sloka 4). Checked in BOTH the Rasi (D1) and
 * Navamsa (D9) sign, 15 Virupas each, max 30. Uses
 * `calculateDivisionalChart(9, chart)` for the D9 sign per the task's
 * "only use divisional charts already implemented" instruction.
 * Source (independently corroborates the same rule and the 15+15=30
 * split): https://saravali.github.io/astrology/bala_sthana.html */
function ojayugmarasyamsaBala(planet: ClassicalPlanetName, chart: ChartData): number {
  const d1Sign = chart.planets[planet].sign;
  const d9Sign = calculateDivisionalChart(9, chart).planets[planet].sign;
  const wantsEven = FEMALE_PLANETS.has(planet);
  const scoreForSign = (sign: number) => (wantsEven ? !isOddSign(sign) : isOddSign(sign)) ? 15 : 0;
  return scoreForSign(d1Sign) + scoreForSign(d9Sign);
}

const KENDRA_HOUSES = new Set([1, 4, 7, 10]);
const PANAPHARA_HOUSES = new Set([2, 5, 8, 11]);

/** Kendradi Bala: "A Planet in a Kon [Kendra] gets full strength
 * [60 Virupas], while one in Panaphara House gets half [30] and the
 * one in Apoklima House gets a quarter [15]." (BPHS ch.27 sloka 5).
 * Houses counted from the Ascendant (the only house-counting
 * convention `ChartPlanetEntry.house` uses anywhere in this repo). */
function kendradiBala(entry: ChartPlanetEntry): number {
  if (KENDRA_HOUSES.has(entry.house)) return 60;
  if (PANAPHARA_HOUSES.has(entry.house)) return 30;
  return 15; // Apoklima (3, 6, 9, 12)
}

const MALE_DREKKANA_PLANETS = new Set<ClassicalPlanetName>(["Sun", "Mars", "Jupiter"]);
const FEMALE_DREKKANA_PLANETS = new Set<ClassicalPlanetName>(["Moon", "Venus"]);

/** Drekkana Bala: "Male, female and hermaphrodite Planets,
 * respectively, get a quarter Rupa [15 Virupas] according to
 * placements in the first, second and third decanates." (BPHS ch.27
 * sloka 6). Male = Sun/Mars/Jupiter, female = Moon/Venus,
 * hermaphrodite (neutral) = Mercury/Saturn — the same gender
 * classification `ojayugmarasyamsaBala`'s male/female split above
 * uses (Mercury and Saturn are "neutral" in both classical schemes).
 * Uses the raw degree-in-sign (0-30), NOT a computed D3 chart sign —
 * Drekkana Bala only needs to know WHICH THIRD of the natal sign the
 * planet occupies, not the resulting D3 sign, so no divisional-chart
 * call is needed here. */
function drekkanaBala(planet: ClassicalPlanetName, entry: ChartPlanetEntry): number {
  const third = Math.min(Math.floor(entry.degree / 10), 2); // 0, 1, or 2
  if (MALE_DREKKANA_PLANETS.has(planet)) return third === 0 ? 15 : 0;
  if (FEMALE_DREKKANA_PLANETS.has(planet)) return third === 1 ? 15 : 0;
  return third === 2 ? 15 : 0; // Mercury, Saturn (neutral/hermaphrodite)
}

export type SthanaBalaComponents = {
  uchchaBala: number;
  ojayugmarasyamsaBala: number;
  kendradiBala: number;
  drekkanaBala: number;
};

function calculateSthanaBala(planet: ClassicalPlanetName, chart: ChartData): SthanaBalaComponents {
  const entry = chart.planets[planet];
  return {
    uchchaBala: uchchaBala(planet, chart),
    ojayugmarasyamsaBala: ojayugmarasyamsaBala(planet, chart),
    kendradiBala: kendradiBala(entry),
    drekkanaBala: drekkanaBala(planet, entry),
  };
}

// =======================================================================
// 2. DIG BALA (directional strength)
// =======================================================================
//
// "Deduct 4th House (Nadir) from the longitudes of Sun and Mars, 7th
// House from that of Jupiter and Mercury, 10th House from that of
// Venus and Moon and lastly Lagna from that of Saturn. If the sum is
// above 180 degrees, deduct the sum from 360. The sum arrived in
// either way be divided by 3, which will be Dig Bala of the Planet."
// (BPHS ch.27 sloka 7). Equivalently (and how saravali.github.io's
// worked examples present it): each planet has one STRONGEST angle
// (the opposite of the "deducted" reference point above) — Sun/Mars
// strongest at the 10th-house cusp (Meridian/MC), Mercury/Jupiter at
// the Ascendant (1st cusp), Moon/Venus at the 4th-house cusp
// (Nadir/IC), Saturn at the 7th-house cusp (Descendant) — and Dig
// Bala is (180 − angular distance from that strongest point) / 3,
// ranging 0 (at the opposite, weakest point) to 60 (exactly at the
// strongest point). This module uses the chart's REAL Ascendant/MC
// cusp longitudes (`chart.ascendant`/`chart.mc`, already computed by
// ephemeris.ts) rather than whole-sign house boundaries, which is
// more precise than a sign-based approximation and matches the
// "longitude of the Planet" wording of the BPHS verse itself (a
// continuous degree quantity, not a discrete house number).
// Sources: BPHS ch.27 sloka 7 (above) and
// https://saravali.github.io/astrology/bala_dig.html (independent
// corroboration + worked numeric examples).
function digBalaStrongestLongitude(planet: ClassicalPlanetName, chart: ChartData): number {
  switch (planet) {
    case "Sun":
    case "Mars":
      return chart.mc.longitude; // 10th cusp (Meridian)
    case "Mercury":
    case "Jupiter":
      return chart.ascendant.longitude; // 1st cusp (Ascendant)
    case "Moon":
    case "Venus":
      return normalizeDegrees(chart.mc.longitude + 180); // 4th cusp (Nadir)
    case "Saturn":
      return normalizeDegrees(chart.ascendant.longitude + 180); // 7th cusp (Descendant)
  }
}

function calculateDigBala(planet: ClassicalPlanetName, chart: ChartData): number {
  const strongest = digBalaStrongestLongitude(planet, chart);
  const distanceFromStrongest = angularSeparation(chart.planets[planet].longitude, strongest);
  return (180 - distanceFromStrongest) / 3;
}

// =======================================================================
// 3. KALA BALA (temporal strength)
// =======================================================================
//
// BPHS ch.27 sloka 8-17 lists 6 Kala Bala sub-components: Nathonnata
// Bala, Paksha Bala, Tribhaga Bala, Varsha-Masa-Dina-Hora Bala, Ayana
// Bala, (Yuddha Bala is listed separately, sloka 20, as a chart-wide
// adjustment rather than a per-planet Kala sub-component).
//
// IMPLEMENTED (2 of ~5, per the task's "at minimum" instruction):
//   - Nathonnata Bala (day/night strength)
//   - Paksha Bala (lunar-phase strength)
// SKIPPED (documented, not silently dropped):
//   - Tribhaga Bala: needs day/night divided into thirds against the
//     SAME sunrise/sunset calendar machinery Varsha-Masa-Dina-Hora
//     Bala needs (see next point) — skipped for the same reason.
//   - Varsha/Masa/Dina/Hora Bala: BPHS's own worked method (sloka 13)
//     computes these from an "Ahargana" (days elapsed since a
//     classical Creation epoch, ~714,404,108,573 days as of 1860-01-01
//     per the Surya Siddhanta figure BPHS itself cites) — a distinct,
//     large calendrical sub-system in its own right (this repo's
//     equivalent classical-calendar logic already lives in the
//     Panchang engine, out of scope for this session/module) rather
//     than an ephemeris computation. Skipped entirely rather than
//     guessed.
//   - Ayana Bala: needs the planet's declination (Kranti) combined
//     with a "Khanda" (45/33/12) interpolation table per BPHS sloka
//     15-17 — a real, computable-in-principle sub-system, but a
//     distinct enough formula (and Santhanam's own simplified version
//     still needs the equinox-Bhuja bookkeeping) that it did not fit
//     this pass's scope; skipped and documented rather than
//     half-implemented. NOTE: BPHS also uses Ayana Bala as the Sun's
//     Chesta-Bala substitute (sloka 18) — see the Cheshta Bala section
//     below for how that gap is handled.
//   - Yuddha Bala (planetary war): a conditional ADJUSTMENT to two
//     planets' Shad Bala when they are in a very close (near-exact)
//     conjunction (BPHS sloka 20: "the difference between the Shad
//     Balas of the two should be added to the victor's ... and
//     deducted from ... the vanquished") — not a per-planet Bala
//     sub-component at all, but a chart-wide post-processing rule.
//     Out of scope for a per-planet `calculateShadbala` pass; skipped
//     and documented, not silently ignored.
// `kalaBalaComponents` below therefore sums to a documented subset of
// the true classical Kala Bala (max ~150 Virupas across all sources),
// not the full classical maximum.
const DIURNAL_NATHONNATA = new Set<ClassicalPlanetName>(["Sun", "Jupiter", "Venus"]);
const NOCTURNAL_NATHONNATA = new Set<ClassicalPlanetName>(["Moon", "Mars", "Saturn"]);

/**
 * Nathonnata Bala: "Find out the difference between midnight and the
 * apparent birth time, which is called Unnata. Deduct Unnata from 30
 * Ghatis to obtain Nata. Double the Nata in Ghatis, which will
 * indicate identical Nata Bala for Moon, Mars and Saturn. Deduct the
 * Nata from 60 to know the Unnata Bala of Sun, Jupiter and Venus.
 * Mercury, irrespective of day and night, gets full Nathonnata Bala."
 * (BPHS ch.27 sloka 8-9). 1 Ghati = 24 minutes, so 30 Ghatis = 12
 * hours and "double the Nata in Ghatis" is algebraically the same as
 * "60 minus twice the Unnata in hours" — this module computes Unnata
 * (distance from apparent solar midnight, 0-12 hours) directly from
 * `Astronomy.HourAngle(Sun, ...)`, whose zero point IS apparent solar
 * noon and which reaches 12 at apparent solar midnight — i.e. exactly
 * the classical "apparent birth time vs. midnight" quantity BPHS
 * describes, computed from a real modern ephemeris instead of a
 * ghati/muhurta clock. This is a faithful re-expression of the same
 * verse in continuous hours, not an invented substitute formula.
 * Source: BPHS ch.27 sloka 8-9 (above).
 */
function nathonnataBala(planet: ClassicalPlanetName, chart: ChartData): number {
  if (planet === "Mercury") return 60;
  const time = Astronomy.MakeTime(new Date(chart.birthUtc));
  const observer = new Astronomy.Observer(chart.latitude, chart.longitude, 0);
  const sunHourAngle = Astronomy.HourAngle(Astronomy.Body.Sun, time, observer); // 0 (noon) .. 24, 12 = midnight
  const hoursFromMidnight = Math.abs(sunHourAngle - 12); // 0 (midnight) .. 12 (noon)
  if (DIURNAL_NATHONNATA.has(planet)) return 5 * hoursFromMidnight; // 0 at midnight, 60 at noon
  if (NOCTURNAL_NATHONNATA.has(planet)) return 60 - 5 * hoursFromMidnight; // 60 at midnight, 0 at noon
  return 60; // unreachable for the 7 classical planets, kept for exhaustiveness
}

const PAKSHA_BENEFICS = new Set<ClassicalPlanetName>(["Moon", "Mercury", "Jupiter", "Venus"]);

/**
 * Paksha Bala: "Deduct from Moon's longitude that of Sun. If the sum
 * exceeds 6 Rasis, deduct the same from 12. The product so obtained
 * be converted into degrees etc. and divided by 3, which will
 * indicate the Paksha Bala of each of the benefic Planets. The Paksha
 * Bala of benefic should be deducted from 60, which will go to each
 * malefic." (BPHS ch.27 sloka 10-11). Benefic/malefic grouping for
 * THIS formula specifically (not general Naisargika benefic/malefic
 * nature) follows the conventional grouping used across mainstream
 * secondary sources: benefics = Moon, Mercury, Jupiter, Venus;
 * malefics = Sun, Mars, Saturn. (Note this correctly makes a full
 * Moon — elongation 180°, folded/3 = 60 — the Moon's OWN maximum
 * Paksha Bala, and a new Moon her minimum, matching the well-known
 * classical statement that a waxing/full Moon is strong and a new
 * Moon is weak.)
 * Source: BPHS ch.27 sloka 10-11 (above).
 */
function pakshaBala(planet: ClassicalPlanetName, chart: ChartData): number {
  const elongation = normalizeDegrees(chart.planets.Moon.longitude - chart.planets.Sun.longitude);
  const folded = elongation <= 180 ? elongation : 360 - elongation;
  const beneficValue = folded / 3;
  return PAKSHA_BENEFICS.has(planet) ? beneficValue : 60 - beneficValue;
}

export type KalaBalaComponents = {
  nathonnataBala: number;
  pakshaBala: number;
};

function calculateKalaBala(planet: ClassicalPlanetName, chart: ChartData): KalaBalaComponents {
  return {
    nathonnataBala: nathonnataBala(planet, chart),
    pakshaBala: pakshaBala(planet, chart),
  };
}

// =======================================================================
// 4. CHESHTA BALA (motional strength)
// =======================================================================
//
// BPHS's own precise method (sloka 21-25) needs each planet's Seeghrocha
// (apogee/conjunction point of its epicyclic model) and its MEAN
// longitude, neither of which this repo computes anywhere (this
// engine is a direct real-position ephemeris via astronomy-engine, not
// a classical epicyclic/mean-motion model) — so BPHS's exact Cheshta
// Kendra formula cannot be reproduced without inventing apogee data.
// Per the task's explicit allowance, this module instead approximates
// Cheshta Bala from the planet's OWN REAL angular speed, sampled
// around the birth moment (the same finite-difference technique
// ephemeris.ts's `isRetrograde` already uses, just measuring magnitude
// here instead of only sign), compared against a sourced "mean daily
// motion" reference table:
//   - Retrograde: 60 Virupas (the classical maximum — BPHS sloka
//     21-23's own discrete motion-state table separately assigns
//     retrograde ["Vakra"] the top value of 60, which this module
//     reproduces exactly even though it does not reproduce the rest of
//     that 8-state table — see below).
//   - Otherwise: `60 * (1 − min(observedSpeed / meanDailyMotion, 1))`,
//     i.e. strength rises smoothly from 0 (at or above the planet's
//     own mean daily motion) to 60 (as real speed falls toward zero,
//     i.e. as the planet approaches a station before turning
//     retrograde — the OTHER classically-strong motional state).
// THIS IS A DELIBERATE, DOCUMENTED SIMPLIFICATION, not the classical
// formula: BPHS's real motion-state table (sloka 21-23) assigns 8
// discrete, NON-monotonic values to named speed states (e.g. "Sama"/
// normal speed = 7.5, "Char"/fast = 45, "Atichara"/very fast = 30 —
// note fast is stronger than normal, but very-fast is weaker than
// fast, which a simple "distance from mean speed" formula cannot
// reproduce). Reproducing that exact table needs the Seeghrocha data
// this repo lacks, so this module's continuous formula is an honest,
// monotonic APPROXIMATION of the same underlying idea (near-station/
// retrograde = strong, ordinary direct motion = weaker), not a
// verified match to BPHS's own numbers away from the two endpoints
// (retrograde=60, and "at/above mean speed"=0).
// Sun and Moon are EXCLUDED (returns `null` in `ShadbalaResult`): BPHS
// sloka 18 gives them SUBSTITUTE values instead of an ordinary Cheshta
// Bala ("Sun's Chesht Bala will correspond to his Ayan Bala. Moon's
// Paksha Bala will itself be her Chesht Bala") — since this module
// does not implement Ayana Bala (see Kala Bala section above), the
// Sun's substitute cannot be computed either, so both Sun and Moon are
// left `null` here rather than silently invented. This means Sun's and
// Moon's `totalVirupas` in this module are a documented UNDERCOUNT
// relative to full BPHS Shadbala (missing exactly this one Bala) —
// see `ShadbalaResult.cheshtaBala`'s own doc comment.
// Source: BPHS ch.27 sloka 18, 21-25 (quoted above).

/** Real-world mean daily motion, degrees/day — the classical
 * "average daily motion" reference figures used across traditional
 * astrology (matches Indian Jyotish "madhyagati" tables closely; the
 * Sun/Moon rows of the same table are unused here since Sun/Moon are
 * excluded from Cheshta Bala). Mars/Jupiter/Saturn figures are the
 * long-standing "average daily motion in horary" table (Saturn 2',
 * Jupiter 4'52", Mars 37'); Mercury/Venus use the more accurate
 * geocentric-average figures the same source separately notes as the
 * commonly-used alternates (1°23' / 1°12'), since Mercury/Venus'
 * INSTANTANEOUS geocentric speed varies far more than an outer
 * planet's across their synodic (direct/retrograde) cycle, making the
 * more precise averaged figure the more meaningful "mean" to compare
 * a single real sampled speed against.
 * Source: https://tonylouis.wordpress.com/2018/08/26/average-daily-motion-of-planets-in-horary/
 */
const MEAN_DAILY_MOTION: Partial<Record<ClassicalPlanetName, number>> = {
  Mars: 37 / 60, // 37' = 0.6167 deg/day
  Mercury: 1 + 23 / 60, // 1 deg 23' = 1.3833 deg/day
  Jupiter: (4 + 52 / 60) / 60, // 4'52" = 0.0811 deg/day
  Venus: 1.2, // 1 deg 12'
  Saturn: 2 / 60, // 2' = 0.0333 deg/day
};

const CHESHTA_SAMPLE_HOURS = 24;

function cheshtaBala(planet: Exclude<ClassicalPlanetName, "Sun" | "Moon">, chart: ChartData): number {
  const entry = chart.planets[planet];
  if (entry.isRetrograde) return 60;

  const birthDate = new Date(chart.birthUtc);
  const laterDate = new Date(birthDate.getTime() + CHESHTA_SAMPLE_HOURS * 3600 * 1000);
  const laterChart = calculateChart(laterDate, chart.latitude, chart.longitude);

  let delta = laterChart.planets[planet].longitude - entry.longitude;
  delta = ((delta + 180) % 360 + 360) % 360 - 180; // signed shortest delta
  const observedSpeed = Math.abs(delta) / (CHESHTA_SAMPLE_HOURS / 24); // deg/day, magnitude

  const meanSpeed = MEAN_DAILY_MOTION[planet]!;
  const speedRatio = Math.min(observedSpeed / meanSpeed, 1);
  return 60 * (1 - speedRatio);
}

// =======================================================================
// 5. NAISARGIKA BALA (natural strength) — fixed classical ranking
// =======================================================================
//
// "Divide one Rupa by 7 and multiply the resultant product by 1 to 7
// separately, which will indicate the Naisargika Bala, due to Saturn,
// Mars, Mercury, Jupiter, Venus, Moon and Sun, respectively." (BPHS
// ch.27 sloka 14) — i.e. rank × 60/7 Virupas, ranked (weakest to
// strongest) Saturn(1) < Mars(2) < Mercury(3) < Jupiter(4) < Venus(5)
// < Moon(6) < Sun(7). Computed here as rank×60/7 exactly (not
// hardcoded rounded decimals) so the values are exact fractions, not
// independently-rounded approximations of the same fractions.
// Cross-checked (values, not just ranking) against
// https://www.muhuratam.in/shadbala-calculator and
// https://www.rahasyavedicastrology.com/shadbala-calculator/, which
// both independently give the same Sun=60/Moon≈51.43/Venus≈42.86/
// Jupiter≈34.29/Mercury≈25.71/Mars≈17.14/Saturn≈8.57 Virupa figures.
const NAISARGIKA_RANK: Record<ClassicalPlanetName, number> = {
  Saturn: 1, Mars: 2, Mercury: 3, Jupiter: 4, Venus: 5, Moon: 6, Sun: 7,
};

function naisargikaBala(planet: ClassicalPlanetName): number {
  return (NAISARGIKA_RANK[planet] * 60) / 7;
}

// =======================================================================
// 6. DRIK BALA (aspectual strength)
// =======================================================================
//
// "Reduce one fourth of the Aspect Pinda, if a Planet receives
// malefic Aspects and add a fourth, if it receives an Aspect from a
// benefic. Super add the entire Aspect of Mercury and Jupiter to get
// the net strength of a Planet." (BPHS ch.27 sloka 19). The full
// classical version needs a graduated, per-degree "Aspect Pinda"
// (Drishti Pinda) — a continuous 0-60 strength per individual aspect,
// scaled by exactly how many degrees into its own aspect-sign the
// aspecting planet sits (full/three-quarter/half/quarter drishti) —
// which this repo does not compute anywhere (`aspects.ts` only
// returns whether a whole-sign Parashari aspect lands on a sign at
// all, a boolean, not a graduated strength). THIS IS THE MOST
// SIMPLIFIED COMPONENT IN THIS MODULE, matching the task's own note
// that Drik Bala is "one of the most simplified-across-software
// components" — documented here rather than hidden:
//   - Every Parashari aspect (from `calculateAspects`) landing on a
//     classical planet's sign contributes a FLAT ±15-Virupa strength
//     (not a graduated Pinda), positive from a benefic aspector,
//     negative from a malefic one.
//   - Jupiter's and Mercury's aspects get DOUBLE weight (±30) per the
//     verse's own "super add the entire Aspect of Mercury and
//     Jupiter" instruction (read here as "weight these two aspectors'
//     contribution more heavily than an ordinary aspect", the
//     simplest faithful reading of that clause without the underlying
//     Pinda machinery).
//   - Benefic aspectors: Jupiter, Venus, Mercury, and the Moon ONLY
//     WHEN WAXING (Sukla Paksha) — a standard classical convention
//     (see e.g. the same benefic/malefic split used for Paksha Bala
//     above). Malefic aspectors: Sun, Mars, Saturn, and the Moon when
//     waning (Krishna Paksha).
// A planet's total Drik Bala under this simplified scheme CAN be
// negative (net affliction) — that is real, intended behavior (a
// heavily malefic-aspected planet genuinely has negative Drishti
// strength in the classical system too), not a bug; it is left
// un-clamped so `totalVirupas` honestly reflects it.
const DRIK_MALEFICS = new Set<ClassicalPlanetName>(["Sun", "Mars", "Saturn"]);
const DRIK_DOUBLE_WEIGHT = new Set<ChartPlanetName>(["Jupiter", "Mercury"]);

function isMoonWaxing(chart: ChartData): boolean {
  const elongation = normalizeDegrees(chart.planets.Moon.longitude - chart.planets.Sun.longitude);
  return elongation < 180; // Sukla Paksha (New Moon -> Full Moon)
}

function isBeneficAspector(aspectorName: ChartPlanetName, chart: ChartData): boolean {
  if (aspectorName === "Moon") return isMoonWaxing(chart);
  return isClassicalPlanet(aspectorName) && !DRIK_MALEFICS.has(aspectorName);
}

function drikBala(planet: ClassicalPlanetName, chart: ChartData): number {
  const sign = chart.planets[planet].sign;
  const aspects = calculateAspects(chart).filter((a) => a.toSign === sign);
  let total = 0;
  for (const aspect of aspects) {
    const weight = DRIK_DOUBLE_WEIGHT.has(aspect.fromPlanet) ? 30 : 15;
    total += isBeneficAspector(aspect.fromPlanet, chart) ? weight : -weight;
  }
  return total;
}

// =======================================================================
// Required Rupas thresholds ("Shad Bala Pinda")
// =======================================================================
//
// "390, 360, 300, 420, 390, 330 and 300 Virupas are the Shad Bala
// Pindas, needed for Sun etc. to be considered strong. If the
// strength exceeds the above-mentioned values, the Planet is deemed
// to be very strong." (BPHS ch.27 sloka 32-33; "Sun etc." is BPHS's
// standard Sun/Moon/Mars/Mercury/Jupiter/Venus/Saturn planet order,
// used consistently throughout this chapter). In Rupas: Sun 6.5, Moon
// 6, Mars 5, Mercury 7, Jupiter 6.5, Venus 5.5, Saturn 5.
// DISAGREEMENT FOUND: some secondary/AI-summarized sources report a
// DIFFERENT Sun figure (5.0 Rupas instead of 6.5) with the same other
// 6 values — this module follows the primary BPHS verse translation
// (390 Virupas = 6.5 Rupas for the Sun) over that uncorroborated
// secondary figure.
const REQUIRED_RUPAS: Record<ClassicalPlanetName, number> = {
  Sun: 6.5, Moon: 6, Mars: 5, Mercury: 7, Jupiter: 6.5, Venus: 5.5, Saturn: 5,
};

// =======================================================================
// Public result type + entry point
// =======================================================================

export type ShadbalaResult = {
  planet: ChartPlanetName;
  sthanaBala: number;
  digBala: number;
  kalaBala: number;
  /** null for Sun and Moon — see the Cheshta Bala section's doc
   * comment above for why (their classical BPHS substitute values —
   * Ayana Bala for the Sun, Paksha Bala again for the Moon — are not
   * implemented). Their `totalVirupas` is therefore a documented
   * undercount relative to full BPHS Shadbala by exactly one Bala. */
  cheshtaBala: number | null;
  naisargikaBala: number;
  drikBala: number;
  totalVirupas: number;
  totalRupas: number;
  /** Classical minimum-strength threshold (BPHS ch.27 sloka 32-33),
   * always present for the 7 classical planets — see REQUIRED_RUPAS
   * doc comment. */
  requiredRupas: number;
  /** `totalRupas >= requiredRupas`. For Sun/Moon this compares an
   * ALREADY-undercounted total against the full classical threshold,
   * so a `false` here is not conclusive proof of real classical
   * weakness for those two planets specifically — see `cheshtaBala`'s
   * doc comment. */
  meetsRequirement: boolean;
  /** Every raw sub-component this module actually computes, broken
   * out by name, for callers/tests that want more granularity than
   * the 6 top-level Bala totals (per the task's "never only a final
   * score" instruction). Sub-components NOT listed here were skipped
   * for this planet/module — see the per-Bala doc comments above for
   * exactly which and why. */
  sthanaBalaComponents: SthanaBalaComponents;
  kalaBalaComponents: KalaBalaComponents;
};

/**
 * Core Shadbala for the 7 classical planets (Sun-Saturn); `null` for
 * Rahu, Ketu, Uranus, Neptune, Pluto (no classical Shadbala system —
 * see module doc comment). This is a documented CORE/simplified
 * version of the full BPHS system, not a complete reproduction — see
 * the module-level "HONESTY NOTICE" and each Bala's own doc comment
 * above for exactly which sub-components are implemented vs. skipped
 * and why.
 */
export function calculateShadbala(chart: ChartData): Record<ChartPlanetName, ShadbalaResult | null> {
  const result = {} as Record<ChartPlanetName, ShadbalaResult | null>;

  for (const name of Object.keys(chart.planets) as ChartPlanetName[]) {
    if (!isClassicalPlanet(name)) {
      result[name] = null;
      continue;
    }

    const sthanaBalaComponents = calculateSthanaBala(name, chart);
    const kalaBalaComponents = calculateKalaBala(name, chart);
    const sthana =
      sthanaBalaComponents.uchchaBala +
      sthanaBalaComponents.ojayugmarasyamsaBala +
      sthanaBalaComponents.kendradiBala +
      sthanaBalaComponents.drekkanaBala;
    const kala = kalaBalaComponents.nathonnataBala + kalaBalaComponents.pakshaBala;
    const dig = calculateDigBala(name, chart);
    const cheshta = name === "Sun" || name === "Moon" ? null : cheshtaBala(name, chart);
    const naisargika = naisargikaBala(name);
    const drik = drikBala(name, chart);

    const totalVirupas = sthana + dig + kala + (cheshta ?? 0) + naisargika + drik;
    const totalRupas = totalVirupas / 60;
    const requiredRupas = REQUIRED_RUPAS[name];

    result[name] = {
      planet: name,
      sthanaBala: sthana,
      digBala: dig,
      kalaBala: kala,
      cheshtaBala: cheshta,
      naisargikaBala: naisargika,
      drikBala: drik,
      totalVirupas,
      totalRupas,
      requiredRupas,
      meetsRequirement: totalRupas >= requiredRupas,
      sthanaBalaComponents,
      kalaBalaComponents,
    };
  }

  return result;
}
