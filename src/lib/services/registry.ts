// src/lib/services/registry.ts
import { HEALING_BLUEPRINTS } from "./data/healing";
import { PUJA_BLUEPRINTS } from "./data/puja";
import { COURSE_BLUEPRINTS } from "./data/courses";
import type { ServiceBlueprint, ServiceCategory } from "./types";

export const ALL_BLUEPRINTS: ServiceBlueprint[] = [...HEALING_BLUEPRINTS, ...PUJA_BLUEPRINTS, ...COURSE_BLUEPRINTS];

export function blueprintsFor(category: ServiceCategory): ServiceBlueprint[] {
  return ALL_BLUEPRINTS.filter((b) => b.category === category);
}

export function getBlueprint(category: ServiceCategory, slug: string): ServiceBlueprint | null {
  return ALL_BLUEPRINTS.find((b) => b.category === category && b.slug === slug) ?? null;
}

/** Firestore doc id for a service — category-prefixed so healing/puja/course
 * slugs can never collide even if two categories reuse a slug string. */
export function docId(category: ServiceCategory, slug: string): string {
  return `${category}__${slug}`;
}
