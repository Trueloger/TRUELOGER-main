// scripts/dev/generate-demo-reports.ts
// One-time (re-runnable) generator for the 7 public demo reports —
// FICTIONAL sample data only, never a real user's chart (AGENTS
// §126). Writes each result to Firestore demoReports/{type}, which
// src/lib/reports/demo-store.ts reads at request time — this is what
// makes the "View Demo Report" pages fast and free of a live
// OpenRouter call per visit (AGENTS §17).
//
// Usage: node --env-file=.env.local scripts/dev/generate-demo-reports.ts [type ...]
// With no args, generates all 7. Pass one or more report-type slugs
// (kundli, marriage, career, love-relationship, finance, life, dosha)
// to regenerate just those.
import { getAdminApp } from "../../src/lib/firebase-admin.ts";
import { getFirestore } from "firebase-admin/firestore";
import { buildAstrologySnapshot } from "../../src/lib/reports/snapshot.ts";
import { getReportBlueprint } from "../../src/lib/reports/blueprints/index.ts";
import { pickSnapshotData } from "../../src/lib/reports/blueprints/types.ts";
import { generatePaidReportSection } from "../../src/lib/ai/paid-report-section.ts";
import { getReportBlueprint as getProductBlueprint } from "../../src/lib/reports/products.ts";
import type { ReportType, GeneratedSection } from "../../src/lib/reports/types.ts";

const ALL_TYPES: ReportType[] = ["kundli", "marriage", "career", "love-relationship", "finance", "life", "dosha"];

// A fictional sample person — deliberately NOT any real user, per
// AGENTS §126. New Delhi coordinates + a plausible historical IST
// offset, mirroring the shape resolveCartLines/profile-snapshot.ts
// produces for a real purchase.
const SAMPLE_PROFILE = {
  fullName: "Aarav Sharma",
  gender: "male",
  dob: "1994-08-15",
  timeOfBirth: "07:30",
  timeUnknown: false,
  birthCity: "New Delhi",
  birthState: "Delhi",
  birthCountry: "India",
  birthLatitude: 28.6139,
  birthLongitude: 77.209,
  birthTimezoneHours: 5.5,
  profileUpdatedAt: Date.now(),
};

function estimateSectionPages(content: GeneratedSection["content"]): number {
  const words = content.paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
  const tableRows = content.table?.rows.length ?? 0;
  return Math.max(0.4, words / 500 + tableRows * 0.03);
}

async function generateOne(type: ReportType) {
  const productBlueprint = getProductBlueprint(type);
  if (!productBlueprint) throw new Error(`No product blueprint for type "${type}"`);
  const sectionBlueprint = getReportBlueprint(type);

  console.log(`\n=== ${productBlueprint.name} (${sectionBlueprint.sections.length} sections) ===`);
  const snapshot = await buildAstrologySnapshot(SAMPLE_PROFILE);

  const sections: GeneratedSection[] = [];
  for (const spec of sectionBlueprint.sections) {
    process.stdout.write(`  - ${spec.title}... `);
    const t0 = Date.now();
    try {
      const content = await generatePaidReportSection({
        reportTypeName: productBlueprint.name,
        sectionTitle: spec.title,
        instructions: spec.instructions,
        relevantData: pickSnapshotData(snapshot, spec.dataKeys),
        personName: SAMPLE_PROFILE.fullName,
        targetWords: spec.targetWords,
        includeRemedies: spec.includeRemedies,
      });
      sections.push({
        id: spec.id,
        title: spec.title,
        content,
        estimatedPages: estimateSectionPages(content),
        generatedAt: Date.now(),
      });
      console.log(`ok (${Date.now() - t0}ms)`);
    } catch (err) {
      console.log(`FAILED: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }

  const pageCount = Math.round(3 + sections.reduce((s, sec) => s + sec.estimatedPages, 0));
  console.log(`  Estimated page count: ${pageCount}`);

  const db = getFirestore(getAdminApp());
  await db.collection("demoReports").doc(type).set({
    reportType: type,
    productName: productBlueprint.name,
    profileSnapshot: SAMPLE_PROFILE,
    sections,
    generatedAt: Date.now(),
  });
  console.log(`  Saved demoReports/${type}`);
}

async function main() {
  const requested = process.argv.slice(2) as ReportType[];
  const types = requested.length > 0 ? requested : ALL_TYPES;
  for (const type of types) {
    if (!ALL_TYPES.includes(type)) {
      console.error(`Unknown report type: ${type}`);
      process.exit(1);
    }
  }
  for (const type of types) {
    await generateOne(type);
  }
  console.log("\nAll requested demo reports generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
