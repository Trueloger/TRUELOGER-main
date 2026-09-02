// src/app/api/panchang/route.ts
//
// GET, not POST — deliberately different from every other tool route in
// this codebase. Panchang takes no personal data (just a calendar date
// + a city name), the result is identical for every visitor asking for
// the same date+city, and it's cached server-side for 24h (see
// getOrCompute below) — that's exactly the shape GET + query params is
// for: a cacheable, idempotent read of a resource identified by its
// URL. It also means the URL itself is shareable/bookmarkable
// (?date=...&city=...), which a POST body never is.
import { NextResponse } from "next/server";
import { getPanchang } from "@/lib/astrology/freeastrologyapi";
import { resolveCityCoordinates } from "@/lib/astrology/geocode";
import { getOrCompute } from "@/lib/cache/firestore-cache";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit/firestore-rate-limit";
import { getTodayIST } from "@/lib/horoscope/date";
import type { PanchangResult } from "@/lib/astrology/types";

// A cache miss fans out to 13 FreeAstrologyAPI calls in parallel (see
// getPanchang) — slower than a typical single-endpoint call, so this
// route needs real headroom even though most requests will be
// near-instant cache hits.
export const maxDuration = 30;

// This site's audience is overwhelmingly Indian and geocode.ts only
// resolves Indian cities (all sharing one UTC+5:30 offset) — New Delhi
// as the shared "just works" default keeps the first paint immediate
// without asking the visitor for anything.
const DEFAULT_CITY = "New Delhi";

// Panchang timings (tithi/nakshatra/yoga/karana boundaries, hora,
// choghadiya, muhurats) are date+location based — there is no "time of
// birth" input for this tool. FreeAstrologyAPI's endpoints still require
// an hours/minutes/seconds field, so a fixed reference time is used for
// every request. Panchang elements are traditionally reckoned starting
// from sunrise, and 06:00 local sits close to sunrise across the
// supported cities/seasons while staying safely inside the requested
// calendar date on both sides (unlike midnight, which risks the API
// resolving tithi/nakshatra boundaries for the tail end of the previous
// day in some edge cases) — a deliberate, documented choice, not an
// arbitrary one.
const REFERENCE_HOUR = 6;

function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export async function GET(request: Request) {
  // Rate-limit first — protects against abuse even though the cache
  // absorbs repeat legitimate traffic for the same date+city.
  const identifier = getClientIdentifier(request);
  const rateLimit = await checkRateLimit("panchang", identifier, {
    limit: 20,
    windowSeconds: 60,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests right now. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  const url = new URL(request.url);
  const cityParam = url.searchParams.get("city")?.trim() || DEFAULT_CITY;
  // "Today" is resolved in IST (Asia/Kolkata) rather than the server's
  // own timezone — every city this tool supports shares that one UTC
  // offset (see geocode.ts), so there is no per-city timezone to branch
  // on, and this matches the same IST-rollover rule the rest of the site
  // already uses for "today's" content (src/lib/horoscope/date.ts).
  const dateParam = url.searchParams.get("date")?.trim() || getTodayIST();

  if (!isValidCalendarDate(dateParam)) {
    return NextResponse.json(
      { error: "Please provide a valid date in YYYY-MM-DD format." },
      { status: 400 }
    );
  }

  // Never fabricate coordinates — a miss here is a hard 400, not a guess.
  const coords = resolveCityCoordinates(cityParam);
  if (!coords) {
    return NextResponse.json(
      {
        error: `We don't recognize "${cityParam}" yet — try a nearby major city.`,
      },
      { status: 400 }
    );
  }

  const [year, month, date] = dateParam.split("-").map(Number);
  // Cache key is normalized (lowercase/trimmed) so "Mumbai" and "mumbai"
  // share one cache entry; the response still echoes back the visitor's
  // own casing via cityParam below.
  const normalizedCityKey = cityParam.trim().toLowerCase();

  let panchang: PanchangResult;
  try {
    panchang = await getOrCompute(
      "panchang",
      { date: dateParam, city: normalizedCityKey },
      86400, // 24h — a given date's Panchang never changes once computed
      () =>
        getPanchang({
          year,
          month,
          date,
          hours: REFERENCE_HOUR,
          minutes: 0,
          seconds: 0,
          latitude: coords.lat,
          longitude: coords.lon,
          timezone: coords.timezone,
        })
    );
  } catch (err) {
    console.error(
      "[panchang] getPanchang failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    return NextResponse.json(
      { error: "We couldn't fetch today's Panchang right now. Please try again shortly." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    date: dateParam,
    city: cityParam,
    sunrise: panchang.sunrise.sun_rise_time,
    sunset: panchang.sunrise.sun_set_time,
    panchang,
  });
}
