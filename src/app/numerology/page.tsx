import type { Metadata } from "next";
import { LotusIcon } from "@/components/quick-services/icons";
import { NumerologyForm } from "@/components/numerology/NumerologyForm";

export const metadata: Metadata = {
  title: "Free Numerology Calculator | TRUELOGER",
  description:
    "Discover your Life Path, Destiny, Soul Urge, Personality and Birth numbers — a free, personalized numerology reading calculated from your name and date of birth.",
};

/** Free Numerology tool — the one calculation in this feature set needing
 * no external astrology API (pure deterministic Pythagorean math, see
 * src/lib/numerology/calculate.ts), so it ships ahead of the other 9
 * wave-2 tools that depend on FreeAstrologyAPI. Section shell matches
 * every other homepage section's heading-block convention (see
 * PujaSection.tsx). */
export default function NumerologyPage() {
  return (
    <section
      aria-labelledby="numerology-heading"
      className="relative min-h-screen bg-nav-ivory px-4 pb-12 pt-28 sm:px-6 md:px-8 md:pb-20 md:pt-32"
    >
      <div className="relative mx-auto max-w-[720px]">
        <div className="mx-auto max-w-md text-center sm:max-w-xl">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
            <LotusIcon className="h-6 w-6 text-nav-amethyst-deep" strokeWidth={1.3} />
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          </div>
          <h2
            id="numerology-heading"
            className="mt-3 font-serif text-[2rem] leading-[1.15] text-nav-plum sm:text-4xl md:text-5xl"
          >
            Free <span className="text-nav-amethyst">Numerology</span>
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80 sm:max-w-md sm:text-base">
            Enter your name and date of birth to reveal the numbers that
            traditionally shape your life path, purpose, and inner nature.
          </p>
        </div>

        <div className="mt-10 md:mt-14">
          <NumerologyForm />
        </div>
      </div>
    </section>
  );
}
