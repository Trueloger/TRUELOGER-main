// src/lib/astro-engine/dignity.ts
// Planetary dignity (Uccha/Neecha/Swakshetra/Moolatrikona + Naisargika
// and Panchadha Maitri sign-lord relationship) for the 7 classical
// ("Graha") planets only: Sun, Moon, Mars, Mercury, Jupiter, Venus,
// Saturn. Pure functions, additive-only, no dependency on or
// modification of ephemeris.ts beyond importing its public types.
//
// SCOPE — Rahu/Ketu and the outer planets (Uranus/Neptune/Pluto):
// Classical Parashari sources (Brihat Parashara Hora Shastra) assign
// sign rulership, exaltation/debilitation, own-sign and moolatrikona
// ONLY to the 7 classical grahas. Rahu/Ketu are shadow points with no
// physical body and no BPHS-attested sign lordship (their lordship, in
// the few schools that grant it at all, is over NAKSHATRAS, not
// signs — see e.g. https://phpbb.lightonvedicastrology.com/viewtopic.php?t=2218
// and https://www.hindu-blog.com/2019/06/naisargik-maitri-in-hindu-astrology.html).
// Some later/regional sources DO give Rahu/Ketu a Naisargika Maitri
// row (Rahu: friends Venus & Saturn, enemies Sun/Moon/Mars, neutral
// Mercury; Ketu: friends Mars/Venus/Saturn, enemies Sun/Moon, neutral
// Mercury/Jupiter) and separately assign them exaltation/debilitation
// signs by mirroring Jupiter/Mars or by "mulatrikona co-lordship" of
// Aquarius/Scorpio — but those exaltation/debilitation/own-sign claims
// are NOT consistent across sources (disputed even in which sign, let
// alone which degree), unlike the 7-planet table which is uniform
// across BPHS-derived sources. Since a `DignityResult` bundles
// exaltation/debilitation/own-sign/moolatrikona/sign-lord-relationship
// into one consistent record, and the first four of those five facets
// have no well-attested value for Rahu/Ketu, this module returns `null`
// for Rahu, Ketu, Uranus, Neptune and Pluto rather than emitting a
// partially-invented result. Uranus/Neptune/Pluto have no classical
// dignity system at all (not part of the Navagraha).
//
// Outputs are DATA ONLY — no interpretive/predictive text.
import type { ChartData, ChartPlanetEntry, ChartPlanetName } from "./ephemeris.ts";

// ---------------------------------------------------------------------
// The 7 classical planets this module covers.
// ---------------------------------------------------------------------

export type ClassicalPlanetName = "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn";

const CLASSICAL_PLANETS: readonly ClassicalPlanetName[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
];

function isClassicalPlanet(name: ChartPlanetName): name is ClassicalPlanetName {
  return (CLASSICAL_PLANETS as readonly string[]).includes(name);
}

// ---------------------------------------------------------------------
// Exaltation / debilitation
// ---------------------------------------------------------------------

/**
 * Exact exaltation sign + degree per planet — the classical "deep
 * exaltation" (Uccha) point. Debilitation (Neecha) is, by the
 * classical rule, ALWAYS the exactly opposite sign at the SAME degree
 * (e.g. Sun deep-exalted at 10° Aries is deep-debilitated at 10°
 * Libra) — so this table stores only the exaltation point, and
 * `debilitationSign`/`debilitationDegree` below are derived (sign + 6,
 * same degree value) rather than hardcoded, so the two can never drift
 * apart.
 * Source (widely-mirrored classical table, matches BPHS-derived
 * secondary sources):
 * https://steer.coach/exalted-planets/
 * https://vaya.so/wiki/exaltation
 */
const EXALTATION: Record<ClassicalPlanetName, { sign: number; degree: number }> = {
  Sun: { sign: 1, degree: 10 }, // Aries 10°
  Moon: { sign: 2, degree: 3 }, // Taurus 3°
  Mars: { sign: 10, degree: 28 }, // Capricorn 28°
  Mercury: { sign: 6, degree: 15 }, // Virgo 15°
  Jupiter: { sign: 4, degree: 5 }, // Cancer 5°
  Venus: { sign: 12, degree: 27 }, // Pisces 27°
  Saturn: { sign: 7, degree: 20 }, // Libra 20°
};

function oppositeSign(sign: number): number {
  return ((sign - 1 + 6) % 12) + 1;
}

/**
 * "Exaltation strength" — a continuous 0-1 measure of how close a
 * planet is to its exact deep-exaltation degree, linearly fading to 0
 * at the debilitation degree of the OPPOSITE sign (i.e. across the
 * full 180° exaltation-to-debilitation axis, which is the real
 * classical framing: a planet's dignity strength rises from the
 * debilitation point, through neutral, to a peak at the exaltation
 * point, and back down symmetrically past it — this "Uchcha Bala"
 * linear-fade convention is exactly the one Brihat Parashara Hora
 * Shastra's Shadbala scheme uses for Uchcha Bala: full strength (60
 * Shashtiamsas) at the exact exaltation degree, zero at the exact
 * debilitation degree (180° away), and a linear scale of the angular
 * distance between them.
 * Source: BPHS Shadbala / Uchcha Bala formula, e.g.
 * https://www.vedicastrologer.org/shadbala/ (Uchcha Bala section) and
 * standard Shadbala references — "Uchcha bala is calculated based on
 * the angular distance ... of the planet from its debilitation
 * point", normalized to a 0-60 (here 0-1) scale.
 * This is a real, sourced classical convention — not an invented
 * scoring formula.
 */
function exaltationStrength(planet: ClassicalPlanetName, longitude: number): number {
  const exalt = EXALTATION[planet];
  const exaltLongitude = (exalt.sign - 1) * 30 + exalt.degree;
  const debilitLongitude = (exaltLongitude + 180) % 360;
  // Angular distance from the DEBILITATION point (0 there, 180 at exaltation).
  let distanceFromDebilitation = longitude - debilitLongitude;
  distanceFromDebilitation = ((distanceFromDebilitation % 360) + 360) % 360;
  // Fold onto a 0-180 "distance from debilitation" axis (linear rise to
  // 180 at the exact exaltation point, linear fall back to 0 beyond it
  // — BPHS Uchcha Bala is symmetric about the exaltation point).
  const foldedDistance = distanceFromDebilitation <= 180 ? distanceFromDebilitation : 360 - distanceFromDebilitation;
  return foldedDistance / 180;
}

// ---------------------------------------------------------------------
// Own signs + Moolatrikona (a DEGREE RANGE within one own sign, not
// the whole sign — researched per-planet from BPHS, see quotes below).
// ---------------------------------------------------------------------

type SignRange = { sign: number; fromDegree: number; toDegree: number };

/**
 * Own (Swakshetra) signs per planet, and the Moolatrikona sub-range —
 * a specific degree window within ONE of those own signs (never the
 * whole sign), per Brihat Parashara Hora Shastra ch. 6:
 * - Sun: Leo is the only own sign; Moolatrikona = Leo 0°-20° ("In Leo
 *   the first 20 degrees are the Sun's Moolatrikona while the rest is
 *   his own house").
 * - Moon: Cancer is the only own sign; Moolatrikona = Taurus 3°-30°
 *   ("After the first 3 degrees of exaltation portion in Taurus, for
 *   the Moon the rest is her Moolatrikona") — note Moolatrikona sits
 *   in the EXALTATION sign (Taurus), not the own sign (Cancer); this
 *   is the one classical exception to "Moolatrikona is inside an own
 *   sign" and is documented as such in BPHS.
 * - Mars: Aries, Scorpio own; Moolatrikona = Aries 0°-12° ("Mars has
 *   the first 12 degrees in Aries as Moolatrikona with the rest
 *   therein becoming simply his own house").
 * - Mercury: Gemini, Virgo own; Moolatrikona = Virgo 15°-20° ("in
 *   Virgo the first 15 degrees are exaltation zone, the next 5 degrees
 *   Moolatrikona and the last 10 degrees are own house").
 * - Jupiter: Sagittarius, Pisces own; Moolatrikona = Sagittarius
 *   0°-10° ("The first one third of Sagittarius is the Moolatrikona of
 *   Jupiter while the remaining part thereof is his own house").
 * - Venus: Taurus, Libra own; Moolatrikona = Libra 0°-15° ("Venus
 *   divides Libra into two halves keeping the first as Moolatrikona
 *   and the second as own house").
 * - Saturn: Capricorn, Aquarius own; Moolatrikona = Aquarius 0°-20°
 *   ("Saturn's arrangements are same in Aquarius as the Sun has in
 *   Leo").
 * Source (direct BPHS ch.6 quotes, cross-checked across mirrors):
 * https://blog.indianastrologysoftware.com/the-power-of-moola-trikona/
 * https://www.astrokarak.com/blog/moolatrikona-and-own-sign-strength-in-vedic-astrology
 * Note: some later secondary sources (e.g. Hora Ratnam) give slightly
 * different Sun/Saturn cutoffs than BPHS — this module follows BPHS
 * (Santhanam translation) as the primary classical source throughout,
 * documented here so the choice is explicit and traceable.
 */
const OWN_SIGNS: Record<ClassicalPlanetName, number[]> = {
  Sun: [5], // Leo
  Moon: [4], // Cancer
  Mars: [1, 8], // Aries, Scorpio
  Mercury: [3, 6], // Gemini, Virgo
  Jupiter: [9, 12], // Sagittarius, Pisces
  Venus: [2, 7], // Taurus, Libra
  Saturn: [10, 11], // Capricorn, Aquarius
};

const MOOLATRIKONA: Record<ClassicalPlanetName, SignRange> = {
  Sun: { sign: 5, fromDegree: 0, toDegree: 20 }, // Leo
  Moon: { sign: 2, fromDegree: 3, toDegree: 30 }, // Taurus (exaltation sign, see doc above)
  Mars: { sign: 1, fromDegree: 0, toDegree: 12 }, // Aries
  Mercury: { sign: 6, fromDegree: 15, toDegree: 20 }, // Virgo
  Jupiter: { sign: 9, fromDegree: 0, toDegree: 10 }, // Sagittarius
  Venus: { sign: 7, fromDegree: 0, toDegree: 15 }, // Libra
  Saturn: { sign: 11, fromDegree: 0, toDegree: 20 }, // Aquarius
};

// ---------------------------------------------------------------------
// Naisargika Maitri (natural / permanent friendship) — Parashari,
// BPHS ch. 4. NOT symmetric: e.g. Mercury regards the Sun as a friend,
// but the Sun regards Mercury only as neutral; the Moon regards Mars
// as neutral, but Mars regards the Moon as a friend. Read this table
// as ROW = "how the row planet regards the column planet".
// Source (standard BPHS-derived table, cross-checked across
// multiple mirrors):
// https://www.astrojyoti.com/lesson6.htm
// https://steer.coach/planet-friend-enemy-table/
// https://www.hindu-blog.com/2019/06/naisargik-maitri-in-hindu-astrology.html
// ---------------------------------------------------------------------

type NaturalTier = "friend" | "neutral" | "enemy";

const NATURAL_FRIENDSHIP: Record<ClassicalPlanetName, Partial<Record<ClassicalPlanetName, NaturalTier>>> = {
  Sun: { Moon: "friend", Mars: "friend", Jupiter: "friend", Mercury: "neutral", Venus: "enemy", Saturn: "enemy" },
  Moon: { Sun: "friend", Mercury: "friend", Mars: "neutral", Jupiter: "neutral", Venus: "neutral", Saturn: "neutral" },
  Mars: { Sun: "friend", Moon: "friend", Jupiter: "friend", Venus: "neutral", Saturn: "neutral", Mercury: "enemy" },
  Mercury: { Sun: "friend", Venus: "friend", Mars: "neutral", Jupiter: "neutral", Saturn: "neutral", Moon: "enemy" },
  Jupiter: { Sun: "friend", Moon: "friend", Mars: "friend", Saturn: "neutral", Mercury: "enemy", Venus: "enemy" },
  Venus: { Mercury: "friend", Saturn: "friend", Mars: "neutral", Jupiter: "neutral", Sun: "enemy", Moon: "enemy" },
  Saturn: { Mercury: "friend", Venus: "friend", Jupiter: "neutral", Sun: "enemy", Moon: "enemy", Mars: "enemy" },
};

/** The rashi lord (sign ruler) of each of the 12 signs, among the 7
 * classical planets — the standard Parashari sign-lordship scheme
 * (each classical planet rules its own-sign(s) from the OWN_SIGNS
 * table above, inverted). */
const SIGN_LORD: Record<number, ClassicalPlanetName> = (() => {
  const table: Partial<Record<number, ClassicalPlanetName>> = {};
  for (const planet of CLASSICAL_PLANETS) {
    for (const sign of OWN_SIGNS[planet]) table[sign] = planet;
  }
  return table as Record<number, ClassicalPlanetName>;
})();

/**
 * Tatkalika (temporary) friendship: planets within 2nd, 3rd, 4th,
 * 10th, 11th or 12th sign-distance of each other (counted either
 * direction) are temporary friends; the remaining distances (1st/same
 * sign, 5th, 6th, 7th, 8th, 9th) are temporary enemies. Combined with
 * Naisargika Maitri via the classical 5-point (Panchadha Maitri)
 * formula below to get the final graded relationship.
 * Source: https://www.prokerala.com/astrology/planet-relationship.php
 * ("For each planet, count the houses from its position to every
 * other planet. Planets in the 2nd, 3rd, 4th, 10th, 11th, and 12th
 * houses are temporary friends; planets in the 1st, 5th, 6th, 7th,
 * 8th, and 9th houses are temporary enemies.")
 */
const TEMPORARY_FRIEND_DISTANCES = new Set([2, 3, 4, 10, 11, 12]);

function signDistance(fromSign: number, toSign: number): number {
  return (((toSign - fromSign) % 12) + 12) % 12 + 1;
}

/**
 * Directional: the sign-distance is counted FROM the occupying
 * planet's sign TO the lord's sign (matching the direction used for
 * Naisargika Maitri above — "how the planet regards the lord" — so
 * the two components being combined by Panchadha Maitri are both
 * consistently the planet's-eye view, not a mix of directions).
 */
function temporaryFriendship(fromSign: number, toSign: number): NaturalTier {
  const distance = signDistance(fromSign, toSign);
  return TEMPORARY_FRIEND_DISTANCES.has(distance) ? "friend" : "enemy";
}

export type SignLordRelationship = "great-friend" | "friend" | "neutral" | "enemy" | "great-enemy" | null;

/**
 * Panchadha Maitri (5-fold combined friendship): Natural + Temporary
 * → Great Friend / Friend / Neutral / Enemy / Great Enemy. This is
 * the standard combination table (friend+friend = great friend,
 * friend+neutral = friend, friend+enemy = neutral, neutral+enemy =
 * enemy, enemy+enemy = great enemy) — the widely-documented Parashari
 * scheme for combining Naisargika and Tatkalika Maitri.
 * Source: https://www.prokerala.com/astrology/planet-relationship.php
 * ("The 5 point formula is: Friend + Friend = Great Friend, Friend +
 * Neutral = Friend, Friend + Enemy = Neutral, Enemy + Neutral =
 * Enemy, Enemy + Enemy = Great Enemy.")
 */
function combinePanchadhaMaitri(natural: NaturalTier, temporary: NaturalTier): Exclude<SignLordRelationship, null> {
  if (natural === "friend" && temporary === "friend") return "great-friend";
  if (natural === "enemy" && temporary === "enemy") return "great-enemy";
  if (natural === "neutral" && temporary === "neutral") return "neutral";
  if (
    (natural === "friend" && temporary === "neutral") ||
    (natural === "neutral" && temporary === "friend")
  ) return "friend";
  if (
    (natural === "enemy" && temporary === "neutral") ||
    (natural === "neutral" && temporary === "enemy")
  ) return "enemy";
  // friend + enemy (either order) → neutral, per the formula above.
  return "neutral";
}

// ---------------------------------------------------------------------
// Public result type
// ---------------------------------------------------------------------

export type DignityResult = {
  planet: ClassicalPlanetName;
  isExalted: boolean;
  /** 0 (at the exact debilitation point, 180° away) to 1 (at the exact
   * deep-exaltation degree) — see `exaltationStrength` doc comment for
   * the sourced BPHS Uchcha-Bala convention this follows. Meaningful
   * regardless of `isExalted` (e.g. a planet just past its own
   * debilitation sign still has low, not zero, strength). */
  exaltationStrength: number;
  isDebilitated: boolean;
  isOwnSign: boolean;
  isMoolatrikona: boolean;
  /**
   * Panchadha Maitri (5-tier, Natural+Temporary combined — see
   * `combinePanchadhaMaitri`) relationship of the CURRENT sign's lord
   * to this planet. `null` when the planet occupies its own sign
   * (the sign lord IS the planet itself — "relationship to self" is
   * not a meaningful classical category and is already captured by
   * `isOwnSign`/`isMoolatrikona`/`dignity` instead).
   */
  signLordRelationship: SignLordRelationship;
  dignity:
    | "exalted"
    | "moolatrikona"
    | "own-sign"
    | "great-friend"
    | "friend"
    | "neutral"
    | "enemy"
    | "great-enemy"
    | "debilitated";
};

/**
 * Classical (Parashari) planetary dignity for the 7 classical planets.
 * Returns `null` for Rahu, Ketu, Uranus, Neptune and Pluto — see the
 * module doc comment above for why (no consistent classical
 * exaltation/debilitation/own-sign table for the nodes; no classical
 * dignity system at all for the outer planets).
 */
export function calculatePlanetaryDignity(chart: ChartData): Record<ChartPlanetName, DignityResult | null> {
  const result = {} as Record<ChartPlanetName, DignityResult | null>;

  for (const name of Object.keys(chart.planets) as ChartPlanetName[]) {
    if (!isClassicalPlanet(name)) {
      result[name] = null;
      continue;
    }
    result[name] = dignityForClassicalPlanet(name, chart.planets[name], chart);
  }

  return result;
}

function dignityForClassicalPlanet(
  planet: ClassicalPlanetName,
  entry: ChartPlanetEntry,
  chart: ChartData
): DignityResult {
  const exalt = EXALTATION[planet];
  const debilitSign = oppositeSign(exalt.sign);

  const isExalted = entry.sign === exalt.sign;
  const isDebilitated = entry.sign === debilitSign;
  const isOwnSign = OWN_SIGNS[planet].includes(entry.sign);

  const mt = MOOLATRIKONA[planet];
  const isMoolatrikona = entry.sign === mt.sign && entry.degree >= mt.fromDegree && entry.degree < mt.toDegree;

  let signLordRelationship: SignLordRelationship = null;
  if (!isOwnSign) {
    const lord = SIGN_LORD[entry.sign];
    const natural = NATURAL_FRIENDSHIP[planet][lord] ?? "neutral";
    // Tatkalika Maitri needs the LORD's own real placement in this
    // chart (sign distance between the two planets' actual positions),
    // not just the static sign-lordship table — the lord is always
    // one of the 7 classical planets, so it is always present in
    // chart.planets.
    const lordSign = chart.planets[lord].sign;
    const temporary = temporaryFriendship(entry.sign, lordSign);
    signLordRelationship = combinePanchadhaMaitri(natural, temporary);
  }

  const strength = exaltationStrength(planet, entry.longitude);

  // Priority order (classical: exaltation/debilitation/moolatrikona/
  // own-sign are positional facts that override the sign-lord-derived
  // Panchadha Maitri classification when determining the single
  // normalized `dignity` label).
  let dignity: DignityResult["dignity"];
  if (isExalted) dignity = "exalted";
  else if (isMoolatrikona) dignity = "moolatrikona";
  else if (isOwnSign) dignity = "own-sign";
  else if (isDebilitated) dignity = "debilitated";
  else dignity = signLordRelationship ?? "neutral";

  return {
    planet,
    isExalted,
    exaltationStrength: strength,
    isDebilitated,
    isOwnSign,
    isMoolatrikona,
    signLordRelationship,
    dignity,
  };
}
