import Link from "next/link";
import { QUICK_SERVICES, type QuickService } from "./quick-services-data";
import { LotusIcon } from "./icons";

// Desktop card sizing tuned so 5 cards + gaps actually fit in one row at
// the breakpoint they switch on (xl, 1280px) — at the old lg (1024px)
// breakpoint there wasn't room, so the "5 then 4" layout only held above
// ~1300px and silently reflowed to something else below that.
const DESKTOP_CARD_W = 210;
const DESKTOP_GAP = 20;
const DESKTOP_ROW_MAX = 5 * DESKTOP_CARD_W + 4 * DESKTOP_GAP; // 1130px

export function QuickServices() {
  return (
    <section aria-labelledby="quick-services-heading" className="relative">
      {/* No background here — the page-level wrapper (see page.tsx) now
          paints one continuous wash behind this, ExploreServices and
          PersonalizedReportsBanner together. */}
      <div className="relative pb-10 md:pb-14">
        <BackgroundAtmosphere />

        <div className="relative mx-auto max-w-[1300px] px-4 pt-8 sm:px-6 md:px-8 md:pt-12">
          <div className="mx-auto max-w-md text-center sm:max-w-xl md:max-w-2xl">
            <h2
              id="quick-services-heading"
              className="scroll-mt-28 font-serif text-[1.7rem] leading-[1.15] text-nav-violet sm:text-3xl md:text-4xl md:scroll-mt-32 lg:text-[2.75rem]"
            >
              Our <span className="text-nav-amethyst">Services</span>
            </h2>
            <SectionDivider />
          </div>

          {/* Mobile / tablet — 3x3x3 grid, compact cards so two rows (6
              cards) are visible without scrolling on a typical phone. */}
          <ul className="mt-6 grid grid-cols-3 gap-2 sm:gap-3 md:mt-9 xl:hidden">
            {QUICK_SERVICES.map((service) => (
              <li key={service.id}>
                <ServiceCard service={service} compact className="w-full" />
              </li>
            ))}
          </ul>

          {/* Desktop — 5 cards, then 4 centered beneath */}
          <div
            className="mx-auto mt-10 hidden flex-wrap justify-center gap-5 xl:flex"
            style={{ maxWidth: DESKTOP_ROW_MAX }}
          >
            {QUICK_SERVICES.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                className="h-[212px] shrink-0"
                style={{ width: DESKTOP_CARD_W }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceCard({
  service,
  className = "",
  style,
  compact = false,
}: {
  service: QuickService;
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
}) {
  const { title, description, href, Icon, featured } = service;

  return (
    <Link
      href={href}
      aria-label={`${title} — ${description}`}
      style={style}
      className={`group relative flex flex-col items-center rounded-[1.1rem] border text-center shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_-14px_rgba(70,40,120,0.4)] ${
        compact ? "h-[118px] rounded-[1rem] px-2 pb-2 pt-2.5 sm:h-[132px] sm:px-2.5 sm:pb-2.5" : "rounded-[1.4rem] px-4 pb-4 pt-5"
      } ${
        featured
          ? "border-nav-amethyst-deep/50 bg-gradient-to-b from-nav-amethyst to-nav-amethyst-deep"
          : "border-nav-lavender-line bg-gradient-to-b from-white to-nav-lavender-mist"
      } ${className}`}
    >
      <CornerTicks featured={featured} compact={compact} />

      <span
        className={`flex shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
          compact ? "h-7 w-7 sm:h-8 sm:w-8" : "h-11 w-11 sm:h-12 sm:w-12"
        } ${
          featured
            ? "border-white/30 bg-white/10 text-nav-pearl"
            : "border-nav-lavender-line bg-nav-lavender-mist text-nav-amethyst-deep group-hover:bg-nav-lavender-soft"
        }`}
      >
        <Icon className={compact ? "h-3.5 w-3.5 sm:h-4 sm:w-4" : "h-[1.35rem] w-[1.35rem] sm:h-6 sm:w-6"} />
      </span>

      <span
        className={`font-serif leading-snug ${compact ? "mt-1.5 text-[0.72rem] sm:text-[0.8rem]" : "mt-2.5 text-[0.98rem] sm:text-[1.05rem]"} ${
          featured ? "text-nav-pearl" : "text-nav-violet"
        }`}
      >
        {title}
      </span>

      <span
        className={`${compact ? "mt-0.5 text-[0.58rem] sm:text-[0.64rem]" : "mt-1 text-[0.78rem] sm:text-[0.82rem]"} leading-snug ${
          featured ? "text-nav-pearl/85" : "text-nav-plum/75"
        }`}
        style={{
          display: "-webkit-box",
          WebkitLineClamp: compact ? 1 : 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {description}
      </span>

      <span
        aria-hidden="true"
        className={`mt-auto flex shrink-0 items-center justify-center rounded-full transition-all duration-300 group-hover:translate-x-0.5 ${
          compact ? "h-5 w-5 text-[0.65rem] sm:h-6 sm:w-6" : "h-7 w-7 text-[0.85rem] sm:h-8 sm:w-8"
        } ${
          featured
            ? "bg-white/15 text-nav-pearl"
            : "bg-nav-lavender-soft text-nav-amethyst-deep group-hover:bg-nav-amethyst group-hover:text-white"
        }`}
      >
        →
      </span>
    </Link>
  );
}

/** Small diagonal-cross marks at each corner — the paper/plaque-tile
 * detail from the reference, rather than a plain rectangular card edge. */
function CornerTicks({ featured, compact }: { featured?: boolean; compact?: boolean }) {
  const tone = featured ? "text-white/35" : "text-nav-orchid/45";
  const positions = [
    "left-1.5 top-1.5",
    "right-1.5 top-1.5",
    "left-1.5 bottom-1.5",
    "right-1.5 bottom-1.5",
  ];
  const fullPositions = [
    "left-2.5 top-2.5",
    "right-2.5 top-2.5",
    "left-2.5 bottom-2.5",
    "right-2.5 bottom-2.5",
  ];
  const chosen = compact ? positions : fullPositions;
  return (
    <>
      {chosen.map((pos) => (
        <svg
          key={pos}
          aria-hidden="true"
          viewBox="0 0 10 10"
          className={`pointer-events-none absolute h-2 w-2 sm:h-2.5 sm:w-2.5 ${tone} ${pos}`}
        >
          <path d="M1 1 9 9M9 1 1 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      ))}
    </>
  );
}

function SectionDivider() {
  return (
    <div className="mx-auto mt-4 flex items-center justify-center gap-3 md:mt-6" aria-hidden="true">
      <span className="h-px w-10 bg-nav-lavender-line sm:w-14" />
      <LotusIcon className="h-3 w-3 text-nav-orchid" strokeWidth={1.5} />
      <span className="h-px w-10 bg-nav-lavender-line sm:w-14" />
    </div>
  );
}

/** Extremely low-contrast decoration — a soft wash plus a handful of tiny
 * stars, deliberately subtle per the "not a busy astrology wallpaper"
 * requirement. */
function BackgroundAtmosphere() {
  const stars = [
    { top: "14%", left: "10%", size: 5 },
    { top: "22%", left: "88%", size: 4 },
    { top: "8%", left: "50%", size: 3 },
    { top: "40%", left: "6%", size: 3 },
    { top: "36%", left: "93%", size: 5 },
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-[6%] h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-[0.35] blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, var(--color-nav-lavender-soft), transparent)",
        }}
      />
      {stars.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          style={{ top: s.top, left: s.left, width: s.size, height: s.size }}
          className="absolute text-nav-orchid opacity-25"
        >
          <path d="M12 2 13.4 10.6 22 12 13.4 13.4 12 22 10.6 13.4 2 12 10.6 10.6Z" fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}
