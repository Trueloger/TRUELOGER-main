// scripts/dev/verify-freeastrologyapi.ts
// Manual connectivity check — proves FREE_ASTROLOGY_API_KEY in .env.local
// actually authenticates and the endpoints in src/lib/astrology return the
// shapes types.ts expects. Not an automated test (real external API, no
// mocking framework in this repo) — re-run any time the integration seems
// broken.
//
// Usage: node --env-file=.env.local scripts/dev/verify-freeastrologyapi.ts
import { getPlanetPositions, getPanchang, getVimshottariMahaDasha } from "../../src/lib/astrology/freeastrologyapi.ts";
import { deriveRashi, deriveNakshatraPada, deriveMangalDosha } from "../../src/lib/astrology/derive.ts";
import { resolveCityCoordinates } from "../../src/lib/astrology/geocode.ts";
import type { BirthInput } from "../../src/lib/astrology/types.ts";

// Fixed known test birth input — 15 Aug 1990, 10:30, New Delhi.
const delhi = resolveCityCoordinates("new delhi");
if (!delhi) throw new Error("geocode lookup failed for a city that should be in the table");

const input: BirthInput = {
  year: 1990,
  month: 8,
  date: 15,
  hours: 10,
  minutes: 30,
  seconds: 0,
  latitude: delhi.lat,
  longitude: delhi.lon,
  timezone: delhi.timezone,
};

console.log("Requesting planet positions...");
const planets = await getPlanetPositions(input);
console.log("Moon:", JSON.stringify(planets.output.Moon, null, 2));

const moon = planets.output.Moon;
if (!moon) throw new Error("no Moon entry in response");

console.log("Derived Rashi:", deriveRashi(moon.fullDegree));
console.log("Derived Nakshatra/Pada:", deriveNakshatraPada(moon.fullDegree));
console.log("API-reported Rashi/Nakshatra (should match):", {
  sign: moon.zodiac_sign_name,
  nakshatra: moon.nakshatra_name,
  pada: moon.nakshatra_pada,
});
console.log("Mangal Dosha:", deriveMangalDosha(planets.output));

console.log("\nRequesting Panchang...");
const panchang = await getPanchang(input);
console.log("Tithi:", panchang.tithi.name, "| Vara:", panchang.weekday.vedic_weekday_name);
console.log("Sunrise:", panchang.sunrise.sun_rise_time, "Sunset:", panchang.sunrise.sun_set_time);

console.log("\nRequesting Vimshottari Maha Dasha...");
const dasha = await getVimshottariMahaDasha(input);
console.log("Maha Dasha periods:", Object.keys(dasha).length);
console.log(JSON.stringify(Object.values(dasha)[0], null, 2));

console.log("\nAll FreeAstrologyAPI checks completed successfully.");
