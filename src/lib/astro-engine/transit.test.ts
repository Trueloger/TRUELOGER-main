// src/lib/astro-engine/transit.test.ts
import assert from "node:assert/strict";
import { calculateChart } from "./ephemeris.ts";
import { deriveSadeSati } from "../astrology/derive.ts";
import { calculateTransit, findNextSignIngress, transitHouseSummary } from "./transit.ts";

// --- 8 real natal charts (varied dates/locations) ---
const NATAL_INPUTS: { utc: string; lat: number; lon: number }[] = [
  { utc: "1990-08-15T05:00:00Z", lat: 28.6139, lon: 77.209 }, // New Delhi
  { utc: "2000-01-01T12:00:00Z", lat: 19.076, lon: 72.8777 }, // Mumbai
  { utc: "1985-06-21T18:30:00Z", lat: 51.5074, lon: -0.1278 }, // London
  { utc: "1975-03-10T09:15:00Z", lat: 13.0827, lon: 80.2707 }, // Chennai
  { utc: "1960-11-02T22:45:00Z", lat: 40.7128, lon: -74.006 }, // New York
  { utc: "2010-07-04T03:00:00Z", lat: 22.5726, lon: 88.3639 }, // Kolkata
  { utc: "1942-12-25T14:00:00Z", lat: 12.9716, lon: 77.5946 }, // Bengaluru (pre-1945 offset era)
  { utc: "2020-02-29T00:00:00Z", lat: 26.9124, lon: 75.7873 }, // Jaipur
];

const natalCharts = NATAL_INPUTS.map((i) => calculateChart(new Date(i.utc), i.lat, i.lon));

// --- several transit moments, varied dates ---
const TRANSIT_MOMENTS: { utc: string; lat: number; lon: number }[] = [
  { utc: "2024-01-15T00:00:00Z", lat: 28.6139, lon: 77.209 },
  { utc: "2024-06-01T12:00:00Z", lat: 19.076, lon: 72.8777 },
  { utc: "2025-09-06T06:00:00Z", lat: 51.5074, lon: -0.1278 },
  { utc: "2026-01-01T00:00:00Z", lat: 13.0827, lon: 80.2707 },
];

// --- calculateTransit never throws across every chart x moment combination ---
for (const natalChart of natalCharts) {
  for (const moment of TRANSIT_MOMENTS) {
    const snapshot = calculateTransit(natalChart, new Date(moment.utc), moment.lat, moment.lon);
    assert.ok(snapshot.transitUtc);
    assert.ok(snapshot.natalAscendantSign >= 1 && snapshot.natalAscendantSign <= 12);
    for (const planet of Object.keys(snapshot.planets) as (keyof typeof snapshot.planets)[]) {
      const info = snapshot.planets[planet];
      assert.strictEqual(info.planet, planet);
      assert.ok(info.transitSign >= 1 && info.transitSign <= 12);
      assert.ok(
        info.transitHouseFromNatalAscendant >= 1 && info.transitHouseFromNatalAscendant <= 12,
        "house must be 1-12"
      );
      assert.ok(Array.isArray(info.aspectsToNatalPlanets));
      assert.ok(Array.isArray(info.conjunctNatalPlanets));
    }
  }
}

// --- determinism ---
{
  const natalChart = natalCharts[0];
  const moment = TRANSIT_MOMENTS[0];
  const a = calculateTransit(natalChart, new Date(moment.utc), moment.lat, moment.lon);
  const b = calculateTransit(natalChart, new Date(moment.utc), moment.lat, moment.lon);
  assert.deepStrictEqual(a, b, "calculateTransit must be deterministic for identical inputs");
}

// --- hand-verifiable conjunction: transit AT the natal moment itself
// means every planet transits its own natal sign, so every planet must
// be conjunct itself (and, transitively, any other natal planet that
// shares that sign) ---
{
  const natalChart = natalCharts[1]; // Mumbai 2000-01-01
  const selfTransit = calculateTransit(natalChart, new Date(NATAL_INPUTS[1].utc), NATAL_INPUTS[1].lat, NATAL_INPUTS[1].lon);
  for (const planet of Object.keys(selfTransit.planets) as (keyof typeof selfTransit.planets)[]) {
    assert.ok(
      selfTransit.planets[planet].conjunctNatalPlanets.includes(planet),
      `${planet} transiting its own natal moment must be conjunct its own natal placement`
    );
  }
}

// --- hand-verifiable NON-conjunction: pick a transiting planet whose
// sign clearly differs from a natal planet's sign, and assert it's
// absent from that natal planet's conjunction ---
{
  const natalChart = natalCharts[2]; // London 1985, natal Sun ~ Gemini (born 1985-06-21)
  // ~90 days later in the calendar year: the Sun moves ~1 deg/day, so a
  // 90-day offset guarantees a different sidereal sign than the natal
  // Sun's (natal date is 1985-06-21; this lands near 1985-09-19).
  const farMoment = new Date("1985-09-19T18:30:00Z");
  const snapshot = calculateTransit(natalChart, farMoment, 51.5074, -0.1278);
  const natalSunSign = natalChart.planets.Sun.sign;
  const transitSunSign = snapshot.planets.Sun.transitSign;
  assert.notStrictEqual(transitSunSign, natalSunSign, "test premise: transit Sun sign must differ from natal Sun sign here");
  assert.ok(
    !snapshot.planets.Sun.conjunctNatalPlanets.includes("Sun"),
    "transiting Sun must NOT be conjunct natal Sun when signs differ"
  );
}

// --- findNextSignIngress: Saturn and Jupiter from a real date ---
for (const [body, lat, lon] of [
  ["Saturn", 28.6139, 77.209],
  ["Jupiter", 19.076, 72.8777],
] as const) {
  const fromUtc = new Date("2024-01-01T00:00:00Z");
  const result = findNextSignIngress(body, fromUtc, lat, lon);
  assert.ok(result, `${body}: expected an ingress within the default search cap`);
  assert.strictEqual(result!.toSign, (result!.fromSign % 12) + 1, `${body}: toSign must be fromSign+1 (mod 12) for direct motion`);
  assert.ok(new Date(result!.ingressUtc).getTime() > fromUtc.getTime(), `${body}: ingressUtc must be strictly after fromUtc`);
  const maxSearchMs = 3 * 365 * 24 * 3600 * 1000;
  assert.ok(
    new Date(result!.ingressUtc).getTime() <= fromUtc.getTime() + maxSearchMs,
    `${body}: ingressUtc must fall within the documented search cap`
  );
}

// --- findNextSignIngress: determinism ---
{
  const fromUtc = new Date("2024-01-01T00:00:00Z");
  const a = findNextSignIngress("Saturn", fromUtc, 28.6139, 77.209);
  const b = findNextSignIngress("Saturn", fromUtc, 28.6139, 77.209);
  assert.deepStrictEqual(a, b);
}

// --- findNextSignIngress: null when nothing found within a tiny cap ---
{
  const fromUtc = new Date("2024-01-01T00:00:00Z");
  const result = findNextSignIngress("Saturn", fromUtc, 28.6139, 77.209, 1); // 1 day cap, Saturn takes ~2.5yr/sign
  assert.strictEqual(result, null, "Saturn cannot ingress a new sign within a 1-day cap");
}

// --- transitHouseSummary cross-check against deriveSadeSati's existing
// shipped logic (src/lib/astrology/derive.ts) — same natal Moon sign +
// transiting Saturn sign must agree exactly, proving this generalized
// module isn't a divergent reimplementation. ---
{
  const cases: { natalChart: (typeof natalCharts)[number]; moment: (typeof TRANSIT_MOMENTS)[number] }[] = [
    { natalChart: natalCharts[0], moment: TRANSIT_MOMENTS[0] },
    { natalChart: natalCharts[3], moment: TRANSIT_MOMENTS[1] },
    { natalChart: natalCharts[5], moment: TRANSIT_MOMENTS[2] },
  ];

  for (const { natalChart, moment } of cases) {
    const summary = transitHouseSummary(natalChart, new Date(moment.utc), moment.lat, moment.lon);
    const saturnEntry = summary.find((s) => s.planet === "Saturn");
    assert.ok(saturnEntry, "transitHouseSummary must include Saturn");

    const transitChart = calculateChart(new Date(moment.utc), moment.lat, moment.lon);
    const transitingSaturnSign = transitChart.planets.Saturn.sign;
    const natalMoonSign = natalChart.planets.Moon.sign;

    const existing = deriveSadeSati(natalMoonSign, transitingSaturnSign);

    assert.strictEqual(
      saturnEntry!.houseFromNatalMoon,
      existing.houseFromNatalMoon,
      "transitHouseSummary's Saturn houseFromNatalMoon must exactly match deriveSadeSati's existing computation"
    );
  }
}

console.log("transit.test.ts: all assertions passed");
