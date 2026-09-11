// src/app/api/internal/process-report/route.ts
// Internal, secret-gated report-processing tick — NOT a public API
// (never called from the browser). Two callers:
//   1. orders/store.ts's applyPaymentStatus, right after a report job
//      is created — an unawaited, best-effort fetch (not the
//      synchronous processReport() call this used to be), so the
//      short maxDuration on the payment verify/webhook routes never
//      bounds actual report-generation work.
//   2. Itself — if a tick finishes with sections still pending, it
//      fires ANOTHER fetch to this same route before returning,
//      continuing the chain until the report reaches a terminal
//      state. This is what makes REPORT_DELIVERY_DELAY_HOURS=0 feel
//      genuinely immediate without depending on cron frequency —
//      Vercel's Hobby tier caps cron at once per day, far too slow to
//      finish a 15-20 section report on its own. The cron sweep
//      (/api/cron/process-reports) remains a SAFETY NET that catches
//      any report whose chain died (a crashed function, a deploy
//      mid-flight) rather than the primary engine.
// Auth: reuses CRON_SECRET as a shared internal-call secret — same
// trust boundary as the existing cron routes, just invoked via POST
// instead of a schedule.
import { NextResponse } from "next/server";
import { getReport } from "@/lib/reports/store";
import { processReport } from "@/lib/reports/generate";
import { triggerReportProcessing } from "@/lib/reports/trigger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Deliberately excludes "SCHEDULED" — a report still SCHEDULED after a
// tick means its scheduledAt hasn't arrived yet (production's 6-hour
// delay), not that work is actively in progress. Self-chaining on that
// would just hammer this route in a tight loop until the delay
// elapses; the cron sweep is the correct mechanism for that wait, not
// this chain.
const ACTIVELY_PROCESSING_STATUSES = new Set(["GENERATING", "RENDERING"]);

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const { reportId } = (body as { reportId?: unknown }) ?? {};
  if (typeof reportId !== "string" || !reportId) {
    return NextResponse.json({ error: "reportId is required." }, { status: 400 });
  }

  await processReport(reportId).catch(() => {});

  const after = await getReport(reportId);
  if (after && ACTIVELY_PROCESSING_STATUSES.has(after.status)) {
    // More work remains — continue the chain rather than leaving it to
    // the next (possibly once-a-day) cron tick.
    triggerReportProcessing(reportId);
  }

  return NextResponse.json({ ok: true, status: after?.status ?? "unknown" });
}
