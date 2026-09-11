// src/app/api/cron/process-reports/route.ts
// The durable report-generation sweep — runs on a schedule (see
// vercel.json) regardless of whether the "immediate kick" in
// orders/store.ts's applyPaymentStatus ever fired (browser closed,
// function recycled, delay > 0, etc.). This is what guarantees a
// report finishes even if nothing else ever calls processReport()
// again (AGENTS §40/§108). Same CRON_SECRET auth pattern as the
// existing cron routes (generate-horoscopes/generate-panchang).
import { NextResponse } from "next/server";
import { listDueReports } from "@/lib/reports/store";
import { processReport } from "@/lib/reports/generate";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await listDueReports(Date.now(), 5);
  const results: { reportId: string; ok: boolean; error?: string }[] = [];

  // Sequential, not Promise.all — each report's generation can involve
  // several OpenRouter calls; running them concurrently within one
  // invocation risks blowing the function's own time/rate budget for
  // no real benefit (the NEXT cron tick, a few minutes later, is
  // already the mechanism for parallelizing across reports over time).
  for (const report of due) {
    try {
      await processReport(report.id);
      results.push({ reportId: report.id, ok: true });
    } catch (err) {
      results.push({ reportId: report.id, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
