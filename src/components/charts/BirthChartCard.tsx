"use client";

// src/components/charts/BirthChartCard.tsx
// The ONE shared entry point every tool should use to render a birth
// chart — wraps a small style switcher (North Indian / South Indian /
// East Indian / Western Wheel) plus the selected chart component,
// wraps it in the site's existing ChartCard frame. Fed one
// `{ascendantSign, planets}` prop, matching every chart style
// component's shared ChartStyleProps shape (src/components/charts/types.ts).
import { useState } from "react";
import { ChartCard } from "@/components/reports/ChartCard";
import { NorthIndianChart } from "./NorthIndianChart";
import { SouthIndianChart } from "./SouthIndianChart";
import { EastIndianChart } from "./EastIndianChart";
import { WesternWheelChart } from "./WesternWheelChart";
import type { ChartStyleId, ChartStyleProps } from "./types";

const STORAGE_KEY = "chart-style";

const STYLE_OPTIONS: { id: ChartStyleId; label: string; caption: string }[] = [
  { id: "north-indian", label: "North Indian", caption: "Rasi (D1) Chart — North Indian Style" },
  { id: "south-indian", label: "South Indian", caption: "Rasi (D1) Chart — South Indian Style" },
  { id: "east-indian", label: "East Indian", caption: "Rasi (D1) Chart — East Indian (Bengali) Style" },
  { id: "western-wheel", label: "Western Wheel", caption: "Rasi (D1) Chart — Western Wheel Style" },
];

const DEFAULT_STYLE: ChartStyleId = "north-indian";

function isChartStyleId(value: unknown): value is ChartStyleId {
  return (
    value === "north-indian" ||
    value === "south-indian" ||
    value === "east-indian" ||
    value === "western-wheel"
  );
}

/** Reads the viewer's last-picked chart style from localStorage — a
 * per-viewer, non-critical display preference, so any failure (private
 * browsing, storage disabled, ...) just falls back to the default
 * style rather than breaking the chart. No other component in this
 * codebase uses localStorage yet, so this establishes the try/catch
 * convention for future per-viewer preferences. */
function readStoredStyle(): ChartStyleId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isChartStyleId(stored) ? stored : DEFAULT_STYLE;
  } catch {
    return DEFAULT_STYLE;
  }
}

function writeStoredStyle(style: ChartStyleId): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, style);
  } catch {
    // Non-critical preference — silently ignore (private browsing,
    // storage disabled, quota exceeded, ...).
  }
}

export function BirthChartCard({ ascendantSign, planets, className }: ChartStyleProps) {
  // Lazy-initialized from localStorage on first render — safe here
  // (no hydration mismatch risk) because BirthChartCard only ever
  // mounts client-side, after a fetch response lands in a "use client"
  // form component's state; it is never part of server-rendered HTML.
  const [style, setStyle] = useState<ChartStyleId>(() => readStoredStyle());

  function selectStyle(next: ChartStyleId) {
    setStyle(next);
    writeStoredStyle(next);
  }

  const active = STYLE_OPTIONS.find((o) => o.id === style) ?? STYLE_OPTIONS[0];

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Chart style" className="flex flex-wrap justify-center gap-2">
        {STYLE_OPTIONS.map((option) => {
          const isActive = option.id === style;
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => selectStyle(option.id)}
              className={
                isActive
                  ? "min-h-9 rounded-full bg-nav-amethyst px-4 py-1.5 text-xs font-medium text-white shadow-[0_2px_8px_rgba(90,55,140,0.25)]"
                  : "min-h-9 rounded-full border border-nav-lavender-line px-4 py-1.5 text-xs font-medium text-nav-plum transition-colors hover:border-nav-amethyst/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl"
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <ChartCard caption={active.caption}>
        {style === "north-indian" && (
          <NorthIndianChart ascendantSign={ascendantSign} planets={planets} className={className} />
        )}
        {style === "south-indian" && (
          <SouthIndianChart ascendantSign={ascendantSign} planets={planets} className={className} />
        )}
        {style === "east-indian" && (
          <EastIndianChart ascendantSign={ascendantSign} planets={planets} className={className} />
        )}
        {style === "western-wheel" && (
          <WesternWheelChart ascendantSign={ascendantSign} planets={planets} className={className} />
        )}
      </ChartCard>
    </div>
  );
}
