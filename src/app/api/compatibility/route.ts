// src/app/api/compatibility/route.ts
//
// SHARED-CALCULATION DECISION — see src/app/api/kundli-matching/route.ts's
// top comment for the full rationale; summary: FreeAstrologyAPI exposes
// exactly one real two-chart calculation
// (POST /match-making/ashtakoot-score, wrapped as getAshtakootMatch()),
// and this route calls that exact same function on two resolved
// BirthInputs — never a separate, fabricated "compatibility algorithm".
// Only the framing differs: Kundli Matching leads with the traditional
// koota breakdown and a matchmaking-style AI interpretation; this route
// leads with a plain-language relationship-dynamics summary and asks
// the AI to interpret the SAME real koota data as emotional
// compatibility, communication style, relationship dynamics, strengths,
// and potential challenges — narrated for "you"/"your partner" rather
// than bride/groom. The real total score and full 8-koota breakdown are
// still always returned and shown (never hidden behind prose only) —
// see CompatibilityForm.tsx.
//
// Role mapping: the Compatibility page renders BirthDetailsForm twice,
// labeled "Your Details" (personA) and "Partner's Details" (personB) —
// deliberately neutral framing, unlike Kundli Matching's Bride/Groom
// labels. Because FreeAstrologyAPI's match-making endpoint is fixed to
// a male/female request shape (there is no generic personA/personB
// shape in the real API), personA is still sent as the `female` role
// and personB as `male` — the same fixed mapping Kundli Matching uses.
// This is disclosed to the user near the form ("traditional Vedic
// matching uses male/female birth charts") rather than hidden — see
// CompatibilityForm.tsx.
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

const ROUTE_KEY = "compatibility";

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

  const you = validateMatchPersonInput(body?.personA, "You");
  if ("error" in you) return NextResponse.json({ error: you.error }, { status: 400 });

  const partner = validateMatchPersonInput(body?.personB, "Your partner");
  if ("error" in partner) return NextResponse.json({ error: partner.error }, { status: 400 });

  const femaleInput = buildMatchBirthInput(you, "You");
  if ("error" in femaleInput) {
    return NextResponse.json({ error: femaleInput.error }, { status: 400 });
  }

  const maleInput = buildMatchBirthInput(partner, "Your partner");
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
      "[compatibility] getAshtakootMatch failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    return NextResponse.json(
      { error: "We couldn't calculate your compatibility right now. Please try again shortly." },
      { status: 502 }
    );
  }

  const timeUnknown = you.timeUnknown || partner.timeUnknown;

  // The real calculated Ashtakoot data above must always reach the
  // client, even if the AI-interpretation layer fails.
  let report: StructuredReport | null = null;
  let reportError = false;
  try {
    report = await generateStructuredReport(
      "compatibility",
      { ashtakoot: match.output, timeUnknown },
      `The data above is a real Ashtakoot (Vedic astrological match-making) calculation between two people, labeled "bride" and "groom" only because that is the underlying calculation engine's fixed field naming — treat the "bride" fields as Person A ("you") and the "groom" fields as Person B ("your partner"), and do NOT use the words "bride", "groom", "marriage", or "wedding" anywhere in your response. Interpret this same real data through a modern relationship-dynamics lens, grounded only in the real koota scores given above — never invent a dynamic the data doesn't support. Cover exactly these 5 sections, in this order: (1) "Emotional Compatibility" — interpret the Graha Maitri koota (mental/friendship compatibility) and the Gana koota (temperament compatibility, field "gana_kootam"); (2) "Communication Style" — interpret the Vashya koota (field "vasya_kootam", the mutual-influence dynamic) and the Varna koota (ego/self-respect compatibility); (3) "Relationship Dynamics & Attraction" — interpret the Yoni koota (physical/instinctual compatibility) and the Tara koota (well-being/rapport); (4) "Strengths of This Pairing" — highlight what the highest-scoring kootas suggest comes naturally easily between these two people; (5) "Potential Challenges" — gently frame what the lowest-scoring or zero-scoring kootas (including Bhakoot, field "rasi_kootam", and Nadi, field "nadi_kootam") suggest as growth areas to be mindful of, explicitly NOT as a dealbreaker or a prediction of failure. If "timeUnknown" is true, add one brief closing line noting a default time (12:00) was used for at least one person in the absence of an exact birth time, which can shift these results.`
    );
  } catch (err) {
    console.error(
      "[compatibility] report generation failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    reportError = true;
  }

  return NextResponse.json({ result: match.output, timeUnknown, report, reportError });
}
