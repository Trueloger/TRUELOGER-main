// src/components/numerology/types.ts
// Shared shape of the /api/numerology response — one place both the form
// (fetch caller) and the result display agree on.
import type { StructuredReport } from "@/lib/ai/report";
import type { NumerologyNumberMeaning } from "@/lib/numerology/meanings";

export type NumerologyCalculated = {
  lifePathNumber: number;
  destinyNumber: number;
  soulUrgeNumber: number;
  personalityNumber: number;
  birthNumber: number;
};

export type NumerologyMeanings = Record<keyof NumerologyCalculated, NumerologyNumberMeaning>;

export type NumerologyApiResponse = {
  calculated: NumerologyCalculated;
  meanings: NumerologyMeanings;
  report: StructuredReport | null;
  reportError: boolean;
};
