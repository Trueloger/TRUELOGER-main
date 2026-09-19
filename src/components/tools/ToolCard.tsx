// src/components/tools/ToolCard.tsx
// One free-tool tile for the /free-services grid — same visual
// language as ReportCard.tsx (corner ticks, icon-in-circle + title
// header, equal-height flex column, single full-width CTA) sized down
// for a tool that needs no price/delivery-time strip.
import Link from "next/link";
import type { ToolItem } from "./tools-data";

export function ToolCard({ tool }: { tool: ToolItem }) {
  const { title, description, href, Icon } = tool;

  return (
    <Link
      href={href}
      aria-label={`${title} — ${description}`}
      className="group relative flex h-full flex-col rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-white to-nav-lavender-mist p-4 shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_-14px_rgba(70,40,120,0.4)] sm:rounded-[1.4rem] sm:p-5"
    >
      <CornerTicks />

      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-nav-lavender-line bg-nav-lavender-mist text-nav-amethyst-deep transition-colors duration-300 group-hover:bg-nav-lavender-soft sm:h-12 sm:w-12">
        <Icon className="h-[1.35rem] w-[1.35rem] sm:h-6 sm:w-6" aria-hidden="true" />
      </span>

      <h3 className="mt-3 font-serif text-[1.05rem] leading-snug text-nav-violet">{title}</h3>

      <p className="mt-1.5 text-sm leading-relaxed text-nav-plum/75">{description}</p>

      <span className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-medium text-nav-amethyst-deep">
        Explore
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-nav-lavender-soft text-[0.8rem] transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-nav-amethyst group-hover:text-white"
        >
          →
        </span>
      </span>
    </Link>
  );
}

/** Small diagonal-cross marks at each corner, matching ReportCard's/
 * GemstoneCard's treatment. */
function CornerTicks() {
  const positions = ["left-2 top-2", "right-2 top-2", "left-2 bottom-2", "right-2 bottom-2"];
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
