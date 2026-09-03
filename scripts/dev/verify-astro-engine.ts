// scripts/dev/verify-astro-engine.ts
// Validates src/lib/astro-engine (Lahiri ayanamsha + local ephemeris)
// against a real ground-truth data point captured live from
// FreeAstrologyAPI (New Delhi, 1990-08-15, 10:30 IST local time =
// 1990-08-15T05:00:00.000Z UTC, latitude 28.6139, longitude 77.2090):
//   - Moon: sidereal sign = Taurus (2), sidereal longitude ≈ 48.30°,
//     Nakshatra = Rohini, Pada = 3.
//   - Ascendant: sidereal sign = Virgo (6).
//   - Mars: sidereal sign = Aries (1).
// Pure local computation — no network calls, safe to run freely.
//
// Usage: node --env-file=.env.local scripts/dev/verify-astro-engine.ts
import { calculateChart } from "../../src/lib/astro-engine/ephemeris.ts";
import { lahiriAyanamsha } from "../../src/lib/astro-engine/ayanamsha.ts";

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const birthUtc = new Date("1990-08-15T05:00:00.000Z");
const latitude = 28.6139;
const longitude = 77.2090;

console.log("Lahiri ayanamsha at birth moment:", lahiriAyanamsha(birthUtc).toFixed(6), "degrees");

const chart = calculateChart(birthUtc, latitude, longitude);

console.log("\nFull chart:");
console.log(JSON.stringify(chart, null, 2));

console.log("\n--- Ground-truth checks ---");

let failed = false;
function check(label: string, actual: unknown, expected: unknown, pass: boolean) {
  console.log(`${pass ? "PASS" : "FAIL"} ${label}: actual=${actual} expected=${expected}`);
  if (!pass) failed = true;
}

const moon = chart.planets.Moon;
check("Moon sidereal sign", `${moon.sign} (${SIGN_NAMES[moon.sign - 1]})`, "2 (Taurus)", moon.sign === 2);
check(
  "Moon sidereal longitude (within 0.5°)",
  moon.longitude.toFixed(3),
  "≈48.30",
  Math.abs(moon.longitude - 48.30) <= 0.5
);
check("Moon Nakshatra", moon.nakshatra.nakshatraName, "Rohini", moon.nakshatra.nakshatraName === "Rohini");
check("Moon Pada", moon.nakshatra.pada, 3, moon.nakshatra.pada === 3);

check(
  "Ascendant sidereal sign",
  `${chart.ascendant.sign} (${SIGN_NAMES[chart.ascendant.sign - 1]})`,
  "6 (Virgo)",
  chart.ascendant.sign === 6
);

const mars = chart.planets.Mars;
check("Mars sidereal sign", `${mars.sign} (${SIGN_NAMES[mars.sign - 1]})`, "1 (Aries)", mars.sign === 1);

console.log("\n--- Sanity checks: every body produces a valid 1-12 sign ---");
const allNames: (keyof typeof chart.planets)[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
  "Uranus", "Neptune", "Pluto", "Rahu", "Ketu",
];
for (const name of allNames) {
  const entry = chart.planets[name];
  const valid = Number.isInteger(entry.sign) && entry.sign >= 1 && entry.sign <= 12;
  check(
    `${name} sign is valid 1-12`,
    `${entry.sign} (${SIGN_NAMES[entry.sign - 1]}), retro=${entry.isRetrograde}`,
    "1-12",
    valid
  );
}
{
  const valid = Number.isInteger(chart.mc.sign) && chart.mc.sign >= 1 && chart.mc.sign <= 12;
  check("MC sign is valid 1-12", `${chart.mc.sign} (${SIGN_NAMES[chart.mc.sign - 1]})`, "1-12", valid);
}

console.log("\n--- Cross-reference sanity (no exact ground truth, eyeball for plausibility) ---");
for (const name of ["Sun", "Jupiter", "Venus", "Saturn"] as const) {
  const entry = chart.planets[name];
  console.log(`${name}: sign=${entry.sign} (${SIGN_NAMES[entry.sign - 1]}) longitude=${entry.longitude.toFixed(2)} retro=${entry.isRetrograde}`);
}

if (failed) {
  console.error("\nVALIDATION FAILED — see FAIL lines above.");
  process.exit(1);
} else {
  console.log("\nAll ground-truth and sanity checks PASSED.");
}
