// src/components/sade-sati/types.ts
// Shared shape of the /api/sade-sati response — one place both the form
// (fetch caller) and the result display agree on.
import type { StructuredReport } from "@/lib/ai/report";
import type { SadeSatiResult } from "@/lib/astrology/derive";

export type SadeSatiApiResponse = {
  calculated: SadeSatiResult;
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
