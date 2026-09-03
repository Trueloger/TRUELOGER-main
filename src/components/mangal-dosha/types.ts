// src/components/mangal-dosha/types.ts
// Shared shape of the /api/mangal-dosha response — one place both the
// form (fetch caller) and the result display agree on.
import type { StructuredReport } from "@/lib/ai/report";
import type { MangalDoshaResult } from "@/lib/astrology/derive";
import type { ChartPlanetName } from "@/lib/astro-engine/ephemeris";

/** Structured chart data for BirthChartCard — the Ascendant's sidereal
 * sign plus every planet's sign/house/retrograde state/degree, read
 * straight off the same natal calculateChart() result the Mangal Dosha
 * derivation was already based on. */
export type MangalDoshaChartData = {
  ascendantSign: number;
  planets: Record<
    ChartPlanetName,
    { sign: number; house: number; isRetrograde: boolean; degree: number }
  >;
};

export type MangalDoshaApiResponse = {
  calculated: MangalDoshaResult;
  chart: MangalDoshaChartData;
  /** true when the reading used a default 12:00 birth time because the
   * user didn't know their exact time of birth — surfaced so the result
   * screen can disclose the caveat. */
  timeUnknown: boolean;
  report: StructuredReport | null;
  reportError: boolean;
};
