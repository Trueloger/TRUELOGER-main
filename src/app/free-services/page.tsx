// src/app/free-services/page.tsx
// The page the homepage's "Tools" quick-service card AND the navbar's
// "Tools" dropdown both link to — a grid of every free astrology tool
// on the site (see src/components/tools/tools-data.ts, which mirrors
// the navbar's "Tools" children 1:1). Static data, no DB — a plain
// Server Component, matching /reports/personalized's structure minus
// the pricing fetch.
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { ToolCard } from "@/components/tools/ToolCard";
import { TOOLS } from "@/components/tools/tools-data";

export const metadata: Metadata = {
  title: "Free Astrology Tools | TRUELOGER",
  description:
    "Every free Vedic astrology tool on TRUELOGER in one place — Kundli, Kundli Matching, Compatibility, Numerology, Nakshatra, Rashi, Ascendant, Dasha, Mangal Dosha, Sade Sati and Panchang.",
};

export default function FreeServicesPage() {
  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      <div className="mx-auto max-w-[1320px] px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
        <section
          aria-label="Free astrology tools"
          className="relative overflow-hidden rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft px-5 py-10 text-center shadow-[0_18px_40px_-18px_rgba(70,40,120,0.35)] sm:px-8 sm:py-14 md:rounded-3xl md:py-16"
        >
          <BackgroundGlow />

          <div className="relative mx-auto max-w-2xl">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
              <Sparkles className="h-6 w-6 text-nav-gold" strokeWidth={1.3} aria-hidden="true" />
              <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
            </div>

            <h1 className="mt-4 font-serif text-[1.9rem] leading-[1.15] text-nav-violet sm:text-4xl md:text-[2.75rem]">
              Free <span className="text-nav-amethyst">Astrology Tools</span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[0.95rem] leading-relaxed text-nav-plum/80 sm:text-base">
              Every free, calculated-from-your-birth-details tool on TRUELOGER
              — no sign-up needed to try one.
            </p>
          </div>
        </section>

        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:mt-10 lg:grid-cols-3 xl:grid-cols-4">
          {TOOLS.map((tool) => (
            <li key={tool.id} className="h-full">
              <ToolCard tool={tool} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

/** Extremely low-contrast decoration, matching ReportsHero/GemstoneHero. */
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
