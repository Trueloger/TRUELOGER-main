import type { KootaRow } from "@/lib/astrology/ashtakoot-view";

type KootaBreakdownTableProps = {
  rows: KootaRow[];
  personALabel: string;
  personBLabel: string;
};

/** Compact 8-row Ashtakoot koota breakdown — a real `<table>` (chosen
 * over 8 full ScoreCards, which would make an already-long page even
 * longer on mobile), each row showing the koota's label, both people's
 * real placements, and a score/out_of with a thin inline meter.
 * Horizontally scrollable in its own container so it never forces the
 * page itself to scroll sideways on narrow screens. Shared by Kundli
 * Matching and Compatibility — see src/lib/astrology/ashtakoot-view.ts
 * and each tool's route.ts top comment for why both render this exact
 * same real data; only `personALabel`/`personBLabel` differ per tool
 * ("Bride"/"Groom" vs "You"/"Partner"). */
export function KootaBreakdownTable({ rows, personALabel, personBLabel }: KootaBreakdownTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-nav-lavender-line bg-nav-pearl">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-nav-lavender-line text-left text-xs font-medium uppercase tracking-[0.08em] text-nav-plum/60">
            <th scope="col" className="px-4 py-3">
              Koota
            </th>
            <th scope="col" className="px-4 py-3">
              {personALabel}
            </th>
            <th scope="col" className="px-4 py-3">
              {personBLabel}
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const pct = row.outOf > 0 ? Math.max(0, Math.min(100, (row.score / row.outOf) * 100)) : 0;
            return (
              <tr key={row.key} className="border-b border-nav-lavender-line/60 last:border-b-0">
                <th scope="row" className="px-4 py-3 text-left font-serif text-[0.95rem] font-normal text-nav-plum">
                  {row.label}
                </th>
                <td className="px-4 py-3 text-nav-plum/80">{row.personA}</td>
                <td className="px-4 py-3 text-nav-plum/80">{row.personB}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="whitespace-nowrap font-semibold text-nav-amethyst-deep">
                      {row.score}
                      <span className="font-normal text-nav-plum/50">/{row.outOf}</span>
                    </span>
                    <div
                      role="meter"
                      aria-label={`${row.label} score`}
                      aria-valuenow={row.score}
                      aria-valuemin={0}
                      aria-valuemax={row.outOf}
                      className="h-1.5 w-16 overflow-hidden rounded-full bg-nav-lavender-mist"
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-nav-amethyst to-nav-gold"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
