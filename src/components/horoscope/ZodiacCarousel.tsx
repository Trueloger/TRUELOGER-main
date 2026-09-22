"use client";

// src/components/horoscope/ZodiacCarousel.tsx
import { useEffect, useRef } from "react";
import { ZODIAC_CARDS } from "./zodiac-ui-data";
import { ZodiacCard } from "./ZodiacCard";

// 4 cards visible per view: card width = (100% - 3 gaps) / 4. Kept as
// a real CSS calc() (not a fixed px value) so it holds correctly from
// 320px through 430px+ instead of being tuned for one phone width.
const GAP_REM = 0.75; // matches gap-3
const CARD_WIDTH = `calc((100% - ${GAP_REM * 3}rem) / 4)`;

// Session-only scroll memory (never localStorage) — restoring exactly
// where the user was horizontally is what makes "Back" feel like
// returning to the same interface instead of a reset, per the sign
// highlight in ZodiacCard.tsx doing the same job for "which sign".
const SCROLL_KEY = "truelogr:horoscope:carousel-scroll";

/** Mobile-only (< md) horizontal carousel — native CSS scroll-snap, no
 * JS-driven motion. Deliberately not PujaCarousel's peek-carousel (1
 * active + 2 peeking, JS-driven infinite loop with its own bug
 * history) — this needs a different shape (4 fully visible cards)
 * that scroll-snap handles natively and more robustly.
 * overscroll-x-contain keeps rubber-band scrolling from leaking into
 * the page. Client-only for the scroll-position restore below; the
 * scroll-snap behavior itself is still pure CSS. */
export function ZodiacCarousel({ hrefBase }: { hrefBase?: string } = {}) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    try {
      const saved = sessionStorage.getItem(SCROLL_KEY);
      if (saved) el.scrollLeft = Number(saved);
    } catch {
      /* ignore */
    }

    // rAF-throttled — writes straight to sessionStorage, never React
    // state, so scrolling never triggers a re-render.
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        try {
          sessionStorage.setItem(SCROLL_KEY, String(el!.scrollLeft));
        } catch {
          /* ignore */
        }
      });
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="md:hidden" role="group" aria-label="Zodiac signs — swipe to browse">
      <ul
        ref={listRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {ZODIAC_CARDS.map((card) => (
          <li
            key={card.slug}
            className="shrink-0 snap-start [container-type:inline-size]"
            style={{ width: CARD_WIDTH }}
          >
            <ZodiacCard {...card} hrefBase={hrefBase} />
          </li>
        ))}
      </ul>
    </div>
  );
}
