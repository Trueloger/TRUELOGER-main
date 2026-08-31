import { LotusIcon } from "@/components/quick-services/icons";

/** The curved lower hero boundary + the lotus ornament resting below it. A
 * single wide, smooth two-cubic dome — spanning the full width in two
 * symmetric halves rather than a narrow S-curve confined to the centre —
 * so it stays a gentle half-circle silhouette at any aspect ratio instead
 * of turning into a sharp point when squeezed into a narrow mobile width.
 * Pure SVG/CSS (no raster image), so it stays crisp and resizes with the
 * viewport instead of being baked into a fixed asset.
 *
 * Sits directly under HeroCarousel, before HoroscopeSection — see
 * page.tsx for why this moved out of QuickServices. */
export function HeroToServicesCurve() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative z-20 h-[clamp(1.75rem,4vw,3rem)] w-full"
    >
      <svg
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full fill-nav-ivory"
      >
        <path d="M0,188 C288,188 468,20 720,20 C972,20 1152,188 1440,188 L1440,200 L0,200 Z" />
      </svg>

      <LotusIcon
        className="absolute left-1/2 text-nav-violet drop-shadow-[0_1px_2px_rgba(70,40,120,0.25)]"
        strokeWidth={1.5}
        style={{
          top: "78%",
          width: "clamp(1.5rem, 3.6vw, 2.25rem)",
          height: "clamp(1.5rem, 3.6vw, 2.25rem)",
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}
