type TimelineItem = {
  label: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  description?: string;
};

type TimelineProps = {
  items: TimelineItem[];
};

/** Generic vertical timeline for date-ranged periods (Dasha periods,
 * Sade Sati phases). Visually highlights the `active` entry; a single
 * column at every width, so it works stacked on mobile without any
 * breakpoint changes. Renders nothing when given no items. */
export function Timeline({ items }: TimelineProps) {
  if (!items.length) return null;

  return (
    <ol className="relative list-none border-l border-nav-lavender-line pl-6">
      {items.map((item, i) => {
        const range = [item.startDate, item.endDate].filter(Boolean).join(" – ");
        return (
          <li key={`${item.label}-${i}`} className="relative pb-6 last:pb-0">
            <span
              aria-hidden="true"
              className={`absolute top-1 -left-[1.6rem] h-3 w-3 rounded-full border-2 ${
                item.active
                  ? "border-nav-amethyst-deep bg-nav-amethyst"
                  : "border-nav-lavender-line bg-nav-pearl"
              }`}
            />
            <div
              className={`rounded-xl border p-4 ${
                item.active
                  ? "border-nav-amethyst bg-nav-lavender-soft"
                  : "border-nav-lavender-line bg-nav-pearl"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-serif text-base text-nav-plum">
                  {item.label}
                  {item.active && (
                    <span className="ml-2 rounded-full bg-nav-amethyst-deep px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-white uppercase">
                      Current
                    </span>
                  )}
                </p>
                {range && <p className="text-xs text-nav-plum/60">{range}</p>}
              </div>
              {item.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-nav-plum/80">
                  {item.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
