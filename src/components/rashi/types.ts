// src/components/rashi/types.ts
// Shared shape of the /api/rashi response — one place both the form
// (fetch caller) and the result display agree on.
import type { StructuredReport } from "@/lib/ai/report";
import type { RashiElement } from "@/lib/astrology/rashi-reference";

export type RashiCalculated = {
  signNumber: number;
  signName: string;
  element: RashiElement | null;
  rulingPlanet: string;
  traits: string | null;
  degreeInSign: number;
  fullDegree: number;
  nakshatraName: string;
  nakshatraPada: number;
  moonHouse: number;
  isRetro: boolean;
  timeUnknown: boolean;
};

export type RashiApiResponse = {
  calculated: RashiCalculated;
  report: StructuredReport | null;
  reportError: boolean;
};
