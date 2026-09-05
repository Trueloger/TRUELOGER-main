import { NextResponse } from "next/server";
import { getTodayIST } from "@/lib/horoscope/date";
import { ensureDailyCoverage, ensureYearFestivalsCoverage } from "@/lib/panchang/store";

// Never statically evaluate this route — it must run fresh on every
// invocation (both the daily cron trigger and any manual check).
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = getTodayIST();

    // 1. Keep the daily archive topped up ~1 year ahead of today.
    //    Normally generates exactly 1 new day (yesterday's run already
    //    covered today+365); capped so a missed-run catch-up can never
    //    blow this function's duration budget (see store.ts).
    const daysGenerated = await ensureDailyCoverage(today);

    // 2. Keep this year's and next year's festival/vrat lists archived.
    //    Almost always a no-op (2 cheap doc reads) — the actual
    //    generation only fires the (rare) day a new year first becomes
    //    relevant, which is exactly the "auto-update on Jan 1" behavior.
    const yearsGenerated = await ensureYearFestivalsCoverage(today);

    return NextResponse.json({
      date: today,
      daysGenerated,
      yearsGenerated,
    });
  } catch (error) {
    console.error("[cron/generate-panchang] failed:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
