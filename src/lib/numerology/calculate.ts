// src/lib/numerology/calculate.ts
// Pure, deterministic math — no AI, no external API. Every function here
// is a straight implementation of the standard Pythagorean numerology
// algorithms; the only shared rule (the master-number exception) lives
// in exactly one place: reduceToSingleDigitOrMaster.

/** Pythagorean letter-to-number mapping. */
const LETTER_VALUES: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
};

// Simplest defensible rule, documented rather than silently assumed: A,
// E, I, O, U are vowels; Y is always treated as a consonant. Whether Y is
// "sometimes a vowel" is genuinely ambiguous across numerology systems,
// so we pick the one unambiguous rule and apply it consistently.
const VOWELS = new Set(["A", "E", "I", "O", "U"]);

function digitSum(n: number): number {
  return String(n)
    .split("")
    .reduce((sum, ch) => sum + Number(ch), 0);
}

/** The one place the master-number rule (11, 22, 33 are not reduced
 * further) lives. Repeatedly digit-sums `n` until it's a single digit,
 * UNLESS an intermediate sum is 11, 22, or 33, in which case it stops
 * there. Used by every number type in this file except birthNumber,
 * which — per traditional convention — never keeps a master number (see
 * birthNumber's comment). */
export function reduceToSingleDigitOrMaster(n: number): number {
  let value = Math.abs(Math.trunc(n));
  while (value > 9) {
    if (value === 11 || value === 22 || value === 33) return value;
    value = digitSum(value);
  }
  return value;
}

function reduceToSingleDigit(n: number): number {
  let value = Math.abs(Math.trunc(n));
  while (value > 9) {
    value = digitSum(value);
  }
  return value;
}

function sumLetterValues(fullName: string, includeLetter: (letter: string) => boolean): number {
  let sum = 0;
  for (const ch of fullName.toUpperCase()) {
    if (!(ch in LETTER_VALUES)) continue;
    if (!includeLetter(ch)) continue;
    sum += LETTER_VALUES[ch];
  }
  return sum;
}

/** Life Path Number — sums every digit in the date of birth
 * ("YYYY-MM-DD") and reduces, preserving master numbers. The standard,
 * best-known numerology calculation; represents the overall direction of
 * this lifetime. */
export function lifePathNumber(dateOfBirth: string): number {
  const digits = dateOfBirth.replace(/[^0-9]/g, "");
  const sum = digits.split("").reduce((total, ch) => total + Number(ch), 0);
  return reduceToSingleDigitOrMaster(sum);
}

/** Destiny Number (a.k.a. Expression Number) — Pythagorean value of every
 * letter in the full name, reduced with the master-number exception.
 * Non-letter characters are ignored; case-insensitive. */
export function destinyNumber(fullName: string): number {
  const sum = sumLetterValues(fullName, () => true);
  return reduceToSingleDigitOrMaster(sum);
}

/** Soul Urge Number (a.k.a. Heart's Desire) — same Pythagorean system,
 * vowels (A, E, I, O, U) only. See the VOWELS comment above for the Y
 * ruling. */
export function soulUrgeNumber(fullName: string): number {
  const sum = sumLetterValues(fullName, (letter) => VOWELS.has(letter));
  return reduceToSingleDigitOrMaster(sum);
}

/** Personality Number — same Pythagorean system, consonants only (the
 * complement of soulUrgeNumber's vowel set). */
export function personalityNumber(fullName: string): number {
  const sum = sumLetterValues(fullName, (letter) => !VOWELS.has(letter));
  return reduceToSingleDigitOrMaster(sum);
}

/** Birth Number (a.k.a. Driver Number) — just the day-of-month, reduced
 * to a single digit. Deliberately simpler than Life Path: traditionally
 * this number does NOT keep master numbers (a day-of-month of 29 reduces
 * all the way to 2, not 11) — it's a secondary, lighter-weight number,
 * distinct from Life Path even though both start from the date of birth. */
export function birthNumber(dateOfBirth: string): number {
  const day = Number(dateOfBirth.slice(8, 10));
  return reduceToSingleDigit(day);
}
