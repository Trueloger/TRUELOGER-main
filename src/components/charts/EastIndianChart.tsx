// src/components/charts/EastIndianChart.tsx
// A real, locally-authored inline SVG rendering of an East Indian /
// Bengali style Vedic birth chart (Rasi/D1), also called the "Surya
// Chakra" or Oriya chart. Fed the exact same structured chart data as
// NorthIndianChart.tsx / SouthIndianChart.tsx — never raw third-party
// markup, so there is nothing here to sanitize and no
// dangerouslySetInnerHTML anywhere.
//
// Layout: like South Indian style, signs are FIXED to their cells
// (Aries through Pisces always occupy the same cell) and houses rotate
// with the Ascendant — so, as with South Indian style, the Ascendant's
// sign cell is marked to show which cell is "House 1" for this chart.
// The defining difference from South Indian style, confirmed across
// independent sources, is the DIRECTION signs are read around the
// grid: South Indian proceeds clockwise, East Indian/Bengali proceeds
// COUNTERCLOCKWISE (and is conventionally read right-to-left, like the
// North Indian format):
//   - https://www.astrojyoti.com/lesson3-2.htm ("The East Indian or
//     Maithili method chart... follows the fixed sign method of the
//     south style chart, but the charting is done anti-clockwise.")
//   - https://kundligpt.com/blog/north-south-east-indian-chart-styles-compared/
//     ("Aries is at the top center, and signs flow counter-clockwise"
//     — opposite of South Indian's clockwise flow.)
//   - https://www.mypandit.com/kundli/types/ ("Like the South Indian
//     style, the astrological signs are fixed in East Indian Kundali,
//     and like the North Indian type, the East Indian Kundali is read
//     from right to left direction.")
// This component reuses the same 4x4-ring geometry as
// SouthIndianChart.tsx (a well-documented, source-confirmed physical
// shape for a fixed-sign chart) but mirrors the traversal direction to
// counterclockwise per the sources above, keeping Aries at the same
// top-row starting position — the resulting cell assignment is the
// horizontal mirror image of the South Indian layout.
import { PLANET_ABBREVIATIONS, PLANET_ORDER, houseForSign } from "./shared";
import type { ChartPlanetName } from "@/lib/astro-engine/ephemeris";
import type { ChartStyleProps } from "./types";

export type EastIndianChartProps = ChartStyleProps;

const SIZE = 400;
const CELL = SIZE / 4;

type Point = { x: number; y: number };

/** Fixed sign -> (row, col) assignment. Same 4x4 ring shape as
 * SouthIndianChart.tsx's SIGN_CELL, Aries anchored at the same
 * top-row cell, but traversed counterclockwise instead of clockwise
 * (see module doc comment for sourcing) — i.e. this is that grid's
 * horizontal mirror image. */
const SIGN_CELL: Record<number, { row: number; col: number }> = {
  1: { row: 0, col: 1 }, // Aries
  12: { row: 0, col: 0 }, // Pisces
  11: { row: 1, col: 0 }, // Aquarius
  10: { row: 2, col: 0 }, // Capricorn
  9: { row: 3, col: 0 }, // Sagittarius
  8: { row: 3, col: 1 }, // Scorpio
  7: { row: 3, col: 2 }, // Libra
  6: { row: 3, col: 3 }, // Virgo
  5: { row: 2, col: 3 }, // Leo
  4: { row: 1, col: 3 }, // Cancer
  3: { row: 0, col: 3 }, // Gemini
  2: { row: 0, col: 2 }, // Taurus
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

/** Renders a real, locally-computed East Indian / Bengali style Vedic
 * birth chart — plain inline SVG, no external chart library, no
 * dangerouslySetInnerHTML. Same responsive viewBox approach and light
 * palette as NorthIndianChart.tsx / SouthIndianChart.tsx. */
export function EastIndianChart({ ascendantSign, planets, className }: EastIndianChartProps) {
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
      aria-label={`East Indian (Bengali) style Vedic birth chart, Ascendant in sign ${ascendantSign}`}
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

      {/* Ascendant marker — same convention as SouthIndianChart.tsx:
          house numbers rotate with the Ascendant here, so a small mark
          in the Ascendant's fixed sign cell shows which cell is
          House 1 for this particular chart. */}
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
