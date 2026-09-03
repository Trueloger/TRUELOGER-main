// src/components/charts/WesternWheelChart.tsx
// A real, locally-authored inline SVG rendering of a circular 12-slice
// "wheel" birth chart — the format most Western astrology software
// uses, adapted here for this site's real SIDEREAL (Lahiri) data: the
// same sign/house/degree values the other three chart styles use, just
// plotted circularly instead of in a diamond/grid. This is NOT a
// conversion to the tropical zodiac — it plots the exact same sidereal
// longitudes calculateChart() already produces. Fed structured chart
// data, never raw third-party markup — nothing here to sanitize and no
// dangerouslySetInnerHTML anywhere.
//
// Convention (researched, whole-sign houses to match the rest of this
// engine — see src/lib/astro-engine/ephemeris.ts's ChartPlanetEntry.house
// / src/lib/astrology/derive.ts's signHouseNumber, both whole-sign):
//   - The Ascendant sits at the 9 o'clock position (the left horizontal
//     point of the circle) and houses are laid out COUNTERCLOCKWISE
//     from there, matching the Earth's own eastward (= counterclockwise,
//     as viewed on a chart) rotation:
//       https://www.solacely.co/en-us/blogs/astrology-and-crystals/astrology-houses
//       ("the midpoint on the left side of the chart is always the
//       first house... Earth rotates eastward on its axis, and eastward
//       rotation is anticlockwise rotation. This physical basis
//       explains why the astrological wheel follows the same
//       counterclockwise pattern.")
//       https://cafeastrology.com/articles/how-to-understand-read-chart-wheel.html
//       (confirms the Ascendant anchors the 9 o'clock point and houses
//       proceed counterclockwise around the wheel).
//   - Each house is a fixed 30° slice (whole-sign: house N holds
//     exactly the sign N-1 signs ahead of the Ascendant's sign, same
//     rule as src/lib/astrology/derive.ts's signHouseNumber), so house
//     cusps line up exactly with sign boundaries here — no separate
//     Placidus/Koch cusp calculation, consistent with the rest of this
//     engine's whole-sign approach.
// Planets are placed within their house's 30° slice at an angle offset
// by their real degree-in-sign (0-30 -> 0-30° within the slice, same
// rotational sense as the houses), and staggered across radius bands
// when a house holds more than one planet, to avoid overlapping
// glyphs.
import { PLANET_ABBREVIATIONS, PLANET_ORDER, signForHouse } from "./shared";
import type { ChartPlanetName } from "@/lib/astro-engine/ephemeris";
import type { ChartStyleProps } from "./types";

export type WesternWheelChartProps = ChartStyleProps;

const SIZE = 400;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = 188;
const SIGN_BAND_INNER_R = 156;
const HOUSE_LABEL_R = 140;
const PLANET_R_START = 66;
const PLANET_R_STEP = 20;
const CENTER_HOLE_R = 40;

const DEG2RAD = Math.PI / 180;

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

/** House 1 starts at the 9 o'clock point (180°, standard math angle
 * convention) and houses proceed counterclockwise from there — see
 * module doc comment for sourcing. Standard math angles already
 * increase counterclockwise, so house N's slice simply starts at
 * 180 + (N-1)*30. */
function houseStartAngleDeg(house: number): number {
  return 180 + (house - 1) * 30;
}

/** Polar -> SVG cartesian. SVG's y-axis points down, so `-sin` here
 * makes increasing `angleDeg` rotate counterclockwise as actually
 * displayed on screen (matching the sourced convention above), not
 * just in abstract math-angle terms. */
function point(radius: number, angleDeg: number): { x: number; y: number } {
  const rad = angleDeg * DEG2RAD;
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}

/** Renders a real, locally-computed circular wheel birth chart — plain
 * inline SVG, no external chart library, no dangerouslySetInnerHTML.
 * Same responsive viewBox approach and light palette as the other
 * three chart styles in this directory. */
export function WesternWheelChart({ ascendantSign, planets, className }: WesternWheelChartProps) {
  const planetsByHouse = new Map<number, ChartPlanetName[]>();
  for (const name of PLANET_ORDER) {
    const entry = planets[name];
    if (!entry) continue;
    const list = planetsByHouse.get(entry.house) ?? [];
    list.push(name);
    planetsByHouse.set(entry.house, list);
  }
  // Stable visual order within a shared house slice: sort by degree so
  // planets read left-to-right in the same order they actually sit.
  for (const list of planetsByHouse.values()) {
    list.sort((a, b) => planets[a].degree - planets[b].degree);
  }

  const houses = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={`Western wheel style Vedic birth chart, Ascendant in sign ${ascendantSign}`}
      className={className ?? "w-full max-w-[360px]"}
    >
      <circle cx={CX} cy={CY} r={OUTER_R} fill="#fdfcff" stroke="#7c4dc4" strokeWidth={1.5} />
      <circle cx={CX} cy={CY} r={SIGN_BAND_INNER_R} fill="none" stroke="#e4d7f4" strokeWidth={1} />
      <circle cx={CX} cy={CY} r={CENTER_HOLE_R} fill="none" stroke="#e4d7f4" strokeWidth={1} />

      {/* House/sign cusp spokes — one per 30° house boundary, from the
          center hole out to the rim. The house-1 cusp (the Ascendant
          itself) is drawn thicker and labeled "ASC". */}
      {houses.map((house) => {
        const angle = houseStartAngleDeg(house);
        const inner = point(CENTER_HOLE_R, angle);
        const outer = point(OUTER_R, angle);
        const isAscendantCusp = house === 1;
        return (
          <line
            key={house}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke={isAscendantCusp ? "#7c4dc4" : "#e4d7f4"}
            strokeWidth={isAscendantCusp ? 2.5 : 1}
          />
        );
      })}

      {/* ASC label at the 9 o'clock point. */}
      {(() => {
        const p = point(OUTER_R + 10, 180);
        return (
          <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#7c4dc4" fontWeight={700}>
            ASC
          </text>
        );
      })()}

      {/* Sign band — the sign occupying each house's slice (whole-sign:
          house N holds the sign N-1 signs ahead of the Ascendant). */}
      {houses.map((house) => {
        const sign = signForHouse(ascendantSign, house);
        const midAngle = houseStartAngleDeg(house) + 15;
        const p = point((SIGN_BAND_INNER_R + OUTER_R) / 2, midAngle);
        return (
          <text
            key={house}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fill="#7c4dc4"
            fontWeight={600}
          >
            {SIGN_NAMES[sign - 1].slice(0, 3)}
          </text>
        );
      })}

      {/* House numbers, just inside the sign band. */}
      {houses.map((house) => {
        const midAngle = houseStartAngleDeg(house) + 15;
        const p = point(HOUSE_LABEL_R, midAngle);
        return (
          <text
            key={house}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fill="#b79bd6"
          >
            {house}
          </text>
        );
      })}

      {/* Planet glyphs — positioned within their house's slice at an
          angle offset by degree-in-sign, staggered across radius bands
          when a house holds more than one planet. */}
      {houses.flatMap((house) => {
        const housePlanets = planetsByHouse.get(house) ?? [];
        return housePlanets.map((name, index) => {
          const entry = planets[name];
          const angle = houseStartAngleDeg(house) + entry.degree;
          const radius = PLANET_R_START + index * PLANET_R_STEP;
          const p = point(radius, angle);
          return (
            <text
              key={name}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fill="#3d2154"
              fontWeight={500}
            >
              {PLANET_ABBREVIATIONS[name]}
              {entry.isRetrograde && (
                <tspan fontSize={7} baselineShift="super" fill="#6a3cb0">
                  R
                </tspan>
              )}
            </text>
          );
        });
      })}
    </svg>
  );
}
