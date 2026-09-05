// src/lib/astro-engine/combustion.ts
// Combustion (Ashtangata / "planet-sets-with-the-Sun") for the
// classical planets, against real angular Sun-distance and classical
// per-planet thresholds. Pure functions, additive-only.
//
// SCOPE — Rahu/Ketu: classical sources hold that the lunar nodes
// cannot be combust — they are shadow points (no physical body to
// "burn"), and are themselves the agents of the Sun/Moon's own
// combustion during an eclipse, so applying combustion TO them is not
// a classical category. Source: "Rahu and Ketu can never be combust ...
// they are shadow planets without any physical existence and ...
// powerful enough to cause eclipses on the luminaries themselves. An
// eclipse is nothing but combustion of Sun and Moon."
// https://medium.com/@astrologykba/combustion-in-vedic-astrology-e3aa21bfefc8
// Rahu/Ketu are therefore given a trivial always-`isCombust: false`
// entry below (documented, not silently omitted) with `threshold: 0`
// as a marker that the concept does not classically apply to them,
// rather than leaving them out of the Record entirely (every
// ChartPlanetName besides Sun has a key, per the public contract).
import type { ChartData, ChartPlanetName } from "./ephemeris.ts";

export type CombustionResult = {
  planet: ChartPlanetName;
  /** Real angular separation from the Sun, shortest path, 0-180°. */
  sunDistance: number;
  /** The threshold actually applied for this planet (depends on
   * retrograde status for Mercury/Venus — see COMBUSTION_THRESHOLDS). */
  threshold: number;
  isCombust: boolean;
};

/**
 * Classical (Ashtangata) combustion orbs, per planet — these DIFFER by
 * planet, and Mercury/Venus specifically get a NARROWER orb when
 * retrograde (the only two classical planets that retrograde close to
 * the Sun). Moon, Mars, Jupiter and Saturn have a single fixed orb
 * (they are never combust while retrograde in a way classical texts
 * give a separate figure for, since their retrograde stations happen
 * far from conjunction with the Sun).
 * Source (Vedic/Phaladeepika-derived working table, cross-checked
 * across multiple modern secondary sources presenting the same
 * figures):
 * https://steer.coach/combust-planet/
 * https://www.augurine.com/tools/combust-planets-calculator
 * "Moon ... 12°, Mars ... 17°, Mercury ... 14° when direct and 12°
 * when retrograde, Jupiter ... 11°, Venus ... 10° when direct and 8°
 * when retrograde, Saturn ... 15°" — "differentiated per-planet table
 * ... is Vedic, codified in Mantreswara's Phaladeepika and the Brihat
 * Parashara Hora Shastra."
 */
const COMBUSTION_THRESHOLDS: Record<
  "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn",
  { direct: number; retrograde: number }
> = {
  Moon: { direct: 12, retrograde: 12 },
  Mars: { direct: 17, retrograde: 17 },
  Mercury: { direct: 14, retrograde: 12 },
  Jupiter: { direct: 11, retrograde: 11 },
  Venus: { direct: 10, retrograde: 8 },
  Saturn: { direct: 15, retrograde: 15 },
};

function shortestAngularSeparation(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Combustion status for every planet in the chart relative to the
 * Sun. The Sun itself is excluded (a body cannot be combust relative
 * to itself) — its key is present with a trivial always-false /
 * zero-distance entry so callers can iterate `Object.keys(chart.planets)`
 * uniformly without a special case, but `isCombust` is always `false`
 * and `sunDistance`/`threshold` are always `0` for it, documenting
 * that the field is not meaningful rather than silently absent.
 * Rahu/Ketu: see module doc comment — always `isCombust: false`,
 * `threshold: 0` (not classically applicable).
 * Uranus/Neptune/Pluto: not part of classical Ashtangata (post-dates
 * the classical texts entirely); given the same threshold-0,
 * non-combust treatment as Rahu/Ketu for the same "not classically
 * applicable, not silently omitted" reason.
 */
export function calculateCombustion(chart: ChartData): Record<ChartPlanetName, CombustionResult> {
  const sunLongitude = chart.planets.Sun.longitude;
  const result = {} as Record<ChartPlanetName, CombustionResult>;

  for (const name of Object.keys(chart.planets) as ChartPlanetName[]) {
    if (name === "Sun") {
      result[name] = { planet: name, sunDistance: 0, threshold: 0, isCombust: false };
      continue;
    }

    if (name === "Rahu" || name === "Ketu" || name === "Uranus" || name === "Neptune" || name === "Pluto") {
      const sunDistance = shortestAngularSeparation(chart.planets[name].longitude, sunLongitude);
      result[name] = { planet: name, sunDistance, threshold: 0, isCombust: false };
      continue;
    }

    const entry = chart.planets[name];
    const sunDistance = shortestAngularSeparation(entry.longitude, sunLongitude);
    const thresholds = COMBUSTION_THRESHOLDS[name];
    const threshold = entry.isRetrograde ? thresholds.retrograde : thresholds.direct;
    result[name] = {
      planet: name,
      sunDistance,
      threshold,
      isCombust: sunDistance <= threshold,
    };
  }

  return result;
}
