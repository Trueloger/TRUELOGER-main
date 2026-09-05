// src/components/kundli-matching/types.ts
// Shared shape of the /api/kundli-matching response — one place both
// the form (fetch caller) and the result display agree on. `result` is
// the real, unmodified local AshtakootResult (src/lib/ashtakoot/calculate.ts)
// — see src/app/api/kundli-matching/route.ts's top comment for why
// Compatibility's response (src/components/compatibility/types.ts) has
// this exact same shape.
import type { StructuredReport } from "@/lib/ai/report";
import type { AshtakootResult } from "@/lib/ashtakoot/calculate";
import type { ChartPlanetName } from "@/lib/astro-engine/ephemeris";

/** Structured chart data for BirthChartCard (src/components/charts) —
 * the exact same shape src/components/charts/types.ts's ChartStyleProps
 * needs, computed entirely by src/lib/astro-engine/ephemeris.ts's
 * calculateChart. Same shape as src/components/free-kundli/types.ts's
 * FreeKundliChartData — kept as its own named type here since this
 * route resolves two people's charts, not one. */
export type KundliMatchingChartData = {
  ascendantSign: number;
  planets: Record<
    ChartPlanetName,
    { sign: number; house: number; isRetrograde: boolean; degree: number }
  >;
};

/** One row of src/lib/astro-engine/yogas.ts's detectYogas() output —
 * data only (present/absent + an optional classical strength grade),
 * never interpretation text. */
export type KundliMatchingYoga = {
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
 * this route resolves two people's Shadbala, not one. */
export type KundliMatchingPlanetaryStrength = {
  planet: string;
  totalRupas: number;
  requiredRupas: number;
  meetsRequirement: boolean;
};

export type KundliMatchingApiResponse = {
  result: AshtakootResult;
  /** true when either person's reading used a default 12:00 birth time
   * because their exact time of birth wasn't known — surfaced so the
   * result screen can disclose the caveat (several kootas are
   * Moon-nakshatra-derived and time-sensitive). */
  timeUnknown: boolean;
  report: StructuredReport | null;
  reportError: boolean;
  /** The bride's (personA's) real birth chart, for BirthChartCard. */
  brideChart: KundliMatchingChartData;
  /** The groom's (personB's) real birth chart, for BirthChartCard. */
  groomChart: KundliMatchingChartData;
  /** The bride's D9 Navamsa chart, same BirthChartCard-compatible shape
   * as `brideChart` — every sign/house here is the planet's Navamsa
   * placement, not its D1/Rasi placement (src/lib/astro-engine/divisional.ts). */
  brideNavamsaChart: KundliMatchingChartData;
  /** The groom's D9 Navamsa chart — see `brideNavamsaChart`. */
  groomNavamsaChart: KundliMatchingChartData;
  /** The bride's own classical yogas, from her own chart only
   * (src/lib/astro-engine/yogas.ts) — never mixed with the groom's. */
  brideYogas: KundliMatchingYoga[];
  /** The groom's own classical yogas — see `brideYogas`. */
  groomYogas: KundliMatchingYoga[];
  /** The bride's own core Shadbala (7 classical planets only), computed
   * from her own chart only (src/lib/astro-engine/shadbala.ts) — never
   * mixed with the groom's. */
  bridePlanetaryStrength: KundliMatchingPlanetaryStrength[];
  /** The groom's own core Shadbala — see `bridePlanetaryStrength`. */
  groomPlanetaryStrength: KundliMatchingPlanetaryStrength[];
};
