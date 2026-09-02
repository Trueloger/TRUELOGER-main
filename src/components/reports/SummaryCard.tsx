import type { ReactNode } from "react";

type SummaryCardProps = {
  heading?: string;
  body?: string;
  children?: ReactNode;
};

/** Highlighted "at a glance" card — mirrors HoroscopeReading's
 * theme+overview box. Accepts either a plain `body` string or richer
 * `children`; renders nothing when given neither, never a fabricated
 * placeholder. */
export function SummaryCard({ heading, body, children }: SummaryCardProps) {
  if (!body && !children) return null;

  return (
    <div className="rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-nav-pearl to-nav-lavender-mist p-6 shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] sm:p-8">
      {heading && (
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.15em] text-nav-amethyst">
          {heading}
        </p>
      )}
      <div className={`text-[1.05rem] leading-relaxed text-nav-violet ${heading ? "mt-3" : ""}`}>
        {children ?? body}
      </div>
    </div>
  );
}
