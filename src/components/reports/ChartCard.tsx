import type { ReactNode } from "react";

type ChartCardProps = {
  /** The actual chart markup/SVG, supplied by the caller — this
   * component only frames it, it never renders chart math itself. */
  children: ReactNode;
  caption?: string;
};

/** Elegant bordered frame with a soft lavender glow for an astrology
 * chart visualization. Stays usable at 320px: content is centered and
 * never forcibly shrunk — if it's wider than the frame it scrolls
 * horizontally inside its own overflow-x-auto container (browser's
 * native scrollbar as the visible affordance) instead of squishing
 * illegible. */
export function ChartCard({ children, caption }: ChartCardProps) {
  return (
    <figure className="rounded-2xl border border-nav-lavender-line bg-nav-pearl p-4 shadow-[0_0_45px_-12px_rgba(164,128,207,0.55)] sm:p-6">
      <div className="overflow-x-auto">
        <div className="mx-auto flex min-w-[280px] items-center justify-center">
          {children}
        </div>
      </div>
      {caption && (
        <figcaption className="mt-4 text-center text-sm text-nav-plum/70">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
