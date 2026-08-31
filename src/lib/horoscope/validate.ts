// Guards the one place untrusted data enters this system: the LLM's
// response. Nothing downstream (Firestore write, page render) should
// ever see a shape it doesn't expect.
import { ZODIAC_ORDER, type ZodiacSlug } from "./zodiac.ts";
import { SIGN_READING_REQUIRED_STRING_KEYS, type SignReading } from "./types.ts";

export function isValidSignReading(value: unknown): value is SignReading {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  for (const key of SIGN_READING_REQUIRED_STRING_KEYS) {
    if (typeof v[key] !== "string" || (v[key] as string).trim() === "") {
      return false;
    }
  }

  if (typeof v.luckyNumber !== "number" || !Number.isFinite(v.luckyNumber)) {
    return false;
  }

  if (v.mood !== undefined && typeof v.mood !== "string") return false;
  if (v.compatibility !== undefined && typeof v.compatibility !== "string") {
    return false;
  }

  return true;
}

export function validateGeneratedSet(
  raw: unknown
): Record<ZodiacSlug, SignReading> | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const result = {} as Record<ZodiacSlug, SignReading>;

  for (const slug of ZODIAC_ORDER) {
    const entry = r[slug];
    if (!isValidSignReading(entry)) return null;
    result[slug] = entry;
  }

  return result;
}
