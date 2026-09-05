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

/** One row of src/lib/astro-engine/yogas.ts's detectYogas() output —
 * data only (present/absent + an optional classical strength grade),
 * never interpretation text. */
export type DashaYoga = {
  id: string;
  name: string;
  present: boolean;
  strength?: "weak" | "moderate" | "strong";
};

export type DashaApiResponse = {
  mahaDashaTimeline: MahaDashaTimelineEntry[];
  currentMahaDasha: CurrentDashaEntry | null;
  currentAntarDasha: CurrentDashaEntry | null;
  chart: DashaChartData;
  /** D9 Navamsa chart, same BirthChartCard-compatible shape as `chart`
   * — every sign/house here is the planet's Navamsa placement, not its
   * D1/Rasi placement (src/lib/astro-engine/divisional.ts). */
  navamsaChart: DashaChartData;
  /** Every classical yoga this engine checks for, with its real
   * present/absent result (src/lib/astro-engine/yogas.ts). */
  yogas: DashaYoga[];
  timeUnknown: boolean;
  report: StructuredReport | null;
  reportError: boolean;
};
