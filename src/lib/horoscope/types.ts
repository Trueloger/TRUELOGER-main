import type { ZodiacSlug } from "./zodiac.ts";

export type SignReading = {
  overview: string;
  love: string;
  career: string;
  finance: string;
  health: string;
  luckyNumber: number;
  luckyColor: string;
  theme: string;
  mood?: string;
  compatibility?: string;
};

// The string-valued required fields, used by validate.ts to check
// presence/type generically. luckyNumber is handled separately there
// (numeric, not string). mood/compatibility are optional — not listed.
export const SIGN_READING_REQUIRED_STRING_KEYS = [
  "overview", "love", "career", "finance", "health", "luckyColor", "theme",
] as const;

export type DailyHoroscopeDoc = {
  date: string; // "YYYY-MM-DD", IST calendar date
  generatedAt: string; // ISO timestamp
  model: string;
  signs: Record<ZodiacSlug, SignReading>;
};
