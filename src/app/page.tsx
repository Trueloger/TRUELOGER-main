import { HeroCarousel } from "@/components/hero/HeroCarousel";
import { HeroToServicesCurve } from "@/components/hero/HeroToServicesCurve";
import { HoroscopeSection } from "@/components/horoscope/HoroscopeSection";
import { QuickServices } from "@/components/quick-services/QuickServices";
import { ExploreServices } from "@/components/explore-services/ExploreServices";
import { PersonalizedReportsBanner } from "@/components/personalized-reports/PersonalizedReportsBanner";
import { HealingSection } from "@/components/healing/HealingSection";
import { PujaSection } from "@/components/puja/PujaSection";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <HeroCarousel />
      <HeroToServicesCurve />
      <HoroscopeSection />

      {/* QuickServices, ExploreServices, PersonalizedReportsBanner and
          HealingSection share ONE continuous background wash instead of
          each section painting its own and relying on matching edge
          colors — independently laid-out boxes trying to abut at a
          pixel-perfect seam kept producing a hairline gap on some real
          phones (confirmed via an actual device screenshot) no matter how
          precisely the edge colors were matched or how generously they
          were overlapped. A single shared paint surface behind all four
          makes that seam structurally impossible rather than just
          visually unlikely. Ends on a soft lavender for Healing's own
          "restorative" tone. HoroscopeSection now owns the tuck-under-the-dome
          negative margin that used to live here, so this wrapper just needs
          the same plain -mt-px seam every other section boundary on this
          page uses. */}
      <div className="relative z-10 -mt-px">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, var(--color-nav-ivory) 0%, var(--color-nav-ivory) 28%, var(--color-nav-lavender-mist) 38%, var(--color-nav-pearl) 48%, var(--color-nav-lavender-mist) 58%, var(--color-nav-ivory) 68%, var(--color-nav-lavender-mist) 82%, var(--color-nav-lavender-soft) 100%)",
          }}
        />
        <QuickServices />
        <ExploreServices />
        <PersonalizedReportsBanner />
        <HealingSection />
      </div>

      <PujaSection />
    </main>
  );
}
