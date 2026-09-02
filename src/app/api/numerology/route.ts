// src/app/api/numerology/route.ts
import { NextResponse } from "next/server";
import {
  lifePathNumber,
  destinyNumber,
  soulUrgeNumber,
  personalityNumber,
  birthNumber,
} from "@/lib/numerology/calculate";
import { NUMBER_MEANINGS } from "@/lib/numerology/meanings";
import { generateStructuredReport, type StructuredReport } from "@/lib/ai/report";

// The AI-interpretation call can take a few seconds; the calculation
// itself is instant, deterministic math with no external dependency.
export const maxDuration = 30;

const MIN_BIRTH_YEAR = 1900;

// Plain JS Date round-trip check, matching the style (not the file) of
// src/lib/horoscope/date.ts's single-purpose date helper — deliberately
// self-contained rather than importing the parallel BirthDetailsForm
// work's validateDateOfBirth, since this tool has no other dependency on
// that shared form-field component.
function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

type RequestBody = { fullName?: unknown; dateOfBirth?: unknown };
type ValidInput = { fullName: string; dateOfBirth: string };

/** Server-side validation — never trust client input. Mirrors the
 * client-side checks in NumerologyForm.tsx exactly (name non-empty with
 * at least one letter, DOB a real calendar date within a sane year
 * range, not in the future). */
function validateInput(body: RequestBody): ValidInput | { error: string } {
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (!fullName) return { error: "Please enter your full name." };
  if (!/[a-zA-Z]/.test(fullName)) return { error: "Full name must include letters." };

  const dateOfBirth = typeof body.dateOfBirth === "string" ? body.dateOfBirth : "";
  if (!isValidCalendarDate(dateOfBirth)) {
    return { error: "Please enter a valid date of birth." };
  }

  const year = Number(dateOfBirth.slice(0, 4));
  const maxYear = new Date().getFullYear();
  if (year < MIN_BIRTH_YEAR || year > maxYear) {
    return { error: `Year of birth must be between ${MIN_BIRTH_YEAR} and ${maxYear}.` };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(dateOfBirth) > today) {
    return { error: "Date of birth cannot be in the future." };
  }

  return { fullName, dateOfBirth };
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validated = validateInput(body ?? {});
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }
  const { fullName, dateOfBirth } = validated;

  // Pure, deterministic, instant — no external API, no caching needed.
  const calculated = {
    lifePathNumber: lifePathNumber(dateOfBirth),
    destinyNumber: destinyNumber(fullName),
    soulUrgeNumber: soulUrgeNumber(fullName),
    personalityNumber: personalityNumber(fullName),
    birthNumber: birthNumber(dateOfBirth),
  };

  const meanings = {
    lifePathNumber: NUMBER_MEANINGS[calculated.lifePathNumber],
    destinyNumber: NUMBER_MEANINGS[calculated.destinyNumber],
    soulUrgeNumber: NUMBER_MEANINGS[calculated.soulUrgeNumber],
    personalityNumber: NUMBER_MEANINGS[calculated.personalityNumber],
    birthNumber: NUMBER_MEANINGS[calculated.birthNumber],
  };

  // The deterministic numbers above must always reach the client, even
  // if the AI-interpretation layer fails — an AI outage never hides real
  // calculated data.
  let report: StructuredReport | null = null;
  let reportError = false;
  try {
    report = await generateStructuredReport(
      "numerology",
      { ...calculated, meanings },
      'Write a warm, grounded numerology reading for this person. Cover exactly 4 sections, one each for: Life Path Number (their overall life direction), Destiny Number (their life purpose and potential), Soul Urge Number (their inner motivation and heart\'s true desire), and Personality Number (the outward impression others tend to pick up on). Title each section "<Number type> — <the calculated number>" and keep each section to 3-5 sentences.'
    );
  } catch (err) {
    // Never log the user's name or date of birth — only the failure and
    // which step it happened in.
    console.error(
      "[numerology] report generation failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    reportError = true;
  }

  return NextResponse.json({ calculated, meanings, report, reportError });
}
