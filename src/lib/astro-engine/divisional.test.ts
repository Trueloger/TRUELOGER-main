// src/lib/astro-engine/divisional.test.ts
// Plain node:assert/strict script, matching this repo's engine-test
// convention (see src/lib/ashtakoot/calculate.test.ts and
// src/lib/astro-engine/isolation.test.ts) — run directly via
// `node src/lib/astro-engine/divisional.test.ts`.
import assert from "node:assert/strict";
import {
  calculateD1,
  calculateD9,
  calculateD10,
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

assert.deepStrictEqual(IMPLEMENTED_VARGAS, [1, 9, 10], "expected exactly D1/D9/D10 to be registered this pass");

const CALCULATORS: Record<number, (p: ChartPoint) => { sign: number }> = {
  1: calculateD1,
  9: calculateD9,
  10: calculateD10,
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

function runAll(chart: ChartData): { d1: DivisionalChartResult; d9: DivisionalChartResult; d10: DivisionalChartResult } {
  return {
    d1: calculateDivisionalChart(1, chart),
    d9: calculateDivisionalChart(9, chart),
    d10: calculateDivisionalChart(10, chart),
  };
}

const firstRun = runAll(referenceChart);
const secondRun = runAll(referenceChart);
assert.deepStrictEqual(firstRun, secondRun, "calculateDivisionalChart must be deterministic for identical input");

// Sanity on shape: every planet name present, ascendant present, sign 1-12.
for (const result of [firstRun.d1, firstRun.d9, firstRun.d10]) {
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

// Unregistered varga throws rather than silently guessing.
assert.throws(() => calculateDivisionalChart(7, referenceChart), /no calculator registered for D7/);

console.log("divisional.test.ts: all assertions passed");
