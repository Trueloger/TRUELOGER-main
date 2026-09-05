// src/lib/astro-engine/transit.ts
// Reusable Transit (Gochar) engine — generalizes the ad-hoc "second
// calculateChart() call for the current moment" pattern that
// src/app/api/sade-sati/route.ts and src/lib/astrology/derive.ts's
// deriveSadeSati() currently hand-roll into one module other tools can
// share: "where do transiting planets sit relative to a NATAL chart,
// right now (or at any given moment)".
//
// Nothing here recomputes ephemeris positions itself — every longitude
// comes from ephemeris.ts's calculateChart(), same as every other
// consumer in this codebase (birth charts, Panchang, Sade Sati).
import { calculateChart, type ChartData, type ChartPlanetName } from "./ephemeris.ts";
import { calculateAspects, type AspectType } from "./aspects.ts";
import { signHouseNumber } from "../astrology/derive.ts";

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type PlanetTransitInfo = {
  planet: ChartPlanetName;
  transitSign: number;
  /** whole-sign house counted from the NATAL Ascendant (not the transit
   * moment's own ascendant) — the standard Gochar convention: transits
   * are read against the natal houses. */
  transitHouseFromNatalAscendant: number;
  isRetrograde: boolean;
  /** Aspects the TRANSITING planet casts onto NATAL planets — see the
   * module doc comment below calculateTransit for exactly how this is
   * derived from aspects.ts without duplicating its table. */
  aspectsToNatalPlanets: { natalPlanet: ChartPlanetName; aspectType: AspectType }[];
  /** Natal planets sharing the transiting planet's current sign
   * (whole-sign conjunction — the classical convention, not a tight
   * orb). Can include the same planet's own natal placement. */
  conjunctNatalPlanets: ChartPlanetName[];
};

export type TransitSnapshot = {
  transitUtc: string; // ISO
  natalAscendantSign: number;
  planets: Record<ChartPlanetName, PlanetTransitInfo>;
};

// ---------------------------------------------------------------------
// calculateTransit
// ---------------------------------------------------------------------

/**
 * Full transit analysis of every classical + outer body against a
 * NATAL chart, for one transit moment/location.
 *
 * Cross-chart aspect handling: Parashari graha drishti (aspects.ts) is
 * a purely SIGN-OFFSET rule — a planet's aspect lands on specific
 * signs computed only from that planet's OWN sign, independent of
 * which chart (natal or transit) that sign belongs to. That means
 * "which signs does the transiting planet aspect" can be answered by
 * calling aspects.ts's real, already-tested `calculateAspects()` on
 * the TRANSIT chart itself (getting each transiting planet's aspected
 * signs), and then separately checking which NATAL planets occupy
 * those signs. This reuses aspects.ts's exported logic exactly (same
 * table, same rules, same `includeNodeAspects` opt-in default-off
 * behavior) with zero duplication of its aspect table — no adapted or
 * copy-pasted rules live in this file.
 */
export function calculateTransit(
  natalChart: ChartData,
  transitUtc: Date,
  latitude: number,
  longitude: number
): TransitSnapshot {
  const transitChart = calculateChart(transitUtc, latitude, longitude);
  const transitAspects = calculateAspects(transitChart);

  const allPlanets = Object.keys(transitChart.planets) as ChartPlanetName[];
  const planets = {} as Record<ChartPlanetName, PlanetTransitInfo>;

  for (const planet of allPlanets) {
    const transitEntry = transitChart.planets[planet];
    const transitSign = transitEntry.sign;
    const aspectsFromThisPlanet = transitAspects.filter((a) => a.fromPlanet === planet);

    const aspectsToNatalPlanets: PlanetTransitInfo["aspectsToNatalPlanets"] = [];
    const conjunctNatalPlanets: ChartPlanetName[] = [];
    for (const natalPlanetName of allPlanets) {
      const natalSign = natalChart.planets[natalPlanetName].sign;
      if (natalSign === transitSign) conjunctNatalPlanets.push(natalPlanetName);
      const hit = aspectsFromThisPlanet.find((a) => a.toSign === natalSign);
      if (hit) aspectsToNatalPlanets.push({ natalPlanet: natalPlanetName, aspectType: hit.aspectType });
    }

    planets[planet] = {
      planet,
      transitSign,
      transitHouseFromNatalAscendant: signHouseNumber(natalChart.ascendant.sign, transitSign),
      isRetrograde: transitEntry.isRetrograde,
      aspectsToNatalPlanets,
      conjunctNatalPlanets,
    };
  }

  return {
    transitUtc: transitUtc.toISOString(),
    natalAscendantSign: natalChart.ascendant.sign,
    planets,
  };
}

// ---------------------------------------------------------------------
// findNextSignIngress
// ---------------------------------------------------------------------

/** ~3 years: comfortably covers a full sign transit for the slowest
 * classically tracked body (Saturn, ~2.5 years/sign, occasionally
 * longer with retrograde loops) with real margin; Jupiter (~1
 * year/sign) and every faster body resolve well inside this. Callers
 * tracking an even slower cycle (Rahu/Ketu's ~1.5yr/sign is already
 * covered; a genuinely multi-decade case would need an explicit larger
 * `maxSearchDays`). */
const DEFAULT_MAX_SEARCH_DAYS = 3 * 365;

function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function signIndexOf(longitude: number): number {
  return Math.floor(normalizeDegrees(longitude) / 30); // 0-11
}

/**
 * Next sidereal sign ingress (crossing a 30°-multiple boundary) for
 * `body`, searching forward from `fromUtc`. Mirrors the bisection
 * technique src/lib/panchang/calculate.ts's `findNextBoundary` already
 * uses for tithi/nakshatra/yoga/karana boundaries: step forward in
 * fixed increments until the sign index changes, then bisect the
 * bracketing window down to the precise crossing instant.
 *
 * Step size (1 day) is safely smaller than any tracked body's fastest
 * possible sign transit — even the Moon, the fastest mover here at
 * ~13°/day, cannot cross a full 30° sign within one day — so no
 * crossing is ever skipped over by a step.
 *
 * Returns `null` if no ingress is found within `maxSearchDays` (default
 * `DEFAULT_MAX_SEARCH_DAYS`, see above) rather than searching forever.
 */
export function findNextSignIngress(
  body: ChartPlanetName,
  fromUtc: Date,
  latitude: number,
  longitude: number,
  maxSearchDays: number = DEFAULT_MAX_SEARCH_DAYS
): { ingressUtc: string; fromSign: number; toSign: number } | null {
  const longitudeAt = (d: Date) => calculateChart(d, latitude, longitude).planets[body].longitude;

  const startIdx = signIndexOf(longitudeAt(fromUtc));
  const STEP_MS = 24 * 3600 * 1000; // 1 day

  let lo = fromUtc.getTime();
  let hi = lo;
  let steps = 0;
  const maxSteps = Math.ceil(maxSearchDays);
  let steppedIdx = startIdx;

  while (steps < maxSteps) {
    hi += STEP_MS;
    steps++;
    steppedIdx = signIndexOf(longitudeAt(new Date(hi)));
    if (steppedIdx !== startIdx) break;
  }
  if (steppedIdx === startIdx) return null; // nothing found within the cap

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (signIndexOf(longitudeAt(new Date(mid))) === startIdx) lo = mid;
    else hi = mid;
  }

  const ingressDate = new Date(hi);
  const toIdx = signIndexOf(longitudeAt(ingressDate));

  return {
    ingressUtc: ingressDate.toISOString(),
    fromSign: startIdx + 1,
    toSign: toIdx + 1,
  };
}

// ---------------------------------------------------------------------
// transitHouseSummary
// ---------------------------------------------------------------------

/**
 * Sade-Sati-STYLE house-transit summary generalized beyond Saturn: for
 * every planet, its whole-sign house counted from the natal Moon
 * (exactly what deriveSadeSati applies to transiting Saturn — see
 * src/lib/astrology/derive.ts) and, additionally, from the natal
 * Ascendant. Useful for any "planet X transiting my Yth house" feature.
 */
export function transitHouseSummary(
  natalChart: ChartData,
  transitUtc: Date,
  latitude: number,
  longitude: number
): { planet: ChartPlanetName; houseFromNatalMoon: number; houseFromNatalAscendant: number }[] {
  const transitChart = calculateChart(transitUtc, latitude, longitude);
  const natalMoonSign = natalChart.planets.Moon.sign;
  const natalAscendantSign = natalChart.ascendant.sign;

  return (Object.keys(transitChart.planets) as ChartPlanetName[]).map((planet) => {
    const transitSign = transitChart.planets[planet].sign;
    return {
      planet,
      houseFromNatalMoon: signHouseNumber(natalMoonSign, transitSign),
      houseFromNatalAscendant: signHouseNumber(natalAscendantSign, transitSign),
    };
  });
}
