// src/lib/validation/birth-details.ts
// Server-safe re-implementations of the exact same validation rules as
// src/components/forms/{NameField,DateOfBirthField,TimeOfBirthField,
// PlaceOfBirthField}.tsx's validate* exports.
//
// Why duplicated instead of imported: those field files start with
// "use client" — in this Next.js version, importing ANY export from a
// "use client" module into server-only code (a Route Handler included,
// not just the RSC component tree) fails at runtime with "Attempted to
// call <fn>() from the server but <fn> is on the client" (verified by
// direct smoke test against these two new routes). src/app/api/
// numerology/route.ts already established this exact pattern — its own
// isValidCalendarDate is a from-scratch re-implementation of
// DateOfBirthField's rule, not an import — for the same reason. Keep
// these in lockstep with the client-side validators by hand; this file
// exists so the mangal-dosha and sade-sati routes share ONE
// server-side copy instead of duplicating it a second time between
// themselves.
const NAME_MAX_LENGTH = 80;
const DOB_MIN_YEAR = 1900;

export function validateNameServer(value: string): string | null {
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

export function validateDateOfBirthServer(value: string): string | null {
  const maxYear = new Date().getFullYear();

  if (!value) return "Date of birth is required.";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "Enter a valid date.";

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) return "Enter a valid date.";
  if (day < 1 || day > daysInMonth(year, month)) return "Enter a valid date.";
  if (year < DOB_MIN_YEAR || year > maxYear) {
    return `Year must be between ${DOB_MIN_YEAR} and ${maxYear}.`;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parsed = new Date(year, month - 1, day);
  if (parsed.getTime() > today.getTime()) {
    return "Date of birth cannot be in the future.";
  }

  return null;
}

export function validateTimeOfBirthServer(value: string): string | null {
  if (!value) return "Time of birth is required.";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return "Enter a valid time.";
  return null;
}

export function validateCityServer(value: string): string | null {
  return value.trim() ? null : "City is required.";
}
