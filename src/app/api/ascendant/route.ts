// src/app/api/ascendant/route.ts
import { NextResponse } from "next/server";
import { getPlanetPositions } from "@/lib/astrology/freeastrologyapi";
import {
  validateBirthRequestBody,
  buildBirthInput,
  type BirthRequestBody,
} from "@/lib/astrology/birth-request";
import { getRashiReference } from "@/lib/astrology/rashi-reference";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit/firestore-rate-limit";
import { generateStructuredReport, type StructuredReport } from "@/lib/ai/report";

// Calls a metered external API (FreeAstrologyAPI) plus the AI-report
// layer, so give it real room — unlike numerology's pure-math route.
export const maxDuration = 30;

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

  let planets;
  try {
    planets = await getPlanetPositions(birthInput);
  } catch (err) {
    console.error(
      "[ascendant] planet position lookup failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    return NextResponse.json(
      { error: "We couldn't calculate your Ascendant right now. Please try again shortly." },
      { status: 502 }
    );
  }

  // The Ascendant IS one of the PlanetName keys in /planets/extended's
  // response — no separate /western/houses call needed (that's a
  // different, tropical house system; see freeastrologyapi.ts).
  const ascendant = planets.output.Ascendant;
  if (!ascendant) {
    console.error("[ascendant] planet position response missing Ascendant entry");
    return NextResponse.json(
      { error: "We couldn't calculate your Ascendant right now. Please try again shortly." },
      { status: 502 }
    );
  }

  const rashiRef = getRashiReference(ascendant.current_sign);

  // Every value below is read straight off the real API response (or
  // this project's own static, well-established sign reference table) —
  // never invented.
  const calculated = {
    signNumber: ascendant.current_sign,
    signName: ascendant.zodiac_sign_name,
    element: rashiRef?.element ?? null,
    rulingPlanet: rashiRef?.rulingPlanet ?? ascendant.zodiac_sign_lord,
    traits: rashiRef?.traits ?? null,
    degreeInSign: ascendant.normDegree,
    fullDegree: ascendant.fullDegree,
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

  return NextResponse.json({ calculated, report, reportError });
}
