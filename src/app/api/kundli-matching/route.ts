// src/app/api/kundli-matching/route.ts
//
// SHARED-CALCULATION DECISION — read before touching this file or
// src/app/api/compatibility/route.ts: both tools need the exact same
// two-chart Ashtakoot / Guna Milan match-making calculation. Rather
// than fabricate a second, different "compatibility algorithm" for the
// Compatibility tool, BOTH this route and
// src/app/api/compatibility/route.ts resolve each person's real Moon
// sign + nakshatra locally (src/lib/astro-engine/ephemeris.ts's
// calculateChart — no network call) and feed them into the exact same
// calculateAshtakoot() (src/lib/ashtakoot/calculate.ts, a pure local
// implementation of the classical 8-koota rules — see that file's
// comments for sourcing). What differs between the two tools is
// presentation only:
//   - Kundli Matching (here): traditional, Ashtakoot-first framing — the
//     AI `instructions` below ask for a traditional Vedic matchmaking
//     interpretation (koota-by-koota, doshas, a verdict on the /36
//     total score).
//   - Compatibility (../compatibility/route.ts): the SAME real
//     Ashtakoot data, reframed through a modern relationship-dynamics
//     lens (emotional compatibility, communication, relationship
//     dynamics, strengths, potential challenges), narrated for
//     "you"/"your partner" instead of bride/groom.
// Every score either tool renders (totalScore, each koota's score) is
// the same real number from the same local calculation — never
// invented, never recomputed differently per tool.
//
// Role mapping: the Kundli Matching page renders BirthDetailsForm
// twice, labeled "Bride" (personA) and "Groom" (personB) — traditional
// terms matching this tool's framing. personA is conventionally the
// bride/female role and personB the groom/male role, matching this
// codebase's established convention (see match-request.ts and
// calculateAshtakoot()'s doc comment) — the only koota with a
// directional rule (Varna) depends on this ordering.
import { NextResponse } from "next/server";
import { calculateChart, type ChartData, type ChartPlanetName } from "@/lib/astro-engine/ephemeris";
import { calculateAshtakoot } from "@/lib/ashtakoot/calculate";
import {
  validateMatchPersonInput,
  buildMatchBirthInput,
  type RawPersonInput,
} from "@/lib/astrology/match-request";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit/firestore-rate-limit";
import { generateStructuredReport, type StructuredReport } from "@/lib/ai/report";
import type { BirthInput } from "@/lib/astrology/types";
import type { KundliMatchingChartData } from "@/components/kundli-matching/types";

// Canonical planet order for building chart-view data — same order
// every other chart-consuming route uses (see e.g.
// src/app/api/free-kundli/route.ts).
const PLANET_DISPLAY_ORDER: ChartPlanetName[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
  "Rahu", "Ketu", "Uranus", "Neptune", "Pluto",
];

/** Structured chart data for BirthChartCard — the same shape
 * src/components/charts/types.ts's ChartStyleProps needs, built from a
 * real calculateChart() result. */
function toChartViewData(chart: ChartData): KundliMatchingChartData {
  return {
    ascendantSign: chart.ascendant.sign,
    planets: PLANET_DISPLAY_ORDER.reduce(
      (acc, name) => {
        const entry = chart.planets[name];
        acc[name] = {
          sign: entry.sign,
          house: entry.house,
          isRetrograde: entry.isRetrograde,
          degree: entry.degree,
        };
        return acc;
      },
      {} as KundliMatchingChartData["planets"]
    ),
  };
}

// Two resolved birth charts + one match-making calculation + the AI
// interpretation layer, all in one request — give it real headroom.
export const maxDuration = 30;

const ROUTE_KEY = "kundli-matching";

type RequestBody = { personA?: RawPersonInput; personB?: RawPersonInput };

/** BirthInput (`timezone` = the birth location's UTC offset in hours)
 * -> the actual UTC instant, for calculateChart() — same formula every
 * other local-calculation route uses (see e.g. src/app/api/rashi/route.ts). */
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
  // Rate-limit first, before any calculation work happens. Lower limit
  // than the single-person tools (6/min, not 10/min): one call here
  // resolves TWO people's charts and builds a bigger report prompt.
  const identifier = getClientIdentifier(request);
  const rateLimit = await checkRateLimit(ROUTE_KEY, identifier, { limit: 6, windowSeconds: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const bride = validateMatchPersonInput(body?.personA, "Bride");
  if ("error" in bride) return NextResponse.json({ error: bride.error }, { status: 400 });

  const groom = validateMatchPersonInput(body?.personB, "Groom");
  if ("error" in groom) return NextResponse.json({ error: groom.error }, { status: 400 });

  const femaleInput = buildMatchBirthInput(bride, "Bride");
  if ("error" in femaleInput) {
    return NextResponse.json({ error: femaleInput.error }, { status: 400 });
  }

  const maleInput = buildMatchBirthInput(groom, "Groom");
  if ("error" in maleInput) {
    return NextResponse.json({ error: maleInput.error }, { status: 400 });
  }

  let result;
  let brideChartView: KundliMatchingChartData;
  let groomChartView: KundliMatchingChartData;
  try {
    const brideChart = calculateChart(
      birthInputToUtc(femaleInput),
      femaleInput.latitude,
      femaleInput.longitude
    );
    const groomChart = calculateChart(
      birthInputToUtc(maleInput),
      maleInput.latitude,
      maleInput.longitude
    );
    result = calculateAshtakoot(
      { moonSign: brideChart.planets.Moon.sign, nakshatraNumber: brideChart.planets.Moon.nakshatra.nakshatraNumber },
      { moonSign: groomChart.planets.Moon.sign, nakshatraNumber: groomChart.planets.Moon.nakshatra.nakshatraNumber }
    );
    brideChartView = toChartViewData(brideChart);
    groomChartView = toChartViewData(groomChart);
  } catch (err) {
    // Never log either person's full name/DOB/coordinates — only the
    // failure and which step it happened in.
    console.error(
      "[kundli-matching] Ashtakoot calculation failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    return NextResponse.json(
      { error: "We couldn't calculate this match right now. Please try again shortly." },
      { status: 502 }
    );
  }

  const timeUnknown = bride.timeUnknown || groom.timeUnknown;

  // The real calculated Ashtakoot data above must always reach the
  // client, even if the AI-interpretation layer fails.
  let report: StructuredReport | null = null;
  let reportError = false;
  try {
    report = await generateStructuredReport(
      "kundli-matching",
      { ashtakoot: result, timeUnknown },
      `Write a traditional Vedic Kundli Matching (Ashtakoot / Guna Milan) reading for this bride and groom, based only on the real calculated koota scores above — never invent a score. The total score ("totalScore") is out of 36 ("outOf"), summed across 8 kootas: varna, vashya, tara, yoni, grahaMaitri, gana, bhakoot, and nadi (each an object with "score"/"outOf"/"personA"/"personB" — personA is the bride, personB is the groom). Cover exactly these 4 sections, in this order: (1) "Overall Verdict" — interpret the total score against traditional Ashtakoot guidelines (below 18 traditionally considered weak, 18-24 acceptable, 25-31 favorable, 32-36 excellent), framed as traditional guidance, never a guarantee of relationship success or failure; (2) "Strongest Kootas" — interpret the 2-3 highest-scoring kootas and what they traditionally suggest about this pairing; (3) "Kootas Needing Attention" — gently interpret the lowest-scoring kootas, explicitly naming whether Nadi Dosha ("nadiDosha" is true) or Bhakoot Dosha ("bhakootDosha" is true) is present, and what tradition says about each; (4) "Traditional Guidance" — a grounded, respectful closing note for the couple and families, mentioning that a qualified astrologer can review remedies for any dosha traditionally found. Use traditional Vedic matchmaking language throughout ("the bride's chart", "the groom's chart", "this koota traditionally reflects..."). If "timeUnknown" is true, add one brief closing line noting a default birth time (12:00) was used for at least one chart in the absence of an exact time, and that the Tara/Yoni/Gana/Bhakoot/Nadi kootas in particular can shift with a more precise birth time.`
    );
  } catch (err) {
    console.error(
      "[kundli-matching] report generation failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    reportError = true;
  }

  return NextResponse.json({
    result,
    timeUnknown,
    report,
    reportError,
    brideChart: brideChartView,
    groomChart: groomChartView,
  });
}
