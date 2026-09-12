"use client";

// src/app/reports/[reportId]/page.tsx
// The purchased-report reader. Ownership is enforced entirely server
// side by `GET /api/reports/:id` (404 for anyone but the owner/admin —
// see that route's own doc comment) — this page just renders that
// outcome gracefully, never adding its own separate check.
//
// Combines an initial `authedFetch` (fast, ownership-checked content)
// with a live Firestore `onSnapshot` listener on `reports/{reportId}`
// (allowed by firestore.rules' existing owner/admin read rule) so a
// report that transitions PURCHASED -> ... -> READY while the user is
// sitting on this page updates automatically — no manual refresh,
// mirroring src/app/account/orders/[id]/confirmation/page.tsx's
// established pattern for the same kind of "watch a document finish
// processing" page.
import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { ArrowLeft, Download, FileQuestion, RefreshCw, Sparkles } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { firestoreDb } from "@/lib/firebase-client";
import { getReportBlueprint } from "@/lib/reports/products";
import { reportStageLabel } from "@/lib/reports/types";
import type { Report } from "@/lib/reports/types";
import { ReportCover } from "@/components/reports/ReportCover";
import { ReportTableOfContents } from "@/components/reports/ReportTableOfContents";
import { ReportSection } from "@/components/reports/ReportSection";
import { ReportDisclaimer } from "@/components/reports/ReportDisclaimer";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "not-found" }
  | { status: "ready"; report: Report };

export default function ReportReaderPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = use(params);
  return (
    <ProtectedRoute>
      <ReportReaderContent reportId={reportId} />
    </ProtectedRoute>
  );
}

function ReportReaderContent({ reportId }: { reportId: string }) {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await authedFetch(`/api/reports/${reportId}`);
      if (res.status === 404) {
        setState({ status: "not-found" });
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load report.");
      }
      const data = (await res.json()) as { report: Report };
      setState({ status: "ready", report: data.report });
    } catch {
      setState({
        status: "error",
        message: "We couldn't load this report right now. Please try again.",
      });
    }
  }, [reportId]);

  // Ref-guarded so the initial fetch fires once per distinct reportId —
  // same pattern as /account/orders/[id]/page.tsx.
  const lastLoadedId = useRef<string | null>(null);
  useEffect(() => {
    if (lastLoadedId.current === reportId) return;
    lastLoadedId.current = reportId;
    load();
  }, [reportId, load]);

  // Live listener layered on top — only meaningfully useful while the
  // report might still change (i.e. we already have SOME reading of
  // it, or the initial fetch found it not-found and it's worth
  // rechecking in case generation just hadn't started). Keeps
  // `setState` calls scoped to updates that actually change what's
  // shown; a snapshot for a document we don't have any confirmed
  // reading of yet is ignored to avoid racing the not-found state.
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(firestoreDb, "reports", reportId),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as Report;
        setState((prev) => {
          // Don't resurrect a listener update after a confirmed 404 —
          // ownership is the API route's call, not this listener's.
          if (prev.status === "not-found") return prev;
          return { status: "ready", report: data };
        });
      },
      () => {
        // Read denied or transient error — leave whatever state we
        // already have (from the authedFetch above) untouched.
      },
    );
    return unsubscribe;
  }, [reportId]);

  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      <div className="mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
        <Link
          href="/account/reports"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-nav-violet hover:text-nav-amethyst-deep"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to My Reports
        </Link>

        {state.status === "loading" && <ReaderLoading />}
        {state.status === "error" && <ReaderError message={state.message} onRetry={load} />}
        {state.status === "not-found" && <ReaderNotFound />}
        {state.status === "ready" && <ReaderBody report={state.report} />}
      </div>
    </main>
  );
}

function ReaderLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center"
    >
      <span className="h-8 w-8 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
      <p className="text-sm text-nav-plum/70">Loading your report…</p>
    </div>
  );
}

function ReaderError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center"
    >
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="flex min-h-11 items-center gap-2 rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep"
      >
        <RefreshCw aria-hidden="true" className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}

function ReaderNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center">
      <FileQuestion aria-hidden="true" strokeWidth={1.5} className="h-10 w-10 text-nav-amethyst-deep" />
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">
        We couldn&apos;t find this report. It may not exist, or it may belong to a different
        account.
      </p>
      <Link
        href="/account/reports"
        className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep"
      >
        Back to My Reports
      </Link>
    </div>
  );
}

function ReaderBody({ report }: { report: Report }) {
  if (report.status === "FAILED") return <ReaderFailed />;
  if (report.status !== "READY") return <ReaderInProgress report={report} />;
  return <ReaderReady report={report} />;
}

function ReaderInProgress({ report }: { report: Report }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-white to-nav-lavender-mist px-6 py-16 text-center shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] sm:rounded-[1.4rem]"
    >
      <span className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute h-12 w-12 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
        <Sparkles aria-hidden="true" className="h-5 w-5 text-nav-amethyst-deep" />
      </span>
      <h1 className="font-serif text-xl text-nav-violet sm:text-2xl">
        Your personalized report is being prepared
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">
        Current stage: {reportStageLabel(report.status)}. This page will update automatically the
        moment it&apos;s ready — there&apos;s nothing else you need to do.
      </p>
    </div>
  );
}

function ReaderFailed() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center">
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">
        Your report is taking longer than expected. Our system is completing the final
        preparation — please check back shortly.
      </p>
      <Link
        href="/account/reports"
        className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep"
      >
        Back to My Reports
      </Link>
    </div>
  );
}

function ReaderReady({ report }: { report: Report }) {
  const [downloading, setDownloading] = useState(false);
  const blueprint = getReportBlueprint(report.productSlug);
  const productName = blueprint?.name ?? report.reportType;
  const completedDate = report.completedAt
    ? new Date(report.completedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : undefined;

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await authedFetch(`/api/reports/${report.id}/pdf`);
      if (!res.ok) throw new Error("Download failed.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TrueLoger-${report.reportType}-report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Silent — nothing destructive happened, the user can retry.
    } finally {
      setDownloading(false);
    }
  }, [report.id, report.reportType]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep disabled:opacity-60"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          {downloading ? "Downloading…" : "Download PDF"}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-nav-lavender-line bg-white shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] sm:rounded-[1.4rem]">
        <ReportCover
          name={report.profileSnapshot.fullName}
          productName={productName}
          date={completedDate}
        />
        <div className="px-4 py-6 sm:px-8">
          <ReportTableOfContents sections={report.sections} />
          <div className="mt-8 flex flex-col gap-10">
            {report.sections.map((section) => (
              <ReportSection key={section.id} section={section} />
            ))}
          </div>
          <div className="mt-10 border-t border-nav-lavender-line pt-6">
            <ReportDisclaimer />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/account/reports"
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-nav-lavender-line bg-white px-6 py-2.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to My Reports
        </Link>
        <Link
          href={`/contact?reportId=${encodeURIComponent(report.id)}&orderId=${encodeURIComponent(report.orderId)}&category=report`}
          className="text-sm font-medium text-nav-amethyst-deep hover:underline"
        >
          Report Support
        </Link>
      </div>
    </div>
  );
}
