"use client";

import type { FormEvent } from "react";
import { NameField } from "./NameField";
import { GenderField, type Gender } from "./GenderField";
import { DateOfBirthField } from "./DateOfBirthField";
import { TimeOfBirthField } from "./TimeOfBirthField";
import { PlaceOfBirthField } from "./PlaceOfBirthField";

export type BirthDetailsValues = {
  name: string;
  gender: Gender | "";
  dateOfBirth: string;
  timeOfBirth: string;
  timeUnknown: boolean;
  city: string;
  state: string;
  country: string;
};

export type BirthDetailsErrors = Partial<
  Record<
    "name" | "gender" | "dateOfBirth" | "timeOfBirth" | "city" | "state" | "country",
    string
  >
>;

type BirthDetailsFormProps = {
  values: BirthDetailsValues;
  onChange: (values: BirthDetailsValues) => void;
  errors?: BirthDetailsErrors;
  /** Kundli Matching needs it, most single-chart tools don't — the
   * caller decides. Defaults to hidden. */
  showGender?: boolean;
  /** Whether time of birth is required for this tool. Still renders the
   * "I don't know my exact birth time" toggle either way; the caller
   * decides what an unknown time means for its calculation. */
  requireTime?: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel?: string;
  submitting?: boolean;
  /** Prefix for every field's id, so a page rendering two of these
   * side-by-side (Kundli Matching, Person A/B) never collides ids. */
  idPrefix?: string;
  /** Hides this instance's own submit button. Defaults to true (every
   * existing single-person tool is unaffected). A page rendering this
   * component twice for a two-person tool (Kundli Matching,
   * Compatibility) sets this false on BOTH instances and renders its
   * own single combined submit button/handler outside — this component
   * intentionally has no notion of "two people", so it can't render a
   * combined button itself. */
  showSubmitButton?: boolean;
};

/** Composed birth-details form: Name + optional Gender + Date of Birth +
 * Time of Birth (with unknown-time toggle) + Place of Birth. Controlled
 * entirely via props — no internal form state beyond the small field
 * components' own UI-only toggles — so the consuming page owns real
 * form state and submit handling. Handles ONE person's data; for
 * Kundli Matching the consuming page renders two of these
 * side-by-side/stacked for Person A/B. */
export function BirthDetailsForm({
  values,
  onChange,
  errors,
  showGender = false,
  requireTime = true,
  onSubmit,
  submitLabel = "Generate",
  submitting = false,
  idPrefix,
  showSubmitButton = true,
}: BirthDetailsFormProps) {
  const update = <K extends keyof BirthDetailsValues>(
    key: K,
    value: BirthDetailsValues[K]
  ) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <NameField
        value={values.name}
        onChange={(value) => update("name", value)}
        error={errors?.name}
        id={idPrefix ? `${idPrefix}-name` : undefined}
      />

      {showGender && (
        <GenderField
          value={values.gender}
          onChange={(value) => update("gender", value)}
          error={errors?.gender}
          id={idPrefix ? `${idPrefix}-gender` : undefined}
        />
      )}

      <DateOfBirthField
        value={values.dateOfBirth}
        onChange={(value) => update("dateOfBirth", value)}
        error={errors?.dateOfBirth}
        id={idPrefix ? `${idPrefix}-dob` : undefined}
      />

      <TimeOfBirthField
        value={values.timeOfBirth}
        onChange={(value) => update("timeOfBirth", value)}
        error={errors?.timeOfBirth}
        required={requireTime}
        unknown={values.timeUnknown}
        onUnknownChange={(unknown) => update("timeUnknown", unknown)}
        id={idPrefix ? `${idPrefix}-time` : undefined}
      />

      <PlaceOfBirthField
        city={values.city}
        state={values.state}
        country={values.country}
        onCityChange={(value) => update("city", value)}
        onStateChange={(value) => update("state", value)}
        onCountryChange={(value) => update("country", value)}
        errors={{ city: errors?.city, state: errors?.state, country: errors?.country }}
        idPrefix={idPrefix ? `${idPrefix}-place` : undefined}
      />

      {showSubmitButton && (
        <button
          type="submit"
          disabled={submitting}
          className="flex min-h-11 w-full items-center justify-center rounded-full bg-nav-amethyst px-6 py-3 text-sm font-medium tracking-wide text-white shadow-[0_4px_14px_rgba(90,55,140,0.28)] transition-colors duration-200 hover:bg-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {submitting ? "Please wait…" : submitLabel}
        </button>
      )}
    </form>
  );
}
