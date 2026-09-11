// src/components/reports/ReportTableOfContents.tsx
// Generated from the actual rendered section list — never hardcoded
// page numbers (AGENTS §50/§89). This is the web reader's TOC; the PDF
// renders its own numbered TOC in src/lib/reports/render-pdf.tsx from
// the same section list.
import type { GeneratedSection } from "@/lib/reports/types";

export function ReportTableOfContents({ sections }: { sections: GeneratedSection[] }) {
  return (
    <nav aria-label="Table of contents" className="rounded-xl border border-nav-lavender-line bg-nav-pearl/60 p-4 sm:p-5">
      <h2 className="font-serif text-lg text-nav-violet">Contents</h2>
      <ol className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {sections.map((section, i) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="flex items-baseline gap-2 rounded-lg px-2 py-1.5 text-sm text-nav-plum/80 transition-colors hover:bg-nav-lavender-mist hover:text-nav-violet"
            >
              <span className="text-xs text-nav-amethyst-deep">{String(i + 1).padStart(2, "0")}</span>
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
