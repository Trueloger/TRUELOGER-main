// src/lib/observability/audit-log.ts
//
// Lightweight, structured request/outcome logging for the chart-calculation
// API routes — intentionally minimal. There is no external logging
// service (Sentry/Datadog/Logtail/etc.) wired into this project yet (see
// .env.example — no such env vars exist), so this just writes one
// parseable JSON object per line to stdout/stderr via console.log /
// console.error, matching Vercel's convention of treating console.error
// as the elevated log level in its function logs. When/if a real logging
// backend is added, this is the one place to plug it in: swap the
// console.* calls below for that service's SDK call, keeping the same
// `logAudit()` call sites and `AuditLogEntry` shape everywhere else.
//
// This is a SUCCESS/request-level audit trail, additive alongside each
// route's existing `console.error("[route] step failed:", message)`
// failure logging (see the comments above each route's try/catch) — it
// does not replace that logging.
//
// NEVER log personal birth data here: no name, date of birth, time of
// birth, city, or coordinates. Only the fields declared in
// `AuditLogEntry` below are ever written.

export type AuditLogEntry = {
  /** Generated per request (crypto.randomUUID()) so a single request's
   * log lines can be correlated with each other. */
  requestId: string;
  /** Route identifier, e.g. "free-kundli", "dasha", "kundli-matching". */
  route: string;
  /** Optional extra context about what kind of calculation this was,
   * e.g. "natal-chart", "two-person-match". */
  calculationType?: string;
  /** Stamped engine version, only when the route actually has one
   * available — omitted rather than invented for routes that don't. */
  engineVersion?: string;
  /** ISO timestamp. */
  timestamp: string;
  outcome: "success" | "calculation_error" | "report_error" | "rate_limited" | "validation_error";
  /** Optional — only recorded where a simple Date.now() delta around the
   * calculation step was easy to capture. */
  durationMs?: number;
};

/** Writes one structured JSON log line for a single API request outcome.
 * `console.log` for "success", `console.error` for every other outcome —
 * mirroring Vercel's log-level convention (console.error surfaces as the
 * elevated/error level in Vercel's function logs). */
export function logAudit(
  entry: Omit<AuditLogEntry, "requestId" | "timestamp"> & { requestId?: string }
): void {
  const fullEntry: AuditLogEntry = {
    ...entry,
    requestId: entry.requestId ?? crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  const line = JSON.stringify(fullEntry);
  if (fullEntry.outcome === "success") {
    console.log(line);
  } else {
    console.error(line);
  }
}
