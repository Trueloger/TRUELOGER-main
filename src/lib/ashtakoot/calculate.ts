// src/lib/ashtakoot/calculate.ts
// Pure, local, no-network implementation of the classical Ashtakoot /
// Guna Milan Vedic marriage-compatibility calculation (8 kootas, 36
// points total) — the replacement for FreeAstrologyAPI's
// POST /match-making/ashtakoot-score. Every table/rule below was
// researched via WebSearch/WebFetch against multiple independent
// sources (Sep 2026) and cross-checked for internal consistency (e.g.
// every 27-nakshatra table below was verified to partition all 27
// nakshatras with no gaps/overlaps) before being trusted — the same
// rigor src/lib/astro-engine/ephemeris.ts and src/lib/dasha/calculate.ts
// used for their own formulas. Inputs are only each person's real,
// locally-derived Moon sign (rashi 1-12) and Moon nakshatra number
// (1-27) — see src/lib/astro-engine/ephemeris.ts's calculateChart,
// `.planets.Moon.sign` / `.planets.Moon.nakshatra.number`.
//
// Where classical sources disagree on fine details not resolvable from
// a {moonSign, nakshatraNumber} input alone (e.g. the exact degree
// split of Sagittarius/Capricorn between two Vashya groups, or a few
// nakshatras' Yoni gender label), this file documents the simplification
// taken and why, rather than silently guessing.

export type AshtakootPerson = {
  /** 1-12, sidereal Moon sign (rashi). ChartData.planets.Moon.sign. */
  moonSign: number;
  /** 1-27, Moon nakshatra number. ChartData.planets.Moon.nakshatra.number. */
  nakshatraNumber: number;
};

export type KootaResult = {
  score: number;
  outOf: number;
  /** Person A's placement/label for this koota (e.g. a varna name, a
   * yoni animal, a nakshatra name) — whatever this koota compares. */
  personA: string;
  personB: string;
};

export type AshtakootResult = {
  totalScore: number;
  outOf: 36;
  varna: KootaResult;
  vashya: KootaResult;
  tara: KootaResult;
  yoni: KootaResult;
  grahaMaitri: KootaResult;
  gana: KootaResult;
  bhakoot: KootaResult;
  nadi: KootaResult;
  /** true when nadi.score === 0 — traditional Nadi Dosha. */
  nadiDosha: boolean;
  /** true when bhakoot.score === 0 — traditional Bhakoot Dosha. */
  bhakootDosha: boolean;
};

// ---------------------------------------------------------------------
// Shared nakshatra/rashi tables (index 0-26 for nakshatra number 1-27,
// index 0-11 for rashi number 1-12) — same names/order as
// src/lib/astrology/derive.ts's NAKSHATRA_NAMES/RASHI_NAMES (not
// imported since that file exports neither array, only functions/types
// derived from them; kept in exact sync with derive.ts's spelling).
// ---------------------------------------------------------------------

const NAKSHATRA_NAMES = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
] as const;

const RASHI_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

function nakshatraName(n: number): string {
  return NAKSHATRA_NAMES[n - 1];
}

function rashiName(s: number): string {
  return RASHI_NAMES[s - 1];
}

/** Whole-sign house count from `baseSign` to `targetSign` (1-12): 1 if
 * same sign, counting upward/wrapping otherwise — the same formula
 * src/lib/astrology/derive.ts's signHouseNumber implements (redefined
 * here rather than imported to keep this module dependency-free/pure;
 * identical logic). */
function rashiDistance(fromSign: number, toSign: number): number {
  return (((toSign - fromSign) % 12) + 12) % 12 + 1;
}

// ---------------------------------------------------------------------
// Varna Koota (max 1) — spiritual/working-attitude compatibility.
// Rule: each rashi maps to one of 4 varnas ranked Brahmin(4) >
// Kshatriya(3) > Vaishya(2) > Shudra(1); full point iff personB's
// (conventionally the groom/male role — this codebase's fixed
// personA=bride/female, personB=groom/male convention, see
// src/lib/astrology/match-request.ts) varna rank >= personA's.
// Sources (cross-checked, agree exactly on the 4 groups):
// - https://www.drikpanchang.com/tutorials/jyotisha/kundali-match/ashta-kuta/varna-kuta.html
// - https://www.astroved.com/articles/what-is-varna-koota-in-kundli-matching
// ---------------------------------------------------------------------

const VARNA_BY_RASHI: Record<number, { name: string; rank: number }> = {
  1: { name: "Kshatriya", rank: 3 }, // Aries
  2: { name: "Vaishya", rank: 2 }, // Taurus
  3: { name: "Shudra", rank: 1 }, // Gemini
  4: { name: "Brahmin", rank: 4 }, // Cancer
  5: { name: "Kshatriya", rank: 3 }, // Leo
  6: { name: "Vaishya", rank: 2 }, // Virgo
  7: { name: "Shudra", rank: 1 }, // Libra
  8: { name: "Brahmin", rank: 4 }, // Scorpio
  9: { name: "Kshatriya", rank: 3 }, // Sagittarius
  10: { name: "Vaishya", rank: 2 }, // Capricorn
  11: { name: "Shudra", rank: 1 }, // Aquarius
  12: { name: "Brahmin", rank: 4 }, // Pisces
};

function varnaKoota(a: AshtakootPerson, b: AshtakootPerson): KootaResult {
  const varnaA = VARNA_BY_RASHI[a.moonSign];
  const varnaB = VARNA_BY_RASHI[b.moonSign];
  const score = varnaB.rank >= varnaA.rank ? 1 : 0;
  return { score, outOf: 1, personA: varnaA.name, personB: varnaB.name };
}

// ---------------------------------------------------------------------
// Vashya Koota (max 2) — mutual attraction/influence.
// Rule: each rashi belongs to one of 5 groups (Chatushpada/quadruped,
// Manava/biped, Jalachara/aquatic, Vanachara/wild, Keeta/insect); same
// group = 2, the classical Chatushpada<->Vanachara predator/prey
// opposition = 0, every other cross-group pairing = 1. Sagittarius and
// Capricorn are classically split by degree (both sources below place
// the FIRST half of each in Manava/Chatushpada respectively) — this
// function only has the whole rashi, so each is simplified to its
// first-half group.
// Sources (agree on the 5 groups; degree-split detail from both):
// - https://www.drikpanchang.com/tutorials/jyotisha/kundali-match/ashta-kuta/vashya-kuta.html
// - https://jagannathhora.com/vashya-koot-mutual-attraction/ (also
//   states the Chatushpada-Vanachara 0-point predator/prey opposition
//   explicitly)
// ---------------------------------------------------------------------

type VashyaGroup = "Chatushpada" | "Manava" | "Jalachara" | "Vanachara" | "Keeta";

const VASHYA_BY_RASHI: Record<number, VashyaGroup> = {
  1: "Chatushpada", // Aries
  2: "Chatushpada", // Taurus
  3: "Manava", // Gemini
  4: "Jalachara", // Cancer
  5: "Vanachara", // Leo
  6: "Manava", // Virgo
  7: "Manava", // Libra
  8: "Keeta", // Scorpio
  9: "Manava", // Sagittarius (simplified — first-half classification)
  10: "Chatushpada", // Capricorn (simplified — first-half classification)
  11: "Manava", // Aquarius
  12: "Jalachara", // Pisces
};

function vashyaKoota(a: AshtakootPerson, b: AshtakootPerson): KootaResult {
  const groupA = VASHYA_BY_RASHI[a.moonSign];
  const groupB = VASHYA_BY_RASHI[b.moonSign];
  let score: number;
  if (groupA === groupB) {
    score = 2;
  } else if (
    (groupA === "Chatushpada" && groupB === "Vanachara") ||
    (groupA === "Vanachara" && groupB === "Chatushpada")
  ) {
    score = 0;
  } else {
    score = 1;
  }
  return { score, outOf: 2, personA: groupA, personB: groupB };
}

// ---------------------------------------------------------------------
// Tara Koota (max 3) — birth-star (nakshatra count) compatibility.
// Rule: count nakshatras inclusively from one person's nakshatra to the
// other's (1-27, wrapping), reduce mod 9 to get a "tara" position 1-9
// (Janma, Sampat, Vipat, Kshema, Pratyari, Sadhana, Vadha, Mitra, Parama
// Mitra); positions {1,3,5,7} (Janma, Vipat, Pratyari, Vadha) are
// inauspicious, {2,4,6,8,9} auspicious. Both directions (A->B and B->A)
// are checked and scored 1.5 each when auspicious, summing to
// 3/1.5/0.
// Sources (agree on the 9 tara names/order and the auspicious/
// inauspicious split, and on checking both directions):
// - https://jagannathhora.com/tara-koot-birth-star-compatibility/
// - https://vedicmarga.com/guna-milan-explained/
// ---------------------------------------------------------------------

const INAUSPICIOUS_TARA_POSITIONS = new Set([1, 3, 5, 7]);

function taraPosition(fromNakshatra: number, toNakshatra: number): number {
  const count = (((toNakshatra - fromNakshatra) % 27) + 27) % 27 + 1; // 1-27 inclusive count
  return ((count - 1) % 9) + 1; // 1-9
}

function taraKoota(a: AshtakootPerson, b: AshtakootPerson): KootaResult {
  const aToB = taraPosition(a.nakshatraNumber, b.nakshatraNumber);
  const bToA = taraPosition(b.nakshatraNumber, a.nakshatraNumber);
  const aToBGood = !INAUSPICIOUS_TARA_POSITIONS.has(aToB);
  const bToAGood = !INAUSPICIOUS_TARA_POSITIONS.has(bToA);
  const score = (aToBGood ? 1.5 : 0) + (bToAGood ? 1.5 : 0);
  return {
    score,
    outOf: 3,
    personA: nakshatraName(a.nakshatraNumber),
    personB: nakshatraName(b.nakshatraNumber),
  };
}

// ---------------------------------------------------------------------
// Yoni Koota (max 4) — physical/instinctual compatibility.
// Rule: each of the 27 nakshatras has a Yoni animal (14 animals total,
// each with a male/female instance — 27 is odd, so exactly one animal,
// Mongoose, has only a single instance) plus 7 classical enemy pairs
// covering all 14 animals. Same animal + same gender = 4, same animal +
// different gender = 3, an enemy pair = 0, otherwise = 2 (this module
// merges the finer "friendly"/"neutral" distinction some sources draw
// into this single non-enemy tier — that finer split is far less
// consistently documented across sources than the animal list and
// enemy pairs themselves, which are standard).
// The animal-per-nakshatra table below was cross-checked for internal
// consistency (all 27 nakshatras partition into exactly 13 same-animal
// male/female pairs + 1 unpaired Mongoose) against:
// - https://futurescopeastrology.com/nakshatra-animal-symbols/
// - https://saravali.github.io/astrology/koota_yoni.html
// - https://medium.com/@KarunaAstrology/nakshatra-animal-totems-014798ccb7d2
//   ("the Horse yoni has Ashwini as the male nakshatra and Shatabhisha
//   as the female nakshatra" — confirms the Ashwini/Shatabhisha pairing
//   used below, which the internal-consistency check independently
//   requires); the enemy pairs (Cow-Tiger, Cat-Rat, Dog-Deer,
//   Snake-Mongoose, Horse-Buffalo, Goat-Monkey, Lion-Elephant) are
//   corroborated by the same sources plus
//   https://lubomirakourteva.com/2024/10/18/yoni-kuta-the-instinctive-and-physical-attraction-in-synastry/.
// ---------------------------------------------------------------------

type YoniGender = "M" | "F";
type YoniEntry = { animal: string; gender: YoniGender };

const YONI_BY_NAKSHATRA: YoniEntry[] = [
  { animal: "Horse", gender: "M" }, // Ashwini
  { animal: "Elephant", gender: "M" }, // Bharani
  { animal: "Goat", gender: "F" }, // Krittika
  { animal: "Serpent", gender: "M" }, // Rohini
  { animal: "Serpent", gender: "F" }, // Mrigashira
  { animal: "Dog", gender: "M" }, // Ardra
  { animal: "Cat", gender: "F" }, // Punarvasu
  { animal: "Goat", gender: "M" }, // Pushya
  { animal: "Cat", gender: "M" }, // Ashlesha
  { animal: "Rat", gender: "M" }, // Magha
  { animal: "Rat", gender: "F" }, // Purva Phalguni
  { animal: "Cow", gender: "M" }, // Uttara Phalguni
  { animal: "Buffalo", gender: "F" }, // Hasta
  { animal: "Tiger", gender: "F" }, // Chitra
  { animal: "Buffalo", gender: "M" }, // Swati
  { animal: "Tiger", gender: "M" }, // Vishakha
  { animal: "Deer", gender: "F" }, // Anuradha
  { animal: "Deer", gender: "M" }, // Jyeshtha
  { animal: "Dog", gender: "F" }, // Mula
  { animal: "Monkey", gender: "M" }, // Purva Ashadha
  { animal: "Mongoose", gender: "M" }, // Uttara Ashadha (unpaired)
  { animal: "Monkey", gender: "F" }, // Shravana
  { animal: "Lion", gender: "F" }, // Dhanishta
  { animal: "Horse", gender: "F" }, // Shatabhisha
  { animal: "Lion", gender: "M" }, // Purva Bhadrapada
  { animal: "Cow", gender: "F" }, // Uttara Bhadrapada
  { animal: "Elephant", gender: "F" }, // Revati
];

const YONI_ENEMY_PAIRS: [string, string][] = [
  ["Cow", "Tiger"],
  ["Horse", "Buffalo"],
  ["Goat", "Monkey"],
  ["Serpent", "Mongoose"],
  ["Dog", "Deer"],
  ["Cat", "Rat"],
  ["Lion", "Elephant"],
];

function areYoniEnemies(animalA: string, animalB: string): boolean {
  return YONI_ENEMY_PAIRS.some(
    ([x, y]) => (x === animalA && y === animalB) || (x === animalB && y === animalA)
  );
}

function yoniKoota(a: AshtakootPerson, b: AshtakootPerson): KootaResult {
  const yoniA = YONI_BY_NAKSHATRA[a.nakshatraNumber - 1];
  const yoniB = YONI_BY_NAKSHATRA[b.nakshatraNumber - 1];

  let score: number;
  if (yoniA.animal === yoniB.animal) {
    score = yoniA.gender === yoniB.gender ? 4 : 3;
  } else if (areYoniEnemies(yoniA.animal, yoniB.animal)) {
    score = 0;
  } else {
    score = 2;
  }

  const genderLabel = (g: YoniGender) => (g === "M" ? "Male" : "Female");
  return {
    score,
    outOf: 4,
    personA: `${yoniA.animal} (${genderLabel(yoniA.gender)})`,
    personB: `${yoniB.animal} (${genderLabel(yoniB.gender)})`,
  };
}

// ---------------------------------------------------------------------
// Graha Maitri Koota (max 5) — mental/friendship compatibility between
// the lords of the two Moon signs.
// Rule: each rashi has a ruling planet (lord); the 7 classical grahas
// have a fixed, NOT always symmetric, Naisargika (natural) friendship
// table of Friend/Neutral/Enemy toward each other planet (e.g. the Moon
// considers Mercury a friend, but Mercury considers the Moon an enemy —
// this asymmetry is intentional/classical, not a bug). Same lord = 5;
// otherwise score from BOTH directions' relationship:
// both friend=5, friend+neutral=4, both neutral=3, friend+enemy=1,
// neutral+enemy=0.5, both enemy=0.
// Sources (the friendship table is the standard Brihat Parashara Hora
// Shastra "Naisargika Maitri" table, essentially universal across
// sources; the point table cross-checked against two independent
// summaries):
// - https://www.anytimeastro.com/blog/astrology/grah-maitri-koota/
// - https://vedikastrologer.com/grahamaitri-kuta-goon-milan-part-5/
// ---------------------------------------------------------------------

type Graha = "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn";

const RASHI_LORD: Record<number, Graha> = {
  1: "Mars", // Aries
  2: "Venus", // Taurus
  3: "Mercury", // Gemini
  4: "Moon", // Cancer
  5: "Sun", // Leo
  6: "Mercury", // Virgo
  7: "Venus", // Libra
  8: "Mars", // Scorpio
  9: "Jupiter", // Sagittarius
  10: "Saturn", // Capricorn
  11: "Saturn", // Aquarius
  12: "Jupiter", // Pisces
};

const GRAHA_FRIENDSHIP: Record<Graha, { friends: Graha[]; enemies: Graha[] }> = {
  Sun: { friends: ["Moon", "Mars", "Jupiter"], enemies: ["Venus", "Saturn"] },
  Moon: { friends: ["Sun", "Mercury"], enemies: [] },
  Mars: { friends: ["Sun", "Moon", "Jupiter"], enemies: ["Mercury"] },
  Mercury: { friends: ["Sun", "Venus"], enemies: ["Moon"] },
  Jupiter: { friends: ["Sun", "Moon", "Mars"], enemies: ["Mercury", "Venus"] },
  Venus: { friends: ["Mercury", "Saturn"], enemies: ["Sun", "Moon"] },
  Saturn: { friends: ["Mercury", "Venus"], enemies: ["Sun", "Moon", "Mars"] },
};

type Disposition = "friend" | "neutral" | "enemy";

function grahaDisposition(from: Graha, to: Graha): Disposition {
  if (from === to) return "friend";
  const rel = GRAHA_FRIENDSHIP[from];
  if (rel.friends.includes(to)) return "friend";
  if (rel.enemies.includes(to)) return "enemy";
  return "neutral";
}

function grahaMaitriKoota(a: AshtakootPerson, b: AshtakootPerson): KootaResult {
  const lordA = RASHI_LORD[a.moonSign];
  const lordB = RASHI_LORD[b.moonSign];

  let score: number;
  if (lordA === lordB) {
    score = 5;
  } else {
    const aToB = grahaDisposition(lordA, lordB);
    const bToA = grahaDisposition(lordB, lordA);
    const dispositions = [aToB, bToA].sort(); // ["enemy","friend"] etc, stable pairing
    if (aToB === "friend" && bToA === "friend") score = 5;
    else if (dispositions.includes("friend") && dispositions.includes("neutral")) score = 4;
    else if (aToB === "neutral" && bToA === "neutral") score = 3;
    else if (dispositions.includes("friend") && dispositions.includes("enemy")) score = 1;
    else if (dispositions.includes("neutral") && dispositions.includes("enemy")) score = 0.5;
    else score = 0; // both enemy
  }

  return {
    score,
    outOf: 5,
    personA: `${rashiName(a.moonSign)} (${lordA})`,
    personB: `${rashiName(b.moonSign)} (${lordB})`,
  };
}

// ---------------------------------------------------------------------
// Gana Koota (max 6) — temperament compatibility.
// Rule: each nakshatra belongs to one of 3 ganas (Deva/divine,
// Manushya/human, Rakshasa/demonic), 9 nakshatras each. Same gana = 6,
// Deva-Manushya = 5, Manushya-Rakshasa = 1, Deva-Rakshasa = 0
// (symmetric — direction doesn't matter for this koota).
// Sources (agree on both the 9/9/9 nakshatra partition and the point
// table):
// - https://nakshamastro.com/astrohub/vedic/gana-dosha
// - https://freehoroscopesonline.in/ganakoota.php
// ---------------------------------------------------------------------

type Gana = "Deva" | "Manushya" | "Rakshasa";

const GANA_BY_NAKSHATRA: Gana[] = [
  "Deva", "Manushya", "Rakshasa", "Manushya", "Deva", "Manushya", // 1-6
  "Deva", "Deva", "Rakshasa", "Rakshasa", "Manushya", "Manushya", // 7-12
  "Deva", "Rakshasa", "Deva", "Rakshasa", "Deva", "Rakshasa", // 13-18
  "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Rakshasa", // 19-24
  "Manushya", "Manushya", "Deva", // 25-27
];

function ganaScore(ganaA: Gana, ganaB: Gana): number {
  if (ganaA === ganaB) return 6;
  const pair = new Set([ganaA, ganaB]);
  if (pair.has("Deva") && pair.has("Manushya")) return 5;
  if (pair.has("Manushya") && pair.has("Rakshasa")) return 1;
  return 0; // Deva-Rakshasa
}

function ganaKoota(a: AshtakootPerson, b: AshtakootPerson): KootaResult {
  const ganaA = GANA_BY_NAKSHATRA[a.nakshatraNumber - 1];
  const ganaB = GANA_BY_NAKSHATRA[b.nakshatraNumber - 1];
  return { score: ganaScore(ganaA, ganaB), outOf: 6, personA: ganaA, personB: ganaB };
}

// ---------------------------------------------------------------------
// Bhakoot Koota (max 7) — emotional/financial compatibility, based on
// the whole-sign distance between the two Moon signs.
// Rule: distance (counted from A to B, 1-12, wraps) of 2, 5, 6, 8, 9, or
// 12 is the classical Bhakoot Dosha = 0; every other distance (1, 3, 4,
// 7, 10, 11) = full 7. This module reports the base numeric score only
// — the several classical same-lord/friendly-lord "parihar" (dosha
// cancellation) rules some traditions apply are a textual caveat, not a
// change to the numeric /36 total, matching how the FreeAstrologyAPI
// endpoint this replaces reported a plain numeric score too.
// Sources (both explicitly confirm 2-12, 5-9, AND 6-8 are all part of
// the dosha, not just 2-12/6-8 — a detail that's easy to get wrong):
// - https://nakshamastro.com/astrohub/vedic/bhakoot-dosha ("If the two
//   Rashis fall in 2-12, 5-9, or 6-8 positions from each other, Bhakoot
//   Dosha applies")
// - https://www.astroword.in/blog/bhakoot-dosha-exceptions
// ---------------------------------------------------------------------

const BHAKOOT_DOSHA_DISTANCES = new Set([2, 5, 6, 8, 9, 12]);

function bhakootKoota(a: AshtakootPerson, b: AshtakootPerson): KootaResult {
  const distance = rashiDistance(a.moonSign, b.moonSign);
  const score = BHAKOOT_DOSHA_DISTANCES.has(distance) ? 0 : 7;
  return { score, outOf: 7, personA: rashiName(a.moonSign), personB: rashiName(b.moonSign) };
}

// ---------------------------------------------------------------------
// Nadi Koota (max 8, heaviest weight) — genetic/health compatibility.
// Rule: each nakshatra belongs to one of 3 nadis (Aadi/first,
// Madhya/middle, Antya/last), 9 nakshatras each, following a fixed
// zigzag pattern (forward triplet, then reversed triplet, repeating).
// Same nadi = 0 (traditional Nadi Dosha, the most significant single
// dosha in Ashtakoot matching); different nadi = full 8.
// Sources (the 9/9/9 partition below was verified internally — every
// third nakshatra alternating direction — against):
// - https://blog.indianastrologysoftware.com/nadi-kuta-agreement-by-nakshatra-padas/
// - https://www.srisivanadi.com/how-to-check-nadi-for-marriage/
// ---------------------------------------------------------------------

type Nadi = "Aadi" | "Madhya" | "Antya";

const NADI_BY_NAKSHATRA: Nadi[] = [
  "Aadi", "Madhya", "Antya", "Antya", "Madhya", "Aadi", // 1-6
  "Aadi", "Madhya", "Antya", "Antya", "Madhya", "Aadi", // 7-12
  "Aadi", "Madhya", "Antya", "Antya", "Madhya", "Aadi", // 13-18
  "Aadi", "Madhya", "Antya", "Antya", "Madhya", "Aadi", // 19-24
  "Aadi", "Madhya", "Antya", // 25-27
];

function nadiKoota(a: AshtakootPerson, b: AshtakootPerson): KootaResult {
  const nadiA = NADI_BY_NAKSHATRA[a.nakshatraNumber - 1];
  const nadiB = NADI_BY_NAKSHATRA[b.nakshatraNumber - 1];
  const score = nadiA === nadiB ? 0 : 8;
  return { score, outOf: 8, personA: nadiA, personB: nadiB };
}

// ---------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------

/**
 * Computes the full classical Ashtakoot / Guna Milan compatibility
 * score (8 kootas, 36 points max) between two people, from their real,
 * locally-derived Moon sign + Moon nakshatra alone. Pure function,
 * deterministic, no I/O.
 *
 * By this codebase's established convention (see
 * src/lib/astrology/match-request.ts / each match tool's route.ts),
 * `personA` is conventionally the bride/"you" (female role) and
 * `personB` the groom/"partner" (male role) — this matters only for
 * Varna Koota, the one koota with a directional rule.
 */
export function calculateAshtakoot(a: AshtakootPerson, b: AshtakootPerson): AshtakootResult {
  const varna = varnaKoota(a, b);
  const vashya = vashyaKoota(a, b);
  const tara = taraKoota(a, b);
  const yoni = yoniKoota(a, b);
  const grahaMaitri = grahaMaitriKoota(a, b);
  const gana = ganaKoota(a, b);
  const bhakoot = bhakootKoota(a, b);
  const nadi = nadiKoota(a, b);

  const totalScore =
    varna.score +
    vashya.score +
    tara.score +
    yoni.score +
    grahaMaitri.score +
    gana.score +
    bhakoot.score +
    nadi.score;

  return {
    totalScore,
    outOf: 36,
    varna,
    vashya,
    tara,
    yoni,
    grahaMaitri,
    gana,
    bhakoot,
    nadi,
    nadiDosha: nadi.score === 0,
    bhakootDosha: bhakoot.score === 0,
  };
}
