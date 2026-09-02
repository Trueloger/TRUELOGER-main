// src/app/api/mangal-dosha/route.ts
import { NextResponse } from "next/server";
import { getPlanetPositions } from "@/lib/astrology/freeastrologyapi";
import { deriveMangalDosha } from "@/lib/astrology/derive";
import { resolveCityCoordinates } from "@/lib/astrology/geocode";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit/firestore-rate-limit";
import { generateStructuredReport, type StructuredReport } from "@/lib/ai/report";
import {
  validateNameServer,
  validateDateOfBirthServer,
  validateTimeOfBirthServer,
  validateCityServer,
} from "@/lib/validation/birth-details";

// getPlanetPositions + the AI-interpretation call can together take a
// handful of seconds; give this route real headroom.
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

  // Mars/Saturn house placement is sign-level, less time-sensitive than
  // an Ascendant-only calculation would be — but Mangal Dosha DOES check
  // Mars's house from the Ascendant too, so an unknown time still
  // defaults to noon with the caveat disclosed in the response rather
  // than blocking submission.
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
  // Rate-limit first — this route calls a metered external API on every
  // request, before any other work happens.
  const identifier = getClientIdentifier(request);
  const rateLimit = await checkRateLimit("mangal-dosha", identifier, {
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

  let planets;
  try {
    planets = await getPlanetPositions({
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
  } catch (err) {
    console.error(
      "[mangal-dosha] getPlanetPositions failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    return NextResponse.json(
      { error: "We couldn't calculate your chart right now. Please try again shortly." },
      { status: 502 }
    );
  }

  let calculated;
  try {
    calculated = deriveMangalDosha(planets.output);
  } catch (err) {
    console.error(
      "[mangal-dosha] deriveMangalDosha failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    return NextResponse.json(
      { error: "We couldn't calculate your chart right now. Please try again shortly." },
      { status: 502 }
    );
  }

  // The real calculated dosha status above must always reach the client,
  // even if the AI-interpretation layer fails — an AI outage never hides
  // real calculated data.
  let report: StructuredReport | null = null;
  let reportError = false;
  try {
    report = await generateStructuredReport(
      "mangal-dosha",
      { ...calculated, timeUnknown },
      `Write a warm, grounded reading about Mangal Dosha (Kuja Dosha) for this person's birth chart. The "hasDosha" field above already states, as settled fact, whether Mangal Dosha is present — never contradict it, soften it into a maybe, or add drama to it. Present this as traditional astrological information, not a warning. Never suggest the person's life, marriage, or health is at risk. Mangal Dosha is a traditional astrological pattern many people experience; countless traditional remedies, and simply the passage of time as Mars transits onward, are described in tradition as mitigating factors — mention this reassuring context clearly. Cover, in 2-3 sections: (1) what Mangal Dosha traditionally means in Vedic astrology, (2) what this specific chart shows (referencing the house placements from Ascendant and from Moon in the data above, in plain language), and (3) traditional context/remedies and reassurance. If "timeUnknown" is true, add one brief closing note that the reading used a default birth time (12:00) in the absence of an exact time, and that providing the exact time can refine accuracy — keep this matter-of-fact, not alarming.`
    );
  } catch (err) {
    console.error(
      "[mangal-dosha] report generation failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    reportError = true;
  }

  return NextResponse.json({ calculated, timeUnknown, report, reportError });
}
