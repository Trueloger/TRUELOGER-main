// src/app/api/kundli-matching/route.ts
//
// SHARED-CALCULATION DECISION — read before touching this file or
// src/app/api/compatibility/route.ts: FreeAstrologyAPI exposes exactly
// ONE real two-chart calculation endpoint,
// POST /match-making/ashtakoot-score (Ashtakoot / Guna Milan
// match-making), wrapped as getAshtakootMatch() in
// src/lib/astrology/freeastrologyapi.ts. There is no separate "generic
// compatibility score" endpoint anywhere in the real API. Rather than
// fabricate a second, different "compatibility algorithm" for the
// Compatibility tool, BOTH this route and
// src/app/api/compatibility/route.ts call this exact same
// getAshtakootMatch() function on two resolved BirthInputs. What
// differs between the two tools is presentation only:
//   - Kundli Matching (here): traditional, Ashtakoot-first framing — the
//     AI `instructions` below ask for a traditional Vedic matchmaking
//     interpretation (koota-by-koota, doshas, a verdict on the /36
//     total score).
//   - Compatibility (../compatibility/route.ts): the SAME real
//     Ashtakoot data, reframed through a modern relationship-dynamics
//     lens (emotional compatibility, communication, relationship
//     dynamics, strengths, potential challenges), narrated for
//     "you"/"your partner" instead of bride/groom.
// Every score either tool renders (total_score, each koota's score) is
// the same real number from the same API call — never invented, never
// recomputed differently per tool.
//
// Role mapping: the Kundli Matching page renders BirthDetailsForm
// twice, labeled "Bride" (personA) and "Groom" (personB) — traditional
// terms matching this tool's framing. personA is always sent to
// FreeAstrologyAPI as the `female` role and personB as `male`, since
// the API's request/response shape is fixed to those two named roles
// (see AshtakootMatchResult's bride/groom sub-fields in
// src/lib/astrology/types.ts) rather than a generic personA/personB.
import { NextResponse } from "next/server";
import { getAshtakootMatch } from "@/lib/astrology/freeastrologyapi";
import {
  validateMatchPersonInput,
  buildMatchBirthInput,
  type RawPersonInput,
} from "@/lib/astrology/match-request";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit/firestore-rate-limit";
import { generateStructuredReport, type StructuredReport } from "@/lib/ai/report";

// Two resolved birth charts + one match-making calculation + the AI
// interpretation layer, all in one request — give it real headroom.
export const maxDuration = 30;

const ROUTE_KEY = "kundli-matching";

type RequestBody = { personA?: RawPersonInput; personB?: RawPersonInput };

export async function POST(request: Request) {
  // Rate-limit first — this route calls a metered external API on every
  // request, before any other work happens. Lower limit than the
  // single-person tools (6/min, not 10/min): one call here resolves TWO
  // people's data and builds a bigger report prompt.
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

  let match;
  try {
    match = await getAshtakootMatch(maleInput, femaleInput);
  } catch (err) {
    // Never log either person's full name/DOB/coordinates — only the
    // failure and which step it happened in.
    console.error(
      "[kundli-matching] getAshtakootMatch failed:",
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
      { ashtakoot: match.output, timeUnknown },
      `Write a traditional Vedic Kundli Matching (Ashtakoot / Guna Milan) reading for this bride and groom, based only on the real calculated koota scores above — never invent a score. The total score ("total_score") is out of 36 ("out_of"), summed across 8 kootas: Varna, Vashya (field "vasya_kootam"), Tara, Yoni, Graha Maitri, Gana (field "gana_kootam"), Bhakoot (field "rasi_kootam"), and Nadi (field "nadi_kootam"). Cover exactly these 4 sections, in this order: (1) "Overall Verdict" — interpret the total score against traditional Ashtakoot guidelines (below 18 traditionally considered weak, 18-24 acceptable, 25-31 favorable, 32-36 excellent), framed as traditional guidance, never a guarantee of relationship success or failure; (2) "Strongest Kootas" — interpret the 2-3 highest-scoring kootas and what they traditionally suggest about this pairing; (3) "Kootas Needing Attention" — gently interpret the lowest-scoring kootas, explicitly naming whether Nadi Dosha (nadi_kootam.score is 0) or Bhakoot Dosha (rasi_kootam.score is 0) is present, and what tradition says about each; (4) "Traditional Guidance" — a grounded, respectful closing note for the couple and families, mentioning that a qualified astrologer can review remedies for any dosha traditionally found. Use traditional Vedic matchmaking language throughout ("the bride's chart", "the groom's chart", "this koota traditionally reflects..."). If "timeUnknown" is true, add one brief closing line noting a default birth time (12:00) was used for at least one chart in the absence of an exact time, and that the Tara/Yoni/Gana/Bhakoot/Nadi kootas in particular can shift with a more precise birth time.`
    );
  } catch (err) {
    console.error(
      "[kundli-matching] report generation failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    reportError = true;
  }

  return NextResponse.json({ result: match.output, timeUnknown, report, reportError });
}
