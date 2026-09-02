"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  fieldLabelClass,
  fieldInputClass,
  fieldInputErrorClass,
  fieldErrorTextClass,
} from "./field-styles";
import { PickerShell } from "./PickerShell";

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

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
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

function sameYMD(a: YMD, b: YMD): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

function dateKey(d: YMD): string {
  return `${d.year}-${d.month}-${d.day}`;
}

function clampYMD(d: YMD, min: YMD, max: YMD): YMD {
  const asDate = new Date(d.year, d.month - 1, d.day).getTime();
  if (asDate < new Date(min.year, min.month - 1, min.day).getTime()) return min;
  if (asDate > new Date(max.year, max.month - 1, max.day).getTime()) return max;
  return d;
}

function addDays(d: YMD, delta: number): YMD {
  const next = new Date(d.year, d.month - 1, d.day + delta);
  return { year: next.getFullYear(), month: next.getMonth() + 1, day: next.getDate() };
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

/** Custom calendar picker (bottom sheet on mobile, anchored popover on
 * desktop — see PickerShell) replacing the native `<input type="date">`.
 * `value`/`onChange` keep the exact same "YYYY-MM-DD" string contract a
 * native date input used, so nothing downstream needs to change. */
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
  const minDate: YMD = { year: minYear, month: 1, day: 1 };
  const maxDateRaw: YMD = { year: maxYear, month: 12, day: 31 };
  // Never allow a future date, regardless of maxYear.
  const maxDate: YMD =
    new Date(maxYear, 11, 31).getTime() > new Date(today.year, today.month - 1, today.day).getTime()
      ? today
      : maxDateRaw;

  const selected = parseISODate(value);
  const initialView = selected ?? clampYMD(today, minDate, maxDate);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initialView.year);
  const [viewMonth, setViewMonth] = useState(initialView.month);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [focusDate, setFocusDate] = useState<YMD>(
    selected ?? clampYMD(today, minDate, maxDate)
  );

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dayButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const gridRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);
  const shouldFocusDay = useRef(false);

  function openPanel() {
    const base = selected ?? clampYMD(today, minDate, maxDate);
    setViewYear(base.year);
    setViewMonth(base.month);
    setFocusDate(base);
    setYearPickerOpen(false);
    setOpen(true);
  }

  function closePanel() {
    setOpen(false);
    setYearPickerOpen(false);
  }

  useEffect(() => {
    if (shouldFocusDay.current) {
      shouldFocusDay.current = false;
      const btn = dayButtonRefs.current.get(dateKey(focusDate));
      btn?.focus();
    }
  }, [focusDate, viewYear, viewMonth]);

  const isBeforeMin = (d: YMD) =>
    new Date(d.year, d.month - 1, d.day).getTime() < new Date(minDate.year, minDate.month - 1, minDate.day).getTime();
  const isAfterMax = (d: YMD) =>
    new Date(d.year, d.month - 1, d.day).getTime() > new Date(maxDate.year, maxDate.month - 1, maxDate.day).getTime();
  const isDisabled = (d: YMD) => isBeforeMin(d) || isAfterMax(d);

  const canGoPrevMonth = !isBeforeMin({ year: viewYear, month: viewMonth, day: daysInMonth(viewYear, viewMonth) });
  const canGoNextMonth = !isAfterMax({ year: viewYear, month: viewMonth, day: 1 });

  function goPrevMonth() {
    const m = viewMonth === 1 ? 12 : viewMonth - 1;
    const y = viewMonth === 1 ? viewYear - 1 : viewYear;
    setViewYear(y);
    setViewMonth(m);
  }
  function goNextMonth() {
    const m = viewMonth === 12 ? 1 : viewMonth + 1;
    const y = viewMonth === 12 ? viewYear + 1 : viewYear;
    setViewYear(y);
    setViewMonth(m);
  }

  function selectDate(d: YMD) {
    if (isDisabled(d)) return;
    onChange(toISODate(d));
    closePanel();
    triggerRef.current?.focus();
  }

  function moveFocus(delta: number) {
    const next = clampYMD(addDays(focusDate, delta), minDate, maxDate);
    setFocusDate(next);
    if (next.year !== viewYear || next.month !== viewMonth) {
      setViewYear(next.year);
      setViewMonth(next.month);
    }
    shouldFocusDay.current = true;
  }

  function onGridKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        moveFocus(-1);
        break;
      case "ArrowRight":
        e.preventDefault();
        moveFocus(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveFocus(-7);
        break;
      case "ArrowDown":
        e.preventDefault();
        moveFocus(7);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        selectDate(focusDate);
        break;
      default:
        break;
    }
  }

  // Build the 6x7 day grid for the viewed month.
  const cells = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
    const totalDaysInView = daysInMonth(viewYear, viewMonth);
    const prevMonth = viewMonth === 1 ? 12 : viewMonth - 1;
    const prevYear = viewMonth === 1 ? viewYear - 1 : viewYear;
    const daysInPrev = daysInMonth(prevYear, prevMonth);

    const list: { d: YMD; outside: boolean }[] = [];
    for (let i = firstWeekday - 1; i >= 0; i--) {
      list.push({ d: { year: prevYear, month: prevMonth, day: daysInPrev - i }, outside: true });
    }
    for (let day = 1; day <= totalDaysInView; day++) {
      list.push({ d: { year: viewYear, month: viewMonth, day }, outside: false });
    }
    const nextMonth = viewMonth === 12 ? 1 : viewMonth + 1;
    const nextYear = viewMonth === 12 ? viewYear + 1 : viewYear;
    let nextDay = 1;
    while (list.length < 42) {
      list.push({ d: { year: nextYear, month: nextMonth, day: nextDay }, outside: true });
      nextDay++;
    }
    return list;
  }, [viewYear, viewMonth]);

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxYear; y >= minYear; y--) arr.push(y);
    return arr;
  }, [minYear, maxYear]);

  useEffect(() => {
    if (yearPickerOpen) {
      const el = yearListRef.current?.querySelector<HTMLButtonElement>('[data-active="true"]');
      el?.scrollIntoView({ block: "center" });
    }
  }, [yearPickerOpen]);

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
        title={`${label} calendar`}
        panelId={panelId}
      >
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrevMonth}
              disabled={!canGoPrevMonth}
              aria-label="Previous month"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-nav-violet transition-colors duration-150 hover:bg-nav-lavender-soft disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setYearPickerOpen((v) => !v)}
              aria-expanded={yearPickerOpen}
              className="flex min-h-11 items-center gap-1 rounded-xl px-3 py-2 text-[0.95rem] font-semibold text-nav-violet transition-colors duration-150 hover:bg-nav-lavender-soft"
            >
              {MONTH_LABELS[viewMonth - 1]} {viewYear}
            </button>

            <button
              type="button"
              onClick={goNextMonth}
              disabled={!canGoNextMonth}
              aria-label="Next month"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-nav-violet transition-colors duration-150 hover:bg-nav-lavender-soft disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {yearPickerOpen ? (
            <div
              ref={yearListRef}
              role="listbox"
              aria-label="Select year"
              className="grid max-h-64 grid-cols-4 gap-1.5 overflow-y-auto py-1"
            >
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  role="option"
                  aria-selected={y === viewYear}
                  data-active={y === viewYear ? "true" : undefined}
                  onClick={() => {
                    setViewYear(y);
                    setYearPickerOpen(false);
                  }}
                  className={`flex min-h-11 items-center justify-center rounded-lg text-sm transition-colors duration-150 ${
                    y === viewYear
                      ? "bg-nav-amethyst text-white"
                      : "text-nav-plum hover:bg-nav-lavender-soft"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-nav-plum/50">
                {WEEKDAY_LABELS.map((wd) => (
                  <div key={wd} className="py-1">
                    {wd}
                  </div>
                ))}
              </div>
              <div
                ref={gridRef}
                onKeyDown={onGridKeyDown}
                role="grid"
                aria-label={`${MONTH_LABELS[viewMonth - 1]} ${viewYear}`}
                className="grid grid-cols-7 gap-1"
              >
                {cells.map(({ d, outside }) => {
                  const disabled = isDisabled(d);
                  const isSelected = selected ? sameYMD(d, selected) : false;
                  const isToday = sameYMD(d, today);
                  const isFocusable = sameYMD(d, focusDate);
                  return (
                    <button
                      key={dateKey(d)}
                      ref={(el) => {
                        if (el) dayButtonRefs.current.set(dateKey(d), el);
                        else dayButtonRefs.current.delete(dateKey(d));
                      }}
                      type="button"
                      role="gridcell"
                      tabIndex={isFocusable ? 0 : -1}
                      disabled={disabled}
                      aria-selected={isSelected}
                      aria-current={isToday ? "date" : undefined}
                      onClick={() => selectDate(d)}
                      onFocus={() => setFocusDate(d)}
                      className={`flex min-h-11 min-w-11 items-center justify-center rounded-lg text-sm transition-colors duration-150 ${
                        outside ? "text-nav-plum/30" : "text-nav-plum"
                      } ${
                        isSelected
                          ? "bg-nav-amethyst font-semibold text-white"
                          : isToday
                            ? "border border-nav-amethyst/60 font-medium"
                            : "hover:bg-nav-lavender-soft"
                      } ${disabled ? "cursor-not-allowed opacity-30 hover:bg-transparent" : ""}`}
                    >
                      {d.day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-3 flex justify-end border-t border-nav-lavender-line pt-3">
            <button
              type="button"
              onClick={closePanel}
              className="min-h-11 rounded-full px-4 text-sm font-medium text-nav-amethyst-deep transition-colors duration-150 hover:bg-nav-lavender-soft"
            >
              Close
            </button>
          </div>
        </div>
      </PickerShell>
    </div>
  );
}
