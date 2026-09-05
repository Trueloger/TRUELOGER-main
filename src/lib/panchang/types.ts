// src/lib/panchang/types.ts
import type { DailyPanchang } from "./calculate.ts";
import type { FestivalEvent } from "./festivals.ts";

/** Engine version stamped on every generated doc — bump this whenever
 * calculate.ts's formulas change, so an already-archived date can be
 * told apart from one computed by a newer engine (see PHASE 27 of the
 * engine-upgrade task: version every generated artifact). */
export const PANCHANG_ENGINE_VERSION = "1.0.0";

/** Firestore doc shape for the `dailyPanchang` collection — one doc per
 * IST calendar date, doc id = date. Computed entirely locally now (see
 * src/lib/panchang/calculate.ts) — no FreeAstrologyAPI call, no
 * per-day budget, so dates up to a year in the future can be archived
 * just as cheaply as "today". */
export type DailyPanchangDoc = {
  date: string; // "YYYY-MM-DD", IST calendar date
  generatedAt: string; // ISO timestamp
  source: string; // fixed reference location name, e.g. "New Delhi"
  engineVersion: string;
  panchang: DailyPanchang;
};

/** Firestore doc shape for the `panchangFestivals` collection — one doc
 * per Gregorian year (doc id = "2026" etc.), holding every festival/vrat
 * this engine computed for that year. Generated once per year (see
 * src/lib/panchang/store.ts) rather than recomputed per date lookup. */
export type YearFestivalsDoc = {
  year: number;
  generatedAt: string; // ISO timestamp
  engineVersion: string;
  festivals: FestivalEvent[];
};
