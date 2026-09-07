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
//
// ---------------------------------------------------------------------
// CALIBRATION HISTORY — read this before touching the constants below.
// ---------------------------------------------------------------------
//
// Round 1 (discarded): an earlier agent attempt gathered 9 Sun-based
// ayanamsha points from live FreeAstrologyAPI spanning 1900-2030 (see
// scripts/dev/gather-ayanamsha-points.ts, kept in the repo as a
// template) and fit a quadratic. That fit's rate came out to ~100.9
// arcsec/year — ~double the well-attested ~50.2-50.3"/yr Lahiri rate —
// and was (at the time) blamed on FreeAstrologyAPI's ephemeris being
// unreliable for pre-1970 dates, which would have poisoned the fit.
//
// Round 2 (this investigation) re-ran the same style of gather,
// restricted to ONLY 1975-2035 (every 5 years, UTC noon,
// timezone:0) — dates the previous round assumed were trustworthy.
// The fitted rate came out to ~100.5 arcsec/year again — essentially
// unchanged from Round 1, and still ~2x the correct rate, DESPITE
// excluding every pre-1970 point. This falsified the Round-1 root
// cause: the problem was never specific to old dates.
//
// Cross-validating against THREE independent, non-FreeAstrologyAPI
// sources (the ICRC/Swiss-Ephemeris J2000.0 anchor above; published
// year-by-year Lahiri tables from jagannathhora.com, 1975-2035;
// jagannathhora.com's live 2026-01-01 value) showed this repo's
// EXISTING formula (unchanged constants below) already tracks
// published Lahiri ayanamsha to within ~15-30 arcsec across the whole
// 1975-2035 range — i.e. it was already correct, comfortably inside
// the documented ~0.5° cross-"flavor" tolerance and inside this task's
// own 0.05° literature-agreement gate. A literature-only linear
// least-squares refit (13 published points, no API data) independently
// recovered A=23.857537° at J2000 and a rate of 50.2844"/yr — 15
// arcsec and 0.004"/yr away from the constants below, i.e. noise at
// the precision the published table is even quoted to. There was
// nothing here worth "fixing": the ayanamsha model in this file was
// never the bug.
//
// So why did the task's own two ground-truth checkpoints (New Delhi
// 1990-08-15T05:00:00Z: engine Moon sidereal ~0.13° too large vs.
// FreeAstrologyAPI; 2026-01-14T09:43:00Z Makar Sankranti instant:
// engine Sun sidereal ~0.36° too small vs. FreeAstrologyAPI) show a
// sign-flipped, magnitude-growing-with-|T| residual at all? Two
// candidate explanations were both live at that point: (a)
// FreeAstrologyAPI's own "lahiri" sidereal computation has a rate bug,
// or (b) this repo's TROPICAL longitude computation (upstream of the
// ayanamsha subtraction entirely) has a T-dependent bug. Isolating the
// two: computing the Sun's tropical longitude at 1975/2035 via three
// independent methods inside astronomy-engine — `SunPosition` (a
// dedicated, purely geocentric formula), `GeoVector`+`Ecliptic`
// (geocentric, no observer), and this module's own topocentric
// `Equator`+`Ecliptic` pairing (see ephemeris.ts's
// `topocentricTropicalLongitude`) — showed the first two AGREE with
// each other to <0.01° with NO secular drift, while the THIRD (this
// repo's actual code path) diverged from them by the same ~0.35-0.5°,
// same-sign-flipping-through-J2000 pattern as the ground-truth
// residuals above. That pinned the real bug to
// `topocentricTropicalLongitude` in ephemeris.ts: it fed an
// already-equator-of-date vector (`Astronomy.Equator(..., ofdate=true,
// ...)`) into `Astronomy.Ecliptic()`, which itself expects a J2000
// (EQJ) vector and internally re-applies precession+nutation to reach
// the date — i.e. precession was silently applied TWICE. That bug (a)
// exactly cancels at T=0 (J2000) — which is why this file's constants,
// fit or cross-checked against anything anchored near 2000, always
// looked almost right — and (b) grows ~linearly with distance from
// J2000 in a sign that flips across it — which is EXACTLY the
// signature both the discarded Round-1 quadratic fit and the two
// ground-truth checkpoints were actually seeing. See ephemeris.ts's
// `topocentricTropicalLongitude` doc comment for the fix and the full
// numeric verification (both ground-truth checkpoints reproduce the
// live FreeAstrologyAPI values to <0.005° once the double-precession
// bug is fixed there, using this file's constants COMPLETELY
// UNCHANGED).
//
// Bottom line: FreeAstrologyAPI's ayanamsha itself may or may not also
// have issues (its Round-1/Round-2 fitted rate of ~100"/yr is
// consistent with it independently having the same class of bug, or
// with it simply being unreliable — this was never fully isolated
// because ephemeris.ts's bug was sufficient to explain 100% of the
// observed discrepancy and was fixed first) — but it no longer matters
// for calibrating THIS file, because the literature cross-validation
// above stands on its own, independent of FreeAstrologyAPI entirely.
// Do not re-fit these constants against raw FreeAstrologyAPI sidereal
// output without FIRST cross-validating every point against an
// independently published Lahiri reference (not just this project's
// own ephemeris) — that check is what caught this the second time.
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
