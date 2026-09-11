// src/lib/services/types.ts
// Shared "simple service" model for Healing, Puja and Courses — three
// catalogues that are commercially identical in shape (a fixed-price,
// admin-editable-pricing-only, one-off purchase that flows through the
// existing cart/Cashfree/order pipeline) even though their content
// differs. One extensible model, not three duplicated ones, per the
// "do not let multiple agents independently invent incompatible
// service schemas" requirement — mirrors src/lib/reports/types.ts's
// blueprint/pricing split (developer-controlled content vs
// admin-editable commercial fields), simplified since these have no
// generation pipeline.
export type ServiceCategory = "healing" | "puja" | "course";

export type ServiceFaq = { question: string; answer: string };

/** Developer-controlled catalogue content — never admin-editable
 * (AGENTS §67/§105: admin may only touch price/MRP/discount/delivery
 * time, never the service's actual substance). */
export type ServiceBlueprint = {
  category: ServiceCategory;
  slug: string;
  name: string;
  shortDescription: string;
  /** Hero/intro paragraph(s). */
  introduction: string;
  whatItIs: string;
  whoItsFor: string;
  whatItCovers: string[];
  whatToExpect: string;
  /** Human-readable duration, e.g. "45–60 minutes" or "6 weeks, self-paced". */
  duration: string;
  faqs: ServiceFaq[];
  disclaimer: string;
  image?: string;
  /** Course-only fields — undefined for healing/puja. */
  course?: {
    level: "Beginner" | "Intermediate" | "Advanced";
    format: string; // e.g. "Self-paced video + PDF workbook"
    modules: { title: string; summary: string }[];
    outcomes: string[];
  };
  /** Seed pricing — only used the first time a product doc is created;
   * afterwards the live Firestore doc (admin-editable) is authoritative. */
  seedMrp: number;
  seedSalePrice: number;
  /** Human copy, e.g. "Same day" / "Within 24 hours" / "Instant access". */
  seedDeliveryTime: string;
};

/** The admin-editable half, stored in Firestore — mirrors
 * ReportProductPricing exactly (mrp/salePrice/deliveryTime/updatedAt),
 * the ONLY fields the admin UI can ever write (AGENTS §6/§67). */
export type ServicePricing = {
  mrp: number;
  salePrice: number;
  deliveryTime: string;
  active: boolean;
  updatedAt: number;
};

/** Merged, storefront-facing product — blueprint content + live pricing. */
export type ServiceProduct = ServiceBlueprint & {
  mrp: number;
  salePrice: number;
  discountPercent: number;
  deliveryTime: string;
  active: boolean;
};

export function computeDiscountPercent(mrp: number, salePrice: number): number {
  return mrp > salePrice ? Math.round((1 - salePrice / mrp) * 100) : 0;
}
