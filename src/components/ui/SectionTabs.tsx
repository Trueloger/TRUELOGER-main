"use client";

// src/components/ui/SectionTabs.tsx
// Segmented navigation for a long, information-heavy result screen
// (Free Kundli, and any future tool page with several distinct groups
// of real content) — groups sections under labeled tabs instead of
// one long uninterrupted scroll, so a reader can jump straight to
// "Charts" or "Yogas & Strength" without paging past everything else.
// Same pill button language already established by
// consult/ServiceDurationPicker.tsx's duration selector (rounded-full,
// border-nav-lavender-line / bg-nav-amethyst active state) — not a new
// visual pattern, the existing one reused for a new purpose.
import { useId, useState, type ReactNode } from "react";

export type SectionTab = {
  id: string;
  label: string;
  content: ReactNode;
};

export function SectionTabs({ tabs, defaultTabId }: { tabs: SectionTab[]; defaultTabId?: string }) {
  const groupId = useId();
  const [active, setActive] = useState(defaultTabId ?? tabs[0]?.id);
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  if (tabs.length === 0) return null;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Sections"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${groupId}-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`${groupId}-panel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={`flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "border-nav-amethyst bg-nav-amethyst text-white"
                  : "border-nav-lavender-line bg-white text-nav-plum hover:bg-nav-lavender-soft"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab && (
        <div
          role="tabpanel"
          id={`${groupId}-panel-${activeTab.id}`}
          aria-labelledby={`${groupId}-tab-${activeTab.id}`}
          className="mt-5 space-y-6"
        >
          {activeTab.content}
        </div>
      )}
    </div>
  );
}
