"use client";

import { useEffect, useId, useRef, useState } from "react";
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

// Compact client-side copy of the India cities dataset: rows of
// [name, state, lat, lon] (no population — that's only needed for the
// server-side resolveCityCoordinates tiebreak in geocode.ts). Fetched
// once, lazily, and cached at module scope so every PlaceOfBirthField
// instance on a page shares one download/parse. lat/lon aren't used by
// this component (state is), but kept in the shared shape so this file
// stays a straight subset of src/lib/astrology/india-cities.json.
type CityRow = [name: string, state: string, lat: number, lon: number];

let citiesPromise: Promise<CityRow[]> | null = null;
function loadCities(): Promise<CityRow[]> {
  if (!citiesPromise) {
    citiesPromise = fetch("/data/india-cities.json")
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => []);
  }
  return citiesPromise;
}

type Suggestion = { name: string; state: string };

const MIN_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 8;
const DEBOUNCE_MS = 200;

function searchCityRows(rows: CityRow[], query: string): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < MIN_QUERY_LENGTH) return [];

  const prefix: CityRow[] = [];
  const substring: CityRow[] = [];
  for (const row of rows) {
    const nameLower = row[0].toLowerCase();
    if (nameLower.startsWith(q)) prefix.push(row);
    else if (nameLower.includes(q)) substring.push(row);
  }

  return [...prefix, ...substring]
    .slice(0, MAX_SUGGESTIONS)
    .map(([name, state]) => ({ name, state }));
}

/** City/state/country text-input group for place of birth. The city
 * field is a hand-built WAI-ARIA combobox: as the user types (2+ chars),
 * it debounces and searches a client-fetched India cities dataset
 * (public/data/india-cities.json) and shows matching city+state
 * suggestions; picking one fills city AND state. Typing a city that
 * isn't in the suggestion list is still allowed — this is a UX aid, not
 * a hard constraint — the authoritative match happens server-side via
 * resolveCityCoordinates (src/lib/astrology/geocode.ts), which 400s if
 * the typed city genuinely can't be resolved. */
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
  const listboxId = `${prefix}-city-listbox`;

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suppressNextSearch = useRef(false);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Close the dropdown on outside click.
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function runSearch(query: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const rows = await loadCities();
      const results = searchCityRows(rows, query);
      setSuggestions(results);
      setOpen(results.length > 0);
      setActiveIndex(-1);
    }, DEBOUNCE_MS);
  }

  function handleCityInputChange(value: string) {
    onCityChange(value);
    if (suppressNextSearch.current) {
      suppressNextSearch.current = false;
      setOpen(false);
      return;
    }
    if (value.trim().length < MIN_QUERY_LENGTH) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    runSearch(value);
  }

  function selectSuggestion(suggestion: Suggestion) {
    suppressNextSearch.current = true;
    onCityChange(suggestion.name);
    onStateChange(suggestion.state);
    setOpen(false);
    setActiveIndex(-1);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        break;
      case "Enter":
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          e.preventDefault();
          selectSuggestion(suggestions[activeIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  }

  const activeDescendantId =
    activeIndex >= 0 && activeIndex < suggestions.length
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div ref={containerRef} className="relative">
          <label htmlFor={cityId} className={fieldLabelClass}>
            City <span className="text-nav-amethyst-deep">*</span>
          </label>
          <input
            id={cityId}
            type="text"
            value={city}
            onChange={(e) => handleCityInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setOpen(true);
            }}
            placeholder="e.g. Jaipur"
            required
            maxLength={80}
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={activeDescendantId}
            aria-invalid={errors?.city ? true : undefined}
            aria-describedby={errors?.city ? `${cityId}-error` : undefined}
            className={`mt-1.5 ${fieldInputClass} ${errors?.city ? fieldInputErrorClass : ""}`}
          />
          {errors?.city && (
            <p id={`${cityId}-error`} role="alert" className={fieldErrorTextClass}>
              {errors.city}
            </p>
          )}

          {open && suggestions.length > 0 && (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="City suggestions"
              className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-50 max-h-64 overflow-y-auto rounded-xl border border-nav-lavender-line bg-nav-pearl p-1.5 shadow-[0_12px_32px_rgba(80,50,130,0.14)]"
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion.name}-${suggestion.state}-${index}`}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseDown={(e) => {
                    // mousedown (not click) so this fires before the
                    // input's blur/outside-click handler closes the list.
                    e.preventDefault();
                    selectSuggestion(suggestion);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex cursor-pointer items-baseline justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
                    index === activeIndex
                      ? "bg-nav-lavender-soft text-nav-violet"
                      : "text-nav-plum hover:bg-nav-lavender-soft hover:text-nav-violet"
                  }`}
                >
                  <span className="font-medium">{suggestion.name}</span>
                  {suggestion.state && (
                    <span className="shrink-0 text-xs text-nav-plum/60">
                      {suggestion.state}
                    </span>
                  )}
                </li>
              ))}
            </ul>
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
