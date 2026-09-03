// src/components/sade-sati/types.ts
// Shared shape of the /api/sade-sati response — one place both the form
// (fetch caller) and the result display agree on.
import type { StructuredReport } from "@/lib/ai/report";
import type { SadeSatiResult } from "@/lib/astrology/derive";
import type { ChartPlanetName } from "@/lib/astro-engine/ephemeris";

/** Structured chart data for BirthChartCard — the NATAL chart's
 * Ascendant sidereal sign plus every planet's sign/house/retrograde
 * state/degree (never the transit chart used for Saturn's current
 * position). */
export type SadeSatiChartData = {
  ascendantSign: number;
  planets: Record<
    ChartPlanetName,
    { sign: number; house: number; isRetrograde: boolean; degree: number }
  >;
};

export type SadeSatiApiResponse = {
  calculated: SadeSatiResult;
  chart: SadeSatiChartData;
  /** Natal Moon sign (1-12, sidereal) the calculation was based on. */
  natalMoonSign: number;
  /** Currently transiting Saturn's sign (1-12, sidereal) at the moment
   * the reading was generated. */
  transitingSaturnSign: number;
  /** true when the reading used a default 12:00 birth time because the
   * user didn't know their exact time of birth — surfaced so the result
   * screen can disclose the caveat. */
  timeUnknown: boolean;
  report: StructuredReport | null;
  reportError: boolean;
};
