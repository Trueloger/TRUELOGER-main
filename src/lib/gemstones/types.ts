// src/lib/gemstones/types.ts
// Canonical data shape for the gemstone catalogue (the /gemstones page +
// /gemstones/[slug] subpages + the homepage "Sacred Gemstones" section).
// One authoritative contract, exactly like src/lib/consultation/types.ts
// for the consultation catalogue — the card grid, product subpage,
// pricing engine, cart, and server-side validation route all agree on
// this same shape. Separate from src/components/products/product-data.ts
// (the old 6-item baked-image homepage showcase, being replaced by this
// catalogue) and from src/lib/consultation/* (a different product type
// entirely) — no shared state, no duplicate systems.

/** A gemstone is sold in discrete Ratti weights (NOT a continuous
 * range like consultation durations) — each product defines its own
 * `rattiOptions`, since not every gemstone is offered at every weight.
 * Values may be fractional (e.g. 3.25), matching real market listings. */
export type RattiValue = number;

/** 1 Ratti ≈ 0.91 carat — this is the ONE conversion convention this
 * site uses everywhere a carat-equivalent is displayed, per the "pick
 * one convention and document it" requirement. Do not use a different
 * multiplier anywhere else in this codebase. */
export const RATTI_TO_CARAT = 0.91;

export function rattiToCarat(ratti: RattiValue): number {
  return Math.round(ratti * RATTI_TO_CARAT * 100) / 100;
}

/** MRP + selling price for one specific Ratti weight of one gemstone.
 * The discount percentage is ALWAYS derived from these two numbers
 * (see pricing.ts's `getGemstonePrice`) — never stored or edited as an
 * independent field, so a displayed "XX% OFF" can never mismatch the
 * actual MRP/sale-price pair (see the "MRP integrity" / "data-driven
 * discounts" requirements this satisfies). */
export type RattiPriceEntry = {
  mrp: number;
  salePrice: number;
  /** Defaults to true when omitted. Set false to disable this specific
   * Ratti variant (e.g. temporarily out of stock) without deleting its
   * price data — see the "out-of-stock support" requirement. */
  inStock?: boolean;
};

export type GemstonePricingMatrix = Record<RattiValue, RattiPriceEntry>;

export type GemstoneCategory =
  | "ruby"
  | "pearl"
  | "coral"
  | "emerald"
  | "yellow-sapphire"
  | "blue-sapphire"
  | "hessonite"
  | "cats-eye"
  /** Every gemstone added beyond the original eight (Moonstone, Opal,
   * Amethyst, etc.) — this field only ever drove a handful of internal
   * grouping/label spots in the original 8-gemstone UI, so a shared
   * bucket for "everything else" is sufficient rather than a bespoke
   * literal per new stone. */
  | "other"
  /** Not a real gemstone — a ₹1 line item that exists solely to test
   * the Cashfree checkout flow end-to-end cheaply. See its entry in
   * gemstone-data.ts for the full disclosure/labeling requirements. */
  | "test";

export type GemstoneFaq = {
  question: string;
  answer: string;
};

/** The 5 fixed gallery slots every product page has, per the "exactly
 * five image placeholders" requirement. `image` on `image` on
 * GemstoneProduct itself (below) is the card/primary thumbnail — this
 * array is the full product-page gallery, always length 5, in a fixed
 * order (main/angle/close-up/certificate-or-detail/lifestyle) so real
 * photography can later be dropped into the same 5 slots without
 * touching any component. Each slot only carries a `role` + `alt` label
 * for now (no `src`) since no real photography exists yet — see
 * GemstoneImagePlaceholder.tsx for how an empty slot renders. */
export type GemstoneGallerySlot = {
  role: "main" | "angle" | "closeup" | "detail" | "lifestyle";
  /** Accessible label used once a real image lands in this slot (and
   * shown today as the placeholder's own caption, so the empty state
   * still communicates what will eventually be here). */
  label: string;
  src?: string;
};

export type GemstoneProduct = {
  /** Stable identifier — the cart line's productId and the server
   * validation key. Never changes once a product ships. */
  id: string;
  /** URL slug for /gemstones/[slug]. Equal to `id` for every product
   * today, kept distinct for the same future-proofing reason
   * consultation services do (see ConsultationService.slug). */
  slug: string;
  name: string;
  /** The traditional Indian/Sanskrit name, shown alongside `name`
   * (e.g. "Blue Sapphire — Neelam"). Omit if there isn't a
   * well-established one for a given stone. */
  indianName?: string;
  category: GemstoneCategory;
  shortDescription: string;
  description: string;
  /** Card/thumbnail placeholder image — see GemstoneImagePlaceholder.tsx.
   * No `src` yet; this field exists so a real photo can be wired in
   * later without touching the card component. */
  image: { alt: string; src?: string };
  /** Always exactly 5 entries — see GemstoneGallerySlot's doc comment. */
  gallery: GemstoneGallerySlot[];
  /** Every Ratti weight this product is actually offered at — never a
   * generic universal list, always product-specific. */
  rattiOptions: RattiValue[];
  /** The Ratti shown by default on the card and pre-selected on the
   * product page — must be one of `rattiOptions`. */
  defaultRatti: RattiValue;
  pricing: GemstonePricingMatrix;
  rulingPlanet: string;
  associatedDay?: string;
  associatedMetal?: string;
  wearingFinger?: string;
  wearingMethod?: string;
  careInstructions: string[];
  /** Traditional astrological benefits — always phrased as
   * "traditionally associated with" / "traditionally recommended for",
   * never a guaranteed outcome (see the astrological-claims
   * requirement). */
  benefits: string[];
  astrologicalSignificance: string;
  /** Only set when the business genuinely provides this — omitted
   * (not a false default) for every product until real certification
   * data exists. */
  certificationInfo?: string;
  /** Per-product delivery override. Falls back to the site-wide
   * DEFAULT_DELIVERY_ESTIMATE (pricing.ts) when omitted. */
  deliveryEstimate?: string;
  faqs: GemstoneFaq[];
  seo: {
    title: string;
    description: string;
  };
};

/** A cart line-item variant key: productId + ratti distinguishes
 * "Blue Sapphire, 3 Ratti" from "Blue Sapphire, 5 Ratti" as two
 * separate, independently-removable cart lines — mirrors
 * consultationVariantId in src/lib/consultation/types.ts exactly. */
export function gemstoneVariantId(productId: string, ratti: RattiValue): string {
  return `gemstone:${productId}:${ratti}`;
}
