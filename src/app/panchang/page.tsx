import type { Metadata } from "next";
import { LotusIcon } from "@/components/quick-services/icons";
import { PanchangView } from "@/components/panchang/PanchangView";

export const metadata: Metadata = {
  title: "Free Daily Panchang | TRUELOGER",
  description:
    "Today's Panchang for New Delhi — Tithi, Vara, Nakshatra, Yoga, Karana, sunrise/sunset, Rahu Kalam, Hora and Choghadiya, browsable by date, no personal details required.",
};

/** Panchang tool — different in kind from every other tool in this
 * feature set: pure date-based data (no name/DOB/time-of-birth needed),
 * generated once daily server-side for a single fixed reference
 * location and archived (see src/lib/panchang/store.ts for why), and
 * not AI-generated — every figure on the page is real output from
 * getPanchang(). Server Component shell + heading block, matching
 * numerology/page.tsx's structure; PanchangView (client) owns the date
 * picker and the fetch. */
export default function PanchangPage() {
  return (
    <section
      aria-labelledby="panchang-heading"
      className="relative min-h-screen bg-nav-ivory px-4 pb-12 pt-28 sm:px-6 md:px-8 md:pb-20 md:pt-32"
    >
      <div className="relative mx-auto max-w-[1100px]">
        <div className="mx-auto max-w-md text-center sm:max-w-xl">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
            <LotusIcon className="h-6 w-6 text-nav-amethyst-deep" strokeWidth={1.3} />
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          </div>
          <h2
            id="panchang-heading"
            className="mt-3 font-serif text-[2rem] leading-[1.15] text-nav-plum sm:text-4xl md:text-5xl"
          >
            Free Daily <span className="text-nav-amethyst">Panchang</span>
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80 sm:max-w-md sm:text-base">
            Tithi, Vara, Nakshatra, Yoga and Karana for New Delhi — generated
            daily from real astronomical data, browsable by date, no birth
            details required.
          </p>
        </div>

        <div className="mt-10 md:mt-14">
          <PanchangView />
        </div>
      </div>
    </section>
  );
}
