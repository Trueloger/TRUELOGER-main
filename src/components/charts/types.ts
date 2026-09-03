// src/components/charts/types.ts
// Shared prop shape for every chart style component in this directory
// (NorthIndianChart, SouthIndianChart, EastIndianChart,
// WesternWheelChart) and for BirthChartCard, which switches between
// them. One canonical shape so every caller (free-kundli,
// kundli-matching, compatibility, ...) feeds the same structured data
// regardless of which visual style is selected.
import type { ChartPlanetName } from "@/lib/astro-engine/ephemeris";

export type ChartStylePlanet = {
  sign: number; // 1-12, sidereal sign the planet occupies
  house: number; // 1-12, whole-sign house from the Ascendant
  isRetrograde: boolean;
  degree: number; // 0-30, degree within sign
};

export type ChartStyleProps = {
  /** 1-12, sidereal sign number occupying House 1 (the Ascendant's own sign). */
  ascendantSign: number;
  planets: Record<ChartPlanetName, ChartStylePlanet>;
  className?: string;
};

export type ChartStyleId = "north-indian" | "south-indian" | "east-indian" | "western-wheel";
