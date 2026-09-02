import type { Metadata } from "next";
import { MarsGlyphIcon } from "@/components/quick-services/icons";
import { MangalDoshaForm } from "@/components/mangal-dosha/MangalDoshaForm";

export const metadata: Metadata = {
  title: "Free Mangal Dosha Calculator | TRUELOGER",
  description:
    "Check whether Mangal Dosha (Kuja Dosha) appears in your birth chart, calculated from Mars, the Ascendant and the Moon — explained clearly and without alarm.",
};

/** Mangal Dosha tool — one getPlanetPositions call feeding
 * deriveMangalDosha (see src/lib/astrology/derive.ts) for the whole
 * calculation. Page shell matches src/app/numerology/page.tsx's
 * structure exactly. */
export default function MangalDoshaPage() {
  return (
    <section
      aria-labelledby="mangal-dosha-heading"
      className="relative min-h-screen bg-nav-ivory px-4 pb-12 pt-28 sm:px-6 md:px-8 md:pb-20 md:pt-32"
    >
      <div className="relative mx-auto max-w-[720px]">
        <div className="mx-auto max-w-md text-center sm:max-w-xl">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
            <MarsGlyphIcon className="h-6 w-6 text-nav-amethyst-deep" strokeWidth={1.3} />
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          </div>
          <h2
            id="mangal-dosha-heading"
            className="mt-3 font-serif text-[2rem] leading-[1.15] text-nav-plum sm:text-4xl md:text-5xl"
          >
            Free <span className="text-nav-amethyst">Mangal Dosha</span> Check
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80 sm:max-w-md sm:text-base">
            Check whether Mangal Dosha appears in your birth chart, explained clearly and
            without alarm.
          </p>
        </div>

        <div className="mt-10 md:mt-14">
          <MangalDoshaForm />
        </div>
      </div>
    </section>
  );
}
