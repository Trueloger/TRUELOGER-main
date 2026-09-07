// src/components/gemstones/GemstoneHero.tsx
// Premium banner for /gemstones. Direct structural/styling sibling of
// src/components/consult/ConsultHero.tsx — same ivory/lavender/amethyst/
// gold palette, font-serif heading, low-contrast background glow, and
// anchor-scroll CTA pattern. Copy stays to traditional/spiritual
// gemstone selection and genuine online-shopping value (savings,
// delivery) — no fabricated claims ("100% authentic", "lab certified",
// "astrologer approved", certification counts, review counts, countdown
// timers, or fake scarcity), matching this site's real-data-only
// convention for trust language.
import { Gem } from "lucide-react";

export function GemstoneHero() {
  return (
    <section
      aria-label="Shop gemstones"
      className="relative overflow-hidden rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft px-5 py-10 text-center shadow-[0_18px_40px_-18px_rgba(70,40,120,0.35)] sm:px-8 sm:py-14 md:rounded-3xl md:py-16"
    >
      <BackgroundGlow />

      <div className="relative mx-auto max-w-2xl">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          <Gem className="h-6 w-6 text-nav-gold" strokeWidth={1.3} />
          <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
        </div>

        <h1 className="mt-4 font-serif text-[1.9rem] leading-[1.15] text-nav-violet sm:text-4xl md:text-[2.75rem]">
          Bring the Power of Gemstones{" "}
          <span className="text-nav-amethyst">Closer to You</span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-[0.95rem] leading-relaxed text-nav-plum/80 sm:text-base">
          Choose from gemstones traditionally recommended in Vedic astrology,
          selected by Ratti weight for your need — with straightforward online
          pricing and everyday savings on every stone.
        </p>

        <a
          href="#gemstone-grid"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-nav-amethyst px-6 py-3 text-sm font-medium text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep"
        >
          Shop Gemstones
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}

/** Extremely low-contrast decoration, matching ConsultHero's
 * BackgroundGlow restraint. */
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
