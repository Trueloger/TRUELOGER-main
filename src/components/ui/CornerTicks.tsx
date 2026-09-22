// src/components/ui/CornerTicks.tsx
// Small diagonal-cross marks at each corner of a premium card — this
// exact SVG markup used to be copy-pasted independently into
// ReportCard.tsx, GemstoneCard.tsx, ToolCard.tsx, and
// consult/ServiceCard.tsx (each file's own comment called it "a
// self-contained copy since it's a tiny piece of markup, not shared
// state"). Consolidated here since it's the same markup with only two
// known size variants across the whole site — "default" (ReportCard/
// ToolCard) and "compact" (GemstoneCard/consult-ServiceCard, which
// also need a 3-per-row mobile grid to fit).
export function CornerTicks({ size = "default" }: { size?: "default" | "compact" }) {
  const positions =
    size === "compact"
      ? [
          "left-1.5 top-1.5 sm:left-2.5 sm:top-2.5",
          "right-1.5 top-1.5 sm:right-2.5 sm:top-2.5",
          "left-1.5 bottom-1.5 sm:left-2.5 sm:bottom-2.5",
          "right-1.5 bottom-1.5 sm:right-2.5 sm:bottom-2.5",
        ]
      : ["left-2 top-2", "right-2 top-2", "left-2 bottom-2", "right-2 bottom-2"];
  const sizeClass = size === "compact" ? "h-2 w-2 sm:h-2.5 sm:w-2.5" : "h-2.5 w-2.5";

  return (
    <>
      {positions.map((pos) => (
        <svg
          key={pos}
          aria-hidden="true"
          viewBox="0 0 10 10"
          className={`pointer-events-none absolute ${sizeClass} text-nav-orchid/45 ${pos}`}
        >
          <path d="M1 1 9 9M9 1 1 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      ))}
    </>
  );
}
