import type { Metadata } from "next";
import { SaturnGlyphIcon } from "@/components/quick-services/icons";
import { SadeSatiForm } from "@/components/sade-sati/SadeSatiForm";

export const metadata: Metadata = {
  title: "Free Sade Sati Calculator | TRUELOGER",
  description:
    "Check whether Saturn's Sade Sati cycle is currently active for you, calculated from your natal Moon sign and Saturn's current transit — explained clearly and without alarm.",
};

/** Sade Sati tool — two getPlanetPositions calls (natal Moon sign +
 * current transiting Saturn sign) feeding deriveSadeSati (see
 * src/lib/astrology/derive.ts) for the whole calculation. Page shell
 * matches src/app/numerology/page.tsx's structure exactly. */
export default function SadeSatiPage() {
  return (
    <section
      aria-labelledby="sade-sati-heading"
      className="relative min-h-screen bg-nav-ivory px-4 pb-12 pt-28 sm:px-6 md:px-8 md:pb-20 md:pt-32"
    >
      <div className="relative mx-auto max-w-[720px]">
        <div className="mx-auto max-w-md text-center sm:max-w-xl">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
            <SaturnGlyphIcon className="h-6 w-6 text-nav-amethyst-deep" strokeWidth={1.3} />
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          </div>
          <h2
            id="sade-sati-heading"
            className="mt-3 font-serif text-[2rem] leading-[1.15] text-nav-plum sm:text-4xl md:text-5xl"
          >
            Free <span className="text-nav-amethyst">Sade Sati</span> Check
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80 sm:max-w-md sm:text-base">
            Check whether Saturn&apos;s Sade Sati cycle is currently active in your chart,
            explained clearly and without alarm.
          </p>
        </div>

        <div className="mt-10 md:mt-14">
          <SadeSatiForm />
        </div>
      </div>
    </section>
  );
}
