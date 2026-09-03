// src/components/kundli-matching/types.ts
// Shared shape of the /api/kundli-matching response — one place both
// the form (fetch caller) and the result display agree on. `result` is
// the real, unmodified local AshtakootResult (src/lib/ashtakoot/calculate.ts)
// — see src/app/api/kundli-matching/route.ts's top comment for why
// Compatibility's response (src/components/compatibility/types.ts) has
// this exact same shape.
import type { StructuredReport } from "@/lib/ai/report";
import type { AshtakootResult } from "@/lib/ashtakoot/calculate";

export type KundliMatchingApiResponse = {
  result: AshtakootResult;
  /** true when either person's reading used a default 12:00 birth time
   * because their exact time of birth wasn't known — surfaced so the
   * result screen can disclose the caveat (several kootas are
   * Moon-nakshatra-derived and time-sensitive). */
  timeUnknown: boolean;
  report: StructuredReport | null;
  reportError: boolean;
};
