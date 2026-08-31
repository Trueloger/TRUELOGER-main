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
