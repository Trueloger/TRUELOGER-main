// src/lib/horoscope/openrouter.ts
// Server-only — never import from a "use client" file (reads
// OPENROUTER_API_KEY_PAID).
import { ZODIAC_ORDER, ZODIAC_META, type ZodiacSlug } from "./zodiac.ts";
import { validateGeneratedSet } from "./validate.ts";
import type { SignReading } from "./types.ts";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Pure — builds the full generation prompt for a given IST date.
 * Requests all 12 signs in one call: cheaper than 12 separate calls,
 * and letting the model see all 12 at once is what keeps it from
 * repeating the same phrasing across signs. */
export function buildHoroscopePrompt(date: string): string {
  const signLines = ZODIAC_ORDER.map((slug) => {
    const m = ZODIAC_META[slug];
    return `- ${m.name} (${slug}): ${m.dateRange}, ${m.element} sign`;
  }).join("\n");

  return `You are a professional astrologer writing today's (${date}) daily horoscope for a premium astrology website. Write a complete, distinct reading for EACH of the following 12 zodiac signs:
${signLines}

For each sign, write:
- overview: 2-3 sentences, the day's general reading
- love: 1-2 sentences
- career: 1-2 sentences
- finance: 1-2 sentences
- health: 1-2 sentences
- luckyNumber: a whole number from 1 to 99
- luckyColor: one color name
- theme: a short one-line theme for the day (max 8 words)

Tone: warm, inspirational, spiritual, premium — never robotic. Each sign's reading must read as genuinely distinct from every other sign's — do not reuse the same sentence structure or phrasing across signs.

Do not include: fear-based predictions, absolute guarantees, medical diagnoses, extreme financial claims, or guaranteed life outcomes.

Respond with ONLY a single JSON object, no markdown fences, no commentary, matching exactly this shape (one entry per sign slug, using these exact slugs: ${ZODIAC_ORDER.join(", ")}):
{
  "aries": { "overview": "...", "love": "...", "career": "...", "finance": "...", "health": "...", "luckyNumber": 0, "luckyColor": "...", "theme": "..." },
  "taurus": { "...": "..." }
}`;
}

async function callOpenRouter(prompt: string): Promise<unknown> {
  const apiKey = process.env.OPENROUTER_API_KEY_PAID;
  const model = process.env.OPENROUTER_MODEL_FREE;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY_PAID is not set");
  if (!model) throw new Error("OPENROUTER_MODEL_FREE is not set");

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
      temperature: 0.9,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter request failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter response had no message content");

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("OpenRouter response was not valid JSON");
  }
}

/** Generates and validates all 12 signs' readings for `date`. Retries
 * once with a stricter prompt if the first response doesn't validate —
 * malformed JSON or a missing sign is the only failure worth a second
 * try; if it fails twice in a row the model/prompt needs a human look,
 * not a retry loop. */
export async function generateAllSignReadings(
  date: string
): Promise<Record<ZodiacSlug, SignReading>> {
  const prompt = buildHoroscopePrompt(date);

  const first = await callOpenRouter(prompt);
  const validated = validateGeneratedSet(first);
  if (validated) return validated;

  const retryPrompt = `${prompt}\n\nIMPORTANT: your previous response did not match the required JSON shape exactly. Respond with ONLY the raw JSON object described above — all 12 signs, all required fields present and non-empty, luckyNumber as a number not a string.`;
  const second = await callOpenRouter(retryPrompt);
  const validatedRetry = validateGeneratedSet(second);
  if (validatedRetry) return validatedRetry;

  throw new Error("OpenRouter returned an invalid horoscope set after one retry");
}
