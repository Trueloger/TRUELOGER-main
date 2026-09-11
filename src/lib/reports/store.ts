// src/lib/reports/store.ts
// Server-only Firestore access (Admin SDK) for the Reports system.
// Two collections:
//   reportProducts/{slug} — ONLY the admin-editable half (pricing,
//     delivery hours). Merged with the developer-controlled blueprint
//     (./products.ts) at read time to form the full ReportProduct the
//     storefront actually renders.
//   reports/{reportId} — the generation job + final content, per
//     src/lib/reports/types.ts's Report shape.
import { randomUUID } from "node:crypto";
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { REPORT_PRODUCTS, getReportBlueprint } from "./products";
import type { Report, ReportProduct, ReportProductPricing, ReportStatus, ReportType } from "./types";

const PRODUCTS_COLLECTION = "reportProducts";
const REPORTS_COLLECTION = "reports";

function db() {
  return getFirestore(getAdminApp());
}

/** Default delivery hours a freshly-seeded report product gets —
 * REPORT_DELIVERY_DELAY_HOURS itself controls the SCHEDULING math at
 * purchase time (see resolveReportDelayHours below); this is just the
 * number shown/editable on a product before an admin ever touches it,
 * kept in sync with the same env var so the storefront's displayed
 * "Delivery: within X hours" is honest even before any admin edit. */
function defaultDeliveryHours(): number {
  const raw = process.env.REPORT_DELIVERY_DELAY_HOURS;
  const parsed = raw !== undefined ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 6;
}

/** The actual delay used when scheduling a NEW report job — always
 * derived from the live env var, never cached, so flipping
 * REPORT_DELIVERY_DELAY_HOURS between deploys (0 in dev/test, 6 in
 * production) changes behavior with zero code change, per the task
 * brief's explicit "no hardcoded 6 hours" requirement. A per-product
 * admin override (ReportProductPricing.deliveryHours) takes priority
 * when set, since AGENTS §136 asks for that to be editable and to take
 * effect on the NEXT purchase — this function is only the fallback
 * when a product's own field is absent (shouldn't normally happen once
 * seeded, but keeps this safe against a partially-written doc). */
export function envDeliveryDelayHours(): number {
  return defaultDeliveryHours();
}

async function ensureProductDoc(slug: string): Promise<ReportProductPricing> {
  const ref = db().collection(PRODUCTS_COLLECTION).doc(slug);
  const snap = await ref.get();
  if (snap.exists) return snap.data() as ReportProductPricing;

  const blueprint = getReportBlueprint(slug);
  if (!blueprint) throw new Error(`Unknown report product slug: ${slug}`);
  const seeded: ReportProductPricing = {
    mrp: blueprint.seedMrp,
    salePrice: blueprint.seedSalePrice,
    deliveryHours: defaultDeliveryHours(),
    updatedAt: Date.now(),
  };
  await ref.set(seeded);
  return seeded;
}

function mergeProduct(pricing: ReportProductPricing, blueprintSlug: string): ReportProduct {
  const blueprint = getReportBlueprint(blueprintSlug);
  if (!blueprint) throw new Error(`Unknown report product slug: ${blueprintSlug}`);
  const discountPercent =
    pricing.mrp > pricing.salePrice ? Math.round((1 - pricing.salePrice / pricing.mrp) * 100) : 0;
  return { ...blueprint, mrp: pricing.mrp, salePrice: pricing.salePrice, discountPercent, deliveryHours: pricing.deliveryHours };
}

/** Public storefront read — merges blueprint + live pricing, seeding
 * the Firestore doc on first access so a fresh deploy needs no manual
 * setup step. */
export async function getReportProduct(slug: string): Promise<ReportProduct | null> {
  if (!getReportBlueprint(slug)) return null;
  const pricing = await ensureProductDoc(slug);
  return mergeProduct(pricing, slug);
}

export async function listReportProducts(): Promise<ReportProduct[]> {
  const all = await Promise.all(REPORT_PRODUCTS.map((p) => getReportProduct(p.slug)));
  return all.filter((p): p is ReportProduct => p !== null);
}

/** Admin-only write — ONLY these 4 fields are ever settable here, by
 * both this function's own type signature and the admin API route
 * that calls it (see src/app/api/admin/reports/products/[slug]/route.ts).
 * There is no path anywhere that lets Admin touch a report's section
 * blueprint, prompts, or calculation logic. */
export async function updateReportProductPricing(
  slug: string,
  patch: Partial<Pick<ReportProductPricing, "mrp" | "salePrice" | "deliveryHours">>,
): Promise<ReportProduct> {
  if (!getReportBlueprint(slug)) throw new Error(`Unknown report product slug: ${slug}`);
  await ensureProductDoc(slug); // guarantees a base doc to merge onto
  const ref = db().collection(PRODUCTS_COLLECTION).doc(slug);
  const current = (await ref.get()).data() as ReportProductPricing;
  const updated: ReportProductPricing = { ...current, ...patch, updatedAt: Date.now() };
  await ref.set(updated);
  return mergeProduct(updated, slug);
}

// ---------------------------------------------------------------------
// Reports (generation jobs + final content)
// ---------------------------------------------------------------------

export async function createReport(input: {
  userId: string;
  orderId: string;
  reportType: ReportType;
  productSlug: string;
  profileSnapshot: Report["profileSnapshot"];
  deliveryDelayHours: number; // resolved at call time — see the "hook into justPaid" call site
  pendingSectionIds: string[];
}): Promise<Report> {
  const now = Date.now();
  const id = `rpt_${randomUUID().replace(/-/g, "")}`;
  const report: Report = {
    id,
    userId: input.userId,
    orderId: input.orderId,
    reportType: input.reportType,
    productSlug: input.productSlug,
    status: "SCHEDULED",
    profileSnapshot: input.profileSnapshot,
    sections: [],
    pendingSectionIds: input.pendingSectionIds,
    createdAt: now,
    scheduledAt: now + input.deliveryDelayHours * 60 * 60 * 1000,
    deliveryDelayHours: input.deliveryDelayHours,
    rendererVersion: 1,
    promptVersion: 1,
    model: process.env.OPENROUTER_MODEL_PAID ?? "unknown",
    attemptCount: 0,
    updatedAt: now,
  };
  await db().collection(REPORTS_COLLECTION).doc(id).set(report);
  return report;
}

export async function getReport(reportId: string): Promise<Report | null> {
  const snap = await db().collection(REPORTS_COLLECTION).doc(reportId).get();
  return snap.exists ? (snap.data() as Report) : null;
}

export async function listReportsForUser(userId: string): Promise<Report[]> {
  const snap = await db().collection(REPORTS_COLLECTION).where("userId", "==", userId).get();
  return snap.docs.map((d) => d.data() as Report).sort((a, b) => b.createdAt - a.createdAt);
}

/** Admin-only listing — no server-side ordering/filter beyond a
 * reasonable cap, matching this catalogue's current scale (same
 * tradeoff the admin orders list already makes). */
export async function listReportsForAdmin(limitCount = 100): Promise<Report[]> {
  const snap = await db().collection(REPORTS_COLLECTION).limit(limitCount).get();
  return snap.docs.map((d) => d.data() as Report).sort((a, b) => b.createdAt - a.createdAt);
}

/** Reports due for processing right now — status SCHEDULED with
 * scheduledAt <= cutoff, OR already mid-pipeline (GENERATING/RENDERING)
 * so a previous cron tick that ran out of time gets resumed. Equality
 * `where` on status needs no composite index when there's no orderBy
 * alongside it (same reasoning as the earlier products/coupons fixes
 * this session already made) — sorted in memory instead. */
export async function listDueReports(cutoff: number, limitCount = 5): Promise<Report[]> {
  const db_ = db();
  const [scheduled, generating, rendering] = await Promise.all([
    db_.collection(REPORTS_COLLECTION).where("status", "==", "SCHEDULED").get(),
    db_.collection(REPORTS_COLLECTION).where("status", "==", "GENERATING").get(),
    db_.collection(REPORTS_COLLECTION).where("status", "==", "RENDERING").get(),
  ]);
  const due = scheduled.docs
    .map((d) => d.data() as Report)
    .filter((r) => r.scheduledAt <= cutoff);
  const inProgress = [...generating.docs, ...rendering.docs].map((d) => d.data() as Report);
  return [...due, ...inProgress].sort((a, b) => a.createdAt - b.createdAt).slice(0, limitCount);
}

/** Atomic status transition — uses tx.update (never a raw ref.update()
 * inside the transaction; see orders/store.ts's applyPaymentStatus doc
 * comment for the exact production bug that pattern caused). Returns
 * false without writing if the report isn't currently in `fromStatus`
 * — this IS the generation lock from AGENTS §43: two concurrent cron
 * ticks racing to pick up the same SCHEDULED report will only ever let
 * one of them win the SCHEDULED->GENERATING transition. */
export async function transitionReportStatus(
  reportId: string,
  fromStatus: ReportStatus,
  toStatus: ReportStatus,
  patch: Partial<Report> = {},
): Promise<Report | null> {
  const ref = db().collection(REPORTS_COLLECTION).doc(reportId);
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const report = snap.data() as Report;
    if (report.status !== fromStatus) return null;
    const updated: Report = { ...report, ...patch, status: toStatus, updatedAt: Date.now() };
    tx.update(ref, { ...patch, status: toStatus, updatedAt: updated.updatedAt });
    return updated;
  });
}

/** Appends one completed section and removes it from the pending
 * queue — the resumable unit of work (AGENTS §44: retry only the
 * failed section, never the whole report). Plain (non-transactional)
 * read-then-write is fine here: only the single cron/kick invocation
 * that currently holds the GENERATING lock (via transitionReportStatus
 * above) ever calls this for a given report, so there's no concurrent
 * writer to race with. */
export async function appendGeneratedSection(
  reportId: string,
  section: Report["sections"][number],
): Promise<void> {
  const ref = db().collection(REPORTS_COLLECTION).doc(reportId);
  const snap = await ref.get();
  if (!snap.exists) return;
  const report = snap.data() as Report;
  await ref.update({
    sections: [...report.sections, section],
    pendingSectionIds: report.pendingSectionIds.filter((id) => id !== section.id),
    updatedAt: Date.now(),
  });
}

export async function markReportFailed(reportId: string, errorCode: string, errorMessage: string): Promise<void> {
  await db()
    .collection(REPORTS_COLLECTION)
    .doc(reportId)
    .update({ status: "FAILED", errorCode, errorMessage, updatedAt: Date.now() });
}

/** Unseen-count support for the admin notification badge — reports
 * that reached READY after `sinceMs` (a newly-completed report is what
 * the admin actually needs to notice, not every SCHEDULED job). */
export async function countReadyReportsSince(sinceMs: number): Promise<number> {
  const snap = await db().collection(REPORTS_COLLECTION).where("status", "==", "READY").get();
  return snap.docs.filter((d) => (d.data() as Report).completedAt !== undefined && (d.data() as Report).completedAt! > sinceMs).length;
}

export async function incrementAttemptCount(reportId: string): Promise<void> {
  const ref = db().collection(REPORTS_COLLECTION).doc(reportId);
  const snap = await ref.get();
  if (!snap.exists) return;
  const report = snap.data() as Report;
  await ref.update({ attemptCount: (report.attemptCount ?? 0) + 1, updatedAt: Date.now() });
}
