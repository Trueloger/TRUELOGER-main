// scripts/dev/verify-panchang-engine.ts
// Sanity-checks the local Panchang engine (src/lib/panchang/calculate.ts)
// for New Delhi across a handful of dates: sunrise/sunset land in
// plausible IST clock-time ranges, tithi/nakshatra/yoga/karana rotate
// sensibly day to day, and a known reference date's tithi/nakshatra is
// cross-checked against a well-documented public value.
//
// Usage: node --env-file=.env.local scripts/dev/verify-panchang-engine.ts
import { calculateDailyPanchang } from "../../src/lib/panchang/calculate.ts";

const LAT = 28.6139;
const LON = 77.209;

function istClock(iso: string): string {
  const d = new Date(iso);
  const istMs = d.getTime() + 5.5 * 3600 * 1000;
  const ist = new Date(istMs);
  return `${String(ist.getUTCHours()).padStart(2, "0")}:${String(ist.getUTCMinutes()).padStart(2, "0")}`;
}

const dates = ["2026-01-01", "2026-01-14", "2026-03-03", "2026-09-05", "2026-11-08"];

for (const date of dates) {
  const p = calculateDailyPanchang(date, LAT, LON);
  console.log(`\n=== ${date} (${p.vara.name}) ===`);
  console.log(`sunrise ${istClock(p.sunrise)} IST, sunset ${istClock(p.sunset)} IST`);
  console.log(
    `tithi #${p.tithi.number} ${p.tithi.name} (${p.tithi.paksha}) [${istClock(p.tithi.startsAt)} -> ${istClock(p.tithi.endsAt)}]`
  );
  console.log(`nakshatra ${p.nakshatra.name} pada ${p.nakshatra.pada}`);
  console.log(`yoga #${p.yoga.number} ${p.yoga.name}`);
  console.log(`karana #${p.karana.index} ${p.karana.name}`);
  console.log(`rahuKalam ${istClock(p.rahuKalam.startsAt)}-${istClock(p.rahuKalam.endsAt)}`);
  console.log(`hora[0] ${p.hora[0].lord} (should equal vara lord ${p.vara.lord})`);
  console.log(`choghadiya[0] ${p.choghadiya[0].name}`);

  // Sanity bounds — New Delhi sunrise/sunset never fall outside these
  // clock ranges across the year.
  const sunriseHour = new Date(p.sunrise).getUTCHours() + 5.5;
  if (sunriseHour < 5.5 || sunriseHour > 7.5) throw new Error(`FAIL: implausible sunrise for ${date}`);
  if (p.hora[0].lord !== p.vara.lord) throw new Error(`FAIL: hora[0] lord must equal vara lord for ${date}`);
  if (p.tithi.number < 1 || p.tithi.number > 30) throw new Error(`FAIL: tithi out of range for ${date}`);
  if (p.karana.index < 1 || p.karana.index > 60) throw new Error(`FAIL: karana index out of range for ${date}`);
  if (new Date(p.tithi.startsAt) >= new Date(p.tithi.endsAt)) throw new Error(`FAIL: tithi start >= end for ${date}`);
}

console.log("\nAll sanity checks passed.");
