"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type FaqItem = { question: string; answer: string };

/** Native <details>-free accordion (needs open-state control for the
 * chevron rotation + single-open-at-a-time behavior on the FAQ page,
 * so a controlled component rather than <details> here) — accessible
 * via aria-expanded/aria-controls, keyboard-operable since it's a real
 * <button>. */
export function FAQAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return <p className="rounded-xl border border-nav-lavender-line bg-white/60 p-4 text-sm text-nav-plum/70">No results found.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => {
        const open = openIndex === i;
        const panelId = `faq-panel-${i}`;
        return (
          <li key={item.question} className="rounded-xl border border-nav-lavender-line bg-white/70 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              aria-controls={panelId}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium text-nav-plum transition-colors hover:bg-nav-lavender-mist/40 sm:text-[0.95rem]"
            >
              {item.question}
              <ChevronDown
                aria-hidden="true"
                className={`h-4 w-4 shrink-0 text-nav-amethyst-deep transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </button>
            {open && (
              <div id={panelId} className="px-4 pb-4 text-sm leading-relaxed text-nav-plum/80">
                {item.answer}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
