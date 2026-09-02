import type { Metadata } from "next";
import { LotusIcon } from "@/components/quick-services/icons";
import { ZodiacGrid } from "@/components/horoscope/ZodiacGrid";
import { ZodiacCarousel } from "@/components/horoscope/ZodiacCarousel";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Daily Horoscope | TRUELOGER",
  description:
    "Choose your zodiac sign for today's horoscope — love, career, finance and health, refreshed daily.",
};

// Wires up the nav/quick-services "Daily Horoscope" link (previously
// dead — see nav-data.ts / quick-services-data.ts) into the same
// zodiac-selection UI as the homepage section, as its own full page.
export default function DailyHoroscopeIndexPage() {
  return (
    <section
      aria-labelledby="daily-horoscope-index-heading"
      className="relative min-h-screen bg-nav-ivory px-4 pb-12 pt-28 sm:px-6 md:px-8 md:pb-20 md:pt-32"
    >
      <div className="relative mx-auto max-w-[1320px]">
        <div className="mx-auto max-w-md text-center sm:max-w-xl md:max-w-2xl">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
            <LotusIcon className="h-6 w-6 text-nav-amethyst-deep" strokeWidth={1.3} />
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          </div>
          <h1
            id="daily-horoscope-index-heading"
            className="mt-3 font-serif text-[2rem] leading-[1.15] text-nav-plum sm:text-4xl md:text-5xl"
          >
            Daily <span className="text-nav-amethyst">Horoscope</span>
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80 sm:max-w-md sm:text-base">
            Choose your zodiac sign for today&apos;s reading.
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
