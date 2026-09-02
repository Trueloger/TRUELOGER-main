// src/lib/astrology/birth-request.ts
// Shared server-side request handling for the Rashi/Nakshatra/Ascendant
// API routes: validate a BirthDetailsForm submission (mirroring the
// client field validators exactly — never trust client input) and turn
// it into a real BirthInput via the curated city table. One place so
// the three routes (identical needs: name/DOB/TOB/place -> BirthInput)
// don't triplicate this logic and risk drifting apart.
//
// The validators below are a deliberate MIRROR of
// src/components/forms/{NameField,DateOfBirthField,TimeOfBirthField,
// PlaceOfBirthField}.tsx's exported validate* functions, not an import
// of them — those files are "use client" modules, and this Next.js
// version enforces the client/server boundary at runtime (confirmed by
// direct call): "Attempted to call validateName() from the server but
// validateName is on the client." Same reason src/app/api/numerology/
// route.ts re-implements its own date check instead of importing
// NumerologyForm.tsx's. Keep this logic in sync with those four files
// by hand if their rules ever change.
import { resolveCityCoordinates } from "./geocode.ts";
import type { BirthInput } from "./types.ts";

const NAME_MAX_LENGTH = 80;
const MIN_BIRTH_YEAR = 1900;

function validateName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Name is required.";
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function validateDateOfBirth(value: string): string | null {
  const maxYear = new Date().getFullYear();
  if (!value) return "Date of birth is required.";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "Enter a valid date.";

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) return "Enter a valid date.";
  if (day < 1 || day > daysInMonth(year, month)) return "Enter a valid date.";
  if (year < MIN_BIRTH_YEAR || year > maxYear) {
    return `Year must be between ${MIN_BIRTH_YEAR} and ${maxYear}.`;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parsed = new Date(year, month - 1, day);
  if (parsed.getTime() > today.getTime()) {
    return "Date of birth cannot be in the future.";
  }

  return null;
}

function validateTimeOfBirth(value: string): string | null {
  if (!value) return "Time of birth is required.";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return "Enter a valid time.";
  return null;
}

export type BirthRequestBody = {
  name?: unknown;
  dateOfBirth?: unknown;
  timeOfBirth?: unknown;
  timeUnknown?: unknown;
  city?: unknown;
  state?: unknown;
  country?: unknown;
};

export type ValidBirthRequest = {
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  timeOfBirth: string; // HH:MM — forced to "12:00" when timeUnknown is true
  timeUnknown: boolean;
  city: string;
};

/** Server-side validation mirroring the client field validators exactly
 * (see the module comment above for why this is a mirror, not an
 * import) — never trust client input. State/country are soft-optional
 * client-side (see PlaceOfBirthField) so they stay non-blocking here
 * too; only city is required (it's the only one that feeds geocoding).
 * When `timeUnknown` is true, the submitted time is ignored and
 * replaced with noon (12:00) rather than validated — the caller's UI is
 * responsible for disclosing that an unknown birth time can shift the
 * result near a sign/nakshatra boundary. */
export function validateBirthRequestBody(
  body: BirthRequestBody
): ValidBirthRequest | { error: string } {
  const name = typeof body.name === "string" ? body.name : "";
  const nameError = validateName(name);
  if (nameError) return { error: nameError };

  const dateOfBirth = typeof body.dateOfBirth === "string" ? body.dateOfBirth : "";
  const dobError = validateDateOfBirth(dateOfBirth);
  if (dobError) return { error: dobError };

  const timeUnknown = body.timeUnknown === true;
  let timeOfBirth = typeof body.timeOfBirth === "string" ? body.timeOfBirth : "";
  if (timeUnknown) {
    timeOfBirth = "12:00";
  } else {
    const timeError = validateTimeOfBirth(timeOfBirth);
    if (timeError) return { error: timeError };
  }

  const city = typeof body.city === "string" ? body.city : "";
  if (!city.trim()) return { error: "City is required." };

  return {
    name: name.trim(),
    dateOfBirth,
    timeOfBirth,
    timeUnknown,
    city: city.trim(),
  };
}

/** Resolves `city` to real coordinates via the curated India-city table
 * and builds a BirthInput. Returns `{ error }` (400-worthy) when the
 * city isn't recognized — never fabricates latitude/longitude. */
export function buildBirthInput(valid: ValidBirthRequest): BirthInput | { error: string } {
  const coords = resolveCityCoordinates(valid.city);
  if (!coords) {
    return {
      error:
        "We don't recognize that city — please check the spelling or try a nearby major city.",
    };
  }

  const [year, month, date] = valid.dateOfBirth.split("-").map(Number);
  const [hours, minutes] = valid.timeOfBirth.split(":").map(Number);

  return {
    year,
    month,
    date,
    hours,
    minutes,
    seconds: 0,
    latitude: coords.lat,
    longitude: coords.lon,
    timezone: coords.timezone,
  };
}
