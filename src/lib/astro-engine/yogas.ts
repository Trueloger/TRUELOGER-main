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
// Extended in a later session, same registry pattern, appended in this
// order:
//   8.  Chandra-Mangal Yoga
//   9.  Kemadruma Yoga (+ 2 well-attested cancellations)
//   10. Amala Yoga
//   11. Vasumati Yoga
//   12. Parivartana Yoga (base + Maha/Kahala/Dainya classification)
//   13. Shubha-Kartari / Papa-Kartari Yoga
//   14. Adhi Yoga
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

/** Waxing (Sukla Paksha, New->Full Moon) vs waning test — same
 * elongation convention `bhavabala.ts`/`shadbala.ts` already use for
 * their own `isMoonWaxing`/`isBeneficAspector` helpers (duplicated here
 * rather than imported since those are private module internals; see
 * this module's existing precedent of duplicating small static tables,
 * e.g. `OWN_SIGNS` above). Used below only by the natural benefic/
 * malefic classification the new (session-2) rules need. */
function isMoonWaxing(chart: ChartData): boolean {
  const elongation = ((chart.planets.Moon.longitude - chart.planets.Sun.longitude) % 360 + 360) % 360;
  return elongation < 180;
}

/** Natural (Naisargika) benefic classification used by the Amala/
 * Vasumati/Kartari/Adhi rules below: Jupiter, Venus and Mercury are
 * always natural benefics; the Moon is benefic only while waxing. This
 * is the same convention `shadbala.ts`/`bhavabala.ts` already use for
 * their own Drik Bala aspect-sign tests (`isBeneficAspector`), applied
 * here to PLACEMENT rather than aspect. Mercury's classical "benefic
 * unless conjunct a malefic" refinement is intentionally NOT checked
 * (documented as skipped per-rule below) — Mercury is treated as
 * unconditionally benefic here, matching this module's existing
 * Budha-Aditya treatment of Mercury. */
function isNaturalBenefic(ctx: YogaContext, planet: ClassicalPlanetName): boolean {
  if (planet === "Jupiter" || planet === "Venus" || planet === "Mercury") return true;
  if (planet === "Moon") return isMoonWaxing(ctx.chart);
  return false;
}

/** Natural malefic classification (mirror of `isNaturalBenefic` above,
 * used only by the Papa-Kartari half of rule 13): Sun, Mars, Saturn,
 * Rahu and Ketu are always natural malefics; the Moon is malefic only
 * while waning (mirroring `isNaturalBenefic`'s waxing test). */
function isNaturalMalefic(ctx: YogaContext, planet: ChartPlanetName): boolean {
  if (planet === "Moon") return !isMoonWaxing(ctx.chart);
  return planet === "Sun" || planet === "Mars" || planet === "Saturn" || planet === "Rahu" || planet === "Ketu";
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

// =======================================================================
// 8. Chandra-Mangal Yoga
// =======================================================================
//
// Classical rule (confirmed across 2 independent sources):
//   - https://astroparasar.com/moon-and-mars-conjunction/
//   - https://www.indastro.com/planet-conjuction/moon-mars-conjunction.html
// (cross-checked against https://www.ganeshaspeaks.com/learn-astrology/chandra-mangal-yoga/)
// "Chandra Mangal Yoga (also Shashi Mangal Yoga) forms when the Moon
// and Mars occupy the same sign (conjunction)" — a wealth/ambition
// combination. All sources checked describe the conjunction case only;
// none of the sources found describe a "mutual aspect" variant for
// THIS specific yoga (unlike Gaja Kesari, which is explicitly
// kendra/aspect-based by definition) — so no disagreement was found
// requiring resolution, and no aspect-based alternative is implemented:
// same-sign conjunction (`isConjunct`, this module's one existing
// conjunction convention) is the sole, well-attested condition.
//
// SKIPPED (documented): sources mention the yoga's wealth effects are
// stronger when Mars and Moon are each dignified/unafflicted — no
// source gives a precise graded-strength scale (only qualitative
// "stronger/weaker"), so `strength` is intentionally omitted (binary
// yoga, same treatment as Budha-Aditya's base test before its
// specifically-sourced combustion grading).
const CHANDRA_MANGAL_RULE: YogaRule = {
  id: "chandra-mangal",
  name: "Chandra-Mangal Yoga",
  category: "dhana",
  conditions: [
    (ctx) => isConjunct(ctx.chart.planets.Moon, ctx.chart.planets.Mars),
  ],
  interpretationKey: "chandra-mangal",
};

// =======================================================================
// 9. Kemadruma Yoga
// =======================================================================
//
// Classical formation (confirmed across 2 independent sources):
//   - https://jagannathhora.com/kemadruma-yoga-moon-isolation-complete-guide/
//   - https://vedicmarga.com/kemadruma-yoga/
// (cross-checked against https://www.astromangal.in/learn/kemadruma-yoga)
// Base condition: no classical planet (Rahu/Ketu explicitly excluded by
// both sources — "Rahu and Ketu do not count") occupies the 2nd or the
// 12th sign from the Moon, AND the Moon has no planet conjunct it and
// receives no Parashari aspect from any other planet ("a conjoined
// Moon is not structurally isolated regardless of what occupies the
// adjacent houses" — jagannathhora). All 3 sub-conditions (2nd empty,
// 12th empty, Moon itself unconjoined/unaspected) are required for the
// base (uncancelled) dosha; this module implements all 3, exactly as
// sourced.
//
// Cancellation (Bhanga) — both sources list several routes; per the
// task's "1-2 well-attested cancellation checks" instruction, this
// module implements the 2 MOST consistently-cited across both:
//   (a) The Moon itself is in a Kendra (1st/4th/7th/10th) from the
//       Ascendant ("classical sources generally hold that Kemadruma is
//       cancelled or substantially weakened" — jagannathhora; listed
//       first among vedicmarga's cancellations too).
//   (b) Any classical planet occupies a Kendra from the MOON itself
//       (4th, 7th or 10th from Moon specifically — the 1st-from-Moon
//       case is conjunction, already excluded by the base condition
//       above, so only 4/7/10 are tested here to avoid double-counting
//       the same fact two different ways).
//
// SKIPPED (documented, not silently dropped): (1) "Moon aspected by a
// benefic" / "Jupiter aspecting the Moon" as a distinct cancellation
// route — already subsumed here by the base condition itself (ANY
// aspect on the Moon, benefic or not, already disqualifies the base
// dosha per (a) above in the base-condition list, not as a separate
// bhanga), so is not implemented as an additional bhanga check; (2)
// Moon's own dignity (own-sign/exalted) as a mitigating factor; (3)
// waxing-phase / overall Shadbala strength as a mitigating factor —
// (2) and (3) are graded/qualitative mitigations, not the classical
// binary cancellations named by both sources, and are out of scope for
// this binary `present` test.
//
// `present` here means "the Kemadruma affliction genuinely obtains"
// (formed AND not cancelled) — the same "present = the named classical
// condition truly holds" semantics this module already uses for
// Neecha Bhanga (which reports the CANCELLATION of an affliction, the
// mirror case). No source gives a graded strength scale for Kemadruma
// itself, so `strength` is omitted (binary).
const KEMADRUMA_RULE: YogaRule = {
  id: "kemadruma",
  name: "Kemadruma Yoga",
  category: "other",
  conditions: [
    (ctx) => {
      const moon = ctx.chart.planets.Moon;
      const secondSign = signOffset(moon.sign, 1);
      const twelfthSign = signOffset(moon.sign, 11);
      const otherPlanets = CLASSICAL_PLANETS.filter((p) => p !== "Moon");

      const secondEmpty = !otherPlanets.some((p) => ctx.chart.planets[p].sign === secondSign);
      const twelfthEmpty = !otherPlanets.some((p) => ctx.chart.planets[p].sign === twelfthSign);
      const moonUnconjoined = !otherPlanets.some((p) => ctx.chart.planets[p].sign === moon.sign);
      const moonUnaspected = !otherPlanets.some((p) => aspectsSign(ctx, p, moon.sign));
      const formed = secondEmpty && twelfthEmpty && moonUnconjoined && moonUnaspected;
      if (!formed) return false;

      const cancelledByMoonKendra = isKendraFromAscendant(moon); // (a)
      const cancelledByKendraFromMoon = otherPlanets.some((p) => {
        const house = signHouseNumber(moon.sign, ctx.chart.planets[p].sign);
        return house === 4 || house === 7 || house === 10; // (b), excluding the 1st (conjunction, already ruled out above)
      });
      return !(cancelledByMoonKendra || cancelledByKendraFromMoon);
    },
  ],
  interpretationKey: "kemadruma",
};

// =======================================================================
// 10. Amala Yoga
// =======================================================================
//
// Classical rule (confirmed across 2 independent sources):
//   - https://www.sanatanveda.com/astrology/amala-yoga-in-vedic-astrology/
//   - https://www.mpanchang.com/articles/astrology/amala-yoga/
// "Amala Yoga is formed when a natural benefic planet (Jupiter, Venus,
// Mercury, or an unafflicted Moon) is positioned in the 10th house from
// EITHER the Lagna (Ascendant) OR the Moon." Both reference points are
// explicitly named by both sources (not a single-reference-point
// disagreement) — this module implements BOTH, `present` if either
// holds for any of the 4 natural benefics (Moon tested only against
// the Ascendant reference, since "10th from itself" is not meaningful).
//
// SKIPPED (documented): the "should be strong/unafflicted/own-sign/
// exalted for full potency" refinement is a qualitative strength note,
// not a precisely graded scale — no source gives discrete grade
// thresholds the way Vasumati/Adhi below do, so `strength` is
// intentionally omitted (binary yoga).
const AMALA_BENEFIC_CANDIDATES: ClassicalPlanetName[] = ["Jupiter", "Venus", "Mercury", "Moon"];

const AMALA_YOGA_RULE: YogaRule = {
  id: "amala-yoga",
  name: "Amala Yoga",
  category: "other",
  conditions: [
    (ctx) =>
      AMALA_BENEFIC_CANDIDATES.some((planet) => {
        if (!isNaturalBenefic(ctx, planet)) return false;
        const entry = ctx.chart.planets[planet];
        const fromLagna = entry.house === 10;
        const fromMoon = planet !== "Moon" && signHouseNumber(ctx.chart.planets.Moon.sign, entry.sign) === 10;
        return fromLagna || fromMoon;
      }),
  ],
  interpretationKey: "amala-yoga",
};

// =======================================================================
// 11. Vasumati Yoga
// =======================================================================
//
// Classical rule (confirmed across 2 independent sources):
//   - https://vedicmystics.com/2019/10/18/vasumati-wealth-yoga/
//   - https://www.mpanchang.com/articles/astrology/vasumathi-yoga/
// "Vasumati Yoga is formed when [natural] benefics — Jupiter, Venus and
// Mercury — occupy the Upachaya houses (3rd, 6th, 10th, 11th) from the
// Ascendant OR the Moon" (both reference points explicitly named, both
// implemented, same "either" convention as Amala above; the Moon is
// NOT itself counted as one of the 3 benefics here — both sources name
// only Jupiter/Venus/Mercury for this specific yoga, unlike Amala,
// which explicitly also names the Moon).
//
// Strength grading (sourced, vedicmystics): "If the entire lot of the
// natural benefic planets is located in the upachaya houses ... the
// man is extremely rich. If two ... highly rich. If only one ... he is
// only moderately rich." This maps directly onto this module's
// strong/moderate/weak scale: 3 qualifying benefics -> strong, 2 ->
// moderate, 1 -> weak.
const VASUMATI_BENEFICS: ClassicalPlanetName[] = ["Jupiter", "Venus", "Mercury"];
const UPACHAYA_HOUSES = new Set([3, 6, 10, 11]);

function isInUpachaya(ctx: YogaContext, planet: ClassicalPlanetName): boolean {
  const entry = ctx.chart.planets[planet];
  const fromLagna = UPACHAYA_HOUSES.has(entry.house);
  const fromMoon = UPACHAYA_HOUSES.has(signHouseNumber(ctx.chart.planets.Moon.sign, entry.sign));
  return fromLagna || fromMoon;
}

const VASUMATI_YOGA_RULE: YogaRule = {
  id: "vasumati-yoga",
  name: "Vasumati Yoga",
  category: "dhana",
  conditions: [(ctx) => VASUMATI_BENEFICS.some((p) => isInUpachaya(ctx, p))],
  interpretationKey: "vasumati-yoga",
  grade: (ctx) => {
    const count = VASUMATI_BENEFICS.filter((p) => isInUpachaya(ctx, p)).length;
    return count >= 3 ? "strong" : count === 2 ? "moderate" : "weak";
  },
};

// =======================================================================
// 12. Parivartana Yoga (base + Maha / Kahala / Dainya classification)
// =======================================================================
//
// Base classical rule (confirmed across 2 independent sources):
//   - https://ishvaram.com/yoga/parivartana/
//   - https://www.astrosharmistha.com/parivartan-yoga-mutual-exchange/
// "Parivartana Yoga occurs when two planets exchange signs — each
// occupies the sign ruled by the other." This module tests every
// distinct pair of the 12 houses (from the Ascendant): if house h1's
// lord and house h2's lord are two different planets, and each sits in
// a sign OWNED BY THE OTHER, that (h1, h2) pair is a genuine exchange
// instance. (This is a generalization of the sign-exchange half of the
// existing private `isConnected` helper used by Dhana/Raja Yoga above,
// re-implemented as its own named function below rather than reusing
// `isConnected` directly, since `isConnected` ALSO accepts a mutual-
// aspect or conjunction as "connected" — Parivartana is sign-exchange
// ONLY, a strictly narrower and distinct classical category. Per the
// task instruction not to restructure existing rules, `isConnected`
// itself is left untouched.)
//
// Sub-classification (confirmed across 2 independent sources):
//   - http://astrohominis.blogspot.com/2016/03/parivartana-yoga-dhainya-kahala-maha-parivartana-yoga.html
//   - https://astrosight.ai/yogas/parivartana-yoga
// "Maha Parivartana Yoga: both exchanged lords belong to the
// Kendra/Kona/Dhana/Labha houses (1, 2, 4, 5, 7, 9, 10 or 11)."
// "Kahala Parivartana Yoga: exchange between the 3rd lord and a lord
// of 1, 2, 4, 5, 7, 9, 10 or 11." "Dainya Parivartana Yoga: one of the
// exchanged lords rules a Dusthana (6, 8, 12), the other a non-
// Dusthana house (1, 2, 3, 4, 5, 7, 9, 10 or 11)." These three named
// house-sets are a complete, non-overlapping partition of all 12
// houses ({1,2,4,5,7,9,10,11} + {3} + {6,8,12} = 12 houses, no
// overlaps) per both sources, so a genuine exchange pair falls into
// AT MOST one of the three named categories — implemented as 3
// mutually-exclusive checks below, plus the base "any exchange exists"
// rule (which also fires for a same-Dusthana-pair exchange, e.g. a
// 6th-lord/8th-lord exchange, that no source names — that residual
// case is intentionally left unclassified, documented here rather than
// silently misfiled into one of the three named sub-types).
//
// No source gives a graded strength scale for any of these 4 rules
// (only a qualitative auspicious/energetic/inauspicious character per
// sub-type), so `strength` is omitted from all 4 (binary yogas).
const PARIVARTANA_MAHA_HOUSES = new Set([1, 2, 4, 5, 7, 9, 10, 11]);
const PARIVARTANA_KAHALA_HOUSE = 3;

function isSignExchange(chart: ChartData, planetA: ClassicalPlanetName, planetB: ClassicalPlanetName): boolean {
  const a = chart.planets[planetA];
  const b = chart.planets[planetB];
  return OWN_SIGNS[planetA].includes(b.sign) && OWN_SIGNS[planetB].includes(a.sign);
}

/** Every distinct pair of houses (1-12, from the Ascendant) whose
 * lords are two different planets in a genuine mutual sign exchange. */
function findParivartanaHousePairs(chart: ChartData): [number, number][] {
  const pairs: [number, number][] = [];
  for (let h1 = 1; h1 <= 12; h1++) {
    for (let h2 = h1 + 1; h2 <= 12; h2++) {
      const lord1 = lordOfHouseFromAscendant(chart, h1);
      const lord2 = lordOfHouseFromAscendant(chart, h2);
      if (lord1 === lord2) continue;
      if (isSignExchange(chart, lord1, lord2)) pairs.push([h1, h2]);
    }
  }
  return pairs;
}

const PARIVARTANA_YOGA_RULE: YogaRule = {
  id: "parivartana-yoga",
  name: "Parivartana Yoga (Sign Exchange)",
  category: "other",
  conditions: [(ctx) => findParivartanaHousePairs(ctx.chart).length > 0],
  interpretationKey: "parivartana-yoga",
};

const PARIVARTANA_MAHA_RULE: YogaRule = {
  id: "parivartana-maha",
  name: "Maha Parivartana Yoga",
  category: "raja",
  conditions: [
    (ctx) => findParivartanaHousePairs(ctx.chart).some(([h1, h2]) => PARIVARTANA_MAHA_HOUSES.has(h1) && PARIVARTANA_MAHA_HOUSES.has(h2)),
  ],
  interpretationKey: "parivartana-yoga.maha",
};

const PARIVARTANA_KAHALA_RULE: YogaRule = {
  id: "parivartana-kahala",
  name: "Kahala Parivartana Yoga",
  category: "other",
  conditions: [
    (ctx) =>
      findParivartanaHousePairs(ctx.chart).some(
        ([h1, h2]) =>
          (h1 === PARIVARTANA_KAHALA_HOUSE && PARIVARTANA_MAHA_HOUSES.has(h2)) ||
          (h2 === PARIVARTANA_KAHALA_HOUSE && PARIVARTANA_MAHA_HOUSES.has(h1)),
      ),
  ],
  interpretationKey: "parivartana-yoga.kahala",
};

const PARIVARTANA_DAINYA_RULE: YogaRule = {
  id: "parivartana-dainya",
  name: "Dainya Parivartana Yoga",
  category: "other",
  conditions: [
    (ctx) =>
      findParivartanaHousePairs(ctx.chart).some(
        ([h1, h2]) => DUSTHANA_HOUSES.has(h1) !== DUSTHANA_HOUSES.has(h2),
      ),
  ],
  interpretationKey: "parivartana-yoga.dainya",
};

// =======================================================================
// 13. Shubha-Kartari Yoga / Papa-Kartari Yoga
// =======================================================================
//
// Classical rule (confirmed across 2 independent sources):
//   - https://www.sanatanveda.com/astrology/kartari-yoga-in-vedic-astrology/
//   - https://www.kalmanas.com/yoga/papa-kartari
// "Kartari" (scissors): a reference point hemmed in on both sides — by
// the sign 2 houses away and the sign 12 houses away from it (i.e. the
// immediately adjacent houses on either side) — by planets of one
// nature only. Shubha (benefic) Kartari: "natural benefics — Jupiter,
// Venus, and an unafflicted Mercury — occupy the 2nd AND 12th house
// from a particular house/point." Papa (malefic) Kartari: the mirror
// case with natural malefics.
//
// SCOPE CHOICE (documented, sources vary on the reference point):
// sources describe the principle generally ("from a certain house") and
// separately as applying to the Moon (a distinct, commonly-cited
// special case: Moon hemmed by malefics = Papa Kartari for the Moon)
// or to any planet/house. Per the task instruction to "pick the most
// commonly-cited [scope] and document", this module implements the
// single MOST universally-cited textbook example across both sources
// checked: the yoga applied to the ASCENDANT (Lagna) itself — the
// classic "Lagna hemmed in by benefics/malefics" case both sources lead
// with. The Moon-specific and fully-general any-house/any-planet
// variants are NOT implemented here (documented as skipped scope, not
// silently dropped).
//
// Natural benefic/malefic classification: same convention as Amala/
// Vasumati above (Jupiter/Venus/Mercury always benefic, Moon benefic
// only while waxing) plus, for the malefic side, Sun/Mars/Saturn/Rahu/
// Ketu always malefic, Moon malefic only while waning (`isNaturalMalefic`
// above). Mercury's classical "unless afflicted" qualifier is NOT
// checked (documented as skipped, same as Amala Yoga above).
//
// No source gives a graded strength scale for either rule, so
// `strength` is omitted from both (binary yogas).
const KARTARI_CANDIDATES: ChartPlanetName[] = [...CLASSICAL_PLANETS, "Rahu", "Ketu"];

function occupantsOfSign(chart: ChartData, sign: number): ChartPlanetName[] {
  return KARTARI_CANDIDATES.filter((p) => chart.planets[p].sign === sign);
}

const SHUBHA_KARTARI_RULE: YogaRule = {
  id: "shubha-kartari",
  name: "Shubha-Kartari Yoga",
  category: "other",
  conditions: [
    (ctx) => {
      const secondSign = signOffset(ctx.chart.ascendant.sign, 1);
      const twelfthSign = signOffset(ctx.chart.ascendant.sign, 11);
      const second = occupantsOfSign(ctx.chart, secondSign);
      const twelfth = occupantsOfSign(ctx.chart, twelfthSign);
      if (second.length === 0 || twelfth.length === 0) return false;
      const isBenefic = (p: ChartPlanetName) =>
        (CLASSICAL_PLANETS as readonly ChartPlanetName[]).includes(p) && isNaturalBenefic(ctx, p as ClassicalPlanetName);
      return second.every(isBenefic) && twelfth.every(isBenefic);
    },
  ],
  interpretationKey: "shubha-kartari",
};

const PAPA_KARTARI_RULE: YogaRule = {
  id: "papa-kartari",
  name: "Papa-Kartari Yoga",
  category: "other",
  conditions: [
    (ctx) => {
      const secondSign = signOffset(ctx.chart.ascendant.sign, 1);
      const twelfthSign = signOffset(ctx.chart.ascendant.sign, 11);
      const second = occupantsOfSign(ctx.chart, secondSign);
      const twelfth = occupantsOfSign(ctx.chart, twelfthSign);
      if (second.length === 0 || twelfth.length === 0) return false;
      return second.every((p) => isNaturalMalefic(ctx, p)) && twelfth.every((p) => isNaturalMalefic(ctx, p));
    },
  ],
  interpretationKey: "papa-kartari",
};

// =======================================================================
// 14. Adhi Yoga
// =======================================================================
//
// Classical rule (confirmed across 2 independent sources, both citing
// the same BPHS verse):
//   - https://blog.indianastrologysoftware.com/adhi-yoga-part1/ (cites BPHS ch.38, sloka 5)
//   - https://astromedha.in/insights/vedic/adhi-yoga
// "When benefics [Jupiter, Venus, Mercury] occupy the 6th, 7th and 8th
// [houses] from the Moon, Adhi Yoga results" — the Moon, NOT the
// Ascendant, is the reference point (distinct from Amala/Vasumati
// above, which test the Ascendant as well as the Moon; Adhi is
// Moon-only per both sources, no Ascendant variant found).
//
// Strength grading (sourced, indianastrologysoftware quoting the same
// BPHS verse): "If there is one planet ... in any one of these signs,
// that person becomes a leader. If there are two, he will be a
// minister and if there are three, he will occupy an eminent station
// in life." This maps directly onto this module's strong/moderate/weak
// scale, the same count-based mapping Vasumati above uses: 3
// qualifying benefics -> strong, 2 -> moderate, 1 -> weak.
//
// SKIPPED (documented): the further "strength of the individual
// benefics themselves sets a ceiling on the result" qualitative
// refinement mentioned by some sources is not implemented — this rule
// grades ONLY by count of qualifying benefics, per the explicit
// BPHS count-based scale quoted above, not by the benefics' own
// dignity/strength.
const ADHI_YOGA_RULE: YogaRule = {
  id: "adhi-yoga",
  name: "Adhi Yoga",
  category: "raja",
  conditions: [
    (ctx) =>
      VASUMATI_BENEFICS.some((planet) => {
        const house = signHouseNumber(ctx.chart.planets.Moon.sign, ctx.chart.planets[planet].sign);
        return house === 6 || house === 7 || house === 8;
      }),
  ],
  interpretationKey: "adhi-yoga",
  grade: (ctx) => {
    const count = VASUMATI_BENEFICS.filter((planet) => {
      const house = signHouseNumber(ctx.chart.planets.Moon.sign, ctx.chart.planets[planet].sign);
      return house === 6 || house === 7 || house === 8;
    }).length;
    return count >= 3 ? "strong" : count === 2 ? "moderate" : "weak";
  },
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
  CHANDRA_MANGAL_RULE,
  KEMADRUMA_RULE,
  AMALA_YOGA_RULE,
  VASUMATI_YOGA_RULE,
  PARIVARTANA_YOGA_RULE,
  PARIVARTANA_MAHA_RULE,
  PARIVARTANA_KAHALA_RULE,
  PARIVARTANA_DAINYA_RULE,
  SHUBHA_KARTARI_RULE,
  PAPA_KARTARI_RULE,
  ADHI_YOGA_RULE,
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
