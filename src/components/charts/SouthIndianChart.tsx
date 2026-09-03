// src/components/charts/SouthIndianChart.tsx
// A real, locally-authored inline SVG rendering of a South Indian style
// Vedic birth chart (Rasi/D1). Fed the exact same structured chart data
// as NorthIndianChart.tsx — never raw third-party markup, so there is
// nothing here to sanitize and no dangerouslySetInnerHTML anywhere.
//
// Layout: a 4x4 grid of 16 cells with the center 2x2 block (4 cells)
// left blank/unused, leaving a ring of 12 outer cells. Each of those 12
// cells is PERMANENTLY assigned to one zodiac SIGN (not a house
// number) — Aries through Pisces always occupy the same fixed cells
// regardless of the Ascendant, unlike North Indian style where houses
// are fixed and signs rotate. Because houses rotate with the
// Ascendant here, the Ascendant's own sign cell is highlighted/marked
// to show which cell is "House 1" for this particular chart.
//
// Verified against three independent sources, all in agreement on the
// physical shape (4x4 ring, blank center) and the specific cell
// assignment (Pisces top-left corner, Aries directly right of it,
// clockwise from there, Virgo bottom-right corner):
//   - https://astrologyreadingsonline.org/south-indian-birth-chart/ and
//     https://jeevalaya.co.in/guide-read-south-indian-astrology-chart/
//     ("South Indian layout is formed by starting with a 4x4 grid...
//     removing the 4 squares in the center, leaving 12 cells arranged
//     around the perimeter... Pisces is always in the upper left hand
//     corner, followed directly by Aries, then Taurus, and Gemini in
//     the upper right hand corner... the entire chart proceeds
//     clockwise from there.")
//   - https://www.vedicplanet.com/jyotish/learn-jyotish/chart-formats-in-jyotish-astrology/
//     ("Each sign always stays in the same box (e.g. Pisces top left,
//     Virgo bottom right)... The sign count is always made clockwise
//     around the rectangle (e.g. Aries 1, Taurus 2, Gemini 3...).")
//   - https://edithhathaway.com/how-to-read-a-south-indian-chart/
//     (confirms the fixed-sign, rotating-house convention and that the
//     Ascendant's sign must be marked since house 1 is not a fixed
//     cell in this format).
import { PLANET_ABBREVIATIONS, PLANET_ORDER, houseForSign } from "./shared";
import type { ChartPlanetName } from "@/lib/astro-engine/ephemeris";
import type { ChartStyleProps } from "./types";

export type SouthIndianChartProps = ChartStyleProps;

const SIZE = 400;
const CELL = SIZE / 4;

type Point = { x: number; y: number };

/** Fixed sign -> (row, col) assignment, row/col both 0-3, sourced from
 * the module doc comment above: top row is Pisces(12), Aries(1),
 * Taurus(2), Gemini(3) left-to-right; then clockwise down the right
 * column, across the bottom row right-to-left, then up the left
 * column back to Pisces. */
const SIGN_CELL: Record<number, { row: number; col: number }> = {
  12: { row: 0, col: 0 }, // Pisces
  1: { row: 0, col: 1 }, // Aries
  2: { row: 0, col: 2 }, // Taurus
  3: { row: 0, col: 3 }, // Gemini
  4: { row: 1, col: 3 }, // Cancer
  5: { row: 2, col: 3 }, // Leo
  6: { row: 3, col: 3 }, // Virgo
  7: { row: 3, col: 2 }, // Libra
  8: { row: 3, col: 1 }, // Scorpio
  9: { row: 3, col: 0 }, // Sagittarius
  10: { row: 2, col: 0 }, // Capricorn
  11: { row: 1, col: 0 }, // Aquarius
};

function cellRect(row: number, col: number): { x: number; y: number } {
  return { x: col * CELL, y: row * CELL };
}

function cellPolygon(row: number, col: number): Point[] {
  const { x, y } = cellRect(row, col);
  return [
    { x, y },
    { x: x + CELL, y },
    { x: x + CELL, y: y + CELL },
    { x, y: y + CELL },
  ];
}

function polygonPoints(polygon: Point[]): string {
  return polygon.map((p) => `${p.x},${p.y}`).join(" ");
}

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

/** Renders a real, locally-computed South Indian style Vedic birth
 * chart — plain inline SVG, no external chart library, no
 * dangerouslySetInnerHTML. Same responsive viewBox approach and light
 * palette as NorthIndianChart.tsx. */
export function SouthIndianChart({ ascendantSign, planets, className }: SouthIndianChartProps) {
  const planetsBySign = new Map<number, ChartPlanetName[]>();
  for (const name of PLANET_ORDER) {
    const entry = planets[name];
    if (!entry) continue;
    const list = planetsBySign.get(entry.sign) ?? [];
    list.push(name);
    planetsBySign.set(entry.sign, list);
  }

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={`South Indian style Vedic birth chart, Ascendant in sign ${ascendantSign}`}
      className={className ?? "w-full max-w-[360px]"}
    >
      <rect x={0} y={0} width={SIZE} height={SIZE} fill="#fdfcff" />

      {Object.entries(SIGN_CELL).map(([signKey, { row, col }]) => {
        const sign = Number(signKey);
        const isAscendant = sign === ascendantSign;
        return (
          <polygon
            key={sign}
            points={polygonPoints(cellPolygon(row, col))}
            fill={isAscendant ? "#f6f1fb" : "#fdfcff"}
            stroke="#e4d7f4"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        );
      })}

      {/* Outer border drawn last so it sits crisp above the fills. */}
      <rect
        x={0.75}
        y={0.75}
        width={SIZE - 1.5}
        height={SIZE - 1.5}
        fill="none"
        stroke="#7c4dc4"
        strokeWidth={1.5}
      />

      {/* Ascendant marker — a small diagonal in the Ascendant's fixed
          sign cell, the conventional way South Indian charts mark
          House 1 since house numbers otherwise rotate with the
          Ascendant rather than staying fixed to a cell. */}
      {(() => {
        const asc = SIGN_CELL[ascendantSign];
        if (!asc) return null;
        const { x, y } = cellRect(asc.row, asc.col);
        return (
          <line
            x1={x + 6}
            y1={y + 6}
            x2={x + CELL - 6}
            y2={y + 6}
            stroke="#7c4dc4"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        );
      })()}

      {Object.entries(SIGN_CELL).map(([signKey, { row, col }]) => {
        const sign = Number(signKey);
        const { x, y } = cellRect(row, col);
        const cx = x + CELL / 2;
        const cy = y + CELL / 2;
        const house = houseForSign(ascendantSign, sign);
        const signPlanets = planetsBySign.get(sign) ?? [];
        const lines: ChartPlanetName[][] = [];
        for (let i = 0; i < signPlanets.length; i += 2) {
          lines.push(signPlanets.slice(i, i + 2));
        }

        return (
          <g key={sign}>
            <text
              x={cx}
              y={y + 16}
              textAnchor="middle"
              fontSize={9}
              fill="#7c4dc4"
              fontWeight={600}
            >
              {SIGN_NAMES[sign - 1].slice(0, 3)}
              {sign === ascendantSign ? " (H1)" : ` H${house}`}
            </text>
            {lines.map((line, lineIndex) => (
              <text
                key={lineIndex}
                x={cx}
                y={cy + lineIndex * 13}
                textAnchor="middle"
                fontSize={12}
                fill="#3d2154"
                fontWeight={500}
              >
                {line.map((name, i) => (
                  <tspan key={name} dx={i === 0 ? 0 : 6}>
                    {PLANET_ABBREVIATIONS[name]}
                    {planets[name].isRetrograde && (
                      <tspan fontSize={8} baselineShift="super" fill="#6a3cb0">
                        R
                      </tspan>
                    )}
                  </tspan>
                ))}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
