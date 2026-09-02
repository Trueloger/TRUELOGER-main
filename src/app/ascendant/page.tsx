import type { Metadata } from "next";
import { LotusIcon } from "@/components/quick-services/icons";
import { AscendantForm } from "@/components/ascendant/AscendantForm";

export const metadata: Metadata = {
  title: "Free Ascendant (Lagna) Calculator | TRUELOGER",
  description:
    "Discover your Ascendant — your Vedic Lagna, or rising sign — with a free, personalized reading calculated from your exact birth date, time and place.",
};

/** Ascendant (Lagna/rising sign) tool — one real FreeAstrologyAPI call
 * (getPlanetPositions), reading the Ascendant's sign straight off the
 * response (it's one of the PlanetName keys). Section shell matches the
 * numerology page's heading-block convention. */
export default function AscendantPage() {
  return (
    <section
      aria-labelledby="ascendant-heading"
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
            id="ascendant-heading"
            className="mt-3 font-serif text-[2rem] leading-[1.15] text-nav-plum sm:text-4xl md:text-5xl"
          >
            Free <span className="text-nav-amethyst">Ascendant</span> Calculator
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80 sm:max-w-md sm:text-base">
            Enter your exact birth date, time and place to reveal your Ascendant — the rising
            sign that traditionally shapes first impressions and how you meet the world.
          </p>
        </div>

        <div className="mt-10 md:mt-14">
          <AscendantForm />
        </div>
      </div>
    </section>
  );
}
