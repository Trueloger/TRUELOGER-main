// src/components/rashi/types.ts
// Shared shape of the /api/rashi response — one place both the form
// (fetch caller) and the result display agree on.
import type { StructuredReport } from "@/lib/ai/report";
import type { RashiElement } from "@/lib/astrology/rashi-reference";
import type { ChartPlanetName } from "@/lib/astro-engine/ephemeris";

/** Structured chart data for BirthChartCard — the Ascendant's sidereal
 * sign plus every planet's sign/house/retrograde state/degree, read
 * straight off the same natal calculateChart() result Moon was already
 * derived from. */
export type RashiChartData = {
  ascendantSign: number;
  planets: Record<
    ChartPlanetName,
    { sign: number; house: number; isRetrograde: boolean; degree: number }
  >;
};

export type RashiCalculated = {
  signNumber: number;
  signName: string;
  element: RashiElement | null;
  rulingPlanet: string;
  traits: string | null;
  degreeInSign: number;
  fullDegree: number;
  nakshatraName: string;
  nakshatraPada: number;
  moonHouse: number;
  isRetro: boolean;
  timeUnknown: boolean;
};

export type RashiApiResponse = {
  calculated: RashiCalculated;
  chart: RashiChartData;
  report: StructuredReport | null;
  reportError: boolean;
};
