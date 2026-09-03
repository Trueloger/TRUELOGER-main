// src/components/dasha/types.ts
// Shared shape of the /api/dasha response — one place both the form
// (fetch caller) and the result display agree on.
import type { StructuredReport } from "@/lib/ai/report";
import type { ChartPlanetName } from "@/lib/astro-engine/ephemeris";

export type MahaDashaTimelineEntry = { lord: string; start_time: string; end_time: string };

export type CurrentDashaEntry = { lord: string; period: { start_time: string; end_time: string } };

/** Structured chart data for BirthChartCard — the Ascendant's sidereal
 * sign plus every planet's sign/house/retrograde state/degree, read
 * straight off the same natal calculateChart() result the dasha
 * calculation was already based on. */
export type DashaChartData = {
  ascendantSign: number;
  planets: Record<
    ChartPlanetName,
    { sign: number; house: number; isRetrograde: boolean; degree: number }
  >;
};

export type DashaApiResponse = {
  mahaDashaTimeline: MahaDashaTimelineEntry[];
  currentMahaDasha: CurrentDashaEntry | null;
  currentAntarDasha: CurrentDashaEntry | null;
  chart: DashaChartData;
  timeUnknown: boolean;
  report: StructuredReport | null;
  reportError: boolean;
};
