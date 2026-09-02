"use client";

import type { Testimonial } from "./testimonial-data";
import { TestimonialCard } from "./TestimonialCard";

type Props = {
  items: Testimonial[];
  direction: "left" | "right";
  durationSec: number;
  parallaxPx: number;
};

/**
 * One infinite-marquee row. The track renders `items` twice back-to-back
 * and animates translateX(0 → -50%) — since the duplicate is pixel-
 * identical and starts exactly where the first copy ends, the loop has
 * no visible reset (see .testimonial-marquee-track in globals.css).
 * "right"-direction rows just play that same keyframe in reverse via
 * animation-direction, no second keyframe needed.
 *
 * The parallax layer reads --tst-scroll, a CSS custom property the
 * parent TestimonialsSection writes directly to the DOM on scroll (see
 * that component) — inherited through the cascade, so this row needs no
 * scroll listener or state of its own and never re-renders on scroll.
 *
 * Second copy is aria-hidden so screen readers hit each testimonial once
 * despite the doubled DOM.
 */
export function TestimonialMarqueeRow({ items, direction, durationSec, parallaxPx }: Props) {
  const track = [...items, ...items];

  return (
    <div className="testimonial-row overflow-hidden">
      <div
        className="w-max"
        style={{ transform: `translate3d(calc(var(--tst-scroll, 0) * ${parallaxPx}px), 0, 0)` }}
      >
        <div
          className="testimonial-marquee-track flex w-max items-stretch gap-6"
          style={{
            animationDuration: `${durationSec}s`,
            animationDirection: direction === "right" ? "reverse" : "normal",
          }}
        >
          {track.map((item, i) => (
            <TestimonialCard
              key={`${item.id}-${i}`}
              testimonial={item}
              ariaHidden={i >= items.length}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
