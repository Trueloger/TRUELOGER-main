import { LotusIcon } from "@/components/quick-services/icons";
import { ZodiacGrid } from "./ZodiacGrid";
import { ZodiacCarousel } from "./ZodiacCarousel";

/** Homepage zodiac section — sits directly under HeroToServicesCurve,
 * taking over the "tuck under the dome" negative-margin that used to
 * belong to the wash div wrapping QuickServices (see page.tsx). Static:
 * cards show symbol/name/date-range only, no daily content, so this
 * section needs no data fetch — see spec §3. */
export function HoroscopeSection() {
  return (
    <section
      aria-labelledby="horoscope-heading"
      className="relative -mt-px bg-nav-ivory pb-12 pt-10 md:pb-20 md:pt-14"
    >
      <div className="relative mx-auto max-w-[1320px] px-4 sm:px-6 md:px-8">
        <div className="mx-auto max-w-md text-center sm:max-w-xl md:max-w-2xl">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
            <LotusIcon className="h-6 w-6 text-nav-amethyst-deep" strokeWidth={1.3} />
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          </div>
          <h2
            id="horoscope-heading"
            className="mt-3 scroll-mt-28 font-serif text-[2rem] leading-[1.15] text-nav-plum sm:text-4xl md:scroll-mt-32 md:text-5xl"
          >
            Daily <span className="text-nav-amethyst">Horoscope</span>
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80 sm:max-w-md sm:text-base">
            Your stars, refreshed every day.
          </p>
        </div>
        <div className="mt-10 md:mt-14">
          <ZodiacGrid />
          <ZodiacCarousel />
        </div>
      </div>
    </section>
  );
}
