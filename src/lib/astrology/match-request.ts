// src/lib/astrology/match-request.ts
// Shared server-side request handling for the two two-person matching
// tools — Kundli Matching (src/app/api/kundli-matching/route.ts) and
// Compatibility (src/app/api/compatibility/route.ts). Both routes
// collect two BirthDetailsForm submissions (see BirthDetailsForm's
// idPrefix prop, rendered twice per page) and need the identical
// validate -> geocode -> BirthInput pipeline, run once per person, with
// a caller-supplied `label` (e.g. "Bride", "Groom", "You", "Your
// partner") prefixed onto every error message so a two-person request's
// 400 always names WHICH person's field failed. See each route.ts's top
// comment for why both tools then feed the two resulting BirthInputs
// into the SAME getAshtakootMatch() calculation.
//
// IMPORTANT — verified real Next.js 16 runtime bug, not a style choice:
// this file deliberately does NOT import validateName/validateDateOfBirth/
// validateTimeOfBirth/validatePlaceOfBirth from src/components/forms/*
// (those files start with "use client"). Doing so type-checks fine and
// even survives `next build`, but THROWS at request time in this
// Next.js version: "Attempted to call <fn>() from the server but <fn>
// is on the client. It's not possible to invoke a client function from
// the server" — confirmed via a real dev-server smoke test against this
// exact code path (500 on every request) before this file was rewritten
// to be self-contained. Several other already-built single-person tools
// in this codebase (e.g. src/app/api/mangal-dosha/route.ts,
// src/app/api/dasha/route.ts) DO import those client validators
// directly and are consequently subject to this same runtime error —
// that's a pre-existing bug in those files, out of scope to fix here
// (see this feature's task instructions), but it is why this file
// mirrors those validators' RULES instead of importing the functions
// themselves — the same approach src/app/api/numerology/route.ts
// already uses for exactly this reason.
import { resolveCityCoordinates } from "./geocode.ts";
import type { BirthInput } from "./types.ts";

const MIN_BIRTH_YEAR = 1900;
const MAX_NAME_LENGTH = 80;

function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** Mirrors DateOfBirthField.tsx's validateDateOfBirth exactly (real
 * calendar-date validity, a sane year range, no future dates) — see
 * this file's top comment for why it's not imported directly. */
function validateDob(value: string): string | null {
  if (!value) return "Date of birth is required.";
  if (!isValidCalendarDate(value)) return "Enter a valid date.";

  const year = Number(value.slice(0, 4));
  const maxYear = new Date().getFullYear();
  if (year < MIN_BIRTH_YEAR || year > maxYear) {
    return `Year must be between ${MIN_BIRTH_YEAR} and ${maxYear}.`;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(value) > today) return "Date of birth cannot be in the future.";

  return null;
}

/** Mirrors TimeOfBirthField.tsx's validateTimeOfBirth exactly. */
function validateTime(value: string): string | null {
  if (!value) return "Time of birth is required.";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return "Enter a valid time.";
  return null;
}

export type RawPersonInput = {
  name?: unknown;
  dateOfBirth?: unknown;
  timeOfBirth?: unknown;
  timeUnknown?: unknown;
  city?: unknown;
  state?: unknown;
  country?: unknown;
};

export type ValidPersonInput = {
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  timeOfBirth: string; // HH:MM — forced to "12:00" when timeUnknown is true
  timeUnknown: boolean;
  city: string;
};

/** Validates one person's raw request-body fields, mirroring (never
 * trusting client input) the same rules BirthDetailsForm's fields
 * enforce client-side. `label` is prefixed onto every error message so
 * the two calls this module's callers make (one per person) never
 * produce an ambiguous error. State/country stay soft-optional (see
 * PlaceOfBirthField); only name/DOB/time/city are blocking.
 *
 * An unknown birth time is still ALLOWED here (defaulted to noon,
 * exactly like every single-person tool) rather than blocked — but
 * Ashtakoot's Tara/Yoni/Gana/Bhakoot/Nadi kootas are all derived from
 * the Moon's nakshatra, which can change within a single day, so an
 * unknown time on EITHER person meaningfully changes the result more
 * than for most single-chart tools. Callers must disclose that caveat
 * clearly in the result UI (both Kundli Matching and Compatibility do,
 * via the `timeUnknown` flag their routes return). */
export function validateMatchPersonInput(
  raw: RawPersonInput | undefined,
  label: string
): ValidPersonInput | { error: string } {
  const name = typeof raw?.name === "string" ? raw.name.trim() : "";
  if (!name) return { error: `${label}: Name is required.` };
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `${label}: Name must be ${MAX_NAME_LENGTH} characters or fewer.` };
  }

  const dateOfBirth = typeof raw?.dateOfBirth === "string" ? raw.dateOfBirth : "";
  const dobError = validateDob(dateOfBirth);
  if (dobError) return { error: `${label}: ${dobError}` };

  const timeUnknown = raw?.timeUnknown === true;
  let timeOfBirth = typeof raw?.timeOfBirth === "string" ? raw.timeOfBirth : "";
  if (timeUnknown) {
    timeOfBirth = "12:00";
  } else {
    const timeError = validateTime(timeOfBirth);
    if (timeError) return { error: `${label}: ${timeError}` };
  }

  const city = typeof raw?.city === "string" ? raw.city.trim() : "";
  if (!city) return { error: `${label}: City is required.` };

  return { name, dateOfBirth, timeOfBirth, timeUnknown, city };
}

/** Resolves a validated person's city to real coordinates (curated
 * India-city table — see geocode.ts) and assembles a real BirthInput.
 * Returns a named `{ error }` — never a fabricated coordinate — when
 * the city isn't recognized. */
export function buildMatchBirthInput(
  valid: ValidPersonInput,
  label: string
): BirthInput | { error: string } {
  const coords = resolveCityCoordinates(valid.city);
  if (!coords) {
    return {
      error: `${label}: we couldn't recognize "${valid.city}" as a known city. Please check the spelling or try a nearby major city.`,
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
