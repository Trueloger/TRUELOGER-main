// src/lib/astrology/ashtakoot-view.ts
// Pure, isomorphic (safe to import from either a "use client" form
// component or a server route) view-model builder for a real, locally
// computed AshtakootResult (src/lib/ashtakoot/calculate.ts). Kundli
// Matching and Compatibility render the exact same 8-koota breakdown
// from the exact same calculation (see each tool's route.ts top
// comment for the shared-calculation decision) — this is the one place
// that translates calculateAshtakoot()'s result into one consistent
// row shape both tools' Form components render identically. Only the
// headings/copy AROUND this table differ per tool; the numbers and
// labels inside it never do — every value below is read straight off
// the real local calculation, never invented.
import type { AshtakootResult } from "../ashtakoot/calculate.ts";

export type KootaRow = {
  key: string;
  label: string;
  score: number;
  outOf: number;
  /** Person A's placement for this koota — a varna, a moon sign, a
   * nakshatra, or similar, whatever that koota compares. */
  personA: string;
  /** Same, for Person B. */
  personB: string;
};

/** Builds the 8 traditional Ashtakoot kootas, in their standard
 * ascending max-score order (Varna /1, Vashya /2, Tara /3, Yoni /4,
 * Graha Maitri /5, Gana /6, Bhakoot /7, Nadi /8 — summing to /36), from
 * a real AshtakootResult. */
export function buildKootaRows(result: AshtakootResult): KootaRow[] {
  return [
    { key: "varna", label: "Varna", ...result.varna },
    { key: "vashya", label: "Vashya", ...result.vashya },
    { key: "tara", label: "Tara", ...result.tara },
    { key: "yoni", label: "Yoni", ...result.yoni },
    { key: "graha-maitri", label: "Graha Maitri", ...result.grahaMaitri },
    { key: "gana", label: "Gana", ...result.gana },
    { key: "bhakoot", label: "Bhakoot", ...result.bhakoot },
    { key: "nadi", label: "Nadi", ...result.nadi },
  ];
}
