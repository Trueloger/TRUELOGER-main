// The single source of truth for "what day is it" across this system —
// the cron route, the read-through store, and every page that displays
// "today's" reading all call this instead of `new Date()` directly, so
// the IST rollover rule lives in exactly one place.

/** Today's date in Asia/Kolkata, as "YYYY-MM-DD". Accepts an explicit
 * instant for testability; defaults to the real current time. */
export function getTodayIST(now: Date = new Date()): string {
  // en-CA's date formatting is YYYY-MM-DD, which is also exactly the
  // Firestore doc-id / ISO calendar-date format we want — no manual
  // string assembly needed.
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}

function istDateParts(now: Date): { year: number; month: number; day: number } {
  const [year, month, day] = getTodayIST(now).split("-").map(Number);
  return { year, month, day };
}

/** ISO-8601 week identifier ("YYYY-Www") for `now`, computed in IST —
 * deterministic, so the same instant always keys the same Firestore
 * doc regardless of which server generated it. Also returns the
 * week's Monday-Sunday date range for display. */
export function getCurrentWeekIST(now: Date = new Date()): {
  weekKey: string;
  startDate: string;
  endDate: string;
} {
  const { year, month, day } = istDateParts(now);
  // Work in UTC-noon-anchored dates so DST/timezone edge cases never
  // shift which calendar day we're computing the ISO week for — the
  // Y/M/D triple above already encodes the IST calendar date.
  const anchor = new Date(Date.UTC(year, month - 1, day, 12));
  const isoDow = (anchor.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() - isoDow);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  // ISO week number: Thursday of this week determines the ISO year.
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const isoYear = thursday.getUTCFullYear();
  const jan1 = new Date(Date.UTC(isoYear, 0, 1));
  const jan1Dow = (jan1.getUTCDay() + 6) % 7;
  const week1Monday = new Date(jan1);
  week1Monday.setUTCDate(jan1.getUTCDate() - jan1Dow);
  const weekNum = Math.round((thursday.getTime() - week1Monday.getTime()) / (7 * 86400000)) + 1;

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    weekKey: `${isoYear}-W${String(weekNum).padStart(2, "0")}`,
    startDate: fmt(monday),
    endDate: fmt(sunday),
  };
}

/** "YYYY-MM" for `now`, computed in IST. */
export function getCurrentMonthIST(now: Date = new Date()): { monthKey: string; monthLabel: string } {
  const { year, month } = istDateParts(now);
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const monthLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 15)));
  return { monthKey, monthLabel };
}
