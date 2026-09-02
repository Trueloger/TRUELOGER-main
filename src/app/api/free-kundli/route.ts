// src/app/api/free-kundli/route.ts
import { NextResponse } from "next/server";
import { getPlanetPositions, getKundliChartSvg } from "@/lib/astrology/freeastrologyapi";
import {
  validateBirthRequestBody,
  buildBirthInput,
  type BirthRequestBody,
} from "@/lib/astrology/birth-request";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit/firestore-rate-limit";
import { generateStructuredReport, type StructuredReport } from "@/lib/ai/report";
import type { PlanetExtendedEntry, PlanetName } from "@/lib/astrology/types";
import type { FreeKundliCalculated, FreeKundliPlanetRow } from "@/components/free-kundli/types";

// This route does more work than most in this feature set: two external
// FreeAstrologyAPI calls (planets + chart SVG, run concurrently) plus
// the AI-interpretation call — give it real headroom.
export const maxDuration = 45;

// Canonical display order for the planetary table — every key
// /planets/extended can return, in the traditional Vedic order (Lagna
// first, then the classical grahas, then the outer/shadow points last).
// Only keys actually present in a given response produce a row; nothing
// here is fabricated when the API omits a point.
const PLANET_DISPLAY_ORDER: PlanetName[] = [
  "Ascendant",
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Rahu",
  "Ketu",
  "Uranus",
  "Neptune",
  "Pluto",
];

const ANGULAR_HOUSES = new Set([1, 4, 7, 10]);

function formatDegree(entry: PlanetExtendedEntry): string {
  const base = `${entry.degrees}°${entry.minutes}'`;
  return entry.isRetro === "true" ? `${base} R` : base;
}

function buildPlanetaryRows(
  output: Partial<Record<PlanetName, PlanetExtendedEntry>>
): FreeKundliPlanetRow[] {
  const rows: FreeKundliPlanetRow[] = [];
  for (const name of PLANET_DISPLAY_ORDER) {
    const entry = output[name];
    if (!entry) continue;
    rows.push({
      planet: name,
      sign: entry.zodiac_sign_name,
      house: entry.house_number,
      degree: formatDegree(entry),
    });
  }
  return rows;
}

/** Real planets (never the Ascendant point itself) sitting in an
 * angular house (1st/4th/7th/10th from the Ascendant) — the one piece
 * of chart-shape context this tool's AI summary uses, per the project
 * spec's "don't dump all planets' raw data into the prompt" guidance. */
function findAngularHousePlanets(
  output: Partial<Record<PlanetName, PlanetExtendedEntry>>
): { planet: string; house: number; sign: string }[] {
  const result: { planet: string; house: number; sign: string }[] = [];
  for (const name of PLANET_DISPLAY_ORDER) {
    if (name === "Ascendant") continue;
    const entry = output[name];
    if (!entry) continue;
    if (ANGULAR_HOUSES.has(entry.house_number)) {
      result.push({ planet: name, house: entry.house_number, sign: entry.zodiac_sign_name });
    }
  }
  return result;
}

// Shape sanity-check ONLY — not a security control. A substring denylist
// (rejecting "<script") does not make markup safe to inject into the DOM:
// SVG can execute script via onload/onerror/other event-handler
// attributes on any element, <foreignObject> embedding HTML, an
// xlink:href/href of "javascript:...", etc. The actual security boundary
// is downstream: chartSvg is never handed to dangerouslySetInnerHTML —
// it's base64-encoded into a data: URI and rendered via a plain <img
// src>, which cannot execute embedded script/event-handlers regardless
// of what this check does or doesn't catch. This function exists only to
// avoid encoding and returning obvious garbage (a truncated response, an
// HTML error page, etc.) as though it were a chart.
function isPlausibleInlineSvg(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed.startsWith("<svg")) return false;
  if (!trimmed.endsWith("</svg>")) return false;
  return true;
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

  // Planets and the chart SVG are independent calls run concurrently.
  // Deliberately Promise.allSettled, not Promise.all: a chart-endpoint
  // failure must degrade gracefully (chartAvailable: false) rather than
  // failing the whole request and hiding the real, already-available
  // planetary/house data — Promise.all's fail-fast semantics can't do
  // that, allSettled can while still dispatching both calls in parallel.
  const [planetsSettled, chartSettled] = await Promise.allSettled([
    getPlanetPositions(birthInput),
    getKundliChartSvg(birthInput),
  ]);

  if (planetsSettled.status === "rejected") {
    console.error(
      "[free-kundli] getPlanetPositions failed:",
      planetsSettled.reason instanceof Error ? planetsSettled.reason.message : "unknown error"
    );
    return NextResponse.json(
      { error: "We couldn't calculate your birth chart right now. Please try again shortly." },
      { status: 502 }
    );
  }
  const planets = planetsSettled.value;

  const ascendant = planets.output.Ascendant;
  const moon = planets.output.Moon;
  const sun = planets.output.Sun;
  if (!ascendant) {
    console.error("[free-kundli] planet position response missing Ascendant entry");
    return NextResponse.json(
      { error: "We couldn't calculate your birth chart right now. Please try again shortly." },
      { status: 502 }
    );
  }

  let chartAvailable = false;
  let chartDataUri: string | null = null;
  if (chartSettled.status === "fulfilled" && isPlausibleInlineSvg(chartSettled.value.output)) {
    chartAvailable = true;
    // Base64-encode into a data: URI here, server-side, so the client
    // only ever needs a plain <img src> — never raw markup handed to
    // dangerouslySetInnerHTML. See isPlausibleInlineSvg's comment for
    // why this, not the shape check above, is the real XSS boundary.
    chartDataUri = `data:image/svg+xml;base64,${Buffer.from(chartSettled.value.output, "utf-8").toString("base64")}`;
  } else if (chartSettled.status === "rejected") {
    console.error(
      "[free-kundli] getKundliChartSvg failed:",
      chartSettled.reason instanceof Error ? chartSettled.reason.message : "unknown error"
    );
  } else {
    console.error("[free-kundli] getKundliChartSvg returned an unexpected response shape");
  }

  const planetaryRows = buildPlanetaryRows(planets.output);

  // Every value below is read straight off the real API response —
  // never invented. This summarized subset (not all 9-13 planets' full
  // raw data) is what goes to the AI-interpretation layer, per this
  // tool's spec.
  const calculated: FreeKundliCalculated = {
    ascendant: {
      sign: ascendant.zodiac_sign_name,
      signLord: ascendant.zodiac_sign_lord,
      degreeInSign: ascendant.normDegree,
    },
    moonSign: moon?.zodiac_sign_name ?? null,
    moonNakshatra: moon?.nakshatra_name ?? null,
    moonNakshatraPada: moon?.nakshatra_pada ?? null,
    moonNakshatraLord: moon?.nakshatra_vimsottari_lord ?? null,
    sunSign: sun?.zodiac_sign_name ?? null,
    angularHousePlanets: findAngularHousePlanets(planets.output),
    timeUnknown: validated.timeUnknown,
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
      `Write a warm, grounded Vedic birth chart (Kundli) overview using this real chart data. Cover exactly 4 sections: (1) titled "Your Ascendant — <sign>", explaining what the Lagna (rising sign) traditionally represents and this chart's specific rising sign and its ruling planet; (2) titled "Moon Sign & Nakshatra", explaining the Rashi (Moon sign) and Nakshatra shown above and what they traditionally represent for temperament and inner life; (3) titled "Sun Sign", covering the core identity theme of the Sun's placement; (4) titled "Chart Highlights", discussing the planets listed in "angularHousePlanets" (houses 1, 4, 7, and 10 counted from the Ascendant — the traditionally most emphasized houses) and what an angular placement traditionally emphasizes for each of those planets. Keep each section to 3-5 sentences. If "timeUnknown" is true, add one brief, matter-of-fact closing note (in section 4) that the exact time of birth was not provided, so the Ascendant and house placements shown are approximate, and that providing the exact birth time would refine accuracy.`
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
    chartAvailable,
    chartDataUri,
    report,
    reportError,
  });
}
