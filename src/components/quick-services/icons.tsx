// Hand-drawn line-art icon set for the Quick Services tiles. Kept as a
// single consistent stroke language (round caps/joins, 1.5 weight,
// currentColor) rather than mixing in a generic icon library — these are
// astrology-specific motifs (kundli chart, planetary glyphs) a stock icon
// set doesn't have authentic equivalents for.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Lotus — a real blooming-lotus silhouette (fanned petals on a base),
 * not a generic flower glyph. Built from one petal shape rotated around a
 * shared base point, the way lotus line-art is actually drawn. */
export function LotusIcon(props: IconProps) {
  const petal = "M12,19.5 C9.8,15.2 9.6,9.3 12,4.2 C14.4,9.3 14.2,15.2 12,19.5 Z";
  const angles = [-58, -30, 0, 30, 58];
  return (
    <svg {...base} strokeWidth={1.3} {...props}>
      {angles.map((a) => (
        <path key={a} d={petal} transform={`rotate(${a} 12 19.5)`} />
      ))}
      <path d="M5.2,19.5 C7.3,21.4 16.7,21.4 18.8,19.5" />
    </svg>
  );
}

/** Free Kundli — classic North-Indian birth-chart square with diagonals. */
export function KundliChartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="1" />
      <path d="M3.5 3.5 20.5 20.5M20.5 3.5 3.5 20.5" />
    </svg>
  );
}

/** Kundli Matching — two overlapping hearts (compatibility). */
export function KundliMatchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8.7 5.3c1.3 0 2.4.8 2.9 2 .5-1.2 1.6-2 2.9-2 1.8 0 3.2 1.5 3.2 3.4 0 3.7-6.1 8-6.1 8s-.6-.4-1.5-1.1" transform="translate(-1.1,0)" />
      <path d="M8.7 5.3c1.3 0 2.4.8 2.9 2 .5-1.2 1.6-2 2.9-2 1.8 0 3.2 1.5 3.2 3.4 0 3.7-6.1 8-6.1 8s-6.1-4.3-6.1-8c0-1.9 1.4-3.4 3.2-3.4Z" transform="translate(1.1,0)" opacity="0.9" />
    </svg>
  );
}

/** Daily Horoscope — sun and crescent moon in one celestial mark. */
export function HoroscopeDialIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9.5" cy="14" r="3.3" />
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * Math.PI) / 3;
        const x1 = 9.5 + Math.cos(angle) * 4.6;
        const y1 = 14 + Math.sin(angle) * 4.6;
        const x2 = 9.5 + Math.cos(angle) * 5.8;
        const y2 = 14 + Math.sin(angle) * 5.8;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
      <path d="M16.2 4.2a4.6 4.6 0 1 0 3.5 7.4 5.6 5.6 0 0 1-3.5-7.4Z" opacity="0.85" />
    </svg>
  );
}

/** Numerology — refined 3x3 number grid. */
export function NumerologyGridIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M9.5 3.5v17M14.5 3.5v17M3.5 9.5h17M3.5 14.5h17" opacity="0.55" />
    </svg>
  );
}

/** Mangal Dosha — Mars glyph (circle + ascending arrow). */
export function MarsGlyphIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="13.5" r="6" />
      <path d="M15 9 20 4M20 4h-4.5M20 4v4.5" />
    </svg>
  );
}

/** Sade Sati — Saturn glyph (ringed orb). */
export function SaturnGlyphIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="13" r="5" />
      <ellipse cx="12" cy="13" rx="9.2" ry="2.6" transform="rotate(-18 12 13)" />
    </svg>
  );
}

/** Nakshatra — compact eight-point star flower (birth-star motif). */
export function NakshatraStarsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4;
        const tipX = 12 + Math.cos(angle) * 8.4;
        const tipY = 12 + Math.sin(angle) * 8.4;
        const midAngle1 = angle - Math.PI / 8;
        const midAngle2 = angle + Math.PI / 8;
        const m1x = 12 + Math.cos(midAngle1) * 3;
        const m1y = 12 + Math.sin(midAngle1) * 3;
        const m2x = 12 + Math.cos(midAngle2) * 3;
        const m2y = 12 + Math.sin(midAngle2) * 3;
        return <path key={i} d={`M${m1x},${m1y} L${tipX},${tipY} L${m2x},${m2y}`} />;
      })}
      <circle cx="12" cy="12" r="1.6" />
    </svg>
  );
}

/** Panchang — traditional almanac / calendar page. */
export function PanchangCalendarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
      <path d="M3.5 9.5h17M7.5 3v4M16.5 3v4" />
      <path d="M8 13.5h3M13 13.5h3M8 17h3M13 17h2" opacity="0.6" />
    </svg>
  );
}

/** Free Services — four-square utility grid. */
export function FreeServicesGridIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.3" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.3" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.3" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.3" />
    </svg>
  );
}

/** Talk To Astrologer — a person in profile speaking, with a small
 * radiating-connection mark, standing in for a live consultation
 * rather than a static reading. */
export function TalkToExpertIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9.5" cy="8" r="3.2" />
      <path d="M4 20c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6" />
      <path d="M16.5 7.2c1.1.5 1.9 1.6 1.9 2.9s-.8 2.4-1.9 2.9" opacity="0.85" />
      <path d="M19 5.6c1.9.9 3.2 2.7 3.2 4.9s-1.3 4-3.2 4.9" opacity="0.55" />
    </svg>
  );
}
