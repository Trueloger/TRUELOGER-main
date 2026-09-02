// src/lib/panchang/types.ts
import type { PanchangResult } from "@/lib/astrology/types";

/** Firestore doc shape for the `dailyPanchang` collection — one doc per
 * IST calendar date, doc id = date. Deliberately mirrors
 * DailyHoroscopeDoc's shape (src/lib/horoscope/types.ts) for
 * consistency across this site's "generate once daily, archive, browse"
 * features.
 *
 * `source` names the fixed reference location this Panchang was
 * computed for (see src/lib/panchang/store.ts for why it's a single
 * national reference rather than per-city). */
export type DailyPanchangDoc = {
  date: string; // "YYYY-MM-DD", IST calendar date
  generatedAt: string; // ISO timestamp
  source: string; // e.g. "New Delhi" — the fixed reference location
  panchang: PanchangResult;
};
