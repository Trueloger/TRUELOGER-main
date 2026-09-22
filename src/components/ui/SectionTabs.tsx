"use client";

// src/components/ui/SectionTabs.tsx
// A swipeable card carousel for a long, information-heavy result
// screen (Free Kundli, Dasha, Kundli Matching, Compatibility) — each
// section (Overview, Charts, Planets & Houses, Yogas & Strength,
// Reading) is a full-width card the user SWIPES through natively,
// not a filter/tab bar that hides everything behind a click. Same
// native scroll-snap technique already used by ZodiacCarousel and
// ConsultationDateTimePicker's day strip — no drag library, real
// touch/trackpad swipe, works everywhere immediately. The dot row
// below is a position indicator and an optional shortcut, never the
// only way to move between sections.
import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";

export type SectionTab = {
  id: string;
  label: string;
  content: ReactNode;
};

export function SectionTabs({ tabs, defaultTabId }: { tabs: SectionTab[]; defaultTabId?: string }) {
  const groupId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressScroll = useRef(false);
  const dotRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const defaultIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === defaultTabId)
  );
  const [index, setIndex] = useState(defaultIndex === -1 ? 0 : defaultIndex);

  function scrollToIndex(i: number, behavior: ScrollBehavior = "smooth") {
    const el = trackRef.current;
    if (!el) return;
    const card = el.children[i] as HTMLElement | undefined;
    if (!card) return;
    suppressScroll.current = true;
    el.scrollTo({ left: card.offsetLeft, behavior });
    window.setTimeout(() => {
      suppressScroll.current = false;
    }, behavior === "smooth" ? 500 : 60);
  }

  function handleScroll() {
    if (suppressScroll.current) return;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const el = trackRef.current;
      if (!el) return;
      let nearest = 0;
      let nearestDist = Infinity;
      Array.from(el.children).forEach((child, i) => {
        const dist = Math.abs((child as HTMLElement).offsetLeft - el.scrollLeft);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = i;
        }
      });
      setIndex(nearest);
    }, 100);
  }

  if (tabs.length === 0) return null;

  function activate(i: number) {
    setIndex(i);
    scrollToIndex(i);
    dotRefs.current[i]?.focus();
  }

  // Standard ARIA tablist roving-tab pattern: Left/Right move between
  // tabs (wrapping), Home/End jump to first/last, and moving also
  // activates (matches this control's own click behavior — there's no
  // separate "select" step). Real keyboard equivalent to swipe, not
  // just the dots being individually Tab-reachable.
  function handleDotKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        activate((i + 1) % tabs.length);
        break;
      case "ArrowLeft":
        e.preventDefault();
        activate((i - 1 + tabs.length) % tabs.length);
        break;
      case "Home":
        e.preventDefault();
        activate(0);
        break;
      case "End":
        e.preventDefault();
        activate(tabs.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        role="group"
        aria-label="Report sections — swipe to browse"
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab, i) => (
          <div
            key={tab.id}
            id={`${groupId}-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`${groupId}-tab-${tab.id}`}
            tabIndex={0}
            className="w-full shrink-0 snap-start snap-always space-y-6 outline-none"
            style={{ scrollSnapStop: "always" }}
          >
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-nav-lavender-soft px-3 py-1 text-xs font-medium text-nav-amethyst-deep">
                {tab.label}
              </span>
              <span className="text-xs text-nav-plum/40">
                {i + 1} / {tabs.length}
              </span>
            </div>
            {tab.content}
          </div>
        ))}
      </div>

      {tabs.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2" role="tablist" aria-label="Sections">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              id={`${groupId}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-controls={`${groupId}-panel-${tab.id}`}
              aria-label={`Go to ${tab.label}`}
              tabIndex={i === index ? 0 : -1}
              onClick={() => activate(i)}
              onKeyDown={(e) => handleDotKeyDown(e, i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === index ? "w-6 bg-nav-amethyst" : "w-2 bg-nav-lavender-line hover:bg-nav-amethyst/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
