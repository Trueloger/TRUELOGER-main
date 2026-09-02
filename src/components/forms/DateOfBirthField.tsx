"use client";

import { useId } from "react";
import {
  fieldLabelClass,
  fieldInputClass,
  fieldInputErrorClass,
  fieldErrorTextClass,
} from "./field-styles";

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

/** Native `<input type="date">`, styled to match the site — the
 * simplest, most reliable date picker on mobile, not a custom JS
 * calendar widget. minYear/maxYear are enforced both via the native
 * min/max attrs (a first UX guard) and via validateDateOfBirth, which
 * callers should run on submit for real validation. */
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

  return (
    <div>
      <label htmlFor={fieldId} className={fieldLabelClass}>
        {label}
        {required && <span className="text-nav-amethyst-deep"> *</span>}
      </label>
      <input
        id={fieldId}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={`${minYear}-01-01`}
        max={`${maxYear}-12-31`}
        required={required}
        autoComplete="bday"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-1.5 ${fieldInputClass} ${error ? fieldInputErrorClass : ""}`}
      />
      {error && (
        <p id={errorId} role="alert" className={fieldErrorTextClass}>
          {error}
        </p>
      )}
    </div>
  );
}
