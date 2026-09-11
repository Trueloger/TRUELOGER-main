// src/lib/reports/types.ts
// Core types for the Paid Personalized Reports system. One authoritative
// model — every report type (kundli/marriage/career/...) uses this same
// shape, the same state machine, the same generation pipeline. Section
// CONTENT differs per report type via blueprints (./blueprints/*.ts);
// nothing else does.

export type ReportType =
  | "kundli"
  | "marriage"
  | "career"
  | "love-relationship"
  | "finance"
  | "life"
  | "dosha";

export const REPORT_TYPES: ReportType[] = [
  "kundli",
  "marriage",
  "career",
  "love-relationship",
  "finance",
  "life",
  "dosha",
];

/** State machine — never a boolean isReady. PURCHASED is the instant
 * the order is paid, before a job is even scheduled (kept distinct
 * from SCHEDULED so a race between order-write and job-write is never
 * ambiguous). CANCELLED exists for a future admin/refund path; nothing
 * sets it yet. */
export type ReportStatus =
  | "PURCHASED"
  | "SCHEDULED"
  | "GENERATING"
  | "RENDERING"
  | "READY"
  | "FAILED"
  | "CANCELLED";

/** Admin-editable half of a report product — the ONLY fields Admin ->
 * Reports -> Report Products may change (see AGENTS brief: pricing and
 * delivery time only, never structure/prompts). Stored in Firestore at
 * reportProducts/{slug}; everything else about a report type (name,
 * description, section blueprint, page targets) is developer-controlled
 * in ./products.ts and ./blueprints/*.ts, never editable from Admin. */
export type ReportProductPricing = {
  mrp: number;
  salePrice: number;
  /** Hours from verified payment to scheduled generation start.
   * REPORT_DELIVERY_DELAY_HOURS is the DEFAULT every product is seeded
   * with; admin can override per-product from here on. */
  deliveryHours: number;
  updatedAt: number;
};

/** Developer-controlled catalogue metadata — see src/lib/reports/products.ts
 * for the 7 real entries. Never stored in/edited via Firestore. */
export type ReportProductBlueprint = {
  slug: string;
  type: ReportType;
  name: string;
  shortDescription: string;
  whatItCovers: string[];
  whoItsFor: string;
  whatYouReceive: string[];
  minPages: number;
  maxPages: number;
  /** Seed values for the admin-editable pricing doc — only used the
   * first time a product doc is created; after that, Firestore is the
   * source of truth. */
  seedMrp: number;
  seedSalePrice: number;
};

/** What the storefront actually reads — blueprint + live Firestore
 * pricing merged, with the correct discount percent always derived,
 * never stored/edited independently (same rule the gemstone/product
 * pricing already follows). */
export type ReportProduct = ReportProductBlueprint & {
  mrp: number;
  salePrice: number;
  discountPercent: number;
  deliveryHours: number;
};

/** Immutable at purchase time — see AGENTS brief §13/§14. Every
 * generated report is driven by THIS, never by a live re-read of the
 * user's profile, so a later profile edit can never change an
 * already-purchased report. */
export type ReportProfileSnapshot = {
  fullName: string;
  gender?: string;
  dob: string; // "YYYY-MM-DD"
  timeOfBirth: string; // "HH:mm", 24h
  timeUnknown?: boolean;
  birthCity: string;
  birthState?: string;
  birthCountry: string;
  birthLatitude: number;
  birthLongitude: number;
  birthTimezoneHours: number;
  /** Which version of the user's Firestore profile doc this was taken
   * from (its own updatedAt) — purely a traceability breadcrumb. */
  profileUpdatedAt: number;
};

/** The ONE factual data layer every report section is generated from —
 * real deterministic astro-engine output, never invented by the AI.
 * Deliberately loose (Record<string, unknown> for the heavier blocks)
 * rather than re-typing every astro-engine result shape here — those
 * shapes already have their own real types in src/lib/astro-engine/*;
 * this is a transport/storage container, not a second source of truth
 * for their structure. */
export type AstrologySnapshot = {
  ascendant: { sign: number; signName: string; degree: number };
  moonSign: { sign: number; signName: string };
  nakshatra: { name: string; pada: number };
  planets: Record<string, unknown>; // ChartPlanetEntry per planet, keyed by name
  houses: Record<string, unknown>;
  divisionalCharts: Record<string, unknown>; // vargaNumber -> DivisionalChartResult
  yogas: unknown[]; // YogaResult[]
  mangalDosha: unknown; // MangalDoshaResult
  sadeSati: unknown; // SadeSatiResult | null
  kaalSarp: unknown; // { hasDosha: boolean }
  vimshottariDasha: unknown; // VimshottariDashaResult
  shadbala: Record<string, unknown>;
  bhavabala: unknown[];
  ayanamsha: number;
  calculatedAt: number;
  /** Bump when the astro-engine calculation methodology changes in a
   * way that would alter results — lets old reports stay explainable
   * even after the engine evolves (see AGENTS §111). */
  engineVersion: 1;
};

/** One generated report section — structured, never raw HTML from the
 * model (AGENTS §45/§46). The HTML/PDF renderers turn this into
 * markup; the AI never does. */
export type ReportSectionContent = {
  /** Free-form paragraphs — the narrative/interpretive prose. */
  paragraphs: string[];
  /** Optional simple key-value or multi-column table. Rows are wrapped
   * in `{ cells: [...] }` rather than a bare `string[][]` — Firestore
   * cannot store an array directly nested inside another array (only
   * inside a map), so a raw string[][] fails to save with "Property
   * array contains an invalid nested entity." This was caught live,
   * not assumed: the demo-generation script failed on exactly this
   * write before this fix existed. */
  table?: { headers: string[]; rows: { cells: string[] }[] };
  /** Optional short bullet list — "Key Insights", "Favourable Periods", etc. */
  keyPoints?: string[];
  /** Optional traditional-remedy bullet list, only for sections where
   * a remedy is genuinely relevant. */
  remedies?: string[];
};

export type GeneratedSection = {
  id: string; // matches the blueprint's SectionSpec.id
  title: string;
  content: ReportSectionContent;
  /** Rough page contribution — used by the length controller (§18/§19)
   * to decide whether the report needs more/less content overall.
   * Estimated at render time from paragraph/table size, not asked of
   * the model directly. */
  estimatedPages: number;
  generatedAt: number;
};

/** The full Firestore document at reports/{reportId} — see AGENTS §90. */
export type Report = {
  id: string;
  userId: string;
  orderId: string;
  reportType: ReportType;
  productSlug: string;
  status: ReportStatus;

  profileSnapshot: ReportProfileSnapshot;
  /** Present once calculation has run (set at SCHEDULED->GENERATING). */
  astrologySnapshot?: AstrologySnapshot;

  /** Ordered per the type's blueprint section-id list — filled in as
   * each section completes, so generation is resumable (§18/§43/§44). */
  sections: GeneratedSection[];
  /** Section ids still pending, in blueprint order — the actual resume
   * cursor. Empty once all sections are generated. */
  pendingSectionIds: string[];

  pageCount?: number;
  /** Firebase Storage path (private — see src/lib/reports/storage.ts)
   * for the cached final PDF, generated once when the report becomes
   * READY (AGENTS §61/§62) rather than rebuilt on every download. */
  pdfStorageRef?: string;

  createdAt: number;
  scheduledAt: number; // createdAt + deliveryHours (0 in test mode)
  startedAt?: number;
  completedAt?: number;

  deliveryDelayHours: number;
  rendererVersion: 1;
  promptVersion: 1;
  model: string; // OPENROUTER_MODEL_PAID at generation time, for traceability

  errorCode?: string;
  errorMessage?: string;
  attemptCount: number;
  /** Same idempotency-guard pattern applyPaymentStatus already uses —
   * prevents a duplicate cron tick from double-processing the same
   * report. */
  lastProcessedEventId?: string;
  updatedAt: number;
};

/** What the frontend actually needs to show "Preparing your report" vs
 * real content — a coarse, honest progress label (AGENTS §69: no fake
 * percentages), derived from `status` + which pipeline stage is active. */
export function reportStageLabel(status: ReportStatus): string {
  switch (status) {
    case "PURCHASED":
    case "SCHEDULED":
      return "Preparing your chart";
    case "GENERATING":
      return "Generating interpretations";
    case "RENDERING":
      return "Designing your report";
    case "READY":
      return "Ready";
    case "FAILED":
      return "Our system is completing the final preparation";
    case "CANCELLED":
      return "Cancelled";
  }
}
