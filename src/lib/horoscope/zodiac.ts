// Canonical zodiac metadata, shared by server logic (validation, static
// params, prompt building) and UI data (see
// src/components/horoscope/zodiac-ui-data.ts, which attaches icon
// components to this). Kept dependency-free (no React import) so
// server-only modules can import it without pulling UI code in.

export type ZodiacSlug =
  | "aries" | "taurus" | "gemini" | "cancer" | "leo" | "virgo"
  | "libra" | "scorpio" | "sagittarius" | "capricorn" | "aquarius" | "pisces";

export type ZodiacMeta = {
  slug: ZodiacSlug;
  name: string;
  symbol: string;
  dateRange: string;
  element: "Fire" | "Earth" | "Air" | "Water";
};

export const ZODIAC_ORDER: ZodiacSlug[] = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

export const ZODIAC_META: Record<ZodiacSlug, ZodiacMeta> = {
  aries: { slug: "aries", name: "Aries", symbol: "♈", dateRange: "Mar 21 – Apr 19", element: "Fire" },
  taurus: { slug: "taurus", name: "Taurus", symbol: "♉", dateRange: "Apr 20 – May 20", element: "Earth" },
  gemini: { slug: "gemini", name: "Gemini", symbol: "♊", dateRange: "May 21 – Jun 20", element: "Air" },
  cancer: { slug: "cancer", name: "Cancer", symbol: "♋", dateRange: "Jun 21 – Jul 22", element: "Water" },
  leo: { slug: "leo", name: "Leo", symbol: "♌", dateRange: "Jul 23 – Aug 22", element: "Fire" },
  virgo: { slug: "virgo", name: "Virgo", symbol: "♍", dateRange: "Aug 23 – Sep 22", element: "Earth" },
  libra: { slug: "libra", name: "Libra", symbol: "♎", dateRange: "Sep 23 – Oct 22", element: "Air" },
  scorpio: { slug: "scorpio", name: "Scorpio", symbol: "♏", dateRange: "Oct 23 – Nov 21", element: "Water" },
  sagittarius: { slug: "sagittarius", name: "Sagittarius", symbol: "♐", dateRange: "Nov 22 – Dec 21", element: "Fire" },
  capricorn: { slug: "capricorn", name: "Capricorn", symbol: "♑", dateRange: "Dec 22 – Jan 19", element: "Earth" },
  aquarius: { slug: "aquarius", name: "Aquarius", symbol: "♒", dateRange: "Jan 20 – Feb 18", element: "Air" },
  pisces: { slug: "pisces", name: "Pisces", symbol: "♓", dateRange: "Feb 19 – Mar 20", element: "Water" },
};

export function isZodiacSlug(value: string): value is ZodiacSlug {
  return (ZODIAC_ORDER as string[]).includes(value);
}
