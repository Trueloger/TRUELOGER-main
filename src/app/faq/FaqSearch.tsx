"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FAQAccordion } from "@/components/legal/FAQAccordion";
import { FAQ_ITEMS, type FaqCategory } from "@/lib/support/faq-data";

const CATEGORIES: FaqCategory[] = ["Account", "Orders & Payments", "Consultations", "Reports", "Healing & Puja", "Courses", "Gemstones"];

export function FaqSearch() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FaqCategory | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      const matchesQuery = !q || item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  return (
    <>
      <div className="relative mt-6">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-nav-plum/40" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search FAQs…"
          className="min-h-11 w-full rounded-full border border-nav-lavender-line bg-white pl-11 pr-4 text-sm text-nav-plum outline-none focus:border-nav-amethyst"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={`min-h-9 rounded-full px-3.5 text-sm font-medium ${activeCategory === "all" ? "bg-nav-amethyst text-white" : "bg-white text-nav-plum/80 ring-1 ring-nav-lavender-line"}`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActiveCategory(c)}
            className={`min-h-9 rounded-full px-3.5 text-sm font-medium ${activeCategory === c ? "bg-nav-amethyst text-white" : "bg-white text-nav-plum/80 ring-1 ring-nav-lavender-line"}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <FAQAccordion items={filtered} />
      </div>
    </>
  );
}
