// src/app/api/sade-sati/route.ts
import { NextResponse } from "next/server";
import { calculateChart, type ChartPlanetEntry, type ChartPlanetName } from "@/lib/astro-engine/ephemeris";
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

// Two chart calculations (natal + current transit) are now local and
// instant, but the AI-interpretation call can still take a few seconds;
// give this route real headroom.
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
  let chartResponse: {
    ascendantSign: number;
    planets: Record<ChartPlanetName, { sign: number; house: number; isRetrograde: boolean; degree: number }>;
  };
  try {
    const localMs = Date.UTC(year, month - 1, date, hours, minutes, 0);
    const birthUtc = new Date(localMs - coords.timezone * 60 * 60 * 1000);
    const natalChart = calculateChart(birthUtc, coords.lat, coords.lon);
    natalMoonSign = natalChart.planets.Moon.sign;
    // Structured chart data for BirthChartCard — the NATAL chart only,
    // never the transit chart computed below.
    chartResponse = {
      ascendantSign: natalChart.ascendant.sign,
      planets: Object.fromEntries(
        (Object.entries(natalChart.planets) as [ChartPlanetName, ChartPlanetEntry][]).map(
          ([name, entry]) => [
            name,
            { sign: entry.sign, house: entry.house, isRetrograde: entry.isRetrograde, degree: entry.degree },
          ]
        )
      ) as Record<ChartPlanetName, { sign: number; house: number; isRetrograde: boolean; degree: number }>,
    };
  } catch (err) {
    console.error(
      "[sade-sati] natal chart calculation failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    return NextResponse.json(
      { error: "We couldn't calculate your chart right now. Please try again shortly." },
      { status: 502 }
    );
  }

  // Call 2: the CURRENT moment, for transiting Saturn's sidereal sign.
  // Saturn's sidereal sign is effectively location-independent for a
  // slow-moving outer planet, so this reuses the birth location's
  // lat/lon rather than doing a second geocode lookup — same choice the
  // old FreeAstrologyAPI-backed version made (see git history), just
  // with the local engine's topocentric calculation instead of that
  // API's "geocentric" observation-point setting.
  let transitingSaturnSign: number;
  try {
    const now = new Date();
    const transitChart = calculateChart(now, coords.lat, coords.lon);
    transitingSaturnSign = transitChart.planets.Saturn.sign;
  } catch (err) {
    console.error(
      "[sade-sati] transit chart calculation failed:",
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
    chart: chartResponse,
    natalMoonSign,
    transitingSaturnSign,
    timeUnknown,
    report,
    reportError,
  });
}
