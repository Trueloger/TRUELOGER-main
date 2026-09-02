// src/components/ascendant/types.ts
// Shared shape of the /api/ascendant response — one place both the form
// (fetch caller) and the result display agree on.
import type { StructuredReport } from "@/lib/ai/report";
import type { RashiElement } from "@/lib/astrology/rashi-reference";

export type AscendantCalculated = {
  signNumber: number;
  signName: string;
  element: RashiElement | null;
  rulingPlanet: string;
  traits: string | null;
  degreeInSign: number;
  fullDegree: number;
  timeUnknown: boolean;
};

export type AscendantApiResponse = {
  calculated: AscendantCalculated;
  report: StructuredReport | null;
  reportError: boolean;
};
