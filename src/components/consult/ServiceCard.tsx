"use client";

// src/components/consult/ServiceCard.tsx
// One consultation service tile on /consult. Shares the corner-tick,
// rounded/gradient/shadow language of QuickServices' ServiceCard (see
// src/components/quick-services/QuickServices.tsx) but carries more
// content, so it's its own layout rather than a copy-paste: icon badge,
// name, duration range, a default 30-min price, and two actions —
// "Add to Cart" (opens the DurationSheet, the DIRECT add-to-cart flow)
// and "View More" (a real Link to the subpage). Deliberately no
// subtitle/tagline text under the name — the full description lives on
// the subpage; this card stays to name + duration + price + actions
// only, both to keep it scannable and so every card in the grid has the
// same fixed content shape (`h-full` + `mt-auto` on the action row
// then makes every card in a row match height regardless of name
// length, since nothing above the action row varies in line count).
import { useState } from "react";
import Link from "next/link";
import type { ConsultationService } from "@/lib/consultation/types";
import { getConsultationPrice, formatInr } from "@/lib/consultation/pricing";
import { ConsultServiceIcon } from "./ConsultServiceIcon";
import { DurationSheet } from "./DurationSheet";

export function ServiceCard({ service }: { service: ConsultationService }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const defaultPrice = getConsultationPrice(service.pricing, 30);

  function handleConfirm() {
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <div className="group relative flex h-full flex-col rounded-[1.4rem] border border-nav-lavender-line bg-gradient-to-b from-white to-nav-lavender-mist p-5 text-center shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_-14px_rgba(70,40,120,0.4)] sm:text-left">
      <CornerTicks />

      {/* items-center (not items-start): a short, single-line service
          name sitting next to the fixed h-14 icon badge needs to be
          vertically centered against it, not pinned to the top — a
          two-line name's height happens to roughly match the icon's,
          so centering leaves that case visually unchanged. */}
      <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-nav-lavender-line bg-nav-lavender-mist text-nav-amethyst-deep transition-colors duration-300 group-hover:bg-nav-lavender-soft">
          <ConsultServiceIcon icon={service.icon} className="h-6 w-6" />
        </span>

        <h3 className="mt-3 min-w-0 font-serif text-lg leading-snug text-nav-violet sm:mt-0">
          {service.name}
        </h3>
      </div>

      <p className="mt-3 text-xs text-nav-plum/60">15–60 min sessions</p>

      <div className="mt-2 flex items-baseline justify-center gap-1.5 sm:justify-start">
        <span className="text-xl font-semibold text-nav-amethyst-deep">
          {formatInr(defaultPrice)}
        </span>
        <span className="text-xs text-nav-plum/60">30 min</span>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-nav-amethyst px-4 text-sm font-medium text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep active:scale-[0.97]"
        >
          {justAdded ? "Added ✓" : "Add to Cart"}
        </button>
        <Link
          href={`/consult/${service.slug}`}
          className="flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-4 text-sm font-medium text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-mist"
        >
          View More
        </Link>
      </div>

      <DurationSheet
        service={service}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

/** Small diagonal-cross marks at each corner, matching QuickServices'
 * ServiceCard treatment. */
function CornerTicks() {
  const positions = [
    "left-2.5 top-2.5",
    "right-2.5 top-2.5",
    "left-2.5 bottom-2.5",
    "right-2.5 bottom-2.5",
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
