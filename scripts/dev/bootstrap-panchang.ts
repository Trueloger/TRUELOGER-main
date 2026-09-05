// scripts/dev/bootstrap-panchang.ts
// One-off backfill: populates the `dailyPanchang` archive for a full
// year (+ the coverage metadata doc the daily cron reads) and the
// `panchangFestivals` doc for that year and the next, all via the local
// engine (src/lib/panchang/calculate.ts / festivals.ts) — no external
// API, so this is safe to run against production Firestore directly
// from a developer machine, without going through a serverless
// function's duration limit.
//
// WHY this exists instead of letting the daily cron do it: generating
// an entire year (~366 days x boundary-search-heavy tithi/nakshatra/
// yoga/karana/hora/choghadiya calculations, plus a full year's festival
// derivation) takes on the order of 10-20 seconds — fine for a local
// script, risky for a single serverless invocation on Vercel's Hobby
// plan (see src/lib/panchang/store.ts's MAX_CATCHUP_DAYS_PER_CALL
// comment). Run this ONCE after deploying this feature; from then on,
// the daily cron (src/app/api/cron/generate-panchang/route.ts) keeps
// the 1-year lookahead window topped up incrementally (usually exactly
// 1 new day per run), and keeps the next new year's festival list
// generated automatically right when it first becomes relevant (Jan 1).
//
// Usage: node --env-file=.env.local scripts/dev/bootstrap-panchang.ts [year]
//   (defaults to the current IST year if omitted)
import { batchWriteDailyPanchang, generateYearFestivals } from "../../src/lib/panchang/store.ts";
import { getTodayIST } from "../../src/lib/horoscope/date.ts";
import { getFirestoreDb } from "../../src/lib/firebase-admin.ts";

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function datesInYear(year: number): string[] {
  const dates: string[] = [];
  let d = `${year}-01-01`;
  while (d.startsWith(String(year))) {
    dates.push(d);
    d = addDays(d, 1);
  }
  return dates;
}

async function main() {
  const argYear = process.argv[2] ? Number(process.argv[2]) : undefined;
  const year = argYear ?? Number(getTodayIST().slice(0, 4));

  console.log(`Backfilling dailyPanchang for ${year}...`);
  const dates = datesInYear(year);
  const start = Date.now();
  await batchWriteDailyPanchang(dates);
  console.log(`  wrote ${dates.length} days in ${Date.now() - start}ms`);

  // Seed the coverage-tracking doc so the daily cron's rolling window
  // starts from the end of what this script just backfilled.
  await getFirestoreDb()
    .collection("panchangMeta")
    .doc("coverage")
    .set({ lastGeneratedDate: dates[dates.length - 1] });
  console.log(`  set coverage meta: lastGeneratedDate=${dates[dates.length - 1]}`);

  console.log(`Generating festival list for ${year} and ${year + 1}...`);
  for (const y of [year, year + 1]) {
    const s = Date.now();
    const doc = await generateYearFestivals(y);
    console.log(`  ${y}: ${doc.festivals.length} festivals/vrats in ${Date.now() - s}ms`);
  }

  console.log("Bootstrap complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
