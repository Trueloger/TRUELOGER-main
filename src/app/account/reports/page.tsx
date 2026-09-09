"use client";

// src/app/account/reports/page.tsx
//
// INTENTIONALLY EMPTY-STATE ONLY, by design, not by omission:
// this site has no "report" data model or report-generation-linked-
// to-order system today. The free tools (Kundli, Numerology, Dasha,
// etc. under src/app/free-kundli, /numerology, /dasha, ...) are free,
// ungated, and never create an order record; a paid consultation
// produces a Meeting outcome (see /account/meetings), not a
// downloadable "report" artifact. There is nothing real to list here
// yet, so this page does NOT fabricate report entries — per the
// "if actual infrastructure doesn't exist, create the proper data/UI
// architecture without pretending" requirement, it instead renders the
// correct page SHAPE (a ready `ReportCard` list container, complete
// with the name/type/date/status/View/Download layout the eventual
// real cards will use) sitting empty behind an honest explanation.
//
// When real report-generation infrastructure exists (e.g. a paid
// consultation later produces a stored PDF/summary), wire its data
// through `authedFetch` here exactly like /account/orders does, feed
// it into `<ReportCard />` below, and delete this comment block.
import Link from "next/link";
import { FileText } from "lucide-react";

type ReportStatus = "ready" | "processing";

/** The shape a real report entry will eventually have. Not populated
 * by any real data source yet — see file header. */
type ReportEntry = {
  id: string;
  name: string;
  type: string;
  date: string;
  status: ReportStatus;
};

/** Deliberately empty — see file header. Kept as a typed constant
 * (not inlined) so the eventual real data source is a one-line swap
 * for this declaration. */
const REPORTS: ReportEntry[] = [];

export default function ReportsPage() {
  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      <div className="mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
        <header className="mb-8 md:mb-10">
          <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Your Reports</h1>
          <p className="mt-1.5 text-sm text-nav-plum/70">
            Reports from your paid consultations and services will appear here once available.
          </p>
        </header>

        {REPORTS.length === 0 ? (
          <ReportsEmpty />
        ) : (
          <ul className="flex flex-col gap-4">
            {REPORTS.map((report) => (
              <li key={report.id}>
                <ReportCard report={report} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function ReportsEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center">
      <FileText aria-hidden="true" strokeWidth={1.5} className="h-10 w-10 text-nav-amethyst-deep" />
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">
        Reports from your paid consultations and services will appear here once available.
      </p>
      <Link
        href="/consult"
        className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep"
      >
        Book a Consultation
      </Link>
    </div>
  );
}

/** Ready to render a real report once the infrastructure exists — not
 * used today (see file header), kept here so the eventual real data
 * wiring only needs to feed this component, not design it. */
function ReportCard({ report }: { report: ReportEntry }) {
  return (
    <div className="group relative rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-white to-nav-lavender-mist p-4 shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] sm:rounded-[1.4rem] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-serif text-base text-nav-violet sm:text-lg">{report.name}</p>
          <p className="mt-0.5 text-xs text-nav-plum/60">
            {report.type} · {report.date}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-nav-lavender-soft px-2.5 py-0.5 text-[0.68rem] font-medium text-nav-amethyst-deep ring-1 ring-nav-lavender-line">
          {report.status === "ready" ? "Ready" : "Processing"}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 border-t border-nav-lavender-line pt-3">
        <button
          type="button"
          className="flex min-h-9 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-4 py-1.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
        >
          View
        </button>
        <button
          type="button"
          className="flex min-h-9 items-center justify-center rounded-full bg-nav-amethyst px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-nav-amethyst-deep"
        >
          Download
        </button>
      </div>
    </div>
  );
}
