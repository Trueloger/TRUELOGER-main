import Image from "next/image";

// Native dimensions of the supplied banner artwork — used to reserve exact
// aspect-ratio space (no layout shift) and let next/image scale it
// proportionally at every viewport width via the "block h-auto w-full"
// pattern below (same approach as PersonalizedReportsBanner, which this
// section is styled to match exactly — both are single, complete banner
// artworks presented full-width in a rounded card, back to back, so the
// page reads as one continuous set of "explore this" banners rather than
// a section that appeared out of nowhere).
const BANNER_WIDTH = 1774;
const BANNER_HEIGHT = 887;

/**
 * Courses section — placed after ProductsSection, closing the page. The
 * supplied banner is a single complete, pre-designed artwork — heading,
 * tagline, copy, "Explore Now" CTA, zodiac chart, Vedic books, lotus and
 * gold ornamental border are all baked in. This component only presents
 * that image, scaled to its own aspect ratio at every breakpoint — never
 * cropped (object-fit: cover would clip the right-side artwork) and never
 * redrawn. No HTML text, heading, or button is layered on top; that would
 * duplicate content already baked into the artwork. Same rounded-card
 * treatment as PersonalizedReportsBanner, but — unlike that one — this
 * section sits outside the homepage's shared wash div (see page.tsx), so
 * it paints its own background wash picking up ProductsSection's ending
 * nav-lavender-soft tone and fading to nav-ivory, with -mt-px overlapping
 * Products' last device pixel, matching the seam technique every other
 * section boundary on this page already uses.
 */
export function CoursesSection() {
  return (
    <section
      aria-label="Courses — Learn. Explore. Transform. Learn astrology, spirituality, healing, and ancient wisdom through guided courses designed for your journey."
      className="relative -mt-px w-full bg-gradient-to-b from-nav-lavender-soft to-nav-ivory px-4 py-8 sm:px-6 md:px-8 md:py-12"
    >
      <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-2xl md:rounded-3xl">
        <Image
          src="/banner/courses banner.png"
          alt="Courses — Learn. Explore. Transform. Learn astrology, spirituality, healing, and ancient wisdom through guided courses designed for your journey. Explore Now."
          width={BANNER_WIDTH}
          height={BANNER_HEIGHT}
          sizes="(min-width: 1320px) 1320px, 100vw"
          quality={92}
          className="block h-auto w-full"
        />
      </div>
    </section>
  );
}
