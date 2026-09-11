// src/lib/reports/snapshot.ts
// Builds the ONE canonical AstrologySnapshot for a purchased report,
// entirely from the existing local astro-engine (src/lib/astro-engine/*)
// — the same deterministic, network-free calculator /api/free-kundli
// already uses. No external astrology API call, no AI involvement: this
// is pure math, the factual ground truth every report section is
// interpreted from (AGENTS §21/§22/§124).
import { calculateChart, type ChartData } from "@/lib/astro-engine/ephemeris";
import { calculateDivisionalChart, IMPLEMENTED_VARGAS } from "@/lib/astro-engine/divisional";
import { detectYogas } from "@/lib/astro-engine/yogas";
import { calculateShadbala } from "@/lib/astro-engine/shadbala";
import { calculateBhavaBala } from "@/lib/astro-engine/bhavabala";
import { vimshottariDasha } from "@/lib/dasha/calculate";
import { signHouseNumber } from "@/lib/astrology/derive";
import { getRashiReference } from "@/lib/astrology/rashi-reference";
import type { AstrologySnapshot, ReportProfileSnapshot } from "./types";

const MANGAL_DOSHA_HOUSES = new Set([1, 2, 4, 7, 8, 12]);
const CLASSICAL_SEVEN = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;

function birthProfileToUtcDate(profile: ReportProfileSnapshot): Date {
  const [year, month, date] = profile.dob.split("-").map(Number);
  const [hours, minutes] = (profile.timeUnknown ? "12:00" : profile.timeOfBirth).split(":").map(Number);
  const utcMs =
    Date.UTC(year, month - 1, date, hours, minutes, 0) - profile.birthTimezoneHours * 60 * 60 * 1000;
  return new Date(utcMs);
}

function signName(sign: number): string {
  return getRashiReference(sign)?.signName ?? `Sign ${sign}`;
}

/** Mangal Dosha (Kuja Dosha): Mars in house 1/2/4/7/8/12 from EITHER
 * the Ascendant or the natal Moon — the same classical rule
 * src/lib/astrology/derive.ts's deriveMangalDosha implements, reworked
 * here directly against the local ChartData shape (that function is
 * still typed against the older external-API planet shape). */
function computeMangalDosha(chart: ChartData) {
  const houseFromAscendant = signHouseNumber(chart.ascendant.sign, chart.planets.Mars.sign);
  const houseFromMoon = signHouseNumber(chart.planets.Moon.sign, chart.planets.Mars.sign);
  const fromAscendant = MANGAL_DOSHA_HOUSES.has(houseFromAscendant);
  const fromMoon = MANGAL_DOSHA_HOUSES.has(houseFromMoon);
  return { hasDosha: fromAscendant || fromMoon, houseFromAscendant, houseFromMoon, fromAscendant, fromMoon };
}

/** Sade Sati: transiting Saturn in the 12th/1st/2nd sign from the
 * natal Moon. `transitChart` is a chart cast for "now" (Saturn's sign
 * is effectively location-independent at this granularity). */
function computeSadeSati(natalMoonSign: number, transitingSaturnSign: number) {
  const houseFromNatalMoon = signHouseNumber(natalMoonSign, transitingSaturnSign);
  let phase: "rising" | "peak" | "setting" | null = null;
  if (houseFromNatalMoon === 12) phase = "rising";
  else if (houseFromNatalMoon === 1) phase = "peak";
  else if (houseFromNatalMoon === 2) phase = "setting";
  return { active: phase !== null, phase, houseFromNatalMoon };
}

/** Kaal Sarp Dosha: all seven classical planets fall within one
 * continuous hemisphere between Rahu and Ketu (the standard rule —
 * every classical planet on one side of the Rahu-Ketu axis, none
 * "crossing" to the other side). */
function computeKaalSarp(chart: ChartData) {
  const rahu = chart.planets.Rahu.longitude;
  const ketu = chart.planets.Ketu.longitude;
  // Arc going forward (increasing longitude, wrapping at 360) from Rahu to Ketu.
  const forwardSpan = ((ketu - rahu + 360) % 360) || 360;
  let allOnOneSide = true;
  for (const name of CLASSICAL_SEVEN) {
    const lon = chart.planets[name].longitude;
    const fromRahu = ((lon - rahu + 360) % 360);
    if (fromRahu > forwardSpan) {
      allOnOneSide = false;
      break;
    }
  }
  return { hasDosha: allOnOneSide };
}

export async function buildAstrologySnapshot(profile: ReportProfileSnapshot): Promise<AstrologySnapshot> {
  const birthUtc = birthProfileToUtcDate(profile);
  const chart = calculateChart(birthUtc, profile.birthLatitude, profile.birthLongitude);

  const divisionalCharts: Record<string, unknown> = {};
  for (const varga of IMPLEMENTED_VARGAS) {
    divisionalCharts[`D${varga}`] = calculateDivisionalChart(varga, chart);
  }

  const yogas = detectYogas(chart);
  const shadbala = calculateShadbala(chart);
  const bhavabala = calculateBhavaBala(chart);
  const dasha = vimshottariDasha(chart.planets.Moon.longitude, birthUtc);
  const mangalDosha = computeMangalDosha(chart);
  const kaalSarp = computeKaalSarp(chart);

  // Sade Sati needs a CURRENT transit reading — same lat/long is fine
  // for Saturn's sign-level position at this granularity.
  const transitChart = calculateChart(new Date(), profile.birthLatitude, profile.birthLongitude);
  const sadeSati = computeSadeSati(chart.planets.Moon.sign, transitChart.planets.Saturn.sign);

  return {
    ascendant: { sign: chart.ascendant.sign, signName: signName(chart.ascendant.sign), degree: chart.ascendant.degree },
    moonSign: { sign: chart.planets.Moon.sign, signName: signName(chart.planets.Moon.sign) },
    nakshatra: { name: chart.planets.Moon.nakshatra.nakshatraName, pada: chart.planets.Moon.nakshatra.pada },
    planets: chart.planets,
    houses: { ascendant: chart.ascendant, mc: chart.mc },
    divisionalCharts,
    yogas,
    mangalDosha,
    sadeSati,
    kaalSarp,
    vimshottariDasha: dasha,
    shadbala,
    bhavabala,
    ayanamsha: chart.ayanamsha,
    calculatedAt: Date.now(),
    engineVersion: 1,
  };
}
