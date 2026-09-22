"use client";

// src/components/forms/WheelColumn.tsx
// One scrollable, snap-to-center wheel column — extracted from
// TimeOfBirthField.tsx (which first introduced this pattern for its
// hour/minute/AM-PM columns) so DateOfBirthField.tsx can reuse the
// exact same interaction for its month/day/year columns instead of a
// second, independently-drifting implementation. Native touch scroll +
// `scroll-snap-type`, the same lightweight approach this codebase
// already uses for the mobile zodiac/testimonial carousels — no drag
// library. Arrow keys and click both work, so it's a real,
// keyboard-usable listbox, not a decorative scroller.
import { useEffect, useRef } from "react";

export const WHEEL_ITEM_H = 44;
const VISIBLE_ROWS = 5;
export const WHEEL_HEIGHT = WHEEL_ITEM_H * VISIBLE_ROWS;
export const WHEEL_PAD = WHEEL_ITEM_H * Math.floor(VISIBLE_ROWS / 2);

export function WheelColumn({
  label,
  values,
  index,
  onSelect,
  className = "",
}: {
  label: string;
  values: string[];
  index: number;
  onSelect: (index: number) => void;
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressScroll = useRef(false);

  // Keep the wheel's scroll position in sync when `index` changes from
  // outside a user scroll gesture (opening the panel, arrow-key nav,
  // clicking an option, or — for DateOfBirthField — the day list
  // shrinking when the month/year changes).
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const target = index * WHEEL_ITEM_H;
    if (Math.abs(el.scrollTop - target) < 1) return;
    suppressScroll.current = true;
    el.scrollTo({ top: target, behavior: "auto" });
    const t = setTimeout(() => {
      suppressScroll.current = false;
    }, 60);
    return () => clearTimeout(t);
  }, [index]);

  function handleScroll() {
    if (suppressScroll.current) return;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const el = listRef.current;
      if (!el) return;
      const nearest = Math.max(0, Math.min(values.length - 1, Math.round(el.scrollTop / WHEEL_ITEM_H)));
      if (nearest !== index) onSelect(nearest);
    }, 100);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onSelect(Math.max(0, index - 1));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onSelect(Math.min(values.length - 1, index + 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      onSelect(0);
    } else if (e.key === "End") {
      e.preventDefault();
      onSelect(values.length - 1);
    }
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 z-0 rounded-lg border-y border-nav-amethyst/30 bg-nav-lavender-soft/50"
        style={{ top: WHEEL_PAD, height: WHEEL_ITEM_H }}
      />
      <div
        ref={listRef}
        role="listbox"
        aria-label={label}
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={onKeyDown}
        className="relative z-10 overflow-y-auto scroll-smooth outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-inset [&::-webkit-scrollbar]:hidden"
        style={{ height: WHEEL_HEIGHT, scrollSnapType: "y mandatory" }}
      >
        <div style={{ height: WHEEL_PAD }} aria-hidden="true" />
        {values.map((v, i) => (
          <button
            key={v}
            type="button"
            role="option"
            aria-selected={i === index}
            tabIndex={-1}
            onClick={() => onSelect(i)}
            style={{ height: WHEEL_ITEM_H, scrollSnapAlign: "center" }}
            className={`flex w-full items-center justify-center text-lg transition-colors duration-150 ${
              i === index ? "font-semibold text-nav-amethyst-deep" : "text-nav-plum/45"
            }`}
          >
            {v}
          </button>
        ))}
        <div style={{ height: WHEEL_PAD }} aria-hidden="true" />
      </div>
    </div>
  );
}
