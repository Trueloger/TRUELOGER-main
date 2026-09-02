// src/lib/astrology/types.ts
// Shared input shape + per-endpoint output types for FreeAstrologyAPI
// (https://freeastrologyapi.com/api-reference, base URL
// https://json.freeastrologyapi.com/). Field names below are copied
// verbatim from the real docs' example requests/responses as of this
// writing (Sep 2026) — including quirks like the "left_precentage"
// typo on the tithi endpoint's response. Do not "fix" quirky field
// names here; that would make this file lie about what the API
// actually returns.

// ---------------------------------------------------------------------
// Shared request shape
// ---------------------------------------------------------------------

/** Every FreeAstrologyAPI calculation endpoint takes date+time+place as
 * separate numeric fields (no combined ISO datetime) plus a numeric UTC
 * offset — not an IANA timezone name. `month`/`date`/`hours`/`minutes`/
 * `seconds` are plain integers with no leading zero (e.g. `4`, not
 * `"04"`). `timezone` is the birth location's UTC offset in hours,
 * e.g. `5.5` for India. */
export type BirthInput = {
  year: number;
  month: number; // 1-12
  date: number; // day of month, 1-31
  hours: number; // 0-23
  minutes: number; // 0-59
  seconds: number; // 0-59
  latitude: number; // -90..90
  longitude: number; // -180..180
  timezone: number; // UTC offset in hours, e.g. 5.5
};

export type ObservationPoint = "topocentric" | "geocentric";
export type Ayanamsha = "lahiri" | "sayana" | "tropical";

/** Optional calculation settings accepted by most endpoints. NOTE a
 * real quirk of this API: the Indian-astrology `/planets` and
 * `/planets/extended` endpoints nest this under a `"settings"` request
 * key, while every other endpoint used here (houses, panchang,
 * dasha, match-making) nests the equivalent object under `"config"`.
 * freeastrologyapi.ts's request builders handle that split — this
 * type is just the shared field set. */
export type AstrologySettings = {
  observation_point?: ObservationPoint;
  ayanamsha?: Ayanamsha;
  language?: string;
};

export type WesternHouseSystem =
  | "Porphyry" | "Placidus" | "Koch" | "Whole Signs" | "Regiomontanus" | "Vehlow";

export type WesternHousesSettings = AstrologySettings & {
  house_system?: WesternHouseSystem;
};

// ---------------------------------------------------------------------
// Planets — POST /planets/extended
// (also documents /planets, used nowhere in this file — extended is
// strictly more useful: it adds house_number and nakshatra fields the
// basic endpoint omits, which derive.ts needs)
// ---------------------------------------------------------------------

export type PlanetName =
  | "Ascendant" | "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter"
  | "Venus" | "Saturn" | "Rahu" | "Ketu" | "Uranus" | "Neptune" | "Pluto";

export type PlanetExtendedEntry = {
  current_sign: number; // 1-12, sidereal zodiac sign number
  house_number: number; // 1-12, whole-sign house counted from the Ascendant
  fullDegree: number; // 0-360, absolute sidereal longitude
  normDegree: number; // 0-30, degree within current_sign
  isRetro: "true" | "false"; // yes, a string, not a boolean — real API quirk
  degrees: number;
  minutes: number;
  seconds: number;
  localized_name: string;
  zodiac_sign_name: string;
  zodiac_sign_lord: string;
  nakshatra_number: number; // 1-27
  nakshatra_name: string;
  nakshatra_pada: number; // 1-4
  nakshatra_vimsottari_lord: string;
};

export type PlanetPositionsResult = {
  statusCode: number;
  output: Partial<Record<PlanetName, PlanetExtendedEntry>>;
};

// ---------------------------------------------------------------------
// Western houses — POST /western/houses
// Tropical/Western house cusps — a different system from Vedic whole-
// sign houses (which come from PlanetExtendedEntry.house_number above).
// Kept distinct on purpose; do not conflate the two.
// ---------------------------------------------------------------------

export type WesternHouseEntry = {
  House: number; // 1-12
  degree: number; // 0-360
  normDegree: number; // 0-30
  zodiac_sign: { number: number; name: Record<string, string> }; // name is keyed by language code, e.g. { en: "Taurus" }
};

export type WesternHousesResult = {
  statusCode: number;
  output: { Houses: WesternHouseEntry[] };
};

// ---------------------------------------------------------------------
// Panchang — composed from the many small single-purpose endpoints
// below (the old single "complete-panchang" endpoint is documented as
// deprecated/no longer supported — see freeastrologyapi.ts).
// ---------------------------------------------------------------------

export type TithiResult = {
  number: number; // 1-30
  name: string;
  paksha: "shukla" | "krishna";
  completes_at: string; // "YYYY-MM-DD HH:mm:ss[.ffffff]", in the request's local timezone
  left_precentage?: number; // sic — real API field name, not a typo introduced here
};

export type NakshatraDurationResult = {
  number: number; // 1-27
  name: string;
  starts_at: string;
  ends_at: string;
  remaining_percentage_at_given_time?: number;
};

export type YogaDurationEntry = {
  number: number;
  name: string;
  completion: string;
  yoga_left_percentage?: number;
};
/** Keyed "1", "2", ... — the yoga active at the requested time plus
 * whichever follow it later the same calendar day. */
export type YogaDurationsResult = Record<string, YogaDurationEntry>;

export type KaranaDurationEntry = {
  number: number; // 1-60
  name: string;
  completion: string;
  karana_left_percentage?: number;
};
export type KaranaDurationsResult = Record<string, KaranaDurationEntry>;

export type SunriseSunsetResult = {
  statusCode: number;
  output: { sun_rise_time: string; sun_set_time: string }; // "H:mm:ss", local time, no date part
};

export type VedicWeekdayResult = {
  statusCode: number;
  output: {
    weekday_number: number; // 0/1-based Gregorian weekday
    weekday_name: string;
    vedic_weekday_number: number;
    vedic_weekday_name: string; // "vara" — the weekday used for panchang purposes
  };
};

export type TimeWindow = { starts_at: string; ends_at: string };

export type HoraEntry = TimeWindow & { lord: string };
/** Keyed "1".."24" — one entry per planetary hour of the day. */
export type HoraResult = Record<string, HoraEntry>;

export type ChoghadiyaEntry = TimeWindow & { name: string };
/** Keyed "1".."16" (roughly 8 day + 8 night periods, count varies with
 * day length). */
export type ChoghadiyaResult = Record<string, ChoghadiyaEntry>;

/** dur-muhurat and varjyam can each occur more than once in a day —
 * both endpoints return either a single {starts_at, ends_at} object or
 * a "1", "2", ...-keyed object of several, depending on the date.
 * Callers should normalize with Object.values() when keyed. */
export type DurMuhuratResult = TimeWindow | Record<string, TimeWindow>;
export type VarjyamResult = TimeWindow | Record<string, TimeWindow>;

/** The composed result returned by getPanchang() — one call site
 * fanning out to the single-purpose endpoints above, since
 * complete-panchang is deprecated. Field coverage matches this
 * project's panchang feature spec: tithi, vara, nakshatra, yoga,
 * karana, sunrise/sunset, rahu kalam, yama gandam, gulika, dur
 * muhurat, varjyam, hora, choghadiya. */
export type PanchangResult = {
  sunrise: SunriseSunsetResult["output"];
  weekday: VedicWeekdayResult["output"]; // vara
  tithi: TithiResult;
  nakshatra: NakshatraDurationResult;
  yoga: YogaDurationsResult;
  karana: KaranaDurationsResult;
  rahuKalam: TimeWindow;
  yamaGandam: TimeWindow;
  gulikaKalam: TimeWindow;
  durMuhurat: DurMuhuratResult;
  varjyam: VarjyamResult;
  hora: HoraResult;
  choghadiya: ChoghadiyaResult;
};

// ---------------------------------------------------------------------
// Vimshottari Dasha — POST /vimsottari/maha-dasas and
// POST /vimsottari/maha-dasas-and-antar-dasas
// ---------------------------------------------------------------------

export type MahaDashaEntry = { Lord: string; start_time: string; end_time: string };
/** Keyed "1", "2", ... in chronological order. */
export type VimshottariMahaDashaResult = Record<string, MahaDashaEntry>;

export type DashaPeriod = { start_time: string; end_time: string };
/** Keyed by antar-dasha lord name (e.g. "Sun", "Moon", ...). */
export type AntarDashaMap = Record<string, DashaPeriod>;
/** Keyed by maha-dasha lord name; each value is that maha-dasha's
 * antar-dasha timeline. Note this response shape (unlike
 * VimshottariMahaDashaResult above) has no separate "Lord" field —
 * the maha-dasha lord IS the outer key. */
export type VimshottariDashaResult = Record<string, AntarDashaMap>;

// ---------------------------------------------------------------------
// Ashtakoot / Guna-Milan match-making —
// POST /match-making/ashtakoot-score
// ---------------------------------------------------------------------

export type AshtakootMatchConfig = {
  observation_point?: ObservationPoint;
  ayanamsha?: Ayanamsha;
  language?: "en" | "te" | "hi";
};

export type AshtakootMatchResult = {
  statusCode: number;
  output: {
    out_of: 36;
    total_score: number;
    // Varna (max 1)
    varna_kootam: {
      bride: { moon_sign_number: number; moon_sign: string; varnam: number; varnam_name: string };
      groom: { moon_sign_number: number; moon_sign: string; varnam: number; varnam_name: string };
      out_of: number;
      score: number;
    };
    // Vashya (max 2) — real field name is "vasya_kootam"
    vasya_kootam: {
      bride: { bride_kootam: number; bride_kootam_name: string };
      groom: { groom_kootam: number; groom_kootam_name: string };
      out_of: number;
      score: number;
    };
    // Tara (max 3)
    tara_kootam: {
      bride: { star_number: number; star_name: string };
      groom: { star_number: number; star_name: string };
      out_of: number;
      score: number;
    };
    // Yoni (max 4)
    yoni_kootam: {
      bride: { star: number; yoni_number: number; yoni: string };
      groom: { star: number; yoni_number: number; yoni: string };
      out_of: number;
      score: number;
    };
    // Graha Maitri (max 5)
    graha_maitri_kootam: {
      bride: { moon_sign_number: number; moon_sign: string; moon_sign_lord: number; moon_sign_lord_name: string };
      groom: { moon_sign_number: number; moon_sign: string; moon_sign_lord: number; moon_sign_lord_name: string };
      out_of: number;
      score: number;
    };
    // Gana (max 6) — real field name is "gana_kootam" but the bride/groom
    // sub-fields are (confusingly, per the real API) named "*_nadi"/"*_nadi_name"
    gana_kootam: {
      bride: { bride_nadi: number; bride_nadi_name: string };
      groom: { groom_nadi: number; groom_nadi_name: string };
      out_of: number;
      score: number;
    };
    // Bhakoot (max 7) — real field name is "rasi_kootam"
    rasi_kootam: {
      bride: { moon_sign: number; moon_sign_name: string };
      groom: { moon_sign: number; moon_sign_name: string };
      out_of: number;
      score: number;
    };
    // Nadi (max 8) — real field name is "nadi_kootam"
    nadi_kootam: {
      bride: { nadi: number; nadi_name: string };
      groom: { nadi: number; nadi_name: string };
      out_of: number;
      score: number;
    };
  };
};

// ---------------------------------------------------------------------
// Kundli chart (Rasi/D1 chart visualization) — POST
// /horoscope-chart-svg-code and POST /horoscope-chart-url. The docs
// site publishes no example response body for either endpoint
// (request-only examples) — VERIFIED by a real direct call (2026-09,
// see the free-kundli tool's dev smoke test) rather than guessed:
//
// Both endpoints return the SAME plain envelope shape as the
// already-plain endpoints above (getPlanetPositions, getSunriseSunset,
// etc.) — `{ statusCode: number; output: string }` — and NOT the
// double-JSON-encoded-string shape of the tithi/nakshatra/rahu-kalam/
// dasha family (confirmed: for /horoscope-chart-svg-code, `output` is
// literal SVG markup starting with `"<svg width=\"400\" ..."`, which is
// not valid JSON and fails JSON.parse — there is nothing further to
// unwrap). So both wrapper functions in freeastrologyapi.ts correctly
// use the plain `callFreeAstrologyApi`, not `callFreeAstrologyApiUnwrapped`.
//
// The two endpoints differ only in what `output` contains:
//  - /horoscope-chart-svg-code: `output` is a self-contained inline SVG
//    string (a Rasi/D1 chart; verified ~3.5KB, fixed width="400"
//    height="400", no viewBox, its own embedded <defs>/<style> for a
//    Google Font import, no <script> tag) — safe to render inline via
//    dangerouslySetInnerHTML, and CSS (`svg { width:100%; height:auto }`
//    on a wrapping selector) can make it responsive since the fixed
//    width/height are presentation attributes, not a viewBox.
//  - /horoscope-chart-url: `output` is a hosted HTTPS URL string (an S3
//    URL, e.g. "https://jyotish-software.s3.ap-south-1.amazonaws.com/
//    Chart_<id>.svg") serving that same chart as a standalone .svg file
//    — usable directly as an <img src>.
// ---------------------------------------------------------------------

export type KundliChartSvgResult = {
  statusCode: number;
  /** Literal inline SVG markup, e.g. `"<svg width=\"400\" ...>...</svg>"`. */
  output: string;
};

export type KundliChartUrlResult = {
  statusCode: number;
  /** A hosted image URL, e.g.
   * "https://jyotish-software.s3.ap-south-1.amazonaws.com/Chart_....svg". */
  output: string;
};
