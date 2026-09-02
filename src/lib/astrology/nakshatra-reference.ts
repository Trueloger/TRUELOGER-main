// src/lib/astrology/nakshatra-reference.ts
// Static reference content for the 27 Nakshatras (lunar mansions) —
// ruling deity and symbol, one well-known standard association each.
// Standard, well-established Vedic astrology content, not invented.
// Used by the Nakshatra API route to enrich the real nakshatra returned
// by getPlanetPositions() (which gives name/number/pada/vimsottari lord
// but not deity/symbol). Keyed by nakshatra number (1-27, matches
// PlanetExtendedEntry.nakshatra_number) so callers never need to worry
// about name-casing.

export type NakshatraReference = {
  number: number; // 1-27
  name: string;
  deity: string;
  symbol: string;
};

const NAKSHATRA_REFERENCE: NakshatraReference[] = [
  { number: 1, name: "Ashwini", deity: "The Ashwini Kumaras, divine healers", symbol: "Horse's head" },
  { number: 2, name: "Bharani", deity: "Yama, god of death and dharma", symbol: "Yoni, symbol of creation" },
  { number: 3, name: "Krittika", deity: "Agni, the fire god", symbol: "Razor / flame" },
  { number: 4, name: "Rohini", deity: "Brahma, the creator", symbol: "Ox-cart / chariot" },
  { number: 5, name: "Mrigashira", deity: "Soma, the Moon god", symbol: "Deer's head" },
  { number: 6, name: "Ardra", deity: "Rudra, the storm god", symbol: "Teardrop / diamond" },
  { number: 7, name: "Punarvasu", deity: "Aditi, mother of the gods", symbol: "Bow and quiver" },
  { number: 8, name: "Pushya", deity: "Brihaspati, the celestial teacher", symbol: "Cow's udder" },
  { number: 9, name: "Ashlesha", deity: "The Nagas, serpent deities", symbol: "Coiled serpent" },
  { number: 10, name: "Magha", deity: "The Pitris, ancestral spirits", symbol: "Royal throne" },
  { number: 11, name: "Purva Phalguni", deity: "Bhaga, god of fortune", symbol: "Front legs of a bed" },
  { number: 12, name: "Uttara Phalguni", deity: "Aryaman, god of patronage", symbol: "Back legs of a bed" },
  { number: 13, name: "Hasta", deity: "Savitar, the sun god", symbol: "Open hand" },
  { number: 14, name: "Chitra", deity: "Vishwakarma, the celestial architect", symbol: "Bright jewel" },
  { number: 15, name: "Swati", deity: "Vayu, the wind god", symbol: "Young shoot swaying in the wind" },
  { number: 16, name: "Vishakha", deity: "Indra and Agni", symbol: "Decorated archway" },
  { number: 17, name: "Anuradha", deity: "Mitra, god of friendship", symbol: "Lotus flower" },
  { number: 18, name: "Jyeshtha", deity: "Indra, king of the gods", symbol: "Circular amulet" },
  { number: 19, name: "Mula", deity: "Nirriti, goddess of dissolution", symbol: "Bundle of roots" },
  { number: 20, name: "Purva Ashadha", deity: "Apas, the water goddess", symbol: "Elephant tusk" },
  { number: 21, name: "Uttara Ashadha", deity: "The Vishwadevas, universal gods", symbol: "Elephant tusk" },
  { number: 22, name: "Shravana", deity: "Vishnu, the preserver", symbol: "Ear / three footprints" },
  { number: 23, name: "Dhanishta", deity: "The eight Vasus", symbol: "Drum" },
  { number: 24, name: "Shatabhisha", deity: "Varuna, god of cosmic waters", symbol: "Empty circle" },
  { number: 25, name: "Purva Bhadrapada", deity: "Aja Ekapada, the one-footed goat", symbol: "Front legs of a funeral cot" },
  { number: 26, name: "Uttara Bhadrapada", deity: "Ahir Budhnya, serpent of the deep", symbol: "Back legs of a funeral cot" },
  { number: 27, name: "Revati", deity: "Pushan, protector of travelers", symbol: "Fish" },
];

/** Looks up deity/symbol by nakshatra number (1-27). Returns `null` for
 * an out-of-range number rather than fabricating a fallback — callers
 * should treat that as unexpected API data, not silently guess. */
export function getNakshatraReference(number: number): NakshatraReference | null {
  return NAKSHATRA_REFERENCE.find((n) => n.number === number) ?? null;
}
