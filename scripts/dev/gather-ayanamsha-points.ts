// scripts/dev/gather-ayanamsha-points.ts
// One-off data-gathering script (not part of the permanent test suite):
// calls the REAL FreeAstrologyAPI to get the Sun's sidereal (Lahiri)
// ecliptic longitude at a spread of UTC instants from 1900 to 2030,
// then independently computes the Sun's TROPICAL geocentric ecliptic
// longitude locally (astronomy-engine, VSOP87 — no network call), and
// takes the difference: ayanamsha_true = tropical - sidereal(API).
// This isolates the true Lahiri ayanamsha at each instant without
// depending on this repo's own (buggy) lahiriAyanamsha() at all.
//
// All instants are requested at 12:00:00 UTC with timezone offset 0
// (BirthInput.timezone=0, hours=12) specifically so there is no
// historical-UTC-offset ambiguity (see the "Use historically correct
// India UTC offset for pre-1945 births" commit) — this script always
// means true UTC noon, nothing else. Location is New Delhi
// (28.6139, 77.2090) but for the Sun specifically topocentric vs
// geocentric parallax is <0.003°, negligible for this purpose.
//
// Usage: node --env-file=.env.local scripts/dev/gather-ayanamsha-points.ts
import * as Astronomy from "astronomy-engine";
import { getPlanetPositions } from "../../src/lib/astrology/freeastrologyapi.ts";

const LATITUDE = 28.6139;
const LONGITUDE = 77.209;

function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function localTropicalSunLongitude(date: Date): number {
  const time = Astronomy.MakeTime(date);
  const observer = new Astronomy.Observer(LATITUDE, LONGITUDE, 0);
  const equatorOfDate = Astronomy.Equator(Astronomy.Body.Sun, time, observer, true, true);
  const ecliptic = Astronomy.Ecliptic(equatorOfDate.vec);
  return normalizeDegrees(ecliptic.elon);
}

const TEST_DATES: { label: string; year: number; month: number; date: number }[] = [
  { label: "1900-01-01T12:00:00Z", year: 1900, month: 1, date: 1 },
  { label: "1930-01-01T12:00:00Z", year: 1930, month: 1, date: 1 },
  { label: "1960-01-01T12:00:00Z", year: 1960, month: 1, date: 1 },
  { label: "1990-01-01T12:00:00Z", year: 1990, month: 1, date: 1 },
  { label: "2000-01-01T12:00:00Z", year: 2000, month: 1, date: 1 },
  { label: "2010-01-01T12:00:00Z", year: 2010, month: 1, date: 1 },
  { label: "2020-01-01T12:00:00Z", year: 2020, month: 1, date: 1 },
  { label: "2026-01-01T12:00:00Z", year: 2026, month: 1, date: 1 },
  { label: "2030-01-01T12:00:00Z", year: 2030, month: 1, date: 1 },
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const results: { label: string; year: number; t: number; sunSidereal: number; sunTropical: number; ayanamsha: number }[] = [];

  for (const { label, year, month, date } of TEST_DATES) {
    const jsDate = new Date(Date.UTC(year, month - 1, date, 12, 0, 0));
    let sunSidereal: number;
    try {
      const res = await getPlanetPositions({
        year,
        month,
        date,
        hours: 12,
        minutes: 0,
        seconds: 0,
        latitude: LATITUDE,
        longitude: LONGITUDE,
        timezone: 0,
      });
      const sunEntry = res.output.Sun;
      if (!sunEntry) throw new Error("No Sun entry in response: " + JSON.stringify(res));
      sunSidereal = sunEntry.fullDegree;
    } catch (err) {
      console.error(`FAILED for ${label}:`, err instanceof Error ? err.message : err);
      await sleep(4000);
      continue;
    }
    await sleep(4000);

    const sunTropical = localTropicalSunLongitude(jsDate);
    // ayanamsha = tropical - sidereal, normalized into the ~[20,30] range
    // this quantity actually lives in.
    let ayanamsha = normalizeDegrees(sunTropical - sunSidereal);
    if (ayanamsha > 180) ayanamsha -= 360;

    const t = (jsDate.getTime() - Date.UTC(2000, 0, 1, 11, 58, 55, 816)) / 86_400_000 / 36525;

    results.push({ label, year, t, sunSidereal, sunTropical, ayanamsha });
    console.log(
      `${label}: API sidereal Sun=${sunSidereal.toFixed(4)}  local tropical Sun=${sunTropical.toFixed(4)}  => ayanamsha=${ayanamsha.toFixed(4)}  (T=${t.toFixed(6)})`
    );
  }

  console.log("\n--- Least-squares fit: ayanamsha(T) = A + B*T + C*T^2 ---");
  // Simple polynomial least-squares via normal equations (3x3 system).
  const n = results.length;
  const sums = { T0: n, T1: 0, T2: 0, T3: 0, T4: 0, Y0: 0, Y1: 0, Y2: 0 };
  for (const r of results) {
    const T = r.t;
    const Y = r.ayanamsha;
    sums.T1 += T;
    sums.T2 += T * T;
    sums.T3 += T * T * T;
    sums.T4 += T * T * T * T;
    sums.Y0 += Y;
    sums.Y1 += Y * T;
    sums.Y2 += Y * T * T;
  }
  // Solve [ [n,T1,T2],[T1,T2,T3],[T2,T3,T4] ] * [A,B,C]^T = [Y0,Y1,Y2]^T
  const M = [
    [sums.T0, sums.T1, sums.T2],
    [sums.T1, sums.T2, sums.T3],
    [sums.T2, sums.T3, sums.T4],
  ];
  const V = [sums.Y0, sums.Y1, sums.Y2];
  // Gaussian elimination
  for (let i = 0; i < 3; i++) {
    let pivot = i;
    for (let k = i + 1; k < 3; k++) if (Math.abs(M[k][i]) > Math.abs(M[pivot][i])) pivot = k;
    [M[i], M[pivot]] = [M[pivot], M[i]];
    [V[i], V[pivot]] = [V[pivot], V[i]];
    for (let k = i + 1; k < 3; k++) {
      const f = M[k][i] / M[i][i];
      for (let j = i; j < 3; j++) M[k][j] -= f * M[i][j];
      V[k] -= f * V[i];
    }
  }
  const C = V[2] / M[2][2];
  const B = (V[1] - M[1][2] * C) / M[1][1];
  const A = (V[0] - M[0][1] * B - M[0][2] * C) / M[0][0];
  console.log(`A (ayanamsha at J2000, degrees) = ${A.toFixed(6)}`);
  console.log(`B (linear, degrees/century)     = ${B.toFixed(6)}  (=${(B * 3600).toFixed(3)} arcsec/century)`);
  console.log(`C (quadratic, degrees/century^2) = ${C.toFixed(6)}  (=${(C * 3600).toFixed(3)} arcsec/century^2)`);

  console.log("\n--- Residuals of fit vs data ---");
  for (const r of results) {
    const predicted = A + B * r.t + C * r.t * r.t;
    console.log(`${r.label}: actual=${r.ayanamsha.toFixed(4)} predicted=${predicted.toFixed(4)} residual=${(r.ayanamsha - predicted).toFixed(4)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
