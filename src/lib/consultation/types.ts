// src/lib/consultation/types.ts
// Canonical data shape for the paid consultation catalogue (the
// /consult page + /consult/[slug] subpages). One authoritative type
// module so the landing-page cards, subpages, pricing engine, cart, and
// server-side validation route all agree on the same shape — per the
// "no duplicate service systems" requirement, this is the ONLY service
// data contract for consultations (separate from src/components/nav/
// nav-data.ts, which is just navigation links, and separate from
// src/components/products/product-data.ts, which is physical-product
// e-commerce, not a consultation).
//
// Deliberately extensible toward a future expert-marketplace model
// (see the `expertReady` shape note below) without implementing any of
// that yet — durations/pricing/availability could all later vary per
// expert attached to a service, but today a service has ONE fixed
// pricing matrix, no expert attached.

/** The four fixed duration presets every consultation service supports,
 * plus arbitrary custom minutes in between (15-60 inclusive, validated
 * by `pricing.ts`). */
export const DURATION_PRESETS = [15, 30, 45, 60] as const;
export type DurationPreset = (typeof DURATION_PRESETS)[number];

export const MIN_CONSULTATION_MINUTES = 15;
export const MAX_CONSULTATION_MINUTES = 60;

/** A broad grouping used only for card/section organization — not a
 * separate data system, just a label on each ConsultationService. */
export type ConsultationCategory =
  | "astrology"
  | "divination"
  | "numerology"
  | "vastu"
  | "healing";

/** Exact rupee price at each of the 4 duration presets. Arbitrary
 * "custom" minutes between presets are priced by piecewise-linear
 * interpolation between the two bracketing presets (see pricing.ts) —
 * this matrix is the single source of truth, nothing else may hardcode
 * a price. Whole rupees only (no paise), matching this site's existing
 * INR display convention. */
export type ConsultationPricingMatrix = Record<DurationPreset, number>;

export type ConsultationFaq = {
  question: string;
  answer: string;
};

/** A short, clearly-fictional sample reading shown behind "View Demo
 * Report" — never real personal data (see DemoReport component doc
 * comment for the disclaimer treatment). */
export type ConsultationDemoReport = {
  title: string;
  /** The fictional sample person's label, e.g. "Sample chart for Rohan,
   * born 14 Nov 1994, Jaipur" — always clearly a placeholder, never
   * phrased as if it were the viewer's own data. */
  sampleSubject: string;
  summary: string;
  sections: { heading: string; body: string }[];
};

export type ConsultationService = {
  /** Stable identifier — used as the cart line-item's serviceId and the
   * server-side validation key. Never changes once a service ships. */
  id: string;
  /** URL slug for /consult/[slug]. Equal to `id` for every service
   * today (kept as a distinct field since a future rename must be able
   * to change the slug without breaking stored cart/order references
   * to `id`). */
  slug: string;
  name: string;
  category: ConsultationCategory;
  /** One-line hook shown on the card, under the name. */
  subtitle: string;
  /** 2-4 sentence introduction shown at the top of the subpage. */
  description: string;
  /** lucide-react icon component name (see ConsultServiceIcon.tsx's
   * registry) — this catalogue has no photography assets yet, so every
   * service is represented by an icon badge (same visual language
   * QuickServices already uses on the homepage), not a photo. */
  icon: string;
  pricing: ConsultationPricingMatrix;
  /** What this consultation covers — shown as a bullet list on the
   * subpage ("What this consultation covers"). */
  highlights: string[];
  /** Who this is for — shown on the subpage ("Ideal for"). */
  suitableFor: string[];
  /** Common questions/topics people bring to this consultation. */
  topics: string[];
  faqs: ConsultationFaq[];
  demoReport: ConsultationDemoReport;
  seo: {
    title: string;
    description: string;
  };
  /** Shown only when the service genuinely warrants it (health/finance/
   * relationship guidance) — see disclaimers.ts. Most services reuse
   * the shared general disclaimer only. */
  extraDisclaimer?: string;
};

/** A cart line-item variant key: serviceId + duration distinguishes
 * "Vedic Astrology, 30 min" from "Vedic Astrology, 60 min" as two
 * separate, independently-removable cart lines (see CartContext.tsx). */
export function consultationVariantId(serviceId: string, duration: number): string {
  return `consult:${serviceId}:${duration}`;
}
