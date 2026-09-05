// src/app/api/free-kundli/route.ts
import { NextResponse } from "next/server";
import { calculateChart, type ChartPlanetName } from "@/lib/astro-engine/ephemeris";
import { calculateDivisionalChart } from "@/lib/astro-engine/divisional";
import { detectYogas } from "@/lib/astro-engine/yogas";
import { DASHA_LORD_SEQUENCE } from "@/lib/dasha/calculate";
import { signHouseNumber } from "@/lib/astrology/derive";
import { getRashiReference } from "@/lib/astrology/rashi-reference";
import {
  validateBirthRequestBody,
  buildBirthInput,
  type BirthRequestBody,
} from "@/lib/astrology/birth-request";
import type { BirthInput } from "@/lib/astrology/types";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit/firestore-rate-limit";
import { generateStructuredReport, type StructuredReport } from "@/lib/ai/report";
import type {
  FreeKundliCalculated,
  FreeKundliChartData,
  FreeKundliPlanetRow,
  FreeKundliYoga,
} from "@/components/free-kundli/types";

// The chart itself is now pure local computation (src/lib/astro-engine)
// — no network call, no rate limit on that step. The AI-interpretation
// call is still a real network round trip, so this route keeps real
// headroom for it.
export const maxDuration = 30;

// Canonical display order for the planetary table — every real body
// this local engine produces, in the traditional Vedic order (the
// classical grahas, then the shadow points, then the modern outer
// planets). The Ascendant itself is prepended separately below since
// it isn't a "planet" in ChartData.planets.
const PLANET_DISPLAY_ORDER: ChartPlanetName[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
  "Rahu", "Ketu", "Uranus", "Neptune", "Pluto",
];

const ANGULAR_HOUSES = new Set([1, 4, 7, 10]);

/** Local BirthInput (numeric date/time fields + a UTC-offset-hours
 * `timezone`, see src/lib/astrology/types.ts) -> the UTC instant
 * calculateChart needs. `timezone` is hours EAST of UTC (e.g. 5.5 for
 * India), so local time minus that offset is the UTC instant. */
function birthInputToUtcDate(input: BirthInput): Date {
  const utcMs =
    Date.UTC(input.year, input.month - 1, input.date, input.hours, input.minutes, input.seconds) -
    input.timezone * 60 * 60 * 1000;
  return new Date(utcMs);
}

/** "12°34'" (optionally " R" appended when retrograde) — same display
 * shape the old FreeAstrologyAPI-backed table used, now built from a
 * real 0-30 decimal degree instead of the API's own pre-split
 * degrees/minutes fields. */
function formatDegree(degree: number, isRetrograde: boolean): string {
  let wholeDeg = Math.floor(degree);
  let minutes = Math.round((degree - wholeDeg) * 60);
  if (minutes === 60) {
    minutes = 0;
    wholeDeg += 1;
  }
  const base = `${wholeDeg}°${minutes}'`;
  return isRetrograde ? `${base} R` : base;
}

function signName(sign: number): string {
  return getRashiReference(sign)?.signName ?? `Sign ${sign}`;
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

  // Never fabricate coordinates — a miss here is a hard 400, not a guess.
  const birthInput = buildBirthInput(validated);
  if ("error" in birthInput) {
    return NextResponse.json({ error: birthInput.error }, { status: 400 });
  }

  const identifier = getClientIdentifier(request);
  const rateLimit = await checkRateLimit("free-kundli", identifier, {
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

  const birthUtc = birthInputToUtcDate(birthInput);
  const chartData = calculateChart(birthUtc, birthInput.latitude, birthInput.longitude);

  const ascendant = chartData.ascendant;
  const moon = chartData.planets.Moon;
  const sun = chartData.planets.Sun;

  const moonNakshatraLord =
    DASHA_LORD_SEQUENCE[(moon.nakshatra.nakshatraNumber - 1) % 9];

  const angularHousePlanets: FreeKundliCalculated["angularHousePlanets"] = [];
  for (const name of PLANET_DISPLAY_ORDER) {
    const entry = chartData.planets[name];
    if (ANGULAR_HOUSES.has(entry.house)) {
      angularHousePlanets.push({ planet: name, house: entry.house, sign: signName(entry.sign) });
    }
  }

  // Yogas: real detected/not-detected data only (src/lib/astro-engine/
  // yogas.ts never generates interpretation text) — surfaced in full so
  // the result page can show every rule checked, not just the hits.
  const yogas: FreeKundliYoga[] = detectYogas(chartData).map((y) => ({
    id: y.ruleId,
    name: y.name,
    present: y.present,
    strength: y.strength,
  }));
  const presentYogaNames = yogas.filter((y) => y.present).map((y) => y.name);

  // Every value below is read straight off the real, locally-computed
  // chart — never invented. This summarized subset (not all 12
  // planets' full raw data) is what goes to the AI-interpretation
  // layer, per this tool's spec.
  const calculated: FreeKundliCalculated = {
    ascendant: {
      sign: signName(ascendant.sign),
      signLord: getRashiReference(ascendant.sign)?.rulingPlanet ?? "",
      degreeInSign: ascendant.degree,
    },
    moonSign: signName(moon.sign),
    moonNakshatra: moon.nakshatra.nakshatraName,
    moonNakshatraPada: moon.nakshatra.pada,
    moonNakshatraLord,
    sunSign: signName(sun.sign),
    angularHousePlanets,
    timeUnknown: validated.timeUnknown,
    presentYogaNames,
  };

  const planetaryRows: FreeKundliPlanetRow[] = [
    {
      planet: "Ascendant",
      sign: signName(ascendant.sign),
      house: 1,
      degree: formatDegree(ascendant.degree, false),
    },
    ...PLANET_DISPLAY_ORDER.map((name) => {
      const entry = chartData.planets[name];
      return {
        planet: name,
        sign: signName(entry.sign),
        house: entry.house,
        degree: formatDegree(entry.degree, entry.isRetrograde),
      };
    }),
  ];

  // Structured chart data for NorthIndianChart.tsx — a real React SVG
  // component fed this shape, not third-party markup, so there is
  // nothing to sanitize and no base64 data: URI needed.
  const chart: FreeKundliChartData = {
    ascendantSign: ascendant.sign,
    planets: PLANET_DISPLAY_ORDER.reduce(
      (acc, name) => {
        const entry = chartData.planets[name];
        acc[name] = {
          sign: entry.sign,
          house: entry.house,
          isRetrograde: entry.isRetrograde,
          degree: entry.degree,
        };
        return acc;
      },
      {} as FreeKundliChartData["planets"]
    ),
  };

  // D9 Navamsa chart — same BirthChartCard-compatible shape as `chart`
  // above, but every sign/house is the planet's NAVAMSA placement
  // (src/lib/astro-engine/divisional.ts), not its D1/Rasi placement.
  // Retrograde status is a real physical motion, not something that
  // changes per divisional chart, so it's carried over unchanged from
  // the natal chart; "house" is the whole-sign house counted from the
  // Navamsa chart's OWN Ascendant sign, not the D1 Ascendant's.
  const navamsa = calculateDivisionalChart(9, chartData);
  const navamsaChart: FreeKundliChartData = {
    ascendantSign: navamsa.ascendant.sign,
    planets: PLANET_DISPLAY_ORDER.reduce((acc, name) => {
      const point = navamsa.planets[name];
      acc[name] = {
        sign: point.sign,
        house: signHouseNumber(navamsa.ascendant.sign, point.sign),
        isRetrograde: chartData.planets[name].isRetrograde,
        degree: point.degreeInVarga,
      };
      return acc;
    }, {} as FreeKundliChartData["planets"]),
  };

  // The real calculated chart above must always reach the client, even
  // if the AI-interpretation layer fails — an AI outage never hides
  // real calculated data.
  let report: StructuredReport | null = null;
  let reportError = false;
  try {
    report = await generateStructuredReport(
      "free-kundli",
      calculated,
      `Write a warm, grounded Vedic birth chart (Kundli) overview using this real chart data. Cover exactly 4 sections: (1) titled "Your Ascendant — <sign>", explaining what the Lagna (rising sign) traditionally represents and this chart's specific rising sign and its ruling planet; (2) titled "Moon Sign & Nakshatra", explaining the Rashi (Moon sign) and Nakshatra shown above and what they traditionally represent for temperament and inner life; (3) titled "Sun Sign", covering the core identity theme of the Sun's placement; (4) titled "Chart Highlights", discussing the planets listed in "angularHousePlanets" (houses 1, 4, 7, and 10 counted from the Ascendant — the traditionally most emphasized houses) and what an angular placement traditionally emphasizes for each of those planets, AND, if "presentYogaNames" is non-empty, briefly naming those classical yoga(s) as traditionally significant combinations present in this chart (do not invent what they mean beyond their name — a one-clause acknowledgement is enough, this is not the place for deep yoga interpretation). Keep each section to 3-5 sentences. If "timeUnknown" is true, add one brief, matter-of-fact closing note (in section 4) that the exact time of birth was not provided, so the Ascendant and house placements shown are approximate, and that providing the exact birth time would refine accuracy.`
    );
  } catch (err) {
    // Never log the user's name/DOB/exact coordinates — only the
    // failure and which step it happened in.
    console.error(
      "[free-kundli] report generation failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    reportError = true;
  }

  return NextResponse.json({
    calculated,
    planetaryRows,
    chart,
    navamsaChart,
    yogas,
    report,
    reportError,
  });
}
