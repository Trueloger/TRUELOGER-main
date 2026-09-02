// src/lib/astrology/rashi-reference.ts
// Static reference content for the 12 sidereal Rashis (zodiac signs) —
// element, classical Vedic ruling planet, and a short traits phrase.
// Standard, well-established astrology, not invented. Used by the
// Rashi and Ascendant API routes to enrich the real sign returned by
// getPlanetPositions() (which gives the sign name/number but not
// element/ruler/traits). Keyed by sign number (1-12, matches
// PlanetExtendedEntry.current_sign) so callers never need to worry
// about name-casing/aliasing.

export type RashiElement = "Fire" | "Earth" | "Air" | "Water";

export type RashiReference = {
  signNumber: number; // 1-12
  signName: string;
  element: RashiElement;
  rulingPlanet: string;
  traits: string;
};

const RASHI_REFERENCE: RashiReference[] = [
  {
    signNumber: 1,
    signName: "Aries",
    element: "Fire",
    rulingPlanet: "Mars",
    traits: "Bold, energetic, and quick to act, with a natural instinct to lead.",
  },
  {
    signNumber: 2,
    signName: "Taurus",
    element: "Earth",
    rulingPlanet: "Venus",
    traits: "Steady, patient, and grounded, with a deep love of comfort and beauty.",
  },
  {
    signNumber: 3,
    signName: "Gemini",
    element: "Air",
    rulingPlanet: "Mercury",
    traits: "Curious, communicative, and adaptable, with a quick and versatile mind.",
  },
  {
    signNumber: 4,
    signName: "Cancer",
    element: "Water",
    rulingPlanet: "Moon",
    traits: "Nurturing, intuitive, and emotionally attuned, with a strong bond to home and family.",
  },
  {
    signNumber: 5,
    signName: "Leo",
    element: "Fire",
    rulingPlanet: "Sun",
    traits: "Confident, warm-hearted, and expressive, with a natural flair for leadership.",
  },
  {
    signNumber: 6,
    signName: "Virgo",
    element: "Earth",
    rulingPlanet: "Mercury",
    traits: "Analytical, meticulous, and service-minded, with a practical eye for detail.",
  },
  {
    signNumber: 7,
    signName: "Libra",
    element: "Air",
    rulingPlanet: "Venus",
    traits: "Diplomatic, harmony-seeking, and sociable, with a refined sense of balance.",
  },
  {
    signNumber: 8,
    signName: "Scorpio",
    element: "Water",
    rulingPlanet: "Mars",
    traits: "Intense, resourceful, and deeply perceptive, with a strong will beneath a calm surface.",
  },
  {
    signNumber: 9,
    signName: "Sagittarius",
    element: "Fire",
    rulingPlanet: "Jupiter",
    traits: "Optimistic, adventurous, and philosophical, with a restless love of freedom and truth.",
  },
  {
    signNumber: 10,
    signName: "Capricorn",
    element: "Earth",
    rulingPlanet: "Saturn",
    traits: "Disciplined, ambitious, and responsible, with the patience to build for the long term.",
  },
  {
    signNumber: 11,
    signName: "Aquarius",
    element: "Air",
    rulingPlanet: "Saturn",
    traits: "Independent, inventive, and humanitarian, with an original, forward-looking mind.",
  },
  {
    signNumber: 12,
    signName: "Pisces",
    element: "Water",
    rulingPlanet: "Jupiter",
    traits: "Compassionate, imaginative, and gentle, with a deep, intuitive inner world.",
  },
];

/** Looks up element/ruler/traits by sidereal sign number (1-12). Returns
 * `null` for an out-of-range number rather than fabricating a fallback —
 * callers should treat that as unexpected API data, not silently guess. */
export function getRashiReference(signNumber: number): RashiReference | null {
  return RASHI_REFERENCE.find((r) => r.signNumber === signNumber) ?? null;
}
