// src/app/api/ascendant/route.ts
import { NextResponse } from "next/server";
import { calculateChart, type ChartPlanetEntry, type ChartPlanetName } from "@/lib/astro-engine/ephemeris";
import { deriveRashi } from "@/lib/astrology/derive";
import type { BirthInput } from "@/lib/astrology/types";
import {
  validateBirthRequestBody,
  buildBirthInput,
  type BirthRequestBody,
} from "@/lib/astrology/birth-request";
import { getRashiReference } from "@/lib/astrology/rashi-reference";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit/firestore-rate-limit";
import { generateStructuredReport, type StructuredReport } from "@/lib/ai/report";

// AI-report layer generation can take a few seconds even though chart
// calculation itself is now local and instant.
export const maxDuration = 30;

/** BirthInput (`timezone` = the birth location's UTC offset in hours)
 * -> the actual UTC instant, for calculateChart(). */
function birthInputToUtc(input: BirthInput): Date {
  const localMs = Date.UTC(
    input.year,
    input.month - 1,
    input.date,
    input.hours,
    input.minutes,
    input.seconds
  );
  return new Date(localMs - input.timezone * 60 * 60 * 1000);
}

export async function POST(request: Request) {
  let body: BirthRequestBody;
  try {
    body = (await request.json()) as BirthRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validated = validateBirthRequestBody(body ?? {});
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const birthInput = buildBirthInput(validated);
  if ("error" in birthInput) {
    return NextResponse.json({ error: birthInput.error }, { status: 400 });
  }

  const identifier = getClientIdentifier(request);
  const rateLimit = await checkRateLimit("ascendant", identifier, {
    limit: 10,
    windowSeconds: 60,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "You've made too many requests. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  // The Ascendant comes straight from the local sidereal chart — already
  // whole-sign consistent with the rest of the new engine, no separate
  // tropical house-system call needed (that was the old FreeAstrologyAPI
  // /western/houses distinction; not applicable here).
  let ascendant;
  let chartResponse: {
    ascendantSign: number;
    planets: Record<ChartPlanetName, { sign: number; house: number; isRetrograde: boolean; degree: number }>;
  };
  try {
    const birthUtc = birthInputToUtc(birthInput);
    const chart = calculateChart(birthUtc, birthInput.latitude, birthInput.longitude);
    ascendant = chart.ascendant;
    chartResponse = {
      ascendantSign: chart.ascendant.sign,
      planets: Object.fromEntries(
        (Object.entries(chart.planets) as [ChartPlanetName, ChartPlanetEntry][]).map(([name, entry]) => [
          name,
          { sign: entry.sign, house: entry.house, isRetrograde: entry.isRetrograde, degree: entry.degree },
        ])
      ) as Record<ChartPlanetName, { sign: number; house: number; isRetrograde: boolean; degree: number }>,
    };
  } catch (err) {
    console.error(
      "[ascendant] chart calculation failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    return NextResponse.json(
      { error: "We couldn't calculate your Ascendant right now. Please try again shortly." },
      { status: 502 }
    );
  }

  const rashiRef = getRashiReference(ascendant.sign);
  const rashi = deriveRashi(ascendant.longitude);

  // Every value below is read straight off the local chart calculation
  // (or this project's own static, well-established sign reference
  // table) — never invented.
  const calculated = {
    signNumber: ascendant.sign,
    signName: rashi.signName,
    element: rashiRef?.element ?? null,
    rulingPlanet: rashiRef?.rulingPlanet ?? "",
    traits: rashiRef?.traits ?? null,
    degreeInSign: ascendant.degree,
    fullDegree: ascendant.longitude,
    timeUnknown: validated.timeUnknown,
  };

  // The real calculated Ascendant must always reach the client, even if
  // the AI-interpretation layer fails.
  let report: StructuredReport | null = null;
  let reportError = false;
  try {
    report = await generateStructuredReport(
      "ascendant",
      calculated,
      'Write a warm, grounded Vedic Ascendant (Lagna) reading for this person. Cover exactly 3 sections: (1) titled "Your Rising Sign — <sign name>", explaining the sign\'s element and ruling planet and what the Ascendant traditionally represents (the outward personality and how one meets the world); (2) titled "<sign name> Rising", going deeper on first impressions, appearance, and approach to life; (3) titled "Living With Your Ascendant", offering practical, grounded suggestions. Keep each section to 3-5 sentences.'
    );
  } catch (err) {
    // Never log the user's name/DOB/exact coordinates — only the
    // failure and which step it happened in.
    console.error(
      "[ascendant] report generation failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    reportError = true;
  }

  return NextResponse.json({ calculated, chart: chartResponse, report, reportError });
}
