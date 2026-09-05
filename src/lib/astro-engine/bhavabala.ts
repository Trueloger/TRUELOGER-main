// src/lib/astro-engine/bhavabala.ts
// Bhava Bala — classical HOUSE strength, kept as its own module,
// separate from Shadbala (planetary strength, shadbala.ts) per this
// engine's task spec. Computed for all 12 whole-sign houses (counted
// from the Ascendant, the only house-counting convention this repo
// uses anywhere — see ephemeris.ts's `ChartPlanetEntry.house`).
//
// ============================================================================
// HONESTY NOTICE — read before trusting any number this module returns
// ============================================================================
// Classical Bhava Bala (Brihat Parashara Hora Shastra ch. 27, sloka
// 26-31) has its own house-specific "House Bala" formula, keyed to
// WHICH SIGN occupies the house (a "Seershodaya"/head-rising vs.
// "Prishtodaya"/back-rising sign classification, with special-cased
// exceptions for Sagittarius/Capricorn/Cancer/Scorpio/Pisces) plus a
// benefic/malefic-aspect adjustment and an occupant-based bonus/malus
// ("Houses occupied by Jupiter/Mercury get +1 Rupa, by Saturn/Mars/
// Sun get -1 Rupa"). Reproducing THAT exact formula requires the same
// per-sign rising-type table BPHS's Bhava Digbala verse depends on,
// which is materially more intricate than anything reused here. This
// module instead implements a CORE, well-sourced-per-piece house
// strength built from simpler, independently-documented classical
// building blocks already used elsewhere in this engine (the Kendra/
// Panaphara/Apoklima angularity classification, Parashari graha
// drishti, and each house-lord's own Shadbala) — explicitly NOT a
// reproduction of BPHS's own house-specific formula. Treat every
// number here as a "core Bhava Bala", not the exact BPHS figure.
import type { ChartData, ChartPlanetName } from "./ephemeris.ts";
import { calculateShadbala, type ClassicalPlanetName } from "./shadbala.ts";
import { calculateAspects } from "./aspects.ts";

// ---------------------------------------------------------------------
// Shared house/lordship helpers (same small style dignity.ts/yogas.ts/
// shadbala.ts already use for this same static BPHS ch.6 table).
// ---------------------------------------------------------------------

const CLASSICAL_PLANETS: readonly ClassicalPlanetName[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
];

const OWN_SIGNS: Record<ClassicalPlanetName, number[]> = {
  Sun: [5], Moon: [4], Mars: [1, 8], Mercury: [3, 6], Jupiter: [9, 12], Venus: [2, 7], Saturn: [10, 11],
};

const SIGN_LORD: Record<number, ClassicalPlanetName> = (() => {
  const table: Partial<Record<number, ClassicalPlanetName>> = {};
  for (const planet of CLASSICAL_PLANETS) {
    for (const sign of OWN_SIGNS[planet]) table[sign] = planet;
  }
  return table as Record<number, ClassicalPlanetName>;
})();

function signOffset(sign: number, offset: number): number {
  return ((sign - 1 + offset) % 12) + 1;
}

/** The whole-sign house Ascendant-relative sign for house `houseNumber` (1-12). */
function signOfHouse(chart: ChartData, houseNumber: number): number {
  return signOffset(chart.ascendant.sign, houseNumber - 1);
}

const KENDRA_HOUSES = new Set([1, 4, 7, 10]);
const PANAPHARA_HOUSES = new Set([2, 5, 8, 11]);

// ---------------------------------------------------------------------
// Sub-component 1: Bhavadhipati Bala (house-lord strength)
// ---------------------------------------------------------------------
//
// Classical concept: a house is strong when its LORD is strong
// ("Bhavadhipati Bala" = strength contributed by the house-lord's own
// condition). Source (general concept, cross-checked across
// secondary Jyotish references, e.g.
// https://vedastro.org/blog/Graha-Bhava-Balas-Part-6-Directional-Strength.html
// and standard Bhava Bala write-ups): a house's strength is partly
// derived from how strong its ruling planet is elsewhere in the
// chart. This module operationalizes that directly and transparently
// as the house-lord's OWN full Shadbala total (in Virupas, via
// `calculateShadbala`, already computed by this engine) — a
// documented CHOICE of how to turn "the lord's strength" into a
// number, not an independently-sourced BPHS Virupa formula for this
// specific sub-component (some traditions instead use a fraction,
// e.g. half, of the lord's Shadbala; this module uses the lord's full
// Shadbala total, clearly stated here so the convention is explicit
// and traceable rather than an unstated arbitrary choice).
function bhavadhipatiBala(chart: ChartData, lord: ClassicalPlanetName): number {
  const shadbala = calculateShadbala(chart)[lord];
  return shadbala?.totalVirupas ?? 0;
}

// ---------------------------------------------------------------------
// Sub-component 2: Bhava Digbala (house angularity)
// ---------------------------------------------------------------------
//
// A SIMPLIFIED stand-in for BPHS's own per-sign "House Bala" formula
// (see module doc comment above for why the exact formula is out of
// scope): this module reuses the same, independently well-sourced
// Kendra(angle)/Panaphara(succedent)/Apoklima(cadent) angularity
// classification `shadbala.ts`'s Kendradi Bala already uses for
// PLANETS (BPHS ch.27 sloka 5: Kendra = 60 Virupas, Panaphara = 30,
// Apoklima = 15) — applied here to the HOUSE NUMBER ITSELF rather
// than a planet's occupied house, since angularity (how close a house
// is to an angle from the Ascendant) is exactly the same structural
// property for a house as for a planet occupying it. This is a
// deliberate reuse/analogy, not a claim that BPHS's own Bhava Digbala
// verse (sloka 26-29, sign-rising-type-based) reduces to this table —
// documented as a named simplification.
function bhavaDigBala(houseNumber: number): number {
  if (KENDRA_HOUSES.has(houseNumber)) return 60;
  if (PANAPHARA_HOUSES.has(houseNumber)) return 30;
  return 15;
}

// ---------------------------------------------------------------------
// Sub-component 3: Bhava Drishti Bala (aspects received by the house)
// ---------------------------------------------------------------------
//
// Reuses the existing Parashari graha drishti engine (`aspects.ts`,
// already used by yogas.ts and shadbala.ts's own Drik Bala) rather
// than a new aspect system: every classical planet's aspect landing on
// the house's sign contributes a flat ±15-Virupa strength (benefic
// aspector adds, malefic subtracts) — the SAME flat-weight
// simplification and benefic/malefic convention shadbala.ts's own
// Drik Bala documents and uses (see that module's Drik Bala doc
// comment for the full sourcing/rationale; duplicated here rather
// than imported since this module's per-HOUSE aspect tally is a
// distinct calculation from shadbala.ts's per-PLANET one, even though
// the underlying per-aspect weighting convention is intentionally
// kept identical for consistency across this engine).
const DRIK_MALEFICS = new Set<ClassicalPlanetName>(["Sun", "Mars", "Saturn"]);

function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function isMoonWaxing(chart: ChartData): boolean {
  const elongation = normalizeDegrees(chart.planets.Moon.longitude - chart.planets.Sun.longitude);
  return elongation < 180;
}

function isBeneficAspector(aspectorName: ChartPlanetName, chart: ChartData): boolean {
  if (aspectorName === "Moon") return isMoonWaxing(chart);
  return (CLASSICAL_PLANETS as readonly string[]).includes(aspectorName) && !DRIK_MALEFICS.has(aspectorName as ClassicalPlanetName);
}

function bhavaDrishtiBala(chart: ChartData, houseSign: number): { count: number; strength: number } {
  const aspects = calculateAspects(chart).filter((a) => a.toSign === houseSign);
  let strength = 0;
  for (const aspect of aspects) {
    strength += isBeneficAspector(aspect.fromPlanet, chart) ? 15 : -15;
  }
  return { count: aspects.length, strength };
}

// ---------------------------------------------------------------------
// Sub-component 4: occupant strength
// ---------------------------------------------------------------------
//
// A house with strong occupying planets is itself materially
// strengthened (the standard classical rationale behind "benefics in
// a house strengthen it, malefics weaken it" statements found across
// house-effect chapters, e.g. BPHS's own per-house effect chapters
// consistently treat the house-occupant's own strength/nature as
// relevant to that house's outcome). Operationalized here as the sum
// of each occupant's Naisargika Bala (natural strength, chart-
// independent, always available even for a planet with no classical
// Shadbala) for classical occupants, which keeps this sub-component
// simple and always well-defined (unlike full Shadbala, Naisargika
// Bala has no missing sub-components to worry about propagating here).

function occupantBala(chart: ChartData, occupants: ChartPlanetName[]): number {
  let total = 0;
  for (const occupant of occupants) {
    if ((CLASSICAL_PLANETS as readonly string[]).includes(occupant)) {
      const shadbala = calculateShadbala(chart)[occupant as ClassicalPlanetName];
      total += shadbala?.naisargikaBala ?? 0;
    }
  }
  return total;
}

// ---------------------------------------------------------------------
// Public result type + entry point
// ---------------------------------------------------------------------

export type BhavaBalaResult = {
  house: number; // 1-12
  houseLord: ChartPlanetName;
  occupants: ChartPlanetName[];
  /** Count of Parashari aspects (from `calculateAspects`) landing on
   * this house's sign — a plain integer count, distinct from the
   * WEIGHTED `bhavaDrishtiBala` figure in `strengthComponents` (which
   * signs benefic vs. malefic aspectors ±15 Virupas each — see that
   * sub-component's doc comment above). */
  aspectsReceived: number;
  /** Every raw sub-component this module computes, named — see each
   * sub-component's own doc comment above for its sourcing/simplification. */
  strengthComponents: {
    bhavadhipatiBala: number;
    bhavaDigBala: number;
    bhavaDrishtiBala: number;
    occupantBala: number;
  };
  totalStrength: number;
};

/**
 * Core Bhava (house) strength for all 12 whole-sign houses, counted
 * from the Ascendant. See the module-level "HONESTY NOTICE" above —
 * this is a documented CORE/simplified house-strength system built
 * from already-sourced building blocks elsewhere in this engine, not
 * a reproduction of BPHS's own sign-specific House Bala formula.
 */
export function calculateBhavaBala(chart: ChartData): BhavaBalaResult[] {
  const results: BhavaBalaResult[] = [];

  for (let house = 1; house <= 12; house++) {
    const houseSign = signOfHouse(chart, house);
    const houseLord = SIGN_LORD[houseSign];
    const occupants = (Object.keys(chart.planets) as ChartPlanetName[]).filter(
      (name) => chart.planets[name].house === house
    );

    const bhavadhipati = bhavadhipatiBala(chart, houseLord);
    const digBala = bhavaDigBala(house);
    const drishti = bhavaDrishtiBala(chart, houseSign);
    const occupant = occupantBala(chart, occupants);

    const totalStrength = bhavadhipati + digBala + drishti.strength + occupant;

    results.push({
      house,
      houseLord,
      occupants,
      aspectsReceived: drishti.count,
      strengthComponents: {
        bhavadhipatiBala: bhavadhipati,
        bhavaDigBala: digBala,
        bhavaDrishtiBala: drishti.strength,
        occupantBala: occupant,
      },
      totalStrength,
    });
  }

  return results;
}
