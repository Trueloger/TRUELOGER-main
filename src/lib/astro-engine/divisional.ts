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
// D16 — Shodashamsa
// ---------------------------------------------------------------------
//
// Classical rule (Brihat Parashara Hora Shastra): each 30° sign is
// divided into sixteen 1°52'30" parts ("shodasamsas"). Structurally this
// is the same FAMILY as D9 (a modality-based starting sign, counted
// forward through all 16 parts), but the actual starting signs are
// DIFFERENT from D9's — verified via research rather than assumed:
//   - Movable signs (Aries, Cancer, Libra, Capricorn): count starts
//     from Aries (not "from itself" as in D9).
//   - Fixed signs (Taurus, Leo, Scorpio, Aquarius): count starts from
//     Leo (not "9th from it" as in D9).
//   - Dual signs (Gemini, Virgo, Sagittarius, Pisces): count starts
//     from Sagittarius (not "5th from it" as in D9).
// The occupied part number (1-16) is then counted forward (inclusive,
// wrapping through the zodiac) from that fixed starting sign — i.e.
// every movable sign shares the same Aries start, every fixed sign
// shares the same Leo start, every dual sign shares the same Sagittarius
// start (unlike D9, where the start is relative to the natal sign
// itself).
//
// Sources (agree on the exact Aries/Leo/Sagittarius starting-sign rule,
// citing Brihat Parashara Hora Shastra):
//  - https://jagannathhora.com/shodasamsa-chart-d16-vehicles-comforts/
//    ("For movable signs...the sixteen shodasamsas are counted starting
//    from Aries. For fixed signs...starting from Leo. For dual
//    signs...starting from Sagittarius.")
//  - Search synthesis corroborated by
//    https://vedastrology.blogspot.com/2011/12/divisional-charts-d16-d20.html
//    ("As per Maharishi Parashara in his Brihat Parashara Hora Shastra,
//    in movable signs counting starts from Aries, in fixed sign from
//    Leo and in dual sign from Sagittarius.")
// Note: one low-quality secondary source (astropower.co.in) vaguely
// claimed an odd/even reversal for D16 without specifying any rule or
// example; it did not corroborate against BPHS and was rejected as
// noise in favor of the two sources above, which agree exactly and
// name the source text.
//
// No third-party worked numeric example (with a specific degree and
// resulting sign) was found in research; the test-file cross-checks
// below are therefore hand-computed directly from the confirmed
// modality/starting-sign rule above (documented inline in the test).

/** The sign the Shodasamsa count starts from, for a given natal sign,
 * per the modality rule documented above (movable->Aries, fixed->Leo,
 * dual->Sagittarius — fixed starting signs, NOT relative to the natal
 * sign itself, unlike D9). */
function shodasamsaStartingSign(natalSign: number): number {
  const modality = signModality(natalSign);
  if (modality === 1) return 1; // movable: always start from Aries
  if (modality === 2) return 5; // fixed: always start from Leo
  return 9; // dual: always start from Sagittarius
}

function calculateD16(point: ChartPoint): DivisionalPoint {
  const part = partIndex(point.degree, 16); // 1-16
  const startingSign = shodasamsaStartingSign(point.sign);
  const resultSign = normalizeSign(startingSign + (part - 1));
  return toDivisionalPoint(point, resultSign);
}

// ---------------------------------------------------------------------
// D20 — Vimshamsa
// ---------------------------------------------------------------------
//
// Classical rule (Brihat Parashara Hora Shastra): each 30° sign is
// divided into twenty 1°30' parts ("vimsamsas"). Same structural FAMILY
// as D9/D16 (a modality-based fixed starting sign, counted forward
// through all 20 parts), but again with its OWN distinct starting
// signs, verified via research rather than assumed:
//   - Movable signs (Aries, Cancer, Libra, Capricorn): count starts
//     from Aries.
//   - Fixed signs (Taurus, Leo, Scorpio, Aquarius): count starts from
//     Sagittarius.
//   - Dual signs (Gemini, Virgo, Sagittarius, Pisces): count starts
//     from Leo.
// (Contrast with D16: movable->Aries same, but fixed->Leo/dual->Sagittarius
// there vs. fixed->Sagittarius/dual->Leo here — the fixed/dual starting
// signs are swapped between D16 and D20, confirmed by research, not
// assumed to be identical.)
//
// Sources (agree on the exact Aries/Sagittarius/Leo starting-sign rule,
// citing Brihat Parashara Hora Shastra; the second gives a worked
// numeric example reproduced as a test assertion):
//  - https://jagannathhora.com/vimsamsa-chart-d20-spiritual-progress/
//    ("For movable signs...the twenty vimsamsas are counted starting
//    from Aries. For fixed signs...the count starts from Sagittarius.
//    For dual signs...the count starts from Leo.")
//  - https://www.myzodiaq.in/en/online-library/basics-of-vedic-astrology/divisional-charts/d16-d20-charts
//    ("Movable signs...counting begins from Mesha [Aries]. Fixed
//    signs...counting begins from Dhanu [Sagittarius]. Dual/mutable
//    signs...counting begins from Simha [Leo]." Worked example: "If a
//    planet occupies the ninth Vimsamsha of Vrishabha [Taurus, a fixed
//    sign], counting starts from Dhanu and the planet lands in Simha in
//    the Vimsamsha chart.")

/** The sign the Vimsamsa count starts from, for a given natal sign, per
 * the modality rule documented above (movable->Aries, fixed->Sagittarius,
 * dual->Leo — note this is NOT the same fixed/dual mapping as D16's
 * shodasamsaStartingSign, confirmed via research). */
function vimsamsaStartingSign(natalSign: number): number {
  const modality = signModality(natalSign);
  if (modality === 1) return 1; // movable: always start from Aries
  if (modality === 2) return 9; // fixed: always start from Sagittarius
  return 5; // dual: always start from Leo
}

function calculateD20(point: ChartPoint): DivisionalPoint {
  const part = partIndex(point.degree, 20); // 1-20
  const startingSign = vimsamsaStartingSign(point.sign);
  const resultSign = normalizeSign(startingSign + (part - 1));
  return toDivisionalPoint(point, resultSign);
}

// ---------------------------------------------------------------------
// D24 — Chaturvimshamsa (Siddhamsa)
// ---------------------------------------------------------------------
//
// Classical rule (Brihat Parashara Hora Shastra): each 30° sign is
// divided into twenty-four 1°15' parts ("chaturvimsamsas"/"siddhamsas").
// The STARTING sign for the 24-part count depends on odd/even parity
// (same parity test as D10/D7), but with FIXED starting signs (Leo /
// Cancer — the Sun's and Moon's own signs) rather than an offset
// relative to the natal sign itself — structurally the same family as
// D16/D20's fixed-starting-sign scheme, not D7/D10's relative-offset
// scheme:
//   - Odd signs (Aries, Gemini, Leo, Libra, Sagittarius, Aquarius): the
//     count always starts from Leo.
//   - Even signs (Taurus, Cancer, Virgo, Scorpio, Capricorn, Pisces):
//     the count always starts from Cancer.
//
// Sources (agree on the exact Leo/Cancer starting-sign rule, both
// explicitly citing the "1st chaturvimsamsa of an odd/even sign lands
// in Leo/Cancer itself" case reproduced as a test assertion):
//  - https://jagannathhora.com/chaturvimsamsa-chart-d24-education/ and
//    the search synthesis of https://astrosight.ai/divisional-charts/chaturvimshamsa-chart-education
//    ("For odd signs...the twenty-four chaturvimsamsas are counted
//    starting from Leo. A planet in the first chaturvimsamsa of an odd
//    sign appears in Leo in the D24... For even signs...the count
//    starts from Cancer. A planet in the first chaturvimsamsa of an
//    even sign appears in Cancer in the D24.")
//  - https://vedastrology.blogspot.com/2011/12/divisional-charts-d24-d27.html
//    ("In odd signs counting starts from Leo and in even signs counting
//    starts from Cancer and move in the same order even after
//    completing the first cycle of zodiac.")
// Research note: a third-party numeric example was found in one search
// synthesis ("2° Aries -> 1st chaturvimsamsa -> Leo"), but re-deriving
// it (span = 30/24 = 1.25°; 2° / 1.25° = 1.6, i.e. the 2nd part, not
// the 1st) shows that specific summarized example was arithmetically
// wrong. The starting-sign RULE itself (which the "1st part = the
// starting sign itself" case directly demonstrates) is corroborated
// exactly by both independent sources above, so this repo trusts the
// rule and re-derives its own numeric cross-checks rather than a
// miscomputed third-party number.

/** The sign the Chaturvimsamsa count starts from, for a given natal
 * sign, per the odd/even rule documented above (fixed Leo/Cancer
 * starts, NOT relative to the natal sign — same structural family as
 * D16/D20, different parity test source than D9). */
function chaturvimsamsaStartingSign(natalSign: number): number {
  return isOddSign(natalSign) ? 5 : 4; // odd: always Leo; even: always Cancer
}

function calculateD24(point: ChartPoint): DivisionalPoint {
  const part = partIndex(point.degree, 24); // 1-24
  const startingSign = chaturvimsamsaStartingSign(point.sign);
  const resultSign = normalizeSign(startingSign + (part - 1));
  return toDivisionalPoint(point, resultSign);
}

// ---------------------------------------------------------------------
// D27 — Bhamsa (Nakshatramsa)
// ---------------------------------------------------------------------
//
// Classical rule (Brihat Parashara Hora Shastra): each 30° sign is
// divided into twenty-seven 30/27° (=1°6'40") parts ("bhamsas"/
// "nakshatramsas"). The STARTING sign depends on the natal sign's
// ELEMENT (triplicity), not modality or parity — a fourth distinct
// grouping scheme alongside D9/D16/D20's modality and D7/D10/D24's
// parity:
//   - Fire signs (Aries, Leo, Sagittarius): count starts from Aries.
//   - Earth signs (Taurus, Virgo, Capricorn): count starts from Cancer.
//   - Air signs (Gemini, Libra, Aquarius): count starts from Libra.
//   - Water signs (Cancer, Scorpio, Pisces): count starts from
//     Capricorn.
// (The four starting signs — Aries/Cancer/Libra/Capricorn — are
// themselves the four movable signs, one per element.)
//
// Sources (agree on the exact fire/earth/air/water -> Aries/Cancer/
// Libra/Capricorn starting-sign rule):
//  - https://jagannathhora.com/bhamsa-chart-d27-strength-weakness/
//    ("For fiery signs...counting starts from Aries. For earthly
//    signs...counting starts from Cancer. For airy signs...counting
//    starts from Libra. For watery signs...counting starts from
//    Capricorn.")
//  - https://vedastrology.blogspot.com/2011/12/divisional-charts-d24-d27.html
//    ("For planets/lagna posited in fiery signs counting starts Aries
//    ... Earthy signs count starts from Cancer... Airy signs counting
//    starts from Libra... Watery signs counting starts from
//    Capricorn.")
// No reliable third-party worked numeric example (specific degree ->
// resulting sign) was found; the test-file cross-check is therefore
// the source-confirmed "1st bhamsa of the sign = the starting sign
// itself" case, hand-verified against the span arithmetic.

/** Sign element/triplicity: 0=fire, 1=earth, 2=air, 3=water. Aries(1)
 * is fire, Taurus(2) earth, Gemini(3) air, Cancer(4) water, Leo(5)
 * fire, ... — the standard repeating fire/earth/air/water cycle. */
function signElement(sign: number): 0 | 1 | 2 | 3 {
  return ((sign - 1) % 4) as 0 | 1 | 2 | 3;
}

/** The sign the Bhamsa count starts from, for a given natal sign, per
 * the element rule documented above (fixed Aries/Cancer/Libra/
 * Capricorn starts, NOT relative to the natal sign). */
function bhamsaStartingSign(natalSign: number): number {
  const element = signElement(natalSign);
  if (element === 0) return 1; // fire: Aries
  if (element === 1) return 4; // earth: Cancer
  if (element === 2) return 7; // air: Libra
  return 10; // water: Capricorn
}

function calculateD27(point: ChartPoint): DivisionalPoint {
  const part = partIndex(point.degree, 27); // 1-27
  const startingSign = bhamsaStartingSign(point.sign);
  const resultSign = normalizeSign(startingSign + (part - 1));
  return toDivisionalPoint(point, resultSign);
}

// ---------------------------------------------------------------------
// D30 — Trimshamsa
// ---------------------------------------------------------------------
//
// Classical rule (Brihat Parashara Hora Shastra): UNLIKE every other
// Varga in this file, the Trimshamsa does NOT divide each sign into 30
// (or any number of) EQUAL parts. Instead each 30° sign is divided into
// five UNEQUAL segments, each ruled by one of the five non-luminary
// planets (Mars, Saturn, Jupiter, Mercury, Venus — the Sun and Moon
// hold no Trimshamsa), with the degree-spans AND the sign each segment
// maps to both differing between odd and even signs:
//
//   Odd signs (Aries, Gemini, Leo, Libra, Sagittarius, Aquarius):
//     Mars    0°-5°   -> Aries       (Mars's own odd/"male" sign)
//     Saturn  5°-10°  -> Aquarius    (Saturn's own odd/"male" sign)
//     Jupiter 10°-18° -> Sagittarius (Jupiter's own odd/"male" sign)
//     Mercury 18°-25° -> Gemini      (Mercury's own odd/"male" sign)
//     Venus   25°-30° -> Libra       (Venus's own odd/"male" sign)
//
//   Even signs (Taurus, Cancer, Virgo, Scorpio, Capricorn, Pisces): the
//   order AND the spans both reverse:
//     Venus   0°-5°   -> Taurus      (Venus's own even/"female" sign)
//     Mercury 5°-12°  -> Virgo       (Mercury's own even/"female" sign)
//     Jupiter 12°-20° -> Pisces      (Jupiter's own even/"female" sign)
//     Saturn  20°-25° -> Capricorn   (Saturn's own even/"female" sign)
//     Mars    25°-30° -> Scorpio     (Mars's own even/"female" sign)
//
// i.e. each planet's segment always maps to ONE of that planet's own
// two ruled signs — its odd/"male" sign when the natal sign is odd, its
// even/"female" sign when the natal sign is even.
//
// Sources (agree on the exact spans, planetary order, AND the resulting
// sign for every segment; both give worked numeric examples reproduced
// as test assertions):
//  - https://desiutils.in/astrology/trimsamsa-d30 ("In odd sign the
//    segments are Mars 0-5deg, Saturn 5-10, Jupiter 10-18, Mercury
//    18-25 and Venus 25-30... In an even sign both the quantities and
//    the lordships reverse, so they become Venus 0-5, Mercury 5-12,
//    Jupiter 12-20, Saturn 20-25 and Mars 25-30.")
//  - https://jagannathhora.com/trimsamsa-chart-d30-misfortunes-evils/
//    (identical spans; explicitly gives the resulting SIGN per segment:
//    "0 to 5 -> Mars (placed in Aries or Scorpio)... 5 to 10 -> Saturn
//    (placed in Capricorn or Aquarius)... 10 to 18 -> Jupiter (placed
//    in Sagittarius or Pisces)... 18 to 25 -> Mercury (placed in Gemini
//    or Virgo)... 25 to 30 -> Venus (placed in Taurus or Libra)";
//    worked example: "A planet at 12 deg in Aries (odd sign) falls
//    within Jupiter's segment (10-18deg), mapping to Sagittarius... A
//    planet at 28 deg Taurus (even sign) falls in the final segment
//    (25-30deg)" -> Mars's even segment -> Scorpio.)
// The Sun and Moon are deliberately excluded from Trimshamsa rulership
// by both sources, consistent with BPHS; this repo's calculator has no
// special-case for them because it operates purely on degree-in-sign,
// which is planet-agnostic — the Sun/Moon simply fall into whichever
// segment their degree lands in, like any other point.

type TrimshamsaSegment = { end: number; sign: number };

/** Odd-sign Trimshamsa segments, in ascending degree order: Mars (0-5,
 * Aries), Saturn (5-10, Aquarius), Jupiter (10-18, Sagittarius),
 * Mercury (18-25, Gemini), Venus (25-30, Libra). */
const TRIMSHAMSA_ODD_SEGMENTS: readonly TrimshamsaSegment[] = [
  { end: 5, sign: 1 }, // Mars -> Aries
  { end: 10, sign: 11 }, // Saturn -> Aquarius
  { end: 18, sign: 9 }, // Jupiter -> Sagittarius
  { end: 25, sign: 3 }, // Mercury -> Gemini
  { end: 30, sign: 7 }, // Venus -> Libra
];

/** Even-sign Trimshamsa segments, in ascending degree order: Venus
 * (0-5, Taurus), Mercury (5-12, Virgo), Jupiter (12-20, Pisces), Saturn
 * (20-25, Capricorn), Mars (25-30, Scorpio). */
const TRIMSHAMSA_EVEN_SEGMENTS: readonly TrimshamsaSegment[] = [
  { end: 5, sign: 2 }, // Venus -> Taurus
  { end: 12, sign: 6 }, // Mercury -> Virgo
  { end: 20, sign: 12 }, // Jupiter -> Pisces
  { end: 25, sign: 10 }, // Saturn -> Capricorn
  { end: 30, sign: 8 }, // Mars -> Scorpio
];

function calculateD30(point: ChartPoint): DivisionalPoint {
  const segments = isOddSign(point.sign) ? TRIMSHAMSA_ODD_SEGMENTS : TRIMSHAMSA_EVEN_SEGMENTS;
  // Segments are listed in ascending `end` order, so the first one
  // whose upper bound exceeds the degree-in-sign is the occupied
  // segment (mirrors partIndex()'s exclusive-upper-bound convention).
  // The `?? segments.at(-1)` guard only matters for the exact-30.0 (or
  // floating-point-nudged-past-30) edge case, same as partIndex().
  const segment = segments.find((s) => point.degree < s.end) ?? segments[segments.length - 1];
  return toDivisionalPoint(point, segment.sign);
}

// ---------------------------------------------------------------------
// D40 — Khavedamsa
// ---------------------------------------------------------------------
//
// Classical rule (Brihat Parashara Hora Shastra): each 30° sign is
// divided into forty 45' parts ("khavedamsas"). The STARTING sign
// depends on odd/even parity, with FIXED starting signs (Aries / Libra
// — the two equinoctial signs) rather than an offset relative to the
// natal sign — same structural family as D24 above:
//   - Odd signs (Aries, Gemini, Leo, Libra, Sagittarius, Aquarius): the
//     count always starts from Aries.
//   - Even signs (Taurus, Cancer, Virgo, Scorpio, Capricorn, Pisces):
//     the count always starts from Libra.
//
// Sources (agree on the exact Aries/Libra starting-sign rule):
//  - https://jagannathhora.com/khavedamsa-chart-d40-maternal-lineage/
//    ("For odd signs...the forty khavedamsas are counted starting from
//    Aries. For even signs...the count starts from Libra, and a planet
//    in the first khavedamsa of an even sign appears in Libra in the
//    D40.")
//  - https://vedastrology.blogspot.com/2011/12/divisional-charts-d40-d45.html
//    ("For odd signs counting starts from Aries and for even signs
//    counting starts from Libra.")
// No reliable third-party worked numeric example beyond the "1st part
// of an even sign -> Libra itself" case (source-confirmed above,
// reproduced as a test assertion) was found; further cross-checks are
// hand-derived from the confirmed rule.

/** The sign the Khavedamsa count starts from, for a given natal sign,
 * per the odd/even rule documented above (fixed Aries/Libra starts). */
function khavedamsaStartingSign(natalSign: number): number {
  return isOddSign(natalSign) ? 1 : 7; // odd: always Aries; even: always Libra
}

function calculateD40(point: ChartPoint): DivisionalPoint {
  const part = partIndex(point.degree, 40); // 1-40
  const startingSign = khavedamsaStartingSign(point.sign);
  const resultSign = normalizeSign(startingSign + (part - 1));
  return toDivisionalPoint(point, resultSign);
}

// ---------------------------------------------------------------------
// D45 — Akshavedamsa
// ---------------------------------------------------------------------
//
// Classical rule (Brihat Parashara Hora Shastra): each 30° sign is
// divided into forty-five 40' parts ("akshavedamsas"). The STARTING
// sign depends on modality, using the SAME fixed Aries/Leo/Sagittarius
// starting signs as D16's shodasamsaStartingSign (confirmed via
// research to be identical, not assumed):
//   - Movable signs (Aries, Cancer, Libra, Capricorn): count starts
//     from Aries.
//   - Fixed signs (Taurus, Leo, Scorpio, Aquarius): count starts from
//     Leo.
//   - Dual signs (Gemini, Virgo, Sagittarius, Pisces): count starts
//     from Sagittarius.
//
// Sources (agree on the exact Aries/Leo/Sagittarius starting-sign
// rule):
//  - https://jagannathhora.com/akshavedamsa-chart-d45-paternal-lineage/
//    ("Akshavedamsa of the signs commences with Aries in movable sign,
//    Leo in a fixed sign, and Sagittarius in dual signs.")
//  - https://vedastrology.blogspot.com/2011/12/divisional-charts-d40-d45.html
//    ("For movable signs counting starts from Aries for fixed signs
//    counting starts from Leo and for dual signs counting starts from
//    Sagittarius.")
// Research note: a third-party numeric worked example was found (in
// one search synthesis, for 2°15' Taurus), but it used a 45'-wide part
// span (D40's width) rather than D45's actual 40' width, making its
// specific numeric result unreliable; the starting-sign RULE itself is
// corroborated exactly by both independent sources above (and matches
// D16's own modality starting-sign scheme exactly), so this repo trusts
// the rule and computes its own correctly-spanned numeric cross-checks
// rather than reuse the miscomputed third-party number.

function calculateD45(point: ChartPoint): DivisionalPoint {
  const part = partIndex(point.degree, 45); // 1-45
  const startingSign = shodasamsaStartingSign(point.sign); // same Aries/Leo/Sagittarius modality scheme as D16
  const resultSign = normalizeSign(startingSign + (part - 1));
  return toDivisionalPoint(point, resultSign);
}

// ---------------------------------------------------------------------
// D60 — Shashtiamsa
// ---------------------------------------------------------------------
//
// Classical rule (Brihat Parashara Hora Shastra — the Varga to which
// BPHS gives the single greatest weight of all divisional charts in its
// Vimsopaka Bala scheme): each 30° sign is divided into sixty 30' parts
// ("shashtiamsas"). The STARTING sign depends on odd/even parity, using
// the SAME relative-offset structure as D7/D10 (not a fixed start like
// D16/D20/D24/D40/D45):
//   - Odd signs (Aries, Gemini, Leo, Libra, Sagittarius, Aquarius): the
//     count starts from the sign itself (offset +0).
//   - Even signs (Taurus, Cancer, Virgo, Scorpio, Capricorn, Pisces):
//     the count starts from the 7th sign from it, counted inclusively
//     (offset +6) — identical parity/offset structure to D7's
//     saptamsaStartingSign, just with 60 parts cycling through the 12
//     signs five times instead of 7 parts cycling less than once.
//
// Research note on a genuine cross-source disagreement: some secondary
// syntheses describe D60 even signs as counting "from the sign itself
// but in reverse order" instead of "from the 7th sign forward". Tracing
// this claim to its context (search results built from
// https://en.wikipedia.org/wiki/Shashtyamsha-adjacent commentary and
// forum threads discussing BPHS's Krura/Saumya classification) shows it
// consistently refers to the REVERSAL OF THE 60 DEITY NAMES' cycling
// order for even signs (and the reversal of which of the 60 named parts
// are malefic vs. benefic), not to the resulting SIGN mapping — a
// different mechanism from the one this calculator implements (sign
// only, not deity names; see the module-level DivisionalPoint doc for
// why deity names are out of scope for this engine). The specific
// SIGN-mapping rule implemented here (7th-sign start for even signs)
// comes from a source that also supplies a verifiable worked numeric
// example (reproduced as a test assertion below and independently
// re-derived from the raw span arithmetic to confirm it), which the
// deity-name-reversal sources do not attempt to contradict or provide
// an alternative for — so this repo treats the sign-mapping rule below
// as settled and documents the deity-name assignment (Ghora, Amrita,
// Deva, etc., and their Krura/Saumya classification) as an out-of-scope
// gap, per this task's instructions.
//
// Sources:
//  - https://jagannathhora.com/shashtiamsa-chart-d60-past-life-karma/
//    ("the sixty shashtiamsa are counted starting from the sign
//    itself [for odd signs]... the count starts from the 7th sign from
//    the occupied sign [for even signs]"; worked examples: "planet at
//    0°45' Aries (an odd sign): this falls in the second shashtiamsa
//    (0°30' to 1°00'); counting from Aries itself: Aries (1st), Taurus
//    (2nd) -> Taurus in D60." "planet at 0°15' Taurus (an even sign):
//    this falls in the first shashtiamsa (0°00' to 0°30'); the 7th sign
//    from Taurus is Scorpio; counting starts there -> Scorpio in D60.")
//  - Deity-name/Krura-Saumya reversal cross-referenced via search
//    synthesis of https://en.wikipedia.org/wiki/Shashtyamsha and
//    forum commentary at
//    https://phpbb.lightonvedicastrology.com/viewtopic.php?t=2273 (a
//    different mechanism from the sign-mapping rule above, as explained
//    in the research note; deity names/Krura-Saumya are NOT implemented
//    by this calculator — documented gap, not an oversight).
//  - General BPHS-derived arithmetic formula corroborating the same
//    12-sign-cyclical structure, via search synthesis of
//    https://www.jyotishgher.in/calculator/deity/d60-deity-calculator.php:
//    "take the degrees the planet traversed in its sign, multiply that
//    figure by 2 and divide by 12... which will indicate the sign in
//    which the Shashtiamsa falls" — consistent with this calculator's
//    part-index-mod-12 behavior (60 parts / 12 signs = 5 full cycles).

/** The sign the Shashtiamsa count starts from, for a given natal sign,
 * per the odd/even rule documented above (same parity test and 7th-sign
 * offset as D7's saptamsaStartingSign, just applied to 60 parts instead
 * of 7). */
function shashtiamsaStartingSign(natalSign: number): number {
  if (isOddSign(natalSign)) return natalSign; // odd: start from itself
  return normalizeSign(natalSign + 6); // even: 7th from it (inclusive count => +6)
}

function calculateD60(point: ChartPoint): DivisionalPoint {
  const part = partIndex(point.degree, 60); // 1-60
  const startingSign = shashtiamsaStartingSign(point.sign);
  const resultSign = normalizeSign(startingSign + (part - 1));
  return toDivisionalPoint(point, resultSign);
}

// ---------------------------------------------------------------------
// D60 — Shashtiamsa deity/quality names (Ghora, Rakshasa, Deva, ...)
// ---------------------------------------------------------------------
//
// Gap closed: `calculateD60` above only ever produced a SIGN (like every
// other Varga's `DivisionalPoint`). Classically, though, each of the 60
// Shashtiamsa parts also carries its own named deity/quality (Ghora,
// Rakshasa, Deva, Kubera, ...), traditionally used for a finer-grained
// benefic/malefic reading than the sign alone gives. That naming layer
// is implemented here as a SEPARATE, D60-specific lookup —
// `shashtiamsaDeity()` — rather than by changing `DivisionalPoint` or
// `DivisionalChartResult`'s shape. Reasons for that choice:
//   - `DivisionalPoint`/`DivisionalChartResult` are generic across all
//     16 implemented Vargas; only D60 has a named-deity layer at all, so
//     adding an optional `deity`-shaped field to the shared type would
//     either be meaningless dead weight on D1-D45's results or require
//     a D60-only special case inside the generic `calculateDivisionalChart`
//     entry point — both worse than one small additive export.
//   - `calculateDivisionalChart(60, chart)` / `calculateD60(point)`'s
//     existing signature and return shape are exactly what other code in
//     this repo already calls; this task's instructions are explicit
//     that those must not change. A caller that wants deity names simply
//     calls `shashtiamsaDeity(point)` alongside `calculateD60(point)` on
//     the same `ChartPoint` — additive, opt-in, zero risk to existing
//     callers.
//
// ---- Research: the 60 names, and the odd/even question -------------
//
// Confidence level: MEDIUM-HIGH on the name sequence itself, HIGH on the
// odd/even mechanism. Spelling of Sanskrit names varies across sources
// (transliteration, not substance) at roughly 5 of the 60 positions
// (noted inline below); no source disagreement was found on the ORDER
// or COUNT (all give exactly 60, with the same names recurring at the
// same positions — e.g. "Ghora" at 1 and 34, "Kaala" at 15/32/44,
// "Deva" at 3/25, "Amrita" at 17/38/57, "Komala" at 20/46, "Soumya" at
// 45/54 — this internal repetition pattern matching across independently
// scraped sources is itself corroborating evidence the sequence is
// correctly ordered, not shuffled).
//
// Sources consulted (4 independent sites; the first two give a full
// 1-60 numbered list, the last two give the odd/even mechanism):
//  - https://jothishi.com/shashtiamsa-d60-amsa-rulers/ (full 1-60 list;
//    used as this module's primary spelling/ordering source, since it
//    gives the most complete Sanskrit transliteration of all 60 names
//    with no gaps).
//  - https://www.rahasyavedicastrology.com/d60-shastiamsa-devata/ (full
//    1-60 list; matches jothishi's list exactly for positions 1-30 and
//    all but ~5 positions in 31-60, where the divergence is a spelling/
//    synonym variant of the same meaning, e.g. "Indumukh" vs
//    "Chandramukhi" [both "moon-faced"], "Kalagni" vs "Kaalapavaka"
//    [both "time's fire"], "Sudha" vs "Amrita" [both "nectar"] — not a
//    structural disagreement).
//  - https://www.trendingastro.com/Home/Shashtyamsa (states explicitly:
//    "In the case of an even sign it is necessary... the Shastyamsa
//    portions stated Krura in the odd signs are the Saumya ones in the
//    even signs and vice versa" — i.e. the deity-name reading for even
//    signs is a REVERSAL, not a re-run of the same forward sequence).
//  - https://www.jyotishgher.in/calculator/deity/d60-deity-calculator.php
//    (gives the precise, quotable mechanism: "As per Parashara, even
//    signs have reverse order... Even Sign Deity = 61 - Odd Index" —
//    i.e. for an even natal sign, the deity at raw part-index P is the
//    name that would sit at position (61 - P) in the odd-sign forward
//    list, not the name at position P itself).
//
// IMPORTANT — this is a DIFFERENT odd/even mechanism than `calculateD60`'s
// own sign-mapping odd/even branch above, and applying BOTH is correct,
// not double-counting: `calculateD60`'s odd/even branch decides which
// RESULT SIGN a part maps to (7th-sign offset for even signs); this
// section's odd/even reversal decides which NAME from the fixed 60-name
// list applies to a given raw part-index. They are independent axes
// operating on the same (sign, part-index) input, confirmed by the
// jyotishgher/trendingastro sources describing the name-reversal
// mechanism separately from (and without reference to) the sign-mapping
// rule — so `shashtiamsaDeity()` re-derives its own odd/even branch
// below rather than reusing/depending on `calculateD60`'s.
//
// Benefic/malefic classification: DELIBERATELY OMITTED. A per-name
// Krura(malefic)/Saumya(benefic) classification was searched for, but
// the scraped tables disagreed with each other on individual names too
// often to trust (e.g. one source tags "Yaksha" benefic, another tags
// the same name "medium"; one tags "Vishnu" benefic, another tags it
// "medium") — this is the kind of low-quality-source noise this task's
// instructions say to reject rather than guess through. What IS solidly
// sourced (the trendingastro/jyotishgher quotes above) is that the
// benefic/malefic *quality* of a name flips between odd and even signs
// for the SAME name — but a reliable base classification to flip did
// not clear this module's confidence bar, so no `nature` field is
// exposed. A future pass could add one if a source giving a single,
// internally-consistent 60-entry benefic/malefic table is found.

/** The 60 Shashtiamsa deity/quality names, in their odd-sign forward
 * order (index 0 = part 1 = "Ghora", ... index 59 = part 60 =
 * "Chandrarekha"). Spelling follows jothishi.com; positions 48, 49, 51,
 * 52, and 59 have a documented synonym/transliteration variant in
 * rahasyavedicastrology.com's independent list (see research note
 * above) but no source disputes the ORDER or MEANING at those
 * positions. NOT exported as the primary API — use `shashtiamsaDeity()`,
 * which also applies the even-sign reversal; this array by itself is
 * only correct for odd signs.
 */
const SHASHTIAMSA_NAMES: readonly string[] = [
  "Ghora", "Rakshasa", "Deva", "Kubera", "Yaksha", "Kinnara", "Bhrashta", "Kulaghna", "Garala", "Vahni",
  "Maya", "Purishaka", "Apampati", "Marut", "Kaala", "Sarpa", "Amrita", "Indu", "Mridu", "Komala",
  "Heramba", "Brahma", "Vishnu", "Maheshwara", "Deva", "Ardra", "Kalinasa", "Kshiteesa", "Kamalakara", "Gulika",
  "Mrityu", "Kaala", "Davagni", "Ghora", "Yama", "Kantaka", "Sudha", "Amrita", "Purnachandra", "Vishadagdha",
  "Kulanasa", "Vamshakshaya", "Utpata", "Kaala", "Saumya", "Komala", "Sheetala", "Karaladamshtra", "Chandramukhi", "Praveena",
  "Kaalapavaka", "Dandayudha", "Nirmala", "Saumya", "Krura", "Atisheetala", "Amrita", "Payodhi", "Brahmana", "Chandrarekha",
];

export type ShashtiamsaDeity = {
  /** 1-60, the raw Shashtiamsa part index (see internal `partIndex()`);
   * NOT re-mapped for even signs — the even-sign reversal only affects
   * which `name` this part index resolves to, not this field. */
  part: number;
  /** English transliteration of the traditional Sanskrit deity/quality
   * name for this part (see module-level research note for sourcing and
   * confidence). */
  name: string;
};

/**
 * Looks up the classical Shashtiamsa (D60) deity/quality name for a
 * natal `ChartPoint`, independent of (and meant to be used alongside)
 * `calculateD60(point)` / `calculateDivisionalChart(60, chart)`'s own
 * sign-mapping result. See the module-level research note above for why
 * this is a separate function, the odd/even reversal mechanism, and why
 * no benefic/malefic `nature` is included.
 */
function shashtiamsaDeity(point: ChartPoint): ShashtiamsaDeity {
  const part = partIndex(point.degree, 60); // 1-60, raw (not sign-adjusted)
  // Odd signs: the name at `part` is used directly. Even signs: the
  // fixed 60-name list is read in reverse (name index = 61 - part) —
  // see the jyotishgher/trendingastro sources above.
  const nameIndex = isOddSign(point.sign) ? part : 61 - part;
  const name = SHASHTIAMSA_NAMES[nameIndex - 1];
  return { part, name };
}

// ---------------------------------------------------------------------
// Registry — varga number -> calculator. D1/D2/D3/D4/D7/D9/D10/D12/D16/
// D20/D24/D27/D30/D40/D45/D60 are implemented as of this pass. Adding a
// further Varga means researching its own classical rule and adding one
// more entry here, with no changes to the calculators already
// registered.
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
  16: calculateD16,
  20: calculateD20,
  24: calculateD24,
  27: calculateD27,
  30: calculateD30,
  40: calculateD40,
  45: calculateD45,
  60: calculateD60,
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
export {
  calculateD1,
  calculateD2,
  calculateD3,
  calculateD4,
  calculateD7,
  calculateD9,
  calculateD10,
  calculateD12,
  calculateD16,
  calculateD20,
  calculateD24,
  calculateD27,
  calculateD30,
  calculateD40,
  calculateD45,
  calculateD60,
  shashtiamsaDeity,
};
