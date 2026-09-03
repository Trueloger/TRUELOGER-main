// src/components/free-kundli/NorthIndianChart.tsx
// A real, locally-authored inline SVG rendering of a North Indian style
// Vedic birth chart (Rasi/D1). Fed structured chart data computed by
// src/lib/astro-engine/ephemeris.ts's calculateChart — never raw
// third-party markup, so there is nothing here to sanitize and no
// dangerouslySetInnerHTML anywhere.
//
// Layout: the classic "diamond-in-a-square" North Indian format — a
// square split by its two corner-to-corner diagonals and a diamond
// connecting the midpoints of its four sides, producing 4 diamond
// (kite-shaped) houses at the mid-points of each edge and 8 triangular
// corner houses. Houses are FIXED in the square regardless of which
// zodiac sign the Ascendant falls in (the defining trait vs. South
// Indian style, where signs are fixed and houses rotate): House 1 is
// always the top diamond, House 4 the left diamond, House 7 the bottom
// diamond, House 10 the right diamond, and the remaining houses are
// numbered 1-12 counterclockwise (as viewed) starting from House 1 —
// House 2 immediately to House 1's left, House 12 immediately to its
// right. Verified against three independent sources, all in agreement:
//   - https://kundligpt.com/blog/how-to-read-north-indian-birth-chart/
//     ("House 1 is always at the top, House 4 is always on the left,
//     House 7 is always at the bottom, and House 10 is always on the
//     right... house numbers are fixed and counted from 1 to 12 in
//     counterclockwise direction... The 1st House is the top-most
//     central diamond... The house immediately to the left of the 1st
//     House is the 2nd House... ending at the 12th House, which is
//     immediately to the right of the 1st House.")
//   - https://astrologyexperts.in/blog/read-your-vedic-astrology-chart-north-indian-in-12-steps/
//     ("4 diamond-shaped (rhombus) sections at the center of each side
//     are Houses 1, 4, 7, and 10... 8 triangular sections fill the
//     corners... The ascending sign (Lagna) is always placed in the
//     top-central diamond.")
//   - https://www.vedicplanet.com/jyotish/learn-jyotish/chart-formats-in-jyotish-astrology/
//     (confirms the North Indian format fixes houses in place and
//     rotates signs through them, unlike the South Indian format).
import type { ChartPlanetName } from "@/lib/astro-engine/ephemeris";

export type NorthIndianChartPlanet = {
  sign: number; // 1-12, sidereal sign the planet occupies
  house: number; // 1-12, whole-sign house from the Ascendant
  isRetrograde: boolean;
  degree: number; // 0-30, degree within sign — not currently displayed, kept for future use
};

export type NorthIndianChartProps = {
  /** 1-12, sidereal sign number occupying House 1 (the Ascendant's own sign). */
  ascendantSign: number;
  planets: Record<ChartPlanetName, NorthIndianChartPlanet>;
  className?: string;
};

const PLANET_ABBREVIATIONS: Record<ChartPlanetName, string> = {
  Sun: "Su",
  Moon: "Mo",
  Mars: "Ma",
  Mercury: "Me",
  Jupiter: "Ju",
  Venus: "Ve",
  Saturn: "Sa",
  Rahu: "Ra",
  Ketu: "Ke",
  Uranus: "Ur",
  Neptune: "Ne",
  Pluto: "Pl",
};

// Canonical display order within a shared house cell — traditional
// Vedic ordering (luminaries, then the classical grahas, then the
// shadow points, then the modern outer planets), same order used for
// the planetary table in src/app/api/free-kundli/route.ts.
const PLANET_ORDER: ChartPlanetName[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
  "Rahu", "Ketu", "Uranus", "Neptune", "Pluto",
];

// ---------------------------------------------------------------------
// Fixed geometry — a 400x400 square, corner-to-corner diagonals plus a
// diamond connecting the four edge midpoints, producing 12 regions.
// See the module doc comment above for the source-verified house
// numbering; the coordinates below were derived directly from that
// verbal layout (not copied from any single third-party SVG), then
// checked by hand for edge-adjacency continuity around the full
// 1-12 counterclockwise loop.
// ---------------------------------------------------------------------

const SIZE = 400;
const TL = { x: 0, y: 0 };
const TR = { x: SIZE, y: 0 };
const BR = { x: SIZE, y: SIZE };
const BL = { x: 0, y: SIZE };
const TM = { x: SIZE / 2, y: 0 };
const RM = { x: SIZE, y: SIZE / 2 };
const BM = { x: SIZE / 2, y: SIZE };
const LM = { x: 0, y: SIZE / 2 };
const C = { x: SIZE / 2, y: SIZE / 2 };
// Midpoints between each corner and the center — the diamond's four
// non-edge vertices.
const mTL = { x: (TL.x + C.x) / 2, y: (TL.y + C.y) / 2 };
const mTR = { x: (TR.x + C.x) / 2, y: (TR.y + C.y) / 2 };
const mBR = { x: (BR.x + C.x) / 2, y: (BR.y + C.y) / 2 };
const mBL = { x: (BL.x + C.x) / 2, y: (BL.y + C.y) / 2 };

type Point = { x: number; y: number };

type HouseCell = {
  house: number;
  polygon: Point[];
  /** Where the sign-number + planet glyphs are centered — deliberately
   * NOT the raw polygon centroid for the 4 diamond houses (that would
   * land on the shared center point C and overlap the other three
   * diamonds' labels), so diamonds anchor on the centroid of their
   * three non-center vertices instead. */
  anchor: Point;
};

function centroid(points: Point[]): Point {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

const HOUSE_CELLS: HouseCell[] = [
  { house: 1, polygon: [TM, mTL, C, mTR], anchor: centroid([TM, mTL, mTR]) },
  { house: 2, polygon: [TL, TM, mTL], anchor: centroid([TL, TM, mTL]) },
  { house: 3, polygon: [TL, mTL, LM], anchor: centroid([TL, mTL, LM]) },
  { house: 4, polygon: [LM, mTL, C, mBL], anchor: centroid([LM, mTL, mBL]) },
  { house: 5, polygon: [LM, mBL, BL], anchor: centroid([LM, mBL, BL]) },
  { house: 6, polygon: [BL, mBL, BM], anchor: centroid([BL, mBL, BM]) },
  { house: 7, polygon: [BM, mBL, C, mBR], anchor: centroid([BM, mBL, mBR]) },
  { house: 8, polygon: [BM, mBR, BR], anchor: centroid([BM, mBR, BR]) },
  { house: 9, polygon: [BR, mBR, RM], anchor: centroid([BR, mBR, RM]) },
  { house: 10, polygon: [RM, mBR, C, mTR], anchor: centroid([RM, mBR, mTR]) },
  { house: 11, polygon: [RM, mTR, TR], anchor: centroid([RM, mTR, TR]) },
  { house: 12, polygon: [TR, mTR, TM], anchor: centroid([TR, mTR, TM]) },
];

function polygonPoints(polygon: Point[]): string {
  return polygon.map((p) => `${p.x},${p.y}`).join(" ");
}

/** Sidereal sign occupying `house` (1-12) counted from an Ascendant
 * whose own sign is `ascendantSign` — the same whole-sign rule
 * src/lib/astrology/derive.ts's signHouseNumber applies in reverse. */
function signForHouse(ascendantSign: number, house: number): number {
  return (((ascendantSign - 1 + (house - 1)) % 12) + 12) % 12 + 1;
}

/** Renders a real, locally-computed North Indian style Vedic birth
 * chart — plain inline SVG built from structured chart data, no
 * external chart library, no dangerouslySetInnerHTML. Responsive via
 * viewBox (scales with container width); fixed light palette matching
 * this app's nav-amethyst/nav-plum/nav-pearl/nav-lavender tokens (the
 * site has no dark mode to account for). */
export function NorthIndianChart({ ascendantSign, planets, className }: NorthIndianChartProps) {
  const planetsByHouse = new Map<number, ChartPlanetName[]>();
  for (const name of PLANET_ORDER) {
    const entry = planets[name];
    if (!entry) continue;
    const list = planetsByHouse.get(entry.house) ?? [];
    list.push(name);
    planetsByHouse.set(entry.house, list);
  }

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={`North Indian style Vedic birth chart, Ascendant in sign ${ascendantSign}`}
      className={className ?? "w-full max-w-[360px]"}
    >
      <rect x={0} y={0} width={SIZE} height={SIZE} fill="#fdfcff" />

      {HOUSE_CELLS.map((cell) => (
        <polygon
          key={cell.house}
          points={polygonPoints(cell.polygon)}
          fill={cell.house === 1 ? "#f6f1fb" : "#fdfcff"}
          stroke="#e4d7f4"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}
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

      {HOUSE_CELLS.map((cell) => {
        const sign = signForHouse(ascendantSign, cell.house);
        const housePlanets = planetsByHouse.get(cell.house) ?? [];
        // Sign number sits just above the planet glyphs; planet
        // abbreviations wrap onto stacked lines (max 3 per line) so a
        // crowded house (several planets conjunct) stays legible.
        const lines: ChartPlanetName[][] = [];
        for (let i = 0; i < housePlanets.length; i += 3) {
          lines.push(housePlanets.slice(i, i + 3));
        }

        return (
          <g key={cell.house}>
            <text
              x={cell.anchor.x}
              y={cell.anchor.y - (lines.length > 0 ? 10 : 0)}
              textAnchor="middle"
              fontSize={11}
              fill="#7c4dc4"
              fontWeight={600}
            >
              {sign}
            </text>
            {lines.map((line, lineIndex) => (
              <text
                key={lineIndex}
                x={cell.anchor.x}
                y={cell.anchor.y + 6 + lineIndex * 13}
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
