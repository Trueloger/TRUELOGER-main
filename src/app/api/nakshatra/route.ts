// src/app/api/nakshatra/route.ts
import { NextResponse } from "next/server";
import { getPlanetPositions } from "@/lib/astrology/freeastrologyapi";
import {
  validateBirthRequestBody,
  buildBirthInput,
  type BirthRequestBody,
} from "@/lib/astrology/birth-request";
import { getNakshatraReference } from "@/lib/astrology/nakshatra-reference";
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
  const rateLimit = await checkRateLimit("nakshatra", identifier, {
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
      "[nakshatra] planet position lookup failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    return NextResponse.json(
      { error: "We couldn't calculate your Nakshatra right now. Please try again shortly." },
      { status: 502 }
    );
  }

  const moon = planets.output.Moon;
  if (!moon) {
    console.error("[nakshatra] planet position response missing Moon entry");
    return NextResponse.json(
      { error: "We couldn't calculate your Nakshatra right now. Please try again shortly." },
      { status: 502 }
    );
  }

  const nakshatraRef = getNakshatraReference(moon.nakshatra_number);

  // Every value below is read straight off the real API response (or
  // this project's own static, well-established nakshatra reference
  // table) — never invented.
  const calculated = {
    nakshatraNumber: moon.nakshatra_number,
    nakshatraName: moon.nakshatra_name,
    pada: moon.nakshatra_pada,
    vimsottariLord: moon.nakshatra_vimsottari_lord,
    deity: nakshatraRef?.deity ?? null,
    symbol: nakshatraRef?.symbol ?? null,
    moonSign: moon.zodiac_sign_name,
    degreeInSign: moon.normDegree,
    timeUnknown: validated.timeUnknown,
  };

  // The real calculated Nakshatra must always reach the client, even if
  // the AI-interpretation layer fails.
  let report: StructuredReport | null = null;
  let reportError = false;
  try {
    report = await generateStructuredReport(
      "nakshatra",
      calculated,
      'Write a warm, grounded Vedic Nakshatra reading for this person. Cover exactly 3 sections: (1) titled "Your Nakshatra — <nakshatra name>, Pada <pada>", introducing the nakshatra\'s ruling deity and symbol and what they traditionally represent; (2) titled "Ruled by <vimsottari lord>", explaining what that planetary rulership traditionally suggests about their nature; (3) titled "Living With Your Nakshatra", offering practical, grounded suggestions. Keep each section to 3-5 sentences.'
    );
  } catch (err) {
    // Never log the user's name/DOB/exact coordinates — only the
    // failure and which step it happened in.
    console.error(
      "[nakshatra] report generation failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    reportError = true;
  }

  return NextResponse.json({ calculated, report, reportError });
}
