// scripts/dev/verify-horoscope-store.ts
// Manual check — exercises the full read-through path against real
// Firestore + OpenRouter. Run it twice: the first run should generate
// (and print a fresh generatedAt), the second should hit the cache
// (same generatedAt, no new OpenRouter call, near-instant).
//
// Usage: node --env-file=.env.local scripts/dev/verify-horoscope-store.ts
import { getOrGenerateDailyHoroscopes } from "../../src/lib/horoscope/store.ts";
import { getTodayIST } from "../../src/lib/horoscope/date.ts";

const date = getTodayIST();
const start = Date.now();
const doc = await getOrGenerateDailyHoroscopes(date);
const elapsedMs = Date.now() - start;

console.log(`date=${doc.date} generatedAt=${doc.generatedAt} model=${doc.model}`);
console.log(`signs stored: ${Object.keys(doc.signs).length}`);
console.log(`elapsed: ${elapsedMs}ms`);
