// src/components/mangal-dosha/types.ts
// Shared shape of the /api/mangal-dosha response — one place both the
// form (fetch caller) and the result display agree on.
import type { StructuredReport } from "@/lib/ai/report";
import type { MangalDoshaResult } from "@/lib/astrology/derive";

export type MangalDoshaApiResponse = {
  calculated: MangalDoshaResult;
  /** true when the reading used a default 12:00 birth time because the
   * user didn't know their exact time of birth — surfaced so the result
   * screen can disclose the caveat. */
  timeUnknown: boolean;
  report: StructuredReport | null;
  reportError: boolean;
};
