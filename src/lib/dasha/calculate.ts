// src/lib/dasha/calculate.ts
// Local, pure-math Vimshottari Dasha calculator — the replacement for
// FreeAstrologyAPI's /vimsottari/maha-dasas-and-antar-dasas endpoint.
// Takes the Moon's real sidereal longitude (from
// src/lib/astro-engine/ephemeris.ts's calculateChart) and the birth
// instant, and produces a VimshottariDashaResult-shaped object —
// {mahaDashaLord: {antarDashaLord: {start_time, end_time}}}, dates as
// "YYYY-MM-DD HH:mm:ss" strings — so the existing, already-tested
// src/lib/dasha/format.ts helpers keep working unchanged.
//
// The Vimshottari system: each of the 27 nakshatras has a fixed ruling
// planet, cycling through a fixed 9-planet sequence 3 times. Each ruling
// planet has a fixed maha-dasha length (summing to 120 years, the full
// Vimshottari cycle). The Moon's nakshatra at birth fixes the first
// (birth) maha-dasha lord; how far the Moon has progressed through that
// nakshatra fixes how much of that lord's period remains ("balance of
// dasha") from the birth moment forward. Antar-dasha (sub-period)
// lengths within a maha-dasha follow the same 9-lord sequence starting
// from the maha-dasha's own lord, each proportional to
// (mahaDashaYears * antarDashaLordYears) / 120.
//
// Sequence + per-nakshatra mapping verified via WebSearch against
// multiple independent sources (astrologeranil.com/nakshatra,
// jagannathhora.com/vimshottari-mahadasha-sequence-reference/,
// mpanchang.com/articles/astrology/vimshottari-dasha/) — all agree:
// Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury,
// repeating 3x across the 27 nakshatras in order (Ashwini/Magha/Mula ->
// Ketu, Bharani/Purva Phalguni/Purva Ashadha -> Venus, etc.), and the
// classical per-lord total periods: Ketu 7, Venus 20, Sun 6, Moon 10,
// Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17 years (sum = 120,
// Brihat Parashara Hora Shastra's standard Vimshottari cycle).
import type { VimshottariDashaResult } from "../astrology/types.ts";

/** The 9 Vimshottari dasha lords in their fixed cyclic order. */
export const DASHA_LORD_SEQUENCE = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
] as const;

export type DashaLord = (typeof DASHA_LORD_SEQUENCE)[number];

/** Each lord's fixed total Vimshottari period, in years. Sums to 120 —
 * the full classical Vimshottari cycle. */
export const DASHA_LORD_YEARS: Record<DashaLord, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
};

const TOTAL_CYCLE_YEARS = 120;

/** Minimum span of forward timeline to generate from birth, in years —
 * matches FreeAstrologyAPI's own vimshottari-dasha window (a full 120-
 * year cycle from birth), which src/lib/dasha/format.ts already assumes. */
const TIMELINE_YEARS = 120;

const NAKSHATRA_SPAN_DEGREES = 360 / 27; // 13°20'

/** Average Gregorian year length in days (365.25) — the conventional
 * astrological-software convention for converting a dasha-year count
 * into a millisecond duration; matches how FreeAstrologyAPI's own
 * dasha spans behave (leap years are not individually tracked). */
const DAYS_PER_YEAR = 365.25;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_YEAR = DAYS_PER_YEAR * MS_PER_DAY;

function yearsToMs(years: number): number {
  return years * MS_PER_YEAR;
}

/** Formats a Date as "YYYY-MM-DD HH:mm:ss" in UTC — matching
 * FreeAstrologyAPI's date string shape that format.ts's parseApiDate
 * already parses (it round-trips " " -> "T" through the JS Date
 * parser, which treats a missing zone suffix as UTC). */
function formatDashaDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  const mm = pad(date.getUTCMonth() + 1);
  const dd = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const mi = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

/** Index (0-8) of nakshatra `nakshatraNumber`'s (1-27) ruling lord in
 * DASHA_LORD_SEQUENCE — the fixed 9-lord cycle repeats 3x across the 27
 * nakshatras, so lord index = (nakshatraNumber - 1) % 9. */
function nakshatraLordIndex(nakshatraNumber: number): number {
  return (nakshatraNumber - 1) % 9;
}

/**
 * Computes the full Vimshottari Dasha timeline (maha-dashas + nested
 * antar-dashas) for a birth, from the Moon's real sidereal longitude.
 * Pure function, deterministic, no I/O.
 *
 * @param moonSiderealLongitude Moon's sidereal ecliptic longitude at
 *   birth, 0-360° (ChartData.planets.Moon.longitude).
 * @param birthUtc The birth instant (UTC).
 * @returns {mahaDashaLord: {antarDashaLord: {start_time, end_time}}},
 *   spanning from birth forward through at least TIMELINE_YEARS (120)
 *   years, matching VimshottariDashaResult's shape exactly.
 */
export function vimshottariDasha(
  moonSiderealLongitude: number,
  birthUtc: Date
): VimshottariDashaResult {
  const normalizedLongitude = ((moonSiderealLongitude % 360) + 360) % 360;

  const nakshatraIndex = Math.floor(normalizedLongitude / NAKSHATRA_SPAN_DEGREES); // 0-26
  const degreeIntoNakshatra = normalizedLongitude - nakshatraIndex * NAKSHATRA_SPAN_DEGREES;
  const fractionThroughNakshatra = degreeIntoNakshatra / NAKSHATRA_SPAN_DEGREES; // 0-1

  const startLordIndex = nakshatraLordIndex(nakshatraIndex + 1);
  const startLord = DASHA_LORD_SEQUENCE[startLordIndex];

  // Balance of the birth maha-dasha remaining from the birth moment
  // forward: the lord's full period * (1 - fraction already elapsed).
  const birthLordFullYears = DASHA_LORD_YEARS[startLord];
  const birthLordBalanceYears = birthLordFullYears * (1 - fractionThroughNakshatra);

  const result: VimshottariDashaResult = {};

  let cursorMs = birthUtc.getTime();
  let lordIndex = startLordIndex;
  let mahaDashaYears = birthLordBalanceYears;
  let totalYearsCovered = 0;
  let iterations = 0;
  // Safety valve against an infinite loop from an unforeseen bug — 27
  // full 120-year cycles is far beyond any reasonable lifespan.
  const MAX_ITERATIONS = 9 * 27;

  while (totalYearsCovered < TIMELINE_YEARS && iterations < MAX_ITERATIONS) {
    const lord = DASHA_LORD_SEQUENCE[lordIndex % 9];
    const mahaDashaStartMs = cursorMs;
    const mahaDashaEndMs = mahaDashaStartMs + yearsToMs(mahaDashaYears);

    result[lord] = buildAntarDashas(lord, mahaDashaYears, mahaDashaStartMs);

    cursorMs = mahaDashaEndMs;
    totalYearsCovered += mahaDashaYears;
    lordIndex += 1;
    // Every maha-dasha after the first (partial) one runs its lord's
    // full period.
    mahaDashaYears = DASHA_LORD_YEARS[DASHA_LORD_SEQUENCE[lordIndex % 9]];
    iterations += 1;
  }

  return result;
}

/** Builds the antar-dasha (sub-period) breakdown for one maha-dasha:
 * the same 9-lord sequence, starting from the maha-dasha's own lord,
 * each antar-dasha's duration = (mahaDashaYears * antarLordYears) / 120
 * — the standard proportional-subdivision formula. Antar-dashas are
 * laid out back-to-back starting at `mahaDashaStartMs`, so together
 * they exactly span the maha-dasha's own duration. */
function buildAntarDashas(
  mahaDashaLord: DashaLord,
  mahaDashaYears: number,
  mahaDashaStartMs: number
): Record<string, { start_time: string; end_time: string }> {
  const startIndex = DASHA_LORD_SEQUENCE.indexOf(mahaDashaLord);
  const antarMap: Record<string, { start_time: string; end_time: string }> = {};

  let cursorMs = mahaDashaStartMs;
  for (let offset = 0; offset < 9; offset++) {
    const antarLord = DASHA_LORD_SEQUENCE[(startIndex + offset) % 9];
    const antarDashaYears = (mahaDashaYears * DASHA_LORD_YEARS[antarLord]) / TOTAL_CYCLE_YEARS;
    const antarStartMs = cursorMs;
    const antarEndMs = antarStartMs + yearsToMs(antarDashaYears);

    antarMap[antarLord] = {
      start_time: formatDashaDate(new Date(antarStartMs)),
      end_time: formatDashaDate(new Date(antarEndMs)),
    };

    cursorMs = antarEndMs;
  }

  return antarMap;
}
