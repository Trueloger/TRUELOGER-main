// scripts/dev/verify-openrouter.ts
// Manual check — makes one real OpenRouter call and prints the
// validated result. Not an automated test (no mocking framework in
// this repo, and the whole point is confirming the real API contract).
//
// Usage: node --env-file=.env.local scripts/dev/verify-openrouter.ts
import { generateAllSignReadings } from "../../src/lib/horoscope/openrouter.ts";
import { getTodayIST } from "../../src/lib/horoscope/date.ts";

const date = getTodayIST();
console.log(`Requesting horoscope set for ${date}...`);

const signs = await generateAllSignReadings(date);
console.log(`Received ${Object.keys(signs).length} validated signs.`);
console.log(JSON.stringify(signs.aries, null, 2));
