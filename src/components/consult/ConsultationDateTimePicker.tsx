"use client";

// src/components/consult/ConsultationDateTimePicker.tsx
// Shared date + time step used by both DurationSheet (modal, from a
// /consult card) and ServiceDurationPicker (inline, on a /consult/[slug]
// subpage) — one component so both entry points collect the same
// preferred date/time before the item ever reaches the cart, per "ask
// date/time before cart".
import { businessHourSlots, BUSINESS_TIMEZONE } from "@/lib/consultation/availability";

function todayInBusinessTimezone(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIMEZONE }).format(new Date());
}

function maxBookableDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().slice(0, 10);
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
  const slots = businessHourSlots();
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label htmlFor="preferred-date" className="block text-sm font-medium text-nav-plum">
          Preferred Date
        </label>
        <input
          id="preferred-date"
          type="date"
          min={todayInBusinessTimezone()}
          max={maxBookableDate()}
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="mt-1.5 min-h-[44px] w-full rounded-lg border border-nav-lavender-line bg-white px-3 text-nav-plum focus:border-nav-amethyst focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="preferred-time" className="block text-sm font-medium text-nav-plum">
          Preferred Time <span className="text-xs text-nav-plum/50">(IST, business hours)</span>
        </label>
        <select
          id="preferred-time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="mt-1.5 min-h-[44px] w-full rounded-lg border border-nav-lavender-line bg-white px-3 text-nav-plum focus:border-nav-amethyst focus:outline-none"
        >
          <option value="">Select a time…</option>
          {slots.map((slot) => (
            <option key={slot} value={slot}>
              {formatSlotLabel(slot)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function formatSlotLabel(slot: string): string {
  const [h, m] = slot.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}
