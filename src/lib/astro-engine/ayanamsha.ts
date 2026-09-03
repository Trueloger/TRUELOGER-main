// src/lib/astro-engine/ayanamsha.ts
// Lahiri (Chitrapaksha) ayanamsha — the sidereal-zodiac correction
// subtracted from a tropical ecliptic longitude to get a Vedic
// (sidereal) longitude. Pure math, no external calls.
//
// Reference epoch / value:
// The International Convention on Rectification and Correction (ICRC)
// standardized the Lahiri ayanamsha at Julian Day 2451545.0 (J2000.0,
// 2000 Jan 1.5 TT) as exactly 23.853222° — the value modern
// re-implementations of Swiss Ephemeris's SE_SIDM_LAHIRI (the de facto
// standard other Vedic software calibrates against) converge on for
// that epoch. Sources:
//   - "Ayanāṃśa" reference article (Lahiri/Chitrapaksha section, ICRC
//     J2000.0 standardization, 23.853222°):
//     https://grokipedia.com/page/Ayan%C4%81%E1%B9%83%C5%9Ba
//   - XALEN Ephemeris docs, describing a Swiss-Ephemeris-compatible
//     sidereal mode pinned at JD 2451545.0 to exactly 23.853222°:
//     https://vedika.io/blog/swiss-ephemeris-api-accuracy-guide
// This constant was additionally CALIBRATED against a real verified
// FreeAstrologyAPI data point in scripts/dev/verify-astro-engine.ts
// (New Delhi, 1990-08-15T05:00:00Z birth moment: expected sidereal
// Moon longitude ≈ 48.30°, this implementation yields ≈48.17°, a
// ~0.13° residual well inside the documented ~0.5° tolerance for
// differences between "Lahiri" flavors).
const LAHIRI_AYANAMSHA_AT_J2000_DEGREES = 23.853222;

// Precession rate:
// General precession in ecliptic longitude, IAU 2006 precession
// model (Capitaine et al. 2003 / IAU Resolution B1, as adopted in the
// IAU SOFA/ERFA precession-nutation model), expressed as a polynomial
// in T (Julian centuries of Terrestrial Time since J2000.0):
//   p_A(T) = 5028.796"·T + 1.105"·T²   (+ higher-order terms, negligible
//                                        over any realistic birth-date range)
// giving a rate of ~50.28796 arcsec/year at J2000, consistent with the
// well-established ~50.29 arcsec/year lunisolar precession figure.
// Source: IAU 2006 precession theory summary (general precession in
// longitude, 5028.796"/century at J2000.0):
//   https://arxiv.org/pdf/astro-ph/0602086 (IAU Resolutions on
//   Astronomical Reference Systems, Time Scales and Earth Rotation
//   Models)
const PRECESSION_LINEAR_ARCSEC_PER_CENTURY = 5028.796;
const PRECESSION_QUADRATIC_ARCSEC_PER_CENTURY = 1.105;

const ARCSEC_PER_DEGREE = 3600;
const J2000_EPOCH_MS = Date.UTC(2000, 0, 1, 11, 58, 55, 816); // 2000-01-01T12:00:00 TT ≈ this UTC instant
const DAYS_PER_JULIAN_CENTURY = 36525;
const MS_PER_DAY = 86_400_000;

/**
 * Lahiri (Chitrapaksha) ayanamsha at a given UTC instant, in degrees.
 * Subtract this from a tropical ecliptic longitude to get the
 * sidereal (Vedic) longitude: `sidereal = ((tropical - ayanamsha) %
 * 360 + 360) % 360`.
 *
 * Implementation note: Terrestrial Time (TT) vs UTC differs by
 * ~60-70 seconds (ΔT) over the range of birth dates this project
 * deals with — utterly negligible for a quantity that moves ~50
 * arcsec/*year*, so this function uses the UTC instant directly as a
 * TT proxy rather than pulling in a ΔT model.
 */
export function lahiriAyanamsha(date: Date): number {
  const centuriesSinceJ2000 = (date.getTime() - J2000_EPOCH_MS) / MS_PER_DAY / DAYS_PER_JULIAN_CENTURY;
  const t = centuriesSinceJ2000;
  const precessionArcsec =
    PRECESSION_LINEAR_ARCSEC_PER_CENTURY * t + PRECESSION_QUADRATIC_ARCSEC_PER_CENTURY * t * t;
  return LAHIRI_AYANAMSHA_AT_J2000_DEGREES + precessionArcsec / ARCSEC_PER_DEGREE;
}
