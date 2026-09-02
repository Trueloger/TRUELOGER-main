// src/lib/astrology/freeastrologyapi.ts
// Server-only — never import from a "use client" file (reads
// FREE_ASTROLOGY_API_KEY). Client for https://freeastrologyapi.com
// (base URL https://json.freeastrologyapi.com/, auth via the
// `x-api-key` header — not RapidAPI-style headers). Docs:
// https://freeastrologyapi.com/api-reference
//
// Follows this repo's external-API client convention (see
// src/lib/horoscope/openrouter.ts): a low-level fetch wrapper with
// timeout + structured errors, then thin typed wrapper functions per
// endpoint. Retry here is for *transient* failures (network errors,
// timeouts, 5xx) at the transport level — a different concern from
// openrouter.ts's validate-then-retry-with-a-stricter-prompt pattern,
// which belongs to whichever caller validates a specific response
// shape, not to this generic client.
import type {
  AshtakootMatchConfig,
  AshtakootMatchResult,
  AstrologySettings,
  BirthInput,
  ChoghadiyaResult,
  DurMuhuratResult,
  HoraResult,
  KaranaDurationsResult,
  KundliChartSvgResult,
  KundliChartUrlResult,
  NakshatraDurationResult,
  PanchangResult,
  PlanetPositionsResult,
  SunriseSunsetResult,
  TithiResult,
  TimeWindow,
  VarjyamResult,
  VedicWeekdayResult,
  VimshottariDashaResult,
  VimshottariMahaDashaResult,
  WesternHousesResult,
  WesternHousesSettings,
  YogaDurationsResult,
} from "./types.ts";

const FREE_ASTROLOGY_API_BASE_URL = "https://json.freeastrologyapi.com";

class FreeAstrologyApiError extends Error {
  retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = "FreeAstrologyApiError";
    this.retryable = retryable;
  }
}

async function attemptCall<T>(url: string, apiKey: string, path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      // This can be a slower calc endpoint (dasha/match-making do real
      // ephemeris work) — give it more room than a typical API call.
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    // Network failure or AbortSignal.timeout firing — always transient.
    // Message is built only from `path` + the caught error, never from
    // `apiKey` or request headers.
    throw new FreeAstrologyApiError(
      `FreeAstrologyAPI request to ${path} failed: ${err instanceof Error ? err.message : String(err)}`,
      true
    );
  }

  if (res.ok) {
    return (await res.json()) as T;
  }

  const bodyText = await res.text().catch(() => "");
  // 4xx means the request itself is wrong (bad input, bad key) —
  // retrying identical input won't help. 5xx is the server's problem
  // and is worth one retry.
  const retryable = res.status >= 500;
  throw new FreeAstrologyApiError(
    `FreeAstrologyAPI request to ${path} failed: ${res.status} ${bodyText}`,
    retryable
  );
}

/** Low-level POST wrapper: timeout, max 2 total attempts with
 * exponential backoff + jitter, retrying only transient failures
 * (network errors, timeouts, 5xx) — never 4xx. Throws a structured
 * Error that never contains the API key. */
async function callFreeAstrologyApi<T>(path: string, body: unknown): Promise<T> {
  const apiKey = process.env.FREE_ASTROLOGY_API_KEY;
  if (!apiKey) throw new Error("FREE_ASTROLOGY_API_KEY is not set");

  const url = `${FREE_ASTROLOGY_API_BASE_URL}${path}`;
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await attemptCall<T>(url, apiKey, path, body);
    } catch (err) {
      const retryable = err instanceof FreeAstrologyApiError ? err.retryable : false;
      if (!retryable || attempt === maxAttempts) {
        throw err instanceof Error ? err : new Error(String(err));
      }
      const backoffMs = 500 * 2 ** (attempt - 1);
      const jitterMs = Math.random() * 250;
      await new Promise((resolve) => setTimeout(resolve, backoffMs + jitterMs));
    }
  }
  // Unreachable — the loop above always returns or throws — but keeps
  // TypeScript satisfied about the return type.
  throw new Error(`FreeAstrologyAPI request to ${path} failed`);
}

// Real, verified-by-direct-call API quirk (not documented on the docs
// site): the "duration"/"timing" family of single-purpose endpoints
// (tithi, nakshatra, yoga, karana, rahu-kalam, yama-gandam, gulika-kalam,
// dur-muhurat, varjyam, hora-timings, choghadiya-timings, and both
// vimsottari dasha endpoints) wrap their real payload DOUBLE-encoded:
// `{ statusCode, output: "<a JSON string, which itself is a JSON string
// of the real object>" }` — parsing `output` once yields ANOTHER string,
// not the object; a second parse is required. Verified 2026-09 via
// direct calls to /tithi-durations, /nakshatra-durations, /rahu-kalam,
// and /vimsottari/maha-dasas — all four exhibited the double-encoding
// (confirmed by inspecting the raw HTTP body, not just the parsed
// shape). By contrast /planets/extended, /getsunriseandset,
// /vedicweekday, and /match-making/ashtakoot-score all returned
// `output` as a proper object directly (confirmed by direct call), so
// those endpoints use the plain `callFreeAstrologyApi` above, unwrapped
// here only for the affected family.
//
// Implementation: parse `output` repeatedly while the result is still a
// string, capped at a small iteration count — handles single- or
// double-encoding uniformly (and would tolerate triple, if the API ever
// does that) without hardcoding "exactly two parses" as a magic number.
async function callFreeAstrologyApiUnwrapped<T>(path: string, body: unknown): Promise<T> {
  const envelope = await callFreeAstrologyApi<{ statusCode: number; output: unknown }>(path, body);

  let value: unknown = envelope.output;
  let parses = 0;
  const MAX_PARSES = 3;
  while (typeof value === "string" && parses < MAX_PARSES) {
    try {
      value = JSON.parse(value);
    } catch {
      throw new Error(`FreeAstrologyAPI request to ${path} returned an unparseable "output" string`);
    }
    parses++;
  }

  if (typeof value === "string") {
    throw new Error(
      `FreeAstrologyAPI request to ${path} returned "output" still a string after ${MAX_PARSES} parses — unexpected encoding depth`
    );
  }

  return value as T;
}

// ---------------------------------------------------------------------
// Request-body builders
// ---------------------------------------------------------------------
// Real API quirk: /planets and /planets/extended nest calculation
// settings under a "settings" key; every other endpoint used below
// nests the equivalent object under "config". Two builders, not one,
// so every call site is forced to pick the right one rather than
// guessing.

const DEFAULT_SETTINGS: AstrologySettings = {
  observation_point: "topocentric",
  ayanamsha: "lahiri",
};

function withSettingsBody(input: BirthInput, settings?: AstrologySettings) {
  return { ...input, settings: { ...DEFAULT_SETTINGS, ...settings } };
}

function withConfigBody(input: BirthInput, config?: AstrologySettings) {
  return { ...input, config: { ...DEFAULT_SETTINGS, ...config } };
}

// ---------------------------------------------------------------------
// Planets — POST /planets/extended
// ---------------------------------------------------------------------

/** Sidereal planetary positions, house placements (whole-sign, from
 * the Ascendant), and nakshatra placements for a birth (or transit)
 * moment. Calls POST /planets/extended (chosen over the plainer
 * /planets — extended additionally returns house_number and
 * nakshatra_* fields, which derive.ts needs for Rashi/Nakshatra/Mangal
 * Dosha and this project's Sade Sati check needs for transit Saturn's
 * sign). */
export function getPlanetPositions(
  input: BirthInput,
  settings?: AstrologySettings
): Promise<PlanetPositionsResult> {
  return callFreeAstrologyApi<PlanetPositionsResult>(
    "/planets/extended",
    withSettingsBody(input, settings)
  );
}

// ---------------------------------------------------------------------
// Western houses — POST /western/houses
// ---------------------------------------------------------------------

/** Western/tropical house cusps (Placidus by default on the API side;
 * pass settings.house_system to change it). This is a DIFFERENT house
 * system from the Vedic whole-sign houses in
 * PlanetPositionsResult.output[planet].house_number — the two are not
 * interchangeable. No dedicated Vedic "houses" endpoint exists in this
 * API; Vedic Lagna/houses come from getPlanetPositions()'s Ascendant
 * entry, not from this function. */
export function getWesternHouses(
  input: BirthInput,
  settings?: WesternHousesSettings
): Promise<WesternHousesResult> {
  return callFreeAstrologyApi<WesternHousesResult>(
    "/western/houses",
    withConfigBody(input, settings)
  );
}

// ---------------------------------------------------------------------
// Panchang — the old POST /complete-panchang is documented as
// deprecated ("no longer supported"); each field is now its own
// single-purpose endpoint. getPanchang() below fans out to all of them
// in parallel and composes one result, matching this project's
// panchang feature spec (tithi, vara, nakshatra, yoga, karana,
// sunrise/sunset, rahu kalam, yama gandam, gulika, dur muhurat,
// varjyam, hora, choghadiya).
// ---------------------------------------------------------------------

/** POST /tithi-durations. Double-encoded response (see
 * callFreeAstrologyApiUnwrapped) — verified by direct call. */
export function getTithi(input: BirthInput, settings?: AstrologySettings): Promise<TithiResult> {
  return callFreeAstrologyApiUnwrapped<TithiResult>(
    "/tithi-durations",
    withConfigBody(input, settings)
  );
}

/** POST /nakshatra-durations. Double-encoded response — verified by
 * direct call. */
export function getNakshatraDuration(
  input: BirthInput,
  settings?: AstrologySettings
): Promise<NakshatraDurationResult> {
  return callFreeAstrologyApiUnwrapped<NakshatraDurationResult>(
    "/nakshatra-durations",
    withConfigBody(input, settings)
  );
}

/** POST /yoga-durations. Double-encoded response — same endpoint family
 * as tithi/nakshatra (verified), not individually re-verified. */
export function getYogaDurations(
  input: BirthInput,
  settings?: AstrologySettings
): Promise<YogaDurationsResult> {
  return callFreeAstrologyApiUnwrapped<YogaDurationsResult>(
    "/yoga-durations",
    withConfigBody(input, settings)
  );
}

/** POST /karana-durations. Double-encoded response — same endpoint
 * family as tithi/nakshatra (verified), not individually re-verified. */
export function getKaranaDurations(
  input: BirthInput,
  settings?: AstrologySettings
): Promise<KaranaDurationsResult> {
  return callFreeAstrologyApiUnwrapped<KaranaDurationsResult>(
    "/karana-durations",
    withConfigBody(input, settings)
  );
}

/** POST /getsunriseandset */
export function getSunriseSunset(
  input: BirthInput,
  settings?: AstrologySettings
): Promise<SunriseSunsetResult> {
  return callFreeAstrologyApi<SunriseSunsetResult>(
    "/getsunriseandset",
    withConfigBody(input, settings)
  );
}

/** POST /vedicweekday — the "vara" of the panchang. */
export function getVedicWeekday(
  input: BirthInput,
  settings?: AstrologySettings
): Promise<VedicWeekdayResult> {
  return callFreeAstrologyApi<VedicWeekdayResult>("/vedicweekday", withConfigBody(input, settings));
}

/** POST /rahu-kalam. Double-encoded response — verified by direct call. */
export function getRahuKalam(input: BirthInput, settings?: AstrologySettings): Promise<TimeWindow> {
  return callFreeAstrologyApiUnwrapped<TimeWindow>("/rahu-kalam", withConfigBody(input, settings));
}

/** POST /yama-gandam. Same endpoint family as rahu-kalam (verified),
 * not individually re-verified. */
export function getYamaGandam(input: BirthInput, settings?: AstrologySettings): Promise<TimeWindow> {
  return callFreeAstrologyApiUnwrapped<TimeWindow>("/yama-gandam", withConfigBody(input, settings));
}

/** POST /gulika-kalam. Same endpoint family as rahu-kalam (verified),
 * not individually re-verified. */
export function getGulikaKalam(input: BirthInput, settings?: AstrologySettings): Promise<TimeWindow> {
  return callFreeAstrologyApiUnwrapped<TimeWindow>("/gulika-kalam", withConfigBody(input, settings));
}

/** POST /dur-muhurat. Same endpoint family as rahu-kalam (verified),
 * not individually re-verified. */
export function getDurMuhurat(
  input: BirthInput,
  settings?: AstrologySettings
): Promise<DurMuhuratResult> {
  return callFreeAstrologyApiUnwrapped<DurMuhuratResult>(
    "/dur-muhurat",
    withConfigBody(input, settings)
  );
}

/** POST /varjyam. Same endpoint family as rahu-kalam (verified), not
 * individually re-verified. */
export function getVarjyam(input: BirthInput, settings?: AstrologySettings): Promise<VarjyamResult> {
  return callFreeAstrologyApiUnwrapped<VarjyamResult>("/varjyam", withConfigBody(input, settings));
}

/** POST /hora-timings. Same endpoint family as rahu-kalam (verified),
 * not individually re-verified. */
export function getHoraTimings(input: BirthInput, settings?: AstrologySettings): Promise<HoraResult> {
  return callFreeAstrologyApiUnwrapped<HoraResult>("/hora-timings", withConfigBody(input, settings));
}

/** POST /choghadiya-timings. Same endpoint family as rahu-kalam
 * (verified), not individually re-verified. */
export function getChoghadiyaTimings(
  input: BirthInput,
  settings?: AstrologySettings
): Promise<ChoghadiyaResult> {
  return callFreeAstrologyApiUnwrapped<ChoghadiyaResult>(
    "/choghadiya-timings",
    withConfigBody(input, settings)
  );
}

/** Composed Panchang for a date+place: fans out to the 13 single-
 * purpose endpoints above in parallel (complete-panchang is
 * deprecated server-side). One caller-facing call; the fan-out is an
 * implementation detail. A failure in any sub-call fails the whole
 * call — callers wanting partial results should call the individual
 * functions above instead. */
export async function getPanchang(
  input: BirthInput,
  settings?: AstrologySettings
): Promise<PanchangResult> {
  const [
    sunriseRes,
    weekdayRes,
    tithi,
    nakshatra,
    yoga,
    karana,
    rahuKalam,
    yamaGandam,
    gulikaKalam,
    durMuhurat,
    varjyam,
    hora,
    choghadiya,
  ] = await Promise.all([
    getSunriseSunset(input, settings),
    getVedicWeekday(input, settings),
    getTithi(input, settings),
    getNakshatraDuration(input, settings),
    getYogaDurations(input, settings),
    getKaranaDurations(input, settings),
    getRahuKalam(input, settings),
    getYamaGandam(input, settings),
    getGulikaKalam(input, settings),
    getDurMuhurat(input, settings),
    getVarjyam(input, settings),
    getHoraTimings(input, settings),
    getChoghadiyaTimings(input, settings),
  ]);

  return {
    sunrise: sunriseRes.output,
    weekday: weekdayRes.output,
    tithi,
    nakshatra,
    yoga,
    karana,
    rahuKalam,
    yamaGandam,
    gulikaKalam,
    durMuhurat,
    varjyam,
    hora,
    choghadiya,
  };
}

// ---------------------------------------------------------------------
// Vimshottari Dasha
// ---------------------------------------------------------------------

/** POST /vimsottari/maha-dasas — maha-dasha timeline only.
 * Double-encoded response — verified by direct call. */
export function getVimshottariMahaDasha(
  input: BirthInput,
  settings?: AstrologySettings
): Promise<VimshottariMahaDashaResult> {
  return callFreeAstrologyApiUnwrapped<VimshottariMahaDashaResult>(
    "/vimsottari/maha-dasas",
    withConfigBody(input, settings)
  );
}

/** POST /vimsottari/maha-dasas-and-antar-dasas — full maha-dasha +
 * antar-dasha timeline, keyed {mahaDashaLord: {antarDashaLord: {start_time, end_time}}}.
 * Same endpoint family as /vimsottari/maha-dasas (verified), not
 * individually re-verified. */
export function getVimshottariDasha(
  input: BirthInput,
  settings?: AstrologySettings
): Promise<VimshottariDashaResult> {
  return callFreeAstrologyApiUnwrapped<VimshottariDashaResult>(
    "/vimsottari/maha-dasas-and-antar-dasas",
    withConfigBody(input, settings)
  );
}

// ---------------------------------------------------------------------
// Ashtakoot / Guna-Milan match-making —
// POST /match-making/ashtakoot-score
// ---------------------------------------------------------------------

/** Ashtakoot (Guna Milan) compatibility score between two birth
 * charts. `inputA`/`inputB` order does not matter to this wrapper —
 * FreeAstrologyAPI's request body is always {male, female}, so this
 * function assigns them itself; pass the male chart first for
 * clarity, but either order produces the same score. */
export function getAshtakootMatch(
  maleInput: BirthInput,
  femaleInput: BirthInput,
  config?: AshtakootMatchConfig
): Promise<AshtakootMatchResult> {
  return callFreeAstrologyApi<AshtakootMatchResult>("/match-making/ashtakoot-score", {
    male: maleInput,
    female: femaleInput,
    config: { ...DEFAULT_SETTINGS, ...config },
  });
}

// ---------------------------------------------------------------------
// Kundli chart (Rasi/D1 chart visualization)
// ---------------------------------------------------------------------

/** POST /horoscope-chart-svg-code — Rasi (D1) chart as inline SVG
 * markup. VERIFIED by a real direct call (2026-09, ahead of building the
 * free-kundli tool): the docs site publishes no example response for
 * this endpoint, but the actual response is a PLAIN `{ statusCode,
 * output }` envelope — the same shape as getPlanetPositions et al,
 * NOT the double-JSON-encoded-string shape of the tithi/nakshatra/
 * rahu-kalam/dasha family above. `output` here is literal SVG markup
 * (starts with `"<svg ..."`, which is not valid JSON — JSON.parse on it
 * throws), so this correctly uses the plain `callFreeAstrologyApi`, not
 * `callFreeAstrologyApiUnwrapped`. See KundliChartSvgResult in
 * types.ts for the full verified shape and caller-facing notes
 * (rendering, responsiveness). */
export function getKundliChartSvg(
  input: BirthInput,
  settings?: AstrologySettings
): Promise<KundliChartSvgResult> {
  return callFreeAstrologyApi<KundliChartSvgResult>(
    "/horoscope-chart-svg-code",
    withConfigBody(input, settings)
  );
}

/** POST /horoscope-chart-url — Rasi (D1) chart as a hosted image URL.
 * VERIFIED by a real direct call (2026-09): same plain-envelope shape as
 * getKundliChartSvg above (not double-encoded); `output` is an https://
 * URL string (S3-hosted .svg) usable directly as an <img src>. See
 * KundliChartUrlResult in types.ts. */
export function getKundliChartUrl(
  input: BirthInput,
  settings?: AstrologySettings
): Promise<KundliChartUrlResult> {
  return callFreeAstrologyApi<KundliChartUrlResult>(
    "/horoscope-chart-url",
    withConfigBody(input, settings)
  );
}
