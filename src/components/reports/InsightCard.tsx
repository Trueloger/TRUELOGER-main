import type { ComponentType, SVGProps } from "react";
import { Sparkles } from "lucide-react";

type InsightCardProps = {
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  text: string;
};

/** Small card for a single highlight/recommendation bullet — used to
 * render an AI report's highlights/recommendations arrays as a list of
 * these. Defaults to a Sparkles glyph when no icon is supplied; renders
 * nothing when given no text. */
export function InsightCard({ icon: Icon = Sparkles, text }: InsightCardProps) {
  if (!text) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-nav-lavender-line bg-nav-pearl p-4">
      <Icon
        aria-hidden="true"
        strokeWidth={1.5}
        className="mt-0.5 h-4.5 w-4.5 shrink-0 text-nav-amethyst-deep"
      />
      <p className="text-sm leading-relaxed text-nav-plum/85">{text}</p>
    </div>
  );
}
