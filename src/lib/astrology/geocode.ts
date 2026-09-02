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
