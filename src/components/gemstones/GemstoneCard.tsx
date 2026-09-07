"use client";

// src/components/gemstones/GemstoneCard.tsx
// One gemstone product tile — used on /gemstones' grid, and reusable
// wherever this catalogue is shown (the homepage "Sacred Gemstones"
// swap and possibly the /gemstones/[slug] subpage). Direct structural/
// responsive sibling of src/components/consult/ServiceCard.tsx: same
// `h-full` + `mt-auto` equal-height pattern, same compact-below-sm
// layout for a 3-column mobile grid, same corner-tick decoration, same
// `justAdded` confirmation flash. Differs from ServiceCard in content
// shape — an image placeholder instead of an icon badge, an
// MRP/sale-price/discount block instead of a single duration price,
// and "Add to Cart" opens the shared RattiSheet (portaled, see its
// file-level comment) instead of DurationSheet.
import { useState } from "react";
import Link from "next/link";
import type { GemstoneProduct, RattiValue } from "@/lib/gemstones/types";
import { getGemstonePrice, formatInr } from "@/lib/gemstones/pricing";
import { GemstoneImagePlaceholder } from "./GemstoneImagePlaceholder";
import { RattiSheet } from "./RattiSheet";

export function GemstoneCard({ product }: { product: GemstoneProduct }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const defaultPrice = getGemstonePrice(product.pricing, product.defaultRatti);

  function handleConfirm(_ratti: RattiValue, _salePrice: number) {
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-white to-nav-lavender-mist p-3 text-center shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_-14px_rgba(70,40,120,0.4)] sm:rounded-[1.4rem] sm:p-5 sm:text-left">
      <CornerTicks />

      <GemstoneImagePlaceholder
        alt={product.image.alt}
        className="rounded-lg sm:rounded-xl"
      />

      <h3
        className="mt-2.5 min-w-0 font-serif text-[0.72rem] leading-tight text-nav-violet sm:mt-3 sm:text-lg sm:leading-snug"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {product.name}
        {product.indianName && (
          <span className="block text-[0.62rem] font-normal text-nav-plum/60 sm:text-sm">
            {product.indianName}
          </span>
        )}
      </h3>

      <p className="mt-1 hidden text-xs text-nav-plum/60 sm:block">
        {product.shortDescription}
      </p>

      <div className="mt-1.5 flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5 sm:mt-2 sm:justify-start">
        {defaultPrice.discountPercent > 0 && (
          <span className="text-[0.62rem] text-nav-plum/50 line-through sm:text-sm">
            {formatInr(defaultPrice.mrp)}
          </span>
        )}
        <span className="text-[0.8rem] font-semibold text-nav-amethyst-deep sm:text-xl">
          {formatInr(defaultPrice.salePrice)}
        </span>
        {defaultPrice.discountPercent > 0 && (
          <span className="rounded-full bg-nav-lavender-soft px-1.5 py-0.5 text-[0.55rem] font-medium text-nav-amethyst-deep sm:text-xs">
            {defaultPrice.discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Full "Add to Cart" / "View Details" text always, no
          abbreviation — matches ServiceCard's precedent so labels wrap
          onto a second line at the narrowest widths rather than
          truncating, keeping both buttons' heights identical across
          every card in a row. */}
      <div className="mt-auto flex flex-col gap-1.5 pt-2.5 sm:flex-row sm:gap-2 sm:pt-4">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex min-h-[34px] flex-1 items-center justify-center whitespace-normal break-words rounded-full bg-nav-amethyst px-1.5 py-1 text-center text-[0.62rem] leading-tight font-medium text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep active:scale-[0.97] sm:min-h-[44px] sm:px-4 sm:py-0 sm:text-sm sm:leading-normal"
        >
          {justAdded ? "Added ✓" : "Add to Cart"}
        </button>
        <Link
          href={`/gemstones/${product.slug}`}
          className="flex min-h-[34px] flex-1 items-center justify-center whitespace-normal break-words rounded-full border border-nav-lavender-line bg-white px-1.5 py-1 text-center text-[0.62rem] leading-tight font-medium text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-mist sm:min-h-[44px] sm:px-4 sm:py-0 sm:text-sm sm:leading-normal"
        >
          View Details
        </Link>
      </div>

      <RattiSheet
        product={product}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

/** Small diagonal-cross marks at each corner, matching ServiceCard's
 * (and QuickServices') treatment — a self-contained copy since it's a
 * tiny piece of markup, not shared state. */
function CornerTicks() {
  const positions = [
    "left-1.5 top-1.5 sm:left-2.5 sm:top-2.5",
    "right-1.5 top-1.5 sm:right-2.5 sm:top-2.5",
    "left-1.5 bottom-1.5 sm:left-2.5 sm:bottom-2.5",
    "right-1.5 bottom-1.5 sm:right-2.5 sm:bottom-2.5",
  ];
  return (
    <>
      {positions.map((pos) => (
        <svg
          key={pos}
          aria-hidden="true"
          viewBox="0 0 10 10"
          className={`pointer-events-none absolute h-2 w-2 text-nav-orchid/45 sm:h-2.5 sm:w-2.5 ${pos}`}
        >
          <path d="M1 1 9 9M9 1 1 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      ))}
    </>
  );
}
