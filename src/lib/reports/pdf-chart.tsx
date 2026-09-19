// src/lib/reports/pdf-chart.tsx
// PDF-native North Indian birth chart — the same "diamond-in-a-square"
// geometry as src/components/charts/NorthIndianChart.tsx (imported
// directly, not re-derived), rebuilt from @react-pdf/renderer's own
// Svg/Polygon/Rect/Text/Tspan primitives instead of browser SVG
// elements, since react-pdf renders its own primitive tree — it can't
// consume arbitrary DOM/SVG markup. Reusing the exact same HOUSE_CELLS
// coordinates keeps the downloaded PDF's chart pixel-consistent with
// what the web reader shows via BirthChartCard, not a second,
// independently-drifting layout.
import { Svg, Polygon, Rect, Text, G, View, StyleSheet } from "@react-pdf/renderer";
import { HOUSE_CELLS, SIZE } from "@/components/charts/NorthIndianChart";
import { PLANET_ABBREVIATIONS, PLANET_ORDER, signForHouse } from "@/components/charts/shared";
import type { ChartPlanetName } from "@/lib/astro-engine/ephemeris";
import type { ChartStylePlanet } from "@/components/charts/types";

// react-pdf's published TS types omit fontSize/fontWeight from
// SVGPresentationAttributes even though the underlying PDFKit-based
// renderer honors them on SVG <Text>/<Tspan> (verified against
// @react-pdf/render's own style-property whitelist, which includes
// 'fontSize') — this is a gap in the library's .d.ts, not a runtime
// limitation. Casting only these two SVG-context text primitives to a
// looser prop type avoids fighting that gap across this whole file.
const SvgText = Text as unknown as React.ComponentType<Record<string, unknown>>;

function polygonPoints(polygon: { x: number; y: number }[]): string {
  return polygon.map((p) => `${p.x},${p.y}`).join(" ");
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  caption: { fontSize: 9, color: "#7c4dc4", marginTop: 6, textAlign: "center" },
});

export function BirthChartPdf({
  ascendantSign,
  planets,
  caption,
}: {
  ascendantSign: number;
  planets: Record<ChartPlanetName, ChartStylePlanet>;
  caption?: string;
}) {
  const planetsByHouse = new Map<number, ChartPlanetName[]>();
  for (const name of PLANET_ORDER) {
    const entry = planets[name];
    if (!entry) continue;
    const list = planetsByHouse.get(entry.house) ?? [];
    list.push(name);
    planetsByHouse.set(entry.house, list);
  }

  return (
    <View style={styles.wrap}>
      <Svg width={320} height={320} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Rect x={0} y={0} width={SIZE} height={SIZE} fill="#fdfcff" />

        {HOUSE_CELLS.map((cell) => (
          <Polygon
            key={cell.house}
            points={polygonPoints(cell.polygon)}
            fill={cell.house === 1 ? "#f6f1fb" : "#fdfcff"}
            stroke="#e4d7f4"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        ))}
        <Rect
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
          // One line per up-to-3 planets, matching the web chart —
          // Tspan has no `dx` in react-pdf's SVG text model, so each
          // line is built as one space-joined string instead of
          // per-planet tspans.
          const lines: string[] = [];
          for (let i = 0; i < housePlanets.length; i += 3) {
            lines.push(
              housePlanets
                .slice(i, i + 3)
                .map((name) => PLANET_ABBREVIATIONS[name] + (planets[name].isRetrograde ? "(R)" : ""))
                .join(" "),
            );
          }

          // Sibling <Text> elements, each independently positioned —
          // NOT nested (nesting <Text> inside <Text> isn't the same as
          // SVG's <tspan>-inside-<text> and doesn't reliably honor a
          // child's own absolute x/y in react-pdf's SVG text model, so
          // this mirrors NorthIndianChart.tsx's own sibling-<text>
          // structure instead of trying to replicate its nested
          // <tspan> lines exactly).
          return (
            <G key={cell.house}>
              <SvgText
                x={cell.anchor.x}
                y={cell.anchor.y - (lines.length > 0 ? 10 : 0)}
                textAnchor="middle"
                fontSize={11}
                fill="#7c4dc4"
                fontWeight={600}
              >
                {sign}
              </SvgText>
              {lines.map((line, i) => (
                <SvgText
                  key={i}
                  x={cell.anchor.x}
                  y={cell.anchor.y + 6 + i * 13}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#3d2154"
                  fontWeight={500}
                >
                  {line}
                </SvgText>
              ))}
            </G>
          );
        })}
      </Svg>
      {caption && <Text style={styles.caption}>{caption}</Text>}
    </View>
  );
}
