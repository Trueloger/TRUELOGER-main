// src/lib/astro-engine/divisional.test.ts
// Plain node:assert/strict script, matching this repo's engine-test
// convention (see src/lib/ashtakoot/calculate.test.ts and
// src/lib/astro-engine/isolation.test.ts) — run directly via
// `node src/lib/astro-engine/divisional.test.ts`.
import assert from "node:assert/strict";
import {
  calculateD1,
  calculateD2,
  calculateD3,
  calculateD4,
  calculateD7,
  calculateD9,
  calculateD10,
  calculateD12,
  calculateDivisionalChart,
  IMPLEMENTED_VARGAS,
  type DivisionalChartResult,
} from "./divisional.ts";
import { calculateChart, type ChartData, type ChartPoint } from "./ephemeris.ts";

function point(sign: number, degree: number): ChartPoint {
  const longitude = (sign - 1) * 30 + degree;
  return { longitude, sign, degree };
}

// ---------------------------------------------------------------------
// D1 — trivial passthrough
// ---------------------------------------------------------------------

for (let sign = 1; sign <= 12; sign++) {
  const p = point(sign, 12.34);
  const d1 = calculateD1(p);
  assert.strictEqual(d1.sign, sign, "D1 sign must equal the natal sign");
  assert.strictEqual(d1.degreeInVarga, 12.34, "D1 degreeInVarga must equal the natal degree");
}

// ---------------------------------------------------------------------
// D9 — Navamsa: cross-check against a hand-computed research example
// ---------------------------------------------------------------------
// Source: https://www.tempora.ltd/findings/navamsa-d9-chart
// "A planet at Aries 18°15': (18*60+15)=1095 arc-minutes / 200 = 5.475,
// rounds up to the 6th arc; Aries is movable, so count from Aries:
// Aries(1st), Taurus(2nd), Gemini(3rd), Cancer(4th), Leo(5th),
// Virgo(6th) -> Result: Virgo Navamsa."
{
  const ariesEighteenFifteen = point(1, 18 + 15 / 60);
  const d9 = calculateD9(ariesEighteenFifteen);
  assert.strictEqual(d9.sign, 6, "D9 of Aries 18°15' must be Virgo (sign 6), per tempora.ltd worked example");
}

// Second research example: https://steer.coach/navamsa-d9-chart/
// "Venus at 4° Libra falls in slice 2. Libra is movable, so counting
// begins at Libra (1st) -> Scorpio (2nd). Thus Venus occupies Scorpio
// in the navamsa."
{
  const libraFour = point(7, 4);
  const d9 = calculateD9(libraFour);
  assert.strictEqual(d9.sign, 8, "D9 of Libra 4° must be Scorpio (sign 8), per steer.coach worked example");
}

// A fixed-sign example, confirming the "9th sign from it" starting
// rule (not just the movable case above): Taurus is fixed; its 1st
// Navamsa part starts counting from the 9th sign from Taurus =
// Capricorn (Taurus=2 -> +8 -> 10=Capricorn).
{
  const taurusZero = point(2, 0); // exactly 0 deg in sign -> part 1
  const d9 = calculateD9(taurusZero);
  assert.strictEqual(d9.sign, 10, "D9 of Taurus 0° (fixed sign, part 1) must start from Capricorn");
}

// A dual-sign example: Gemini is dual; its 1st Navamsa part starts
// counting from the 5th sign from Gemini = Libra (Gemini=3 -> +4 -> 7=Libra).
{
  const geminiZero = point(3, 0);
  const d9 = calculateD9(geminiZero);
  assert.strictEqual(d9.sign, 7, "D9 of Gemini 0° (dual sign, part 1) must start from Libra");
}

// ---------------------------------------------------------------------
// D2 — Hora: cross-check against hand-computed research examples
// ---------------------------------------------------------------------
// Source: https://desiutils.in/astrology/hora-d2
// "Gemini 18° (an odd sign): 18° falls in the Moon's hora range
// (15-30°) -> Cancer."
{
  const geminiEighteen = point(3, 18);
  const d2 = calculateD2(geminiEighteen);
  assert.strictEqual(d2.sign, 4, "D2 of Gemini 18 deg (odd sign, 2nd half) must be Cancer (sign 4), per desiutils.in worked example");
}

// "Taurus 8° (an even sign): 8° falls in the Moon's hora range
// (0-15°) -> Cancer."
{
  const taurusEight = point(2, 8);
  const d2 = calculateD2(taurusEight);
  assert.strictEqual(d2.sign, 4, "D2 of Taurus 8 deg (even sign, 1st half) must be Cancer (sign 4), per desiutils.in worked example");
}

// Second research example, confirming the Sun's Hora / Leo side too:
// https://desiutils.in and https://astroavastha.com/blog/hora-d2-chart/
// both give: Jupiter at 17 deg Aries (odd sign) falls in the 2nd half
// (15-30 deg) -> Moon's Hora -> Cancer.
{
  const ariesSeventeen = point(1, 17);
  const d2 = calculateD2(ariesSeventeen);
  assert.strictEqual(d2.sign, 4, "D2 of Aries 17 deg (odd sign, 2nd half) must be Cancer (sign 4), per research worked example");
}

// An odd sign, 1st half -> Sun's Hora -> Leo.
{
  const ariesFive = point(1, 5);
  const d2 = calculateD2(ariesFive);
  assert.strictEqual(d2.sign, 5, "D2 of Aries 5 deg (odd sign, 1st half) must be Leo (sign 5), per the odd-sign rule");
}

// An even sign, 2nd half -> Sun's Hora -> Leo.
{
  const taurusTwentyFive = point(2, 25);
  const d2 = calculateD2(taurusTwentyFive);
  assert.strictEqual(d2.sign, 5, "D2 of Taurus 25 deg (even sign, 2nd half) must be Leo (sign 5), per the even-sign rule");
}

// Boundary sensitivity for D2: the 15deg midpoint of a sign flips the
// Hora (and hence the resulting D2 sign) for both odd and even signs.
{
  const ariesJustBelow = calculateD2(point(1, 14.99)); // odd sign, 1st half -> Leo
  const ariesJustAbove = calculateD2(point(1, 15)); // odd sign, 2nd half -> Cancer
  assert.notStrictEqual(ariesJustBelow.sign, ariesJustAbove.sign, "D2 boundary sensitivity failed across the 15 deg midpoint of an odd sign");

  const taurusJustBelow = calculateD2(point(2, 14.99)); // even sign, 1st half -> Cancer
  const taurusJustAbove = calculateD2(point(2, 15)); // even sign, 2nd half -> Leo
  assert.notStrictEqual(taurusJustBelow.sign, taurusJustAbove.sign, "D2 boundary sensitivity failed across the 15 deg midpoint of an even sign");
}

// Full sweep: every sign/degree combination must land in Cancer or Leo
// only (D2's structural difference from every other varga here).
for (let sign = 1; sign <= 12; sign++) {
  for (const degree of [0, 3.33, 7.5, 12.5, 14.99, 15, 19.99, 22.5, 27.99, 29.999]) {
    const d2 = calculateD2(point(sign, degree));
    assert.ok(d2.sign === 4 || d2.sign === 5, `D2 at sign ${sign}, degree ${degree}: expected Cancer(4) or Leo(5), got ${d2.sign}`);
  }
}

// ---------------------------------------------------------------------
// D3 — Drekkana: cross-check against hand-computed research examples
// ---------------------------------------------------------------------
// Source: https://desiutils.in/astrology/drekkana-d3
// "Part 2 (10-20 deg Taurus) -> maps to Virgo (5th sign from Taurus)...
// a planet at 15 deg Taurus... relocates to Virgo in the D3 chart."
{
  const taurusFifteen = point(2, 15);
  const d3 = calculateD3(taurusFifteen);
  assert.strictEqual(d3.sign, 6, "D3 of Taurus 15 deg (2nd part) must be Virgo (sign 6), per desiutils.in worked example");
}

// Second research example: https://astroavastha.com/blog/dreshkana-d3-chart/
// and https://jagannathhora.com/drekkana-chart-d3-siblings-courage/
// "4 deg Aries -> 1st drekkana -> Aries; 14 deg Aries -> 2nd drekkana
// -> Leo (5th from Aries); 24 deg Aries -> 3rd drekkana -> Sagittarius
// (9th from Aries)."
{
  assert.strictEqual(calculateD3(point(1, 4)).sign, 1, "D3 of Aries 4 deg (1st part) must be Aries (sign 1)");
  assert.strictEqual(calculateD3(point(1, 14)).sign, 5, "D3 of Aries 14 deg (2nd part) must be Leo (sign 5)");
  assert.strictEqual(calculateD3(point(1, 24)).sign, 9, "D3 of Aries 24 deg (3rd part) must be Sagittarius (sign 9)");
}

// Boundary sensitivity: the 10deg and 20deg part boundaries flip the
// resulting sign.
{
  const p1 = calculateD3(point(1, 9.99)); // 1st part -> Aries
  const p2 = calculateD3(point(1, 10)); // 2nd part -> Leo
  assert.notStrictEqual(p1.sign, p2.sign, "D3 boundary sensitivity failed across the 10 deg part boundary");

  const p2end = calculateD3(point(1, 19.99)); // 2nd part -> Leo
  const p3 = calculateD3(point(1, 20)); // 3rd part -> Sagittarius
  assert.notStrictEqual(p2end.sign, p3.sign, "D3 boundary sensitivity failed across the 20 deg part boundary");
}

// Full 12-sign sweep: every longitude maps to a valid 1-12 sign.
for (let sign = 1; sign <= 12; sign++) {
  for (const degree of [0, 3.33, 7.5, 9.99, 10, 15, 19.99, 20, 25, 29.999]) {
    const d3 = calculateD3(point(sign, degree));
    assert.ok(
      Number.isInteger(d3.sign) && d3.sign >= 1 && d3.sign <= 12,
      `D3 at sign ${sign}, degree ${degree}: sign ${d3.sign} out of 1-12 range`
    );
  }
}

// ---------------------------------------------------------------------
// D4 — Chaturthamsa: cross-check against hand-computed research examples
// ---------------------------------------------------------------------
// Source: https://desiutils.in/astrology/chaturthamsa-d4
// "A planet positioned at 8 degrees of Aries falls within the second
// quarter (7.5-15 deg)... the 4th sign from Aries is Cancer... this
// planet's D4 placement is Cancer."
{
  const ariesEight = point(1, 8);
  const d4 = calculateD4(ariesEight);
  assert.strictEqual(d4.sign, 4, "D4 of Aries 8 deg (2nd quarter) must be Cancer (sign 4), per desiutils.in worked example");
}

// Second research example: https://astroavastha.com/blog/chathurthamasha-chart-d4/
// "a planet in the third part of Aries appears in Libra (7th from
// Aries)... fourth part of Aries appears in Capricorn (10th from
// Aries)."
{
  assert.strictEqual(calculateD4(point(1, 18)).sign, 7, "D4 of Aries 18 deg (3rd quarter) must be Libra (sign 7)");
  assert.strictEqual(calculateD4(point(1, 25)).sign, 10, "D4 of Aries 25 deg (4th quarter) must be Capricorn (sign 10)");
  assert.strictEqual(calculateD4(point(1, 3)).sign, 1, "D4 of Aries 3 deg (1st quarter) must be Aries (sign 1)");
}

// Boundary sensitivity: the 7.5/15/22.5 deg quarter boundaries flip
// the resulting sign.
{
  assert.notStrictEqual(calculateD4(point(1, 7.49)).sign, calculateD4(point(1, 7.5)).sign, "D4 boundary sensitivity failed across the 7.5 deg quarter boundary");
  assert.notStrictEqual(calculateD4(point(1, 14.99)).sign, calculateD4(point(1, 15)).sign, "D4 boundary sensitivity failed across the 15 deg quarter boundary");
  assert.notStrictEqual(calculateD4(point(1, 22.49)).sign, calculateD4(point(1, 22.5)).sign, "D4 boundary sensitivity failed across the 22.5 deg quarter boundary");
}

// Full 12-sign sweep: every longitude maps to a valid 1-12 sign.
for (let sign = 1; sign <= 12; sign++) {
  for (const degree of [0, 3.33, 7.49, 7.5, 14.99, 15, 22.49, 22.5, 27, 29.999]) {
    const d4 = calculateD4(point(sign, degree));
    assert.ok(
      Number.isInteger(d4.sign) && d4.sign >= 1 && d4.sign <= 12,
      `D4 at sign ${sign}, degree ${degree}: sign ${d4.sign} out of 1-12 range`
    );
  }
}

// ---------------------------------------------------------------------
// D7 — Saptamsa: cross-check against hand-computed research examples
// ---------------------------------------------------------------------
// Source: https://desiutils.in/astrology/saptamsa-d7
// "a planet at 10 deg in Aries (odd)... falls in the third division...
// maps to Gemini... lands in Gemini in the D7 chart."
{
  const ariesTen = point(1, 10);
  const d7 = calculateD7(ariesTen);
  assert.strictEqual(d7.sign, 3, "D7 of Aries 10 deg (odd sign, 3rd part) must be Gemini (sign 3), per desiutils.in worked example");
}

// Second research example (even-sign starting rule), corroborated by
// myzodiaq.in and sksastro.blogspot.com:
// "A planet in the first saptamsa of Taurus (an even sign, 0-4.29 deg)
// appears in Scorpio in the D7 [7th from Taurus]... the seventh
// saptamsa...appears in Taurus itself."
{
  const taurusZero = point(2, 0);
  const d7First = calculateD7(taurusZero);
  assert.strictEqual(d7First.sign, 8, "D7 of Taurus 0 deg (even sign, 1st part) must be Scorpio (sign 8), the 7th sign from Taurus");

  const taurusLast = point(2, 26); // 7th part (25.714-30 deg range)
  const d7Last = calculateD7(taurusLast);
  assert.strictEqual(d7Last.sign, 2, "D7 of Taurus 26 deg (even sign, 7th part) must be Taurus itself (sign 2)");
}

// Boundary sensitivity: the 1st/7th part boundary (30/7 deg) flips the
// resulting sign.
{
  const span = 30 / 7;
  const justBelow = calculateD7(point(1, span - 0.01));
  const justAbove = calculateD7(point(1, span));
  assert.notStrictEqual(justBelow.sign, justAbove.sign, "D7 boundary sensitivity failed across the first 30/7 deg part boundary");
}

// Full 12-sign sweep: every longitude maps to a valid 1-12 sign.
for (let sign = 1; sign <= 12; sign++) {
  for (const degree of [0, 3.33, 30 / 7 - 0.01, 30 / 7, 12.5, 17.5, 22.5, 25.714, 29.999]) {
    const d7 = calculateD7(point(sign, degree));
    assert.ok(
      Number.isInteger(d7.sign) && d7.sign >= 1 && d7.sign <= 12,
      `D7 at sign ${sign}, degree ${degree}: sign ${d7.sign} out of 1-12 range`
    );
  }
}

// ---------------------------------------------------------------------
// D12 — Dwadashamsa: cross-check against hand-computed research examples
// ---------------------------------------------------------------------
// Source: https://desiutils.in/astrology/dwadasamsa-d12
// "second dwadasamsa (2 deg 30'-5 deg) is ruled by the 2nd sign from
// it. A planet in the second part of Aries appears in Taurus in the
// D12."
{
  const ariesFour = point(1, 4); // 2deg30'-5deg range -> 2nd part
  const d12 = calculateD12(ariesFour);
  assert.strictEqual(d12.sign, 2, "D12 of Aries 4 deg (2nd part) must be Taurus (sign 2), per desiutils.in worked example");
}

// Second research example: https://jagannathhora.com/dwadasamsa-chart-d12-parents-ancestry/
// "A planet at 8 deg Aries... falls in the fourth dwadasamsa... Cancer
// in D12 (the 4th sign from Aries)"; "A planet at 25 deg Aries... falls
// in the eleventh dwadasamsa... Aquarius in D12 (the 11th sign from
// Aries)."
{
  assert.strictEqual(calculateD12(point(1, 8)).sign, 4, "D12 of Aries 8 deg (4th part) must be Cancer (sign 4)");
  assert.strictEqual(calculateD12(point(1, 25)).sign, 11, "D12 of Aries 25 deg (11th part) must be Aquarius (sign 11)");
  assert.strictEqual(calculateD12(point(1, 2)).sign, 1, "D12 of Aries 2 deg (1st part) must be Aries itself (sign 1)");
}

// Boundary sensitivity: the 2.5 deg part boundary flips the resulting
// sign.
{
  const justBelow = calculateD12(point(1, 2.49));
  const justAbove = calculateD12(point(1, 2.5));
  assert.notStrictEqual(justBelow.sign, justAbove.sign, "D12 boundary sensitivity failed across the 2.5 deg part boundary");
}

// Full 12-sign sweep: every longitude maps to a valid 1-12 sign.
for (let sign = 1; sign <= 12; sign++) {
  for (const degree of [0, 2.49, 2.5, 7.5, 12.5, 17.5, 22.5, 27.49, 27.5, 29.999]) {
    const d12 = calculateD12(point(sign, degree));
    assert.ok(
      Number.isInteger(d12.sign) && d12.sign >= 1 && d12.sign <= 12,
      `D12 at sign ${sign}, degree ${degree}: sign ${d12.sign} out of 1-12 range`
    );
  }
}

// ---------------------------------------------------------------------
// D10 — Dashamsa: cross-check against hand-computed research examples
// ---------------------------------------------------------------------
// Source (synthesized from vedicmarga.com/d10-calculator, corroborated
// by asksoma.ai/dashamsha-calculator and desiutils.in/astrology/dasamsa-d10),
// citing Brihat Parashara Hora Shastra:
// "Moon at 5°10' Aries falls in the second part; Aries is odd, so
// count two from Aries itself, and the Moon lands in Taurus in the
// D10."
{
  const ariesFiveTen = point(1, 5 + 10 / 60);
  const d10 = calculateD10(ariesFiveTen);
  assert.strictEqual(d10.sign, 2, "D10 of Aries 5°10' must be Taurus (sign 2), per the researched worked example");
}

// "Sun at 17°30' Taurus falls in the sixth part; Taurus is even, so
// count six starting from Capricorn, the ninth from Taurus, and the
// Sun lands in Gemini in the D10."
{
  const taurusSeventeenThirty = point(2, 17.5);
  const d10 = calculateD10(taurusSeventeenThirty);
  assert.strictEqual(d10.sign, 3, "D10 of Taurus 17°30' must be Gemini (sign 3), per the researched worked example");
}

// ---------------------------------------------------------------------
// Boundary sensitivity: 0° vs 29.99° of the same sign should generally
// land in different D9/D10 signs (except in the trivially-impossible
// case where N=1, which does not apply here).
// ---------------------------------------------------------------------

for (let sign = 1; sign <= 12; sign++) {
  const atZero = point(sign, 0);
  const atNearEnd = point(sign, 29.99);

  const d9Zero = calculateD9(atZero);
  const d9End = calculateD9(atNearEnd);
  assert.notStrictEqual(
    d9Zero.sign,
    d9End.sign,
    `D9 boundary sensitivity failed for sign ${sign}: 0° and 29.99° landed in the same Navamsa sign`
  );

  const d10Zero = calculateD10(atZero);
  const d10End = calculateD10(atNearEnd);
  assert.notStrictEqual(
    d10Zero.sign,
    d10End.sign,
    `D10 boundary sensitivity failed for sign ${sign}: 0° and 29.99° landed in the same Dashamsa sign`
  );
}

// ---------------------------------------------------------------------
// Registry sweep: every implemented varga produces a valid 1-12 sign
// for longitudes spanning all 12 rashis (a range of degrees per sign).
// ---------------------------------------------------------------------

assert.deepStrictEqual(IMPLEMENTED_VARGAS, [1, 2, 3, 4, 7, 9, 10, 12], "expected exactly D1/D2/D3/D4/D7/D9/D10/D12 to be registered this pass");

const CALCULATORS: Record<number, (p: ChartPoint) => { sign: number }> = {
  1: calculateD1,
  2: calculateD2,
  3: calculateD3,
  4: calculateD4,
  7: calculateD7,
  9: calculateD9,
  10: calculateD10,
  12: calculateD12,
};

for (const varga of IMPLEMENTED_VARGAS) {
  const calc = CALCULATORS[varga];
  for (let sign = 1; sign <= 12; sign++) {
    for (const degree of [0, 3.33, 7.5, 12.5, 15, 19.99, 22.5, 27.99, 29.999]) {
      const result = calc(point(sign, degree));
      assert.ok(
        Number.isInteger(result.sign) && result.sign >= 1 && result.sign <= 12,
        `D${varga} at sign ${sign}, degree ${degree}: sign ${result.sign} out of 1-12 range`
      );
    }
  }
}

// ---------------------------------------------------------------------
// Determinism: same chart in, same divisional result out (repeated
// calls, and full round-trip through calculateDivisionalChart()).
// ---------------------------------------------------------------------

const referenceChart: ChartData = calculateChart(
  new Date(Date.UTC(1990, 7, 15, 5, 0, 0)), // 1990-08-15 05:00 UTC
  28.6139, // New Delhi
  77.209
);

function runAll(chart: ChartData): { d1: DivisionalChartResult; d2: DivisionalChartResult; d3: DivisionalChartResult; d4: DivisionalChartResult; d7: DivisionalChartResult; d9: DivisionalChartResult; d10: DivisionalChartResult; d12: DivisionalChartResult } {
  return {
    d1: calculateDivisionalChart(1, chart),
    d2: calculateDivisionalChart(2, chart),
    d3: calculateDivisionalChart(3, chart),
    d4: calculateDivisionalChart(4, chart),
    d7: calculateDivisionalChart(7, chart),
    d9: calculateDivisionalChart(9, chart),
    d10: calculateDivisionalChart(10, chart),
    d12: calculateDivisionalChart(12, chart),
  };
}

const firstRun = runAll(referenceChart);
const secondRun = runAll(referenceChart);
assert.deepStrictEqual(firstRun, secondRun, "calculateDivisionalChart must be deterministic for identical input");

// Sanity on shape: every planet name present, ascendant present, sign 1-12.
for (const result of [firstRun.d1, firstRun.d2, firstRun.d3, firstRun.d4, firstRun.d7, firstRun.d9, firstRun.d10, firstRun.d12]) {
  assert.ok(result.ascendant.sign >= 1 && result.ascendant.sign <= 12);
  const planetNames = Object.keys(result.planets);
  assert.strictEqual(planetNames.length, 12, "expected all 12 tracked planets in the divisional result");
  for (const name of planetNames) {
    const entry = result.planets[name as keyof typeof result.planets];
    assert.ok(entry.sign >= 1 && entry.sign <= 12, `${name} in D${result.varga}: sign ${entry.sign} out of range`);
  }
}

// D1's planets/ascendant must exactly match the natal chart's own signs/degrees.
for (const name of Object.keys(referenceChart.planets) as (keyof ChartData["planets"])[]) {
  assert.strictEqual(firstRun.d1.planets[name].sign, referenceChart.planets[name].sign);
  assert.strictEqual(firstRun.d1.planets[name].degreeInVarga, referenceChart.planets[name].degree);
}
assert.strictEqual(firstRun.d1.ascendant.sign, referenceChart.ascendant.sign);

// Unregistered varga throws rather than silently guessing. (D6 is
// deliberately never registered by this task's scope, so it stays a
// stable "not implemented" probe regardless of which of D2/D3/D4/D7/D12
// end up completed.)
assert.throws(() => calculateDivisionalChart(6, referenceChart), /no calculator registered for D6/);

console.log("divisional.test.ts: all assertions passed");
