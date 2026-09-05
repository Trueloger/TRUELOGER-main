// src/lib/panchang/calculate.ts
// Local, deterministic Panchang engine — the replacement for
// FreeAstrologyAPI's getPanchang() (src/lib/astrology/freeastrologyapi.ts).
// Pure computation on top of `astronomy-engine` (same library
// src/lib/astro-engine/ephemeris.ts already uses for birth charts) — no
// network calls, no per-day API budget, so this can run for an entire
// year ahead in one pass.
//
// Traditional convention used throughout (documented per-section below):
//  - Tithi/Nakshatra/Yoga/Karana are reckoned from SUNRISE of the given
//    calendar date (the classical starting point for a Panchang "day"),
//    using the SAME topocentric-sidereal-Lahiri Sun/Moon longitudes the
//    birth-chart engine uses (ephemeris.ts's sunMoonSiderealLongitudes) —
//    one consistent convention site-wide.
//  - Boundary times (when a tithi/nakshatra/yoga/karana starts/ends) are
//    found by bisection search on the real continuous longitude
//    difference, not approximated from a fixed daily rate — accurate to
//    well under a minute, far tighter than display needs.
//  - Rahu Kalam / Yamaganda / Gulika Kalam and Choghadiya use the
//    standard, widely-published weekday-indexed segment tables (the same
//    tables essentially every Panchang almanac/software uses — e.g.
//    DrikPanchang's published Rahu Kalam / Yamaganda / Gulika Kalam /
//    Choghadiya weekday tables); nothing here is invented.
import * as Astronomy from "astronomy-engine";
import { sunMoonSiderealLongitudes } from "../astro-engine/ephemeris.ts";
import { deriveNakshatraPada } from "../astrology/derive.ts";

const REFERENCE_ALTITUDE_METERS = 0;

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type TimeWindow = { startsAt: string; endsAt: string }; // ISO instants

export type TithiInfo = {
  number: number; // 1-30 (1-15 shukla, 16-30 krishna)
  displayNumber: number; // 1-15 within its paksha (15 = Purnima/Amavasya)
  name: string;
  paksha: "shukla" | "krishna";
  startsAt: string;
  endsAt: string;
};

export type NakshatraInfo = {
  number: number; // 1-27
  name: string;
  pada: number; // 1-4, AT sunrise
  startsAt: string;
  endsAt: string;
};

export type YogaInfo = {
  number: number; // 1-27
  name: string;
  startsAt: string;
  endsAt: string;
};

export type KaranaInfo = {
  index: number; // 1-60, running count within the lunar month
  name: string;
  startsAt: string;
  endsAt: string;
};

export type VaraInfo = {
  number: number; // 0-6, Sunday = 0
  name: string;
  lord: string;
};

export type HoraEntry = TimeWindow & { lord: string };
export type ChoghadiyaEntry = TimeWindow & { name: string; nature: "good" | "neutral" | "bad" };

export type DailyPanchang = {
  date: string; // YYYY-MM-DD, IST calendar date this Panchang is FOR
  sunrise: string; // ISO instant
  sunset: string; // ISO instant
  nextSunrise: string; // ISO instant — end of this Panchang "day"
  vara: VaraInfo;
  tithi: TithiInfo;
  nakshatra: NakshatraInfo;
  yoga: YogaInfo;
  karana: KaranaInfo;
  rahuKalam: TimeWindow;
  yamaGandam: TimeWindow;
  gulikaKalam: TimeWindow;
  hora: HoraEntry[]; // 24 entries, sunrise -> nextSunrise
  choghadiya: ChoghadiyaEntry[]; // 16 entries, 8 day + 8 night
  /** Sidereal solar longitude at sunrise — feeds masa/festival
   * derivation (src/lib/panchang/festivals.ts) without recomputing it. */
  sunSiderealAtSunrise: number;
  /** Sidereal lunar longitude at sunrise — same reason. */
  moonSiderealAtSunrise: number;
};

// ---------------------------------------------------------------------
// Static reference tables
// ---------------------------------------------------------------------

const VARA_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const VARA_LORDS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

const TITHI_NAMES = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami",
  "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi",
];

const YOGA_NAMES = [
  "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma",
  "Dhriti", "Shoola", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra",
  "Siddhi", "Vyatipata", "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha",
  "Shukla", "Brahma", "Indra", "Vaidhriti",
];

// Karana sequence: 4 "fixed" karanas occur once per lunar month (index 1
// and 58-60), the 7 "movable" karanas repeat 8x to fill the remaining 56
// half-tithis (index 2-57) — the standard classical sequence.
const MOVABLE_KARANAS = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"];
const FIXED_KARANAS = ["Kimstughna", "Shakuni", "Chatushpada", "Naga"];

/** Karana name for a running index 1-60 within the current lunar month
 * (1 = first half of Shukla Pratipada). Index 1 = Kimstughna (fixed);
 * indices 2-57 cycle the 7 movable karanas 8 times; indices 58-60 =
 * Shakuni, Chatushpada, Naga (fixed) — the last three half-tithis of
 * Krishna Chaturdashi/Amavasya. */
function karanaNameForIndex(index: number): string {
  if (index === 1) return FIXED_KARANAS[0];
  if (index >= 58) return FIXED_KARANAS[index - 57]; // 58->1, 59->2, 60->3
  return MOVABLE_KARANAS[(index - 2) % 7];
}

// Standard published weekday tables (Sunday=0 .. Saturday=6), each value
// is a 1-8 segment number within the sunrise->sunset daytime span split
// into 8 equal parts.
const RAHU_KALAM_SEGMENT = [8, 2, 7, 5, 6, 4, 3];
const YAMA_GANDAM_SEGMENT = [5, 4, 3, 2, 1, 7, 6];
const GULIKA_KALAM_SEGMENT = [7, 6, 5, 4, 3, 2, 1];

// Choghadiya: fixed 7-name cycle (8th slot repeats the 1st), day and
// night each have their own published weekday-indexed starting name.
const CHOGHADIYA_CYCLE = ["Udveg", "Chal", "Labh", "Amrit", "Kaal", "Shubh", "Rog"] as const;
const CHOGHADIYA_NATURE: Record<(typeof CHOGHADIYA_CYCLE)[number], "good" | "neutral" | "bad"> = {
  Udveg: "bad", Chal: "neutral", Labh: "good", Amrit: "good", Kaal: "bad", Shubh: "good", Rog: "bad",
};
const CHOGHADIYA_DAY_START = ["Udveg", "Amrit", "Rog", "Labh", "Shubh", "Chal", "Kaal"];
const CHOGHADIYA_NIGHT_START = ["Shubh", "Chal", "Kaal", "Udveg", "Amrit", "Rog", "Labh"];

// ---------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------

function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function toIso(date: Date): string {
  return date.toISOString();
}

/** Index of `value` (degrees, any range) within a repeating `span`-wide
 * division of the circle, starting at 0°. */
function spanIndex(value: number, span: number): number {
  return Math.floor(normalizeDegrees(value) / span);
}

/** Finds the next instant at/after `from` where `spanIndex(fn(t), span)`
 * differs from its value at `from` — i.e. the end of the current
 * tithi/nakshatra/yoga/karana. `fn` must be a real, continuous
 * (non-rounded) longitude function; bisection converges to sub-second
 * precision well inside 40 iterations regardless of the body's speed. */
function findNextBoundary(fn: (d: Date) => number, span: number, from: Date): Date {
  const startIdx = spanIndex(fn(from), span);
  let lo = from.getTime();
  let hi = lo;
  const STEP_MS = 3 * 3600 * 1000; // 3h — safely smaller than the shortest span's real duration (karana ~6h)
  let guard = 0;
  do {
    hi += STEP_MS;
    guard++;
  } while (spanIndex(fn(new Date(hi)), span) === startIdx && guard < 400); // 400*3h = 50 days, generous ceiling

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (spanIndex(fn(new Date(mid)), span) === startIdx) lo = mid;
    else hi = mid;
  }
  return new Date(hi);
}

/** Mirror of findNextBoundary, searching backward for when the CURRENT
 * span index began. */
function findPrevBoundary(fn: (d: Date) => number, span: number, from: Date): Date {
  const startIdx = spanIndex(fn(from), span);
  let hi = from.getTime();
  let lo = hi;
  const STEP_MS = 3 * 3600 * 1000;
  let guard = 0;
  do {
    lo -= STEP_MS;
    guard++;
  } while (spanIndex(fn(new Date(lo)), span) === startIdx && guard < 400);

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (spanIndex(fn(new Date(mid)), span) === startIdx) hi = mid;
    else lo = mid;
  }
  return new Date(hi);
}

// ---------------------------------------------------------------------
// Longitude functions (closures over lat/lon) fed to the boundary search
// ---------------------------------------------------------------------

function makeMoonSiderealFn(latitude: number, longitude: number) {
  return (d: Date) => sunMoonSiderealLongitudes(Astronomy.MakeTime(d), latitude, longitude).moon;
}

function makeTithiDiffFn(latitude: number, longitude: number) {
  return (d: Date) => {
    const { sun, moon } = sunMoonSiderealLongitudes(Astronomy.MakeTime(d), latitude, longitude);
    return normalizeDegrees(moon - sun);
  };
}

function makeYogaSumFn(latitude: number, longitude: number) {
  return (d: Date) => {
    const { sun, moon } = sunMoonSiderealLongitudes(Astronomy.MakeTime(d), latitude, longitude);
    return normalizeDegrees(sun + moon);
  };
}

// ---------------------------------------------------------------------
// Sunrise / sunset
// ---------------------------------------------------------------------

/** Sunrise/sunset bracketing a given UTC instant `nearUtc`, at
 * (lat, lon). `direction` search uses astronomy-engine's SearchRiseSet,
 * the library's own recommended API for rise/set events (see its docs —
 * NOT a manual altitude-crossing search, which the library's own README
 * warns is less robust near solstices/poles). */
function findSunEvent(
  latitude: number,
  longitude: number,
  direction: 1 | -1,
  nearUtc: Date,
  limitDays = 2
): Date {
  const observer = new Astronomy.Observer(latitude, longitude, REFERENCE_ALTITUDE_METERS);
  const result = Astronomy.SearchRiseSet(
    Astronomy.Body.Sun,
    observer,
    direction,
    Astronomy.MakeTime(nearUtc),
    limitDays
  );
  if (!result) {
    throw new Error(
      `findSunEvent: no sun ${direction === 1 ? "rise" : "set"} found within ${limitDays} days of ${nearUtc.toISOString()} at (${latitude}, ${longitude})`
    );
  }
  return result.date;
}

// ---------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------

/**
 * Full Panchang for one IST calendar date, at (latitude, longitude).
 * `date` is "YYYY-MM-DD" and is interpreted as an IST calendar date
 * (matches every other daily feature on this site — see
 * src/lib/horoscope/date.ts's getTodayIST convention).
 */
export function calculateDailyPanchang(date: string, latitude: number, longitude: number): DailyPanchang {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`calculateDailyPanchang: invalid date "${date}"`);
  const [, y, m, d] = match;

  // IST midnight of `date`, expressed as its UTC instant (IST = UTC+5:30,
  // flat/modern — Panchang is a current-era feature, unlike birth charts
  // which can reach back to 1900; no historical-offset table needed
  // here).
  const istMidnightUtcMs = Date.UTC(Number(y), Number(m) - 1, Number(d)) - 5.5 * 3600 * 1000;
  const istMidnight = new Date(istMidnightUtcMs);

  const sunrise = findSunEvent(latitude, longitude, 1, istMidnight);
  const sunset = findSunEvent(latitude, longitude, -1, sunrise);
  const nextSunrise = findSunEvent(latitude, longitude, 1, new Date(sunrise.getTime() + 20 * 3600 * 1000));

  const { sun: sunSidereal, moon: moonSidereal } = sunMoonSiderealLongitudes(
    Astronomy.MakeTime(sunrise),
    latitude,
    longitude
  );

  // --- Vara (weekday), reckoned from sunrise ---
  const varaNumber = sunrise.getUTCDay(); // fine: date arithmetic below uses IST-anchored sunrise instant's calendar weekday is only used as an index, not displayed as UTC
  // Use the IST calendar date's weekday (not the UTC one — they can
  // differ by a day near midnight): derive weekday from the requested
  // `date` string directly, since that's the IST calendar date this
  // Panchang is FOR.
  const istWeekday = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))).getUTCDay();
  const vara: VaraInfo = { number: istWeekday, name: VARA_NAMES[istWeekday], lord: VARA_LORDS[istWeekday] };
  void varaNumber; // computed for potential cross-check only

  // --- Tithi ---
  const tithiDiffFn = makeTithiDiffFn(latitude, longitude);
  const diffAtSunrise = tithiDiffFn(sunrise);
  const tithiNumber = spanIndex(diffAtSunrise, 12) + 1; // 1-30
  const tithiStart = findPrevBoundary(tithiDiffFn, 12, sunrise);
  const tithiEnd = findNextBoundary(tithiDiffFn, 12, sunrise);
  const paksha: "shukla" | "krishna" = tithiNumber <= 15 ? "shukla" : "krishna";
  const displayNumber = tithiNumber <= 15 ? tithiNumber : tithiNumber - 15;
  const tithiName =
    displayNumber === 15 ? (paksha === "shukla" ? "Purnima" : "Amavasya") : TITHI_NAMES[displayNumber - 1];
  const tithi: TithiInfo = {
    number: tithiNumber,
    displayNumber,
    name: tithiName,
    paksha,
    startsAt: toIso(tithiStart),
    endsAt: toIso(tithiEnd),
  };

  // --- Nakshatra ---
  const moonFn = makeMoonSiderealFn(latitude, longitude);
  const nakshatraSpan = 360 / 27;
  const nakStart = findPrevBoundary(moonFn, nakshatraSpan, sunrise);
  const nakEnd = findNextBoundary(moonFn, nakshatraSpan, sunrise);
  const nakDerived = deriveNakshatraPada(moonSidereal);
  const nakshatra: NakshatraInfo = {
    number: nakDerived.nakshatraNumber,
    name: nakDerived.nakshatraName,
    pada: nakDerived.pada,
    startsAt: toIso(nakStart),
    endsAt: toIso(nakEnd),
  };

  // --- Yoga ---
  const yogaFn = makeYogaSumFn(latitude, longitude);
  const yogaSpan = 360 / 27;
  const yogaIndex = spanIndex(yogaFn(sunrise), yogaSpan); // 0-26
  const yogaStart = findPrevBoundary(yogaFn, yogaSpan, sunrise);
  const yogaEnd = findNextBoundary(yogaFn, yogaSpan, sunrise);
  const yoga: YogaInfo = {
    number: yogaIndex + 1,
    name: YOGA_NAMES[yogaIndex],
    startsAt: toIso(yogaStart),
    endsAt: toIso(yogaEnd),
  };

  // --- Karana (half-tithi) ---
  const karanaSpan = 6;
  const karanaRunningIndex = spanIndex(diffAtSunrise, karanaSpan) + 1; // 1-60 within THIS lunar month's 60 half-tithis
  // karanaNameForIndex expects the index within the current lunar month
  // (1-60); (tithiNumber-1)*2 + (1 or 2) gives exactly that from the
  // half-tithi position within the current tithi.
  const halfWithinTithi = spanIndex(diffAtSunrise, karanaSpan) - spanIndex(diffAtSunrise, 12) * 2; // 0 or 1
  const karanaMonthIndex = (tithiNumber - 1) * 2 + halfWithinTithi + 1; // 1-60
  const karanaFn = tithiDiffFn;
  const karanaStart = findPrevBoundary(karanaFn, karanaSpan, sunrise);
  const karanaEnd = findNextBoundary(karanaFn, karanaSpan, sunrise);
  const karana: KaranaInfo = {
    index: karanaMonthIndex,
    name: karanaNameForIndex(karanaMonthIndex),
    startsAt: toIso(karanaStart),
    endsAt: toIso(karanaEnd),
  };
  void karanaRunningIndex;

  // --- Rahu Kalam / Yamaganda / Gulika Kalam (daytime, 8 equal segments) ---
  const dayLengthMs = sunset.getTime() - sunrise.getTime();
  const daySegmentMs = dayLengthMs / 8;
  function segmentWindow(segment1to8: number): TimeWindow {
    const start = sunrise.getTime() + (segment1to8 - 1) * daySegmentMs;
    return { startsAt: toIso(new Date(start)), endsAt: toIso(new Date(start + daySegmentMs)) };
  }
  const rahuKalam = segmentWindow(RAHU_KALAM_SEGMENT[istWeekday]);
  const yamaGandam = segmentWindow(YAMA_GANDAM_SEGMENT[istWeekday]);
  const gulikaKalam = segmentWindow(GULIKA_KALAM_SEGMENT[istWeekday]);

  // --- Hora: 24 equal parts of sunrise -> nextSunrise, starting with
  // the weekday's own lord, cycling the fixed Chaldean order ---
  const CHALDEAN_ORDER = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];
  const horaSpanMs = (nextSunrise.getTime() - sunrise.getTime()) / 24;
  const startLordIndex = CHALDEAN_ORDER.indexOf(VARA_LORDS[istWeekday]);
  const hora: HoraEntry[] = Array.from({ length: 24 }, (_, i) => {
    const start = sunrise.getTime() + i * horaSpanMs;
    return {
      lord: CHALDEAN_ORDER[(startLordIndex + i) % 7],
      startsAt: toIso(new Date(start)),
      endsAt: toIso(new Date(start + horaSpanMs)),
    };
  });

  // --- Choghadiya: 8 day segments (sunrise->sunset) + 8 night segments
  // (sunset->nextSunrise), each a fixed 7-name cycle from a
  // weekday-indexed starting name (8th slot repeats the 1st) ---
  const nightLengthMs = nextSunrise.getTime() - sunset.getTime();
  const nightSegmentMs = nightLengthMs / 8;
  function choghadiyaCycle(startName: string, base: Date, segMs: number): ChoghadiyaEntry[] {
    const startIdx = CHOGHADIYA_CYCLE.indexOf(startName as (typeof CHOGHADIYA_CYCLE)[number]);
    return Array.from({ length: 8 }, (_, i) => {
      const name = CHOGHADIYA_CYCLE[(startIdx + i) % 7];
      const start = base.getTime() + i * segMs;
      return {
        name,
        nature: CHOGHADIYA_NATURE[name],
        startsAt: toIso(new Date(start)),
        endsAt: toIso(new Date(start + segMs)),
      };
    });
  }
  const choghadiya: ChoghadiyaEntry[] = [
    ...choghadiyaCycle(CHOGHADIYA_DAY_START[istWeekday], sunrise, daySegmentMs),
    ...choghadiyaCycle(CHOGHADIYA_NIGHT_START[istWeekday], sunset, nightSegmentMs),
  ];

  return {
    date,
    sunrise: toIso(sunrise),
    sunset: toIso(sunset),
    nextSunrise: toIso(nextSunrise),
    vara,
    tithi,
    nakshatra,
    yoga,
    karana,
    rahuKalam,
    yamaGandam,
    gulikaKalam,
    hora,
    choghadiya,
    sunSiderealAtSunrise: sunSidereal,
    moonSiderealAtSunrise: moonSidereal,
  };
}
