// src/lib/ai/report.ts
// Server-only — never import from a "use client" file (reads
// OPENROUTER_API_KEY_FREE / OPENROUTER_MODEL_FREE / OPENROUTER_MODEL_FALLBACK).
//
// A REUSABLE structured-report generator. Not specific to any one tool —
// numerology is the first caller, but every wave-2 astrology tool (birth
// chart, matching, dosha, etc.) generates its AI-interpretation layer
// through this same function, handing it real calculated data and
// tool-specific section instructions. Mirrors the request/validate/retry
// shape of src/lib/horoscope/openrouter.ts; see that file for the
// pattern this extends.

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type ReportSection = { title: string; content: string };

export type StructuredReport = {
  summary: string;
  sections: ReportSection[];
  highlights: string[];
  recommendations: string[];
};

// Baked into every prompt this module builds so no caller can forget it —
// the interpretive language every reading must stay within, regardless
// of which tool is asking.
const SAFETY_INSTRUCTION = `Safety and tone rules — apply to every sentence:
- Never state a guaranteed outcome. Do not use words like "will definitely", "guaranteed", "certainly happen", "always".
- Never present medical, legal, or financial claims as fact or as advice to act on. If a topic brushes health, money, or legal matters, frame it as a general tendency, not a directive.
- Use interpretive, tradition-framed language throughout, e.g. "traditionally associated with…", "this reading suggests…", "according to the calculated placement…", "many traditions hold that…".
- Warm, grounded, encouraging tone — never fear-based, never fatalistic, never robotic.`;

/** Pure — builds the full report-generation prompt from real calculated
 * data (never asks the model to invent numbers/placements) plus
 * tool-specific instructions describing what sections to cover. */
export function buildReportPrompt(
  toolName: string,
  calculatedData: Record<string, unknown>,
  instructions: string
): string {
  return `You are a professional astrologer and numerologist writing an interpretive report for a premium spiritual-guidance website. This report is for the "${toolName}" tool.

The following data has already been calculated using real, deterministic math or astrological placements. Treat every value below as ground truth — never invent, alter, or contradict any of it. Your job is only to interpret it:
${JSON.stringify(calculatedData, null, 2)}

${instructions}

${SAFETY_INSTRUCTION}

Respond with ONLY a single JSON object, no markdown fences, no commentary, matching exactly this shape:
{
  "summary": "a 2-4 sentence overview of the whole reading",
  "sections": [
    { "title": "...", "content": "..." }
  ],
  "highlights": ["short punchy highlight", "..."],
  "recommendations": ["a grounded, actionable suggestion", "..."]
}
"sections" must have at least one entry, each with non-empty "title" and "content" strings. "highlights" and "recommendations" must be arrays of non-empty strings — they may be empty arrays if genuinely nothing applies, but prefer including 2-3 of each.`;
}

/** Hand-rolled runtime type guard for the one place untrusted data enters
 * this path: the LLM's response. Nothing downstream should ever see a
 * shape it doesn't expect. */
export function isValidStructuredReport(value: unknown): value is StructuredReport {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  if (typeof v.summary !== "string" || v.summary.trim() === "") return false;

  if (!Array.isArray(v.sections) || v.sections.length === 0) return false;
  for (const section of v.sections) {
    if (typeof section !== "object" || section === null) return false;
    const s = section as Record<string, unknown>;
    if (typeof s.title !== "string" || s.title.trim() === "") return false;
    if (typeof s.content !== "string" || s.content.trim() === "") return false;
  }

  if (!Array.isArray(v.highlights) || !v.highlights.every((h) => typeof h === "string")) {
    return false;
  }
  if (
    !Array.isArray(v.recommendations) ||
    !v.recommendations.every((r) => typeof r === "string")
  ) {
    return false;
  }

  return true;
}

// Thrown only for a genuine call failure (network error, non-2xx,
// unparseable response body) — distinct from "call succeeded but the
// JSON didn't match StructuredReport", which is a validation failure the
// caller retries once with a stricter prompt instead of falling back to
// another model.
class OpenRouterCallError extends Error {}

async function callOpenRouter(prompt: string, apiKey: string, model: string): Promise<unknown> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.8,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    throw new OpenRouterCallError(`OpenRouter request failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new OpenRouterCallError("OpenRouter response had no message content");

  try {
    return JSON.parse(content);
  } catch {
    throw new OpenRouterCallError("OpenRouter response was not valid JSON");
  }
}

// Small random delay before a retry — "don't hammer the provider" rather
// than a real backoff schedule, since the total attempt budget is tiny.
function jitterDelayMs(): number {
  return 200 + Math.random() * 400;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STRICT_RETRY_SUFFIX = `

IMPORTANT: your previous response did not match the required JSON shape exactly. Respond with ONLY the raw JSON object described above — "summary" a non-empty string, "sections" a non-empty array of {title, content} objects with both non-empty strings, "highlights" and "recommendations" as arrays of strings (empty arrays are fine, but they must be arrays).`;

/**
 * Generates and validates a StructuredReport for `toolName` from
 * already-calculated data. Uses OPENROUTER_API_KEY_FREE /
 * OPENROUTER_MODEL_FREE by default — this is the lower-stakes
 * interpretive-text path, not the paid horoscope-generation one.
 *
 * Retry shape mirrors generateAllSignReadings exactly: if the first
 * response parses but doesn't validate, retry once with a stricter
 * prompt on the same model. That is the ONLY retry for a shape failure —
 * two shape-invalid responses in a row means the model/prompt needs a
 * human look, not a fallback.
 *
 * Separately, if the call fails outright (not just invalid-JSON — a
 * network error, non-2xx, or unparseable body) at any point, or
 * OPENROUTER_MODEL_FREE isn't set, and OPENROUTER_MODEL_FALLBACK IS set,
 * one final attempt is made with that model. Total attempts across
 * primary + fallback never exceed 3 — a small, bounded retry budget
 * (circuit breaker, not an unbounded loop), with a jittered delay
 * between attempts.
 */
export async function generateStructuredReport(
  toolName: string,
  calculatedData: Record<string, unknown>,
  instructions: string
): Promise<StructuredReport> {
  const apiKey = process.env.OPENROUTER_API_KEY_FREE;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY_FREE is not set");

  const model = process.env.OPENROUTER_MODEL_FREE;
  const fallbackModel = process.env.OPENROUTER_MODEL_FALLBACK;
  const prompt = buildReportPrompt(toolName, calculatedData, instructions);

  let hardFailure = false;
  let lastError: unknown = null;

  if (model) {
    try {
      const first = await callOpenRouter(prompt, apiKey, model);
      if (isValidStructuredReport(first)) return first;

      await sleep(jitterDelayMs());
      const second = await callOpenRouter(`${prompt}${STRICT_RETRY_SUFFIX}`, apiKey, model);
      if (isValidStructuredReport(second)) return second;

      // Shape-invalid twice in a row — a provider-fallback wouldn't fix a
      // prompt/model mismatch, so this is a hard error, not a fallback case.
      throw new Error(
        `generateStructuredReport: OpenRouter returned an invalid report shape for "${toolName}" after one retry`
      );
    } catch (err) {
      if (err instanceof OpenRouterCallError) {
        hardFailure = true;
        lastError = err;
      } else {
        throw err;
      }
    }
  } else {
    hardFailure = true;
    lastError = new Error("OPENROUTER_MODEL_FREE is not set");
  }

  if (hardFailure && fallbackModel) {
    await sleep(jitterDelayMs());
    const fallback = await callOpenRouter(prompt, apiKey, fallbackModel);
    if (isValidStructuredReport(fallback)) return fallback;
    throw new Error(
      `generateStructuredReport: fallback model returned an invalid report shape for "${toolName}"`
    );
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`generateStructuredReport: failed to generate a report for "${toolName}"`);
}
