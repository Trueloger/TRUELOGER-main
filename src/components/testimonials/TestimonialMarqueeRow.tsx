"use client";

import { useEffect, useRef } from "react";
import type { Testimonial } from "./testimonial-data";
import { TestimonialCard } from "./TestimonialCard";

type Props = {
  items: Testimonial[];
  direction: "left" | "right";
  durationSec: number;
  parallaxPx: number;
  paused?: boolean;
  onExpand?: (testimonial: Testimonial) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

/**
 * One infinite-marquee row — JS-driven transform (rAF loop advancing a
 * single offset, applied via a direct DOM write, never React state per
 * frame) rather than a CSS `animation`, specifically so the SAME offset
 * value can be grabbed and dragged by the user: auto-scroll and manual
 * drag are two ways of changing one number, not two competing systems.
 * The track renders `items` twice back-to-back and wraps the offset by
 * exactly half its scrollWidth once it crosses that boundary — since
 * the duplicate is pixel-identical, the wrap is invisible, the same
 * technique the previous CSS-keyframe version used, just driven by JS
 * now instead of the animation engine.
 *
 * The parallax layer reads --tst-scroll on an outer wrapper, written by
 * the parent (TestimonialsSection) — unchanged, still independent of
 * this row's own offset.
 *
 * Second copy is aria-hidden so screen readers hit each testimonial once
 * despite the doubled DOM.
 */
export function TestimonialMarqueeRow({ items, direction, durationSec, parallaxPx, paused, onExpand, onDragStart, onDragEnd }: Props) {
  const track = [...items, ...items];

  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const halfWidthRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const pausedRef = useRef(!!paused);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const reducedMotionRef = useRef(false);

  // Real pointer drag beyond this many px suppresses the click that
  // fires on pointerup — otherwise dragging the row to scroll it also
  // pops open whichever card happens to be under the cursor on release.
  const CLICK_SUPPRESS_PX = 6;

  useEffect(() => {
    pausedRef.current = !!paused;
  }, [paused]);

  // One card's full row width (items.length worth) travelled per
  // second, derived from the original durationSec (the time to cover
  // the whole track once) so the visual speed matches exactly what the
  // CSS-animation version played at.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function measure() {
      const w = el!.scrollWidth;
      halfWidthRef.current = w / 2;
      // "right" rows start already offset by one full copy so the wrap
      // logic (below) can treat both directions identically — moving
      // the offset toward 0 for "right", away from 0 for "left".
      if (direction === "right" && offsetRef.current === 0) {
        offsetRef.current = -halfWidthRef.current;
        el!.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      }
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    function frame(ts: number) {
      rafRef.current = requestAnimationFrame(frame);
      if (reducedMotionRef.current || pausedRef.current || draggingRef.current) {
        lastTsRef.current = ts;
        return;
      }
      const last = lastTsRef.current ?? ts;
      const dt = (ts - last) / 1000;
      lastTsRef.current = ts;

      const half = halfWidthRef.current;
      if (half <= 0) return;
      const speed = half / durationSec; // px/sec, always positive
      const delta = direction === "left" ? -speed * dt : speed * dt;

      let next = offsetRef.current + delta;
      // Wrap seamlessly — both directions keep the offset within
      // (-half, 0], since the track is exactly two copies wide.
      if (next <= -half) next += half;
      if (next > 0) next -= half;
      offsetRef.current = next;
      el!.style.transform = `translate3d(${next}px, 0, 0)`;
    }
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      ro.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pxPerSec intentionally recomputed inline each frame from refs, not a dependency
  }, [direction, durationSec]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    dragDistanceRef.current = 0;
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
    onDragStart?.();
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const el = trackRef.current;
    if (!el) return;
    const half = halfWidthRef.current;
    const dragDelta = e.clientX - dragStartXRef.current;
    dragDistanceRef.current = Math.max(dragDistanceRef.current, Math.abs(dragDelta));
    let next = dragStartOffsetRef.current + dragDelta;
    if (half > 0) {
      while (next <= -half) next += half;
      while (next > 0) next -= half;
    }
    offsetRef.current = next;
    el.style.transform = `translate3d(${next}px, 0, 0)`;
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    onDragEnd?.();
  }

  // Click fires on the card under the cursor right after pointerup —
  // capture-phase so it runs before the card's own onClick, and stop it
  // outright once the pointer actually travelled (a real drag, not a tap).
  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (dragDistanceRef.current > CLICK_SUPPRESS_PX) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  return (
    <div className="testimonial-row overflow-hidden">
      <div
        className="w-max"
        style={{ transform: `translate3d(calc(var(--tst-scroll, 0) * ${parallaxPx}px), 0, 0)` }}
      >
        <div
          ref={trackRef}
          className="flex w-max cursor-grab items-stretch gap-6 select-none active:cursor-grabbing"
          style={{ touchAction: "pan-y" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
        >
          {track.map((item, i) => (
            <TestimonialCard
              key={`${item.id}-${i}`}
              testimonial={item}
              ariaHidden={i >= items.length}
              onExpand={onExpand ? () => onExpand(item) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
