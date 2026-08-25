import { HeroCarousel } from "@/components/hero/HeroCarousel";
import { QuickServices } from "@/components/quick-services/QuickServices";
import { ExploreServices } from "@/components/explore-services/ExploreServices";
import { PersonalizedReportsBanner } from "@/components/personalized-reports/PersonalizedReportsBanner";
import { HealingSection } from "@/components/healing/HealingSection";
import { PujaSection } from "@/components/puja/PujaSection";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <HeroCarousel />

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
          "restorative" tone. */}
      <div className="relative z-10 -mt-[clamp(1.75rem,4vw,3rem)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 top-[calc(clamp(1.75rem,4vw,3rem)-6px)]"
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
