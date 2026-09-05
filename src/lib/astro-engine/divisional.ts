// src/lib/astro-engine/divisional.ts
// Vedic divisional (Varga) chart engine, built on top of the existing
// natal chart engine (`./ephemeris.ts`). Additive-only: this module
// only READS `ChartData`/`ChartPoint`/`ChartPlanetEntry`/`ChartPlanetName`
// (already exported by ephemeris.ts) and adds new exports here — it
// does not modify ephemeris.ts's existing behavior.
//
// Each Varga divides every sign (30°) into N equal parts and maps the
// occupied part to a resulting sign via a classical rule. These rules
// genuinely differ in STRUCTURE between vargas (not just "a table"),
// so D9 and D10 are implemented as distinct, independently-researched
// calculators rather than forced into one shared "modulo" function.
// A small amount of truly shared arithmetic (locating which of the N
// equal parts a degree-in-sign falls into) is factored into
// `partIndex()` below.
//
// Architecture: each implemented Varga registers a calculator function
// keyed by its varga number in `VARGA_CALCULATORS`. `calculateDivisionalChart()`
// is the single generic entry point — it looks up the calculator and
// applies it to the Ascendant + every planet. Adding a new Varga later
// (D2, D3, D4, D7, D12, D16, D20, D24, D27, D30, D40, D45, D60, ...)
// means researching that Varga's own classical rule and registering one
// more calculator here — no changes to D9/D10 or to the entry point.
import type { ChartData, ChartPlanetName, ChartPoint } from "./ephemeris.ts";

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type DivisionalPoint = {
  /** 1-12, sidereal zodiac sign number in the divisional chart. */
  sign: number;
  /** 0-<vargaSpan>, degree within the varga-sign's own natal 30° span
   * (i.e. how far through the 30° natal sign the source longitude was,
   * NOT re-scaled to a fictitious 360°/N division). */
  degreeInVarga: number;
};

export type DivisionalChartResult = {
  /** The varga number, e.g. 9 for Navamsa, 10 for Dashamsa. */
  varga: number;
  ascendant: DivisionalPoint;
  planets: Record<ChartPlanetName, DivisionalPoint>;
};

type VargaCalculator = (point: ChartPoint) => DivisionalPoint;

// ---------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------

function normalizeSign(sign: number): number {
  return ((sign - 1) % 12 + 12) % 12 + 1; // wraps into 1-12
}

/**
 * Which of N equal parts (each 30/N degrees wide) `degree` (0-30,
 * degree-in-sign) falls into, using inclusive part numbering: part 1 is
 * [0, 30/N), part 2 is [30/N, 60/N), ..., part N is [30*(N-1)/N, 30).
 * Returns a 1-indexed part number, 1..N. This is the one piece of
 * arithmetic every equal-division Varga genuinely shares; the RESULTING
 * SIGN mapping from (natal sign, part number) is varga-specific and is
 * NOT handled here.
 */
function partIndex(degree: number, vargaCount: number): number {
  const span = 30 / vargaCount;
  const idx = Math.floor(degree / span);
  // Guard the exact-30.0 (or floating-point-nudged-past-N) edge case.
  return Math.min(Math.max(idx, 0), vargaCount - 1) + 1;
}

function toDivisionalPoint(point: ChartPoint, sign: number): DivisionalPoint {
  return { sign: normalizeSign(sign), degreeInVarga: point.degree };
}

// ---------------------------------------------------------------------
// D1 — Rashi (natal chart passthrough)
// ---------------------------------------------------------------------

/**
 * D1 (Rashi): trivial identity mapping — the natal chart itself, in
 * the DivisionalPoint shape, so callers can treat "the natal chart" and
 * "a divisional chart" through one consistent interface. There is no
 * classical division rule to research here; a planet's D1 sign is
 * simply its natal sign.
 */
function calculateD1(point: ChartPoint): DivisionalPoint {
  return { sign: point.sign, degreeInVarga: point.degree };
}

// ---------------------------------------------------------------------
// D9 — Navamsa
// ---------------------------------------------------------------------
//
// Classical rule (Brihat Parashara Hora Shastra; confirmed identically
// across 3 independent sources — see module-level research citations
// in divisional.test.ts): each 30° sign is divided into nine 3°20'
// (200') parts. The Navamsa sign sequence's STARTING sign depends on
// the natal sign's modality:
//   - Movable signs (Aries, Cancer, Libra, Capricorn): the 1st Navamsa
//     part starts counting from the sign itself.
//   - Fixed signs (Taurus, Leo, Scorpio, Aquarius): the 1st Navamsa
//     part starts counting from the 9th sign counted from it.
//   - Dual signs (Gemini, Virgo, Sagittarius, Pisces): the 1st Navamsa
//     part starts counting from the 5th sign counted from it.
// Then the occupied part number (1-9) is counted forward (inclusive,
// wrapping through the zodiac) from that starting sign.
//
// Sources (all agree on this exact rule):
//  - https://www.tempora.ltd/findings/navamsa-d9-chart
//    (worked example: Aries 18°15' -> 6th part -> movable, count from
//    Aries -> Virgo. Reproduced as a test assertion.)
//  - https://steer.coach/navamsa-d9-chart/
//    (worked example: Libra 4° -> 2nd part -> movable, count from
//    Libra -> Scorpio.)
//  - https://www.astrologyofbharat.org/2020/04/navamsa-d9-in-vedic-astrology-its-real.html
//    (corroborates via the Vargottama definition: 1st navamsa in
//    movable signs, 5th in fixed, 9th in dual, is Vargottama — which is
//    only consistent with the same starting-sign rule above.)
//  - Ultimate textual source cited by all three: Brihat Parashara Hora
//    Shastra, ch. 6 onward (Shodasavarga / divisional chart rules).

/** Sign modality: 1=movable, 2=fixed, 3=dual. Aries(1)=movable,
 * Taurus(2)=fixed, Gemini(3)=dual, Cancer(4)=movable, ... — the
 * standard repeating movable/fixed/dual cycle of the zodiac. */
function signModality(sign: number): 1 | 2 | 3 {
  const mod = ((sign - 1) % 3) as 0 | 1 | 2;
  return (mod + 1) as 1 | 2 | 3;
}

/** The sign the Navamsa count starts from, for a given natal sign,
 * per the modality rule documented above. */
function navamsaStartingSign(natalSign: number): number {
  const modality = signModality(natalSign);
  if (modality === 1) return natalSign; // movable: start from itself
  if (modality === 2) return normalizeSign(natalSign + 8); // fixed: 9th from it (inclusive count => +8)
  return normalizeSign(natalSign + 4); // dual: 5th from it (inclusive count => +4)
}

function calculateD9(point: ChartPoint): DivisionalPoint {
  const part = partIndex(point.degree, 9); // 1-9
  const startingSign = navamsaStartingSign(point.sign);
  const resultSign = normalizeSign(startingSign + (part - 1));
  return toDivisionalPoint(point, resultSign);
}

// ---------------------------------------------------------------------
// D10 — Dashamsa
// ---------------------------------------------------------------------
//
// Classical rule (Brihat Parashara Hora Shastra): each 30° sign is
// divided into ten 3° parts. The Dashamsa sign sequence's STARTING sign
// depends on whether the natal sign is odd or even (odd/even counted
// from Aries = 1st = odd):
//   - Odd signs (Aries, Gemini, Leo, Libra, Sagittarius, Aquarius): the
//     ten parts are counted starting from the sign itself.
//   - Even signs (Taurus, Cancer, Virgo, Scorpio, Capricorn, Pisces):
//     the ten parts are counted starting from the 9th sign counted
//     from it.
// This is a DIFFERENT structural rule from D9 (odd/even parity, not
// movable/fixed/dual modality; ten parts not nine) — hence it is its
// own calculator rather than a parameterized reuse of D9's logic.
//
// Sources (agree on this exact rule, and both give worked numeric
// examples reproduced as test assertions):
//  - https://vedicmarga.com/d10-calculator/ (via search synthesis,
//    citing Brihat Parashara Hora Shastra): "Moon at 5°10' Aries falls
//    in the second part; Aries is odd, so count two from Aries itself,
//    and the Moon lands in Taurus in the D10. Sun at 17°30' Taurus
//    falls in the sixth part; Taurus is even, so count six starting
//    from Capricorn, the ninth from Taurus, and the Sun lands in
//    Gemini in the D10."
//  - https://asksoma.ai/dashamsha-calculator and
//    https://desiutils.in/astrology/dasamsa-d10 (corroborate the same
//    odd-sign-starts-from-itself / even-sign-starts-from-9th-sign rule).

function isOddSign(sign: number): boolean {
  return sign % 2 === 1; // Aries=1 odd, Taurus=2 even, ...
}

/** The sign the Dashamsa count starts from, for a given natal sign,
 * per the odd/even rule documented above. */
function dashamsaStartingSign(natalSign: number): number {
  if (isOddSign(natalSign)) return natalSign; // odd: start from itself
  return normalizeSign(natalSign + 8); // even: 9th from it (inclusive count => +8)
}

function calculateD10(point: ChartPoint): DivisionalPoint {
  const part = partIndex(point.degree, 10); // 1-10
  const startingSign = dashamsaStartingSign(point.sign);
  const resultSign = normalizeSign(startingSign + (part - 1));
  return toDivisionalPoint(point, resultSign);
}

// ---------------------------------------------------------------------
// Registry — varga number -> calculator. Only D1/D9/D10 are implemented
// this pass; more vargas (D2, D3, D4, D7, D12, D16, D20, D24, D27, D30,
// D40, D45, D60, ...) can be added later by researching each one's own
// classical rule and adding one more entry here, with no changes to
// the calculators already registered.
// ---------------------------------------------------------------------

const VARGA_CALCULATORS: Partial<Record<number, VargaCalculator>> = {
  1: calculateD1,
  9: calculateD9,
  10: calculateD10,
};

/** Varga numbers currently implemented (not just planned/stubbed). */
export const IMPLEMENTED_VARGAS: readonly number[] = Object.keys(VARGA_CALCULATORS)
  .map(Number)
  .sort((a, b) => a - b);

/**
 * Generic divisional-chart entry point: applies the registered
 * calculator for `vargaNumber` to a natal `ChartData`'s Ascendant and
 * every planet. Throws if `vargaNumber` has no registered calculator
 * (rather than silently producing wrong data for an un-researched
 * Varga).
 */
export function calculateDivisionalChart(vargaNumber: number, chartData: ChartData): DivisionalChartResult {
  const calculator = VARGA_CALCULATORS[vargaNumber];
  if (!calculator) {
    throw new Error(
      `calculateDivisionalChart: no calculator registered for D${vargaNumber} (implemented: ${IMPLEMENTED_VARGAS.map((v) => `D${v}`).join(", ")})`
    );
  }

  const planets = {} as Record<ChartPlanetName, DivisionalPoint>;
  for (const [name, entry] of Object.entries(chartData.planets) as [ChartPlanetName, ChartData["planets"][ChartPlanetName]][]) {
    planets[name] = calculator(entry);
  }

  return {
    varga: vargaNumber,
    ascendant: calculator(chartData.ascendant),
    planets,
  };
}

// Individual calculators are also exported directly for callers that
// only need one Varga without building a full ChartData round-trip
// (e.g. unit tests, or a caller that already has a raw ChartPoint).
export { calculateD1, calculateD9, calculateD10 };
