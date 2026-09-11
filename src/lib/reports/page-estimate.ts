// src/lib/reports/page-estimate.ts
// Real page-count estimation from actual generated content — never
// padding (AGENTS §18/§64). Fixed template pages (cover, table of
// contents, basic-details) are counted because they're genuinely
// rendered pages with real content, not blank filler.
import type { Report } from "./types";

const FIXED_TEMPLATE_PAGES = 3; // cover + table of contents + basic-details

export function estimatePageCount(report: Report): number {
  const sectionPages = report.sections.reduce((sum, s) => sum + s.estimatedPages, 0);
  return Math.max(1, Math.round(FIXED_TEMPLATE_PAGES + sectionPages));
}
