"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type TouchEvent as ReactTouchEvent,
  type TransitionEvent as ReactTransitionEvent,
} from "react";
import { PUBLIC_GEMSTONE_PRODUCTS } from "@/lib/gemstones/gemstone-data";
import { GemstoneCard } from "@/components/gemstones/GemstoneCard";

const N = PUBLIC_GEMSTONE_PRODUCTS.length;
const TRANSITION_MS = 600;
const SWIPE_THRESHOLD_PX = 40;
// Below this many px of movement we haven't committed to a direction yet —
// lets a mostly-vertical drag fall through to page scroll untouched.
const DIRECTION_LOCK_PX = 10;

// How much of the viewport width the active card fills — low enough that
// the previous/next cards clearly peek in on both sides (the "previous >
// main > next" layout), same physical-track technique as HeroCarousel.
const RATIO = 0.69;
const GAP = 6;

// One clone of the last card prepended, one clone of the first appended —
// standard jump-free infinite loop on a physically translating track.
// trackIndex runs 0..N+1; 0 and N+1 are the clones.
const EXTENDED = [PUBLIC_GEMSTONE_PRODUCTS[N - 1], ...PUBLIC_GEMSTONE_PRODUCTS, PUBLIC_GEMSTONE_PRODUCTS[0]];

/**
 * Mobile-only (< md) peek carousel for the Sacred Gemstones cards —
 * previous card and next card visible at the edges, active card centered,
 * swipeable. Tablet and desktop keep the plain grid (see ProductsSection).
 * No autoplay: unlike the hero banners this is a browsable list of
 * products, not a rotating promo, so it only moves on user input.
 *
 * Unlike the old ProductCarousel (which baked a single fixed
 * width/height ratio for its FEATURED_PRODUCTS image-only card),
 * GemstoneCard's total height is image + name + price + two buttons, so
 * there's no one fixed aspect ratio to size the viewport from. Instead
 * the viewport height is left to normal flow: horizontal overflow stays
 * clipped (the swipe track), but vertical overflow is left visible, so
 * each slide sizes to its own natural content height. GemstoneCard's
 * internal h-full/mt-auto pattern (mirroring ServiceCard) means every
 * slide renders a near-identical natural height anyway.
 */
export function GemstoneCarousel() {
  const [trackIndex, setTrackIndex] = useState(1); // 1 == real card 0
  const [withTransition, setWithTransition] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [containerWidth, setContainerWidth] = useState(360);

  const viewportRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number; horizontal: boolean | null }>({
    x: 0,
    y: 0,
    horizontal: null,
  });

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setContainerWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const slideWidthPx = containerWidth * RATIO;
  const step = slideWidthPx + GAP;

  const goToRelative = useCallback((delta: number) => {
    setTrackIndex((t) => t + delta);
  }, []);
  const goNext = useCallback(() => goToRelative(1), [goToRelative]);
  const goPrev = useCallback(() => goToRelative(-1), [goToRelative]);

  // Snap invisibly from a clone back to the matching real card once the
  // physical move that landed on it has finished animating.
  function handleTrackTransitionEnd(e: ReactTransitionEvent<HTMLDivElement>) {
    if (e.propertyName !== "transform") return;
    if (trackIndex === N + 1) {
      setWithTransition(false);
      setTrackIndex(1);
    } else if (trackIndex === 0) {
      setWithTransition(false);
      setTrackIndex(N);
    }
  }
  useEffect(() => {
    if (withTransition) return;
    const raf = requestAnimationFrame(() => setWithTransition(true));
    return () => cancelAnimationFrame(raf);
  }, [withTransition]);

  // Backstop: the clone-snap above only fires once trackIndex lands
  // exactly on the clone (N+1 or 0) via a real transitionend event. If a
  // burst of updates ever gets applied without an intervening paint (e.g.
  // a long-frozen background tab), trackIndex can leapfrog past that
  // exact boundary and no transitionend ever fires to catch it, leaving
  // the carousel permanently blank. Re-check on every change and force
  // it back into range immediately if it ever drifts outside the clone
  // track, independent of transition events — see the matching comment
  // in HeroCarousel, same underlying bug.
  useEffect(() => {
    if (trackIndex >= 0 && trackIndex <= N + 1) return;
    // setTimeout, not requestAnimationFrame — see the matching comment in
    // HeroCarousel: rAF is paused on a hidden tab, the exact condition
    // that lets trackIndex drift, so a correction gated on it would never
    // actually run until the tab regains focus.
    const id = setTimeout(() => {
      setWithTransition(false);
      setTrackIndex(1 + (((trackIndex - 1) % N) + N) % N);
    }, 0);
    return () => clearTimeout(id);
  }, [trackIndex]);

  // Touch — track follows the finger 1:1 while dragging; release either
  // completes to the next/previous card or springs back.
  function onTouchStart(e: ReactTouchEvent<HTMLDivElement>) {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, horizontal: null };
  }
  function onTouchMove(e: ReactTouchEvent<HTMLDivElement>) {
    const t = e.touches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;

    if (touch.current.horizontal === null) {
      if (Math.abs(dx) > DIRECTION_LOCK_PX || Math.abs(dy) > DIRECTION_LOCK_PX) {
        touch.current.horizontal = Math.abs(dx) > Math.abs(dy);
        if (touch.current.horizontal) setIsDragging(true);
      }
    }
    if (touch.current.horizontal) {
      e.preventDefault();
      setDragOffsetPx(dx);
    }
  }
  function onTouchEnd(e: ReactTouchEvent<HTMLDivElement>) {
    if (touch.current.horizontal) {
      const dx = e.changedTouches[0].clientX - touch.current.x;
      if (Math.abs(dx) >= SWIPE_THRESHOLD_PX) {
        if (dx < 0) goNext();
        else goPrev();
      }
    }
    setDragOffsetPx(0);
    setIsDragging(false);
    touch.current.horizontal = null;
  }

  const activeRealIndex = ((trackIndex - 1) % N + N) % N;
  const baseOffset = containerWidth / 2 - (trackIndex * step + slideWidthPx / 2);
  const trackTransform = `translate3d(${baseOffset + dragOffsetPx}px, 0, 0)`;
  const transitionActive = withTransition && !isDragging;

  return (
    <div
      className="md:hidden"
      role="group"
      aria-roledescription="carousel"
      aria-label="Sacred Gemstones cards"
    >
      <div
        ref={viewportRef}
        className="relative w-full overflow-x-hidden overflow-y-visible"
        style={{ touchAction: "pan-y" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex items-start will-change-transform"
          style={{
            transform: trackTransform,
            transition: transitionActive
              ? `transform ${TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
              : "none",
          }}
          onTransitionEnd={handleTrackTransitionEnd}
        >
          {EXTENDED.map((product, i) => {
            const isClone = i === 0 || i === N + 1;
            const isActive = i === trackIndex;
            return (
              <div
                key={`${product.id}-${i}`}
                aria-hidden={isClone || !isActive}
                className="shrink-0 transition-[opacity,transform] duration-500 ease-out"
                style={{
                  width: slideWidthPx || undefined,
                  marginRight: GAP,
                  opacity: isActive ? 1 : 0.55,
                  transform: `scale(${isActive ? 1 : 0.9})`,
                }}
              >
                <GemstoneCard product={product} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Dot indicators — primary orientation cue since arrows would
          crowd the peeking neighbor cards at this width. */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {PUBLIC_GEMSTONE_PRODUCTS.map((product, i) => (
          <button
            key={product.id}
            type="button"
            aria-label={`Go to ${product.name}`}
            aria-current={i === activeRealIndex}
            onClick={() => setTrackIndex(i + 1)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeRealIndex
                ? "w-5 bg-nav-amethyst"
                : "w-2 bg-nav-lavender-line"
            }`}
          />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {`Showing ${PUBLIC_GEMSTONE_PRODUCTS[activeRealIndex].name}, ${activeRealIndex + 1} of ${N}`}
      </p>
    </div>
  );
}
