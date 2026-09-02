"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Clock } from "lucide-react";
import {
  fieldLabelClass,
  fieldInputClass,
  fieldInputErrorClass,
  fieldErrorTextClass,
  fieldHintTextClass,
} from "./field-styles";
import { PickerShell } from "./PickerShell";

/** Pure validator — required (a caller that already routed around this
 * via the "unknown time" toggle simply skips calling it), shape-checked
 * HH:MM. Exported so consuming pages can re-run the same check both
 * client-side and server-side. */
export function validateTimeOfBirth(value: string): string | null {
  if (!value) return "Time of birth is required.";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return "Enter a valid time.";
  return null;
}

type TimeOfBirthFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  id?: string;
  label?: string;
  required?: boolean;
  /** Whether the "I don't know my exact birth time" checkbox is
   * checked. Only rendered when onUnknownChange is supplied. */
  unknown?: boolean;
  onUnknownChange?: (unknown: boolean) => void;
};

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const PERIODS = ["AM", "PM"];

const ITEM_H = 44;
const VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = ITEM_H * VISIBLE_ROWS;
const WHEEL_PAD = ITEM_H * Math.floor(VISIBLE_ROWS / 2);

function parseTime(value: string): { h: number; m: number } | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return { h: Number(match[1]), m: Number(match[2]) };
}

function to24Hour(hour12: number, minute: number, period: "AM" | "PM"): string {
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatDisplayTime(value: string): string | null {
  const parsed = parseTime(value);
  if (!parsed) return null;
  const period = parsed.h < 12 ? "AM" : "PM";
  const h12 = parsed.h % 12 === 0 ? 12 : parsed.h % 12;
  return `${h12}:${String(parsed.m).padStart(2, "0")} ${period}`;
}

/** One scrollable, snap-to-center wheel column (hour / minute / AM-PM).
 * Native touch scroll + `scroll-snap-type` — the same lightweight
 * pattern this codebase already uses for the mobile zodiac/testimonial
 * carousels (see ZodiacCarousel.tsx) — no drag library. Arrow keys and
 * click both work so it's a real, keyboard-usable listbox, not a
 * decorative scroller. */
function WheelColumn({
  label,
  values,
  index,
  onSelect,
}: {
  label: string;
  values: string[];
  index: number;
  onSelect: (index: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressScroll = useRef(false);

  // Keep the wheel's scroll position in sync when `index` changes from
  // outside a user scroll gesture (opening the panel, arrow-key nav,
  // clicking an option).
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const target = index * ITEM_H;
    if (Math.abs(el.scrollTop - target) < 1) return;
    suppressScroll.current = true;
    el.scrollTo({ top: target, behavior: "auto" });
    const t = setTimeout(() => {
      suppressScroll.current = false;
    }, 60);
    return () => clearTimeout(t);
  }, [index]);

  function handleScroll() {
    if (suppressScroll.current) return;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const el = listRef.current;
      if (!el) return;
      const nearest = Math.max(0, Math.min(values.length - 1, Math.round(el.scrollTop / ITEM_H)));
      if (nearest !== index) onSelect(nearest);
    }, 100);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onSelect(Math.max(0, index - 1));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onSelect(Math.min(values.length - 1, index + 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      onSelect(0);
    } else if (e.key === "End") {
      e.preventDefault();
      onSelect(values.length - 1);
    }
  }

  return (
    <div className="relative w-full">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 z-0 rounded-lg border-y border-nav-amethyst/30 bg-nav-lavender-soft/50"
        style={{ top: WHEEL_PAD, height: ITEM_H }}
      />
      <div
        ref={listRef}
        role="listbox"
        aria-label={label}
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={onKeyDown}
        className="relative z-10 overflow-y-auto scroll-smooth outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-inset [&::-webkit-scrollbar]:hidden"
        style={{ height: WHEEL_HEIGHT, scrollSnapType: "y mandatory" }}
      >
        <div style={{ height: WHEEL_PAD }} aria-hidden="true" />
        {values.map((v, i) => (
          <button
            key={v}
            type="button"
            role="option"
            aria-selected={i === index}
            tabIndex={-1}
            onClick={() => onSelect(i)}
            style={{ height: ITEM_H, scrollSnapAlign: "center" }}
            className={`flex w-full items-center justify-center text-lg transition-colors duration-150 ${
              i === index ? "font-semibold text-nav-amethyst-deep" : "text-nav-plum/45"
            }`}
          >
            {v}
          </button>
        ))}
        <div style={{ height: WHEEL_PAD }} aria-hidden="true" />
      </div>
    </div>
  );
}

/** Custom time picker (bottom sheet on mobile, anchored popover on
 * desktop — see PickerShell) replacing the native `<input type="time">`.
 * `value`/`onChange` keep the exact same 24-hour "HH:mm" string
 * contract a native time input used; the wheel itself is 12-hour
 * AM/PM, which reads more naturally for this site's audience. Keeps
 * the "I don't know my exact birth time" checkbox exactly as before. */
export function TimeOfBirthField({
  value,
  onChange,
  error,
  id,
  label = "Time of Birth",
  required = true,
  unknown = false,
  onUnknownChange,
}: TimeOfBirthFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const unknownId = `${fieldId}-unknown`;
  const panelId = `${fieldId}-panel`;
  const showError = Boolean(error) && !unknown;

  const parsed = parseTime(value);
  const initial = useMemo(() => {
    if (parsed) {
      const period: "AM" | "PM" = parsed.h < 12 ? "AM" : "PM";
      const h12 = parsed.h % 12 === 0 ? 12 : parsed.h % 12;
      return { hourIndex: h12 - 1, minuteIndex: parsed.m, periodIndex: period === "AM" ? 0 : 1 };
    }
    return { hourIndex: 11, minuteIndex: 0, periodIndex: 1 }; // default 12:00 PM
  }, [parsed]);

  const [open, setOpen] = useState(false);
  const [hourIndex, setHourIndex] = useState(initial.hourIndex);
  const [minuteIndex, setMinuteIndex] = useState(initial.minuteIndex);
  const [periodIndex, setPeriodIndex] = useState(initial.periodIndex);

  const triggerRef = useRef<HTMLButtonElement>(null);

  function openPanel() {
    if (unknown) return;
    setHourIndex(initial.hourIndex);
    setMinuteIndex(initial.minuteIndex);
    setPeriodIndex(initial.periodIndex);
    setOpen(true);
  }

  function closePanel() {
    setOpen(false);
  }

  function commit(nextHourIndex: number, nextMinuteIndex: number, nextPeriodIndex: number) {
    const period: "AM" | "PM" = nextPeriodIndex === 0 ? "AM" : "PM";
    onChange(to24Hour(nextHourIndex + 1, nextMinuteIndex, period));
  }

  const displayValue = formatDisplayTime(value);

  return (
    <div className="relative">
      <label htmlFor={fieldId} className={fieldLabelClass}>
        {label}
        {required && !unknown && <span className="text-nav-amethyst-deep"> *</span>}
      </label>
      <button
        ref={triggerRef}
        id={fieldId}
        type="button"
        onClick={() => (open ? closePanel() : openPanel())}
        disabled={unknown}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-describedby={showError ? `${hintId} ${errorId}` : hintId}
        className={`mt-1.5 flex items-center justify-between gap-2 text-left ${fieldInputClass} ${
          showError ? fieldInputErrorClass : ""
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span className={displayValue ? "text-nav-plum" : "text-nav-plum/40"}>
          {displayValue ?? "Select time of birth"}
        </span>
        <Clock className="h-4.5 w-4.5 shrink-0 text-nav-amethyst" aria-hidden="true" />
      </button>
      <p id={hintId} className={fieldHintTextClass}>
        Exact birth time improves calculation accuracy.
      </p>
      {showError && (
        <p id={errorId} role="alert" className={fieldErrorTextClass}>
          {error}
        </p>
      )}

      <input type="hidden" value={value} readOnly />

      <PickerShell
        open={open}
        onClose={closePanel}
        triggerRef={triggerRef}
        title={`${label} picker`}
        panelId={panelId}
      >
        <div className="p-4">
          <div className="flex items-center justify-center gap-2">
            <WheelColumn
              label="Hour"
              values={HOURS}
              index={hourIndex}
              onSelect={(i) => {
                setHourIndex(i);
                commit(i, minuteIndex, periodIndex);
              }}
            />
            <span className="pb-0 text-xl font-semibold text-nav-plum/40" aria-hidden="true">
              :
            </span>
            <WheelColumn
              label="Minute"
              values={MINUTES}
              index={minuteIndex}
              onSelect={(i) => {
                setMinuteIndex(i);
                commit(hourIndex, i, periodIndex);
              }}
            />
            <WheelColumn
              label="AM or PM"
              values={PERIODS}
              index={periodIndex}
              onSelect={(i) => {
                setPeriodIndex(i);
                commit(hourIndex, minuteIndex, i);
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

      {onUnknownChange && (
        <label
          htmlFor={unknownId}
          className="mt-3 flex min-h-11 w-fit cursor-pointer items-center gap-2 text-sm text-nav-plum/80"
        >
          <input
            id={unknownId}
            type="checkbox"
            checked={unknown}
            onChange={(e) => onUnknownChange(e.target.checked)}
            className="h-4 w-4 rounded accent-nav-amethyst"
          />
          I don&apos;t know my exact birth time
        </label>
      )}
    </div>
  );
}
