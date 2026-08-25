"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type TouchEvent as ReactTouchEvent,
  type TransitionEvent as ReactTransitionEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HERO_BANNERS, HERO_BANNER_WIDTH, HERO_BANNER_HEIGHT } from "./hero-banners";

const N = HERO_BANNERS.length;
const AUTOPLAY_MS = 6000;
const TRANSITION_MS = 700;
const SWIPE_THRESHOLD_PX = 50;
// Below this many px of movement we haven't committed to a direction yet —
// lets a mostly-vertical drag fall through to page scroll untouched.
const DIRECTION_LOCK_PX = 10;
const ASPECT = HERO_BANNER_WIDTH / HERO_BANNER_HEIGHT;

// One clone of the last slide prepended, one clone of the first appended —
// the standard technique for a jump-free infinite loop on a physically
// translating track. trackIndex runs 0..N+1; 0 and N+1 are the clones.
const EXTENDED = [HERO_BANNERS[N - 1], ...HERO_BANNERS, HERO_BANNERS[0]];

type Tier = "mobile" | "tablet" | "desktop";

// How much of the active slide's width is shown, and the gap between
// slides, per breakpoint. Mobile ratio is exactly 1 (no gap) so neighbors
// land fully outside the clipped viewport — zero peek, as required.
const TIER_CONFIG: Record<Tier, { ratio: number; gap: number }> = {
  mobile: { ratio: 1, gap: 0 },
  tablet: { ratio: 0.82, gap: 20 },
  desktop: { ratio: 0.64, gap: 28 },
};

function getTier(containerWidth: number): Tier {
  if (containerWidth < 768) return "mobile";
  if (containerWidth < 1024) return "tablet";
  return "desktop";
}

/**
 * Center-focused physical carousel: previous/next banners peek at the
 * edges on desktop/tablet, and the whole row (the "track") moves via a
 * single translate3d — never a crossfade. Mobile shows only the active
 * banner (ratio 1 = zero peek) and adds live finger-follow dragging.
 */
export function HeroCarousel() {
  const [trackIndex, setTrackIndex] = useState(1); // 1 == real slide 0
  const [withTransition, setWithTransition] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [containerWidth, setContainerWidth] = useState(1280);

  const viewportRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number; horizontal: boolean | null }>({
    x: 0,
    y: 0,
    horizontal: null,
  });

  // Measure the actual rendered viewport width so slide widths/centering
  // are exact px, not guessed percentages. useLayoutEffect so the very
  // first paint already reflects the real width (no flash of wrong size).
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setContainerWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tier = getTier(containerWidth);
  const { ratio, gap } = TIER_CONFIG[tier];
  const slideWidthPx = containerWidth * ratio;
  const step = slideWidthPx + gap;
  const slideHeightPx = slideWidthPx / ASPECT;

  const goToRelative = useCallback((delta: number) => {
    setTrackIndex((t) => t + delta);
    setResetToken((t) => t + 1);
  }, []);
  const goNext = useCallback(() => goToRelative(1), [goToRelative]);
  const goPrev = useCallback(() => goToRelative(-1), [goToRelative]);

  // Autoplay — restarts whenever paused state changes or a manual
  // navigation happens, so the next automatic advance isn't immediate.
  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      setTrackIndex((t) => t + 1);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [isPaused, resetToken]);

  // Snap invisibly from a clone back to the matching real slide once the
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
  // exactly on the clone (N+1 or 0) via a real transitionend event. A
  // long-backgrounded/frozen tab can coalesce many queued autoplay ticks
  // and apply them without ever painting an intermediate frame, so
  // trackIndex can leapfrog straight past that exact boundary — no
  // transitionend ever fires, nothing is ever active again, and the
  // carousel goes permanently blank (this is the bug where "after the
  // last banner, the first banner doesn't come back"). Re-check on every
  // change and force it back into range immediately if it ever drifts
  // outside the clone track, independent of transition events.
  useEffect(() => {
    if (trackIndex >= 0 && trackIndex <= N + 1) return;
    // setTimeout, not requestAnimationFrame: rAF is paused indefinitely on
    // a hidden/backgrounded tab, which is exactly the condition that lets
    // trackIndex drift out of range in the first place — a correction
    // gated on rAF would schedule but never actually run until the tab
    // regains focus. setTimeout still fires (throttled, but not paused)
    // regardless of visibility, so this heals as soon as the JS thread
    // is next free rather than waiting on a paint that may not come.
    const id = setTimeout(() => {
      setWithTransition(false);
      setTrackIndex(1 + (((trackIndex - 1) % N) + N) % N);
    }, 0);
    return () => clearTimeout(id);
  }, [trackIndex]);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    }
  }

  // Touch — the track visually follows the finger 1:1 (no transition)
  // while dragging; on release it either completes to the next/previous
  // slide or springs back, both as a smooth animated settle.
  function onTouchStart(e: ReactTouchEvent<HTMLDivElement>) {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, horizontal: null };
    setIsPaused(true);
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
    setIsPaused(false);
    setResetToken((t) => t + 1);
  }

  const activeRealIndex = ((trackIndex - 1) % N + N) % N;
  const baseOffset = containerWidth / 2 - (trackIndex * step + slideWidthPx / 2);
  const trackTransform = `translate3d(${baseOffset + dragOffsetPx}px, 0, 0)`;
  const transitionActive = withTransition && !isDragging;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="TRUELOGER hero banners"
      className="relative w-full bg-nav-lavender-soft pt-24 pb-10 md:pt-28 md:pb-14"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={onKeyDown}
    >
      {/* margin wrapper (mobile side-margins); the overflow-hidden clip
          boundary lives one level in so nothing peeks through padding */}
      <div className="px-4 md:px-0">
        <div
          ref={viewportRef}
          className="relative w-full overflow-hidden"
          style={{ height: slideHeightPx || undefined, touchAction: "pan-y" }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex items-center will-change-transform"
            style={{
              transform: trackTransform,
              transition: transitionActive
                ? `transform ${TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
                : "none",
            }}
            onTransitionEnd={handleTrackTransitionEnd}
          >
            {EXTENDED.map((banner, i) => {
              const isClone = i === 0 || i === N + 1;
              const isActive = i === trackIndex;
              return (
                <div
                  key={`${banner.id}-${i}`}
                  aria-hidden={isClone || !isActive}
                  role={isClone ? undefined : "group"}
                  aria-roledescription={isClone ? undefined : "slide"}
                  aria-label={
                    isClone ? undefined : `TRUELOGER hero banner ${((i - 1) % N) + 1} of ${N}`
                  }
                  className="relative shrink-0 overflow-hidden rounded-2xl shadow-lg transition-[opacity,transform] duration-500 ease-out md:rounded-3xl"
                  style={{
                    width: slideWidthPx || undefined,
                    height: slideHeightPx || undefined,
                    marginRight: gap,
                    opacity: isActive ? 1 : 0.78,
                    transform: `scale(${isActive ? 1 : 0.94})`,
                    boxShadow: isActive
                      ? "0 24px 48px -12px rgba(70, 40, 120, 0.35)"
                      : "0 10px 24px -10px rgba(70, 40, 120, 0.2)",
                  }}
                >
                  <Image
                    src={banner.src}
                    alt={isClone ? "" : banner.alt}
                    fill
                    sizes="(min-width: 1024px) 65vw, (min-width: 768px) 82vw, 100vw"
                    quality={90}
                    priority={i >= 0 && i <= 2}
                    style={{ objectFit: "contain" }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop/tablet-only controls, centered beneath the carousel. */}
      <div className="mt-5 hidden items-center justify-center gap-4 md:flex">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous banner"
          className="flex items-center justify-center rounded-full border border-nav-lavender-line bg-nav-pearl/90 p-3 text-nav-violet shadow-sm backdrop-blur transition-all duration-200 hover:bg-nav-lavender-mist hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-amethyst"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label="Next banner"
          className="flex items-center justify-center rounded-full border border-nav-lavender-line bg-nav-pearl/90 p-3 text-nav-violet shadow-sm backdrop-blur transition-all duration-200 hover:bg-nav-lavender-mist hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-amethyst"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Visually-hidden live status for screen readers, independent of
          the per-slide aria-hidden toggling above. */}
      <p className="sr-only" aria-live="polite">
        {`Showing TRUELOGER hero banner ${activeRealIndex + 1} of ${N}`}
      </p>
    </section>
  );
}
