// src/components/free-kundli/types.ts
// Shared shape of the /api/free-kundli response — one place both the
// form (fetch caller) and the result display agree on. Mirrors the
// pattern of src/components/numerology/types.ts and
// src/components/mangal-dosha/types.ts.
import type { StructuredReport } from "@/lib/ai/report";

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
};

export type FreeKundliApiResponse = {
  calculated: FreeKundliCalculated;
  /** Every real entry from the API's planetary-positions response,
   * mapped to a table row — never a fabricated or partial set. */
  planetaryRows: FreeKundliPlanetRow[];
  /** false when the chart-visualization call failed or returned a
   * shape that didn't look like real SVG markup — the rest of the
   * response (calculated + planetaryRows) is still real, complete data
   * either way. */
  chartAvailable: boolean;
  /** `data:image/svg+xml;base64,...` — the Rasi (D1) chart SVG returned
   * by a third-party API, base64-encoded server-side and rendered
   * client-side via a plain `<img src>`, NEVER injected into the DOM as
   * markup (no `dangerouslySetInnerHTML`). An `<img>`-loaded SVG cannot
   * execute embedded script/event-handler attributes — that's the real
   * XSS boundary here, not the shape sanity-check in the route (a
   * denylist substring check is not a security control on its own).
   * null when chartAvailable is false. */
  chartDataUri: string | null;
  report: StructuredReport | null;
  reportError: boolean;
};
