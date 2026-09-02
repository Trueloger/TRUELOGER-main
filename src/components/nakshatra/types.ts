// src/components/nakshatra/types.ts
// Shared shape of the /api/nakshatra response — one place both the form
// (fetch caller) and the result display agree on.
import type { StructuredReport } from "@/lib/ai/report";

export type NakshatraCalculated = {
  nakshatraNumber: number;
  nakshatraName: string;
  pada: number;
  vimsottariLord: string;
  deity: string | null;
  symbol: string | null;
  moonSign: string;
  degreeInSign: number;
  timeUnknown: boolean;
};

export type NakshatraApiResponse = {
  calculated: NakshatraCalculated;
  report: StructuredReport | null;
  reportError: boolean;
};
