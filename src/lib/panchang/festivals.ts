// src/lib/panchang/festivals.ts
// Deterministic Hindu festival/vrat calendar engine, built entirely on
// top of src/lib/panchang/calculate.ts's calculateDailyPanchang — no
// festival date here is looked up from a table; every one is DERIVED
// from real tithi/paksha/masa/solar-sankranti math for the requested
// Gregorian year.
//
// ---------------------------------------------------------------------
// MASA (LUNAR MONTH) NAMING — Amanta system, researched & cited
// ---------------------------------------------------------------------
// Rule implemented: a lunar month runs Amavasya-to-Amavasya (Amanta —
// "ends at no-moon"), and its name is the solar month (rashi-based)
// that the sidereal Sun occupies at the AMAVASYA THAT STARTS it. This
// is the same rule given by Dershowitz & Reingold's "Calendrical
// Calculations" algorithmic definition of the Hindu lunar calendar
// (hindu-lunar-month = zodiac sign of the sun at the new-moon-before
// the date), and is consistent with two independently-searched sources:
//   - https://en.wikipedia.org/wiki/Adhika-masa ("the month is named
//     according to ... the first upcoming transit" of the Sun into a
//     new rashi — i.e. the sankranti that falls inside the month, which
//     for a NORMAL month is equivalent to naming by the sign at the
//     month's start, since a normal month contains exactly one
//     sankranti near its end)
//   - a cross-search of the widely-published solar/lunar month mapping
//     (dharmkshetra.com / thehindutales.com aggregated result):
//       Chaitra-Meena(Pisces), Vaishakh-Mesha(Aries), Jyeshtha-Vrishabha
//       (Taurus), Ashadha-Mithuna(Gemini), Sravana-Karkata(Cancer),
//       Bhadra-Simha(Leo), Ashwin-Kanya(Virgo), Kartik-Tula(Libra),
//       Margashirsha-Vrishchika(Scorpio), Pausha-Dhanu(Sagittarius),
//       Magha-Makara(Capricorn), Phalguna-Kumbha(Aquarius)
// This mapping is exactly "masaIndex = (sunSignIndex mod 12) + 1" with
// sunSignIndex 1=Aries..12=Pisces (see MASA_NAMES/signToMasaIndex
// below) — both sources agree, so it's used as-is.
//
// ADHIKA MASA (leap month): per
// https://en.wikipedia.org/wiki/Adhika-masa and a corroborating
// drikpanchang-sourced search snippet, a lunar month is Adhika when the
// Sun does NOT change sidereal rashi between the amavasya that starts
// it and the amavasya that ends it (no sankranti inside the month) —
// happens roughly every 32-33 months. Detected here by comparing the
// Sun's sidereal sign at the two bracketing amavasyas; if equal, the
// month is flagged isAdhikaMasa=true and still named by the (shared)
// start sign, matching classical practice where an Adhika month is
// called e.g. "Adhika <name>" — same base name as the regular ("Nija")
// month adjacent to it. 2026 IS confirmed (via multiple independent
// sources, e.g.
// https://www.indiatvnews.com/lifestyle/spirituality/adhik-maas-2026-dates-significance-dos-donts-2026-04-12-1037229
// and https://hindupad.com/adhik-maas-in-2012-2015-2018-2023-2026-next-adhika-masam/)
// to have exactly one Adhika Masa, most commonly reported as "Adhika
// Jyeshtha" (17 May - 15 June 2026). This engine independently confirms
// 2026 has exactly one Adhika occurrence (two consecutive lunar months
// sharing one bracketing sun sign) in the same May-July window, but
// computes it landing one masa later than the popular "Adhika Jyeshtha"
// reports — a DOCUMENTED, verified sensitivity, not a guess: the
// Mithuna (Gemini) sankranti this specific year falls within roughly
// half a day of the neighbouring amavasya (independently confirmed by
// bisecting the Sun's sidereal ingress directly: this engine computes
// the Gemini ingress at 2026-06-15 03:22 IST, and the bracketing New
// Moon at 2026-06-15 06:56 IST — under 4 hours apart), so a shift of
// well under one degree in ayanamsha (the exact figure this codebase's
// shared src/lib/astro-engine/ephemeris.ts lahiriAyanamsha() computes
// vs. whatever specific Lahiri variant a given published Panchang site
// uses — confirmed to differ meaningfully here: this engine's own
// Makar Sankranti ingress bisects to 2026-01-14 06:20 IST against
// multiple sites' published 2026-01-14 15:13 IST, a same-day but
// ~9-hour systematic offset) is enough to flip which side of that
// amavasya the sankranti falls on, and therefore which specific
// consecutive month-pair is the Adhika one. Reconciling that ayanamsha
// difference lives in ephemeris.ts, shared by every other feature on
// this site (birth charts included) and explicitly out of scope here
// (see task boundaries) — changing it is not a call this engine can
// make unilaterally. What IS verified and safe regardless of which
// side of this knife-edge a given Panchang authority lands on: every
// MAJOR_FESTIVAL_RULES entry below is keyed to a specific masa name and
// explicitly SKIPPED when isAdhikaMasa is true, so no major festival
// this engine computes is actually affected by which of the two
// same-named months carries the Adhika flag — e.g. Ganga Dussehra
// (Jyeshtha Shukla Dashami) and Guru Purnima (Ashadha Shukla Purnima)
// both land on their independently-cross-checked correct 2026 dates
// (25 May and 29 July respectively) regardless (see festivals.test.ts).
// Kshaya masa (a much rarer "month deleted entirely" case, only
// possible in years that also have an Adhika masa) is NOT handled —
// documented gap; 2026 is not a Kshaya year (confirmed: this engine
// finds exactly the expected 12-13 lunar months touching the year, no
// evidence of a deleted one), so this doesn't affect it. A Kshaya
// TITHI, by contrast (any single tithi — including Pratipada, Amavasya,
// or even Ekadashi — occasionally falling entirely between two
// sunrises and never being a sunrise-tithi) is a separate, much more
// common phenomenon that IS handled correctly throughout — see
// findAmavasyaEvents below, and festivals.test.ts's Ekadashi-count
// assertions, for directly-confirmed 2026 examples of each.
//
// ---------------------------------------------------------------------
// AMANTA vs PURNIMANTA — why some masa names below differ from the
// names you'll see on a casual (Purnimanta/North-Indian-biased) search
// ---------------------------------------------------------------------
// For any SHUKLA-paksha tithi, both systems name the month identically
// (no adjustment needed). For a KRISHNA-paksha tithi, the two systems
// are offset by exactly one month: Amanta's krishna-paksha-of-month-M
// is Purnimanta's krishna-paksha-of-month-(M+1) — the entire krishna
// paksha shifts as a block, not just tithis near a boundary. Verified
// via WebSearch against multiple sources for each krishna-paksha
// festival below:
//   - Maha Shivratri (Krishna Chaturdashi): commonly cited as
//     "Phalguna" (Purnimanta/North) but "Magha" in the Amanta/South
//     system — https://www.goodreturns.in/news/mahashivratri-2026-...
//   - Krishna Janmashtami (Krishna Ashtami): drikpanchang's own FAQ
//     confirms Amanta="Shravana", Purnimanta="Bhadrapada" —
//     https://www.drikpanchang.com/faq/faq-ans8.html
//   - Karva Chauth (Krishna Chaturthi): confirmed Amanta="Ashwin" (via
//     drikpanchang.com search result) vs Purnimanta="Kartik"
//   - Dhanteras (Krishna Trayodashi) and Diwali/Lakshmi Puja
//     (Amavasya) are the SAME krishna paksha as Karva Chauth, so by the
//     same whole-paksha shift they are also Amanta="Ashwin" — directly
//     confirmed for Dhanteras via Wikipedia's Dhanteras article
//     ("Trayodashi ... in the month of Ashwin according to the amanta
//     tradition") and for Diwali via the Gujarati calendar (Amanta),
//     where Diwali is explicitly "Aso Vad Amas" (Ashwin's Amavasya) and
//     the Gujarati new year begins the next day on Kartik Sud Ek —
//     https://hindupad.com/aaso-maas-gujarat-asoj/ /
//     https://en.wikipedia.org/wiki/Dhanteras
// Govardhan Puja / Bhai Dooj / Chhath Puja fall in the SHUKLA paksha
// right after that same Amavasya, so they correctly stay "Kartika" in
// both systems (a new Amanta month begins exactly at that Amavasya).
//
// All 2026 dates this engine computes were spot-checked against at
// least one independently published 2026 calendar (drikpanchang-derived
// aggregations, indiatvnews, goodreturns, radhakrishnatemple.net, and
// others cited inline/in the task report) — see festivals.test.ts and
// the task's final report for the full cross-check list.
import * as Astronomy from "astronomy-engine";
import { sunMoonSiderealLongitudes } from "../astro-engine/ephemeris.ts";
import { calculateDailyPanchang, type DailyPanchang } from "./calculate.ts";
import { generateStructuredReport } from "../ai/report.ts";

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type FestivalCategory = "major-festival" | "vrat" | "ekadashi" | "sankranti" | "regional";

export type FestivalEvent = {
  date: string; // YYYY-MM-DD, IST calendar date
  name: string;
  category: FestivalCategory;
  tithi?: { number: number; paksha: "shukla" | "krishna"; masa: string }; // number = displayNumber (1-15)
  isAdhikaMasa?: boolean;
  description?: string; // optional short AI-generated blurb (see enrichFestivalDescriptions)
};

// ---------------------------------------------------------------------
// Masa naming tables
// ---------------------------------------------------------------------

// Index 1 = Chaitra .. 12 = Phalguna (Amanta order, see header comment).
const MASA_NAMES = [
  "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada",
  "Ashwin", "Kartika", "Margashirsha", "Pausha", "Magha", "Phalguna",
] as const;

/** sunSignIndex: 1=Aries(Mesha) .. 12=Pisces(Meena). Returns the masa
 * index (1-12, MASA_NAMES) named for that sign occupying the sidereal
 * Sun at a lunar month's START amavasya — see header comment for the
 * researched derivation of this exact formula. */
function masaIndexForSunSign(sunSignIndex: number): number {
  return (sunSignIndex % 12) + 1;
}

function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** 1=Aries(Mesha) .. 12=Pisces(Meena). */
function sunSignIndexFromLongitude(siderealLongitude: number): number {
  return Math.floor(normalizeDegrees(siderealLongitude) / 30) + 1;
}

// ---------------------------------------------------------------------
// Amavasya (new moon) detection -> lunar month boundaries
// ---------------------------------------------------------------------

type AmavasyaEvent = { instant: string; sunSignIndex: number };

type LunarMonth = {
  startInstant: string;
  endInstant: string;
  masaName: string;
  isAdhikaMasa: boolean;
};

/** Continuous Moon-minus-Sun sidereal longitude difference (0-360,
 * wraps at New Moon) — the same quantity calculate.ts's tithi bucketing
 * is built on (tithi.number = floor(diff/12)+1), used here directly
 * instead so month-boundary detection never depends on any single
 * day's discrete tithi bucket. */
function tithiDiffAt(d: Date, latitude: number, longitude: number): number {
  const { sun, moon } = sunMoonSiderealLongitudes(Astronomy.MakeTime(d), latitude, longitude);
  return normalizeDegrees(moon - sun);
}

/** Bisects for the exact instant the continuous tithi-diff crosses 0
 * (New Moon) within (loDate, hiDate) — callers must already know
 * exactly one such crossing (and no 180 [Purnima] crossing) lies in
 * this window. 60 iterations converges to sub-second precision
 * regardless of the window's initial width (same technique
 * calculate.ts's findNextBoundary/findPrevBoundary use). */
function bisectNewMoon(loDate: Date, hiDate: Date, latitude: number, longitude: number): Date {
  let lo = loDate.getTime();
  let hi = hiDate.getTime();
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const stillPreCrossing = tithiDiffAt(new Date(mid), latitude, longitude) >= 180;
    if (stillPreCrossing) lo = mid;
    else hi = mid;
  }
  return new Date(hi);
}

/** Scans a chronological run of DailyPanchang (must be gap-free, one
 * entry per calendar day) for every New Moon (Amavasya-ending) instant
 * — the moment a new lunar month begins.
 *
 * Deliberately does NOT key on any single day's tithi.number (neither
 * 1 [Shukla Pratipada] nor 30 [Amavasya]): either can be a Kshaya tithi
 * — short enough to fall entirely between two sunrises and never be
 * any day's own sunrise-tithi — and BOTH are confirmed to actually
 * happen in 2026 against this engine's own output (2026-09-11 Amavasya
 * -> 2026-09-12 Shukla DWITIYA, Pratipada skipped; and separately
 * 2026-03-18 Krishna CHATURDASHI -> 2026-03-19 Shukla Pratipada,
 * Amavasya itself skipped — the latter matches the independently
 * published Chaitra-Navratri-start date of 19 March 2026, confirming
 * this is the historically correct real-world month boundary, not a
 * bug). Instead this detects the New Moon directly from the
 * CONTINUOUS Moon-minus-Sun angle (tithiDiffAt): it increases by
 * roughly 12-13 degrees every day and only ever drops sharply when it
 * wraps 360 -> 0, so a single day-to-day delta below -180 unambiguously
 * marks "a New Moon happened somewhere in this day's night", and
 * bisectNewMoon then pins the exact instant — independent of which
 * (if any) tithi bucket happens to land on a sunrise. Reuses each
 * day's already-computed sunSiderealAtSunrise/moonSiderealAtSunrise
 * (no extra ephemeris calls) for the day-to-day scan; only the ~12
 * bisection windows per year pay for extra sunMoonSiderealLongitudes
 * calls. */
function findAmavasyaEvents(days: DailyPanchang[], latitude: number, longitude: number): AmavasyaEvent[] {
  const diffAtSunrise = days.map((d) => normalizeDegrees(d.moonSiderealAtSunrise - d.sunSiderealAtSunrise));

  const events: AmavasyaEvent[] = [];
  for (let i = 1; i < days.length; i++) {
    if (diffAtSunrise[i] - diffAtSunrise[i - 1] > -180) continue; // no wrap between these two sunrises

    const instant = bisectNewMoon(new Date(days[i - 1].sunrise), new Date(days[i].sunrise), latitude, longitude);
    const { sun } = sunMoonSiderealLongitudes(Astronomy.MakeTime(instant), latitude, longitude);
    events.push({ instant: instant.toISOString(), sunSignIndex: sunSignIndexFromLongitude(sun) });
  }
  return events;
}

function buildLunarMonths(events: AmavasyaEvent[]): LunarMonth[] {
  const months: LunarMonth[] = [];
  for (let i = 0; i < events.length - 1; i++) {
    const start = events[i];
    const end = events[i + 1];
    months.push({
      startInstant: start.instant,
      endInstant: end.instant,
      masaName: MASA_NAMES[masaIndexForSunSign(start.sunSignIndex) - 1],
      isAdhikaMasa: start.sunSignIndex === end.sunSignIndex,
    });
  }
  return months;
}

type MasaDay = {
  date: string;
  masaName: string;
  isAdhikaMasa: boolean;
  paksha: "shukla" | "krishna";
  displayNumber: number; // 1-15
  varaName: string;
};

/** Assigns each day (by its sunrise instant) to the lunar month whose
 * [startInstant, endInstant) interval it falls in. `months` must be
 * chronologically sorted and gap-free (buildLunarMonths guarantees
 * this for a contiguous events list). Days outside every month's span
 * (shouldn't happen given computeYearFestivals's buffer, but possible
 * at the very edges) are simply omitted. */
function assignMasaToDays(days: DailyPanchang[], months: LunarMonth[]): MasaDay[] {
  const out: MasaDay[] = [];
  let mi = 0;
  for (const day of days) {
    const t = new Date(day.sunrise).getTime();
    while (mi < months.length - 1 && t >= new Date(months[mi + 1].startInstant).getTime()) mi++;
    const month = months[mi];
    if (!month) continue;
    if (t < new Date(month.startInstant).getTime() || t >= new Date(month.endInstant).getTime()) continue;

    out.push({
      date: day.date,
      masaName: month.masaName,
      isAdhikaMasa: month.isAdhikaMasa,
      paksha: day.tithi.paksha,
      displayNumber: day.tithi.displayNumber,
      varaName: day.vara.name,
    });
  }
  return out;
}

// ---------------------------------------------------------------------
// Day range helpers
// ---------------------------------------------------------------------

function isoDateUTC(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Every calendar date from `startMs` to `endMs` inclusive (both plain
 * UTC-midnight instants), as "YYYY-MM-DD" strings. */
function dateRange(startMs: number, endMs: number): string[] {
  const out: string[] = [];
  for (let t = startMs; t <= endMs; t += 24 * 3600 * 1000) out.push(isoDateUTC(new Date(t)));
  return out;
}

function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return isoDateUTC(dt);
}

// ---------------------------------------------------------------------
// Ekadashi names — standard 24-name Vaishnava sequence (Amanta order).
// Partially cross-checked directly via WebSearch (Kamada, Varuthini,
// Mohini, Apara, Nirjala, Yogini, Devshayani all confirmed against
// month+paksha independently); the remaining names are the same
// universally-published sequence continuing in the identical pattern
// (ISKCON/Vaishnava calendars, e.g. iskcondelhi.com's full-year list) —
// not independently re-verified one-by-one here, flagged as best-effort
// for the unconfirmed half. An Adhika month's own two Ekadashis always
// carry the special names Padmini (shukla) / Parama (krishna)
// regardless of which regular month is doubled — a separately
// well-attested classical rule, applied unconditionally below.
const EKADASHI_NAMES: Record<string, { shukla: string; krishna: string }> = {
  Chaitra: { shukla: "Kamada Ekadashi", krishna: "Papmochani Ekadashi" },
  Vaishakha: { shukla: "Mohini Ekadashi", krishna: "Varuthini Ekadashi" },
  Jyeshtha: { shukla: "Nirjala (Pandava) Ekadashi", krishna: "Apara Ekadashi" },
  Ashadha: { shukla: "Devshayani (Ashadhi) Ekadashi", krishna: "Yogini Ekadashi" },
  Shravana: { shukla: "Putrada Ekadashi", krishna: "Kamika Ekadashi" },
  Bhadrapada: { shukla: "Parivartini (Parsva) Ekadashi", krishna: "Aja Ekadashi" },
  Ashwin: { shukla: "Papankusha Ekadashi", krishna: "Indira Ekadashi" },
  Kartika: { shukla: "Prabodhini (Devutthana) Ekadashi", krishna: "Rama Ekadashi" },
  Margashirsha: { shukla: "Mokshada Ekadashi", krishna: "Utpanna Ekadashi" },
  Pausha: { shukla: "Putrada (Pausha) Ekadashi", krishna: "Saphala Ekadashi" },
  Magha: { shukla: "Jaya Ekadashi", krishna: "Shattila Ekadashi" },
  Phalguna: { shukla: "Amalaki Ekadashi", krishna: "Vijaya Ekadashi" },
};

// ---------------------------------------------------------------------
// Major festival rules — {masaName, paksha, displayNumber(1-15), name}
// Amanta masa names below are the RESEARCHED ones (see header comment
// for the shukla/krishna-paksha nuances already accounted for).
// ---------------------------------------------------------------------

type MajorRule = { masaName: string; paksha: "shukla" | "krishna"; displayNumber: number; name: string };

const MAJOR_FESTIVAL_RULES: MajorRule[] = [
  { masaName: "Magha", paksha: "shukla", displayNumber: 5, name: "Vasant Panchami" },
  // Amanta Magha, not Phalguna — see header comment (Maha Shivratri).
  { masaName: "Magha", paksha: "krishna", displayNumber: 14, name: "Maha Shivratri" },
  { masaName: "Chaitra", paksha: "shukla", displayNumber: 9, name: "Ram Navami" },
  // North Indian tradition (Chaitra Purnima); Tamil Nadu's Margazhi
  // Hanuman Jayanti is a documented regional variant not implemented.
  { masaName: "Chaitra", paksha: "shukla", displayNumber: 15, name: "Hanuman Jayanti" },
  { masaName: "Vaishakha", paksha: "shukla", displayNumber: 3, name: "Akshaya Tritiya" },
  { masaName: "Jyeshtha", paksha: "shukla", displayNumber: 10, name: "Ganga Dussehra" },
  { masaName: "Ashadha", paksha: "shukla", displayNumber: 15, name: "Guru Purnima" },
  { masaName: "Shravana", paksha: "shukla", displayNumber: 15, name: "Raksha Bandhan" },
  // Amanta Shravana, not Bhadrapada — see header comment (Janmashtami).
  { masaName: "Shravana", paksha: "krishna", displayNumber: 8, name: "Krishna Janmashtami" },
  { masaName: "Bhadrapada", paksha: "shukla", displayNumber: 4, name: "Ganesh Chaturthi" },
  { masaName: "Ashwin", paksha: "shukla", displayNumber: 1, name: "Navratri (Shardiya) Begins" },
  { masaName: "Ashwin", paksha: "shukla", displayNumber: 8, name: "Durga Ashtami" },
  { masaName: "Ashwin", paksha: "shukla", displayNumber: 9, name: "Durga Navami" },
  { masaName: "Ashwin", paksha: "shukla", displayNumber: 10, name: "Vijayadashami (Dussehra)" },
  // Amanta Ashwin, not Kartik — see header comment (Karva Chauth,
  // Dhanteras, Diwali all share the same krishna paksha).
  { masaName: "Ashwin", paksha: "krishna", displayNumber: 4, name: "Karva Chauth" },
  { masaName: "Ashwin", paksha: "krishna", displayNumber: 13, name: "Dhanteras" },
  { masaName: "Ashwin", paksha: "krishna", displayNumber: 15, name: "Diwali (Lakshmi Puja)" },
  { masaName: "Kartika", paksha: "shukla", displayNumber: 1, name: "Govardhan Puja" },
  { masaName: "Kartika", paksha: "shukla", displayNumber: 2, name: "Bhai Dooj" },
  { masaName: "Kartika", paksha: "shukla", displayNumber: 6, name: "Chhath Puja" },
];

// Purnima/Amavasya masa that already has a dedicated major-festival name
// above — the generic Purnima/Amavasya vrat is suppressed for these so
// the same day doesn't get listed twice under two different names.
const PURNIMA_MAJOR_MASA = new Set(["Chaitra", "Ashadha", "Shravana", "Phalguna"]); // Hanuman Jayanti / Guru Purnima / Raksha Bandhan / Holika Dahan
const AMAVASYA_MAJOR_MASA = new Set(["Ashwin"]); // Diwali
// Chaturthi masa+paksha combos already covered by a major festival.
const CHATURTHI_MAJOR = new Set(["Bhadrapada|shukla", "Ashwin|krishna"]); // Ganesh Chaturthi / Karva Chauth

// A handful of major festivals are NOT dated by "which day's sunrise
// sees this tithi" (the default rule used for everything else) but by
// "which day's NIGHT (Nishita Kaal, the mid-point of night) the tithi
// prevails at" — Maha Shivratri and Krishna Janmashtami are the two
// universally-cited Nishita-Kaal festivals (both are night-time
// observances by tradition). This was discovered empirically: this
// engine's plain sunrise-tithi rule placed Maha Shivratri 2026 on
// 16 February, one day after every published source's 15 February
// (e.g. https://www.goodreturns.in/news/mahashivratri-2026-15-or-16-february-...) —
// because Krishna Chaturdashi begins ~17:34 IST on 15 Feb (after that
// day's sunrise, so the 15th's own sunrise-tithi is still Trayodashi)
// and doesn't end until ~18:04 IST on 16 Feb, so the 16th's sunrise
// tithi is Chaturdashi — but the entire NIGHT of the 15th (after
// 17:34) is Chaturdashi, which is the night Shivratri puja is
// traditionally performed on. Applying the same Nishita-Kaal rule to
// Krishna Janmashtami is standard practice too (also a midnight
// observance) though it happened not to change 2026's date (Ashtami's
// window this year sits squarely inside a single night either way).
const NISHITA_KAAL_FESTIVALS = new Set(["Maha Shivratri", "Krishna Janmashtami"]);

/** Given the day index (in the full buffered `days` array) whose own
 * sunrise-tithi is the target tithi, and that tithi's exact start
 * instant, returns whichever calendar date's night (sunset -> next
 * sunrise) the tithi is active at its midpoint (Nishita Kaal) —
 * either that same day, or the day before it. */
function nishitaKaalDate(days: DailyPanchang[], dayIndex: number, tithiStartsAtIso: string): string {
  if (dayIndex <= 0) return days[dayIndex].date;
  const prevDay = days[dayIndex - 1];
  const curDay = days[dayIndex];
  const prevNishita = (new Date(prevDay.sunset).getTime() + new Date(curDay.sunrise).getTime()) / 2;
  return new Date(tithiStartsAtIso).getTime() <= prevNishita ? prevDay.date : curDay.date;
}

// Vijayadashami/Dussehra is dated by Aparahna Kaal (early afternoon),
// not sunrise — discovered the same way as the Nishita Kaal cases
// above: this engine's plain sunrise-tithi rule placed it on 21 October
// 2026 (a genuine Vriddhi Saptami earlier in the same Navratri fortnight
// pushes every later tithi a day later than a "no Vriddhi" year would),
// one day after multiple published sources' 20 October — e.g.
// https://www.divinehindu.in/blogs/news/dussehra-vijayadashami-2026,
// which gives the Dashami tithi itself as "begins ~12:50 PM 20 October,
// ends ~2:11 PM 21 October" (so the 21st's sunrise IS within Dashami,
// confirming this engine's tithi math is right) but states "the
// principal Vijayadashami celebration remains on October 20" because
// the classical rule specifically wants Dashami tithi present during
// Aparahna Kaal (the afternoon quarter of daytime, roughly 60-75% of
// the way from sunrise to sunset) — which it already is on the 20th
// (from 12:50 PM), a day before its own sunrise-tithi would suggest.
const APARAHNA_KAAL_FESTIVALS = new Set(["Vijayadashami (Dussehra)"]);

/** Mirrors nishitaKaalDate for the Aparahna Kaal rule: returns whichever
 * calendar date's Aparahna instant (approximated as 62.5% of the way
 * from that day's own sunrise to its own sunset — squarely inside the
 * classically-defined 3rd-of-4-daytime-quarters window) the tithi is
 * already active at — either the sunrise-day itself, or the day
 * before it. */
function aparahnaKaalDate(
  days: DailyPanchang[],
  dayIndex: number,
  tithiStartsAtIso: string,
  tithiEndsAtIso: string
): string {
  if (dayIndex <= 0) return days[dayIndex].date;
  const prevDay = days[dayIndex - 1];
  const sunriseMs = new Date(prevDay.sunrise).getTime();
  const sunsetMs = new Date(prevDay.sunset).getTime();
  const prevAparahna = sunriseMs + 0.625 * (sunsetMs - sunriseMs);
  const startMs = new Date(tithiStartsAtIso).getTime();
  const endMs = new Date(tithiEndsAtIso).getTime();
  return prevAparahna >= startMs && prevAparahna < endMs ? prevDay.date : days[dayIndex].date;
}

// ---------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------

/**
 * Computes every major festival and vrat this engine can confidently
 * derive for a Gregorian calendar year, at (latitude, longitude).
 * Fully deterministic and synchronous — no network calls, no AI (see
 * enrichFestivalDescriptions below for the separate, optional,
 * fail-soft AI-blurb step) — so store.ts and tests can call it directly
 * and rely on identical output for identical input.
 */
export function computeYearFestivals(year: number, latitude: number, longitude: number): FestivalEvent[] {
  // Buffer well beyond the calendar year on both sides so every lunar
  // month touching [Jan 1, Dec 31] is fully bracketed by amavasyas on
  // both ends, even in an Adhika year (an extra ~29-30 day month can
  // shift things further than a normal year) — 45 days before Jan 1 and
  // ~55 days after Dec 31 is comfortably more than one synodic month
  // (~29.5 days) of margin on each side.
  const bufferStartMs = Date.UTC(year - 1, 10, 10); // Nov 10, previous year
  const bufferEndMs = Date.UTC(year + 1, 1, 20); // Feb 20, next year
  const bufferedDates = dateRange(bufferStartMs, bufferEndMs);

  const days = bufferedDates.map((date) => calculateDailyPanchang(date, latitude, longitude));

  const amavasyaEvents = findAmavasyaEvents(days, latitude, longitude);
  const months = buildLunarMonths(amavasyaEvents);
  const masaDays = assignMasaToDays(days, months);

  const yearPrefix = `${year}-`;
  const yearDays = masaDays.filter((d) => d.date.startsWith(yearPrefix));
  const masaDayByDate = new Map(yearDays.map((d) => [d.date, d]));

  const events: FestivalEvent[] = [];

  // --- Makar Sankranti: solar event, Sun's sidereal ingress into
  // Capricorn (Makara). Detected from the same daily sunSiderealAtSunrise
  // samples calculate.ts already provides — the transition day (first
  // sunrise at/after the ingress) is the published Makar Sankranti date. ---
  for (let i = 1; i < days.length; i++) {
    if (!days[i].date.startsWith(yearPrefix)) continue;
    const prevSign = sunSignIndexFromLongitude(days[i - 1].sunSiderealAtSunrise);
    const curSign = sunSignIndexFromLongitude(days[i].sunSiderealAtSunrise);
    if (prevSign !== curSign && curSign === 10) {
      events.push({ date: days[i].date, name: "Makar Sankranti", category: "sankranti" });
    }
  }

  // --- Holika Dahan (Phalguna Purnima) + Holi (the following day,
  // Phalguna Krishna Pratipada) — a distinct pair, not a single tithi
  // rule (see header/task notes: Holika Dahan burns on Purnima
  // evening, Holi/colour-play is the next calendar day). ---
  for (const d of yearDays) {
    if (d.masaName === "Phalguna" && d.paksha === "shukla" && d.displayNumber === 15) {
      events.push({
        date: d.date,
        name: "Holika Dahan",
        category: "major-festival",
        tithi: { number: 15, paksha: "shukla", masa: "Phalguna" },
        isAdhikaMasa: d.isAdhikaMasa,
      });
      const holiDate = addDays(d.date, 1);
      const holiDay = masaDayByDate.get(holiDate);
      events.push({
        date: holiDate,
        name: "Holi",
        category: "major-festival",
        tithi: holiDay ? { number: 1, paksha: "krishna", masa: holiDay.masaName } : undefined,
        isAdhikaMasa: holiDay?.isAdhikaMasa,
      });
    }
  }

  // --- Major festivals: fixed masa+paksha+tithi rules, explicitly
  // skipped in an Adhika occurrence of that masa (see header comment —
  // major festivals are not observed in Adhika Masa; they land in the
  // Nija/regular occurrence of the same masa name instead). ---
  for (const d of yearDays) {
    if (d.isAdhikaMasa) continue;
    for (const rule of MAJOR_FESTIVAL_RULES) {
      if (d.masaName === rule.masaName && d.paksha === rule.paksha && d.displayNumber === rule.displayNumber) {
        events.push({
          date: d.date,
          name: rule.name,
          category: "major-festival",
          tithi: { number: d.displayNumber, paksha: d.paksha, masa: d.masaName },
          isAdhikaMasa: false,
        });
      }
    }
  }

  // --- Nishita Kaal correction: shift Maha Shivratri / Krishna
  // Janmashtami to the previous calendar day when the tithi is already
  // active at that previous night's midpoint — see NISHITA_KAAL_FESTIVALS
  // comment above. ---
  const dayIndexByDate = new Map(days.map((day, i) => [day.date, i]));
  for (const event of events) {
    if (NISHITA_KAAL_FESTIVALS.has(event.name)) {
      const idx = dayIndexByDate.get(event.date);
      if (idx === undefined) continue;
      event.date = nishitaKaalDate(days, idx, days[idx].tithi.startsAt);
    } else if (APARAHNA_KAAL_FESTIVALS.has(event.name)) {
      const idx = dayIndexByDate.get(event.date);
      if (idx === undefined) continue;
      event.date = aparahnaKaalDate(days, idx, days[idx].tithi.startsAt, days[idx].tithi.endsAt);
    }
  }

  // --- Ekadashi vrats: every Shukla/Krishna Ekadashi, every masa,
  // INCLUDING Adhika months (with the special Padmini/Parama names —
  // see EKADASHI_NAMES comment). 24/year normally, 26 in an Adhika year. ---
  for (const d of yearDays) {
    if (d.displayNumber !== 11) continue;
    let name: string;
    if (d.isAdhikaMasa) {
      name = d.paksha === "shukla" ? "Padmini Ekadashi (Adhika Masa)" : "Parama Ekadashi (Adhika Masa)";
    } else {
      const known = EKADASHI_NAMES[d.masaName];
      name = known ? known[d.paksha] : `Ekadashi Vrat (${d.masaName} ${d.paksha === "shukla" ? "Shukla" : "Krishna"})`;
    }
    events.push({
      date: d.date,
      name,
      category: "ekadashi",
      tithi: { number: 11, paksha: d.paksha, masa: d.masaName },
      isAdhikaMasa: d.isAdhikaMasa,
    });
  }

  // --- Purnima vrat (every month, except where a major festival above
  // already names this exact Purnima) — optional sub-name left as a
  // documented best-effort gap (e.g. Somvati Purnima) other than the
  // plain masa-qualified name. ---
  for (const d of yearDays) {
    if (d.paksha !== "shukla" || d.displayNumber !== 15) continue;
    if (PURNIMA_MAJOR_MASA.has(d.masaName)) continue;
    events.push({
      date: d.date,
      name: `Purnima Vrat (${d.masaName})`,
      category: "vrat",
      tithi: { number: 15, paksha: "shukla", masa: d.masaName },
      isAdhikaMasa: d.isAdhikaMasa,
    });
  }

  // --- Amavasya (every month except Ashwin, already Diwali above).
  // Two well-known sub-names applied as a best-effort bonus (task
  // called these optional): Mauni Amavasya (Magha) and Somvati
  // Amavasya (any Monday Amavasya) — not exhaustively researched beyond
  // these two, everything else gets the plain masa-qualified name. ---
  for (const d of yearDays) {
    if (d.paksha !== "krishna" || d.displayNumber !== 15) continue;
    if (AMAVASYA_MAJOR_MASA.has(d.masaName)) continue;
    let name = `Amavasya Vrat (${d.masaName})`;
    if (d.masaName === "Magha") name = "Mauni Amavasya";
    else if (d.varaName === "Monday") name = `Somvati Amavasya (${d.masaName})`;
    events.push({
      date: d.date,
      name,
      category: "vrat",
      tithi: { number: 15, paksha: "krishna", masa: d.masaName },
      isAdhikaMasa: d.isAdhikaMasa,
    });
  }

  // --- Sankashti (Krishna Chaturthi) / Vinayaka (Shukla Chaturthi)
  // every month, except where a major festival above already names
  // this exact Chaturthi (Ganesh Chaturthi, Karva Chauth). ---
  for (const d of yearDays) {
    if (d.displayNumber !== 4) continue;
    if (CHATURTHI_MAJOR.has(`${d.masaName}|${d.paksha}`)) continue;
    events.push({
      date: d.date,
      name: d.paksha === "krishna" ? `Sankashti Chaturthi (${d.masaName})` : `Vinayaka Chaturthi (${d.masaName})`,
      category: "vrat",
      tithi: { number: 4, paksha: d.paksha, masa: d.masaName },
      isAdhikaMasa: d.isAdhikaMasa,
    });
  }

  // --- Vriddhi collapse: a tithi that spans two sunrises is the
  // sunrise-tithi on BOTH consecutive days, which would otherwise emit
  // the same major-festival name twice on adjacent dates (verified
  // against this engine's own output — Ganesh Chaturthi 2026 without
  // this collapse appears on both 14 and 15 September). A single named
  // major festival should have exactly one calendar date, so for any
  // two same-named major-festival events on consecutive dates, keep
  // only the earlier one — matches the published date in every case
  // checked (e.g. Ganesh Chaturthi 2026 = 14 September, the earlier of
  // the two). This is a simplification, not a full implementation of
  // every festival's specific day-portion (Madhyahna/Pradosh/etc.)
  // tie-break rule — documented gap for any case this default doesn't
  // suit. ---
  const majorByName = new Map<string, FestivalEvent[]>();
  for (const e of events) {
    if (e.category !== "major-festival") continue;
    const list = majorByName.get(e.name) ?? [];
    list.push(e);
    majorByName.set(e.name, list);
  }
  const suppressed = new Set<FestivalEvent>();
  for (const list of majorByName.values()) {
    list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    for (let i = 1; i < list.length; i++) {
      if (addDays(list[i - 1].date, 1) === list[i].date) suppressed.add(list[i]);
    }
  }
  const afterVriddhiCollapse = events.filter((e) => !suppressed.has(e));

  // --- Dedup (date+name) defensively, then sort chronologically. ---
  const seen = new Set<string>();
  const deduped = afterVriddhiCollapse.filter((e) => {
    const key = `${e.date}|${e.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  deduped.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return deduped;
}

// ---------------------------------------------------------------------
// Optional AI blurb (Step 4) — deliberately separate from
// computeYearFestivals so the deterministic engine above never touches
// the network. Reuses generateStructuredReport's exact pattern
// (OPENROUTER_API_KEY_FREE / OPENROUTER_MODEL_FREE) but only asks for
// ONE plain-language description field, never a date — the AI is never
// shown or asked to alter the already-computed date.
// ---------------------------------------------------------------------

const MAJOR_BLURB_INSTRUCTIONS =
  "Write ONLY a 1-2 sentence factual description of what this Hindu festival traditionally celebrates or commemorates. " +
  "Do not mention or imply any date, day of the week, or year — the date has already been computed elsewhere and is not your concern. " +
  'Respond with a single "sections" entry titled "About" whose content is that 1-2 sentence description; leave "highlights" and "recommendations" as empty arrays.';

/** Fills in `description` for every category:"major-festival" event
 * (never Ekadashi/vrat — those stay undescribed by design) using the
 * free OpenRouter model. Fails soft: any single festival's blurb that
 * errors (missing API key, network failure, invalid model response)
 * just logs a warning and leaves that event's description undefined —
 * never throws, never blocks the rest of the list. Returns a NEW array
 * (input is not mutated). */
export async function enrichFestivalDescriptions(events: FestivalEvent[]): Promise<FestivalEvent[]> {
  return Promise.all(
    events.map(async (event) => {
      if (event.category !== "major-festival") return event;
      try {
        const report = await generateStructuredReport(
          "panchang-festival-description",
          { festivalName: event.name, masa: event.tithi?.masa, paksha: event.tithi?.paksha },
          MAJOR_BLURB_INSTRUCTIONS
        );
        const description = report.sections[0]?.content?.trim();
        return description ? { ...event, description } : event;
      } catch (err) {
        console.warn(`[festivals] description generation failed for "${event.name}" — leaving undefined:`, err);
        return event;
      }
    })
  );
}
