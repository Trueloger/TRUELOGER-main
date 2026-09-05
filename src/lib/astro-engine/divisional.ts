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
// D2 — Hora
// ---------------------------------------------------------------------
//
// Classical rule (Brihat Parashara Hora Shastra "Parashari Hora" scheme):
// each 30° sign is divided into two 15° halves. Which half is the Sun's
// Hora and which is the Moon's Hora depends on odd/even sign parity
// (odd counted from Aries = 1st = odd):
//   - Odd signs (Aries, Gemini, Leo, Libra, Sagittarius, Aquarius):
//     0°-15° = Sun's Hora, 15°-30° = Moon's Hora.
//   - Even signs (Taurus, Cancer, Virgo, Scorpio, Capricorn, Pisces):
//     0°-15° = Moon's Hora, 15°-30° = Sun's Hora.
// Every planet/point in a Sun's Hora is placed in Leo (sign 5, the
// Sun's own sign) in the D2 chart; every point in a Moon's Hora is
// placed in Cancer (sign 4, the Moon's own sign). Unlike every other
// Varga here, the D2 chart therefore only ever produces TWO possible
// result signs (Cancer or Leo) no matter the input sign — this is a
// genuine structural difference from D9/D10's full 12-sign spread, not
// a bug.
//
// Alternate historical scheme NOT used here: "Kashinatha Hora" (also
// transmitted via Jagannatha Hora software) classifies signs as
// day-strong (Leo, Virgo, Libra, Scorpio, Aquarius, Pisces, ruled by
// the Sun) or night-strong (Aries, Taurus, Gemini, Cancer, Sagittarius,
// Capricorn, ruled by the Moon) rather than by odd/even parity, and can
// place a planet in any of several signs (the day/night sign of that
// sign's own ruler), not just Cancer/Leo. This repo implements the
// mainstream Parashari scheme, which is what "D2"/"Hora chart" means in
// every source below and in this repo's other varga documentation.
//
// Sources (agree on the exact odd/even + Cancer/Leo rule; both trace it
// to Brihat Parashara Hora Shastra):
//  - https://desiutils.in/astrology/hora-d2 ("The first half of an odd
//    Rasi is the Hora, ruled by Surya [0-15°]... the second half
//    belongs to the Moon's hora [15-30°]... For even signs the order
//    reverses... If the planet falls in a Sun's hora -> it appears in
//    Leo in the D2... Moon's hora -> Cancer." Worked examples: "Gemini
//    18° (odd sign): 18° falls in the Moon's hora range (15-30°) ->
//    Cancer." "Taurus 8° (even sign): 8° falls in the Moon's hora range
//    (0-15°) -> Cancer.")
//  - https://astroavastha.com/blog/hora-d2-chart/ and
//    https://www.astrologyofbharat.org/2020/08/hora-d2-chart-analysis-for-wealth-and.html
//    (corroborate the identical odd/even half-sign rule and the
//    Cancer/Leo-only placement.)
//  - Kashinatha-Hora alternate scheme cross-referenced via
//    https://srigaruda.com/kashinatha-hora-d-2/ and
//    https://www.vedicastrologer.org/jh/features.htm (Jagannatha Hora
//    software's varga documentation, listing Kashinatha Hora as a
//    distinct, non-default D2 option).

function calculateD2(point: ChartPoint): DivisionalPoint {
  const half = partIndex(point.degree, 2); // 1 = 0-15deg, 2 = 15-30deg
  const odd = isOddSign(point.sign);
  // Odd sign: half 1 -> Sun's Hora, half 2 -> Moon's Hora.
  // Even sign: half 1 -> Moon's Hora, half 2 -> Sun's Hora.
  const isSunHora = odd ? half === 1 : half === 2;
  const resultSign = isSunHora ? 5 : 4; // Leo : Cancer
  return toDivisionalPoint(point, resultSign);
}

// ---------------------------------------------------------------------
// D3 — Drekkana
// ---------------------------------------------------------------------
//
// Classical rule (Brihat Parashara Hora Shastra, Parashari scheme): each
// 30° sign is divided into three 10° parts ("drekkanas"). Unlike D9/D10,
// the starting sign for the count is NOT the natal sign's modality or
// parity — it is always the SAME 1st/5th/9th-from-the-sign (trine)
// pattern for every sign, with no variation:
//   - 1st part (0°-10°):  maps to the sign itself (offset +0).
//   - 2nd part (10°-20°): maps to the 5th sign from it, counted
//     inclusively (offset +4).
//   - 3rd part (20°-30°): maps to the 9th sign from it, counted
//     inclusively (offset +8).
// This trine (1-5-9, same element) pattern applies uniformly to all
// twelve signs — there is no odd/even or modality branch here, which is
// itself the interesting structural difference from D9/D10/D2.
//
// Sources (agree on the exact 1st/5th/9th trine rule and both give
// worked numeric examples reproduced as test assertions):
//  - https://desiutils.in/astrology/drekkana-d3 ("the first part maps
//    to the sign itself, the second to the 5th sign from it, and the
//    third to the 9th sign from it"; worked example: "Part 2 (10-20 deg
//    Taurus) -> maps to Virgo (5th sign from Taurus)... a planet at 15
//    deg Taurus... relocates to Virgo in the D3 chart.")
//  - https://astroavastha.com/blog/dreshkana-d3-chart/ and
//    https://jagannathhora.com/drekkana-chart-d3-siblings-courage/
//    (corroborate the identical 1st/5th/9th-from-the-sign division,
//    citing Brihat Parashara Hora Shastra; worked example there: "4 deg
//    Aries -> 1st drekkana -> Aries; 14 deg Aries -> 2nd drekkana ->
//    Leo (5th from Aries); 24 deg Aries -> 3rd drekkana -> Sagittarius
//    (9th from Aries).")

function calculateD3(point: ChartPoint): DivisionalPoint {
  const part = partIndex(point.degree, 3); // 1-3
  const offset = (part - 1) * 4; // part1:+0, part2:+4 (5th incl.), part3:+8 (9th incl.)
  const resultSign = normalizeSign(point.sign + offset);
  return toDivisionalPoint(point, resultSign);
}

// ---------------------------------------------------------------------
// D4 — Chaturthamsa
// ---------------------------------------------------------------------
//
// Classical rule (Brihat Parashara Hora Shastra, Parashari scheme): each
// 30° sign is divided into four 7°30' parts ("Chaturthamsas"). Like D3,
// the mapping is a fixed, uniform-for-every-sign pattern (no odd/even
// or modality branch) — but here it is the four KENDRAS (angular
// houses: 1st/4th/7th/10th) from the sign, not a trine:
//   - 1st part (0°-7°30'):    maps to the sign itself (offset +0).
//   - 2nd part (7°30'-15°):   maps to the 4th sign from it, counted
//     inclusively (offset +3).
//   - 3rd part (15°-22°30'):  maps to the 7th sign from it, counted
//     inclusively (offset +6).
//   - 4th part (22°30'-30°):  maps to the 10th sign from it, counted
//     inclusively (offset +9).
//
// Sources (agree on the exact 1st/4th/7th/10th kendra rule and both
// give worked numeric examples reproduced as test assertions):
//  - https://desiutils.in/astrology/chaturthamsa-d4 ("The Lords of the
//    4 Kendras from a Rasi are the rulers of respective Chaturthahs of
//    a Rasi"; worked example: "A planet positioned at 8 degrees of
//    Aries falls within the second quarter (7.5-15 deg)... the 4th sign
//    from Aries is Cancer... this planet's D4 placement is Cancer.")
//  - https://astroavastha.com/blog/chathurthamasha-chart-d4/ (search
//    synthesis, corroborating the identical quarter -> kendra mapping,
//    citing Brihat Parashara Hora Shastra ch. 6/9; worked example
//    there: "a planet in the second part of Aries appears in Cancer...
//    third part of Aries appears in Libra (7th from Aries)... fourth
//    part of Aries appears in Capricorn (10th from Aries).")

function calculateD4(point: ChartPoint): DivisionalPoint {
  const part = partIndex(point.degree, 4); // 1-4
  const offset = (part - 1) * 3; // part1:+0, part2:+3(4th), part3:+6(7th), part4:+9(10th)
  const resultSign = normalizeSign(point.sign + offset);
  return toDivisionalPoint(point, resultSign);
}

// ---------------------------------------------------------------------
// D7 — Saptamsa
// ---------------------------------------------------------------------
//
// Classical rule (Brihat Parashara Hora Shastra): each 30° sign is
// divided into seven parts of 30/7° (~4°17'8"). The STARTING sign for
// the 7-part count depends on odd/even parity, like D10 (not modality,
// like D9):
//   - Odd signs (Aries, Gemini, Leo, Libra, Sagittarius, Aquarius): the
//     count starts from the sign itself (offset +0).
//   - Even signs (Taurus, Cancer, Virgo, Scorpio, Capricorn, Pisces):
//     the count starts from the 7th sign from it, counted inclusively
//     (offset +6).
// Research note (point of possible cross-source variation, checked and
// NOT found to be a real disagreement here): some secondary write-ups
// state the D7 rule loosely as "odd/even" without specifying the exact
// starting offset, which invites confusion with D9's modality-based or
// D10's 9th-sign starting rule. Both primary sources checked below
// independently confirm the SAME 7th-sign (not 9th-sign, not
// modality-based) starting rule for even signs with matching worked
// numeric examples, so this repo treats it as settled rather than
// picking between disagreeing conventions.
//
// Sources (agree on the exact rule and both give worked numeric
// examples reproduced as test assertions):
//  - https://desiutils.in/astrology/saptamsa-d7 ("For odd signs...the
//    seven divisions begin from the same sign itself... For even
//    signs...the count starts from the seventh sign counted from it";
//    worked example: "a planet at 10 deg in Aries (odd)... falls in
//    the third division... maps to Gemini... lands in Gemini in the D7
//    chart.")
//  - Search synthesis corroborated by
//    https://www.myzodiaq.in/en/online-library/basics-of-vedic-astrology/divisional-charts/d7-saptamsha-chart
//    and http://sksastro.blogspot.com/2011/09/saptamsa-d7.html (worked
//    example there: "A planet in the first saptamsa of Taurus (an even
//    sign, 0-4.29 deg) appears in Scorpio in the D7 [7th from
//    Taurus]... the seventh saptamsa...appears in Taurus itself.")

/** The sign the Saptamsa count starts from, for a given natal sign,
 * per the odd/even rule documented above (same parity test as D10,
 * different offset: 7th-from-it here vs. 9th-from-it for D10). */
function saptamsaStartingSign(natalSign: number): number {
  if (isOddSign(natalSign)) return natalSign; // odd: start from itself
  return normalizeSign(natalSign + 6); // even: 7th from it (inclusive count => +6)
}

function calculateD7(point: ChartPoint): DivisionalPoint {
  const part = partIndex(point.degree, 7); // 1-7
  const startingSign = saptamsaStartingSign(point.sign);
  const resultSign = normalizeSign(startingSign + (part - 1));
  return toDivisionalPoint(point, resultSign);
}

// ---------------------------------------------------------------------
// D12 — Dwadashamsa
// ---------------------------------------------------------------------
//
// Classical rule (Brihat Parashara Hora Shastra ch. 6, 15): each 30°
// sign is divided into twelve 2°30' parts ("dwadasamsas"). This is
// genuinely the simplest rule of any Varga in this file: the twelve
// parts map to twelve CONSECUTIVE signs starting from the sign itself
// — part 1 -> the sign itself, part 2 -> the 2nd sign from it, ...,
// part 12 -> the 12th sign from it — with NO odd/even or modality
// branch at all (confirmed via research, not assumed).
//
// Sources (agree on the exact consecutive 1-12 rule and both give
// worked numeric examples reproduced as test assertions):
//  - https://desiutils.in/astrology/dwadasamsa-d12 ("Each of the twelve
//    parts of a sign is ruled by twelve consecutive signs starting from
//    the sign itself, without any odd-even distinction"; worked
//    example: "second dwadasamsa (2deg30'-5deg) is ruled by the 2nd
//    sign from it. A planet in the second part of Aries appears in
//    Taurus in the D12.")
//  - https://jagannathhora.com/dwadasamsa-chart-d12-parents-ancestry/
//    (corroborates the identical consecutive rule; worked examples
//    there: "A planet at 8 deg Aries... falls in the fourth
//    dwadasamsa... Cancer in D12 (the 4th sign from Aries)"; "A planet
//    at 25 deg Aries... falls in the eleventh dwadasamsa... Aquarius in
//    D12 (the 11th sign from Aries).")

function calculateD12(point: ChartPoint): DivisionalPoint {
  const part = partIndex(point.degree, 12); // 1-12
  const resultSign = normalizeSign(point.sign + (part - 1));
  return toDivisionalPoint(point, resultSign);
}

// ---------------------------------------------------------------------
// Registry — varga number -> calculator. D1/D2/D9/D10 are implemented
// this pass; more vargas (D3, D4, D7, D12, D16, D20, D24, D27, D30,
// D40, D45, D60, ...) can be added later by researching each one's own
// classical rule and adding one more entry here, with no changes to
// the calculators already registered.
// ---------------------------------------------------------------------

const VARGA_CALCULATORS: Partial<Record<number, VargaCalculator>> = {
  1: calculateD1,
  2: calculateD2,
  3: calculateD3,
  4: calculateD4,
  7: calculateD7,
  9: calculateD9,
  10: calculateD10,
  12: calculateD12,
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
export { calculateD1, calculateD2, calculateD3, calculateD4, calculateD7, calculateD9, calculateD10, calculateD12 };
