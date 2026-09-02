// src/components/dasha/types.ts
// Shared shape of the /api/dasha response — one place both the form
// (fetch caller) and the result display agree on.
import type { StructuredReport } from "@/lib/ai/report";

export type MahaDashaTimelineEntry = { lord: string; start_time: string; end_time: string };

export type CurrentDashaEntry = { lord: string; period: { start_time: string; end_time: string } };

export type DashaApiResponse = {
  mahaDashaTimeline: MahaDashaTimelineEntry[];
  currentMahaDasha: CurrentDashaEntry | null;
  currentAntarDasha: CurrentDashaEntry | null;
  timeUnknown: boolean;
  report: StructuredReport | null;
  reportError: boolean;
};
