import type { Metadata } from "next";
import { LotusIcon } from "@/components/quick-services/icons";
import { NakshatraForm } from "@/components/nakshatra/NakshatraForm";

export const metadata: Metadata = {
  title: "Free Nakshatra Calculator | TRUELOGER",
  description:
    "Discover your birth Nakshatra — the lunar mansion, ruling deity, symbol and pada — with a free, personalized reading calculated from your exact birth details.",
};

/** Nakshatra (lunar mansion) tool — one real FreeAstrologyAPI call
 * (getPlanetPositions), reading the Moon's nakshatra straight off the
 * response. Section shell matches the numerology page's heading-block
 * convention. */
export default function NakshatraPage() {
  return (
    <section
      aria-labelledby="nakshatra-heading"
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
            id="nakshatra-heading"
            className="mt-3 font-serif text-[2rem] leading-[1.15] text-nav-plum sm:text-4xl md:text-5xl"
          >
            Free <span className="text-nav-amethyst">Nakshatra</span> Calculator
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80 sm:max-w-md sm:text-base">
            Enter your exact birth details to reveal your birth Nakshatra — the lunar mansion,
            ruling deity and symbol that traditionally shape your inner nature.
          </p>
        </div>

        <div className="mt-10 md:mt-14">
          <NakshatraForm />
        </div>
      </div>
    </section>
  );
}
