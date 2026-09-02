"use client";

import { useId } from "react";
import {
  fieldLabelClass,
  fieldInputClass,
  fieldInputErrorClass,
  fieldErrorTextClass,
  fieldHintTextClass,
} from "./field-styles";

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

/** Native `<input type="time">`, styled to match the site, plus an
 * accuracy hint and an optional "I don't know my exact birth time"
 * checkbox. Checking it disables the time input and reports the change
 * up via onUnknownChange — this component does not decide what an
 * unknown time means for calculation (defaulting to noon with a
 * caveat, blocking submission, etc.); that's tool-specific and belongs
 * to the caller. */
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
  const showError = Boolean(error) && !unknown;

  return (
    <div>
      <label htmlFor={fieldId} className={fieldLabelClass}>
        {label}
        {required && !unknown && <span className="text-nav-amethyst-deep"> *</span>}
      </label>
      <input
        id={fieldId}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={unknown}
        required={required && !unknown}
        aria-invalid={showError ? true : undefined}
        aria-describedby={showError ? `${hintId} ${errorId}` : hintId}
        className={`mt-1.5 ${fieldInputClass} ${showError ? fieldInputErrorClass : ""} disabled:cursor-not-allowed disabled:opacity-50`}
      />
      <p id={hintId} className={fieldHintTextClass}>
        Exact birth time improves calculation accuracy.
      </p>
      {showError && (
        <p id={errorId} role="alert" className={fieldErrorTextClass}>
          {error}
        </p>
      )}

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
