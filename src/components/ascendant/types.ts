// src/components/ascendant/types.ts
// Shared shape of the /api/ascendant response — one place both the form
// (fetch caller) and the result display agree on.
import type { StructuredReport } from "@/lib/ai/report";
import type { RashiElement } from "@/lib/astrology/rashi-reference";
import type { ChartPlanetName } from "@/lib/astro-engine/ephemeris";

/** Structured chart data for BirthChartCard — the Ascendant's sidereal
 * sign plus every planet's sign/house/retrograde state/degree, read
 * straight off the same natal calculateChart() result the Ascendant
 * was already derived from. */
export type AscendantChartData = {
  ascendantSign: number;
  planets: Record<
    ChartPlanetName,
    { sign: number; house: number; isRetrograde: boolean; degree: number }
  >;
};

export type AscendantCalculated = {
  signNumber: number;
  signName: string;
  element: RashiElement | null;
  rulingPlanet: string;
  traits: string | null;
  degreeInSign: number;
  fullDegree: number;
  timeUnknown: boolean;
};

export type AscendantApiResponse = {
  calculated: AscendantCalculated;
  chart: AscendantChartData;
  report: StructuredReport | null;
  reportError: boolean;
};
