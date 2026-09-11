// src/lib/reports/demo-store.ts
// Server-only read of a pre-generated demo report — cached in
// Firestore at demoReports/{type} rather than regenerated on every
// page visit (AGENTS §17). Generated once via
// scripts/dev/generate-demo-reports.ts using fictional/sample data,
// never a real user's chart (AGENTS §126).
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import type { GeneratedSection, ReportProfileSnapshot, ReportType } from "./types";

export type DemoReport = {
  reportType: ReportType;
  productName: string;
  profileSnapshot: ReportProfileSnapshot;
  sections: GeneratedSection[];
  generatedAt: number;
};

export async function getDemoReport(type: ReportType): Promise<DemoReport | null> {
  const snap = await getFirestore(getAdminApp()).collection("demoReports").doc(type).get();
  return snap.exists ? (snap.data() as DemoReport) : null;
}
