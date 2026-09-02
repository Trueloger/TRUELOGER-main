"use client";

import { useId } from "react";
import {
  fieldLabelClass,
  fieldInputClass,
  fieldInputErrorClass,
  fieldErrorTextClass,
} from "./field-styles";

const DEFAULT_MAX_LENGTH = 80;

/** Pure validator — required, non-empty after trim, reasonable max
 * length. Exported so consuming pages can re-run the same check both
 * client-side (before submit) and server-side. */
export function validateName(
  value: string,
  opts?: { maxLength?: number; label?: string }
): string | null {
  const maxLength = opts?.maxLength ?? DEFAULT_MAX_LENGTH;
  const label = opts?.label ?? "Name";
  const trimmed = value.trim();

  if (!trimmed) return `${label} is required.`;
  if (trimmed.length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }
  return null;
}

type NameFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  id?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
};

/** Plain required text input for a person's full name. Self-contained
 * label + error rendering, id-linked via aria-describedby, 44px+ touch
 * target, matching the rest of forms/. */
export function NameField({
  value,
  onChange,
  error,
  id,
  label = "Full Name",
  placeholder = "Enter full name",
  required = true,
  maxLength = DEFAULT_MAX_LENGTH,
}: NameFieldProps) {
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
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        autoComplete="name"
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
