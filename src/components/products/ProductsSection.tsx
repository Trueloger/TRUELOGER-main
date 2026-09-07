import { LotusIcon } from "@/components/quick-services/icons";
import { GEMSTONE_PRODUCTS } from "@/lib/gemstones/gemstone-data";
import { GemstoneCard } from "@/components/gemstones/GemstoneCard";
import { GemstoneCarousel } from "@/components/gemstones/GemstoneCarousel";

/**
 * Sacred Gemstones — a homepage showcase of the real gemstone catalogue
 * (all eight GEMSTONE_PRODUCTS, see src/lib/gemstones/gemstone-data.ts),
 * not a curated subset. Each GemstoneCard's own "View Details" link is
 * what leads through to the full catalogue at /gemstones — nothing else
 * to wire here. Heading and ornament follow the same structure as
 * ExploreServices/HealingSection/PujaSection above it. -mt-px pulls this
 * section's background up over Puja's last device pixel for the same
 * reason those sections overlap by 1px instead of abutting — see
 * PujaSection's comment for the full explanation.
 *
 * Under md: a swipeable previous/main/next peek carousel (see
 * GemstoneCarousel), same pattern as PujaSection. md and up: plain grid,
 * 3 columns from sm so tablets get a readable layout, and 4 columns from
 * lg (matching /gemstones' own desktop grid) so all eight products lay
 * out as two even rows of four.
 */
export function ProductsSection() {
  return (
    <section
      aria-labelledby="products-heading"
      className="relative -mt-px bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft py-16 md:py-24"
    >
      <div className="relative mx-auto max-w-[1320px] px-4 sm:px-6 md:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-md text-center sm:max-w-xl md:max-w-2xl">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
            <LotusIcon className="h-6 w-6 text-nav-amethyst-deep" strokeWidth={1.3} />
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          </div>

          <h2
            id="products-heading"
            className="mt-3 scroll-mt-28 font-serif text-[2rem] leading-[1.15] text-nav-plum sm:text-4xl md:scroll-mt-32 md:text-5xl"
          >
            Sacred
            <span className="text-nav-amethyst"> Gemstones</span>
          </h2>

          <p className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80 sm:max-w-md sm:text-base">
            Handpicked gemstones to balance your energy and align you with
            favorable planetary influences.
          </p>
        </div>

        <div className="mt-10 md:mt-14">
          <GemstoneCarousel />

          <ul className="hidden md:grid sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {GEMSTONE_PRODUCTS.map((product) => (
              <li key={product.id}>
                <GemstoneCard product={product} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
