// src/app/api/compatibility/route.ts
//
// SHARED-CALCULATION DECISION — see src/app/api/kundli-matching/route.ts's
// top comment for the full rationale; summary: both routes resolve each
// person's real Moon sign + nakshatra locally (calculateChart, no
// network call) and feed them into the exact same calculateAshtakoot()
// (src/lib/ashtakoot/calculate.ts) — never a separate, fabricated
// "compatibility algorithm". Only the framing differs: Kundli Matching
// leads with the traditional koota breakdown and a matchmaking-style AI
// interpretation; this route leads with a plain-language
// relationship-dynamics summary and asks the AI to interpret the SAME
// real koota data as emotional compatibility, communication style,
// relationship dynamics, strengths, and potential challenges — narrated
// for "you"/"your partner" rather than bride/groom. The real total
// score and full 8-koota breakdown are still always returned and shown
// (never hidden behind prose only) — see CompatibilityForm.tsx.
//
// Role mapping: the Compatibility page renders BirthDetailsForm twice,
// labeled "Your Details" (personA) and "Partner's Details" (personB) —
// deliberately neutral framing, unlike Kundli Matching's Bride/Groom
// labels. Because traditional Ashtakoot matching (and its one
// directional koota, Varna) is fixed to a male/female convention,
// personA is still treated as the `female` role and personB as `male`
// — the same fixed mapping Kundli Matching uses. This is disclosed to
// the user near the form ("traditional Vedic matching uses male/female
// birth charts") rather than hidden — see CompatibilityForm.tsx.
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
import { logAudit } from "@/lib/observability/audit-log";
import type { BirthInput } from "@/lib/astrology/types";
import type {
  CompatibilityChartData,
  CompatibilityYoga,
  CompatibilityPlanetaryStrength,
} from "@/components/compatibility/types";

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
function toChartViewData(chart: ChartData): CompatibilityChartData {
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
      {} as CompatibilityChartData["planets"]
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
function toNavamsaViewData(chart: ChartData): CompatibilityChartData {
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
      {} as CompatibilityChartData["planets"]
    ),
  };
}

/** This person's own classical yogas only (src/lib/astro-engine/yogas.ts)
 * — reads ONLY the single `chart` passed in, never any shared state. */
function toYogasViewData(chart: ChartData): CompatibilityYoga[] {
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
function toPlanetaryStrengthViewData(chart: ChartData): CompatibilityPlanetaryStrength[] {
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

const ROUTE_KEY = "compatibility";

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
    logAudit({ route: ROUTE_KEY, calculationType: "two-person-match", outcome: "rate_limited" });
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    logAudit({ route: ROUTE_KEY, calculationType: "two-person-match", outcome: "validation_error" });
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const you = validateMatchPersonInput(body?.personA, "You");
  if ("error" in you) {
    logAudit({ route: ROUTE_KEY, calculationType: "two-person-match", outcome: "validation_error" });
    return NextResponse.json({ error: you.error }, { status: 400 });
  }

  const partner = validateMatchPersonInput(body?.personB, "Your partner");
  if ("error" in partner) {
    logAudit({ route: ROUTE_KEY, calculationType: "two-person-match", outcome: "validation_error" });
    return NextResponse.json({ error: partner.error }, { status: 400 });
  }

  const femaleInput = buildMatchBirthInput(you, "You");
  if ("error" in femaleInput) {
    logAudit({ route: ROUTE_KEY, calculationType: "two-person-match", outcome: "validation_error" });
    return NextResponse.json({ error: femaleInput.error }, { status: 400 });
  }

  const maleInput = buildMatchBirthInput(partner, "Your partner");
  if ("error" in maleInput) {
    logAudit({ route: ROUTE_KEY, calculationType: "two-person-match", outcome: "validation_error" });
    return NextResponse.json({ error: maleInput.error }, { status: 400 });
  }

  let result;
  let youChartView: CompatibilityChartData;
  let partnerChartView: CompatibilityChartData;
  let youNavamsaView: CompatibilityChartData;
  let partnerNavamsaView: CompatibilityChartData;
  let youYogas: CompatibilityYoga[];
  let partnerYogas: CompatibilityYoga[];
  let youPlanetaryStrength: CompatibilityPlanetaryStrength[];
  let partnerPlanetaryStrength: CompatibilityPlanetaryStrength[];
  const calcStart = Date.now();
  try {
    const youChart = calculateChart(
      birthInputToUtc(femaleInput),
      femaleInput.latitude,
      femaleInput.longitude
    );
    const partnerChart = calculateChart(
      birthInputToUtc(maleInput),
      maleInput.latitude,
      maleInput.longitude
    );
    result = calculateAshtakoot(
      { moonSign: youChart.planets.Moon.sign, nakshatraNumber: youChart.planets.Moon.nakshatra.nakshatraNumber },
      { moonSign: partnerChart.planets.Moon.sign, nakshatraNumber: partnerChart.planets.Moon.nakshatra.nakshatraNumber }
    );
    youChartView = toChartViewData(youChart);
    partnerChartView = toChartViewData(partnerChart);
    // Each person's Navamsa/yogas/Shadbala below is computed from that
    // person's own already-computed `youChart`/`partnerChart` ChartData
    // object only — no shared/global state, mirroring
    // toChartViewData() above.
    youNavamsaView = toNavamsaViewData(youChart);
    partnerNavamsaView = toNavamsaViewData(partnerChart);
    youYogas = toYogasViewData(youChart);
    partnerYogas = toYogasViewData(partnerChart);
    youPlanetaryStrength = toPlanetaryStrengthViewData(youChart);
    partnerPlanetaryStrength = toPlanetaryStrengthViewData(partnerChart);
  } catch (err) {
    // Never log either person's full name/DOB/coordinates — only the
    // failure and which step it happened in.
    console.error(
      "[compatibility] Ashtakoot calculation failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    logAudit({ route: ROUTE_KEY, calculationType: "two-person-match", outcome: "calculation_error" });
    return NextResponse.json(
      { error: "We couldn't calculate your compatibility right now. Please try again shortly." },
      { status: 502 }
    );
  }

  const timeUnknown = you.timeUnknown || partner.timeUnknown;
  const youPresentYogaNames = youYogas.filter((y) => y.present).map((y) => y.name);
  const partnerPresentYogaNames = partnerYogas.filter((y) => y.present).map((y) => y.name);

  // The real calculated Ashtakoot data above must always reach the
  // client, even if the AI-interpretation layer fails.
  let report: StructuredReport | null = null;
  let reportError = false;
  try {
    report = await generateStructuredReport(
      "compatibility",
      { ashtakoot: result, timeUnknown, youPresentYogaNames, partnerPresentYogaNames },
      `The data above is a real Ashtakoot (Vedic astrological match-making) calculation between two people — treat "personA" fields as Person A ("you") and "personB" fields as Person B ("your partner"), and do NOT use the words "bride", "groom", "marriage", or "wedding" anywhere in your response. Each koota (varna, vashya, tara, yoni, grahaMaitri, gana, bhakoot, nadi) is an object with "score"/"outOf"/"personA"/"personB". Interpret this same real data through a modern relationship-dynamics lens, grounded only in the real koota scores given above — never invent a dynamic the data doesn't support. Cover exactly these 5 sections, in this order: (1) "Emotional Compatibility" — interpret the Graha Maitri koota (mental/friendship compatibility, field "grahaMaitri") and the Gana koota (temperament compatibility); (2) "Communication Style" — interpret the Vashya koota (the mutual-influence dynamic) and the Varna koota (ego/self-respect compatibility); (3) "Relationship Dynamics & Attraction" — interpret the Yoni koota (physical/instinctual compatibility) and the Tara koota (well-being/rapport); (4) "Strengths of This Pairing" — highlight what the highest-scoring kootas suggest comes naturally easily between these two people; (5) "Potential Challenges" — gently frame what the lowest-scoring or zero-scoring kootas (including Bhakoot and Nadi — note "bhakootDosha"/"nadiDosha" if true) suggest as growth areas to be mindful of, explicitly NOT as a dealbreaker or a prediction of failure. If "youPresentYogaNames" and/or "partnerPresentYogaNames" is non-empty, briefly name that person's classical yoga(s) as traditionally significant combinations present in their chart (name only, no invented meaning beyond that). If "timeUnknown" is true, add one brief closing line noting a default time (12:00) was used for at least one person in the absence of an exact birth time, which can shift these results.`
    );
  } catch (err) {
    console.error(
      "[compatibility] report generation failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    logAudit({ route: ROUTE_KEY, calculationType: "two-person-match", outcome: "report_error" });
    reportError = true;
  }

  logAudit({
    route: ROUTE_KEY,
    calculationType: "two-person-match",
    outcome: "success",
    durationMs: Date.now() - calcStart,
  });

  return NextResponse.json({
    result,
    timeUnknown,
    report,
    reportError,
    youChart: youChartView,
    partnerChart: partnerChartView,
    youNavamsaChart: youNavamsaView,
    partnerNavamsaChart: partnerNavamsaView,
    youYogas,
    partnerYogas,
    youPlanetaryStrength,
    partnerPlanetaryStrength,
  });
}
