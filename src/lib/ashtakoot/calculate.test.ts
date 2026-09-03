// src/lib/ashtakoot/calculate.test.ts
import assert from "node:assert/strict";
import { calculateAshtakoot, type AshtakootPerson } from "./calculate.ts";

// --- self-consistency: identical people should max every symmetric koota ---
// (Varna is directionally defined but is reflexive: a rashi's own varna
// rank always >= itself, so it also maxes for an identical pair.)
const sameNakshatra: AshtakootPerson = { moonSign: 4, nakshatraNumber: 6 }; // Cancer, Ardra
const identical = calculateAshtakoot(sameNakshatra, sameNakshatra);

assert.strictEqual(identical.varna.score, 1, "identical people: full Varna");
assert.strictEqual(identical.vashya.score, 2, "identical people: full Vashya (same group)");
assert.strictEqual(identical.grahaMaitri.score, 5, "identical people: full Graha Maitri (same lord)");
assert.strictEqual(identical.gana.score, 6, "identical people: full Gana (same gana)");
assert.strictEqual(identical.bhakoot.score, 7, "identical people: full Bhakoot (distance 1, not a dosha distance)");
// Tara and Nadi are NOT necessarily maxed for an identical pair — same
// nakshatra is Janma Tara (inauspicious, by classical rule) and same
// Nadi (Nadi Dosha) — this is a real, well-documented traditional
// outcome (matching same-nakshatra couples score 0 on Tara and Nadi),
// not a bug.
assert.strictEqual(identical.tara.score, 0, "identical people: Janma Tara both directions is inauspicious");
assert.strictEqual(identical.nadi.score, 0, "identical people: same Nadi is a dosha");
assert.strictEqual(identical.nadiDosha, true);

// --- total never exceeds 36, and equals the sum of the 8 kootas ---
function assertValidResult(a: AshtakootPerson, b: AshtakootPerson) {
  const result = calculateAshtakoot(a, b);
  const sum =
    result.varna.score +
    result.vashya.score +
    result.tara.score +
    result.yoni.score +
    result.grahaMaitri.score +
    result.gana.score +
    result.bhakoot.score +
    result.nadi.score;
  assert.ok(result.totalScore <= 36, `total ${result.totalScore} must never exceed 36`);
  assert.ok(result.totalScore >= 0, `total ${result.totalScore} must never be negative`);
  assert.strictEqual(result.totalScore, sum, "totalScore must equal the sum of the 8 koota scores");
  assert.strictEqual(result.outOf, 36);

  // Each koota's score never exceeds its own outOf.
  for (const koota of [
    result.varna,
    result.vashya,
    result.tara,
    result.yoni,
    result.grahaMaitri,
    result.gana,
    result.bhakoot,
    result.nadi,
  ]) {
    assert.ok(koota.score >= 0 && koota.score <= koota.outOf, `koota score ${koota.score} out of range 0-${koota.outOf}`);
  }
}

// Sweep every rashi/nakshatra combination against a fixed reference
// person — exhaustive enough to catch any out-of-table-bounds bug
// (undefined lookups, NaN, etc.) across all 12 signs and 27 nakshatras.
const reference: AshtakootPerson = { moonSign: 1, nakshatraNumber: 1 };
for (let sign = 1; sign <= 12; sign++) {
  for (let nakshatra = 1; nakshatra <= 27; nakshatra++) {
    assertValidResult(reference, { moonSign: sign, nakshatraNumber: nakshatra });
    assertValidResult({ moonSign: sign, nakshatraNumber: nakshatra }, reference);
  }
}

// --- Nadi Dosha / Bhakoot Dosha flags reflect the underlying scores ---
const nadiDoshaCase = calculateAshtakoot(
  { moonSign: 1, nakshatraNumber: 1 }, // Ashwini -> Aadi nadi
  { moonSign: 3, nakshatraNumber: 7 } // Punarvasu -> Aadi nadi
);
assert.strictEqual(nadiDoshaCase.nadi.score, 0);
assert.strictEqual(nadiDoshaCase.nadiDosha, true);

const noNadiDoshaCase = calculateAshtakoot(
  { moonSign: 1, nakshatraNumber: 1 }, // Ashwini -> Aadi nadi
  { moonSign: 2, nakshatraNumber: 2 } // Bharani -> Madhya nadi
);
assert.strictEqual(noNadiDoshaCase.nadi.score, 8);
assert.strictEqual(noNadiDoshaCase.nadiDosha, false);

// Bhakoot Dosha: Aries (1) -> Taurus (2) is a 2-12 distance -> dosha.
const bhakootDoshaCase = calculateAshtakoot(
  { moonSign: 1, nakshatraNumber: 1 },
  { moonSign: 2, nakshatraNumber: 4 } // Rohini, still Taurus
);
assert.strictEqual(bhakootDoshaCase.bhakoot.score, 0);
assert.strictEqual(bhakootDoshaCase.bhakootDosha, true);

// Aries (1) -> Cancer (4) is a 4-10 distance -> no dosha, full 7.
const noBhakootDoshaCase = calculateAshtakoot(
  { moonSign: 1, nakshatraNumber: 1 },
  { moonSign: 4, nakshatraNumber: 22 }
);
assert.strictEqual(noBhakootDoshaCase.bhakoot.score, 7);
assert.strictEqual(noBhakootDoshaCase.bhakootDosha, false);

// --- Varna Koota: directional rule (personB's rank must be >= personA's) ---
const brahminA: AshtakootPerson = { moonSign: 4, nakshatraNumber: 6 }; // Cancer = Brahmin
const shudraB: AshtakootPerson = { moonSign: 3, nakshatraNumber: 8 }; // Gemini = Shudra
assert.strictEqual(calculateAshtakoot(brahminA, shudraB).varna.score, 0, "Brahmin bride, Shudra groom: 0");
assert.strictEqual(calculateAshtakoot(shudraB, brahminA).varna.score, 1, "Shudra bride, Brahmin groom: 1");

// --- Yoni Koota: same-animal-same-gender beats same-animal-different-gender ---
const ashwini: AshtakootPerson = { moonSign: 1, nakshatraNumber: 1 }; // Horse (M)
const shatabhisha: AshtakootPerson = { moonSign: 11, nakshatraNumber: 24 }; // Horse (F)
assert.strictEqual(calculateAshtakoot(ashwini, ashwini).yoni.score, 4, "same nakshatra: same animal + same gender");
assert.strictEqual(calculateAshtakoot(ashwini, shatabhisha).yoni.score, 3, "same animal, different gender");

// Cow (Uttara Phalguni) vs Tiger (Chitra) — classical Yoni enemy pair.
const cow: AshtakootPerson = { moonSign: 6, nakshatraNumber: 12 };
const tiger: AshtakootPerson = { moonSign: 6, nakshatraNumber: 14 };
assert.strictEqual(calculateAshtakoot(cow, tiger).yoni.score, 0, "Cow vs Tiger: classical enemy pair");

console.log("calculate.test.ts: all assertions passed");
