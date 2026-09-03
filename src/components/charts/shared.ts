// src/components/charts/shared.ts
// Constants shared by every chart-style component in this directory —
// kept in one place so the four styles never drift (e.g. one style
// abbreviating "Mercury" differently than another).
import type { ChartPlanetName } from "@/lib/astro-engine/ephemeris";

export const PLANET_ABBREVIATIONS: Record<ChartPlanetName, string> = {
  Sun: "Su",
  Moon: "Mo",
  Mars: "Ma",
  Mercury: "Me",
  Jupiter: "Ju",
  Venus: "Ve",
  Saturn: "Sa",
  Rahu: "Ra",
  Ketu: "Ke",
  Uranus: "Ur",
  Neptune: "Ne",
  Pluto: "Pl",
};

// Canonical display order within a shared cell — traditional Vedic
// ordering (luminaries, then the classical grahas, then the shadow
// points, then the modern outer planets), same order used for the
// planetary table in src/app/api/free-kundli/route.ts.
export const PLANET_ORDER: ChartPlanetName[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
  "Rahu", "Ketu", "Uranus", "Neptune", "Pluto",
];

/** Sidereal sign occupying `house` (1-12) counted from an Ascendant
 * whose own sign is `ascendantSign` — the same whole-sign rule
 * src/lib/astrology/derive.ts's signHouseNumber applies in reverse.
 * Used by the sign-fixed-per-house North Indian style. */
export function signForHouse(ascendantSign: number, house: number): number {
  return (((ascendantSign - 1 + (house - 1)) % 12) + 12) % 12 + 1;
}

/** Whole-sign house (1-12, counted from the Ascendant) that a given
 * sidereal `sign` (1-12) falls in — the inverse of signForHouse, used
 * by the two sign-FIXED styles (South Indian, East Indian) to know
 * which of a sign's fixed cells is "House 1" for this Ascendant, so
 * they can mark/highlight it. */
export function houseForSign(ascendantSign: number, sign: number): number {
  return (((sign - ascendantSign) % 12) + 12) % 12 + 1;
}
