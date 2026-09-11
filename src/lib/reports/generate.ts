// src/lib/reports/generate.ts
// The resumable report-processing orchestrator — the one function both
// the "immediate kick after payment" path (checkout, delay=0 test mode)
// and the cron sweep (/api/cron/process-reports, the durable path that
// works even if the kick never ran or the browser closed) call. Each
// invocation processes a bounded amount of work and returns — it never
// tries to finish a whole 30-60 page report in one call (AGENTS §19/§25).
import { buildAstrologySnapshot } from "./snapshot";
import { getReportBlueprint } from "./blueprints";
import { pickSnapshotData } from "./blueprints/types";
import { generatePaidReportSection } from "@/lib/ai/paid-report-section";
import { estimatePageCount } from "./page-estimate";
import { renderReportPdf } from "./render-pdf";
import { uploadReportPdf } from "./storage";
import {
  getReport,
  transitionReportStatus,
  appendGeneratedSection,
  incrementAttemptCount,
  markReportFailed,
} from "./store";
import type { GeneratedSection, Report } from "./types";

// How many sections to generate per invocation — deliberately small
// (2) so one call comfortably fits inside a modest maxDuration even on
// Vercel's Hobby tier (60s), where each ~15-90s model call already
// eats most of the budget. More sections than that per tick would risk
// the function being killed mid-section on a slow model response.
// generate.ts's caller (src/app/api/internal/process-report/route.ts)
// self-chains another tick when sections remain, rather than relying
// on a fast cron cadence — see that route's doc comment for why.
const SECTIONS_PER_TICK = 2;
const MAX_SECTION_ATTEMPTS = 3;

export async function processReport(reportId: string): Promise<void> {
  const report = await getReport(reportId);
  if (!report) return;

  if (report.status === "SCHEDULED") {
    // Respect the delivery delay — the immediate self-chaining kick
    // (see api/internal/process-report) calls processReport() as soon
    // as the order is paid, regardless of scheduledAt; in production
    // (REPORT_DELIVERY_DELAY_HOURS=6) that's still hours away, and
    // only the cron sweep (which filters via listDueReports) should
    // act on it once it's actually due. In test mode (delay=0),
    // scheduledAt is already <= now, so this proceeds immediately.
    if (report.scheduledAt > Date.now()) return;
    await startGenerating(report);
    return;
  }
  if (report.status === "GENERATING") {
    await continueGenerating(report);
    return;
  }
  if (report.status === "RENDERING") {
    await finishRendering(report);
    return;
  }
  // READY / FAILED / CANCELLED / PURCHASED — nothing to do here.
}

async function startGenerating(report: Report): Promise<void> {
  const locked = await transitionReportStatus(report.id, "SCHEDULED", "GENERATING", {
    startedAt: Date.now(),
  });
  if (!locked) return; // another tick already picked this up

  try {
    const snapshot = await buildAstrologySnapshot(report.profileSnapshot);
    // Persist the snapshot as its own field before any section work —
    // if this exact call dies partway through section generation, the
    // NEXT GENERATING tick reads it back from `getReport` rather than
    // recomputing (recomputation is cheap and deterministic here, but
    // storing it also gives the astrologySnapshot AGENTS §90 asks for
    // as a stored, inspectable field).
    const withSnapshot = await getReport(report.id);
    if (!withSnapshot) return;
    withSnapshot.astrologySnapshot = snapshot;
    await saveAstrologySnapshot(report.id, snapshot);
    await continueGenerating({ ...withSnapshot, astrologySnapshot: snapshot });
  } catch (err) {
    await markReportFailed(report.id, "SNAPSHOT_FAILED", errorMessage(err));
  }
}

async function saveAstrologySnapshot(reportId: string, snapshot: Report["astrologySnapshot"]): Promise<void> {
  const { getAdminApp } = await import("@/lib/firebase-admin");
  const { getFirestore } = await import("firebase-admin/firestore");
  await getFirestore(getAdminApp())
    .collection("reports")
    .doc(reportId)
    .update({ astrologySnapshot: snapshot, updatedAt: Date.now() });
}

async function continueGenerating(report: Report): Promise<void> {
  if (!report.astrologySnapshot) {
    // Shouldn't happen (startGenerating always sets it first), but
    // don't silently stall a report if it somehow does.
    const fresh = await buildAstrologySnapshot(report.profileSnapshot);
    await saveAstrologySnapshot(report.id, fresh);
    report = { ...report, astrologySnapshot: fresh };
  }

  const blueprint = getReportBlueprint(report.reportType);
  const batch = report.pendingSectionIds.slice(0, SECTIONS_PER_TICK);

  for (const sectionId of batch) {
    const spec = blueprint.sections.find((s) => s.id === sectionId);
    if (!spec) continue; // stale id from a since-changed blueprint — skip rather than crash a whole report

    try {
      const content = await generatePaidReportSection({
        reportTypeName: blueprint.type,
        sectionTitle: spec.title,
        instructions: spec.instructions,
        relevantData: pickSnapshotData(report.astrologySnapshot!, spec.dataKeys),
        personName: report.profileSnapshot.fullName,
        targetWords: spec.targetWords,
        includeRemedies: spec.includeRemedies,
      });
      const generated: GeneratedSection = {
        id: spec.id,
        title: spec.title,
        content,
        estimatedPages: estimateSectionPages(content),
        generatedAt: Date.now(),
      };
      await appendGeneratedSection(report.id, generated);
    } catch (err) {
      await incrementAttemptCount(report.id);
      if (report.attemptCount + 1 >= MAX_SECTION_ATTEMPTS) {
        await markReportFailed(report.id, "SECTION_GENERATION_FAILED", `Section "${spec.title}": ${errorMessage(err)}`);
        return;
      }
      // Leave this section in pendingSectionIds — the next tick retries
      // just this section, never the whole report (AGENTS §44).
      return;
    }
  }

  const after = await getReport(report.id);
  if (!after) return;
  if (after.pendingSectionIds.length === 0) {
    await transitionReportStatus(report.id, "GENERATING", "RENDERING", {});
    // Fall straight into rendering in the same tick when there's
    // budget — avoids one extra idle cron cycle for the common case.
    const forRender = await getReport(report.id);
    if (forRender) await finishRendering(forRender);
  }
  // Otherwise: more sections remain, next tick (cron or another
  // immediate kick) continues from pendingSectionIds.
}

function estimateSectionPages(content: Report["sections"][number]["content"]): number {
  const words = content.paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
  const tableRows = content.table?.rows.length ?? 0;
  // ~500 words/page of narrative prose, plus a modest allowance for a
  // table or key-points block sharing the page — a real, if
  // approximate, estimate (never padding) used only for the length
  // controller's page-count validation (AGENTS §64).
  return Math.max(0.4, words / 500 + tableRows * 0.03);
}

async function finishRendering(report: Report): Promise<void> {
  try {
    const blueprint = getReportBlueprint(report.reportType);
    const pageCount = estimatePageCount(report);

    // The in-browser reader (src/app/reports/[reportId]/page.tsx) is a
    // Server Component that renders the SAME stored sections+blueprint
    // directly as JSX — there's no separate cached HTML string to
    // generate here. Only the PDF needs a distinct render pass, since
    // it's a different rendering technology (@react-pdf/renderer);
    // both draw from this exact same canonical Report document, per
    // AGENTS §128's HTML/PDF-parity requirement.
    const pdfBuffer = await renderReportPdf(report, blueprint);
    const { storageRef } = await uploadReportPdf(report.id, pdfBuffer);

    await transitionReportStatus(report.id, "RENDERING", "READY", {
      pageCount,
      pdfStorageRef: storageRef,
      completedAt: Date.now(),
    });
  } catch (err) {
    await markReportFailed(report.id, "RENDER_FAILED", errorMessage(err));
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
