// src/lib/reports/blueprints/types.ts
// One blueprint per report type — the ONLY place section content
// strategy differs between report types (AGENTS §121). Developer-
// controlled, never touched by Admin or by user input.
import type { AstrologySnapshot, ReportType } from "../types";

export type SectionSpec = {
  id: string; // stable, used as GeneratedSection.id — never renumber once a report type has shipped
  title: string;
  instructions: string; // the server-controlled prompt instruction for this section
  /** Which top-level AstrologySnapshot keys this section's prompt
   * receives — keeps each prompt lean and scoped to what the section
   * actually needs (AGENTS §78). "profile" is a synthetic key meaning
   * "include the person's name" (handled separately, never the full
   * birth data unless a section explicitly needs it via "profile.dob" etc). */
  dataKeys: (keyof AstrologySnapshot)[];
  targetWords: { min: number; max: number };
  includeRemedies?: boolean;
};

export type ReportBlueprint = {
  type: ReportType;
  sections: SectionSpec[];
};

export function pickSnapshotData(
  snapshot: AstrologySnapshot,
  keys: (keyof AstrologySnapshot)[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) out[key] = snapshot[key];
  return out;
}
