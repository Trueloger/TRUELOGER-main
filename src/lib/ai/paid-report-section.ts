// src/lib/ai/paid-report-section.ts
// Server-only, paid-tier section generator for the Personalized Reports
// system — separate from src/lib/ai/report.ts (which uses the FREE
// OpenRouter tier for the existing free tools' interpretive text).
// Reads OPENROUTER_API_KEY_PAID / OPENROUTER_MODEL_PAID — the paid
// Claude Sonnet configuration already present in .env.local. Never
// import from a "use client" file; the key must never reach the browser.
//
// Generates ONE report section at a time (never the whole 30-60 page
// report in a single call — AGENTS §19/§25/§26) and returns
// STRUCTURED content only (paragraphs/table/keyPoints/remedies), never
// raw HTML — TrueLoger's own renderer turns this into markup, so the
// model can never inject arbitrary markup into a customer-facing page
// (AGENTS §45/§46).
import type { ReportSectionContent } from "@/lib/reports/types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const SAFETY_INSTRUCTION = `Safety and tone rules — apply to every sentence:
- Never state a guaranteed outcome. Avoid "will definitely", "guaranteed", "certainly happen", "always".
- Never present medical, legal, or financial claims as fact or directive. Frame anything touching health, money, or legal matters as a traditional astrological tendency, not advice to act on — e.g. "Traditional astrological interpretation suggests..." rather than "You will definitely...".
- Use interpretive, tradition-framed language throughout.
- Warm, grounded, premium tone — never fear-based, never fatalistic, never generic filler.
- Write ONLY about the one person described in the data below. Never mention any other person, name, or chart.`;

export type SectionGenerationInput = {
  reportTypeName: string; // e.g. "Marriage Report"
  sectionTitle: string;
  /** What this section should cover and how — the developer-controlled
   * blueprint instruction, never user- or admin-suppliable (AGENTS §79). */
  instructions: string;
  /** ONLY the calculation fields this section actually needs — never
   * the full AstrologySnapshot dumped into every prompt (keeps the
   * prompt lean and avoids exposing unrelated personal data per
   * AGENTS §78/§145). Treated as ground truth, never to be altered. */
  relevantData: Record<string, unknown>;
  personName: string;
  /** Rough word budget so the section's length matches its share of
   * the report's overall page target (AGENTS §18/§19) — a guideline
   * for the model, not a hard contract; the renderer's own
   * estimatedPages is what the length controller actually trusts. */
  targetWords: { min: number; max: number };
  /** true for sections where a "Traditional Remedies" list is
   * appropriate; false suppresses the `remedies` field entirely rather
   * than padding every section with one. */
  includeRemedies?: boolean;
};

function buildPrompt(input: SectionGenerationInput): string {
  return `You are a professional Vedic astrologer writing one section of a premium personalized "${input.reportTypeName}" for TrueLoger, an Indian astrology platform. You are writing for ${input.personName}.

The following astrological data has already been calculated using real deterministic math. Treat every value as ground truth — never invent, alter, guess, or contradict any of it. Your job is only to interpret it:
${JSON.stringify(input.relevantData, null, 2)}

Section to write: "${input.sectionTitle}"
${input.instructions}

Target length: approximately ${input.targetWords.min}-${input.targetWords.max} words of narrative content across the paragraphs.
${input.includeRemedies ? "Include 2-4 traditional remedies genuinely relevant to this section's topic." : "Do not include a remedies list for this section."}

${SAFETY_INSTRUCTION}

Respond with ONLY a single JSON object, no markdown fences, no commentary, matching exactly this shape:
{
  "paragraphs": ["paragraph 1 text", "paragraph 2 text", "..."],
  "table": { "headers": ["..."], "rows": [["...", "..."]] } | null,
  "keyPoints": ["short punchy point", "..."],
  "remedies": ["traditional remedy", "..."] | null
}
"paragraphs" must be a non-empty array of substantive, non-empty strings. "table" is optional — include it ONLY if a genuine tabular breakdown (e.g. a list of yogas, dasha periods, planetary strengths) improves the section; otherwise use null. "keyPoints" should have 2-5 short entries. "remedies" must be null unless remedies were requested above.`;
}

// The RAW shape the model is asked for — a plain string[][] for
// table.rows, the simplest shape to prompt an LLM for. This is
// deliberately NOT ReportSectionContent: Firestore can't store an
// array nested directly inside another array (only inside a map), so
// normalizeSection() below wraps each row in `{ cells: [...] }` before
// this ever reaches a Firestore write. Caught live — the
// demo-generation script actually failed on this exact shape before
// this fix existed, not a guessed hazard.
type RawSectionContent = {
  paragraphs: string[];
  table?: { headers: string[]; rows: string[][] } | null;
  keyPoints?: string[];
  remedies?: string[] | null;
};

function isValidRawSectionContent(value: unknown): value is RawSectionContent {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.paragraphs) || v.paragraphs.length === 0) return false;
  if (!v.paragraphs.every((p) => typeof p === "string" && p.trim() !== "")) return false;

  if (v.table !== undefined && v.table !== null) {
    const t = v.table as Record<string, unknown>;
    if (!Array.isArray(t.headers) || !t.headers.every((h) => typeof h === "string")) return false;
    if (!Array.isArray(t.rows) || !t.rows.every((r) => Array.isArray(r) && r.every((c) => typeof c === "string"))) {
      return false;
    }
  }
  if (v.keyPoints !== undefined && (!Array.isArray(v.keyPoints) || !v.keyPoints.every((k) => typeof k === "string"))) {
    return false;
  }
  if (v.remedies !== undefined && v.remedies !== null) {
    if (!Array.isArray(v.remedies) || !v.remedies.every((r) => typeof r === "string")) return false;
  }
  return true;
}

class PaidOpenRouterCallError extends Error {}

async function callOpenRouter(prompt: string, apiKey: string, model: string): Promise<unknown> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
    // A single section, not the whole report — kept well under the
    // route's own maxDuration so one slow section can't starve the
    // others in the same processing batch.
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) {
    // Never include the key in the error — nothing here logs it either.
    throw new PaidOpenRouterCallError(`OpenRouter (paid) request failed: ${res.status}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new PaidOpenRouterCallError("OpenRouter (paid) response had no content");
  try {
    return JSON.parse(content);
  } catch {
    throw new PaidOpenRouterCallError("OpenRouter (paid) response was not valid JSON");
  }
}

const STRICT_RETRY_SUFFIX = `

IMPORTANT: your previous response did not match the required JSON shape exactly. Respond with ONLY the raw JSON object described above.`;

/** Generates and validates ONE report section. Bounded retry budget —
 * at most one same-model strict retry on a shape failure, matching the
 * free-tier generator's own policy (AGENTS §44: controlled retries,
 * never unlimited). Throws on failure; the caller (generate.ts) is
 * responsible for section-level (not whole-report) retry bookkeeping. */
export async function generatePaidReportSection(input: SectionGenerationInput): Promise<ReportSectionContent> {
  const apiKey = process.env.OPENROUTER_API_KEY_PAID;
  const model = process.env.OPENROUTER_MODEL_PAID;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY_PAID is not set");
  if (!model) throw new Error("OPENROUTER_MODEL_PAID is not set");

  const prompt = buildPrompt(input);
  const first = await callOpenRouter(prompt, apiKey, model);
  if (isValidRawSectionContent(first)) return normalizeSection(first);

  const second = await callOpenRouter(`${prompt}${STRICT_RETRY_SUFFIX}`, apiKey, model);
  if (isValidRawSectionContent(second)) return normalizeSection(second);

  throw new Error(`generatePaidReportSection: invalid shape for section "${input.sectionTitle}" after retry`);
}

function normalizeSection(raw: RawSectionContent): ReportSectionContent {
  return {
    paragraphs: raw.paragraphs,
    table: raw.table ? { headers: raw.table.headers, rows: raw.table.rows.map((cells) => ({ cells })) } : undefined,
    keyPoints: raw.keyPoints ?? undefined,
    remedies: raw.remedies ?? undefined,
  };
}
