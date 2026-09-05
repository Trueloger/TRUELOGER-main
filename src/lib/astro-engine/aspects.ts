// src/lib/astro-engine/aspects.ts
// Parashari graha drishti (planetary aspects) — PARASHARI ONLY. This
// module intentionally implements only the Parashari sign-based aspect
// scheme (Brihat Parashara Hora Shastra). It does NOT implement Jaimini
// drishti (which is rashi/sign-based in a materially different way —
// Jaimini aspects are cast BY SIGNS on other signs based on
// movable/fixed/dual classification, not by each individual planet's
// special extra aspects) or any other rashi-drishti scheme. Never mix
// a Jaimini rule into this file — if a future rule's classical
// provenance (Parashari vs Jaimini vs some other school) is unclear,
// research it and confirm before adding it here.
//
// Rules (Parashari, BPHS ch. 25 "Planetary Aspects"):
// - All 7 classical planets cast a 7th-sign (full/opposite) aspect.
// - Mars ALSO aspects the 4th and 8th signs from itself.
// - Jupiter ALSO aspects the 5th and 9th signs from itself.
// - Saturn ALSO aspects the 3rd and 10th signs from itself.
// - Sun, Moon, Mercury, Venus cast ONLY the universal 7th aspect (no
//   special extra aspects in the classical Parashari scheme).
// Source (standard BPHS-derived aspect table, cross-checked across
// multiple mirrors of the same classical rule):
// https://www.astrojyoti.com/lesson6.htm (planetary aspects section)
// https://jagannathhora.com/signs/ (sign-based Parashari aspect refs)
//
// Rahu/Ketu aspects: classical opinion is genuinely split across
// schools — some (mainly Jaimini-influenced or later compilations)
// give Rahu/Ketu a Saturn-like (3rd/7th/10th... variants differ by
// source) or Mars-like special aspect, others give them only the
// universal 7th, and strict BPHS Parashari gives NO aspects at all to
// Rahu/Ketu (aspects in ch.25 are enumerated for the 7 grahas only).
// Because this is disputed rather than a settled Parashari rule, it is
// implemented here ONLY behind the explicit `includeNodeAspects` opt-in
// (default `false`), using the most commonly cited variant when
// schools DO include them (7th-sign aspect only, the least
// school-specific of the variants) — this keeps the unconditional
// Parashari-7 core clean of a disputed, opt-in rule.
import type { ChartData, ChartPlanetName } from "./ephemeris.ts";

export type AspectType = "7th" | "4th" | "8th" | "5th" | "9th" | "3rd" | "10th";

export type Aspect = {
  fromPlanet: ChartPlanetName;
  toSign: number;
  aspectType: AspectType;
};

function signOffset(sign: number, offset: number): number {
  return ((sign - 1 + offset) % 12) + 1;
}

/** Universal 7th-sign aspect, cast by all 7 classical planets (and,
 * opt-in only, Rahu/Ketu — see module doc comment). */
const UNIVERSAL_ASPECT_OFFSET = 6; // 7th sign = +6

/** Special extra aspects, Parashari BPHS ch.25. Offsets are
 * "signs forward from the planet's own sign" (0-indexed: +3 = 4th
 * sign, +9 = 10th sign, etc). */
const SPECIAL_ASPECTS: Partial<Record<ChartPlanetName, { offset: number; type: AspectType }[]>> = {
  Mars: [
    { offset: 3, type: "4th" },
    { offset: 7, type: "8th" },
  ],
  Jupiter: [
    { offset: 4, type: "5th" },
    { offset: 8, type: "9th" },
  ],
  Saturn: [
    { offset: 2, type: "3rd" },
    { offset: 9, type: "10th" },
  ],
};

const CLASSICAL_PLANETS_WITH_ASPECTS: readonly ChartPlanetName[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
];

export type AspectOptions = {
  /** Opt-in only — see module doc comment on why this is disputed and
   * off by default. When `true`, Rahu and Ketu each additionally cast
   * a 7th-sign aspect only (the least school-specific variant). */
  includeNodeAspects?: boolean;
};

/**
 * All Parashari graha drishti in the chart: every classical planet's
 * universal 7th-sign aspect, plus Mars/Jupiter/Saturn's special extra
 * aspects. Rahu/Ketu aspects are included ONLY when
 * `options.includeNodeAspects` is explicitly `true` (default `false`)
 * — see module doc comment.
 */
export function calculateAspects(chart: ChartData, options?: AspectOptions): Aspect[] {
  const aspects: Aspect[] = [];

  for (const planet of CLASSICAL_PLANETS_WITH_ASPECTS) {
    const fromSign = chart.planets[planet].sign;
    aspects.push({ fromPlanet: planet, toSign: signOffset(fromSign, UNIVERSAL_ASPECT_OFFSET), aspectType: "7th" });

    for (const special of SPECIAL_ASPECTS[planet] ?? []) {
      aspects.push({ fromPlanet: planet, toSign: signOffset(fromSign, special.offset), aspectType: special.type });
    }
  }

  if (options?.includeNodeAspects) {
    for (const node of ["Rahu", "Ketu"] as const) {
      const fromSign = chart.planets[node].sign;
      aspects.push({ fromPlanet: node, toSign: signOffset(fromSign, UNIVERSAL_ASPECT_OFFSET), aspectType: "7th" });
    }
  }

  return aspects;
}

/** All aspects (from `calculateAspects`) that land on `signNumber`
 * (1-12) — useful for house-aspect analysis ("which planets aspect my
 * 4th house sign"). */
export function aspectsToSign(chart: ChartData, signNumber: number, options?: AspectOptions): Aspect[] {
  return calculateAspects(chart, options).filter((aspect) => aspect.toSign === signNumber);
}
