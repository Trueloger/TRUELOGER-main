import { ZODIAC_CARDS } from "./zodiac-ui-data";
import { ZodiacCard } from "./ZodiacCard";

/** Desktop/tablet — all 12 signs, 6 columns × 2 rows, nothing hidden,
 * no horizontal scroll. Below md, ZodiacCarousel (see that file) takes
 * over instead. */
export function ZodiacGrid() {
  return (
    <ul className="hidden gap-4 md:grid md:grid-cols-6 md:grid-rows-2">
      {ZODIAC_CARDS.map((card) => (
        <li key={card.slug} className="[container-type:inline-size]">
          <ZodiacCard {...card} />
        </li>
      ))}
    </ul>
  );
}
