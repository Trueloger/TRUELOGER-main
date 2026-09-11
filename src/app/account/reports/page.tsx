"use client";

// src/app/account/reports/page.tsx
// /account/reports — the signed-in user's own purchased personalized
// reports. Replaces the previous deliberate empty-state-only placeholder
// (see git history) now that real report-generation infrastructure
// exists (src/lib/reports/*, src/app/api/reports/*).
//
// Fetches `GET /api/reports` for the initial list (already scoped
// server-side to the caller's uid — see src/app/api/reports/route.ts),
// then layers a live Firestore `onSnapshot` listener per report on top
// so a report's status/pageCount updates the instant generation
// progresses, without a manual refresh — the same push-based pattern
// src/app/account/orders/[id]/confirmation/page.tsx already uses for
// orders. A handful of small per-user listeners is cheap and simpler
// here than a shared periodic re-fetch.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { Download, FileText, RefreshCw, Sparkles } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { firestoreDb } from "@/lib/firebase-client";
import { getReportBlueprint } from "@/lib/reports/products";
import { reportStageLabel } from "@/lib/reports/types";
import type { Report, ReportStatus, ReportType } from "@/lib/reports/types";

/** What `GET /api/reports` actually returns per item — see the route's
 * own doc comment for why this is a summary, not the full document. */
type ReportSummary = {
  id: string;
  reportType: ReportType;
  productSlug: string;
  status: ReportStatus;
  createdAt: number;
  scheduledAt: number;
  completedAt?: number;
  pageCount?: number;
};

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; reports: ReportSummary[] };

export default function AccountReportsPage() {
  return (
    <ProtectedRoute>
      <AccountReportsContent />
    </ProtectedRoute>
  );
}

function AccountReportsContent() {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await authedFetch("/api/reports");
      if (!res.ok) {
        throw new Error("Failed to load reports.");
      }
      const data = (await res.json()) as { reports: ReportSummary[] };
      const sorted = [...data.reports].sort((a, b) => b.createdAt - a.createdAt);
      setState({ status: "ready", reports: sorted });
    } catch {
      setState({
        status: "error",
        message: "We couldn't load your reports right now. Please try again.",
      });
    }
  }, []);

  // Ref-guarded so this fires exactly once on mount — same pattern as
  // /account/orders/page.tsx.
  const hasLoaded = useRef(false);
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    load();
  }, [load]);

  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      <div className="mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
        <header className="mb-8 md:mb-10">
          <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Your Reports</h1>
          <p className="mt-1.5 text-sm text-nav-plum/70">
            Your personalized astrology reports — track progress and read or download them here
            once ready.
          </p>
        </header>

        {state.status === "loading" && <ReportsLoading />}
        {state.status === "error" && <ReportsError message={state.message} onRetry={load} />}
        {state.status === "ready" && state.reports.length === 0 && <ReportsEmpty />}
        {state.status === "ready" && state.reports.length > 0 && (
          <ul className="flex flex-col gap-4">
            {state.reports.map((report) => (
              <li key={report.id}>
                <ReportCard initial={report} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function ReportsLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center"
    >
      <span className="h-8 w-8 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
      <p className="text-sm text-nav-plum/70">Loading your reports…</p>
    </div>
  );
}

function ReportsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center"
    >
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="flex min-h-11 items-center gap-2 rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl"
      >
        <RefreshCw aria-hidden="true" className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}

function ReportsEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center">
      <FileText aria-hidden="true" strokeWidth={1.5} className="h-10 w-10 text-nav-amethyst-deep" />
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">
        You haven&apos;t purchased a personalized report yet.
      </p>
      <Link
        href="/reports/personalized"
        className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep"
      >
        Explore Personalized Reports
      </Link>
    </div>
  );
}

/** Report display name — prefer the catalogue's real product name
 * (e.g. "Love & Relationship Report"), falling back to a title-cased
 * raw type only if the product lookup somehow misses. */
function reportDisplayName(productSlug: string, reportType: ReportType): string {
  const blueprint = getReportBlueprint(productSlug);
  if (blueprint) return blueprint.name;
  return reportType
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** One report row — layers a live Firestore listener on top of the
 * initial API summary so status/pageCount/completedAt update in real
 * time while generation is in progress. Falls back silently to the
 * initial summary if the listener errors (e.g. a transient read
 * issue) — the API-provided data is never worse than what's shown. */
function ReportCard({ initial }: { initial: ReportSummary }) {
  const [live, setLive] = useState<ReportSummary>(initial);

  useEffect(() => {
    // No need to keep listening once a report has reached a terminal
    // state — READY/FAILED/CANCELLED won't change again.
    if (live.status === "READY" || live.status === "FAILED" || live.status === "CANCELLED") return;

    const unsubscribe = onSnapshot(
      doc(firestoreDb, "reports", initial.id),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as Report;
        setLive({
          id: initial.id,
          reportType: data.reportType,
          productSlug: data.productSlug,
          status: data.status,
          createdAt: data.createdAt,
          scheduledAt: data.scheduledAt,
          completedAt: data.completedAt,
          pageCount: data.pageCount,
        });
      },
      () => {
        // Read denied or transient error — keep showing whatever we
        // already had rather than surfacing an error for a list item.
      },
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-subscribe when the report id changes; `live.status` is read to decide whether to (re)subscribe at all, not to drive it.
  }, [initial.id]);

  const isReady = live.status === "READY";
  const name = reportDisplayName(live.productSlug, live.reportType);
  const deliveryHours = Math.max(0, Math.round((live.scheduledAt - live.createdAt) / (60 * 60 * 1000)));

  return (
    <div className="group relative rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-white to-nav-lavender-mist p-4 shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] sm:rounded-[1.4rem] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-serif text-base text-nav-violet sm:text-lg">{name}</p>
          <p className="mt-0.5 text-xs text-nav-plum/60">Purchased {formatDate(live.createdAt)}</p>
        </div>
        <StatusBadge status={live.status} />
      </div>

      <p className="mt-3 text-sm text-nav-plum/80">
        {isReady ? (
          <>
            Ready to read{live.pageCount ? ` · ${live.pageCount} pages` : ""}
            {live.completedAt ? ` · completed ${formatDate(live.completedAt)}` : ""}
          </>
        ) : live.status === "FAILED" ? (
          "Our system is completing the final preparation."
        ) : (
          <>
            {reportStageLabel(live.status)} · Within {deliveryHours} hour{deliveryHours === 1 ? "" : "s"} of purchase
          </>
        )}
      </p>

      <div className="mt-4 flex flex-wrap gap-3 border-t border-nav-lavender-line pt-3">
        <Link
          href={`/reports/${live.id}`}
          className="flex min-h-9 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-4 py-1.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
        >
          View Report
        </Link>
        {isReady && <DownloadButton reportId={live.id} reportType={live.reportType} />}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const isReady = status === "READY";
  const isFailed = status === "FAILED";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium ring-1 ${
        isReady
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : isFailed
            ? "bg-nav-lavender-soft text-nav-amethyst-deep ring-nav-lavender-line"
            : "bg-amber-50 text-amber-700 ring-amber-200"
      }`}
    >
      {!isReady && !isFailed && (
        <Sparkles aria-hidden="true" className="h-3 w-3" />
      )}
      {isReady ? "Ready" : reportStageLabel(status)}
    </span>
  );
}

/** Authenticated PDF download — the API route streams the file rather
 * than handing back a signed URL (see its own doc comment), so the
 * client fetches it as a blob and triggers a save via a hidden <a>,
 * the standard pattern for an authenticated client-side download. */
function DownloadButton({ reportId, reportType }: { reportId: string; reportType: ReportType }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await authedFetch(`/api/reports/${reportId}/pdf`);
      if (!res.ok) throw new Error("Download failed.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TrueLoger-${reportType}-report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Silent — the user can simply try again; nothing destructive
      // happened and there's no useful technical detail to surface.
    } finally {
      setDownloading(false);
    }
  }, [reportId, reportType]);

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-nav-amethyst px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-nav-amethyst-deep disabled:opacity-60"
    >
      <Download aria-hidden="true" className="h-3.5 w-3.5" />
      {downloading ? "Downloading…" : "Download PDF"}
    </button>
  );
}
