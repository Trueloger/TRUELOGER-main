// src/app/api/dasha/route.ts
import { NextResponse } from "next/server";
import { resolveCityCoordinates, historicalIndiaOffsetHours } from "@/lib/astrology/geocode";
import { calculateChart, type ChartPlanetEntry, type ChartPlanetName } from "@/lib/astro-engine/ephemeris";
import { calculateDivisionalChart } from "@/lib/astro-engine/divisional";
import { detectYogas } from "@/lib/astro-engine/yogas";
import { calculateShadbala } from "@/lib/astro-engine/shadbala";
import { vimshottariDasha } from "@/lib/dasha/calculate";
import { signHouseNumber } from "@/lib/astrology/derive";
import type { BirthInput } from "@/lib/astrology/types";
import {
  findCurrentAntarDasha,
  findCurrentMahaDasha,
  mahaDashaTimeline,
} from "@/lib/dasha/format";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit/firestore-rate-limit";
import { generateStructuredReport, type StructuredReport } from "@/lib/ai/report";
import type { DashaPlanetaryStrength } from "@/components/dasha/types";

// Vimshottari dasha calc is now local/instant; AI interpretation can
// still take a few seconds.
export const maxDuration = 30;

const ROUTE_KEY = "dasha";
const DEFAULT_TIME_WHEN_UNKNOWN = "12:00";

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

const MIN_BIRTH_YEAR = 1900;
const NAME_MAX_LENGTH = 80;

// Self-contained validation, deliberately NOT importing validateName /
// validateDateOfBirth / validateTimeOfBirth from
// src/components/forms/*Field.tsx: those files start with "use client",
// and React Server Components forbid calling an exported function from
// a "use client" module from server code (confirmed at runtime here:
// "Attempted to call validateName() from the server but validateName is
// on the client") — only rendering them as components is allowed. This
// mirrors src/app/api/numerology/route.ts's own approach (see its
// isValidCalendarDate) and reproduces the exact same rules as
// NameField/DateOfBirthField/TimeOfBirthField/PlaceOfBirthField's
// validators, kept in sync by hand.

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function validateNameServer(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Name is required.";
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

function validateDateOfBirthServer(value: string): string | null {
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

function validateTimeOfBirthServer(value: string): string | null {
  if (!value) return "Time of birth is required.";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return "Enter a valid time.";
  return null;
}

/** Server-side validation — never trust client input. Reproduces
 * DashaForm.tsx's client-side checks exactly (see the note above on why
 * this can't just import the shared field validators). Time of birth is
 * required for this tool UNLESS the client explicitly flags it unknown,
 * in which case a default of noon is used (the result UI discloses that
 * dasha start dates can then shift by months). */
function validateInput(body: RequestBody): ValidInput | { error: string } {
  const name = typeof body.name === "string" ? body.name : "";
  const nameError = validateNameServer(name);
  if (nameError) return { error: nameError };

  const dateOfBirth = typeof body.dateOfBirth === "string" ? body.dateOfBirth : "";
  const dobError = validateDateOfBirthServer(dateOfBirth);
  if (dobError) return { error: dobError };

  const timeUnknown = body.timeUnknown === true;
  const timeOfBirthRaw = typeof body.timeOfBirth === "string" ? body.timeOfBirth : "";
  let timeOfBirth = timeOfBirthRaw;
  if (timeUnknown) {
    timeOfBirth = DEFAULT_TIME_WHEN_UNKNOWN;
  } else {
    const timeError = validateTimeOfBirthServer(timeOfBirthRaw);
    if (timeError) return { error: timeError };
  }

  const city = typeof body.city === "string" ? body.city.trim() : "";
  if (!city) return { error: "City is required." };

  return { name: name.trim(), dateOfBirth, timeOfBirth, timeUnknown, city };
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
  const { dateOfBirth, timeOfBirth, timeUnknown, city } = validated;

  const coordinates = resolveCityCoordinates(city);
  if (!coordinates) {
    return NextResponse.json(
      { error: "We couldn't find that city. Please check the spelling or try a nearby major city." },
      { status: 400 }
    );
  }

  const identifier = getClientIdentifier(request);
  const rateLimit = await checkRateLimit(ROUTE_KEY, identifier, { limit: 10, windowSeconds: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const [year, month, date] = dateOfBirth.split("-").map(Number);
  const [hours, minutes] = timeOfBirth.split(":").map(Number);

  const birthInput: BirthInput = {
    year,
    month,
    date,
    hours,
    minutes,
    seconds: 0,
    latitude: coordinates.lat,
    longitude: coordinates.lon,
    // Historically-correct UTC offset for this birth date — see
    // geocode.ts's historicalIndiaOffsetHours doc comment.
    timezone: historicalIndiaOffsetHours(dateOfBirth),
  };

  let dasha;
  let chartResponse: {
    ascendantSign: number;
    planets: Record<ChartPlanetName, { sign: number; house: number; isRetrograde: boolean; degree: number }>;
  };
  let navamsaChartResponse: typeof chartResponse;
  let yogas: { id: string; name: string; present: boolean; strength?: "weak" | "moderate" | "strong" }[];
  let planetaryStrength: DashaPlanetaryStrength[];
  try {
    const localMs = Date.UTC(
      birthInput.year,
      birthInput.month - 1,
      birthInput.date,
      birthInput.hours,
      birthInput.minutes,
      birthInput.seconds
    );
    const birthUtc = new Date(localMs - birthInput.timezone * 60 * 60 * 1000);
    const chart = calculateChart(birthUtc, birthInput.latitude, birthInput.longitude);
    dasha = vimshottariDasha(chart.planets.Moon.longitude, birthUtc);
    chartResponse = {
      ascendantSign: chart.ascendant.sign,
      planets: Object.fromEntries(
        (Object.entries(chart.planets) as [ChartPlanetName, ChartPlanetEntry][]).map(([name, entry]) => [
          name,
          { sign: entry.sign, house: entry.house, isRetrograde: entry.isRetrograde, degree: entry.degree },
        ])
      ) as Record<ChartPlanetName, { sign: number; house: number; isRetrograde: boolean; degree: number }>,
    };

    // D9 Navamsa — same BirthChartCard-compatible shape, but every
    // sign/house is the planet's Navamsa placement
    // (src/lib/astro-engine/divisional.ts), not its D1/Rasi placement.
    // Retrograde is a real physical motion, so it's carried over
    // unchanged from the natal chart; "house" is counted from the
    // Navamsa chart's OWN Ascendant sign.
    const navamsa = calculateDivisionalChart(9, chart);
    navamsaChartResponse = {
      ascendantSign: navamsa.ascendant.sign,
      planets: Object.fromEntries(
        (Object.keys(chart.planets) as ChartPlanetName[]).map((name) => {
          const point = navamsa.planets[name];
          return [
            name,
            {
              sign: point.sign,
              house: signHouseNumber(navamsa.ascendant.sign, point.sign),
              isRetrograde: chart.planets[name].isRetrograde,
              degree: point.degreeInVarga,
            },
          ];
        })
      ) as Record<ChartPlanetName, { sign: number; house: number; isRetrograde: boolean; degree: number }>,
    };

    // Yogas: real detected/not-detected data only (src/lib/astro-engine/
    // yogas.ts never generates interpretation text).
    yogas = detectYogas(chart).map((y) => ({
      id: y.ruleId,
      name: y.name,
      present: y.present,
      strength: y.strength,
    }));

    // Shadbala — core/simplified classical planetary strength (see
    // src/lib/astro-engine/shadbala.ts's "HONESTY NOTICE" doc comment
    // for exactly what's implemented vs. skipped). Only the 7 classical
    // planets have a result; Rahu/Ketu/outer planets are omitted rather
    // than padded with a fabricated null-shaped row. Bhava Bala (house
    // strength) is deliberately NOT added here — this single-focus
    // dasha timeline tool doesn't naturally need a house-strength
    // breakdown the way the detailed free-kundli tool does.
    const shadbalaByPlanet = calculateShadbala(chart);
    const planetaryStrengthResult: DashaPlanetaryStrength[] = (Object.keys(shadbalaByPlanet) as ChartPlanetName[])
      .map((name) => {
        const s = shadbalaByPlanet[name];
        if (!s) return null;
        return {
          planet: name,
          totalRupas: s.totalRupas,
          requiredRupas: s.requiredRupas,
          meetsRequirement: s.meetsRequirement,
        };
      })
      .filter((row) => row !== null);
    planetaryStrength = planetaryStrengthResult;
  } catch (err) {
    // Never log full name/DOB — only the failure.
    console.error(
      "[dasha] dasha calculation failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    return NextResponse.json(
      { error: "We couldn't calculate your dasha right now. Please try again shortly." },
      { status: 502 }
    );
  }

  const mahaDashaTimelineEntries = mahaDashaTimeline(dasha);
  const currentMahaDasha = findCurrentMahaDasha(dasha);
  const currentAntarDasha = currentMahaDasha
    ? findCurrentAntarDasha(dasha[currentMahaDasha.lord])
    : null;

  // Real data only, summarized rather than dumped whole — the current
  // maha/antar-dasha plus the next 2-3 upcoming maha-dasha lords is
  // enough for a meaningful interpretation without dumping this
  // person's entire life-spanning raw dasha object into the prompt.
  const currentIndex = currentMahaDasha
    ? mahaDashaTimelineEntries.findIndex((entry) => entry.lord === currentMahaDasha.lord)
    : -1;
  const upcomingMahaDashas =
    currentIndex >= 0 ? mahaDashaTimelineEntries.slice(currentIndex + 1, currentIndex + 4) : [];
  const presentYogaNames = yogas.filter((y) => y.present).map((y) => y.name);

  let report: StructuredReport | null = null;
  let reportError = false;
  try {
    report = await generateStructuredReport(
      "dasha",
      {
        currentMahaDasha,
        currentAntarDasha,
        upcomingMahaDashas,
        presentYogaNames,
      },
      'Write a warm, grounded Vimshottari Dasha reading for this person. Cover exactly 3 sections: (1) "Current Mahadasha" — interpret the current maha-dasha lord\'s influence on this life period; (2) "Current Antardasha" — interpret how the current antar-dasha lord colors the maha-dasha period right now; (3) "What\'s Ahead" — a grounded look at the upcoming maha-dasha periods listed, and if "presentYogaNames" is non-empty, briefly name those classical yoga(s) as traditionally significant combinations present in this chart (name only, no invented meaning beyond that). Keep each section to 3-5 sentences.'
    );
  } catch (err) {
    console.error(
      "[dasha] report generation failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    reportError = true;
  }

  return NextResponse.json({
    mahaDashaTimeline: mahaDashaTimelineEntries,
    currentMahaDasha,
    currentAntarDasha,
    chart: chartResponse,
    navamsaChart: navamsaChartResponse,
    yogas,
    planetaryStrength,
    timeUnknown,
    report,
    reportError,
  });
}
