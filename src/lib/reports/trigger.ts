// src/lib/reports/trigger.ts
// Fires the internal report-processing tick without waiting for it to
// finish (fire-and-forget) — used by orders/store.ts right after a
// report job is created, and by the internal route itself
// (src/app/api/internal/process-report/route.ts) to self-chain further
// ticks. Kept as a plain lib module (not defined inside the route
// file) so it can be imported from non-route code without pulling in
// Next's route-handler machinery.
export function triggerReportProcessing(reportId: string): void {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const secret = process.env.CRON_SECRET;
  if (!secret) return;
  fetch(`${appUrl}/api/internal/process-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
    body: JSON.stringify({ reportId }),
  }).catch(() => {});
}
