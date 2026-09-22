// src/components/ui/Card.tsx
// The ONE shared shell every "premium product/tool tile" card should
// use — extracted from ReportCard.tsx/GemstoneCard.tsx/ToolCard.tsx/
// consult/ServiceCard.tsx, which each independently duplicated the
// exact same `rounded-2xl border ... bg-gradient-to-b from-white to-
// nav-lavender-mist shadow-[...] hover:shadow-[...] hover:-translate-y-1
// sm:rounded-[1.4rem]` string plus their own CornerTicks() copy. This
// is a pure dedup — same tokens, same shadow/gradient values, zero
// visual change to any existing card. Content padding/alignment is
// deliberately NOT baked in here (it differs slightly per card: p-4
// sm:p-5 vs p-3 text-center sm:p-5 sm:text-left) — pass it via
// `className`, same as any other Tailwind component.
//
// NOT used by ZodiacCard.tsx (a genuinely different, smaller shadow +
// no corner ticks + different gradient stops — a distinct card family,
// not this one) or services/ServiceCard.tsx / products/ProductCard.tsx
// (already-distinct families per their own doc comments).
import Link from "next/link";
import type { ReactNode } from "react";
import { CornerTicks } from "./CornerTicks";

const SHELL =
  "group relative flex h-full flex-col rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-white to-nav-lavender-mist shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_-14px_rgba(70,40,120,0.4)] sm:rounded-[1.4rem]";

type CardProps = {
  /** When set, the whole card renders as a single `<Link>` (e.g.
   * ToolCard, where the entire tile is one click target). Omit when
   * the card contains its own internal links/buttons (ReportCard,
   * GemstoneCard, consult/ServiceCard) — those stay a plain `<div>`. */
  href?: string;
  /** "compact" matches GemstoneCard/consult-ServiceCard's smaller
   * corner-tick treatment (needed for 3-per-row mobile grids); "none"
   * omits corner ticks entirely. Default matches ReportCard/ToolCard. */
  cornerTicks?: "default" | "compact" | "none";
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
};

export function Card({ href, cornerTicks = "default", className = "", children, ...rest }: CardProps) {
  const classes = `${SHELL} ${className}`;
  const ticks = cornerTicks === "none" ? null : <CornerTicks size={cornerTicks === "compact" ? "compact" : "default"} />;

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {ticks}
        {children}
      </Link>
    );
  }

  return (
    <div className={classes} {...rest}>
      {ticks}
      {children}
    </div>
  );
}
