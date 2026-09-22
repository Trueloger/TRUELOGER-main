// src/components/tools/ToolCard.tsx
// One free-tool tile for the /free-services grid — same visual
// language as ReportCard.tsx (corner ticks, icon-in-circle + title
// header, equal-height flex column, single full-width CTA) sized down
// for a tool that needs no price/delivery-time strip.
import type { ToolItem } from "./tools-data";
import { Card } from "@/components/ui/Card";

export function ToolCard({ tool }: { tool: ToolItem }) {
  const { title, description, href, Icon } = tool;

  return (
    <Card href={href} aria-label={`${title} — ${description}`} className="p-4 sm:p-5">
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
    </Card>
  );
}
