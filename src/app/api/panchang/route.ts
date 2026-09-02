// src/app/api/panchang/route.ts
//
// GET, not POST — deliberately different from every other tool route in
// this codebase. Panchang takes no personal data (just a calendar
// date), the result is identical for every visitor asking for the same
// date, and it's served from a daily-generated archive (see
// src/lib/panchang/store.ts) — that's exactly the shape GET + query
// params is for: a cacheable, idempotent read of a resource identified
// by its URL. It also means the URL itself is shareable/bookmarkable
// (?date=...).
//
// This route is a thin wrapper over the read-through store — it does
// NOT call FreeAstrologyAPI directly. Panchang is generated at most
// once per IST date by src/app/api/cron/generate-panchang/route.ts (or
// on-demand for *today* only, via getOrGenerateDailyPanchang, if a
// visitor arrives before that day's cron has run) and archived in
// Firestore. A past date with nothing archived is a clean 404, never a
// live API call — see store.ts's header comment for why (the shared
// 50-req/day FreeAstrologyAPI budget across every tool on this site).
import { NextResponse } from "next/server";
import { getOrGenerateDailyPanchang } from "@/lib/panchang/store";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit/firestore-rate-limit";
import { getTodayIST } from "@/lib/horoscope/date";

// Most requests are a single Firestore read (fast); the rare "today,
// not yet generated" path fans out to 13 FreeAstrologyAPI calls — keep
// some headroom for that case.
export const maxDuration = 30;

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
  // `city` is no longer meaningful — Panchang is now generated once
  // daily for a single fixed reference location (see store.ts). Old
  // links carrying a `city` param are accepted harmlessly rather than
  // erroring, just silently ignored; it's not advertised in the new
  // contract.

  if (!isValidCalendarDate(dateParam)) {
    return NextResponse.json(
      { error: "Please provide a valid date in YYYY-MM-DD format." },
      { status: 400 }
    );
  }

  const today = getTodayIST();
  if (dateParam > today) {
    return NextResponse.json(
      { error: "Please choose today or a past date — future Panchang isn't available." },
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
      { error: "We couldn't fetch today's Panchang right now. Please try again shortly." },
      { status: 502 }
    );
  }

  if (!doc) {
    return NextResponse.json(
      { error: "Panchang for this date isn't available in our archive." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    date: doc.date,
    source: doc.source,
    generatedAt: doc.generatedAt,
    sunrise: doc.panchang.sunrise.sun_rise_time,
    sunset: doc.panchang.sunrise.sun_set_time,
    panchang: doc.panchang,
  });
}
