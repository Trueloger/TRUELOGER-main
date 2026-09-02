// src/lib/astrology/geocode.ts
// No geocoding API is configured in this project (out of scope to add a
// paid dependency without asking) — this is a curated static lookup of
// ~70 major Indian cities (every state/UT capital plus major metros),
// since this site's audience is overwhelmingly Indian and all of India
// shares one UTC+5:30 offset. `resolveCityCoordinates` returns `null` on
// a miss — callers MUST fall back to asking the user for
// latitude/longitude/timezone directly rather than guessing a value, per
// this project's "never fabricate astrology input" rule. This is not a
// general geocoder; it will not resolve towns/villages or non-Indian
// cities.

export type CityCoordinates = {
  lat: number;
  lon: number;
  /** UTC offset in hours — matches BirthInput.timezone's shape in
   * ./types.ts. Every entry here is 5.5 (all of India, one timezone). */
  timezone: number;
};

const INDIA_TZ = 5.5;

// Keyed lowercase, city name only (no state/country) — resolveCityCoordinates
// normalizes lookups the same way. Coordinates are city-center
// approximations, accurate enough for chart calculation (astrology charts
// aren't sensitive to sub-city precision the way exact-address geocoding
// would need to be).
const CITY_COORDINATES: Record<string, CityCoordinates> = {
  "new delhi": { lat: 28.6139, lon: 77.209, timezone: INDIA_TZ },
  delhi: { lat: 28.7041, lon: 77.1025, timezone: INDIA_TZ },
  mumbai: { lat: 19.076, lon: 72.8777, timezone: INDIA_TZ },
  bengaluru: { lat: 12.9716, lon: 77.5946, timezone: INDIA_TZ },
  bangalore: { lat: 12.9716, lon: 77.5946, timezone: INDIA_TZ },
  chennai: { lat: 13.0827, lon: 80.2707, timezone: INDIA_TZ },
  kolkata: { lat: 22.5726, lon: 88.3639, timezone: INDIA_TZ },
  hyderabad: { lat: 17.385, lon: 78.4867, timezone: INDIA_TZ },
  pune: { lat: 18.5204, lon: 73.8567, timezone: INDIA_TZ },
  ahmedabad: { lat: 23.0225, lon: 72.5714, timezone: INDIA_TZ },
  jaipur: { lat: 26.9124, lon: 75.7873, timezone: INDIA_TZ },
  lucknow: { lat: 26.8467, lon: 80.9462, timezone: INDIA_TZ },
  kanpur: { lat: 26.4499, lon: 80.3319, timezone: INDIA_TZ },
  nagpur: { lat: 21.1458, lon: 79.0882, timezone: INDIA_TZ },
  indore: { lat: 22.7196, lon: 75.8577, timezone: INDIA_TZ },
  bhopal: { lat: 23.2599, lon: 77.4126, timezone: INDIA_TZ },
  patna: { lat: 25.5941, lon: 85.1376, timezone: INDIA_TZ },
  vadodara: { lat: 22.3072, lon: 73.1812, timezone: INDIA_TZ },
  ludhiana: { lat: 30.901, lon: 75.8573, timezone: INDIA_TZ },
  agra: { lat: 27.1767, lon: 78.0081, timezone: INDIA_TZ },
  nashik: { lat: 19.9975, lon: 73.7898, timezone: INDIA_TZ },
  ranchi: { lat: 23.3441, lon: 85.3096, timezone: INDIA_TZ },
  faridabad: { lat: 28.4089, lon: 77.3178, timezone: INDIA_TZ },
  meerut: { lat: 28.9845, lon: 77.7064, timezone: INDIA_TZ },
  rajkot: { lat: 22.3039, lon: 70.8022, timezone: INDIA_TZ },
  varanasi: { lat: 25.3176, lon: 82.9739, timezone: INDIA_TZ },
  srinagar: { lat: 34.0837, lon: 74.7973, timezone: INDIA_TZ },
  amritsar: { lat: 31.634, lon: 74.8723, timezone: INDIA_TZ },
  allahabad: { lat: 25.4358, lon: 81.8463, timezone: INDIA_TZ },
  prayagraj: { lat: 25.4358, lon: 81.8463, timezone: INDIA_TZ },
  jabalpur: { lat: 23.1815, lon: 79.9864, timezone: INDIA_TZ },
  gwalior: { lat: 26.2183, lon: 78.1828, timezone: INDIA_TZ },
  vijayawada: { lat: 16.5062, lon: 80.648, timezone: INDIA_TZ },
  jodhpur: { lat: 26.2389, lon: 73.0243, timezone: INDIA_TZ },
  madurai: { lat: 9.9252, lon: 78.1198, timezone: INDIA_TZ },
  raipur: { lat: 21.2514, lon: 81.6296, timezone: INDIA_TZ },
  kota: { lat: 25.2138, lon: 75.8648, timezone: INDIA_TZ },
  guwahati: { lat: 26.1445, lon: 91.7362, timezone: INDIA_TZ },
  chandigarh: { lat: 30.7333, lon: 76.7794, timezone: INDIA_TZ },
  thiruvananthapuram: { lat: 8.5241, lon: 76.9366, timezone: INDIA_TZ },
  solapur: { lat: 17.6599, lon: 75.9064, timezone: INDIA_TZ },
  hubballi: { lat: 15.3647, lon: 75.124, timezone: INDIA_TZ },
  mysuru: { lat: 12.2958, lon: 76.6394, timezone: INDIA_TZ },
  mysore: { lat: 12.2958, lon: 76.6394, timezone: INDIA_TZ },
  tiruchirappalli: { lat: 10.7905, lon: 78.7047, timezone: INDIA_TZ },
  bareilly: { lat: 28.367, lon: 79.4304, timezone: INDIA_TZ },
  aligarh: { lat: 27.8974, lon: 78.088, timezone: INDIA_TZ },
  moradabad: { lat: 28.8386, lon: 78.7733, timezone: INDIA_TZ },
  jalandhar: { lat: 31.326, lon: 75.5762, timezone: INDIA_TZ },
  bhubaneswar: { lat: 20.2961, lon: 85.8245, timezone: INDIA_TZ },
  salem: { lat: 11.6643, lon: 78.146, timezone: INDIA_TZ },
  warangal: { lat: 17.9784, lon: 79.6, timezone: INDIA_TZ },
  guntur: { lat: 16.3067, lon: 80.4365, timezone: INDIA_TZ },
  bhiwandi: { lat: 19.3002, lon: 73.0629, timezone: INDIA_TZ },
  saharanpur: { lat: 29.968, lon: 77.5552, timezone: INDIA_TZ },
  gorakhpur: { lat: 26.7606, lon: 83.3732, timezone: INDIA_TZ },
  bikaner: { lat: 28.0229, lon: 73.3119, timezone: INDIA_TZ },
  amravati: { lat: 20.9374, lon: 77.7796, timezone: INDIA_TZ },
  noida: { lat: 28.5355, lon: 77.391, timezone: INDIA_TZ },
  gurugram: { lat: 28.4595, lon: 77.0266, timezone: INDIA_TZ },
  gurgaon: { lat: 28.4595, lon: 77.0266, timezone: INDIA_TZ },
  jammu: { lat: 32.7266, lon: 74.857, timezone: INDIA_TZ },
  dehradun: { lat: 30.3165, lon: 78.0322, timezone: INDIA_TZ },
  shimla: { lat: 31.1048, lon: 77.1734, timezone: INDIA_TZ },
  panaji: { lat: 15.4909, lon: 73.8278, timezone: INDIA_TZ },
  goa: { lat: 15.4909, lon: 73.8278, timezone: INDIA_TZ },
  itanagar: { lat: 27.0844, lon: 93.6053, timezone: INDIA_TZ },
  imphal: { lat: 24.817, lon: 93.9368, timezone: INDIA_TZ },
  shillong: { lat: 25.5788, lon: 91.8933, timezone: INDIA_TZ },
  aizawl: { lat: 23.7271, lon: 92.7176, timezone: INDIA_TZ },
  kohima: { lat: 25.6751, lon: 94.1086, timezone: INDIA_TZ },
  gangtok: { lat: 27.3389, lon: 88.6065, timezone: INDIA_TZ },
  agartala: { lat: 23.8315, lon: 91.2868, timezone: INDIA_TZ },
  dispur: { lat: 26.1433, lon: 91.7898, timezone: INDIA_TZ },
  raigarh: { lat: 21.8974, lon: 83.3949, timezone: INDIA_TZ },
  puducherry: { lat: 11.9416, lon: 79.8083, timezone: INDIA_TZ },
  pondicherry: { lat: 11.9416, lon: 79.8083, timezone: INDIA_TZ },
  kochi: { lat: 9.9312, lon: 76.2673, timezone: INDIA_TZ },
  kozhikode: { lat: 11.2588, lon: 75.7804, timezone: INDIA_TZ },
  coimbatore: { lat: 11.0168, lon: 76.9558, timezone: INDIA_TZ },
  visakhapatnam: { lat: 17.6868, lon: 83.2185, timezone: INDIA_TZ },
  amaravati: { lat: 16.5062, lon: 80.648, timezone: INDIA_TZ },
  dhanbad: { lat: 23.7957, lon: 86.4304, timezone: INDIA_TZ },
  jamshedpur: { lat: 22.8046, lon: 86.2029, timezone: INDIA_TZ },
  siliguri: { lat: 26.7271, lon: 88.3953, timezone: INDIA_TZ },
};

/** Looks up a curated India-city table (city name only, case/whitespace
 * insensitive). Returns `null` on a miss — the caller must then ask the
 * user for latitude/longitude/timezone directly rather than guessing. */
export function resolveCityCoordinates(city: string): CityCoordinates | null {
  const key = city.trim().toLowerCase();
  return CITY_COORDINATES[key] ?? null;
}
