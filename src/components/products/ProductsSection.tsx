import { LotusIcon } from "@/components/quick-services/icons";
import { listPublishedProducts } from "@/lib/products/store";
import { toGemstoneProduct } from "@/lib/products/gemstone-adapter";
import { GemstoneCard } from "@/components/gemstones/GemstoneCard";
import { GemstoneCarousel } from "@/components/gemstones/GemstoneCarousel";

/**
 * Sacred Gemstones — a homepage showcase of the real gemstone catalogue,
 * fetched live from the Firestore product store (every published
 * gemstone, excluding the internal ₹1 test-payment item), not a
 * curated subset. Each GemstoneCard's own "View Details" link is
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
// The 8 canonical gemstones shown on the homepage showcase — the
// catalogue itself (src/lib/gemstones/gemstone-data.ts +
// scripts/dev/seed-products.ts) has grown to include several
// substitute/alternative stones (Moonstone, Rose Quartz, etc.) that
// stay fully browsable on /gemstones and its product pages, but are
// deliberately excluded here so the homepage keeps exactly these 8
// primary Navaratna stones, per the "homepage should show exactly
// eight cards" requirement — this does NOT delete anything from the
// catalogue, it only filters what's shown on this one section.
const HOMEPAGE_GEMSTONE_SLUGS = [
  "ruby",
  "pearl",
  "red-coral",
  "emerald",
  "yellow-sapphire",
  "blue-sapphire",
  "hessonite",
  "cats-eye",
];

export async function ProductsSection() {
  const products = (await listPublishedProducts("gemstone"))
    .filter((p) => HOMEPAGE_GEMSTONE_SLUGS.includes(p.slug))
    .sort((a, b) => HOMEPAGE_GEMSTONE_SLUGS.indexOf(a.slug) - HOMEPAGE_GEMSTONE_SLUGS.indexOf(b.slug))
    .map(toGemstoneProduct);

  return (
    <section
      aria-labelledby="products-heading"
      className="relative -mt-px bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft py-10 md:py-16"
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
          <GemstoneCarousel products={products} />

          <ul className="hidden md:grid sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {products.map((product) => (
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
