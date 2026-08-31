// Line-art zodiac glyphs — same stroke language as LotusIcon and
// src/components/quick-services/icons.tsx (viewBox 24, currentColor,
// round caps/joins). Each renders the traditional astrological symbol
// for its sign as real vector line-art, not a Unicode character —
// keeps all 12 visually consistent as one family at any size.
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

/** Aries — the ram's curled horns. */
export function RamIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6,6 C6,10 8,12 8,16 M8,16 C8,12 10,10 12,10 C14,10 16,12 16,16 M16,16 C16,12 18,10 18,6" />
    </svg>
  );
}

/** Taurus — the bull: a circle with upward horns. */
export function BullIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="15" r="5" />
      <path d="M7,10 C7,6 9,4 9,4 M17,10 C17,6 15,4 15,4" />
    </svg>
  );
}

/** Gemini — the twins: two pillars joined by top and bottom bars. */
export function TwinsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6,5 H18 M6,19 H18 M9,5 C7,9 7,15 9,19 M15,5 C17,9 17,15 15,19" />
    </svg>
  );
}

/** Cancer — the crab: two circles joined by interlocking curved arms. */
export function CrabIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="16" r="2.2" />
      <circle cx="16" cy="8" r="2.2" />
      <path d="M8,13.5 C8,9 12,9 12,12 C12,15 16,15 16,10.5" />
    </svg>
  );
}

/** Leo — the lion: a loop with a long trailing tail. */
export function LionIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="8" r="3" />
      <path d="M8,11 C8,16 14,14 14,18 C14,20 16,20.5 17,19" />
    </svg>
  );
}

/** Virgo — the maiden: a script "M" ending in a looped, crossed tail. */
export function MaidenIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5,6 V16 M5,6 C5,10 8,10 8,6 M8,6 V16 M8,6 C8,10 11,10 11,6 M11,6 V15 C11,17.5 13,18.5 15,17 C16.5,15.8 15,14.3 13.5,15.3 C12.2,16.1 13,18 14.7,17.8" />
    </svg>
  );
}

/** Libra — the scales: a balance beam over a base. */
export function ScalesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6,10 C6,7 9,6 12,6 C15,6 18,7 18,10" />
      <line x1="4" y1="14" x2="20" y2="14" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

/** Scorpio — like the maiden's "M", but ending in a barbed stinger tail. */
export function ScorpionIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5,6 V16 M5,6 C5,10 8,10 8,6 M8,6 V16 M8,6 C8,10 11,10 11,6 M11,6 V15 L15,15 L15,11 M15,15 L18,12 M15,15 L18,18" />
    </svg>
  );
}

/** Sagittarius — the archer's arrow, fletched, crossing a line. */
export function ArcherIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6,18 L18,6 M13,6 H18 V11 M8,13 L11,16" />
    </svg>
  );
}

/** Capricorn — the sea-goat: a horn curling into a fish-tail swirl. */
export function SeaGoatIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6,6 C6,10 6,14 9,14 C11,14 11,11 9,11 M9,14 C9,17 12,19 15,17 C17,15.5 16,13 14,14 C12.5,14.7 13,17 15,17" />
    </svg>
  );
}

/** Aquarius — the water bearer: two parallel wavy lines. */
export function WaterBearerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4,10 L8,7 L12,10 L16,7 L20,10 M4,16 L8,13 L12,16 L16,13 L20,16" />
    </svg>
  );
}

/** Pisces — two fish arcing away from each other, joined by a line. */
export function FishIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8,5 C4,9 4,15 8,19 M16,5 C20,9 20,15 16,19 M5,12 H19" />
    </svg>
  );
}
