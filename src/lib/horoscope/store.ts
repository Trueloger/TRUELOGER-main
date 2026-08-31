// src/lib/horoscope/store.ts
// Server-only. The single choke point every page and the cron route
// goes through for "today's readings" — generates at most once per
// IST date and serves every subsequent caller the stored result.
//
// Imports its firebase-admin sibling by relative path (not the "@/"
// alias) so this file — and scripts/dev/verify-horoscope-store.ts,
// which imports it directly — can also run under plain `node`, not
// just inside Next's bundler.
import { getFirestoreDb } from "../firebase-admin.ts";
import { generateAllSignReadings } from "./openrouter.ts";
import type { DailyHoroscopeDoc } from "./types.ts";

const COLLECTION = "dailyHoroscopes";

export async function getDailyHoroscopes(
  date: string
): Promise<DailyHoroscopeDoc | null> {
  const snap = await getFirestoreDb().collection(COLLECTION).doc(date).get();
  if (!snap.exists) return null;
  return snap.data() as DailyHoroscopeDoc;
}

export async function generateDailyHoroscopes(
  date: string
): Promise<DailyHoroscopeDoc> {
  const signs = await generateAllSignReadings(date);
  const doc: DailyHoroscopeDoc = {
    date,
    generatedAt: new Date().toISOString(),
    model: process.env.OPENROUTER_MODEL_FREE ?? "unknown",
    signs,
  };

  const ref = getFirestoreDb().collection(COLLECTION).doc(date);
  try {
    // create() (not set()) fails if the doc already exists — the
    // signal that a concurrent caller (cron + a visitor hitting the
    // same missing date, or two visitors at once) won the race.
    await ref.create(doc);
    return doc;
  } catch {
    const existing = await getDailyHoroscopes(date);
    if (existing) return existing;
    throw new Error(`Failed to create or read daily horoscope doc for ${date}`);
  }
}

export async function getOrGenerateDailyHoroscopes(
  date: string
): Promise<DailyHoroscopeDoc> {
  const existing = await getDailyHoroscopes(date);
  if (existing) return existing;
  return generateDailyHoroscopes(date);
}
