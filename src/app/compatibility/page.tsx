import type { Metadata } from "next";
import { KundliMatchIcon } from "@/components/quick-services/icons";
import { CompatibilityForm } from "@/components/compatibility/CompatibilityForm";

export const metadata: Metadata = {
  title: "Free Compatibility Check | TRUELOGER",
  description:
    "A free relationship-compatibility reading for you and your partner — emotional compatibility, communication style, strengths and potential challenges, interpreted from your real calculated birth charts.",
};

/** Compatibility tool — modern relationship-dynamics framing. Calls
 * getAshtakootMatch() via /api/compatibility, the SAME real calculation
 * the Kundli Matching tool (src/app/kundli-matching/page.tsx) uses —
 * see that route's top comment for the shared-calculation decision.
 * Page shell matches src/app/numerology/page.tsx's structure. */
export default function CompatibilityPage() {
  return (
    <section
      aria-labelledby="compatibility-heading"
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
            id="compatibility-heading"
            className="mt-3 font-serif text-[2rem] leading-[1.15] text-nav-plum sm:text-4xl md:text-5xl"
          >
            Free <span className="text-nav-amethyst">Compatibility</span> Check
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80 sm:max-w-md sm:text-base">
            See how you and your partner connect — emotional compatibility, communication style,
            and relationship dynamics, drawn from your real calculated birth charts.
          </p>
        </div>

        <div className="mt-10 md:mt-14">
          <CompatibilityForm />
        </div>
      </div>
    </section>
  );
}
