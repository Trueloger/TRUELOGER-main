import { NextResponse } from "next/server";
import { getTodayIST } from "@/lib/horoscope/date";
import { getOrGenerateDailyHoroscopes } from "@/lib/horoscope/store";

// Never statically evaluate this route — it must run fresh on every
// invocation (both the daily cron trigger and any manual check).
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const date = getTodayIST();
    const doc = await getOrGenerateDailyHoroscopes(date);
    return NextResponse.json({
      date: doc.date,
      generatedAt: doc.generatedAt,
      signCount: Object.keys(doc.signs).length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
