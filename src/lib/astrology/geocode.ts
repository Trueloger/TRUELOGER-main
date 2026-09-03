// src/lib/astrology/geocode.ts
// No geocoding API is configured in this project (out of scope to add a
// paid dependency without asking) — instead this resolves against a
// static, India-wide dataset of ~7,000 cities/towns (`india-cities.json`,
// derived from GeoNames' public-domain `cities500` export — every India
// populated place GeoNames records with population >= 500 — see that
// file's header comment for provenance/regeneration notes), since this
// site's audience is overwhelmingly Indian and all of India shares one
// UTC+5:30 offset. `resolveCityCoordinates` returns `null` on a miss —
// callers MUST fall back to asking the user for latitude/longitude/
// timezone directly rather than guessing a value, per this project's
// "never fabricate astrology input" rule. This is not a general
// geocoder; it will not resolve non-Indian cities.

import rawCities from "./india-cities.json";

export type CityCoordinates = {
  lat: number;
  lon: number;
  /** UTC offset in hours — matches BirthInput.timezone's shape in
   * ./types.ts. Every entry here is 5.5 (all of India, one timezone). */
  timezone: number;
};

export type CitySuggestion = {
  name: string;
  state: string;
  lat: number;
  lon: number;
};

const INDIA_TZ = 5.5;

// ---------------------------------------------------------------------
// Historical India UTC offset
// ---------------------------------------------------------------------
// India has NOT always run on a flat UTC+5:30 — the standard used for
// legal/civil timekeeping nationally changed 3 times in the 20th
// century, each documented on independent sources (Wikipedia "Indian
// Standard Time"; National Physical Laboratory India's own history of
// IST; timeanddate.com's IST historical changes page — cross-checked,
// all 3 agree on these dates and offsets):
//
//   before 1906-01-01        Madras Time,  UTC+5:21:10 (legal standard
//                             since 1884, based on Madras Observatory)
//   1906-01-01 – 1941-08-31   Indian Standard Time, UTC+5:30 (adopted
//                             nationally 1 Jan 1906)
//   1941-09-01 – 1945-10-14   "War Time" (WWII daylight-saving shift),
//                             UTC+6:30
//   1945-10-15 – present      Indian Standard Time, UTC+5:30 (restored,
//                             unchanged since)
//
// Not modeled: Calcutta (until 1948) and Bombay (until 1955) kept their
// own local mean time on top of/instead of national IST for some
// municipal purposes during the transition years — that requires a
// per-city "which local-time zone did this town use" tag our dataset
// doesn't carry, and is a narrow enough edge case (specific towns,
// specific 1906-1955 window, minutes not degrees of difference) that
// it's left as a known gap rather than guessed at. The 4-band table
// above is the well-documented NATIONAL legal standard and is a real
// accuracy improvement over an always-flat 5.5 for any pre-1945 birth.
const WAR_TIME_START_MS = Date.UTC(1941, 8, 1); // 1941-09-01
const WAR_TIME_END_MS = Date.UTC(1945, 9, 15); // 1945-10-15
const IST_ADOPTED_MS = Date.UTC(1906, 0, 1); // 1906-01-01
const MADRAS_TIME_OFFSET = 5 + 21 / 60 + 10 / 3600; // +5:21:10
const WAR_TIME_OFFSET = 6.5;

/** The UTC offset (hours) actually in legal civil use across India on
 * `dateOfBirth` ("YYYY-MM-DD") — see the historical table above.
 * Falls back to the modern +5:30 for an unparseable date rather than
 * throwing, since callers already validate the date shape separately;
 * this is a best-effort historical refinement, not a new validation
 * gate. Compares by calendar date only (UTC midnight), which is
 * accurate enough here — the offset transitions above happened at
 * local midnight, and a birth minute near the exact transition instant
 * being on the "wrong" side by one day is a pre-existing limitation of
 * treating civil-calendar transitions this way, not something this
 * function introduces. */
export function historicalIndiaOffsetHours(dateOfBirth: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth);
  if (!match) return INDIA_TZ;
  const dateMs = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

  if (dateMs < IST_ADOPTED_MS) return MADRAS_TIME_OFFSET;
  if (dateMs >= WAR_TIME_START_MS && dateMs < WAR_TIME_END_MS) return WAR_TIME_OFFSET;
  return INDIA_TZ;
}

type RawCityEntry = {
  name: string;
  state: string;
  lat: number;
  lon: number;
  population: number;
};

const CITIES = rawCities as RawCityEntry[];

/** Lookup keyed by normalized (lowercased, trimmed) city name, built once
 * at module load — not a linear scan per call. When multiple cities
 * nationwide share the exact same name (e.g. two "Bilaspur"s, in
 * Chhattisgarh and Himachal Pradesh), the entry is deterministically the
 * one with the highest recorded population; ties after that break
 * alphabetically by state. This can't disambiguate same-name cities by
 * itself — a user who means the smaller of two same-named towns should
 * add the state, which `searchCities` (below) surfaces via its state
 * column so the UI can guide them there. */
const CITY_COORDINATES: Map<string, CityCoordinates> = new Map();
// Also keep the winning raw entry per name for searchCities ranking/state data.
const CITY_ENTRY: Map<string, RawCityEntry> = new Map();

for (const entry of CITIES) {
  const key = entry.name.trim().toLowerCase();
  const existing = CITY_ENTRY.get(key);
  if (
    !existing ||
    entry.population > existing.population ||
    (entry.population === existing.population &&
      entry.state.localeCompare(existing.state) < 0)
  ) {
    CITY_ENTRY.set(key, entry);
    CITY_COORDINATES.set(key, {
      lat: entry.lat,
      lon: entry.lon,
      timezone: INDIA_TZ,
    });
  }
}

/** Looks up the India cities dataset (city name only, case/whitespace
 * insensitive). Returns `null` on a miss — the caller must then ask the
 * user for latitude/longitude/timezone directly rather than guessing. */
export function resolveCityCoordinates(city: string): CityCoordinates | null {
  const key = city.trim().toLowerCase();
  return CITY_COORDINATES.get(key) ?? null;
}

/** Prefix/substring search over the India cities dataset for autocomplete
 * UIs — not a fuzzy search, just simple case-insensitive matching with
 * prefix matches ranked ahead of substring matches (then by population
 * descending within each group). Returns up to `limit` results (default
 * 8). This is a UX aid only; it does not gate what a user can submit —
 * `resolveCityCoordinates` (and ultimately a 400 from the route) remains
 * the source of truth for whether a typed city resolves. */
export function searchCities(query: string, limit = 8): CitySuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const prefixMatches: RawCityEntry[] = [];
  const substringMatches: RawCityEntry[] = [];

  for (const entry of CITIES) {
    const nameLower = entry.name.toLowerCase();
    if (nameLower.startsWith(q)) {
      prefixMatches.push(entry);
    } else if (nameLower.includes(q)) {
      substringMatches.push(entry);
    }
  }

  const byPopulationDesc = (a: RawCityEntry, b: RawCityEntry) =>
    b.population - a.population;
  prefixMatches.sort(byPopulationDesc);
  substringMatches.sort(byPopulationDesc);

  return [...prefixMatches, ...substringMatches]
    .slice(0, limit)
    .map((e) => ({ name: e.name, state: e.state, lat: e.lat, lon: e.lon }));
}
