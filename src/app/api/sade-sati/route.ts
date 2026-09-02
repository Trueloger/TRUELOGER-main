// src/app/api/sade-sati/route.ts
import { NextResponse } from "next/server";
import { getPlanetPositions } from "@/lib/astrology/freeastrologyapi";
import { deriveSadeSati } from "@/lib/astrology/derive";
import { resolveCityCoordinates } from "@/lib/astrology/geocode";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit/firestore-rate-limit";
import { generateStructuredReport, type StructuredReport } from "@/lib/ai/report";
import {
  validateNameServer,
  validateDateOfBirthServer,
  validateTimeOfBirthServer,
  validateCityServer,
} from "@/lib/validation/birth-details";

// Two getPlanetPositions calls (natal + current transit) plus the
// AI-interpretation call can together take a handful of seconds; give
// this route real headroom.
export const maxDuration = 30;

type RequestBody = {
  name?: unknown;
  dateOfBirth?: unknown;
  timeOfBirth?: unknown;
  timeUnknown?: unknown;
  city?: unknown;
  state?: unknown;
  country?: unknown;
};

type ValidInput = {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  timeUnknown: boolean;
  city: string;
};

/** Server-side validation — never trust client input. Mirrors the exact
 * same rules BirthDetailsForm's fields enforce client-side
 * (NameField/DateOfBirthField/TimeOfBirthField/PlaceOfBirthField) — see
 * src/lib/validation/birth-details.ts for why these are a from-scratch
 * re-implementation rather than a direct import. */
function validateInput(body: RequestBody): ValidInput | { error: string } {
  const name = typeof body.name === "string" ? body.name : "";
  const nameError = validateNameServer(name);
  if (nameError) return { error: nameError };

  const dateOfBirth = typeof body.dateOfBirth === "string" ? body.dateOfBirth : "";
  const dobError = validateDateOfBirthServer(dateOfBirth);
  if (dobError) return { error: dobError };

  // Sade Sati is driven by the natal Moon's SIGN — a wrong time only
  // matters if it shifts the Moon across a sign boundary, which is rare
  // but possible, so an unknown time still defaults to noon with the
  // caveat disclosed in the response rather than blocking submission.
  const timeUnknown = body.timeUnknown === true;
  const timeOfBirthRaw = typeof body.timeOfBirth === "string" ? body.timeOfBirth : "";
  const timeOfBirth = timeUnknown ? "12:00" : timeOfBirthRaw;
  if (!timeUnknown) {
    const timeError = validateTimeOfBirthServer(timeOfBirth);
    if (timeError) return { error: timeError };
  }

  const city = typeof body.city === "string" ? body.city : "";
  const cityError = validateCityServer(city);
  if (cityError) return { error: cityError };

  return { name, dateOfBirth, timeOfBirth, timeUnknown, city };
}

export async function POST(request: Request) {
  // Rate-limit first — this route calls a metered external API (twice)
  // on every request, before any other work happens.
  const identifier = getClientIdentifier(request);
  const rateLimit = await checkRateLimit("sade-sati", identifier, {
    limit: 10,
    windowSeconds: 60,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error:
          "You've reached the limit for chart calculations right now. Please wait a minute and try again.",
      },
      { status: 429 }
    );
  }

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
  const { dateOfBirth, timeOfBirth, timeUnknown, city } = validated;

  // Never fabricate coordinates — a miss here is a hard 400, not a guess.
  const coords = resolveCityCoordinates(city);
  if (!coords) {
    return NextResponse.json(
      {
        error: `We couldn't find "${city}" in our supported city list. Please try the nearest major city.`,
      },
      { status: 400 }
    );
  }

  const [year, month, date] = dateOfBirth.split("-").map(Number);
  const [hours, minutes] = timeOfBirth.split(":").map(Number);

  // Call 1: natal chart, for the Moon's sidereal sign at birth.
  let natalMoonSign: number;
  try {
    const natalPlanets = await getPlanetPositions({
      year,
      month,
      date,
      hours,
      minutes,
      seconds: 0,
      latitude: coords.lat,
      longitude: coords.lon,
      timezone: coords.timezone,
    });
    const moon = natalPlanets.output.Moon;
    if (!moon) throw new Error("no Moon entry in natal planets response");
    natalMoonSign = moon.current_sign;
  } catch (err) {
    console.error(
      "[sade-sati] natal getPlanetPositions failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    return NextResponse.json(
      { error: "We couldn't calculate your chart right now. Please try again shortly." },
      { status: 502 }
    );
  }

  // Call 2: the CURRENT moment, for transiting Saturn's sidereal sign.
  // Built from server time (UTC components + timezone: 0, so "now" is
  // represented unambiguously regardless of the server's local
  // timezone) with observation_point: "geocentric" per derive.ts's own
  // doc comment — Saturn's sidereal sign is effectively
  // location-independent for a transit-only lookup, so this reuses the
  // birth location's lat/lon rather than doing a second geocode lookup
  // (simpler, and the choice barely matters for a slow-moving outer
  // planet observed geocentrically).
  let transitingSaturnSign: number;
  try {
    const now = new Date();
    const transitPlanets = await getPlanetPositions(
      {
        year: now.getUTCFullYear(),
        month: now.getUTCMonth() + 1,
        date: now.getUTCDate(),
        hours: now.getUTCHours(),
        minutes: now.getUTCMinutes(),
        seconds: now.getUTCSeconds(),
        latitude: coords.lat,
        longitude: coords.lon,
        timezone: 0,
      },
      { observation_point: "geocentric" }
    );
    const saturn = transitPlanets.output.Saturn;
    if (!saturn) throw new Error("no Saturn entry in transit planets response");
    transitingSaturnSign = saturn.current_sign;
  } catch (err) {
    console.error(
      "[sade-sati] transit getPlanetPositions failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    return NextResponse.json(
      { error: "We couldn't calculate your chart right now. Please try again shortly." },
      { status: 502 }
    );
  }

  const calculated = deriveSadeSati(natalMoonSign, transitingSaturnSign);

  // The real calculated Sade Sati status above must always reach the
  // client, even if the AI-interpretation layer fails — an AI outage
  // never hides real calculated data.
  let report: StructuredReport | null = null;
  let reportError = false;
  try {
    report = await generateStructuredReport(
      "sade-sati",
      { ...calculated, natalMoonSign, transitingSaturnSign, timeUnknown },
      `Write a warm, grounded reading about Sade Sati for this person. The "active" and "phase" fields above already state, as settled fact, whether Sade Sati is currently active and which phase ("rising", "peak", "setting", or none) — never contradict them, soften them into a maybe, or add drama to them. Present this as traditional astrological information, not a warning. Never suggest the person's life, career, marriage, or health is at risk, and never use fear-based or fatalistic language — Sade Sati is a well-known traditional Saturn transit cycle that essentially everyone experiences roughly two to three times in a lifetime as ordinary as any other planetary transit. Countless traditional remedies, and simply the natural passage of time as Saturn continues transiting, are described in tradition as easing this period — mention this reassuring context clearly. Cover, in 2-3 sections: (1) what Sade Sati traditionally means and how the three phases (rising/peak/setting) work, (2) what this specific chart shows right now (referencing the phase and house-from-natal-Moon from the data above in plain language, or clearly noting Sade Sati is not currently active if "active" is false), and (3) traditional context/remedies and reassurance. If "timeUnknown" is true, add one brief closing note that the reading used a default birth time (12:00) in the absence of an exact time, and that providing the exact time can refine accuracy — keep this matter-of-fact, not alarming.`
    );
  } catch (err) {
    console.error(
      "[sade-sati] report generation failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    reportError = true;
  }

  return NextResponse.json({
    calculated,
    natalMoonSign,
    transitingSaturnSign,
    timeUnknown,
    report,
    reportError,
  });
}
