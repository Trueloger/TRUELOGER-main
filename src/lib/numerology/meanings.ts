// src/lib/numerology/meanings.ts
// Static reference content — written from established Pythagorean
// numerology tradition, not an API call. No guaranteed-outcome language,
// same as the AI-generated reports.
//
// Design choice: rather than fabricate four separate meaning tables for
// Life Path / Destiny / Soul Urge / Personality — a level of per-type
// nuance tradition doesn't confidently support — this file holds ONE
// well-sourced base meaning per number (the archetype each number
// represents is the same across the four calculations). What differs
// between the four number types is which part of a person that archetype
// is describing, not the archetype itself; that distinction is applied
// as a short framing line per type (NUMEROLOGY_TYPE_FRAMING below),
// used by the UI/report layer. This is an honest simplification, noted
// here rather than left implicit.

export type NumerologyNumberMeaning = { title: string; meaning: string };

export const NUMBER_MEANINGS: Record<number, NumerologyNumberMeaning> = {
  1: {
    title: "The Leader",
    meaning:
      "Traditionally associated with independence, new beginnings, and the courage to lead. This number suggests a drive toward self-reliance and original thinking.",
  },
  2: {
    title: "The Diplomat",
    meaning:
      "Traditionally linked to partnership, balance, and cooperation. This number suggests sensitivity, patience, and a gift for bringing people together.",
  },
  3: {
    title: "The Communicator",
    meaning:
      "Traditionally tied to creativity, self-expression, and optimism. This number suggests a natural warmth and a joyful, expressive way of engaging with the world.",
  },
  4: {
    title: "The Builder",
    meaning:
      "Traditionally associated with stability, discipline, and steady effort. This number suggests reliability and a preference for building things that last.",
  },
  5: {
    title: "The Free Spirit",
    meaning:
      "Traditionally linked to change, adventure, and adaptability. This number suggests curiosity, versatility, and a restlessness that seeks new experiences.",
  },
  6: {
    title: "The Nurturer",
    meaning:
      "Traditionally tied to responsibility, home, and care for others. This number suggests a natural instinct toward harmony, service, and protecting loved ones.",
  },
  7: {
    title: "The Seeker",
    meaning:
      "Traditionally associated with introspection, analysis, and a search for deeper understanding. This number suggests a thoughtful, often spiritual, inner life.",
  },
  8: {
    title: "The Achiever",
    meaning:
      "Traditionally linked to ambition, material accomplishment, and personal authority. This number suggests drive, organizational strength, and a capacity to build abundance.",
  },
  9: {
    title: "The Humanitarian",
    meaning:
      "Traditionally tied to compassion, completion, and a broad, universal outlook. This number suggests generosity and a pull toward causes larger than oneself.",
  },
  11: {
    title: "The Illuminator (Master Number)",
    meaning:
      "A master number traditionally associated with heightened intuition and spiritual insight. This reading suggests a capacity to inspire others, often carrying both the sensitivity of a 2 and an amplified sense of purpose.",
  },
  22: {
    title: "The Master Builder (Master Number)",
    meaning:
      "A master number traditionally associated with turning large visions into practical, lasting results. This reading suggests the discipline of a 4 combined with an expanded, ambitious scope.",
  },
  33: {
    title: "The Master Teacher (Master Number)",
    meaning:
      "A master number traditionally associated with compassion expressed through selfless service and guidance. This reading suggests the nurturing quality of a 6, raised to a broader, teaching role.",
  },
};

export const NUMEROLOGY_TYPE_FRAMING = {
  lifePath: "the overall direction and lessons traditionally associated with this lifetime",
  destiny: "the potential and purpose this name is traditionally said to point toward",
  soulUrge: "the inner motivation and heart's true desire behind the name",
  personality: "the outward impression and first-glance persona others tend to pick up on",
  birth: "a lighter, secondary influence traditionally tied to the day of birth",
} as const;

export type NumerologyNumberType = keyof typeof NUMEROLOGY_TYPE_FRAMING;
