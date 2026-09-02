// src/lib/panchang/store.ts
// Server-only. Read-through store for daily Panchang, mirroring
// src/lib/horoscope/store.ts exactly: generate at most once per IST
// date, serve every subsequent caller the stored result.
//
// WHY once per day, for one fixed location, instead of live-per-visitor
// or live-per-city: FreeAstrologyAPI's free tier is a shared budget of
// 50 requests/day across EVERY tool on this site (not just Panchang),
// at 1 request/second. getPanchang() alone fans out to 13 sub-calls
// (see src/lib/astrology/freeastrologyapi.ts) — computing it live per
// visitor, or per arbitrary city, would exhaust the entire site's daily
// quota on Panchang alone almost instantly. Generating it once per day,
// server-side, for a single fixed reference location and archiving the
// result is the only shape that fits the budget.
//
// WHY a single fixed location (New Delhi) rather than per-city: true
// Panchang timings (sunrise, Rahu Kalam, hora, choghadiya, etc.) are
// genuinely location-dependent. Supporting even a handful of cities
// would multiply the daily API cost by the number of cities supported,
// which the 50-req/day shared budget cannot absorb. Using India's
// capital as one well-known national reference is an intentional,
// explained scope tradeoff given the constraint — not an oversight.
//
// Imports its firebase-admin sibling by relative path (not the "@/"
// alias), matching every other file under src/lib/ — see
// src/lib/horoscope/store.ts for why: it lets this file also run under
// plain `node`, not just inside Next's bundler.
import { getFirestoreDb } from "../firebase-admin.ts";
import { getPanchang } from "../astrology/freeastrologyapi.ts";
import { resolveCityCoordinates } from "../astrology/geocode.ts";
import { getTodayIST } from "../horoscope/date.ts";
import type { DailyPanchangDoc } from "./types.ts";

const COLLECTION = "dailyPanchang";

// Single fixed reference location — see file header for why. Matches
// the city PanchangView previously defaulted to.
const REFERENCE_CITY = "New Delhi";

// Panchang elements are traditionally reckoned starting from sunrise;
// FreeAstrologyAPI's endpoints still require an hours/minutes/seconds
// field even though this tool has no "time of birth" input. 06:00 local
// sits close to sunrise across India's seasons while staying safely
// inside the requested calendar date on both sides (unlike midnight,
// which risks resolving tithi/nakshatra boundaries for the tail end of
// the previous day in some edge cases).
const REFERENCE_HOUR = 6;

export async function getDailyPanchang(date: string): Promise<DailyPanchangDoc | null> {
  const snap = await getFirestoreDb().collection(COLLECTION).doc(date).get();
  if (!snap.exists) return null;
  return snap.data() as DailyPanchangDoc;
}

export async function generateDailyPanchang(date: string): Promise<DailyPanchangDoc> {
  const coords = resolveCityCoordinates(REFERENCE_CITY.toLowerCase());
  if (!coords) {
    // Should never happen — REFERENCE_CITY is a constant known to exist
    // in geocode.ts's table — but never fabricate coordinates.
    throw new Error(`Reference city "${REFERENCE_CITY}" not found in geocode table`);
  }

  const [year, month, day] = date.split("-").map(Number);
  const panchang = await getPanchang({
    year,
    month,
    date: day,
    hours: REFERENCE_HOUR,
    minutes: 0,
    seconds: 0,
    latitude: coords.lat,
    longitude: coords.lon,
    timezone: coords.timezone,
  });

  const doc: DailyPanchangDoc = {
    date,
    generatedAt: new Date().toISOString(),
    source: REFERENCE_CITY,
    panchang,
  };

  const ref = getFirestoreDb().collection(COLLECTION).doc(date);
  try {
    // create() (not set()) fails if the doc already exists — the
    // signal that a concurrent caller (cron + a visitor hitting the
    // same missing date, or two visitors at once) won the race.
    await ref.create(doc);
    return doc;
  } catch (err) {
    console.error("[panchang] create failed for", date, err);
    const existing = await getDailyPanchang(date);
    if (existing) return existing;
    throw new Error(`Failed to create or read daily panchang doc for ${date}`);
  }
}

// In-process, same-date in-flight promise cache — prevents concurrent
// requests for the same still-missing date from each independently
// passing the getDailyPanchang null-check before any .create() lands
// and each triggering their own redundant 13-call generation. .create()
// alone only prevents duplicate Firestore *writes*, not duplicate
// *generations* within this race window.
const inFlight = new Map<string, Promise<DailyPanchangDoc | null>>();

/** Read-through: try the stored doc first, generate only if missing.
 *
 * IMPORTANT budget-protection rule: on-demand generation is only ever
 * allowed for TODAY's IST date (covering the case where a visitor hits
 * the page before the day's cron has run yet). A past date with no
 * stored doc returns `null` — it NEVER falls back to calling the live
 * API, which would defeat the whole point of archiving (an unbounded
 * number of past dates could otherwise each trigger a fresh 13-call
 * generation). This exactly matches how the Daily Horoscope feature
 * behaves. */
export function getOrGenerateDailyPanchang(date: string): Promise<DailyPanchangDoc | null> {
  const pending = inFlight.get(date);
  if (pending) return pending;

  const promise = (async () => {
    const existing = await getDailyPanchang(date);
    if (existing) return existing;
    if (date !== getTodayIST()) return null;
    return generateDailyPanchang(date);
  })().finally(() => {
    inFlight.delete(date);
  });

  inFlight.set(date, promise);
  return promise;
}
