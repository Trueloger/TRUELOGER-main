// src/lib/numerology/calculate.test.ts
import assert from "node:assert/strict";
import {
  reduceToSingleDigitOrMaster,
  lifePathNumber,
  destinyNumber,
  soulUrgeNumber,
  personalityNumber,
  birthNumber,
} from "./calculate.ts";

// --- reduceToSingleDigitOrMaster -------------------------------------
assert.strictEqual(reduceToSingleDigitOrMaster(5), 5, "already single digit, unchanged");
assert.strictEqual(reduceToSingleDigitOrMaster(11), 11, "11 is a master number, not reduced");
assert.strictEqual(reduceToSingleDigitOrMaster(22), 22, "22 is a master number, not reduced");
assert.strictEqual(reduceToSingleDigitOrMaster(33), 33, "33 is a master number, not reduced");
assert.strictEqual(
  reduceToSingleDigitOrMaster(29),
  11,
  "29 -> 11 (2+9), an intermediate master number, stops there"
);
assert.strictEqual(
  reduceToSingleDigitOrMaster(38),
  11,
  "38 -> 11 (3+8), an intermediate master number, stops there"
);
assert.strictEqual(reduceToSingleDigitOrMaster(44), 8, "44 -> 8 (4+4), not a master number");
assert.strictEqual(reduceToSingleDigitOrMaster(99), 9, "99 -> 18 -> 9, no master number along the way");

// --- lifePathNumber ----------------------------------------------------
// 2000-01-01: 2+0+0+0+0+1+0+1 = 4 (already single digit)
assert.strictEqual(lifePathNumber("2000-01-01"), 4);
// 1994-12-08: 1+9+9+4+1+2+0+8 = 34 -> 3+4 = 7
assert.strictEqual(lifePathNumber("1994-12-08"), 7);
// 2005-03-01: 2+0+0+5+0+3+0+1 = 11 -> master, not reduced
assert.strictEqual(lifePathNumber("2005-03-01"), 11, "master number 11 preserved");
// 2009-08-03: 2+0+0+9+0+8+0+3 = 22 -> master, not reduced
assert.strictEqual(lifePathNumber("2009-08-03"), 22, "master number 22 preserved");
// 1990-08-06: 1+9+9+0+0+8+0+6 = 33 -> master, not reduced
assert.strictEqual(lifePathNumber("1990-08-06"), 33, "master number 33 preserved");

// --- destinyNumber / soulUrgeNumber / personalityNumber -----------------
// "JOHN SMITH": J1 O6 H8 N5 S1 M4 I9 T2 H8 = 44 -> 4+4 = 8
assert.strictEqual(destinyNumber("JOHN SMITH"), 8);
// Vowels only: O6 I9 = 15 -> 1+5 = 6
assert.strictEqual(soulUrgeNumber("JOHN SMITH"), 6);
// Consonants only: J1 H8 N5 S1 M4 T2 H8 = 29 -> 2+9 = 11 -> master, not reduced
assert.strictEqual(personalityNumber("JOHN SMITH"), 11, "master number 11 preserved");

// Case-insensitivity and non-letter characters are ignored.
assert.strictEqual(destinyNumber("A.B!"), 3, "A(1) + B(2) = 3, punctuation ignored");
assert.strictEqual(destinyNumber("a.b!"), 3, "case-insensitive, same result as A.B!");
assert.strictEqual(soulUrgeNumber("A.B!"), 1, "only vowel A(1) counted");
assert.strictEqual(personalityNumber("A.B!"), 2, "only consonant B(2) counted");

// --- birthNumber ---------------------------------------------------------
// Day 6: already a single digit.
assert.strictEqual(birthNumber("1990-08-06"), 6);
// Day 19: 1+9 = 10 -> 1+0 = 1
assert.strictEqual(birthNumber("1994-12-19"), 1);
// Day 29: 2+9 = 11 -> NOT preserved (unlike Life Path) -> 1+1 = 2
assert.strictEqual(
  birthNumber("1994-12-29"),
  2,
  "birthNumber has no master-number exception, unlike lifePathNumber"
);

console.log("calculate.test.ts: all assertions passed");
