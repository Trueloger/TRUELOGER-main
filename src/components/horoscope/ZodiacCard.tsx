import Link from "next/link";
import type { ZodiacCardData } from "./zodiac-ui-data";

/** One zodiac sign, linking to its reading page. Sized entirely via
 * cqw/clamp() so it scales cleanly whether it's one of six in the
 * desktop grid or one of four visible in the mobile carousel — same
 * container-query approach as ProductCard. Equal width/height comes
 * from the parent grid/flex, not a fixed size here. */
export function ZodiacCard({ slug, name, dateRange, Icon }: ZodiacCardData) {
  return (
    <Link
      href={`/horoscope/${slug}`}
      aria-label={`${name} daily horoscope, ${dateRange}`}
      className="group flex h-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-nav-pearl to-nav-lavender-mist px-2 py-4 text-center shadow-[0_6px_18px_-12px_rgba(70,40,120,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-nav-amethyst/50 hover:shadow-[0_14px_28px_-14px_rgba(70,40,120,0.4)]"
    >
      <Icon
        className="h-[clamp(1.6rem,6cqw,2.5rem)] w-[clamp(1.6rem,6cqw,2.5rem)] text-nav-amethyst-deep transition-colors duration-300 group-hover:text-nav-amethyst"
        strokeWidth={1.4}
      />
      <span className="font-serif text-[clamp(0.75rem,3.4cqw,0.95rem)] leading-tight text-nav-violet">
        {name}
      </span>
      <span className="text-[clamp(0.6rem,2.6cqw,0.7rem)] text-nav-plum/60">
        {dateRange}
      </span>
    </Link>
  );
}
