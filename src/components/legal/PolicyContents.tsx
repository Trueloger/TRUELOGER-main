export type PolicyTocEntry = { id: string; title: string };

/** Table of contents for a long policy page — a plain box on mobile
 * (no need to collapse a short list on a phone-sized viewport is
 * still fine to show open), matching the original Terms page's own
 * TOC treatment exactly. */
export function PolicyContents({ entries }: { entries: PolicyTocEntry[] }) {
  return (
    <nav aria-label="Table of contents" className="mt-8 rounded-xl border border-nav-lavender-line bg-white/60 p-5">
      <h2 className="font-serif text-lg text-nav-violet">Contents</h2>
      <ol className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        {entries.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="text-nav-amethyst-deep underline-offset-2 hover:underline">
              {s.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
