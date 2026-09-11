// src/components/reports/ReportSection.tsx
// Renders ONE structured GeneratedSection — the model never produces
// raw HTML (AGENTS §45/§46); this component is the only thing that
// turns { paragraphs, table, keyPoints, remedies } into markup, so
// output is consistent/brand-controlled/print-friendly regardless of
// what the AI wrote. Used by both the purchased report reader and the
// demo reader.
import type { GeneratedSection } from "@/lib/reports/types";

export function ReportSection({ section }: { section: GeneratedSection }) {
  const { title, content } = section;
  return (
    <section id={section.id} className="scroll-mt-24">
      <h2 className="font-serif text-xl text-nav-violet sm:text-2xl">{title}</h2>

      {content.keyPoints && content.keyPoints.length > 0 && (
        <div className="mt-4 rounded-xl border-l-2 border-nav-gold bg-nav-lavender-soft/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-nav-amethyst-deep">Key Insights</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {content.keyPoints.map((kp, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-nav-plum/85">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-nav-amethyst" aria-hidden="true" />
                {kp}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {content.paragraphs.map((para, i) => (
          <p key={i} className="text-sm leading-relaxed text-nav-plum/90 sm:text-base">
            {para}
          </p>
        ))}
      </div>

      {content.table && content.table.rows.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-nav-lavender-line">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="bg-nav-lavender-mist text-xs uppercase tracking-wide text-nav-plum/70">
              <tr>
                {content.table.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.table.rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 1 ? "bg-nav-pearl/50" : ""}>
                  {row.cells.map((cell, ci) => (
                    <td key={ci} className="border-t border-nav-lavender-line/60 px-3 py-2.5 text-nav-plum/85">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {content.remedies && content.remedies.length > 0 && (
        <div className="mt-4 rounded-xl border-l-2 border-nav-gold bg-nav-pearl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-nav-amethyst-deep">Traditional Remedies</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {content.remedies.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-nav-plum/85">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-nav-gold" aria-hidden="true" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
