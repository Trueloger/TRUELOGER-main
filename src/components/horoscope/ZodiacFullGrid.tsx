"use client";

// src/components/horoscope/ZodiacFullGrid.tsx
// All 12 signs, always visible, one responsive grid — for the
// DEDICATED Daily/Weekly/Monthly Horoscope pages, deliberately not
// the homepage's ZodiacGrid+ZodiacCarousel combo (a compact 4-visible
// swipe strip on mobile, appropriate for a homepage teaser section but
// not for a page whose entire purpose is picking a sign). 2 columns on
// mobile is comfortable and readable without forcing a swipe gesture
// just to see the other 8 signs.
import { ZODIAC_CARDS } from "./zodiac-ui-data";
import { ZodiacCard } from "./ZodiacCard";

export function ZodiacFullGrid({ hrefBase = "/horoscope" }: { hrefBase?: string }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-4">
      {ZODIAC_CARDS.map((card) => (
        <li key={card.slug} className="[container-type:inline-size]">
          <ZodiacCard {...card} hrefBase={hrefBase} />
        </li>
      ))}
    </ul>
  );
}
