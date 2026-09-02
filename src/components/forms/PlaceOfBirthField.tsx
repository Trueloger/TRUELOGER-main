"use client";

import { useId } from "react";
import {
  fieldLabelClass,
  fieldInputClass,
  fieldInputErrorClass,
  fieldErrorTextClass,
  fieldHintTextClass,
} from "./field-styles";

export type PlaceOfBirthValue = {
  city: string;
  state: string;
  country: string;
};

export type PlaceOfBirthErrors = Partial<Record<keyof PlaceOfBirthValue, string>>;

/** Pure validator — city required (blocking), state/country
 * optional-but-recommended (a soft notice, not a blocking error).
 * Exported so consuming pages can re-run the same check both
 * client-side and server-side. */
export function validatePlaceOfBirth(
  value: Partial<PlaceOfBirthValue>
): PlaceOfBirthErrors {
  const errors: PlaceOfBirthErrors = {};
  if (!value.city?.trim()) {
    errors.city = "City is required.";
  }
  if (!value.state?.trim()) {
    errors.state = "Adding a state improves location accuracy.";
  }
  if (!value.country?.trim()) {
    errors.country = "Adding a country improves location accuracy.";
  }
  return errors;
}

type PlaceOfBirthFieldProps = {
  city: string;
  state: string;
  country: string;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  errors?: PlaceOfBirthErrors;
  idPrefix?: string;
};

/** City/state/country text-input group for place of birth. Plain text
 * fields, not an autocomplete/geocoding widget — no places API is
 * configured in this project. A separate lookup
 * (src/lib/astrology/geocode.ts, built elsewhere) matches the collected
 * city text to a known location server-side; this component only
 * collects the text. City is required (blocking error); state/country
 * are optional and shown only as a soft, non-blocking notice. */
export function PlaceOfBirthField({
  city,
  state,
  country,
  onCityChange,
  onStateChange,
  onCountryChange,
  errors,
  idPrefix,
}: PlaceOfBirthFieldProps) {
  const generatedId = useId();
  const prefix = idPrefix ?? generatedId;

  const cityId = `${prefix}-city`;
  const stateId = `${prefix}-state`;
  const countryId = `${prefix}-country`;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor={cityId} className={fieldLabelClass}>
            City <span className="text-nav-amethyst-deep">*</span>
          </label>
          <input
            id={cityId}
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="e.g. Jaipur"
            required
            maxLength={80}
            autoComplete="address-level2"
            aria-invalid={errors?.city ? true : undefined}
            aria-describedby={errors?.city ? `${cityId}-error` : undefined}
            className={`mt-1.5 ${fieldInputClass} ${errors?.city ? fieldInputErrorClass : ""}`}
          />
          {errors?.city && (
            <p id={`${cityId}-error`} role="alert" className={fieldErrorTextClass}>
              {errors.city}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={stateId} className={fieldLabelClass}>
            State
          </label>
          <input
            id={stateId}
            type="text"
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            placeholder="e.g. Rajasthan"
            maxLength={80}
            autoComplete="address-level1"
            aria-describedby={errors?.state ? `${stateId}-notice` : undefined}
            className={`mt-1.5 ${fieldInputClass}`}
          />
          {errors?.state && (
            <p id={`${stateId}-notice`} className={fieldHintTextClass}>
              {errors.state}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={countryId} className={fieldLabelClass}>
            Country
          </label>
          <input
            id={countryId}
            type="text"
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            placeholder="e.g. India"
            maxLength={80}
            autoComplete="country-name"
            aria-describedby={errors?.country ? `${countryId}-notice` : undefined}
            className={`mt-1.5 ${fieldInputClass}`}
          />
          {errors?.country && (
            <p id={`${countryId}-notice`} className={fieldHintTextClass}>
              {errors.country}
            </p>
          )}
        </div>
      </div>

      <p className={fieldHintTextClass}>
        We&apos;ll match this to the nearest known location for accurate
        calculations.
      </p>
    </div>
  );
}
