// src/lib/astro-engine/yogas.test.ts
// Plain node:assert/strict script, matching src/lib/ashtakoot/calculate.test.ts's
// exact style — run directly via `node src/lib/astro-engine/yogas.test.ts`.
import assert from "node:assert/strict";
import { calculateChart, type ChartData, type ChartPlanetEntry, type ChartPlanetName } from "./ephemeris.ts";
import { detectYogas, YOGA_REGISTRY } from "./yogas.ts";

// ---------------------------------------------------------------------
// Synthetic-chart builder (same shape/approach as dignity.test.ts's
// `syntheticChart`, extended with a configurable Ascendant sign and a
// house computed the same way ephemeris.ts does: whole-sign distance
// from the Ascendant). Every synthetic planet defaults to sitting in
// its own primary sign (a "neutral baseline" chart with no accidental
// debilitations), so overriding only the planet(s) a given test cares
// about keeps every other yoga's preconditions predictably absent.
// ---------------------------------------------------------------------

type SignDegree = { sign: number; degree: number };

const DEFAULT_PLACEMENTS: Record<ChartPlanetName, SignDegree> = {
  Sun: { sign: 5, degree: 15 }, // Leo (own)
  Moon: { sign: 4, degree: 15 }, // Cancer (own)
  Mars: { sign: 1, degree: 15 }, // Aries (own)
  Mercury: { sign: 3, degree: 15 }, // Gemini (own)
  Jupiter: { sign: 9, degree: 15 }, // Sagittarius (own)
  Venus: { sign: 2, degree: 15 }, // Taurus (own)
  Saturn: { sign: 10, degree: 15 }, // Capricorn (own)
  Rahu: { sign: 6, degree: 15 },
  Ketu: { sign: 12, degree: 15 },
  Uranus: { sign: 6, degree: 15 },
  Neptune: { sign: 6, degree: 15 },
  Pluto: { sign: 6, degree: 15 },
};

/** Same whole-sign house convention as src/lib/astrology/derive.ts's
 * `signHouseNumber` and ephemeris.ts's usage of it. */
function signHouseNumber(baseSign: number, targetSign: number): number {
  return (((targetSign - baseSign) % 12) + 12) % 12 + 1;
}

function syntheticChart(ascendantSign: number, overrides: Partial<Record<ChartPlanetName, SignDegree>>): ChartData {
  const merged: Record<ChartPlanetName, SignDegree> = { ...DEFAULT_PLACEMENTS, ...overrides };
  const planets = {} as Record<ChartPlanetName, ChartPlanetEntry>;
  for (const [name, point] of Object.entries(merged) as [ChartPlanetName, SignDegree][]) {
    const longitude = (point.sign - 1) * 30 + point.degree;
    planets[name] = {
      longitude,
      sign: point.sign,
      degree: point.degree,
      house: signHouseNumber(ascendantSign, point.sign),
      isRetrograde: false,
      nakshatra: { nakshatraNumber: 1, nakshatraName: "Ashwini", pada: 1 },
    };
  }
  return {
    birthUtc: new Date().toISOString(),
    latitude: 0,
    longitude: 0,
    ayanamsha: 24,
    ascendant: { longitude: (ascendantSign - 1) * 30, sign: ascendantSign, degree: 0 },
    mc: { longitude: 0, sign: 1, degree: 0 },
    planets,
  };
}

function resultFor(chart: ChartData, ruleId: string) {
  const r = detectYogas(chart).find((y) => y.ruleId === ruleId);
  assert.ok(r, `no such rule id in registry: ${ruleId}`);
  return r!;
}

// =======================================================================
// 1. Panch Mahapurusha Yogas
// =======================================================================
// Ruchaka (Mars) exercised in full detail (own-sign+kendra, exalted+kendra,
// own-sign-but-NOT-kendra); the other four karakas share the exact same
// generated rule shape, so are spot-checked for presence only.

// Own-sign (Aries) + Kendra from Ascendant (Ascendant Libra -> Mars's
// house = signHouseNumber(7,1) = 7, a Kendra) -> present, "moderate".
{
  const ascendantSign = 7;
  const marsHouse = signHouseNumber(ascendantSign, 1);
  assert.ok([1, 4, 7, 10].includes(marsHouse), "test setup: Mars's house must actually be a Kendra");
  const chart = syntheticChart(ascendantSign, { Mars: { sign: 1, degree: 15 } });
  const r = resultFor(chart, "mahapurusha-ruchaka");
  assert.strictEqual(r.present, true, "Ruchaka: Mars own-sign in Kendra must be present");
  assert.strictEqual(r.strength, "moderate", "Ruchaka: own-sign (not exalted) grades moderate");
}

// Exalted (Capricorn 28) + Kendra (same Ascendant Libra -> house 7) -> present, "strong".
{
  const chart = syntheticChart(7, { Mars: { sign: 10, degree: 28 } });
  const r = resultFor(chart, "mahapurusha-ruchaka");
  assert.strictEqual(r.present, true, "Ruchaka: Mars exalted in Kendra must be present");
  assert.strictEqual(r.strength, "strong", "Ruchaka: exalted grades strong");
}

// Own-sign but NOT in a Kendra (Ascendant Taurus(2) -> Mars(Aries=1)'s
// house = signHouseNumber(2,1) = 12, not a Kendra) -> absent.
{
  const ascendantSign = 2;
  const marsHouse = signHouseNumber(ascendantSign, 1);
  assert.ok(![1, 4, 7, 10].includes(marsHouse), "test setup: Mars's house must NOT be a Kendra here");
  const chart = syntheticChart(ascendantSign, { Mars: { sign: 1, degree: 15 } });
  const r = resultFor(chart, "mahapurusha-ruchaka");
  assert.strictEqual(r.present, false, "Ruchaka: own-sign but not in a Kendra must be absent");
  assert.strictEqual(r.strength, undefined, "absent yoga must not report a strength");
}

// Spot-check the other four Panch Mahapurusha karakas: each placed in
// one of its own signs, with the Ascendant set to THAT SAME sign (so
// the planet sits in house 1 — trivially a Kendra) -> all present,
// "moderate". (Mercury/Jupiter/Venus/Saturn's own signs don't include
// Aries, so each gets its own matching Ascendant here rather than
// sharing one chart.)
{
  const bhadraChart = syntheticChart(3, { Mercury: { sign: 3, degree: 15 } }); // Gemini
  assert.strictEqual(resultFor(bhadraChart, "mahapurusha-bhadra").present, true, "Bhadra: own-sign-in-Kendra must be present");
  assert.strictEqual(resultFor(bhadraChart, "mahapurusha-bhadra").strength, "moderate");

  const hamsaChart = syntheticChart(9, { Jupiter: { sign: 9, degree: 15 } }); // Sagittarius
  assert.strictEqual(resultFor(hamsaChart, "mahapurusha-hamsa").present, true, "Hamsa: own-sign-in-Kendra must be present");
  assert.strictEqual(resultFor(hamsaChart, "mahapurusha-hamsa").strength, "moderate");

  const malavyaChart = syntheticChart(2, { Venus: { sign: 2, degree: 15 } }); // Taurus
  assert.strictEqual(resultFor(malavyaChart, "mahapurusha-malavya").present, true, "Malavya: own-sign-in-Kendra must be present");
  assert.strictEqual(resultFor(malavyaChart, "mahapurusha-malavya").strength, "moderate");

  const sasaChart = syntheticChart(10, { Saturn: { sign: 10, degree: 15 } }); // Capricorn
  assert.strictEqual(resultFor(sasaChart, "mahapurusha-sasa").present, true, "Sasa: own-sign-in-Kendra must be present");
  assert.strictEqual(resultFor(sasaChart, "mahapurusha-sasa").strength, "moderate");
}

// =======================================================================
// 2. Gaja Kesari Yoga
// =======================================================================

// Mutual Kendra (Moon Aries(1), Jupiter Cancer(4) -> distance 4, a
// Kendra), Jupiter exalted in Cancer, Sun far away (no combustion) ->
// present, "strong".
{
  const chart = syntheticChart(1, {
    Moon: { sign: 1, degree: 15 },
    Jupiter: { sign: 4, degree: 5 },
    Sun: { sign: 8, degree: 15 },
  });
  const r = resultFor(chart, "gaja-kesari");
  assert.strictEqual(r.present, true, "Gaja Kesari: mutual Kendra must be present");
  assert.strictEqual(r.strength, "strong", "Gaja Kesari: neither afflicted -> strong");
}

// Mutual Kendra still holds (same sign = distance 1, a Kendra), but
// Jupiter is DEBILITATED (Capricorn) -> present, but "weak".
{
  const chart = syntheticChart(1, {
    Moon: { sign: 10, degree: 15 },
    Jupiter: { sign: 10, degree: 15 },
    Sun: { sign: 3, degree: 15 },
  });
  const r = resultFor(chart, "gaja-kesari");
  assert.strictEqual(r.present, true, "Gaja Kesari: mutual Kendra (distance 1) must still count as present");
  assert.strictEqual(r.strength, "weak", "Gaja Kesari: Jupiter debilitated -> weak");
}

// No mutual Kendra (Moon Aries(1), Jupiter Taurus(2) -> distance 2) -> absent.
{
  const chart = syntheticChart(1, { Moon: { sign: 1, degree: 15 }, Jupiter: { sign: 2, degree: 15 } });
  const r = resultFor(chart, "gaja-kesari");
  assert.strictEqual(r.present, false, "Gaja Kesari: no mutual Kendra must be absent");
}

// =======================================================================
// 3. Budha-Aditya Yoga
// =======================================================================

// Same sign, far apart in degree (Sun 1 deg, Mercury 29 deg -> ~28
// degrees apart, outside the 14 degree combustion orb) -> present, "strong".
{
  const chart = syntheticChart(1, { Sun: { sign: 3, degree: 1 }, Mercury: { sign: 3, degree: 29 } });
  const r = resultFor(chart, "budha-aditya");
  assert.strictEqual(r.present, true, "Budha-Aditya: same-sign conjunction must be present");
  assert.strictEqual(r.strength, "strong", "Budha-Aditya: Mercury not combust -> strong");
}

// Same sign, same degree (0 degrees apart -> combust) -> present, but "weak".
{
  const chart = syntheticChart(1, { Sun: { sign: 3, degree: 15 }, Mercury: { sign: 3, degree: 15 } });
  const r = resultFor(chart, "budha-aditya");
  assert.strictEqual(r.present, true, "Budha-Aditya: same-sign conjunction must be present even if combust");
  assert.strictEqual(r.strength, "weak", "Budha-Aditya: Mercury combust -> weak");
}

// Different signs -> absent.
{
  const chart = syntheticChart(1, { Sun: { sign: 3, degree: 15 }, Mercury: { sign: 4, degree: 15 } });
  const r = resultFor(chart, "budha-aditya");
  assert.strictEqual(r.present, false, "Budha-Aditya: no conjunction must be absent");
}

// =======================================================================
// 4. Neecha Bhanga Raja Yoga
// =======================================================================

// Sun debilitated in Libra(7); Libra's lord (Venus) is in a Kendra
// from the Ascendant (Ascendant Aries(1), Venus in Cancer(4) -> house 4) -> present.
{
  const chart = syntheticChart(1, { Sun: { sign: 7, degree: 15 }, Venus: { sign: 4, degree: 15 } });
  const r = resultFor(chart, "neecha-bhanga-raja-yoga");
  assert.strictEqual(r.present, true, "Neecha Bhanga: dispositor (Venus) in Kendra must cancel the debilitation");
  assert.strictEqual(r.strength, undefined, "binary yoga: no strength reported");
}

// Sun debilitated in Libra(7); Venus neither in a Kendra nor exalted
// (Gemini(3) -> house 3, not Kendra; Gemini isn't Venus's exaltation sign) -> absent.
{
  const chart = syntheticChart(1, { Sun: { sign: 7, degree: 15 }, Venus: { sign: 3, degree: 15 } });
  const r = resultFor(chart, "neecha-bhanga-raja-yoga");
  assert.strictEqual(r.present, false, "Neecha Bhanga: no cancellation route satisfied must be absent");
}

// =======================================================================
// 5. Viparita Raja Yoga (Harsha / Sarala / Vimala)
// =======================================================================

// Harsha: Ascendant Aries(1) -> 6th house sign = Virgo(6), lord = Mercury.
// Mercury placed in Scorpio(8) -> house 8, a dusthana -> present.
{
  const chart = syntheticChart(1, { Mercury: { sign: 8, degree: 15 } });
  const r = resultFor(chart, "viparita-harsha");
  assert.strictEqual(r.present, true, "Harsha: 6th lord in a dusthana must be present");
}

// Mercury placed in Aries(1) -> house 1, not a dusthana -> absent.
{
  const chart = syntheticChart(1, { Mercury: { sign: 1, degree: 15 } });
  const r = resultFor(chart, "viparita-harsha");
  assert.strictEqual(r.present, false, "Harsha: 6th lord NOT in a dusthana must be absent");
}

// Sarala/Vimala: spot-checked structurally the same way as Harsha, via
// the 8th-lord/12th-lord chain — Ascendant Aries(1): 8th house sign =
// Scorpio(8), lord = Mars; 12th house sign = Pisces(12), lord = Jupiter.
{
  // Mars (8th lord) placed in Cancer(4) -> house 4, NOT a dusthana -> absent.
  const absentChart = syntheticChart(1, { Mars: { sign: 4, degree: 15 } });
  assert.strictEqual(resultFor(absentChart, "viparita-sarala").present, false, "Sarala: 8th lord not in dusthana");

  // Mars (8th lord) placed in Aquarius(11) -> house 11, NOT a dusthana -> absent (control).
  // Mars placed in Pisces(12) -> house 12, a dusthana -> present.
  const presentChart = syntheticChart(1, { Mars: { sign: 12, degree: 15 } });
  assert.strictEqual(resultFor(presentChart, "viparita-sarala").present, true, "Sarala: 8th lord in dusthana (12th)");

  // Vimala: Jupiter (12th lord) placed in Virgo(6) -> house 6, a dusthana -> present.
  const vimalaPresent = syntheticChart(1, { Jupiter: { sign: 6, degree: 15 } });
  assert.strictEqual(resultFor(vimalaPresent, "viparita-vimala").present, true, "Vimala: 12th lord in dusthana (6th)");

  // Jupiter (12th lord) placed in Leo(5) -> house 5, NOT a dusthana -> absent.
  const vimalaAbsent = syntheticChart(1, { Jupiter: { sign: 5, degree: 15 } });
  assert.strictEqual(resultFor(vimalaAbsent, "viparita-vimala").present, false, "Vimala: 12th lord not in dusthana");
}

// =======================================================================
// 6. Basic Dhana Yoga (2nd/11th lord connection)
// =======================================================================
// Ascendant Aries(1): 2nd house sign = Taurus(2), lord = Venus;
// 11th house sign = Aquarius(11), lord = Saturn.

// Venus and Saturn conjunct (both in Aries(1)) -> connected -> present.
{
  const chart = syntheticChart(1, { Venus: { sign: 1, degree: 15 }, Saturn: { sign: 1, degree: 15 } });
  const r = resultFor(chart, "dhana-yoga-2-11");
  assert.strictEqual(r.present, true, "Dhana Yoga: 2nd/11th lords conjunct must be present");
}

// Venus(1) and Saturn(2): no conjunction, no mutual aspect, no exchange -> absent.
{
  const chart = syntheticChart(1, { Venus: { sign: 1, degree: 15 }, Saturn: { sign: 2, degree: 15 } });
  const r = resultFor(chart, "dhana-yoga-2-11");
  assert.strictEqual(r.present, false, "Dhana Yoga: unconnected 2nd/11th lords must be absent");
}

// The all-own-sign default baseline chart (below, also used for Raja
// Yoga) is independently confirmed to have DISCONNECTED 2nd/11th lords
// (Venus in Taurus, Saturn in Capricorn — no conjunction/aspect/exchange)
// -> absent, giving a real full-chart negative example too.
{
  const chart = syntheticChart(1, {});
  const r = resultFor(chart, "dhana-yoga-2-11");
  assert.strictEqual(r.present, false, "Dhana Yoga: default all-own-sign baseline chart has no 2nd/11th connection");
}

// =======================================================================
// 7. Basic Raja Yoga (Kendra-Trikona lord connection)
// =======================================================================
// Ascendant Aries(1), every classical planet in its own primary sign
// (the DEFAULT_PLACEMENTS baseline): Kendra lords {Mars,Moon,Venus,Saturn},
// Trikona lords {Mars,Sun,Jupiter}. Jupiter (Sagittarius(9)) casts its
// classical 9th-sign special aspect onto sign 1 (Aries) — exactly where
// Mars (a Kendra lord, and the 1st/Lagna lord) sits — so this baseline
// chart is a genuine, non-contrived Raja Yoga positive.
{
  const chart = syntheticChart(1, {});
  const r = resultFor(chart, "raja-yoga-kendra-trikona");
  assert.strictEqual(r.present, true, "Raja Yoga: Jupiter's 9th-aspect onto the Lagna-lord Mars must connect a Kendra and Trikona lord");
}

// A configuration verified (by exhaustive search over sign placements)
// to leave every Kendra-lord/Trikona-lord pair disconnected -> absent.
{
  const chart = syntheticChart(1, {
    Mars: { sign: 1, degree: 15 },
    Moon: { sign: 2, degree: 15 },
    Venus: { sign: 2, degree: 15 },
    Saturn: { sign: 2, degree: 15 },
    Sun: { sign: 3, degree: 15 },
    Jupiter: { sign: 3, degree: 15 },
  });
  const r = resultFor(chart, "raja-yoga-kendra-trikona");
  assert.strictEqual(r.present, false, "Raja Yoga: no Kendra/Trikona lord pair connected must be absent");
}

// =======================================================================
// 8. Chandra-Mangal Yoga
// =======================================================================

// Moon and Mars conjunct (both in Cancer(4)) -> present.
{
  const chart = syntheticChart(1, { Mars: { sign: 4, degree: 15 } });
  const r = resultFor(chart, "chandra-mangal");
  assert.strictEqual(r.present, true, "Chandra-Mangal: Moon/Mars conjunct must be present");
  assert.strictEqual(r.strength, undefined, "binary yoga: no strength reported");
}

// Default baseline (Moon Cancer(4), Mars Aries(1)) -> not conjunct -> absent.
{
  const chart = syntheticChart(1, {});
  const r = resultFor(chart, "chandra-mangal");
  assert.strictEqual(r.present, false, "Chandra-Mangal: Moon/Mars not conjunct must be absent");
}

// =======================================================================
// 9. Kemadruma Yoga
// =======================================================================
// Moon in Cancer(4): 2nd-from-Moon=Leo(5), 12th-from-Moon=Gemini(3),
// Kendra-from-Moon(4th/7th/10th)=Libra(7)/Capricorn(10)/Aries(1). Every
// other classical planet placed OUTSIDE all of {1,3,4,5,7,10} (at
// 2/6/8/9/11/12) so the base dosha forms (no occupant of the 2nd/12th
// from Moon, no conjunction with Moon, and — verified by hand above —
// none of these placements' 7th/special Parashari aspects land back on
// Moon's own sign(4) either).

// Ascendant Taurus(2) -> Moon's house = signHouseNumber(2,4) = 3, NOT a
// Kendra from the Ascendant, and no other planet sits in a Kendra from
// Moon -> both cancellations absent -> Kemadruma genuinely PRESENT.
{
  const overrides = {
    Sun: { sign: 2, degree: 15 },
    Mars: { sign: 6, degree: 15 },
    Mercury: { sign: 8, degree: 15 },
    Jupiter: { sign: 9, degree: 15 },
    Venus: { sign: 11, degree: 15 },
    Saturn: { sign: 12, degree: 15 },
  };
  const ascendantSign = 2;
  const moonHouse = signHouseNumber(ascendantSign, 4);
  assert.ok(![1, 4, 7, 10].includes(moonHouse), "test setup: Moon must NOT be in a Kendra from this Ascendant");
  const chart = syntheticChart(ascendantSign, overrides);
  const r = resultFor(chart, "kemadruma");
  assert.strictEqual(r.present, true, "Kemadruma: isolated, uncancelled Moon must be present");
  assert.strictEqual(r.strength, undefined, "binary yoga: no strength reported");
}

// Same planet placements, but Ascendant Aries(1) -> Moon's house =
// signHouseNumber(1,4) = 4, a KENDRA from the Ascendant -> cancellation
// (a) applies -> absent despite the dosha otherwise being "formed".
{
  const overrides = {
    Sun: { sign: 2, degree: 15 },
    Mars: { sign: 6, degree: 15 },
    Mercury: { sign: 8, degree: 15 },
    Jupiter: { sign: 9, degree: 15 },
    Venus: { sign: 11, degree: 15 },
    Saturn: { sign: 12, degree: 15 },
  };
  const chart = syntheticChart(1, overrides);
  const r = resultFor(chart, "kemadruma");
  assert.strictEqual(r.present, false, "Kemadruma: Moon in Kendra from Ascendant must cancel the dosha");
}

// Default baseline (Sun default in Leo(5) = the 2nd sign from Moon's
// Cancer(4)) -> the 2nd-from-Moon is occupied -> dosha never formed -> absent.
{
  const chart = syntheticChart(1, {});
  const r = resultFor(chart, "kemadruma");
  assert.strictEqual(r.present, false, "Kemadruma: 2nd-from-Moon occupied (default baseline) must be absent");
}

// =======================================================================
// 10. Amala Yoga
// =======================================================================

// Jupiter in Capricorn(10), Ascendant Aries(1) -> house 10 -> present.
{
  const chart = syntheticChart(1, { Jupiter: { sign: 10, degree: 15 } });
  const r = resultFor(chart, "amala-yoga");
  assert.strictEqual(r.present, true, "Amala: benefic in the 10th from Lagna must be present");
  assert.strictEqual(r.strength, undefined, "binary yoga: no strength reported");
}

// Default baseline: no natural benefic (Jupiter/Venus/Mercury/waxing
// Moon) sits in the 10th from either Lagna or the Moon -> absent.
{
  const chart = syntheticChart(1, {});
  const r = resultFor(chart, "amala-yoga");
  assert.strictEqual(r.present, false, "Amala: no benefic in the 10th from Lagna or Moon must be absent");
}

// =======================================================================
// 11. Vasumati Yoga
// =======================================================================
// Ascendant Aries(1): house number = sign number.

// All three benefics in Upachaya houses (Jupiter->3rd, Venus->6th,
// Mercury->10th) -> present, "strong" (all 3 qualify).
{
  const chart = syntheticChart(1, {
    Jupiter: { sign: 3, degree: 15 },
    Venus: { sign: 6, degree: 15 },
    Mercury: { sign: 10, degree: 15 },
  });
  const r = resultFor(chart, "vasumati-yoga");
  assert.strictEqual(r.present, true, "Vasumati: all 3 benefics in Upachaya must be present");
  assert.strictEqual(r.strength, "strong", "Vasumati: 3 qualifying benefics grades strong");
}

// None of the 3 benefics in an Upachaya house from Lagna or Moon
// (Jupiter->5th, Venus->7th, Mercury->8th; verified against Moon's
// Cancer(4) Upachaya-from-Moon set {1,2,6,9} too) -> absent.
{
  const chart = syntheticChart(1, {
    Jupiter: { sign: 5, degree: 15 },
    Venus: { sign: 7, degree: 15 },
    Mercury: { sign: 8, degree: 15 },
  });
  const r = resultFor(chart, "vasumati-yoga");
  assert.strictEqual(r.present, false, "Vasumati: no benefic in Upachaya from Lagna or Moon must be absent");
  assert.strictEqual(r.strength, undefined, "absent yoga must not report a strength");
}

// =======================================================================
// 12. Parivartana Yoga (base + Maha / Kahala / Dainya)
// =======================================================================
// Ascendant Aries(1): house number = sign number, so house-lords are
// read directly off SIGN_LORD (Moon/4, Venus/2,7, Mercury/3,6,
// Sun/5, Mars/1,8, Jupiter/9,12, Saturn/10,11).

// Maha: Moon (lord of house 4, a Kendra) <-> Venus (lord of house 7, a
// Kendra) exchange signs (Moon in Venus's Libra(7), Venus in Moon's
// Cancer(4)) -> both houses (4,7) are in the Maha house-set -> present.
{
  const chart = syntheticChart(1, { Moon: { sign: 7, degree: 15 }, Venus: { sign: 4, degree: 15 } });
  assert.strictEqual(resultFor(chart, "parivartana-yoga").present, true, "Parivartana (base): a genuine exchange must be present");
  assert.strictEqual(resultFor(chart, "parivartana-maha").present, true, "Maha Parivartana: Kendra<->Kendra lord exchange must be present");
}

// Kahala / Dainya: Sun (lord of house 5, in the Maha set) <-> Mercury
// (lord of houses 3 AND 6) exchange signs (Sun in Mercury's Gemini(3),
// Mercury in Sun's Leo(5)). This forms TWO house-pairs simultaneously
// (Mercury rules both 3 and 6): (3,5) -> 3rd lord + Maha-set lord ->
// Kahala; (5,6) -> Maha-set lord + Dusthana(6) lord -> Dainya. Both
// named sub-yogas are therefore genuinely present together in this
// chart (a real, documented consequence of Mercury owning 2 signs —
// see this module's Parivartana doc comment).
{
  const chart = syntheticChart(1, { Sun: { sign: 3, degree: 15 }, Mercury: { sign: 5, degree: 15 } });
  assert.strictEqual(resultFor(chart, "parivartana-kahala").present, true, "Kahala Parivartana: 3rd-lord exchange with a Maha-set lord must be present");
  assert.strictEqual(resultFor(chart, "parivartana-dainya").present, true, "Dainya Parivartana: Dusthana-lord exchange with a non-Dusthana lord must be present");
}

// Default baseline (every planet in its own primary sign, no exchange
// anywhere) -> all 4 Parivartana rules absent.
{
  const chart = syntheticChart(1, {});
  assert.strictEqual(resultFor(chart, "parivartana-yoga").present, false, "Parivartana (base): no exchange in the default baseline");
  assert.strictEqual(resultFor(chart, "parivartana-maha").present, false, "Maha Parivartana: absent in the default baseline");
  assert.strictEqual(resultFor(chart, "parivartana-kahala").present, false, "Kahala Parivartana: absent in the default baseline");
  assert.strictEqual(resultFor(chart, "parivartana-dainya").present, false, "Dainya Parivartana: absent in the default baseline");
}

// =======================================================================
// 13. Shubha-Kartari Yoga / Papa-Kartari Yoga
// =======================================================================
// Ascendant Aries(1): 2nd sign = Taurus(2), 12th sign = Pisces(12).

// Shubha Kartari: Jupiter alone in the 2nd (Taurus), Venus alone in the
// 12th (Pisces) — Ketu moved off Pisces(12), its default placement, so
// it doesn't co-occupy the 12th and break the "only benefics" test —
// both hemming signs occupied ONLY by natural benefics -> present.
{
  const chart = syntheticChart(1, { Jupiter: { sign: 2, degree: 15 }, Venus: { sign: 12, degree: 15 }, Ketu: { sign: 6, degree: 15 } });
  const r = resultFor(chart, "shubha-kartari");
  assert.strictEqual(r.present, true, "Shubha-Kartari: Lagna hemmed by only benefics must be present");
  assert.strictEqual(r.strength, undefined, "binary yoga: no strength reported");
}

// Papa Kartari: Mars alone in the 2nd, Saturn (+ Ketu, also a natural
// malefic) in the 12th — Venus moved off Taurus(2), its default
// placement, so the 2nd is hemmed by only malefics -> present.
{
  const chart = syntheticChart(1, { Mars: { sign: 2, degree: 15 }, Venus: { sign: 7, degree: 15 }, Saturn: { sign: 12, degree: 15 } });
  const r = resultFor(chart, "papa-kartari");
  assert.strictEqual(r.present, true, "Papa-Kartari: Lagna hemmed by only malefics must be present");
}

// Default baseline: Venus (a benefic) occupies the 2nd by default, and
// Ketu (a malefic) the 12th by default -> mixed nature on each side ->
// both Shubha and Papa Kartari absent.
{
  const chart = syntheticChart(1, {});
  assert.strictEqual(resultFor(chart, "shubha-kartari").present, false, "Shubha-Kartari: malefic (Ketu) present in the 12th must be absent");
  assert.strictEqual(resultFor(chart, "papa-kartari").present, false, "Papa-Kartari: benefic (Venus) present in the 2nd must be absent");
}

// =======================================================================
// 14. Adhi Yoga
// =======================================================================
// Moon in Cancer(4): 6th/7th/8th-from-Moon = Virgo(9)/Libra(10)/Scorpio(11).

// Default baseline: Jupiter already sits in Sagittarius(9) (its own
// sign, 6th-from-Moon) while Venus(2)/Mercury(3) do not -> exactly 1
// qualifying benefic -> present, "weak".
{
  const chart = syntheticChart(1, {});
  const r = resultFor(chart, "adhi-yoga");
  assert.strictEqual(r.present, true, "Adhi: 1 benefic in the 6th/7th/8th from Moon (default baseline) must be present");
  assert.strictEqual(r.strength, "weak", "Adhi: exactly 1 qualifying benefic grades weak");
}

// All 3 benefics placed across the 6th/7th/8th from Moon (Jupiter stays
// in Sagittarius(9), Venus moved to Libra(10), Mercury moved to
// Scorpio(11)) -> present, "strong".
{
  const chart = syntheticChart(1, { Venus: { sign: 10, degree: 15 }, Mercury: { sign: 11, degree: 15 } });
  const r = resultFor(chart, "adhi-yoga");
  assert.strictEqual(r.present, true, "Adhi: all 3 benefics in the 6th/7th/8th from Moon must be present");
  assert.strictEqual(r.strength, "strong", "Adhi: 3 qualifying benefics grades strong");
}

// None of the 3 benefics in the 6th/7th/8th from Moon (all moved to
// Taurus(2)) -> absent.
{
  const chart = syntheticChart(1, {
    Jupiter: { sign: 2, degree: 15 },
    Venus: { sign: 2, degree: 15 },
    Mercury: { sign: 2, degree: 15 },
  });
  const r = resultFor(chart, "adhi-yoga");
  assert.strictEqual(r.present, false, "Adhi: no benefic in the 6th/7th/8th from Moon must be absent");
  assert.strictEqual(r.strength, undefined, "absent yoga must not report a strength");
}

// =======================================================================
// Registry-wide robustness: no rule ever throws, across a sweep of 10+
// real charts (varied birth dates/locations), and every result carries
// a valid boolean `present`.
// =======================================================================

const REAL_CHART_INPUTS: { utc: Date; lat: number; lon: number }[] = [
  { utc: new Date("1990-08-15T05:00:00Z"), lat: 28.6139, lon: 77.209 }, // New Delhi
  { utc: new Date("2000-01-01T12:00:00Z"), lat: 19.076, lon: 72.8777 }, // Mumbai
  { utc: new Date("1985-06-21T18:30:00Z"), lat: 51.5074, lon: -0.1278 }, // London
  { utc: new Date("1975-11-03T09:05:00Z"), lat: 13.0827, lon: 80.2707 }, // Chennai
  { utc: new Date("2001-04-30T20:15:00Z"), lat: 22.5726, lon: 88.3639 }, // Kolkata
  { utc: new Date("1960-02-29T00:00:00Z"), lat: 12.9716, lon: 77.5946 }, // Bengaluru (leap day)
  { utc: new Date("1945-08-15T00:00:00Z"), lat: 26.9124, lon: 75.7873 }, // Jaipur, pre-1947
  { utc: new Date("2020-12-31T23:59:00Z"), lat: 40.7128, lon: -74.006 }, // New York
  { utc: new Date("1999-07-04T06:00:00Z"), lat: 35.6762, lon: 139.6503 }, // Tokyo
  { utc: new Date("2010-03-21T15:45:00Z"), lat: -33.8688, lon: 151.2093 }, // Sydney
  { utc: new Date("1933-05-10T02:20:00Z"), lat: 55.7558, lon: 37.6173 }, // Moscow
  { utc: new Date("2015-09-23T11:11:00Z"), lat: 25.2048, lon: 55.2708 }, // Dubai
];

assert.ok(REAL_CHART_INPUTS.length >= 10, "need at least 10 real charts for the sweep");

const realCharts: ChartData[] = REAL_CHART_INPUTS.map((i) => calculateChart(i.utc, i.lat, i.lon));

for (const chart of realCharts) {
  const results = detectYogas(chart);
  assert.strictEqual(results.length, YOGA_REGISTRY.length, "detectYogas must return exactly one result per registered rule");
  for (const r of results) {
    assert.strictEqual(typeof r.present, "boolean", `${r.ruleId}: present must be a boolean`);
    if (r.strength !== undefined) {
      assert.ok(["weak", "moderate", "strong"].includes(r.strength), `${r.ruleId}: strength must be weak/moderate/strong when present`);
    }
    if (!r.present) {
      assert.strictEqual(r.strength, undefined, `${r.ruleId}: an absent yoga must never carry a strength`);
    }
  }
}

// ---------------------------------------------------------------------
// Determinism: re-running detectYogas on the same chart (including a
// freshly recomputed chart from the same inputs) must yield identical
// results every time.
// ---------------------------------------------------------------------

for (const input of REAL_CHART_INPUTS.slice(0, 3)) {
  const chartA = calculateChart(input.utc, input.lat, input.lon);
  const chartB = calculateChart(input.utc, input.lat, input.lon);
  const resultsA = detectYogas(chartA);
  const resultsB = detectYogas(chartB);
  const resultsA2 = detectYogas(chartA);
  assert.deepStrictEqual(resultsA, resultsB, "detectYogas must be deterministic across independently-recomputed identical charts");
  assert.deepStrictEqual(resultsA, resultsA2, "detectYogas must be deterministic across repeated calls on the same chart object");
}

console.log(`yogas.test.ts: all assertions passed (${YOGA_REGISTRY.length} rules registered, ${realCharts.length} real charts swept)`);
