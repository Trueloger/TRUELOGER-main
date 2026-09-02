import type { Metadata } from "next";
import { LotusIcon } from "@/components/quick-services/icons";
import { DashaForm } from "@/components/dasha/DashaForm";

export const metadata: Metadata = {
  title: "Free Vimshottari Dasha Calculator | TRUELOGER",
  description:
    "Discover your current Mahadasha and Antardasha and the full Vimshottari Dasha timeline of your life — a free, personalized reading calculated from your exact birth details.",
};

/** Vimshottari Dasha tool — full Mahadasha/Antardasha timeline calculated
 * from real birth details via FreeAstrologyAPI. Section shell matches
 * every other wave-2 tool page's heading-block convention (see
 * src/app/numerology/page.tsx). */
export default function DashaPage() {
  return (
    <section
      aria-labelledby="dasha-heading"
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
            id="dasha-heading"
            className="mt-3 font-serif text-[2rem] leading-[1.15] text-nav-plum sm:text-4xl md:text-5xl"
          >
            Vimshottari <span className="text-nav-amethyst">Dasha</span>
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80 sm:max-w-md sm:text-base">
            Enter your exact birth details to reveal your current Mahadasha and Antardasha, and
            the full planetary period timeline that traditionally shapes your life&apos;s
            unfolding chapters.
          </p>
        </div>

        <div className="mt-10 md:mt-14">
          <DashaForm />
        </div>
      </div>
    </section>
  );
}
