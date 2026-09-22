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
import { Card } from "@/components/ui/Card";

export function ServiceCard({ service }: { service: ConsultationService }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const defaultPrice = getConsultationPrice(service.pricing, 30);

  function handleConfirm() {
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <Card cornerTicks="compact" className="p-3 text-center sm:p-5 sm:text-left">
      {/* items-center (not items-start): a short, single-line service
          name sitting next to the icon badge needs to be vertically
          centered against it, not pinned to the top — a two-line
          name's height happens to roughly match the icon's, so
          centering leaves that case visually unchanged. Icon/name/gaps
          scale down below sm so 3 cards comfortably fit one row on a
          320-430px phone without any content clipping. */}
      <div className="flex flex-col items-center sm:flex-row sm:gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-nav-lavender-line bg-nav-lavender-mist text-nav-amethyst-deep transition-colors duration-300 group-hover:bg-nav-lavender-soft sm:h-14 sm:w-14">
          <ConsultServiceIcon icon={service.icon} className="h-4 w-4 sm:h-6 sm:w-6" />
        </span>

        <h3
          className="mt-1.5 min-w-0 font-serif text-[0.72rem] leading-tight text-nav-violet sm:mt-0 sm:text-lg sm:leading-snug"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {service.name}
        </h3>
      </div>

      <p className="mt-2 hidden text-xs text-nav-plum/60 sm:block">15–60 min sessions</p>

      <div className="mt-1.5 flex items-baseline justify-center gap-1 sm:mt-2 sm:justify-start sm:gap-1.5">
        <span className="text-[0.8rem] font-semibold text-nav-amethyst-deep sm:text-xl">
          {formatInr(defaultPrice)}
        </span>
        <span className="text-[0.6rem] text-nav-plum/60 sm:text-xs">30 min</span>
      </div>

      {/* Full "Add to Cart" / "View More" text always, on mobile too —
          no abbreviation. min-h is a floor, not a cap: at the narrowest
          3-per-row widths the label wraps onto a second line and the
          button grows past min-h to fit it (both buttons wrap
          identically since their text is the same across every card,
          so this never breaks the equal-card-height layout). */}
      <div className="mt-auto flex flex-col gap-1.5 pt-2.5 sm:flex-row sm:gap-2 sm:pt-4">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex min-h-[34px] flex-1 items-center justify-center whitespace-normal break-words rounded-full bg-nav-amethyst px-1.5 py-1 text-center text-[0.62rem] leading-tight font-medium text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep active:scale-[0.97] sm:min-h-[44px] sm:px-4 sm:py-0 sm:text-sm sm:leading-normal"
        >
          {justAdded ? "Added ✓" : "Add to Cart"}
        </button>
        <Link
          href={`/consult/${service.slug}`}
          className="flex min-h-[34px] flex-1 items-center justify-center whitespace-normal break-words rounded-full border border-nav-lavender-line bg-white px-1.5 py-1 text-center text-[0.62rem] leading-tight font-medium text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-mist sm:min-h-[44px] sm:px-4 sm:py-0 sm:text-sm sm:leading-normal"
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
    </Card>
  );
}
