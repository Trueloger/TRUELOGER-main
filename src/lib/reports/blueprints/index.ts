// src/lib/reports/blueprints/index.ts
// Registry mapping every ReportType to its blueprint. The single
// lookup point generate.ts uses — add a new report type by adding one
// file here, nothing else in the pipeline needs to change.
import type { ReportType } from "../types";
import type { ReportBlueprint } from "./types";
import { KUNDLI_BLUEPRINT } from "./kundli";
import { DOSHA_BLUEPRINT } from "./dosha";
import { MARRIAGE_BLUEPRINT } from "./marriage";
import { CAREER_BLUEPRINT } from "./career";
import { LOVE_RELATIONSHIP_BLUEPRINT } from "./love-relationship";
import { FINANCE_BLUEPRINT } from "./finance";
import { LIFE_BLUEPRINT } from "./life";

const REGISTRY: Record<ReportType, ReportBlueprint> = {
  kundli: KUNDLI_BLUEPRINT,
  dosha: DOSHA_BLUEPRINT,
  marriage: MARRIAGE_BLUEPRINT,
  career: CAREER_BLUEPRINT,
  "love-relationship": LOVE_RELATIONSHIP_BLUEPRINT,
  finance: FINANCE_BLUEPRINT,
  life: LIFE_BLUEPRINT,
};

export function getReportBlueprint(type: ReportType): ReportBlueprint {
  return REGISTRY[type];
}
