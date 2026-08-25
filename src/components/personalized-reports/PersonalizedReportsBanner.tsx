import Image from "next/image";
import { storageImage } from "@/lib/storage-image";

// Native dimensions of the supplied banner artwork — used to reserve exact
// aspect-ratio space (no layout shift) and to compute a correct height for
// any container width via next/image's responsive width/height sizing.
const BANNER_WIDTH = 1672;
const BANNER_HEIGHT = 941;

/**
 * Personalized Reports section. The supplied banner is a single complete,
 * pre-designed artwork (branding, heading, copy, feature icons, report
 * cards, and CTA all baked in) — this component only presents that image
 * at full width, preserving its aspect ratio. No HTML text, cards, or
 * buttons are layered on top; that would duplicate content already in
 * the artwork.
 */
export function PersonalizedReportsBanner() {
  return (
    <section
      aria-label="Personalized Reports, written for you"
      className="relative w-full px-4 py-6 sm:px-6 md:px-8 md:py-8"
    >
      {/* No background here — the page-level wrapper (see page.tsx) now
          paints one continuous wash behind this, QuickServices and
          ExploreServices together. */}
      <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-2xl md:rounded-3xl">
        <Image
          src={storageImage("/personalized-reports/banner.png")}
          alt="TRUELOGER Personalized Reports, written for you. Go beyond general predictions with detailed readings shaped by your birth chart, planetary patterns and personal life themes — 100% Personalized, In-Depth Analysis, Easy to Understand, Private &amp; Secure. Kundli, Marriage, Career, Love &amp; Relationship, Finance and Life reports. Explore All Personalized Reports."
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
