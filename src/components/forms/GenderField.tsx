"use client";

import { useId } from "react";
import { fieldLabelClass, fieldErrorTextClass } from "./field-styles";

export type Gender = "male" | "female" | "other";

const OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

type GenderFieldProps = {
  value: Gender | "";
  onChange: (value: Gender) => void;
  error?: string | null;
  id?: string;
  label?: string;
  required?: boolean;
};

/** Accessible radio-group for Male/Female/Other. Only rendered by pages
 * that actually need it (e.g. Kundli Matching) — this component just
 * takes value/onChange/error, the caller decides whether to render it
 * at all. Native fieldset/legend grouping, 44px+ touch targets, a
 * focus-visible ring on the option itself via the `has-` variant. */
export function GenderField({
  value,
  onChange,
  error,
  id,
  label = "Gender",
  required = false,
}: GenderFieldProps) {
  const generatedId = useId();
  const groupId = id ?? generatedId;
  const errorId = `${groupId}-error`;

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className={fieldLabelClass}>
        {label}
        {required && <span className="text-nav-amethyst-deep"> *</span>}
      </legend>
      <div
        role="radiogroup"
        aria-required={required || undefined}
        className="mt-2 flex flex-wrap gap-3"
      >
        {OPTIONS.map((option) => {
          const optionId = `${groupId}-${option.value}`;
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-nav-amethyst has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-nav-pearl ${
                checked
                  ? "border-nav-amethyst bg-nav-lavender-soft text-nav-plum"
                  : "border-nav-lavender-line bg-nav-pearl text-nav-plum/80 hover:border-nav-amethyst/50"
              }`}
            >
              <input
                id={optionId}
                type="radio"
                name={groupId}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                required={required}
                className="h-4 w-4 accent-nav-amethyst"
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} role="alert" className={fieldErrorTextClass}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
