// src/components/free-kundli/types.ts
// Shared shape of the /api/free-kundli response — one place both the
// form (fetch caller) and the result display agree on. Mirrors the
// pattern of src/components/numerology/types.ts and
// src/components/mangal-dosha/types.ts.
import type { StructuredReport } from "@/lib/ai/report";
import type { ChartPlanetName } from "@/lib/astro-engine/ephemeris";

export type FreeKundliPlanetRow = {
  planet: string;
  sign: string;
  house: number;
  degree: string;
};

/** The summarized subset of the real chart actually surfaced as plain
 * facts (and handed to the AI-interpretation layer) — Ascendant, Moon
 * sign/nakshatra, Sun sign, and which real planets sit in an angular
 * house (1st/4th/7th/10th from the Ascendant). The full planet-by-planet
 * breakdown lives in `planetaryRows` below; this is the headline
 * summary, not a replacement for it. */
export type FreeKundliCalculated = {
  ascendant: {
    sign: string;
    signLord: string;
    degreeInSign: number;
  };
  moonSign: string | null;
  moonNakshatra: string | null;
  moonNakshatraPada: number | null;
  moonNakshatraLord: string | null;
  sunSign: string | null;
  /** Real planets (never "Ascendant" itself) placed in house 1, 4, 7, or
   * 10 counted from the Ascendant. */
  angularHousePlanets: { planet: string; house: number; sign: string }[];
  /** true when the reading used a default 12:00 birth time because the
   * user didn't know their exact time of birth — surfaced so the result
   * screen can prominently disclose that houses/Ascendant are
   * approximate. */
  timeUnknown: boolean;
  /** Names of every classical yoga detected present in this chart (see
   * `yogas` on FreeKundliApiResponse for the full checked/not-checked
   * list) — this subset is what's fed to the AI-interpretation layer. */
  presentYogaNames: string[];
};

/** One row of src/lib/astro-engine/yogas.ts's detectYogas() output —
 * data only (present/absent + an optional classical strength grade),
 * never interpretation text. */
export type FreeKundliYoga = {
  id: string;
  name: string;
  present: boolean;
  strength?: "weak" | "moderate" | "strong";
};

/** One classical planet's core Shadbala total vs. its classical
 * minimum-strength requirement (src/lib/astro-engine/shadbala.ts) —
 * only the 7 classical planets have this (no classical Shadbala for
 * Rahu/Ketu/outer planets), and this is a documented "core/simplified"
 * version of the full BPHS system, not a complete reproduction. */
export type FreeKundliPlanetaryStrength = {
  planet: string;
  totalRupas: number;
  requiredRupas: number;
  meetsRequirement: boolean;
};

/** Structured chart data — the exact shape NorthIndianChart.tsx needs
 * to render the North Indian style Rasi (D1) chart locally: the
 * Ascendant's sidereal sign (fixes which sign occupies House 1) plus
 * every planet's sign/house/retrograde state/degree. Computed entirely
 * by src/lib/astro-engine/ephemeris.ts's calculateChart — no network
 * call, no third-party SVG string, nothing here that needs sanitizing. */
export type FreeKundliChartData = {
  ascendantSign: number;
  planets: Record<
    ChartPlanetName,
    { sign: number; house: number; isRetrograde: boolean; degree: number }
  >;
};

export type FreeKundliApiResponse = {
  calculated: FreeKundliCalculated;
  /** Every planet (plus the Ascendant itself as its own row), mapped to
   * a table row — never a fabricated or partial set. */
  planetaryRows: FreeKundliPlanetRow[];
  /** Structured chart data for NorthIndianChart.tsx — always present:
   * the chart is now computed entirely locally (src/lib/astro-engine),
   * so there is no third-party call that can fail independently of the
   * rest of this response. */
  chart: FreeKundliChartData;
  /** D9 Navamsa chart, same BirthChartCard-compatible shape as `chart`
   * — every sign/house here is the planet's Navamsa placement, not its
   * D1/Rasi placement (src/lib/astro-engine/divisional.ts). */
  navamsaChart: FreeKundliChartData;
  /** Every classical yoga this engine checks for, with its real
   * present/absent result (src/lib/astro-engine/yogas.ts) — not
   * filtered to just the hits, so the UI can show what was checked. */
  yogas: FreeKundliYoga[];
  /** Core Shadbala for the 7 classical planets (Sun-Saturn only) —
   * see FreeKundliPlanetaryStrength's doc comment. */
  planetaryStrength: FreeKundliPlanetaryStrength[];
  report: StructuredReport | null;
  reportError: boolean;
};
