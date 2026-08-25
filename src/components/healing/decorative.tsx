// Hand-drawn, low-opacity decorative marks for the Healing section —
// sacred-geometry background motifs and the corner flower/crystal/diya
// framing from the reference. Kept as plain SVG (no images, no
// animation libraries) so they stay lightweight and theme-colorable via
// currentColor, matching the drawing language already used for LotusIcon
// and the Quick Services background stars.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Tiny four-point sparkle/star, same shape as the Quick Services stars. */
export function FourPointStar(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 2 13.4 10.6 22 12 13.4 13.4 12 22 10.6 13.4 2 12 10.6 10.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Concentric rings + radiating spokes — a faint chakra/mandala motif for
 * the section background. Extremely low-contrast by design; meant to be
 * felt more than seen. */
export function MandalaRing(props: IconProps) {
  const spokes = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6);
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" aria-hidden="true" {...props}>
      <circle cx="100" cy="100" r="92" strokeWidth="0.6" />
      <circle cx="100" cy="100" r="70" strokeWidth="0.6" />
      <circle cx="100" cy="100" r="48" strokeWidth="0.6" />
      {spokes.map((a, i) => (
        <line
          key={i}
          x1={100 + Math.cos(a) * 48}
          y1={100 + Math.sin(a) * 48}
          x2={100 + Math.cos(a) * 92}
          y2={100 + Math.sin(a) * 92}
          strokeWidth="0.6"
        />
      ))}
    </svg>
  );
}

/** Small five-petal lavender flower — simpler and rounder than LotusIcon
 * (which reads as a lotus bloom), used for the corner floral framing. */
export function LavenderFlower(props: IconProps) {
  const petal = "M12,12 C9.8,9.3 9.8,5.6 12,2.4 C14.2,5.6 14.2,9.3 12,12 Z";
  const angles = [0, 72, 144, 216, 288];
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      {angles.map((a) => (
        <path key={a} d={petal} transform={`rotate(${a} 12 12)`} fill="currentColor" opacity="0.9" />
      ))}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** A small faceted amethyst crystal cluster (three overlapping points). */
export function CrystalCluster(props: IconProps) {
  return (
    <svg viewBox="0 0 60 56" aria-hidden="true" {...props}>
      <polygon points="9,50 5,31 11,12 17,31 13,50" fill="currentColor" opacity="0.5" />
      <polygon points="28,50 24,20 32,2 40,20 36,50" fill="currentColor" opacity="0.75" />
      <polygon points="47,50 44,33 49,17 54,33 51,50" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

/** A small brass diya/candle — cupped base, no naked flame realism, just
 * a soft teardrop light. */
export function DiyaCandle(props: IconProps) {
  return (
    <svg viewBox="0 0 40 50" aria-hidden="true" {...props}>
      <ellipse cx="20" cy="35" rx="15" ry="3.2" fill="currentColor" opacity="0.3" />
      <path
        d="M5 33c0-5 7-6 15-6s15 1 15 6-8 8-15 8-15-3-15-8Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M20 25c-3-4-3-9 0-14 3 5 3 10 0 14Z"
        fill="#f0c789"
      />
    </svg>
  );
}
