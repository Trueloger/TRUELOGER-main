type PlanetaryRow = {
  planet: string;
  sign?: string;
  house?: string | number;
  degree?: string;
};

type PlanetaryTableProps = {
  rows: PlanetaryRow[];
  caption?: string;
};

/** Planet -> sign/house/degree data. A real <table> at md: and up, a
 * <ul> of small cards below it — the "readable tables that become
 * cards on mobile" pattern. Renders nothing when given no rows, never
 * a fabricated example row. */
export function PlanetaryTable({ rows, caption }: PlanetaryTableProps) {
  if (!rows.length) return null;

  return (
    <div>
      {/* md and up: real table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-nav-lavender-line md:block">
        <table className="w-full border-collapse text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="bg-nav-lavender-mist text-xs font-semibold tracking-wide text-nav-plum/70 uppercase">
              <th scope="col" className="px-4 py-3">
                Planet
              </th>
              <th scope="col" className="px-4 py-3">
                Sign
              </th>
              <th scope="col" className="px-4 py-3">
                House
              </th>
              <th scope="col" className="px-4 py-3">
                Degree
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={`${row.planet}-${i}`}
                className="border-t border-nav-lavender-line odd:bg-nav-pearl even:bg-nav-lavender-mist/40"
              >
                <td className="px-4 py-3 font-medium text-nav-plum">{row.planet}</td>
                <td className="px-4 py-3 text-nav-plum/80">{row.sign ?? "—"}</td>
                <td className="px-4 py-3 text-nav-plum/80">{row.house ?? "—"}</td>
                <td className="px-4 py-3 text-nav-plum/80">{row.degree ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* below md: stacked cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row, i) => (
          <li
            key={`${row.planet}-${i}`}
            className="rounded-xl border border-nav-lavender-line bg-nav-pearl p-4"
          >
            <p className="font-serif text-base text-nav-amethyst-deep">{row.planet}</p>
            <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-xs text-nav-plum/60">Sign</dt>
                <dd className="text-nav-plum/85">{row.sign ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-nav-plum/60">House</dt>
                <dd className="text-nav-plum/85">{row.house ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-nav-plum/60">Degree</dt>
                <dd className="text-nav-plum/85">{row.degree ?? "—"}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
