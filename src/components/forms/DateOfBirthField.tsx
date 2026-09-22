"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  fieldLabelClass,
  fieldInputClass,
  fieldInputErrorClass,
  fieldErrorTextClass,
} from "./field-styles";
import { PickerShell } from "./PickerShell";
import { WheelColumn } from "./WheelColumn";

const DEFAULT_MIN_YEAR = 1900;

function daysInMonth(year: number, month: number): number {
  // month is 1-12; day 0 of the following month is the last day of `month`.
  return new Date(year, month, 0).getDate();
}

/** Pure validator — real calendar-date validity (rejects e.g. Feb 30,
 * not just a regex shape check), a configurable year range, and no
 * future dates. Exported so consuming pages can re-run the same check
 * both client-side and server-side. */
export function validateDateOfBirth(
  value: string,
  opts?: { minYear?: number; maxYear?: number }
): string | null {
  const minYear = opts?.minYear ?? DEFAULT_MIN_YEAR;
  const maxYear = opts?.maxYear ?? new Date().getFullYear();

  if (!value) return "Date of birth is required.";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "Enter a valid date.";

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) return "Enter a valid date.";
  if (day < 1 || day > daysInMonth(year, month)) return "Enter a valid date.";
  if (year < minYear || year > maxYear) {
    return `Year must be between ${minYear} and ${maxYear}.`;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parsed = new Date(year, month - 1, day);
  if (parsed.getTime() > today.getTime()) {
    return "Date of birth cannot be in the future.";
  }

  return null;
}

type DateOfBirthFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  id?: string;
  label?: string;
  required?: boolean;
  minYear?: number;
  maxYear?: number;
};

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type YMD = { year: number; month: number; day: number };

function parseISODate(value: string): YMD | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

function toISODate({ year, month, day }: YMD): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDisplayDate(value: string): string | null {
  const parsed = parseISODate(value);
  if (!parsed) return null;
  const date = new Date(parsed.year, parsed.month - 1, parsed.day);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Custom Month / Day / Year wheel picker (bottom sheet on mobile,
 * anchored popover on desktop — see PickerShell) replacing the native
 * `<input type="date">`. `value`/`onChange` keep the exact same
 * "YYYY-MM-DD" string contract a native date input used, so nothing
 * downstream needs to change — the wheel only changes how the user
 * assembles that string, never what gets stored. Shares WheelColumn
 * (src/components/forms/WheelColumn.tsx) with TimeOfBirthField's
 * hour/minute/AM-PM wheels, same scroll-snap interaction. Never lets
 * the browser's own Date parsing/timezone touch the selected value —
 * year/month/day are tracked as plain numbers and joined into the ISO
 * string directly (toISODate), the same approach the calendar version
 * of this component used. */
export function DateOfBirthField({
  value,
  onChange,
  error,
  id,
  label = "Date of Birth",
  required = true,
  minYear = DEFAULT_MIN_YEAR,
  maxYear = new Date().getFullYear(),
}: DateOfBirthFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  const panelId = `${fieldId}-panel`;

  const today = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  }, []);

  // Most recent year first — a birth year is almost always within the
  // last ~80 years, so this keeps the common case near the top of the
  // wheel instead of a decades-long scroll from 1900.
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxYear; y >= minYear; y--) arr.push(y);
    return arr;
  }, [minYear, maxYear]);

  const selected = parseISODate(value);
  const initial = selected ?? { year: Math.min(today.year, maxYear), month: today.month, day: today.day };

  const [monthIndex, setMonthIndex] = useState(initial.month - 1);
  const [dayIndex, setDayIndex] = useState(initial.day - 1);
  const [yearIndex, setYearIndex] = useState(Math.max(0, years.indexOf(initial.year)));
  const [open, setOpen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);

  const daysInSelectedMonth = daysInMonth(years[yearIndex] ?? initial.year, monthIndex + 1);
  const dayLabels = useMemo(
    () => Array.from({ length: daysInSelectedMonth }, (_, i) => String(i + 1)),
    [daysInSelectedMonth]
  );
  // Clamp the day wheel when a shorter month/a leap-year change makes
  // the currently-selected day number impossible (e.g. Jan 31 -> Feb).
  const clampedDayIndex = Math.min(dayIndex, daysInSelectedMonth - 1);

  function openPanel() {
    const base = selected ?? { year: Math.min(today.year, maxYear), month: today.month, day: today.day };
    setMonthIndex(base.month - 1);
    setDayIndex(base.day - 1);
    setYearIndex(Math.max(0, years.indexOf(base.year)));
    setOpen(true);
  }

  function closePanel() {
    setOpen(false);
  }

  function commit(nextMonthIndex: number, nextDayIndex: number, nextYearIndex: number) {
    const year = years[nextYearIndex] ?? initial.year;
    const month = nextMonthIndex + 1;
    const maxDay = daysInMonth(year, month);
    const day = Math.min(nextDayIndex + 1, maxDay);
    onChange(toISODate({ year, month, day }));
  }

  const displayValue = formatDisplayDate(value);

  return (
    <div className="relative">
      <label htmlFor={fieldId} className={fieldLabelClass}>
        {label}
        {required && <span className="text-nav-amethyst-deep"> *</span>}
      </label>
      <button
        ref={triggerRef}
        id={fieldId}
        type="button"
        onClick={() => (open ? closePanel() : openPanel())}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-1.5 flex items-center justify-between gap-2 text-left ${fieldInputClass} ${
          error ? fieldInputErrorClass : ""
        }`}
      >
        <span className={displayValue ? "text-nav-plum" : "text-nav-plum/40"}>
          {displayValue ?? "Select date of birth"}
        </span>
        <CalendarIcon className="h-4.5 w-4.5 shrink-0 text-nav-amethyst" aria-hidden="true" />
      </button>
      {error && (
        <p id={errorId} role="alert" className={fieldErrorTextClass}>
          {error}
        </p>
      )}

      {/* hidden field keeps the raw ISO value discoverable in the DOM the
          way a native date input's value would be — not required for
          functionality (state already round-trips via onChange), just a
          debugging/autofill-friendly courtesy */}
      <input type="hidden" value={value} readOnly />

      <PickerShell
        open={open}
        onClose={closePanel}
        triggerRef={triggerRef}
        title={`${label} picker`}
        panelId={panelId}
      >
        <div className="p-4">
          <div className="flex items-center justify-center gap-1.5">
            <WheelColumn
              label="Month"
              values={MONTH_LABELS}
              index={monthIndex}
              className="min-w-[7rem]"
              onSelect={(i) => {
                setMonthIndex(i);
                commit(i, clampedDayIndex, yearIndex);
              }}
            />
            <WheelColumn
              label="Day"
              values={dayLabels}
              index={clampedDayIndex}
              onSelect={(i) => {
                setDayIndex(i);
                commit(monthIndex, i, yearIndex);
              }}
            />
            <WheelColumn
              label="Year"
              values={years.map(String)}
              index={yearIndex}
              onSelect={(i) => {
                setYearIndex(i);
                commit(monthIndex, clampedDayIndex, i);
              }}
            />
          </div>

          <div className="mt-3 flex justify-end border-t border-nav-lavender-line pt-3">
            <button
              type="button"
              onClick={() => {
                closePanel();
                triggerRef.current?.focus();
              }}
              className="min-h-11 rounded-full bg-nav-amethyst px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-nav-amethyst-deep"
            >
              Done
            </button>
          </div>
        </div>
      </PickerShell>
    </div>
  );
}
