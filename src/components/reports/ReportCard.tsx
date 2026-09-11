// src/components/reports/ReportCard.tsx
// One report-product tile for the /reports/personalized grid. A
// "premium report/book product" card — structural sibling of
// src/components/gemstones/GemstoneCard.tsx (corner ticks, equal-height
// flex column, MRP/sale-price/discount block) but content-shaped for a
// report rather than a physical/variant product: a short bullet list
// from whatItCovers instead of a description-only blurb, a page-range +
// delivery-time strip instead of a weight selector, and two links
// (View Details / Demo Report) instead of an Add to Cart button — a
// report has no variant to pick before viewing, so this card stays a
// plain server component with no client state.
import Link from "next/link";
import { ScrollText, Clock } from "lucide-react";
import type { ReportProduct } from "@/lib/reports/types";
import { formatInr } from "@/lib/consultation/pricing";

export function ReportCard({ product }: { product: ReportProduct }) {
  const bullets = product.whatItCovers.slice(0, 4);

  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-white to-nav-lavender-mist p-4 shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_-14px_rgba(70,40,120,0.4)] sm:rounded-[1.4rem] sm:p-5">
      <CornerTicks />

      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nav-amethyst/10 text-nav-amethyst-deep ring-1 ring-nav-amethyst/20">
          <ScrollText className="h-4.5 w-4.5" strokeWidth={1.4} aria-hidden="true" />
        </span>
        <h3 className="font-serif text-lg leading-snug text-nav-violet">{product.name}</h3>
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-nav-plum/75">
        {product.shortDescription}
      </p>

      <ul className="mt-3 flex flex-col gap-1.5">
        {bullets.map((point) => (
          <li key={point} className="flex items-start gap-2 text-xs text-nav-plum/80 sm:text-[0.82rem]">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-nav-gold" aria-hidden="true" />
            <span>{point}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-nav-plum/60">
        <span>{product.minPages}–{product.maxPages} pages</span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          Delivery: within {product.deliveryHours} hours
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        {product.discountPercent > 0 && (
          <span className="text-xs text-nav-plum/50 line-through">{formatInr(product.mrp)}</span>
        )}
        <span className="text-xl font-semibold text-nav-amethyst-deep">
          {formatInr(product.salePrice)}
        </span>
        {product.discountPercent > 0 && (
          <span className="rounded-full bg-nav-lavender-soft px-1.5 py-0.5 text-[0.65rem] font-medium text-nav-amethyst-deep">
            {product.discountPercent}% OFF
          </span>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row">
        <Link
          href={`/reports/personalized/${product.slug}`}
          className="flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-nav-amethyst px-3 text-center text-sm font-medium text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep active:scale-[0.97]"
        >
          View Details
        </Link>
        <Link
          href={`/reports/personalized/${product.slug}/demo`}
          className="flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-3 text-center text-sm font-medium text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-mist"
        >
          Demo Report
        </Link>
      </div>
    </div>
  );
}

/** Small diagonal-cross marks at each corner, matching GemstoneCard's
 * treatment — a self-contained copy since it's a tiny piece of markup,
 * not shared state. */
function CornerTicks() {
  const positions = [
    "left-2 top-2",
    "right-2 top-2",
    "left-2 bottom-2",
    "right-2 bottom-2",
  ];
  return (
    <>
      {positions.map((pos) => (
        <svg
          key={pos}
          aria-hidden="true"
          viewBox="0 0 10 10"
          className={`pointer-events-none absolute h-2.5 w-2.5 text-nav-orchid/45 ${pos}`}
        >
          <path d="M1 1 9 9M9 1 1 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      ))}
    </>
  );
}
