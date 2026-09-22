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
import { generateAllSignReadings, generateAllSignReadingsForPeriod } from "./openrouter.ts";
import { getCurrentWeekIST, getCurrentMonthIST } from "./date.ts";
import type { DailyHoroscopeDoc, WeeklyHoroscopeDoc, MonthlyHoroscopeDoc } from "./types.ts";

const COLLECTION = "dailyHoroscopes";
const WEEKLY_COLLECTION = "weeklyHoroscopes";
const MONTHLY_COLLECTION = "monthlyHoroscopes";

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
  } catch (err) {
    console.error("[horoscope] create failed for", date, err);
    const existing = await getDailyHoroscopes(date);
    if (existing) return existing;
    throw new Error(`Failed to create or read daily horoscope doc for ${date}`);
  }
}

// In-process, same-date in-flight promise cache: prevents concurrent
// build-time SSG renders (generateStaticParams returns 12 slugs, all
// prerendered concurrently) from each independently passing the
// getDailyHoroscopes null-check before any .create() lands and each
// triggering their own redundant full 12-sign OpenRouter generation.
// .create() alone only prevents duplicate Firestore *writes*, not
// duplicate *generations* within this race window.
const inFlight = new Map<string, Promise<DailyHoroscopeDoc>>();

export function getOrGenerateDailyHoroscopes(
  date: string
): Promise<DailyHoroscopeDoc> {
  const pending = inFlight.get(date);
  if (pending) return pending;

  const promise = (async () => {
    const existing = await getDailyHoroscopes(date);
    return existing ?? generateDailyHoroscopes(date);
  })().finally(() => {
    inFlight.delete(date);
  });

  inFlight.set(date, promise);
  return promise;
}

// --- Weekly --------------------------------------------------------

export async function getWeeklyHoroscopes(weekKey: string): Promise<WeeklyHoroscopeDoc | null> {
  const snap = await getFirestoreDb().collection(WEEKLY_COLLECTION).doc(weekKey).get();
  if (!snap.exists) return null;
  return snap.data() as WeeklyHoroscopeDoc;
}

export async function generateWeeklyHoroscopes(
  weekKey: string,
  startDate: string,
  endDate: string
): Promise<WeeklyHoroscopeDoc> {
  const periodLabel = `the week of ${startDate} to ${endDate}`;
  const signs = await generateAllSignReadingsForPeriod("week", periodLabel);
  const doc: WeeklyHoroscopeDoc = {
    weekKey,
    startDate,
    endDate,
    generatedAt: new Date().toISOString(),
    model: process.env.OPENROUTER_MODEL_FREE ?? "unknown",
    signs,
  };

  const ref = getFirestoreDb().collection(WEEKLY_COLLECTION).doc(weekKey);
  try {
    await ref.create(doc);
    return doc;
  } catch (err) {
    console.error("[horoscope] weekly create failed for", weekKey, err);
    const existing = await getWeeklyHoroscopes(weekKey);
    if (existing) return existing;
    throw new Error(`Failed to create or read weekly horoscope doc for ${weekKey}`);
  }
}

const weeklyInFlight = new Map<string, Promise<WeeklyHoroscopeDoc>>();

export function getOrGenerateWeeklyHoroscopes(now: Date = new Date()): Promise<WeeklyHoroscopeDoc> {
  const { weekKey, startDate, endDate } = getCurrentWeekIST(now);
  const pending = weeklyInFlight.get(weekKey);
  if (pending) return pending;

  const promise = (async () => {
    const existing = await getWeeklyHoroscopes(weekKey);
    return existing ?? generateWeeklyHoroscopes(weekKey, startDate, endDate);
  })().finally(() => {
    weeklyInFlight.delete(weekKey);
  });

  weeklyInFlight.set(weekKey, promise);
  return promise;
}

// --- Monthly -------------------------------------------------------

export async function getMonthlyHoroscopes(monthKey: string): Promise<MonthlyHoroscopeDoc | null> {
  const snap = await getFirestoreDb().collection(MONTHLY_COLLECTION).doc(monthKey).get();
  if (!snap.exists) return null;
  return snap.data() as MonthlyHoroscopeDoc;
}

export async function generateMonthlyHoroscopes(
  monthKey: string,
  monthLabel: string
): Promise<MonthlyHoroscopeDoc> {
  const signs = await generateAllSignReadingsForPeriod("month", monthLabel);
  const doc: MonthlyHoroscopeDoc = {
    monthKey,
    monthLabel,
    generatedAt: new Date().toISOString(),
    model: process.env.OPENROUTER_MODEL_FREE ?? "unknown",
    signs,
  };

  const ref = getFirestoreDb().collection(MONTHLY_COLLECTION).doc(monthKey);
  try {
    await ref.create(doc);
    return doc;
  } catch (err) {
    console.error("[horoscope] monthly create failed for", monthKey, err);
    const existing = await getMonthlyHoroscopes(monthKey);
    if (existing) return existing;
    throw new Error(`Failed to create or read monthly horoscope doc for ${monthKey}`);
  }
}

const monthlyInFlight = new Map<string, Promise<MonthlyHoroscopeDoc>>();

export function getOrGenerateMonthlyHoroscopes(now: Date = new Date()): Promise<MonthlyHoroscopeDoc> {
  const { monthKey, monthLabel } = getCurrentMonthIST(now);
  const pending = monthlyInFlight.get(monthKey);
  if (pending) return pending;

  const promise = (async () => {
    const existing = await getMonthlyHoroscopes(monthKey);
    return existing ?? generateMonthlyHoroscopes(monthKey, monthLabel);
  })().finally(() => {
    monthlyInFlight.delete(monthKey);
  });

  monthlyInFlight.set(monthKey, promise);
  return promise;
}
