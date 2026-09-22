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
import { useRef, useState } from "react";
import type { ReactNode } from "react";

export type SectionTab = {
  id: string;
  label: string;
  content: ReactNode;
};

export function SectionTabs({ tabs, defaultTabId }: { tabs: SectionTab[]; defaultTabId?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressScroll = useRef(false);

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

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        role="group"
        aria-label="Report sections — swipe to browse"
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className="w-full shrink-0 snap-start snap-always space-y-6"
            style={{ scrollSnapStop: "always" }}
          >
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-nav-lavender-soft px-3 py-1 text-xs font-medium text-nav-amethyst-deep">
                {tab.label}
              </span>
              <span className="text-xs text-nav-plum/40">
                {tabs.findIndex((t) => t.id === tab.id) + 1} / {tabs.length}
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
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to ${tab.label}`}
              onClick={() => scrollToIndex(i)}
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
