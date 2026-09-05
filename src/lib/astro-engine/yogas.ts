// src/lib/astro-engine/yogas.ts
// Declarative Vedic Yoga-detection engine. Given a `ChartData`, this
// module internally computes dignity (dignity.ts), combustion
// (combustion.ts) and Parashari aspects (aspects.ts) ONCE per
// `detectYogas()` call, bundles them into a `YogaContext`, and runs a
// registry of small, composable `YogaRule`s against that context —
// rather than a long list of hand-written if-statements duplicated
// per yoga. This module NEVER generates interpretation text; each rule
// only carries a stable `interpretationKey` for a future lookup table,
// and detection returns only presence + (where the tradition defines
// one) a strength grade.
//
// SCOPE (see the task-level instructions this module was built against):
// implemented in this exact order, each fully tested before moving on:
//   1. Panch Mahapurusha Yogas (Ruchaka/Bhadra/Hamsa/Malavya/Sasa)
//   2. Gaja Kesari Yoga
//   3. Budha-Aditya Yoga
//   4. Neecha Bhanga Raja Yoga
//   5. Viparita Raja Yoga (Harsha/Sarala/Vimala)
//   6. A basic Dhana Yoga check
//   7. A basic Raja Yoga check
// Every rule documents, in its own comment block, which sourced
// classical variant it follows where sources disagreed, and which
// refinements/exceptions/sub-variants were knowingly skipped for scope.
import type { ChartData, ChartPlanetEntry, ChartPlanetName } from "./ephemeris.ts";
import { calculatePlanetaryDignity, type ClassicalPlanetName, type DignityResult } from "./dignity.ts";
import { calculateCombustion, type CombustionResult } from "./combustion.ts";
import { calculateAspects, type Aspect } from "./aspects.ts";

// ---------------------------------------------------------------------
// Public architecture types (per task spec)
// ---------------------------------------------------------------------

export type YogaContext = {
  chart: ChartData;
  dignity: Record<ChartPlanetName, DignityResult | null>;
  combustion: Record<ChartPlanetName, CombustionResult>;
  aspects: Aspect[];
};

export type YogaCondition = (ctx: YogaContext) => boolean;

export type YogaCategory = "raja" | "dhana" | "mahapurusha" | "other";

export type YogaRule = {
  id: string;
  name: string;
  category: YogaCategory;
  /** ALL must hold for the yoga to be "present". */
  conditions: YogaCondition[];
  /** Stable key for a future interpretation-text lookup. This module
   * never generates interpretation text itself. */
  interpretationKey: string;
  /** Only for yogas with a classically-graded strength (e.g. Panch
   * Mahapurusha: exalted-in-kendra vs own-sign-in-kendra). Omitted from
   * the rule when the yoga is traditionally binary — `detectYogas`
   * then omits `strength` from that yoga's result too. */
  grade?: (ctx: YogaContext) => "weak" | "moderate" | "strong";
};

export type YogaResult = {
  ruleId: string;
  name: string;
  present: boolean;
  strength?: "weak" | "moderate" | "strong";
};

// ---------------------------------------------------------------------
// Shared house/lordship helpers (Parashari whole-sign houses, counted
// from the Ascendant unless documented otherwise per-rule).
// ---------------------------------------------------------------------

const CLASSICAL_PLANETS: readonly ClassicalPlanetName[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
];

/** Own (Swakshetra) signs per classical planet — same BPHS ch.6 table
 * `dignity.ts` uses (see that module's doc comment for full sourcing);
 * duplicated here (small, static, standard) rather than importing a
 * private table, so this module can derive sign-lordship for the
 * Raja/Dhana/Viparita/Neecha-Bhanga rules below without depending on
 * dignity.ts internals it doesn't export. */
const OWN_SIGNS: Record<ClassicalPlanetName, number[]> = {
  Sun: [5],
  Moon: [4],
  Mars: [1, 8],
  Mercury: [3, 6],
  Jupiter: [9, 12],
  Venus: [2, 7],
  Saturn: [10, 11],
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

function signHouseNumber(baseSign: number, targetSign: number): number {
  return (((targetSign - baseSign) % 12) + 12) % 12 + 1;
}

/** The classical lord (one of the 7 grahas) of house `houseNumber`
 * (1-12) counted from the Ascendant. */
function lordOfHouseFromAscendant(chart: ChartData, houseNumber: number): ClassicalPlanetName {
  const sign = signOffset(chart.ascendant.sign, houseNumber - 1);
  return SIGN_LORD[sign];
}

const KENDRA_HOUSES = new Set([1, 4, 7, 10]);
const TRIKONA_HOUSES = new Set([1, 5, 9]);
const DUSTHANA_HOUSES = new Set([6, 8, 12]);

/** Whether `entry`'s house (already computed relative to the Ascendant
 * by ephemeris.ts) is a Kendra (1st/4th/7th/10th) FROM THE ASCENDANT.
 * Confirmed via research (see PANCH_MAHAPURUSHA_RULES doc comment
 * below) that the classical Panch Mahapurusha rule specifically means
 * Kendra-from-Lagna, not Kendra-from-Moon or any other reference
 * point. */
function isKendraFromAscendant(entry: ChartPlanetEntry): boolean {
  return KENDRA_HOUSES.has(entry.house);
}

/** Mutual Kendra: two planets are in a Kendra relationship to EACH
 * OTHER when the whole-sign house-distance between their two signs
 * (either direction) is 1, 4, 7 or 10. */
function isMutualKendra(signA: number, signB: number): boolean {
  return KENDRA_HOUSES.has(signHouseNumber(signA, signB));
}

/** Two planets "conjunct" = occupying the same sign (whole-sign,
 * Parashari convention — this codebase has no notion of a tighter
 * orb-based conjunction anywhere else in astro-engine, so this module
 * stays consistent with that). */
function isConjunct(a: ChartPlanetEntry, b: ChartPlanetEntry): boolean {
  return a.sign === b.sign;
}

/** Whether `fromPlanet` casts a Parashari aspect onto `toSign` per the
 * pre-computed aspect list in the context. */
function aspectsSign(ctx: YogaContext, fromPlanet: ChartPlanetName, toSign: number): boolean {
  return ctx.aspects.some((a) => a.fromPlanet === fromPlanet && a.toSign === toSign);
}

/** Mutual aspect OR conjunction OR sign exchange between two planets
 * A and B (a commonly-used combined test for "connected" planets in
 * Raja/Dhana Yoga rules — see DHANA_YOGA_RULE / RAJA_YOGA_RULE doc
 * comments for exact sourcing). */
function isConnected(ctx: YogaContext, planetA: ClassicalPlanetName, planetB: ClassicalPlanetName): boolean {
  const a = ctx.chart.planets[planetA];
  const b = ctx.chart.planets[planetB];
  if (isConjunct(a, b)) return true;
  const aspectsAtoB = aspectsSign(ctx, planetA, b.sign);
  const aspectsBtoA = aspectsSign(ctx, planetB, a.sign);
  if (aspectsAtoB || aspectsBtoA) return true;
  // Sign exchange (Parivartana): each occupies the sign the other rules.
  const isExchange = OWN_SIGNS[planetA].includes(b.sign) && OWN_SIGNS[planetB].includes(a.sign);
  return isExchange;
}

function buildContext(chart: ChartData): YogaContext {
  return {
    chart,
    dignity: calculatePlanetaryDignity(chart),
    combustion: calculateCombustion(chart),
    aspects: calculateAspects(chart),
  };
}

// =======================================================================
// 1. Panch Mahapurusha Yogas
// =======================================================================
//
// Classical rule (confirmed across 2 independent sources):
//   - https://www.sriastrosai.com/post/panch-mahapurusha-yoga
//   - https://prithvijyotisha.com/panch-mahapurush-yoga-results-of-mahapurusha-yoga-in-kundli/
// "Panch Mahapurusha yogas are five distinct yogas, each formed by one
// of the five non-luminary planets when it is simultaneously in its
// own or exalted sign AND in a kendra (angular) house — 1st, 4th, 7th,
// or 10th from Lagna." Both sources agree the Kendra is measured from
// the ASCENDANT (Lagna) specifically, not the Moon — no disagreement
// found on this point across sources checked.
//
// Strength grading: sources agree exaltation-in-kendra is the stronger
// case ("most powerful ... in their respective ascendant"); this
// module grades "strong" for exalted-in-kendra, "moderate" for
// own-sign-in-kendra — own-sign is real dignity but not the peak
// (exaltation) strength the sources single out. No source gives a
// third graded tier, so "weak" is never produced for these five rules
// (the yoga is either absent, or present at one of these two
// strengths) — that is a deliberate, documented scope choice, not an
// omission.
//
// SKIPPED (documented, not silently dropped): affliction/combustion
// checks ("no malefic affliction") mentioned by some sources as a
// modifier of real-world manifestation are NOT implemented — this
// module only detects the classical positional condition (own/exalted
// + kendra) per the task's exact-condition-set instruction, and grades
// strength only by exaltation-vs-own-sign as sourced above.
const MAHAPURUSHA_KARAKA: { id: string; name: string; planet: ClassicalPlanetName }[] = [
  { id: "ruchaka", name: "Ruchaka Yoga", planet: "Mars" },
  { id: "bhadra", name: "Bhadra Yoga", planet: "Mercury" },
  { id: "hamsa", name: "Hamsa Yoga", planet: "Jupiter" },
  { id: "malavya", name: "Malavya Yoga", planet: "Venus" },
  { id: "sasa", name: "Sasa Yoga", planet: "Saturn" },
];

const MAHAPURUSHA_RULES: YogaRule[] = MAHAPURUSHA_KARAKA.map(({ id, name, planet }) => ({
  id: `mahapurusha-${id}`,
  name,
  category: "mahapurusha",
  conditions: [
    (ctx) => {
      const d = ctx.dignity[planet];
      return !!d && (d.isExalted || d.isOwnSign);
    },
    (ctx) => isKendraFromAscendant(ctx.chart.planets[planet]),
  ],
  interpretationKey: `mahapurusha.${id}`,
  grade: (ctx) => (ctx.dignity[planet]!.isExalted ? "strong" : "moderate"),
}));

// =======================================================================
// 2. Gaja Kesari Yoga
// =======================================================================
//
// Classical rule (confirmed across 2 independent sources):
//   - https://astrobix.com/engcontent/176-what-is-gaja-kesari-yoga.aspx
//   - https://www.indastro.com/learn-astrology/yoga-dasa/gaj-kesari-yoga.html
// "Gaja Kesari Yoga forms when Jupiter is in a kendra (quadrant) from
// the Moon — 1st, 4th, 7th, or 10th house from the Moon's position."
// This is the core, universally-cited condition, implemented here as
// the `present` test.
//
// DISAGREEMENT FOUND (documented, resolved via strength grading rather
// than gating presence): several secondary sources add that the yoga
// is "cancelled"/weakened when Jupiter or the Moon is combust,
// debilitated, or otherwise afflicted ("combustion state of Jupiter
// and Moon will not be considered as Gaja kesari yoga as both the
// planet has lost its strength") — but this is not a uniform,
// precisely-specified classical cancellation rule the way Panch
// Mahapurusha's kendra-from-Lagna is, and other sources treat it as a
// simple binary kendra test. This module follows the STRICTER core
// (mutual-kendra only) for `present`, and separately reports strength:
// "strong" when neither Jupiter nor the Moon is combust or debilitated,
// "weak" when either is — so the disputed affliction condition is
// surfaced as a strength signal rather than silently gating presence
// one way or the other.
//
// SKIPPED: the "must also hold in the Navamsa (D9)" refinement some
// sources mention is out of scope (no divisional-chart yoga check
// here); the "Lagna as alternate reference point" variant mentioned by
// some sources is also skipped — Moon-to-Jupiter kendra is the one
// universally-cited core condition and is what's implemented.
const GAJA_KESARI_RULE: YogaRule = {
  id: "gaja-kesari",
  name: "Gaja Kesari Yoga",
  category: "other",
  conditions: [
    (ctx) => isMutualKendra(ctx.chart.planets.Moon.sign, ctx.chart.planets.Jupiter.sign),
  ],
  interpretationKey: "gaja-kesari",
  grade: (ctx) => {
    const jupiterAfflicted = ctx.combustion.Jupiter.isCombust || !!ctx.dignity.Jupiter?.isDebilitated;
    const moonAfflicted = ctx.combustion.Moon.isCombust || !!ctx.dignity.Moon?.isDebilitated;
    return jupiterAfflicted || moonAfflicted ? "weak" : "strong";
  },
};

// =======================================================================
// 3. Budha-Aditya Yoga
// =======================================================================
//
// Classical rule (confirmed across 2 independent sources):
//   - https://astromedha.in/insights/vedic/budha-aditya-yoga
//   - https://jagannathhora.com/budhaditya-yoga-effects/
// Core: "Sun and Mercury occupy the same zodiac sign in the natal
// chart" (a whole-sign conjunction — consistent with this codebase's
// existing Parashari conjunction convention, see `isConjunct`).
//
// DISAGREEMENT FOUND (documented, resolved via strength grading, same
// approach as Gaja Kesari above): sources are split on whether
// combustion of Mercury disqualifies the yoga outright, or merely
// weakens it. Since Mercury's maximum elongation from the Sun (~28°)
// means it is VERY commonly within the classical combustion orb
// (14°/12°) whenever conjunct the Sun, gating `present` on non-combust
// would make this yoga rare-to-vanishing in most real charts — which
// is not how the yoga is generally presented (it is one of the more
// commonly-cited yogas). This module therefore keeps the base
// conjunction as the `present` test, and reports combustion via
// strength instead: "strong" when Mercury is not combust, "weak" when
// it is — so the disputed exception is surfaced, not silently ignored
// in either direction.
//
// SKIPPED: "no other planet's aspect on the conjunction" (mentioned by
// some sources as a purity condition) is not implemented — out of the
// exact-condition-set this module targets.
const BUDHA_ADITYA_RULE: YogaRule = {
  id: "budha-aditya",
  name: "Budha-Aditya Yoga",
  category: "other",
  conditions: [
    (ctx) => isConjunct(ctx.chart.planets.Sun, ctx.chart.planets.Mercury),
  ],
  interpretationKey: "budha-aditya",
  grade: (ctx) => (ctx.combustion.Mercury.isCombust ? "weak" : "strong"),
};

// =======================================================================
// 4. Neecha Bhanga Raja Yoga
// =======================================================================
//
// Classical cancellation conditions (confirmed across 2 independent
// sources):
//   - https://parasara.net/yogas/neecha-bhanga-raja-yoga
//   - https://jagannathhora.com/neecha-bhanga-raj-yoga-guide/
// Both list several cancellation routes; this module implements the
// 2 MOST commonly-cited (per the task instruction to implement a
// short, well-attested subset rather than an exhaustive list):
//   (a) The lord of the sign the debilitated planet occupies (its
//       dispositor) is itself placed in a Kendra (1st/4th/7th/10th)
//       from the Ascendant.
//   (b) The debilitated planet's dispositor is itself exalted
//       (wherever placed).
// Both are explicitly named across both sources ("Dispositor in
// Kendra" / "Exaltation Lord in Kendra" / "the planet that would be
// exalted in that sign in a kendra" cluster around the same
// dispositor-centric logic). Condition (a) here checks the
// dispositor's OWN placement (Kendra from Lagna), which is the
// simplest, most literally-worded version of "dispositor in kendra".
//
// SKIPPED (documented): (1) "dispositor in kendra FROM THE MOON" as an
// alternate reference point — only Kendra-from-Ascendant is
// implemented, for consistency with this module's Panch Mahapurusha
// treatment of Kendra; (2) "the debilitated planet aspected by its own
// dispositor" and (3) "sign exchange (Parivartana) between the
// debilitated planet and its dispositor" — both real, sourced
// cancellation routes, but skipped for scope per the task's "2-3 most
// commonly-cited" instruction; (4) the further "must be a Kendra/
// Trikona LORD for TRUE Raja Yoga (not just dusthana lordship)"
// refinement some sources add on top of cancellation — not
// implemented; this rule detects debilitation-cancellation only, not
// the further Raja-Yoga-grade qualification layered on top by some
// sources. (5) dasha-timing considerations ("even a perfectly
// cancelled debilitation produces nothing if the dasha runs in
// infancy") are explicitly non-classical-positional and out of scope
// for a static chart-structure detector.
//
// This yoga is evaluated PER DEBILITATED CLASSICAL PLANET — `present`
// is true if ANY classical planet's debilitation is cancelled by
// either route. No graded strength is defined by the sources checked
// beyond "cancelled or not" (binary), so `strength` is omitted.
const NEECHA_BHANGA_RULE: YogaRule = {
  id: "neecha-bhanga-raja-yoga",
  name: "Neecha Bhanga Raja Yoga",
  category: "raja",
  conditions: [
    (ctx) =>
      CLASSICAL_PLANETS.some((planet) => {
        const d = ctx.dignity[planet];
        if (!d || !d.isDebilitated) return false;
        const dispositor = SIGN_LORD[ctx.chart.planets[planet].sign];
        const dispositorEntry = ctx.chart.planets[dispositor];
        const dispositorDignity = ctx.dignity[dispositor];
        const dispositorInKendra = isKendraFromAscendant(dispositorEntry); // (a)
        const dispositorExalted = !!dispositorDignity?.isExalted; // (b)
        return dispositorInKendra || dispositorExalted;
      }),
  ],
  interpretationKey: "neecha-bhanga-raja-yoga",
};

// =======================================================================
// 5. Viparita Raja Yoga (Harsha / Sarala / Vimala)
// =======================================================================
//
// Classical rule (confirmed across 2 independent sources):
//   - https://blog.pocketpandit.com/viparita-raja-yogas/
//   - https://vedicmarga.com/vipareet-rajayoga/
// "There are three Viparita Raja Yogas – Harsha, Sarala, and Vimala."
//   - Harsha: lord of the 6th house placed in the 6th, 8th or 12th.
//   - Sarala: lord of the 8th house placed in the 6th, 8th or 12th.
//   - Vimala: lord of the 12th house placed in the 6th, 8th or 12th.
// (All houses counted from the Ascendant.)
//
// DISAGREEMENT FOUND: some sources phrase the rule as the dusthana
// lord moving to "ANOTHER" dusthana (implying it must differ from the
// house it rules), while the Harsha-yoga wording quoted above
// explicitly allows the 6th lord to sit IN the 6th itself ("6th, 8th
// AND in the 12th house"). This module follows the INCLUSIVE reading
// (lord may remain in the very house it rules) because that is the
// literal wording of the sourced definitions above and matches the
// classical logic cited elsewhere ("a lord of misfortune trapped in
// its own house of misfortune neutralizes itself") — documented here
// so the choice is explicit and traceable; a stricter "must be a
// DIFFERENT dusthana" variant is not implemented.
//
// Strength/ranking: "Classical commentators generally rank Sarala
// Yoga ... as the most powerful, Harsha Yoga ... as the most active,
// and Vimala Yoga ... as the most subtle" — but this is a
// RANKING BETWEEN THE THREE SUB-YOGAS, not a graded strength within
// any one of them (no source gives, e.g., "strong Harsha" vs "weak
// Harsha"), so `strength` is intentionally omitted (binary yogas).
const VIPARITA_SUBTYPES: { id: string; name: string; dusthanaLordOf: number }[] = [
  { id: "harsha", name: "Harsha Yoga (Viparita Raja Yoga)", dusthanaLordOf: 6 },
  { id: "sarala", name: "Sarala Yoga (Viparita Raja Yoga)", dusthanaLordOf: 8 },
  { id: "vimala", name: "Vimala Yoga (Viparita Raja Yoga)", dusthanaLordOf: 12 },
];

const VIPARITA_RULES: YogaRule[] = VIPARITA_SUBTYPES.map(({ id, name, dusthanaLordOf }) => ({
  id: `viparita-${id}`,
  name,
  category: "raja",
  conditions: [
    (ctx) => {
      const lord = lordOfHouseFromAscendant(ctx.chart, dusthanaLordOf);
      const lordHouse = ctx.chart.planets[lord].house;
      return DUSTHANA_HOUSES.has(lordHouse);
    },
  ],
  interpretationKey: `viparita-raja-yoga.${id}`,
}));

// =======================================================================
// 6. Basic Dhana Yoga
// =======================================================================
//
// Core pattern (well-attested, standard Parashari wealth-yoga logic,
// consistent across mainstream secondary sources on Dhana Yoga): the
// 2nd house lord (wealth/accumulated resources) and the 11th house
// lord (gains) are CONNECTED — conjunct, in mutual aspect, or in a
// sign-exchange (Parivartana) — from the Ascendant. This is the single
// most commonly-cited core Dhana Yoga pattern (2nd/11th lords linked);
// this module implements ONLY this one well-attested pattern, per the
// task's "1-2 core patterns, not every named variant" instruction.
//
// SKIPPED (documented): the many named Dhana Yoga sub-variants
// involving the 5th/9th (Lakshmi Yoga combinations), kendra/trikona
// lord wealth combinations, or the 1st lord joining 2nd/11th lords are
// all real, separately-named classical patterns but are NOT
// implemented here — only the 2nd-lord/11th-lord connection.
const DHANA_YOGA_RULE: YogaRule = {
  id: "dhana-yoga-2-11",
  name: "Dhana Yoga (2nd/11th Lord Connection)",
  category: "dhana",
  conditions: [
    (ctx) => {
      const lord2 = lordOfHouseFromAscendant(ctx.chart, 2);
      const lord11 = lordOfHouseFromAscendant(ctx.chart, 11);
      if (lord2 === lord11) return false; // same planet ruling both: not a "connection" between two lords
      return isConnected(ctx, lord2, lord11);
    },
  ],
  interpretationKey: "dhana-yoga.2-11-lords",
};

// =======================================================================
// 7. Basic Raja Yoga
// =======================================================================
//
// Core Kendra-Trikona rule (the foundational, universally-cited
// Parashari Raja Yoga pattern): a Kendra lord (ruler of the 1st, 4th,
// 7th or 10th from the Ascendant) is CONNECTED — conjunct, in mutual
// aspect, or sign-exchanged — with a Trikona lord (ruler of the 1st,
// 5th or 9th). The 1st house is both a Kendra and a Trikona, so its
// lord can pair with itself trivially; that self-pairing is explicitly
// excluded below (a lord "connected with itself" is not a meaningful
// Raja Yoga instance) and instead only genuinely distinct Kendra/
// Trikona lord PAIRS are tested.
//
// SKIPPED (documented): the many refinements real sources add on top
// of this base rule (which lord must not be a natural malefic solely
// by dusthana co-lordship, exceptions for Mars/Saturn as
// simultaneous Kendra+Trikona lords for certain ascendants, relative
// strength/exaltation requirements on the connecting planets, etc.)
// are NOT implemented — this is the base structural test only, per
// the task's "core Kendra-Trikona rule" instruction.
const RAJA_YOGA_RULE: YogaRule = {
  id: "raja-yoga-kendra-trikona",
  name: "Raja Yoga (Kendra-Trikona Lord Connection)",
  category: "raja",
  conditions: [
    (ctx) => {
      const kendraLords = new Set(Array.from(KENDRA_HOUSES).map((h) => lordOfHouseFromAscendant(ctx.chart, h)));
      const trikonaLords = new Set(Array.from(TRIKONA_HOUSES).map((h) => lordOfHouseFromAscendant(ctx.chart, h)));
      for (const kendraLord of kendraLords) {
        for (const trikonaLord of trikonaLords) {
          if (kendraLord === trikonaLord) continue; // same planet ruling both: not a pair
          if (isConnected(ctx, kendraLord, trikonaLord)) return true;
        }
      }
      return false;
    },
  ],
  interpretationKey: "raja-yoga.kendra-trikona",
};

// ---------------------------------------------------------------------
// Registry + detection entry point
// ---------------------------------------------------------------------

const YOGA_REGISTRY: YogaRule[] = [
  ...MAHAPURUSHA_RULES,
  GAJA_KESARI_RULE,
  BUDHA_ADITYA_RULE,
  NEECHA_BHANGA_RULE,
  ...VIPARITA_RULES,
  DHANA_YOGA_RULE,
  RAJA_YOGA_RULE,
];

/**
 * Run every rule in the registry against `chart` and return one
 * `YogaResult` per rule (never throws for a well-formed `ChartData`;
 * every rule's conditions are total functions over the 7 classical
 * planets + Ascendant, all of which are always present in a chart
 * produced by `calculateChart`).
 */
export function detectYogas(chart: ChartData): YogaResult[] {
  const ctx = buildContext(chart);

  return YOGA_REGISTRY.map((rule) => {
    const present = rule.conditions.every((condition) => condition(ctx));
    const result: YogaResult = { ruleId: rule.id, name: rule.name, present };
    if (present && rule.grade) {
      result.strength = rule.grade(ctx);
    }
    return result;
  });
}

export { YOGA_REGISTRY };
