// src/lib/dasha/format.ts
// Pure helpers over a real VimshottariDashaResult (see
// src/lib/astrology/freeastrologyapi.ts's getVimshottariDasha) — no
// network calls here, nothing invented. VimshottariDashaResult is keyed
// {mahaDashaLord: {antarDashaLord: {start_time, end_time}}} with NO
// separate field for the maha-dasha's own overall start/end — every
// function below that needs a maha-dasha's overall span derives it as
// [min start_time, max end_time] across that lord's antar-dasha entries.
import type { AntarDashaMap, DashaPeriod, VimshottariDashaResult } from "../astrology/types.ts";

/** Parses the API's "YYYY-MM-DD HH:mm:ss[.ffffff]" date strings. A plain
 * `Date` round-trip via the "T" separator — verified by manual check
 * (node -e) that both a fractional-seconds value
 * ("1984-05-25 03:34:05.385290") and a whole-second value parse to a
 * valid, non-NaN Date (the fractional part beyond milliseconds is
 * silently truncated by the JS Date parser, which is fine here — every
 * comparison in this module only needs consistent ordering, not
 * sub-millisecond precision). */
export function parseApiDate(s: string): Date {
  return new Date(s.replace(" ", "T"));
}

export type MahaDashaWithLord = { lord: string; period: DashaPeriod };
export type AntarDashaWithLord = { lord: string; period: DashaPeriod };

export type MahaDashaTimelineEntry = { lord: string; start_time: string; end_time: string };

/** A maha-dasha lord's overall span, derived as [min start_time, max
 * end_time] across all of that lord's antar-dasha entries —
 * VimshottariDashaResult has no separate outer start/end field for the
 * maha-dasha itself (see module doc comment). Throws if `antarMap` has
 * no entries (a real API response never returns an empty antar-dasha
 * map for a maha-dasha lord; an empty map here would mean a bug
 * upstream, not a valid "no data" case to silently paper over). */
export function mahaDashaSpan(antarMap: AntarDashaMap): DashaPeriod {
  const periods = Object.values(antarMap);
  if (periods.length === 0) {
    throw new Error("mahaDashaSpan: antarMap has no antar-dasha entries");
  }

  let start = periods[0].start_time;
  let end = periods[0].end_time;
  let startMs = parseApiDate(start).getTime();
  let endMs = parseApiDate(end).getTime();

  for (const period of periods) {
    const s = parseApiDate(period.start_time).getTime();
    const e = parseApiDate(period.end_time).getTime();
    if (s < startMs) {
      startMs = s;
      start = period.start_time;
    }
    if (e > endMs) {
      endMs = e;
      end = period.end_time;
    }
  }

  return { start_time: start, end_time: end };
}

/** The full maha-dasha sequence as a flat, chronologically-sorted array
 * — object key order from a JSON API response isn't guaranteed, so this
 * always sorts by `start_time` rather than trusting
 * `Object.entries()` order. */
export function mahaDashaTimeline(dasha: VimshottariDashaResult): MahaDashaTimelineEntry[] {
  return Object.entries(dasha)
    .map(([lord, antarMap]) => {
      const span = mahaDashaSpan(antarMap);
      return { lord, start_time: span.start_time, end_time: span.end_time };
    })
    .sort((a, b) => parseApiDate(a.start_time).getTime() - parseApiDate(b.start_time).getTime());
}

/** Finds which maha-dasha lord's overall span contains `now` (inclusive
 * of both endpoints). Returns `null` if none does — a real birth chart's
 * dasha timeline should always cover "now" for a living person born
 * within the calculated range, but a null here is handled by the caller
 * rather than assumed impossible. */
export function findCurrentMahaDasha(
  dasha: VimshottariDashaResult,
  now: Date = new Date()
): MahaDashaWithLord | null {
  const nowMs = now.getTime();
  for (const [lord, antarMap] of Object.entries(dasha)) {
    const span = mahaDashaSpan(antarMap);
    const startMs = parseApiDate(span.start_time).getTime();
    const endMs = parseApiDate(span.end_time).getTime();
    if (nowMs >= startMs && nowMs <= endMs) {
      return { lord, period: span };
    }
  }
  return null;
}

/** Finds which antar-dasha lord's period (within one maha-dasha's antar
 * map) contains `now` (inclusive of both endpoints). Returns `null` if
 * none does. */
export function findCurrentAntarDasha(
  antarMap: AntarDashaMap,
  now: Date = new Date()
): AntarDashaWithLord | null {
  const nowMs = now.getTime();
  for (const [lord, period] of Object.entries(antarMap)) {
    const startMs = parseApiDate(period.start_time).getTime();
    const endMs = parseApiDate(period.end_time).getTime();
    if (nowMs >= startMs && nowMs <= endMs) {
      return { lord, period };
    }
  }
  return null;
}
