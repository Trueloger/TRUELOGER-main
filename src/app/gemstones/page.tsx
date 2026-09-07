// src/app/gemstones/page.tsx
// /gemstones landing page: premium banner, a one-line intro (no extra
// subheading block — the product cards carry the content), and a
// responsive grid of every gemstone product. Server component —
// GemstoneCard itself is the client boundary (needs useCart + the
// Ratti sheet). Mirrors src/app/consult/page.tsx's structure exactly.
import type { Metadata } from "next";
import { GemstoneHero } from "@/components/gemstones/GemstoneHero";
import { GemstoneCard } from "@/components/gemstones/GemstoneCard";
import { GEMSTONE_PRODUCTS } from "@/lib/gemstones/gemstone-data";

export const metadata: Metadata = {
  title: "Gemstones | TRUELOGER",
  description:
    "Shop gemstones traditionally recommended in Vedic astrology — Ruby, Pearl, Emerald, Blue Sapphire, Yellow Sapphire, Coral, Hessonite, and Cat's Eye, in the Ratti weight you need.",
};

export default function GemstonesPage() {
  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      <div className="mx-auto max-w-[1320px] px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
        <GemstoneHero />

        <p
          id="gemstone-grid"
          className="mx-auto mt-10 max-w-2xl scroll-mt-28 text-center text-[0.95rem] text-nav-plum/80 md:mt-14 md:scroll-mt-32"
        >
          Choose a gemstone below, pick your Ratti weight, and add it straight to your cart.
        </p>

        {/* 3 columns from the narrowest phone up through tablet, 4 from
            desktop up — same grid pattern as /consult (see
            src/app/consult/page.tsx), since GemstoneCard already
            solves the compact-below-sm responsive layout itself. */}
        <ul className="mt-6 grid grid-cols-3 gap-3 sm:gap-5 md:mt-8 lg:grid-cols-4">
          {GEMSTONE_PRODUCTS.map((product) => (
            <li key={product.id} className="h-full">
              <GemstoneCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
