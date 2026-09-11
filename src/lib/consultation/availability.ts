// src/lib/consultation/availability.ts
// Business-hours configuration for consultation booking, and the
// server-side validation every booking attempt must pass. Kept as a
// simple constant (not yet admin-editable) — future-ready for an
// admin settings screen without changing the shape callers rely on.
export const BUSINESS_TIMEZONE = "Asia/Kolkata";
export const BUSINESS_HOURS_START = 10; // 10:00 IST
export const BUSINESS_HOURS_END = 21; // 21:00 IST (last slot start)
export const SLOT_STEP_MINUTES = 30;

/** All bookable time-of-day slots, as "HH:mm" 24h strings, in
 * BUSINESS_TIMEZONE. Used by both the client picker (for the option
 * list) and the server (to validate a submitted time isn't invented). */
export function businessHourSlots(): string[] {
  const slots: string[] = [];
  for (let minutes = BUSINESS_HOURS_START * 60; minutes < BUSINESS_HOURS_END * 60; minutes += SLOT_STEP_MINUTES) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return slots;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export type DateTimeValidation = { valid: true; date: string; time: string } | { valid: false; reason: string };

/** Server-side validation of a submitted preferred date/time — never
 * trusts the client's own "is this in the future" check. Compares
 * against the current moment in BUSINESS_TIMEZONE (never the server's
 * own local time, which on Vercel is UTC). */
export function validateDateTime(date: unknown, time: unknown): DateTimeValidation {
  if (typeof date !== "string" || !DATE_RE.test(date)) return { valid: false, reason: "Select a valid date." };
  if (typeof time !== "string" || !TIME_RE.test(time)) return { valid: false, reason: "Select a valid time." };
  if (!businessHourSlots().includes(time)) {
    return { valid: false, reason: "Select a time within business hours (10:00 AM – 9:00 PM IST)." };
  }

  // "Now" expressed as an IST y-m-d/h-m, via Intl rather than manual
  // offset math (correct across DST-free IST, but also just more
  // readable than hand-rolled +5:30 arithmetic).
  const nowParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => nowParts.find((p) => p.type === type)?.value ?? "00";
  const nowDate = `${get("year")}-${get("month")}-${get("day")}`;
  const nowTime = `${get("hour")}:${get("minute")}`;

  if (date < nowDate || (date === nowDate && time <= nowTime)) {
    return { valid: false, reason: "Please select a future date and time." };
  }

  // Don't allow booking more than 60 days out — keeps the picker
  // meaningful and avoids stale bookings sitting far in the future.
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);
  const maxDateStr = maxDate.toISOString().slice(0, 10);
  if (date > maxDateStr) return { valid: false, reason: "Please select a date within the next 60 days." };

  return { valid: true, date, time };
}
