// src/components/gemstones/GemstoneImagePlaceholder.tsx
// Reusable image-area placeholder for every gemstone card thumbnail and
// every /gemstones/[slug] gallery slot, until real photography exists.
// Fixed aspect-ratio (aspect-[4/5] — a touch taller than square, closer
// to how a cut gemstone is usually photographed) with a soft ivory/
// lavender gradient and a centered faceted-gem line-art ornament, in the
// same hand-drawn stroke language as src/components/quick-services/icons.tsx
// (viewBox 0 0 24 24, currentColor, strokeWidth 1.5, round caps/joins) —
// deliberately not a generic gray skeleton box.
import type { SVGProps } from "react";

export function GemstoneImagePlaceholder({
  alt,
  className = "",
}: {
  alt: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-nav-lavender-mist via-nav-pearl to-nav-lavender-soft ${className}`}
    >
      <BackgroundSparkle />
      <FacetedGemIcon
        aria-hidden="true"
        className="relative h-[42%] w-[42%] text-nav-amethyst/25"
      />
    </div>
  );
}

/** Extremely low-contrast radial glow, matching this site's restrained
 * background-decoration convention (see ConsultHero's BackgroundGlow). */
function BackgroundSparkle() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div
        className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-2xl"
        style={{
          background: "radial-gradient(closest-side, var(--color-nav-gold), transparent)",
        }}
      />
    </div>
  );
}

/** Simple faceted-gem/diamond outline — a table-cut gem silhouette with
 * facet lines — drawn in the same stroke language as the Quick Services
 * icon set rather than pulled from a generic icon library, so it reads
 * as this site's own line art. */
function FacetedGemIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 8.5 3.5 8.5 9 20.5 12 8.5" />
      <path d="M18 8.5 20.5 8.5 15 20.5 12 8.5" />
      <path d="M6 8.5 18 8.5" />
      <path d="M6 8.5 9 3.5 15 3.5 18 8.5" />
      <path d="M9 3.5 12 8.5 15 3.5" opacity="0.7" />
      <path d="M9 20.5 12 8.5 15 20.5" opacity="0.7" />
    </svg>
  );
}
