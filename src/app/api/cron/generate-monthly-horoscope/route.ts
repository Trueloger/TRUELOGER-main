import { NextResponse } from "next/server";
import { getOrGenerateMonthlyHoroscopes } from "@/lib/horoscope/store";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const doc = await getOrGenerateMonthlyHoroscopes();
    return NextResponse.json({
      monthKey: doc.monthKey,
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
