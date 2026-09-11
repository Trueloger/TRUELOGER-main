// src/components/reports/ReportCover.tsx
// Web-reader cover "page" — a styled section, not literally a PDF page
// (the PDF has its own cover in src/lib/reports/render-pdf.tsx; same
// canonical data, medium-appropriate rendering — AGENTS §128). Used by
// both the purchased report reader and the demo reader, so no
// purchase-specific data leaks into this component's props.
import { LotusIcon } from "@/components/quick-services/icons";

export function ReportCover({
  name,
  productName,
  date,
  isDemo,
}: {
  name: string;
  productName: string;
  date?: string;
  isDemo?: boolean;
}) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-nav-lavender-soft via-nav-pearl to-white px-6 py-12 text-center sm:px-10 sm:py-16">
      <div className="flex items-center justify-center gap-3">
        <span className="h-px w-10 bg-nav-lavender-line" aria-hidden="true" />
        <LotusIcon className="h-7 w-7 text-nav-gold" strokeWidth={1.3} />
        <span className="h-px w-10 bg-nav-lavender-line" aria-hidden="true" />
      </div>
      <p className="mt-4 font-serif text-2xl tracking-wide text-nav-violet sm:text-3xl">TRUELOGER</p>
      <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-nav-amethyst-deep">
        Personalized Vedic Astrology Report
      </p>
      {isDemo && (
        <span className="mt-4 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-300">
          Sample / Demo Report
        </span>
      )}
      <h1 className="mt-6 font-serif text-3xl leading-tight text-nav-plum sm:text-4xl">{productName}</h1>
      <div className="mx-auto mt-8 flex max-w-xs flex-col gap-2 text-sm">
        <p className="text-xs uppercase tracking-wide text-nav-amethyst/80">Prepared For</p>
        <p className="font-serif text-lg text-nav-plum">{name}</p>
        <p className="mt-3 text-xs uppercase tracking-wide text-nav-amethyst/80">Generated</p>
        <p className="text-sm text-nav-plum/80">{date ?? new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>
    </div>
  );
}
