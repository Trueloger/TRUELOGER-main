// src/components/compatibility/types.ts
// Shared shape of the /api/compatibility response — one place both the
// form (fetch caller) and the result display agree on. `result` is the
// real, unmodified local AshtakootResult (src/lib/ashtakoot/calculate.ts)
// — the SAME shape Kundli Matching's response uses
// (src/components/kundli-matching/types.ts); see
// src/app/api/compatibility/route.ts's top comment for why.
import type { StructuredReport } from "@/lib/ai/report";
import type { AshtakootResult } from "@/lib/ashtakoot/calculate";
import type { ChartPlanetName } from "@/lib/astro-engine/ephemeris";

/** Structured chart data for BirthChartCard (src/components/charts) —
 * the exact same shape src/components/charts/types.ts's ChartStyleProps
 * needs, computed entirely by src/lib/astro-engine/ephemeris.ts's
 * calculateChart. Same shape as src/components/kundli-matching/types.ts's
 * KundliMatchingChartData — kept as its own named type here since this
 * route resolves two people's charts, not one. */
export type CompatibilityChartData = {
  ascendantSign: number;
  planets: Record<
    ChartPlanetName,
    { sign: number; house: number; isRetrograde: boolean; degree: number }
  >;
};

/** One row of src/lib/astro-engine/yogas.ts's detectYogas() output —
 * data only (present/absent + an optional classical strength grade),
 * never interpretation text. */
export type CompatibilityYoga = {
  id: string;
  name: string;
  present: boolean;
  strength?: "weak" | "moderate" | "strong";
};

export type CompatibilityApiResponse = {
  result: AshtakootResult;
  /** true when either person's reading used a default 12:00 birth time
   * because their exact time of birth wasn't known — surfaced so the
   * result screen can disclose the caveat (several kootas are
   * Moon-nakshatra-derived and time-sensitive). */
  timeUnknown: boolean;
  report: StructuredReport | null;
  reportError: boolean;
  /** Person A's ("you") real birth chart, for BirthChartCard. */
  youChart: CompatibilityChartData;
  /** Person B's ("your partner") real birth chart, for BirthChartCard. */
  partnerChart: CompatibilityChartData;
  /** Person A's ("you") D9 Navamsa chart, same BirthChartCard-compatible
   * shape as `youChart` — every sign/house here is the planet's Navamsa
   * placement, not its D1/Rasi placement (src/lib/astro-engine/divisional.ts). */
  youNavamsaChart: CompatibilityChartData;
  /** Person B's ("your partner") D9 Navamsa chart — see `youNavamsaChart`. */
  partnerNavamsaChart: CompatibilityChartData;
  /** Person A's ("you") own classical yogas, from your own chart only
   * (src/lib/astro-engine/yogas.ts) — never mixed with your partner's. */
  youYogas: CompatibilityYoga[];
  /** Person B's ("your partner") own classical yogas — see `youYogas`. */
  partnerYogas: CompatibilityYoga[];
};
