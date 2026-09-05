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

/** One classical planet's core Shadbala total vs. its classical
 * minimum-strength requirement (src/lib/astro-engine/shadbala.ts) —
 * only the 7 classical planets have this (no classical Shadbala for
 * Rahu/Ketu/outer planets), and this is a documented "core/simplified"
 * version of the full BPHS system, not a complete reproduction. Same
 * shape as src/components/free-kundli/types.ts's
 * FreeKundliPlanetaryStrength — kept as its own named type here since
 * this is a different tool's response. Bhava Bala (house strength) is
 * deliberately not included for this tool — see route.ts's comment. */
export type DashaPlanetaryStrength = {
  planet: string;
  totalRupas: number;
  requiredRupas: number;
  meetsRequirement: boolean;
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
  /** Core Shadbala for the 7 classical planets (Sun-Saturn only) —
   * see DashaPlanetaryStrength's doc comment. */
  planetaryStrength: DashaPlanetaryStrength[];
  timeUnknown: boolean;
  report: StructuredReport | null;
  reportError: boolean;
};
