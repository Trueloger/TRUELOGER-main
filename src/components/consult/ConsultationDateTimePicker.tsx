"use client";

// src/components/consult/ConsultationDateTimePicker.tsx
// Shared date + time step used by both DurationSheet (modal, from a
// /consult card) and ServiceDurationPicker (inline, on a /consult/[slug]
// subpage) — one component so both entry points collect the same
// preferred date/time before the item ever reaches the cart, per "ask
// date/time before cart".
//
// UI refresh: the native <input type="date"> is replaced by a
// horizontally-scrollable day-selector strip (today .. +60 days, the
// exact same bookable window businessHourSlots/validateDateTime already
// enforce — this component doesn't change that window, only how a day
// within it is picked), and the native <select> of time slots is
// replaced by the shared Select component (src/components/ui/Select.tsx)
// — a real listbox, not a free-form wheel, since these are fixed
// discrete 30-minute business-hour slots, not an arbitrary hour/minute
// entry. Today's already-past slots are now visually disabled instead
// of silently accepted then rejected server-side on submit (the
// server-side check in validateDateTime is unchanged and remains the
// authoritative one — this is a client-side UX improvement only).
import { useMemo } from "react";
import { businessHourSlots, BUSINESS_TIMEZONE } from "@/lib/consultation/availability";
import { Select } from "@/components/ui/Select";

const BOOKING_WINDOW_DAYS = 60;

function nowPartsInBusinessTimezone() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

type DayOption = { date: string; weekday: string; day: number; isToday: boolean };

/** Every bookable day, today through +60 days, in BUSINESS_TIMEZONE —
 * the exact same window maxBookableDate/validateDateTime already
 * enforce server-side. Computed via Intl day-by-day (not raw UTC Date
 * math) so it can never drift a day off business-timezone midnight. */
function bookableDays(): DayOption[] {
  const days: DayOption[] = [];
  const base = new Date();
  for (let offset = 0; offset <= BOOKING_WINDOW_DAYS; offset++) {
    const d = new Date(base);
    d.setDate(d.getDate() + offset);
    const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIMEZONE }).format(d);
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone: BUSINESS_TIMEZONE, weekday: "short" }).format(d);
    const day = Number(dateStr.slice(8, 10));
    days.push({ date: dateStr, weekday, day, isToday: offset === 0 });
  }
  return days;
}

function formatSlotLabel(slot: string): string {
  const [h, m] = slot.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function ConsultationDateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
}: {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}) {
  const days = useMemo(() => bookableDays(), []);
  const slots = useMemo(() => businessHourSlots(), []);
  const now = useMemo(() => nowPartsInBusinessTimezone(), []);

  function selectDay(nextDate: string) {
    onDateChange(nextDate);
    // A time already chosen for the previous day might now be in the
    // past for the newly-selected day (only matters when switching
    // back to today) — clear it rather than silently keeping an
    // invalid selection the server would reject anyway.
    if (nextDate === now.date && time && time <= now.time) onTimeChange("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="block text-sm font-medium text-nav-plum">Preferred Date</span>
        <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="listbox" aria-label="Preferred date">
          {days.map((d) => {
            const isSelected = d.date === date;
            return (
              <button
                key={d.date}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => selectDay(d.date)}
                className={`flex min-h-[60px] w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border text-sm transition-colors duration-150 ${
                  isSelected
                    ? "border-nav-amethyst bg-nav-amethyst text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)]"
                    : "border-nav-lavender-line bg-white text-nav-plum hover:border-nav-amethyst/50 hover:bg-nav-lavender-mist"
                }`}
              >
                <span className={`text-[0.65rem] uppercase tracking-wide ${isSelected ? "text-white/80" : "text-nav-plum/60"}`}>
                  {d.isToday ? "Today" : d.weekday}
                </span>
                <span className="text-base font-semibold">{d.day}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium text-nav-plum">
          Preferred Time <span className="text-xs text-nav-plum/50">(IST, business hours)</span>
        </span>
        <Select
          aria-label="Preferred time"
          value={time}
          onChange={onTimeChange}
          className="mt-1.5"
          placeholder="Select a time…"
          options={slots.map((slot) => ({
            value: slot,
            label: formatSlotLabel(slot),
            // Only meaningful for today — a future day's slots are
            // never disabled by "now".
            disabled: date === now.date && slot <= now.time,
          }))}
        />
      </div>
    </div>
  );
}
