// src/components/horoscope/ZodiacCarousel.tsx
import { ZODIAC_CARDS } from "./zodiac-ui-data";
import { ZodiacCard } from "./ZodiacCard";

// 4 cards visible per view: card width = (100% - 3 gaps) / 4. Kept as
// a real CSS calc() (not a fixed px value) so it holds correctly from
// 320px through 430px+ instead of being tuned for one phone width.
const GAP_REM = 0.75; // matches gap-3
const CARD_WIDTH = `calc((100% - ${GAP_REM * 3}rem) / 4)`;

/** Mobile-only (< md) horizontal carousel — native CSS scroll-snap, no
 * JS. Deliberately not PujaCarousel's peek-carousel (1 active + 2
 * peeking, JS-driven infinite loop with its own bug history) — this
 * needs a different shape (4 fully visible cards) that scroll-snap
 * handles natively and more robustly. overscroll-x-contain keeps
 * rubber-band scrolling from leaking into the page. */
export function ZodiacCarousel() {
  return (
    <div className="md:hidden" role="group" aria-label="Zodiac signs — swipe to browse">
      <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ZODIAC_CARDS.map((card) => (
          <li
            key={card.slug}
            className="shrink-0 snap-start [container-type:inline-size]"
            style={{ width: CARD_WIDTH }}
          >
            <ZodiacCard {...card} />
          </li>
        ))}
      </ul>
    </div>
  );
}
