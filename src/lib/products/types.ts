// src/lib/products/types.ts
// THE unified, admin-manageable product model — supersedes the earlier
// static src/lib/gemstones/gemstone-data.ts as the source of truth for
// gemstone products (see scripts/dev/seed-products.ts for the one-time
// migration) and generalizes the same shape to bracelets, Rudraksha,
// spiritual products and Yantras, per the "one product system, not
// five" requirement. Stored in Firestore at `products/{id}` — see
// src/lib/products/store.ts for the only server-side read/write access
// point (Admin SDK). Never import this file's store.ts counterpart
// from a "use client" file.
//
// Design choice — ONE line-item shape, not five: every category
// (gemstone/bracelet/rudraksha/spiritual/yantra) uses the exact same
// `ProductVariant` shape (an id, a human label, mrp/salePrice/stock)
// rather than a category-specific "ratti" field vs a "size" field vs a
// "mukhi" field. A gemstone's variant id is a stringified Ratti number
// ("5"), a Rudraksha's is a Mukhi count ("6"), a bracelet's is a size
// ("m"). This is what makes "admin adds a new category without a code
// change" actually true — the storefront/cart/pricing code never
// branches on category to decide how to read a price.
export type ProductCategory = "gemstone" | "bracelet" | "rudraksha" | "spiritual" | "yantra";

export type ProductStatus = "published" | "draft" | "archived";

export type ProductVariant = {
  /** Stable within this product — e.g. "3", "5" (Ratti), "6" (Mukhi),
   * "s"/"m"/"l" (bracelet size). Never renumbered once real orders
   * reference it (see order snapshot — orders store their own copy of
   * mrp/salePrice regardless, so this id only needs to stay stable for
   * as long as the variant remains orderable). */
  id: string;
  /** Human-facing label — "5 Ratti", "6 Mukhi", "Medium (18cm)". */
  label: string;
  /** Set only for gemstone-category variants where a Ratti weight is
   * traditionally meaningful — used by rattiToCarat() and by the
   * existing gemstone UI (GemstoneRattiSelector/RattiSheet), which
   * still expect a numeric Ratti display alongside the label. Omitted
   * for every non-gemstone category. */
  ratti?: number;
  mrp: number;
  salePrice: number;
  /** Defaults to true when omitted. */
  inStock?: boolean;
};

export type ProductGallerySlot = {
  role: "main" | "angle" | "closeup" | "detail" | "lifestyle";
  label: string;
  src?: string;
};

export type ProductFaq = { question: string; answer: string };

/** Category-appropriate traditional/astrological metadata — every
 * field optional since a bracelet has no "ruling planet" the way a
 * gemstone does, and a Yantra has a "deity" a gemstone doesn't. The
 * product page renders only the fields actually present (per the
 * "don't force irrelevant fields" requirement). */
export type ProductAttributes = {
  alternateName?: string; // Indian/traditional name — "Manik", "Panna"
  rulingPlanet?: string;
  associatedDeity?: string; // Yantras
  associatedDay?: string;
  associatedMetal?: string;
  wearingFinger?: string;
  wearingMethod?: string;
  mantra?: string;
  material?: string; // bracelets/Rudraksha/Yantras
  origin?: string; // Rudraksha
  size?: string; // bracelets/Yantras, when not variant-driven
  astrologicalSignificance?: string;
  benefits?: string[];
  careInstructions?: string[];
  suitableFor?: string[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  status: ProductStatus;
  shortDescription: string;
  description: string;
  image: { alt: string; src?: string };
  gallery: ProductGallerySlot[]; // always exactly 5
  variants: ProductVariant[]; // always at least 1
  defaultVariantId: string;
  attributes: ProductAttributes;
  faqs: ProductFaq[];
  /** Certification claim — omitted entirely unless genuinely true for
   * this product (never a blanket claim). */
  certificationInfo?: string;
  /** Overrides the site-wide default delivery estimate
   * (src/lib/pricing/settings-defaults.ts) for this product only. */
  deliveryEstimate?: string;
  /** Loose inventory signal, not full stock management — per-variant
   * `inStock` is the actual gate; this is just a low-stock UI hint. */
  lowStockThreshold?: number;
  seo: { title: string; description: string };
  createdAt: number;
  updatedAt: number;
};

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "gemstone",
  "bracelet",
  "rudraksha",
  "spiritual",
  "yantra",
];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  gemstone: "Gemstones",
  bracelet: "Bracelets",
  rudraksha: "Rudraksha",
  spiritual: "Spiritual Products",
  yantra: "Yantras",
};

export function findVariant(product: Pick<Product, "variants">, variantId: string): ProductVariant | undefined {
  return product.variants.find((v) => v.id === variantId);
}

export function variantDiscountPercent(variant: Pick<ProductVariant, "mrp" | "salePrice">): number {
  return variant.mrp > variant.salePrice ? Math.round((1 - variant.salePrice / variant.mrp) * 100) : 0;
}
