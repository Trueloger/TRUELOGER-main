import { NextResponse } from "next/server";
import { getTodayIST } from "@/lib/horoscope/date";
import { getOrGenerateDailyPanchang } from "@/lib/panchang/store";

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
    const date = getTodayIST();
    const doc = await getOrGenerateDailyPanchang(date);
    if (!doc) {
      return NextResponse.json(
        { error: `Failed to generate or read daily panchang for ${date}` },
        { status: 500 }
      );
    }
    return NextResponse.json({
      date: doc.date,
      generatedAt: doc.generatedAt,
      source: doc.source,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
