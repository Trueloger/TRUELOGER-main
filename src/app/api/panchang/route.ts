// src/app/api/panchang/route.ts
//
// GET, not POST — deliberately different from every other tool route in
// this codebase. Panchang takes no personal data (just a calendar
// date), the result is identical for every visitor asking for the same
// date, and it's served from an archive (see src/lib/panchang/store.ts)
// — that's exactly the shape GET + query params is for: a cacheable,
// idempotent read of a resource identified by its URL.
//
// This route is a thin wrapper over the read-through store — it does
// NOT call any external astrology API (the engine is fully local, see
// src/lib/panchang/calculate.ts). Panchang is generated at most once per
// date by src/app/api/cron/generate-panchang/route.ts (or on-demand,
// via getOrGenerateDailyPanchang, if a visitor requests a date the cron
// hasn't reached yet) and archived in Firestore. Because generation no
// longer depends on a metered external API, this route accepts any date
// from 1900-01-01 through one year ahead of today — past dates for
// historical browsing, future dates so festivals/vrats can be looked up
// in advance.
import { NextResponse } from "next/server";
import { getOrGenerateDailyPanchang, getOrGenerateYearFestivals } from "@/lib/panchang/store";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit/firestore-rate-limit";
import { getTodayIST } from "@/lib/horoscope/date";

// Most requests are 1-2 cheap Firestore reads (fast); the rare
// "date not yet archived" path computes it locally in-process — still
// well under a second, but keep some headroom.
export const maxDuration = 30;

const LOOKAHEAD_DAYS = 365;
const MIN_YEAR = 1900;

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

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  // Rate-limit first. This is now a cheap Firestore read for the
  // overwhelming majority of requests (not a live external call), so
  // the limit can be more generous than before — it's still here to
  // protect against abuse of the Firestore reads themselves.
  const identifier = getClientIdentifier(request);
  const rateLimit = await checkRateLimit("panchang", identifier, {
    limit: 30,
    windowSeconds: 60,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests right now. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  const url = new URL(request.url);
  // "Today" is resolved in IST (Asia/Kolkata), matching the same
  // IST-rollover rule the rest of the site already uses for "today's"
  // content (src/lib/horoscope/date.ts).
  const dateParam = url.searchParams.get("date")?.trim() || getTodayIST();

  if (!isValidCalendarDate(dateParam)) {
    return NextResponse.json(
      { error: "Please provide a valid date in YYYY-MM-DD format." },
      { status: 400 }
    );
  }
  if (Number(dateParam.slice(0, 4)) < MIN_YEAR) {
    return NextResponse.json({ error: `Please choose a date from ${MIN_YEAR} onward.` }, { status: 400 });
  }

  const today = getTodayIST();
  const maxDate = addDays(today, LOOKAHEAD_DAYS);
  if (dateParam > maxDate) {
    return NextResponse.json(
      { error: `Please choose a date up to ${maxDate} — Panchang is only archived up to a year ahead.` },
      { status: 400 }
    );
  }

  let doc;
  try {
    doc = await getOrGenerateDailyPanchang(dateParam);
  } catch (err) {
    console.error(
      "[panchang] getOrGenerateDailyPanchang failed:",
      err instanceof Error ? err.message : "unknown error"
    );
    return NextResponse.json(
      { error: "We couldn't compute Panchang for this date right now. Please try again shortly." },
      { status: 502 }
    );
  }

  if (!doc) {
    return NextResponse.json(
      { error: "Panchang for this date isn't available in our archive." },
      { status: 404 }
    );
  }

  // Festivals/vrats falling on this exact date, from that year's
  // archived list (generated once per year — see store.ts). A failure
  // here never hides the real Panchang data above.
  let festivalsToday: unknown[] = [];
  try {
    const year = Number(dateParam.slice(0, 4));
    const yearDoc = await getOrGenerateYearFestivals(year);
    festivalsToday = yearDoc.festivals.filter((f) => f.date === dateParam);
  } catch (err) {
    console.error(
      "[panchang] festival lookup failed:",
      err instanceof Error ? err.message : "unknown error"
    );
  }

  return NextResponse.json({
    date: doc.date,
    source: doc.source,
    generatedAt: doc.generatedAt,
    engineVersion: doc.engineVersion,
    sunrise: doc.panchang.sunrise,
    sunset: doc.panchang.sunset,
    panchang: doc.panchang,
    festivals: festivalsToday,
  });
}
