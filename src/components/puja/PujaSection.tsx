import { LotusIcon } from "@/components/quick-services/icons";
import { PUJA_SERVICES } from "./puja-data";
import { PujaCard } from "./PujaCard";
import { PujaCarousel } from "./PujaCarousel";

/**
 * Puja & Rituals — six sacred-ritual booking cards. Each card is the
 * approved template image (public/puja cards.png: border, puja photo,
 * pre-made "Book Now →" button, corner + lotus ornaments) with real HTML
 * title/description/detail overlaid inside its blank content area —
 * see PujaCard. Heading and grid chrome follow the same structure as
 * ExploreServices/HealingSection above it; own soft background continues
 * the ivory→lavender tone the shared wash in page.tsx ends on. -mt-px
 * pulls this section's background up over Healing's last device pixel —
 * both paint the same nav-lavender-soft there, but two independently
 * laid-out boxes handing off at an exact seam still shows a hairline
 * gap on some real-phone DPRs (mobile only; same class of bug the wash
 * div's own comment in page.tsx describes), so this overlaps by 1px
 * instead of abutting.
 */
export function PujaSection() {
  return (
    <section
      aria-labelledby="puja-heading"
      className="relative -mt-px bg-gradient-to-b from-nav-lavender-soft via-nav-pearl to-nav-ivory py-16 md:py-24"
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
            id="puja-heading"
            className="mt-3 font-serif text-[2rem] leading-[1.15] text-nav-plum sm:text-4xl md:text-5xl"
          >
            Puja
            <span className="text-nav-amethyst"> &amp; Rituals</span>
          </h2>

          <p className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80 sm:max-w-md sm:text-base">
            Sacred Vedic rituals performed with devotion, intention, and
            authentic traditions.
          </p>
        </div>

        {/* Under md: a swipeable previous/main/next peek carousel (see
            PujaCarousel) — six overlaid-text cards don't compress into a
            multi-column mobile grid without becoming unreadable, so they
            browse one at a time instead. md and up: plain grid, 2 cols
            tablet, 3 from lg. */}
        <div className="mt-10 md:mt-14">
          <PujaCarousel />

          <ul className="hidden md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
            {PUJA_SERVICES.map((service) => (
              <li key={service.id}>
                <PujaCard service={service} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
