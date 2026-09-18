// src/lib/reports/trigger.ts
// Fires the internal report-processing tick without blocking the
// caller's response on it — used by orders/store.ts right after a
// report job is created, and by the internal route itself
// (src/app/api/internal/process-report/route.ts) to self-chain further
// ticks. Kept as a plain lib module (not defined inside the route
// file) so it can be imported from non-route code without pulling in
// Next's route-handler machinery.
//
// THE FIX for reports crawling at ~1 tick/day instead of continuously
// self-chaining: a bare fire-and-forget fetch() here used to get
// silently killed the instant the caller's own response was sent —
// Vercel freezes/tears down a serverless function's execution right
// after it returns, with no guarantee an in-flight, un-awaited fetch
// even reaches the network before that happens. That meant only the
// FIRST tick of a report (the one before the caller returns) reliably
// ran; every subsequent self-chained tick was a coin flip, so in
// practice reports only ever advanced when the once-daily cron swept
// them up — a handful of sections per day instead of per minute.
// Wrapping the fetch in `after()` (next/server) schedules it to run
// using the platform's own `waitUntil` (Vercel provides this natively
// for both Route Handlers and the code Route Handlers call into),
// which keeps the function alive long enough for the request to
// actually go out before the invocation ends.
import { after } from "next/server";

export function triggerReportProcessing(reportId: string): void {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const secret = process.env.CRON_SECRET;
  if (!secret) return;
  after(() => {
    return fetch(`${appUrl}/api/internal/process-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ reportId }),
    }).catch(() => {});
  });
}
