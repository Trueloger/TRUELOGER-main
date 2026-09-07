// src/components/consult/ConsultHero.tsx
// Premium banner for /consult. Matches this site's warm ivory/lavender/
// amethyst/gold palette and existing gradient/border/shadow/radius
// conventions (see ProductsSection.tsx's heading treatment and
// QuickServices.tsx's card shadow language) rather than introducing a
// new visual system. No fabricated stats/ratings — real trust badges
// only exist elsewhere on the site as an image-baked banner
// (PersonalizedReportsBanner), so this stays copy-only.
import { LotusIcon } from "@/components/quick-services/icons";

export function ConsultHero() {
  return (
    <section
      aria-label="Talk to the right expert"
      className="relative overflow-hidden rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft px-5 py-10 text-center shadow-[0_18px_40px_-18px_rgba(70,40,120,0.35)] sm:px-8 sm:py-14 md:rounded-3xl md:py-16"
    >
      <BackgroundGlow />

      <div className="relative mx-auto max-w-2xl">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          <LotusIcon className="h-6 w-6 text-nav-gold" strokeWidth={1.3} />
          <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
        </div>

        <h1 className="mt-4 font-serif text-[1.9rem] leading-[1.15] text-nav-violet sm:text-4xl md:text-[2.75rem]">
          Talk to the Right Expert for{" "}
          <span className="text-nav-amethyst">the Questions That Matter</span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-[0.95rem] leading-relaxed text-nav-plum/80 sm:text-base">
          Get one-on-one guidance rooted in your birth chart, Tarot, Numerology,
          Vastu, or spiritual healing — a real conversation with a real expert,
          at a duration that fits your question.
        </p>

        <a
          href="#consult-grid"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-nav-amethyst px-6 py-3 text-sm font-medium text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep"
        >
          Explore Consultations
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}

/** Extremely low-contrast decoration, matching QuickServices'
 * BackgroundAtmosphere restraint. */
function BackgroundGlow() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-[-10%] h-[320px] w-[720px] -translate-x-1/2 rounded-full opacity-[0.35] blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, var(--color-nav-lavender-soft), transparent)",
        }}
      />
    </div>
  );
}
