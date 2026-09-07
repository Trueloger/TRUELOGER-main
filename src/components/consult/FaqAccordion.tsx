"use client";

// Simple single-open-at-a-time FAQ accordion for a service subpage —
// mirrors the toggle mechanics of MobileNav.tsx's accordion rows
// (single `openIndex` piece of state, not a full component reuse).
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ConsultationFaq } from "@/lib/consultation/types";

export function FaqAccordion({ faqs }: { faqs: ConsultationFaq[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <ul className="flex flex-col gap-2">
      {faqs.map((faq, i) => {
        const expanded = openIndex === i;
        const panelId = `faq-panel-${i}`;
        return (
          <li
            key={faq.question}
            className="overflow-hidden rounded-xl border border-nav-lavender-line bg-white"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(expanded ? null : i)}
              aria-expanded={expanded}
              aria-controls={panelId}
              className="flex min-h-[48px] w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-nav-plum transition-colors duration-150 hover:bg-nav-lavender-soft/60"
            >
              <span>{faq.question}</span>
              <ChevronDown
                aria-hidden="true"
                className={`h-4.5 w-4.5 shrink-0 text-nav-violet transition-transform duration-200 ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </button>
            {expanded && (
              <div id={panelId} className="px-4 pb-4 text-sm leading-relaxed text-nav-plum/80">
                {faq.answer}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
