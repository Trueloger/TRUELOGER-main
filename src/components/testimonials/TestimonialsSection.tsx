"use client";

import { useEffect, useRef, useState } from "react";
import { LotusIcon } from "@/components/quick-services/icons";
import { TESTIMONIALS } from "./testimonial-data";
import { TestimonialMarqueeRow } from "./TestimonialMarqueeRow";

const ROW_1 = TESTIMONIALS.slice(0, 6);
const ROW_2 = TESTIMONIALS.slice(6, 12);

// Desktop-baseline speed/drift per row; mobile scales these down (slower
// loop, gentler parallax) via useIsMobile below rather than a second set
// of magic numbers scattered through JSX.
const ROWS: {
  items: typeof TESTIMONIALS;
  direction: "left" | "right";
  durationSec: number;
  parallaxPx: number;
}[] = [
  { items: ROW_1, direction: "left", durationSec: 42, parallaxPx: 18 },
  { items: ROW_2, direction: "right", durationSec: 52, parallaxPx: -14 },
];

// Small local hook, not a generic reusable one — this section is the only
// place on the site that needs a mobile/desktop split for animation
// tuning, so it lives here instead of a shared hooks file.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

/**
 * Testimonials — closes the homepage after CoursesSection, so its
 * gradient starts on the nav-ivory tone Courses ends on. Two infinite
 * CSS-marquee rows (see TestimonialMarqueeRow) run opposite directions
 * at different speeds, with a subtle scroll-linked horizontal parallax
 * layered on top via a single direct DOM write to --tst-scroll (no
 * setState per scroll frame — see the rAF-gated handler below).
 */
export function TestimonialsSection() {
  const parallaxRootRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const root = parallaxRootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId: number | null = null;

    const applyParallax = () => {
      rafId = null;
      const rect = root.getBoundingClientRect();
      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const raw = (viewportCenter - sectionCenter) / window.innerHeight;
      const clamped = Math.max(-1, Math.min(1, raw));
      root.style.setProperty("--tst-scroll", String(clamped));
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(applyParallax);
    };

    applyParallax();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="relative -mt-px overflow-hidden bg-gradient-to-b from-nav-ivory via-nav-lavender-mist to-nav-lavender-soft py-10 md:py-16"
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
            id="testimonials-heading"
            className="mt-3 scroll-mt-28 font-serif text-[2rem] leading-[1.15] text-nav-plum sm:text-4xl md:scroll-mt-32 md:text-5xl"
          >
            What Our
            <span className="text-nav-amethyst"> Seekers</span> Say
          </h2>

          <p className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80 sm:max-w-md sm:text-base">
            Real experiences from people who found clarity, guidance, and
            healing through their journey with us.
          </p>
        </div>

        <div ref={parallaxRootRef} className="mt-10 md:mt-14 flex flex-col gap-4 md:gap-6">
          {ROWS.map((row) => (
            <TestimonialMarqueeRow
              key={row.direction + row.durationSec}
              items={row.items}
              direction={row.direction}
              durationSec={isMobile ? Math.round(row.durationSec * 1.3) : row.durationSec}
              parallaxPx={isMobile ? Math.round(row.parallaxPx * 0.4) : row.parallaxPx}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
