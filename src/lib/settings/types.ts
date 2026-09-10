// src/lib/settings/types.ts
// Admin-configurable store-wide settings — two singleton Firestore
// docs, `settings/tax` and `settings/delivery`. Never hardcoded in a
// UI component; the pricing engine (src/lib/pricing/calculate.ts) is
// the only place these get READ for a real calculation, and the admin
// Settings API is the only place they get WRITTEN.
export type TaxRule = {
  /** Display name — "GST". */
  name: string;
  ratePercent: number;
  /** Omitted = applies to every category. Present = applies ONLY to
   * these categories (per the "tax can vary by product classification"
   * requirement — a single flat GST% for everything is the common
   * case, but the model doesn't assume it). */
  categoryRestriction?: string[];
  active: boolean;
};

export type TaxSettings = {
  /** Ordered list — every ACTIVE rule whose categoryRestriction (if
   * any) matches a line's category is summed for that line. Keeping
   * this a list (not a single rate) is what lets "GST 3% on gemstones,
   * GST 5% on everything else" exist later without a schema change. */
  rules: TaxRule[];
  /** Whether displayed sale prices are tax-inclusive or tax is added
   * on top at checkout — purely a DISPLAY/rounding concern, the
   * server-side calculation is authoritative either way. Defaults to
   * false (tax added on top) if unset. */
  pricesIncludeTax?: boolean;
  updatedAt: number;
};

export type DeliverySettings = {
  defaultFee: number;
  /** Cart subtotal (post-discount, pre-tax) at or above which delivery
   * becomes free. 0/undefined = no free-delivery threshold. */
  freeDeliveryThreshold?: number;
  /** Per-category override of defaultFee — e.g. Yantras might ship for
   * more than a gemstone. Omitted category falls back to defaultFee. */
  categoryFees?: Record<string, number>;
  updatedAt: number;
};

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  rules: [{ name: "GST", ratePercent: 3, active: true }],
  pricesIncludeTax: false,
  updatedAt: 0,
};

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  defaultFee: 99,
  freeDeliveryThreshold: 2000,
  updatedAt: 0,
};
