// src/lib/panchang/store.ts
// Server-only. Read-through store for daily Panchang AND yearly
// festival/vrat lists, both now computed by a fully local engine (see
// src/lib/panchang/calculate.ts and src/lib/panchang/festivals.ts) — no
// FreeAstrologyAPI call, no per-request budget, so unlike the previous
// version this can generate a date/year on demand regardless of whether
// it's in the past, today, or up to a year in the future.
//
// WHY still archive at all, if generation is free: (1) determinism —
// a URL like /api/panchang?date=2026-11-08 should keep returning the
// exact same computed result even if the engine's formulas improve
// later (see PANCHANG_ENGINE_VERSION); (2) speed — reading one Firestore
// doc is far faster than recomputing tithi/nakshatra/yoga/karana/hora/
// choghadiya boundary searches on every visitor request; (3) it keeps
// this feature's shape consistent with every other "generate once
// daily/yearly, archive, browse" feature on this site (Daily Horoscope,
// the previous Panchang implementation).
//
// WHY still a single fixed reference location (New Delhi) rather than
// per-city: true Panchang timings (sunrise, Rahu Kalam, hora,
// choghadiya, etc.) are genuinely location-dependent, and one
// well-known national reference keeps the feature's scope and archive
// size bounded. This is no longer a budget constraint (the old
// FreeAstrologyAPI 50-req/day limit is gone) — it's now a deliberate
// product-scope choice, easy to lift later if per-city Panchang is
// wanted (calculateDailyPanchang already takes lat/lon).
import { getFirestoreDb } from "../firebase-admin.ts";
import { resolveCityCoordinates } from "../astrology/geocode.ts";
import { getTodayIST } from "../horoscope/date.ts";
import { calculateDailyPanchang } from "./calculate.ts";
import { computeYearFestivals } from "./festivals.ts";
import { PANCHANG_ENGINE_VERSION, type DailyPanchangDoc, type YearFestivalsDoc } from "./types.ts";

const DAILY_COLLECTION = "dailyPanchang";
const FESTIVALS_COLLECTION = "panchangFestivals";
const META_DOC_PATH = ["panchangMeta", "coverage"] as const;

const REFERENCE_CITY = "New Delhi";

// How far ahead of "today" the daily archive is kept topped up — the
// site-wide "Panchang is available a year in advance" guarantee.
const LOOKAHEAD_DAYS = 365;

// Safety cap on how many missing days a single ensureDailyCoverage()
// call will backfill — bounds worst-case function duration if a cron
// run (or several) was missed. Recovers fully within a few days even
// after a week-long outage, never risking a timeout on any single run.
const MAX_CATCHUP_DAYS_PER_CALL = 15;

function referenceCoords() {
  const coords = resolveCityCoordinates(REFERENCE_CITY.toLowerCase());
  if (!coords) {
    // Should never happen — REFERENCE_CITY is a constant known to exist
    // in geocode.ts's table — but never fabricate coordinates.
    throw new Error(`Reference city "${REFERENCE_CITY}" not found in geocode table`);
  }
  return coords;
}

function addDaysToDateString(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------
// Daily Panchang
// ---------------------------------------------------------------------

export async function getDailyPanchang(date: string): Promise<DailyPanchangDoc | null> {
  const snap = await getFirestoreDb().collection(DAILY_COLLECTION).doc(date).get();
  if (!snap.exists) return null;
  return snap.data() as DailyPanchangDoc;
}

function buildDailyDoc(date: string): DailyPanchangDoc {
  const coords = referenceCoords();
  const panchang = calculateDailyPanchang(date, coords.lat, coords.lon);
  return {
    date,
    generatedAt: new Date().toISOString(),
    source: REFERENCE_CITY,
    engineVersion: PANCHANG_ENGINE_VERSION,
    panchang,
  };
}

export async function generateDailyPanchang(date: string): Promise<DailyPanchangDoc> {
  const doc = buildDailyDoc(date);
  const ref = getFirestoreDb().collection(DAILY_COLLECTION).doc(date);
  try {
    // create() (not set()) fails if the doc already exists — the signal
    // that a concurrent caller (cron + a visitor hitting the same
    // missing date, or two visitors at once) won the race.
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
// triggering their own generation before either lands.
const dailyInFlight = new Map<string, Promise<DailyPanchangDoc | null>>();

/** Read-through: try the stored doc first, generate only if missing.
 * Unlike the FreeAstrologyAPI-backed version, ANY date (past, today, or
 * up to LOOKAHEAD_DAYS in the future) may be generated on demand — the
 * local engine has no per-call cost or budget to protect. Dates further
 * out than the lookahead window are rejected by the caller (route.ts),
 * not here. */
export function getOrGenerateDailyPanchang(date: string): Promise<DailyPanchangDoc | null> {
  const pending = dailyInFlight.get(date);
  if (pending) return pending;

  const promise = generateDailyPanchang(date).finally(() => {
    dailyInFlight.delete(date);
  });

  dailyInFlight.set(date, promise);
  return promise;
}

/** Batch-writes daily Panchang docs for every date in `dates` using
 * Firestore's batched writes (max 500 ops/batch — chunked at 400 to
 * leave headroom for the batch's own overhead). Uses `set()` with
 * `{merge:false}` semantics (a plain set) rather than `create()` — this
 * is the bulk BACKFILL path (bootstrap script / large catch-up), where
 * "overwrite if present" is the desired, safe behavior (idempotent:
 * recomputing the same date with the same engine version yields the
 * same content). Returns the dates actually written. */
export async function batchWriteDailyPanchang(dates: string[]): Promise<string[]> {
  const db = getFirestoreDb();
  const CHUNK = 400;
  for (let i = 0; i < dates.length; i += CHUNK) {
    const chunk = dates.slice(i, i + CHUNK);
    const batch = db.batch();
    for (const date of chunk) {
      const doc = buildDailyDoc(date);
      batch.set(db.collection(DAILY_COLLECTION).doc(date), doc);
    }
    await batch.commit();
  }
  return dates;
}

type CoverageMeta = { lastGeneratedDate: string };

async function getCoverageMeta(): Promise<CoverageMeta | null> {
  const snap = await getFirestoreDb().collection(META_DOC_PATH[0]).doc(META_DOC_PATH[1]).get();
  if (!snap.exists) return null;
  return snap.data() as CoverageMeta;
}

async function setCoverageMeta(meta: CoverageMeta): Promise<void> {
  await getFirestoreDb().collection(META_DOC_PATH[0]).doc(META_DOC_PATH[1]).set(meta);
}

/** Keeps the daily archive topped up through (today + LOOKAHEAD_DAYS),
 * generating at most MAX_CATCHUP_DAYS_PER_CALL missing days per call —
 * called by the daily cron. Self-healing: if a cron run is ever missed,
 * the next run(s) simply catch up a bit more each time rather than
 * trying (and risking a timeout) all at once. Returns the list of dates
 * it generated this call. */
export async function ensureDailyCoverage(referenceToday: string = getTodayIST()): Promise<string[]> {
  const targetDate = addDaysToDateString(referenceToday, LOOKAHEAD_DAYS);
  const meta = await getCoverageMeta();
  // Bootstrap fallback: if coverage metadata has never been written
  // (e.g. the one-off bootstrap script was skipped), start from today
  // rather than crawling the entire unknown past.
  let cursor = meta ? addDaysToDateString(meta.lastGeneratedDate, 1) : referenceToday;

  const toGenerate: string[] = [];
  while (cursor <= targetDate && toGenerate.length < MAX_CATCHUP_DAYS_PER_CALL) {
    toGenerate.push(cursor);
    cursor = addDaysToDateString(cursor, 1);
  }
  if (toGenerate.length === 0) return [];

  await batchWriteDailyPanchang(toGenerate);
  await setCoverageMeta({ lastGeneratedDate: toGenerate[toGenerate.length - 1] });
  return toGenerate;
}

// ---------------------------------------------------------------------
// Yearly festivals
// ---------------------------------------------------------------------

export async function getYearFestivals(year: number): Promise<YearFestivalsDoc | null> {
  const snap = await getFirestoreDb().collection(FESTIVALS_COLLECTION).doc(String(year)).get();
  if (!snap.exists) return null;
  return snap.data() as YearFestivalsDoc;
}

export async function generateYearFestivals(year: number): Promise<YearFestivalsDoc> {
  const coords = referenceCoords();
  const festivals = computeYearFestivals(year, coords.lat, coords.lon);
  const doc: YearFestivalsDoc = {
    year,
    generatedAt: new Date().toISOString(),
    engineVersion: PANCHANG_ENGINE_VERSION,
    festivals,
  };
  await getFirestoreDb().collection(FESTIVALS_COLLECTION).doc(String(year)).set(doc);
  return doc;
}

const festivalsInFlight = new Map<number, Promise<YearFestivalsDoc>>();

/** Read-through for a year's festival list; computing a full year is
 * the one genuinely expensive path here (~a few hundred internal
 * calculateDailyPanchang calls) — the in-flight map still prevents
 * concurrent duplicate work, same pattern as the daily store above. */
export function getOrGenerateYearFestivals(year: number): Promise<YearFestivalsDoc> {
  const pending = festivalsInFlight.get(year);
  if (pending) return pending;

  const promise = (async () => {
    const existing = await getYearFestivals(year);
    if (existing) return existing;
    return generateYearFestivals(year);
  })().finally(() => {
    festivalsInFlight.delete(year);
  });

  festivalsInFlight.set(year, promise);
  return promise;
}

/** Ensures both the current IST year's and next year's festival lists
 * exist — called by the daily cron. This is what makes "on Jan 1 the
 * Panchang/festival calendar updates for the new year" happen
 * automatically: every day this checks [currentYear, currentYear+1];
 * the moment the calendar rolls into a new year, currentYear+1 becomes
 * a year that's never been requested before and gets generated that
 * day — no special "only run this on Jan 1" cron entry needed. */
export async function ensureYearFestivalsCoverage(referenceToday: string = getTodayIST()): Promise<number[]> {
  const currentYear = Number(referenceToday.slice(0, 4));
  const generated: number[] = [];
  for (const year of [currentYear, currentYear + 1]) {
    const existing = await getYearFestivals(year);
    if (!existing) {
      await generateYearFestivals(year);
      generated.push(year);
    }
  }
  return generated;
}
