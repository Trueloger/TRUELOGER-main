import type { Metadata } from "next";
import { KundliMatchIcon } from "@/components/quick-services/icons";
import { KundliMatchingForm } from "@/components/kundli-matching/KundliMatchingForm";

export const metadata: Metadata = {
  title: "Free Kundli Matching (Guna Milan) | TRUELOGER",
  description:
    "Free traditional Vedic Kundli Matching for a bride and groom — the real 8-koota Ashtakoot (Guna Milan) score out of 36, calculated from both birth charts, with a traditional interpretation.",
};

/** Kundli Matching tool — traditional, Ashtakoot-first framing. Calls
 * calculateAshtakoot() via /api/kundli-matching, the SAME real local
 * calculation the Compatibility tool (src/app/compatibility/page.tsx)
 * uses — see that route's top comment for the shared-calculation
 * decision. Page shell matches src/app/numerology/page.tsx's structure. */
export default function KundliMatchingPage() {
  return (
    <section
      aria-labelledby="kundli-matching-heading"
      className="relative min-h-screen bg-nav-ivory px-4 pb-12 pt-28 sm:px-6 md:px-8 md:pb-20 md:pt-32"
    >
      <div className="relative mx-auto max-w-[720px]">
        <div className="mx-auto max-w-md text-center sm:max-w-xl">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
            <KundliMatchIcon className="h-6 w-6 text-nav-amethyst-deep" strokeWidth={1.3} />
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          </div>
          <h2
            id="kundli-matching-heading"
            className="mt-3 font-serif text-[2rem] leading-[1.15] text-nav-plum sm:text-4xl md:text-5xl"
          >
            Free <span className="text-nav-amethyst">Kundli Matching</span>
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80 sm:max-w-md sm:text-base">
            Enter the bride&apos;s and groom&apos;s birth details for a traditional Ashtakoot
            (Guna Milan) match score out of 36, with a koota-by-koota breakdown.
          </p>
        </div>

        <div className="mt-10 md:mt-14">
          <KundliMatchingForm />
        </div>
      </div>
    </section>
  );
}
