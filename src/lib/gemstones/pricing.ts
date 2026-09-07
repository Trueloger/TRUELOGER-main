// src/lib/gemstones/pricing.ts
// The single authoritative pricing/validation layer for gemstones —
// mirrors src/lib/consultation/pricing.ts's role exactly, but simpler:
// a gemstone's Ratti options are a discrete, product-specific list (not
// a continuous validated range like consultation minutes), so there is
// no interpolation here — every valid Ratti has its own explicit
// {mrp, salePrice} entry in the product's pricing matrix, and the
// discount percentage is always DERIVED from those two numbers, never
// stored independently (see the "data-driven discounts" / "MRP
// integrity" requirements this satisfies). Every surface that needs a
// gemstone's price — card, Ratti sheet, product page, cart, and the
// server-side /api/gemstones/validate route — MUST go through
// `getGemstonePrice()` here.
import type { GemstonePricingMatrix, RattiValue } from "./types";

/** Site-wide default delivery estimate, per the "3-7 working days"
 * requirement. A product may override this via its own
 * `deliveryEstimate` field. */
export const DEFAULT_DELIVERY_ESTIMATE = "3–7 working days";

export type RattiValidation =
  | { valid: true; ratti: RattiValue }
  | { valid: false; reason: string };

/** Validates a requested Ratti weight against ONE product's own
 * `rattiOptions` list (not a global range) — a Ratti that's valid for
 * one gemstone may be meaningless for another, so the caller always
 * supplies the specific product's options. Also rejects a variant
 * that's marked out of stock in `pricing`. */
export function validateRatti(
  rattiOptions: RattiValue[],
  pricing: GemstonePricingMatrix,
  input: unknown,
): RattiValidation {
  if (typeof input !== "number" || !Number.isFinite(input)) {
    return { valid: false, reason: "Select a valid Ratti weight." };
  }
  if (!rattiOptions.includes(input)) {
    return { valid: false, reason: "This Ratti weight is not offered for this gemstone." };
  }
  const entry = pricing[input];
  if (!entry) {
    return { valid: false, reason: "This Ratti weight is not offered for this gemstone." };
  }
  if (entry.inStock === false) {
    return { valid: false, reason: "This Ratti weight is currently out of stock." };
  }
  return { valid: true, ratti: input };
}

export type GemstonePrice = {
  mrp: number;
  salePrice: number;
  /** Rounded to the nearest whole percent — always mathematically
   * derived as (1 - salePrice/mrp) * 100, so it can never disagree
   * with the displayed MRP/sale-price pair. 0 when mrp === salePrice
   * (no discount, no "0% OFF" badge should be rendered by the caller
   * in that case). */
  discountPercent: number;
};

/** Authoritative price for one product's pricing matrix at a given,
 * already-validated Ratti. Throws if `ratti` isn't a key in `pricing`
 * — callers must run `validateRatti` first (same contract as
 * consultation/pricing.ts's `getConsultationPrice`). */
export function getGemstonePrice(
  pricing: GemstonePricingMatrix,
  ratti: RattiValue,
): GemstonePrice {
  const entry = pricing[ratti];
  if (!entry) {
    throw new Error(`getGemstonePrice: no pricing entry for ${ratti} ratti.`);
  }
  const discountPercent =
    entry.mrp > entry.salePrice ? Math.round((1 - entry.salePrice / entry.mrp) * 100) : 0;
  return { mrp: entry.mrp, salePrice: entry.salePrice, discountPercent };
}

/** Same "₹1,299" plain INR display convention as
 * consultation/pricing.ts's own formatInr — duplicated rather than
 * imported cross-module so this catalogue has zero dependency on the
 * consultation one (same precedent as small shared-shape helpers
 * duplicated elsewhere in this codebase, e.g. astro-engine's
 * yogas.ts::OWN_SIGNS). */
export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
