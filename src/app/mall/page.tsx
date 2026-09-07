// src/app/mall/page.tsx
// /mall hub page — the landing destination for the homepage's
// "TRUELOGER Mall" quick-service card and the nav's "TRUELOGER Mall"
// dropdown trigger (see MALL_ITEM in src/components/nav/nav-data.ts).
// A category-overview page only: 5 premium cards, one per Mall
// category. Only "Gemstones" has a real catalogue right now
// (src/app/gemstones/page.tsx) so its card is a live, clickable Link
// with a filled amethyst CTA; the other 4 (Rudraksha, Bracelets,
// Yantras, Spiritual Products) have no product data or pages built
// yet, so they render as clearly secondary/muted "Coming Soon" cards —
// present (per the dropdown's own options) but honestly non-navigable
// (a plain <div>, not a <Link>, and no CTA button).
//
// Visual language mirrors /gemstones and /consult exactly: the same
// ivory/lavender/amethyst/gold palette, font-serif Playfair headings,
// and the CornerTicks + hover-lift card treatment shared by
// GemstoneCard/ServiceCard — kept as a local copy here rather than an
// import, matching those two components' own precedent of a
// self-contained CornerTicks rather than a shared one. Server
// component: every effect below is pure CSS (hover/transition), no
// client interactivity required.
import type { Metadata } from "next";
import type { SVGProps } from "react";
import Link from "next/link";
import { Gem } from "lucide-react";
import { GemstoneImagePlaceholder } from "@/components/gemstones/GemstoneImagePlaceholder";

export const metadata: Metadata = {
  title: "TRUELOGER Mall | TRUELOGER",
  description:
    "Browse the TRUELOGER Mall — gemstones, rudraksha, bracelets, yantras, and spiritual products chosen for Vedic astrology practice, in one place.",
};

type MallCategory = {
  name: string;
  href: string;
  blurb: string;
  status: "live" | "soon";
  Icon: (props: SVGProps<SVGSVGElement>) => React.JSX.Element;
};

const MALL_CATEGORIES: MallCategory[] = [
  {
    name: "Gemstones",
    href: "/gemstones",
    blurb: "Ruby, Pearl, Emerald and more, in the Ratti weight you need.",
    status: "live",
    Icon: FacetedGemGlyph,
  },
  {
    name: "Rudraksha",
    href: "/mall/rudraksha",
    blurb: "Mukhi beads and malas for daily practice.",
    status: "soon",
    Icon: RudrakshaGlyph,
  },
  {
    name: "Bracelets",
    href: "/mall/bracelets",
    blurb: "Crystal and bead bracelets for everyday wear.",
    status: "soon",
    Icon: BraceletGlyph,
  },
  {
    name: "Yantras",
    href: "/mall/yantras",
    blurb: "Sacred geometry for the home and altar.",
    status: "soon",
    Icon: YantraGlyph,
  },
  {
    name: "Spiritual Products",
    href: "/mall/spiritual-products",
    blurb: "Diyas, incense and puja essentials.",
    status: "soon",
    Icon: LotusDiyaGlyph,
  },
];

export default function MallPage() {
  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      <div className="mx-auto max-w-[1320px] px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
            <Gem className="h-6 w-6 text-nav-gold" strokeWidth={1.3} />
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          </div>

          <h1 className="mt-4 font-serif text-[1.9rem] leading-[1.15] text-nav-violet sm:text-4xl md:text-[2.75rem]">
            The TRUELOGER <span className="text-nav-amethyst">Mall</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-[0.95rem] leading-relaxed text-nav-plum/80 sm:text-base">
            Gemstones, rudraksha, bracelets, yantras and spiritual products —
            chosen for Vedic astrology practice, all in one place.
          </p>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:mt-14 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
          {MALL_CATEGORIES.map((category) => (
            <li key={category.name} className="h-full">
              <MallCategoryCard category={category} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function MallCategoryCard({ category }: { category: MallCategory }) {
  const isLive = category.status === "live";

  const cardBody = (
    <>
      <CornerTicks />

      {isLive ? (
        <GemstoneImagePlaceholder
          alt={`${category.name} — TRUELOGER Mall`}
          className="rounded-lg sm:rounded-xl"
        />
      ) : (
        <CategoryImagePlaceholder Icon={category.Icon} label={category.name} />
      )}

      <h3 className="mt-2.5 font-serif text-[0.85rem] leading-tight text-nav-violet sm:mt-3 sm:text-lg sm:leading-snug">
        {category.name}
      </h3>

      <p className="mt-1 hidden text-xs text-nav-plum/60 sm:block">{category.blurb}</p>

      <div className="mt-auto pt-2.5 sm:pt-4">
        {isLive ? (
          <span className="flex min-h-[34px] w-full items-center justify-center whitespace-normal break-words rounded-full bg-nav-amethyst px-1.5 py-1 text-center text-[0.62rem] leading-tight font-medium text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 group-hover:bg-nav-amethyst-deep sm:min-h-[44px] sm:px-4 sm:py-0 sm:text-sm sm:leading-normal">
            Shop Gemstones <span aria-hidden="true">&rarr;</span>
          </span>
        ) : (
          <span className="flex min-h-[34px] w-full items-center justify-center rounded-full border border-dashed border-nav-lavender-line bg-nav-lavender-mist/60 px-1.5 py-1 text-center text-[0.6rem] leading-tight font-medium text-nav-plum/60 sm:min-h-[44px] sm:px-4 sm:py-0 sm:text-xs">
            Coming Soon
          </span>
        )}
      </div>
    </>
  );

  const sharedClasses =
    "group relative flex h-full flex-col rounded-2xl border p-3 text-center transition-all duration-300 motion-reduce:transition-none sm:rounded-[1.4rem] sm:p-5 sm:text-left";

  if (isLive) {
    return (
      <Link
        href={category.href}
        className={`${sharedClasses} border-nav-lavender-line bg-gradient-to-b from-white to-nav-lavender-mist shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] hover:-translate-y-1 hover:shadow-[0_18px_34px_-14px_rgba(70,40,120,0.4)] motion-reduce:hover:translate-y-0`}
      >
        {cardBody}
      </Link>
    );
  }

  return (
    <div
      aria-label={`${category.name} — coming soon to TRUELOGER Mall`}
      className={`${sharedClasses} border-nav-lavender-line/70 bg-nav-lavender-mist/40 opacity-80 shadow-[0_6px_16px_-14px_rgba(70,40,120,0.3)] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0`}
    >
      {cardBody}
    </div>
  );
}

/** Same aspect-ratio/gradient shell as GemstoneImagePlaceholder, but
 * generic enough to host a per-category glyph and a dimmer treatment
 * for the not-yet-built categories — kept local to this page since it
 * only serves the 4 "coming soon" tiles. */
function CategoryImagePlaceholder({
  Icon,
  label,
}: {
  Icon: (props: SVGProps<SVGSVGElement>) => React.JSX.Element;
  label: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-nav-lavender-mist via-nav-pearl to-nav-lavender-soft sm:rounded-xl"
    >
      <Icon aria-hidden="true" className="relative h-[38%] w-[38%] text-nav-amethyst/20" />
    </div>
  );
}

/** Small diagonal-cross marks at each corner, matching
 * GemstoneCard's/ServiceCard's CornerTicks treatment exactly (kept as
 * a local copy per this site's own precedent). */
function CornerTicks() {
  const positions = [
    "left-1.5 top-1.5 sm:left-2.5 sm:top-2.5",
    "right-1.5 top-1.5 sm:right-2.5 sm:top-2.5",
    "left-1.5 bottom-1.5 sm:left-2.5 sm:bottom-2.5",
    "right-1.5 bottom-1.5 sm:right-2.5 sm:bottom-2.5",
  ];
  return (
    <>
      {positions.map((pos) => (
        <svg
          key={pos}
          aria-hidden="true"
          viewBox="0 0 10 10"
          className={`pointer-events-none absolute h-2 w-2 text-nav-orchid/45 sm:h-2.5 sm:w-2.5 ${pos}`}
        >
          <path d="M1 1 9 9M9 1 1 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      ))}
    </>
  );
}

const glyphBase = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor" as const,
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Faceted-gem outline, matching GemstoneImagePlaceholder's own glyph —
 * reused here only as the icon type for the Gemstones category entry
 * in the data table above (the live card itself renders the real
 * GemstoneImagePlaceholder, not this function). */
function FacetedGemGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...glyphBase} {...props}>
      <path d="M6 8.5 3.5 8.5 9 20.5 12 8.5" />
      <path d="M18 8.5 20.5 8.5 15 20.5 12 8.5" />
      <path d="M6 8.5 18 8.5" />
      <path d="M6 8.5 9 3.5 15 3.5 18 8.5" />
    </svg>
  );
}

/** Rudraksha — a strung line of beads (mala), in the site's hand-drawn
 * stroke language. */
function RudrakshaGlyph(props: SVGProps<SVGSVGElement>) {
  const beadCenters: [number, number][] = [
    [12, 3.2],
    [17.2, 5.6],
    [20, 10.8],
    [18.4, 16.6],
    [13.4, 20.2],
    [7.2, 19.4],
    [3.4, 14.6],
    [4.2, 8.4],
  ];
  const path = beadCenters.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ") + " Z";
  return (
    <svg {...glyphBase} {...props}>
      <path d={path} opacity="0.6" />
      {beadCenters.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" />
      ))}
    </svg>
  );
}

/** Bracelets — an open bangle band with two bead accents. */
function BraceletGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...glyphBase} {...props}>
      <ellipse cx="12" cy="12.5" rx="8.4" ry="7.6" />
      <ellipse cx="12" cy="12.5" rx="5.6" ry="5" opacity="0.6" />
      <circle cx="12" cy="3.9" r="1.4" />
      <circle cx="20.4" cy="12.5" r="1.4" />
    </svg>
  );
}

/** Yantra — layered sacred-geometry (triangle within a circle within a
 * square), the classic yantra construction. */
function YantraGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...glyphBase} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <circle cx="12" cy="12" r="7.4" />
      <path d="M12 6 17.2 16.2 6.8 16.2 Z" />
      <path d="M12 18 6.8 7.8 17.2 7.8 Z" opacity="0.7" />
    </svg>
  );
}

/** Spiritual Products — a lit diya flame set on a lotus base. */
function LotusDiyaGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...glyphBase} {...props}>
      <path d="M12 3.5c1.7 2.4 1.8 4.6 0 6.6-1.8-2-1.7-4.2 0-6.6Z" />
      <path d="M3.5 16.5c1.9 1.6 5.2 2.6 8.5 2.6s6.6-1 8.5-2.6" />
      <path d="M3.5 16.5c0-2 1.7-3.6 3.9-3.6 1.7 0 3.2.9 3.9 2.3" />
      <path d="M20.5 16.5c0-2-1.7-3.6-3.9-3.6-1.7 0-3.2.9-3.9 2.3" opacity="0.85" />
    </svg>
  );
}
