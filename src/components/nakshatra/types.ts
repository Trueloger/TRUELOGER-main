// src/components/nakshatra/types.ts
// Shared shape of the /api/nakshatra response — one place both the form
// (fetch caller) and the result display agree on.
import type { StructuredReport } from "@/lib/ai/report";
import type { ChartPlanetName } from "@/lib/astro-engine/ephemeris";

/** Structured chart data for BirthChartCard — the Ascendant's sidereal
 * sign plus every planet's sign/house/retrograde state/degree, read
 * straight off the same natal calculateChart() result Moon was already
 * derived from. */
export type NakshatraChartData = {
  ascendantSign: number;
  planets: Record<
    ChartPlanetName,
    { sign: number; house: number; isRetrograde: boolean; degree: number }
  >;
};

export type NakshatraCalculated = {
  nakshatraNumber: number;
  nakshatraName: string;
  pada: number;
  vimsottariLord: string;
  deity: string | null;
  symbol: string | null;
  moonSign: string;
  degreeInSign: number;
  timeUnknown: boolean;
};

export type NakshatraApiResponse = {
  calculated: NakshatraCalculated;
  chart: NakshatraChartData;
  report: StructuredReport | null;
  reportError: boolean;
};
