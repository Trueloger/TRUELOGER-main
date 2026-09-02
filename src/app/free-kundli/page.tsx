import type { Metadata } from "next";
import { KundliChartIcon } from "@/components/quick-services/icons";
import { FreeKundliForm } from "@/components/free-kundli/FreeKundliForm";

export const metadata: Metadata = {
  title: "Free Kundli | Vedic Birth Chart | TRUELOGER",
  description:
    "Generate your free Kundli — a complete Vedic birth chart with planetary positions, houses, Ascendant, Moon sign, Nakshatra, and a personalized interpretation.",
};

/** Free Kundli tool — the flagship wave-2 astrology tool: a full Vedic
 * birth chart (Rasi/D1 chart visualization, every planet's sign/house/
 * degree, Ascendant, Moon sign/Nakshatra, and an AI-generated basic
 * interpretation), calculated from real FreeAstrologyAPI data. Page
 * shell matches src/app/numerology/page.tsx's exact structure so every
 * wave-2 tool page opens the same way. */
export default function FreeKundliPage() {
  return (
    <section
      aria-labelledby="free-kundli-heading"
      className="relative min-h-screen bg-nav-ivory px-4 pb-12 pt-28 sm:px-6 md:px-8 md:pb-20 md:pt-32"
    >
      <div className="relative mx-auto max-w-[720px]">
        <div className="mx-auto max-w-md text-center sm:max-w-xl">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
            <KundliChartIcon className="h-6 w-6 text-nav-amethyst-deep" strokeWidth={1.3} />
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          </div>
          <h2
            id="free-kundli-heading"
            className="mt-3 font-serif text-[2rem] leading-[1.15] text-nav-plum sm:text-4xl md:text-5xl"
          >
            Free <span className="text-nav-amethyst">Kundli</span>
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80 sm:max-w-md sm:text-base">
            Enter your birth details to generate a complete Vedic birth chart — your Rasi
            chart, planetary positions, houses, Ascendant, Moon sign, and Nakshatra.
          </p>
        </div>

        <div className="mt-10 md:mt-14">
          <FreeKundliForm />
        </div>
      </div>
    </section>
  );
}
