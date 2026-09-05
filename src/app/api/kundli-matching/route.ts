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
import { calculateDivisionalChart } from "@/lib/astro-engine/divisional";
import { detectYogas } from "@/lib/astro-engine/yogas";
import { calculateShadbala } from "@/lib/astro-engine/shadbala";
import { calculateAshtakoot } from "@/lib/ashtakoot/calculate";
import {
  validateMatchPersonInput,
  buildMatchBirthInput,
  type RawPersonInput,
} from "@/lib/astrology/match-request";
import { signHouseNumber } from "@/lib/astrology/derive";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit/firestore-rate-limit";
import { generateStructuredReport, type StructuredReport } from "@/lib/ai/report";
import type { BirthInput } from "@/lib/astrology/types";
import type {
  KundliMatchingChartData,
  KundliMatchingYoga,
  KundliMatchingPlanetaryStrength,
} from "@/components/kundli-matching/types";

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

/** D9 Navamsa view for BirthChartCard, same shape as toChartViewData()
 * above — every sign/house here is the planet's Navamsa placement
 * (src/lib/astro-engine/divisional.ts), not its D1/Rasi placement.
 * Retrograde status carries over unchanged from the natal chart (a
 * planet's physical motion doesn't change per divisional chart); house
 * is counted from the Navamsa chart's own Ascendant sign. Reads ONLY
 * the single `chart` passed in — no shared/global state. */
function toNavamsaViewData(chart: ChartData): KundliMatchingChartData {
  const navamsa = calculateDivisionalChart(9, chart);
  return {
    ascendantSign: navamsa.ascendant.sign,
    planets: PLANET_DISPLAY_ORDER.reduce(
      (acc, name) => {
        const point = navamsa.planets[name];
        acc[name] = {
          sign: point.sign,
          house: signHouseNumber(navamsa.ascendant.sign, point.sign),
          isRetrograde: chart.planets[name].isRetrograde,
          degree: point.degreeInVarga,
        };
        return acc;
      },
      {} as KundliMatchingChartData["planets"]
    ),
  };
}

/** This person's own classical yogas only (src/lib/astro-engine/yogas.ts)
 * — reads ONLY the single `chart` passed in, never any shared state. */
function toYogasViewData(chart: ChartData): KundliMatchingYoga[] {
  return detectYogas(chart).map((y) => ({
    id: y.ruleId,
    name: y.name,
    present: y.present,
    strength: y.strength,
  }));
}

/** This person's own core Shadbala only (src/lib/astro-engine/shadbala.ts)
 * — reads ONLY the single `chart` passed in, never any shared/global
 * state, mirroring toYogasViewData() above. Only the 7 classical
 * planets have a result; Rahu/Ketu/outer planets are omitted rather
 * than padded with a fabricated null-shaped row. */
function toPlanetaryStrengthViewData(chart: ChartData): KundliMatchingPlanetaryStrength[] {
  const shadbalaByPlanet = calculateShadbala(chart);
  return (Object.keys(shadbalaByPlanet) as ChartPlanetName[])
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
  let brideNavamsaView: KundliMatchingChartData;
  let groomNavamsaView: KundliMatchingChartData;
  let brideYogas: KundliMatchingYoga[];
  let groomYogas: KundliMatchingYoga[];
  let bridePlanetaryStrength: KundliMatchingPlanetaryStrength[];
  let groomPlanetaryStrength: KundliMatchingPlanetaryStrength[];
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
    // Each person's Navamsa/yogas/Shadbala below is computed from that
    // person's own already-computed `brideChart`/`groomChart` ChartData
    // object only — no shared/global state, mirroring
    // toChartViewData() above.
    brideNavamsaView = toNavamsaViewData(brideChart);
    groomNavamsaView = toNavamsaViewData(groomChart);
    brideYogas = toYogasViewData(brideChart);
    groomYogas = toYogasViewData(groomChart);
    bridePlanetaryStrength = toPlanetaryStrengthViewData(brideChart);
    groomPlanetaryStrength = toPlanetaryStrengthViewData(groomChart);
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
  const bridePresentYogaNames = brideYogas.filter((y) => y.present).map((y) => y.name);
  const groomPresentYogaNames = groomYogas.filter((y) => y.present).map((y) => y.name);

  // The real calculated Ashtakoot data above must always reach the
  // client, even if the AI-interpretation layer fails.
  let report: StructuredReport | null = null;
  let reportError = false;
  try {
    report = await generateStructuredReport(
      "kundli-matching",
      { ashtakoot: result, timeUnknown, bridePresentYogaNames, groomPresentYogaNames },
      `Write a traditional Vedic Kundli Matching (Ashtakoot / Guna Milan) reading for this bride and groom, based only on the real calculated koota scores above — never invent a score. The total score ("totalScore") is out of 36 ("outOf"), summed across 8 kootas: varna, vashya, tara, yoni, grahaMaitri, gana, bhakoot, and nadi (each an object with "score"/"outOf"/"personA"/"personB" — personA is the bride, personB is the groom). Cover exactly these 4 sections, in this order: (1) "Overall Verdict" — interpret the total score against traditional Ashtakoot guidelines (below 18 traditionally considered weak, 18-24 acceptable, 25-31 favorable, 32-36 excellent), framed as traditional guidance, never a guarantee of relationship success or failure; (2) "Strongest Kootas" — interpret the 2-3 highest-scoring kootas and what they traditionally suggest about this pairing; (3) "Kootas Needing Attention" — gently interpret the lowest-scoring kootas, explicitly naming whether Nadi Dosha ("nadiDosha" is true) or Bhakoot Dosha ("bhakootDosha" is true) is present, and what tradition says about each; (4) "Traditional Guidance" — a grounded, respectful closing note for the couple and families, mentioning that a qualified astrologer can review remedies for any dosha traditionally found. Use traditional Vedic matchmaking language throughout ("the bride's chart", "the groom's chart", "this koota traditionally reflects..."). If "bridePresentYogaNames" and/or "groomPresentYogaNames" is non-empty, briefly name that person's classical yoga(s) as traditionally significant combinations present in their chart (name only, no invented meaning beyond that). If "timeUnknown" is true, add one brief closing line noting a default birth time (12:00) was used for at least one chart in the absence of an exact time, and that the Tara/Yoni/Gana/Bhakoot/Nadi kootas in particular can shift with a more precise birth time.`
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
    brideNavamsaChart: brideNavamsaView,
    groomNavamsaChart: groomNavamsaView,
    brideYogas,
    groomYogas,
    bridePlanetaryStrength,
    groomPlanetaryStrength,
  });
}
