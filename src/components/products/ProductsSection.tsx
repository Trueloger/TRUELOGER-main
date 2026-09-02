import { LotusIcon } from "@/components/quick-services/icons";
import { FEATURED_PRODUCTS } from "./product-data";
import { ProductCard } from "./ProductCard";
import { ProductCarousel } from "./ProductCarousel";

/**
 * Sacred Gemstones — a homepage featured-products showcase, not the full
 * Mall catalog. Exactly six cards, sourced from the first six images in
 * public/gemstones image/ (see product-data.ts). Heading and ornament
 * follow the same structure as ExploreServices/HealingSection/PujaSection
 * above it. -mt-px pulls this section's background up over Puja's last
 * device pixel for the same reason those sections overlap by 1px instead
 * of abutting — see PujaSection's comment for the full explanation.
 *
 * Under md: a swipeable previous/main/next peek carousel (see
 * ProductCarousel), same pattern as PujaSection. md and up: plain grid,
 * 3 columns from sm so tablets get a 3x2 layout, and all six in a single
 * row from lg once there's room for six ~200px-wide cards to stay
 * readable.
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
          <ProductCarousel />

          <ul className="hidden md:grid sm:grid-cols-3 sm:gap-6 lg:grid-cols-6">
            {FEATURED_PRODUCTS.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
