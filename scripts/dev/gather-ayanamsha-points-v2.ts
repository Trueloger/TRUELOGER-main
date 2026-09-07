// scripts/dev/gather-ayanamsha-points-v2.ts
// Re-calibration of Lahiri ayanamsha, restricted to 1975-2035 (the
// previous attempt in gather-ayanamsha-points.ts included 1900-1960
// points, whose FreeAstrologyAPI ephemeris is unreliable and poisoned
// a quadratic fit to ~100.9"/yr — see ayanamsha.ts doc comment).
//
// Usage: node --env-file=.env.local scripts/dev/gather-ayanamsha-points-v2.ts
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

const YEARS = [1975, 1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025, 2030, 2035];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const results: { label: string; year: number; t: number; sunSidereal: number; sunTropical: number; ayanamsha: number }[] = [];

  for (const year of YEARS) {
    const label = `${year}-01-01T12:00:00Z`;
    const jsDate = new Date(Date.UTC(year, 0, 1, 12, 0, 0));
    let sunSidereal: number;
    try {
      const res = await getPlanetPositions({
        year,
        month: 1,
        date: 1,
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
    let ayanamsha = normalizeDegrees(sunTropical - sunSidereal);
    if (ayanamsha > 180) ayanamsha -= 360;

    const t = (jsDate.getTime() - Date.UTC(2000, 0, 1, 11, 58, 55, 816)) / 86_400_000 / 36525;

    results.push({ label, year, t, sunSidereal, sunTropical, ayanamsha });
    console.log(
      `${label}: API sidereal Sun=${sunSidereal.toFixed(4)}  local tropical Sun=${sunTropical.toFixed(4)}  => ayanamsha=${ayanamsha.toFixed(4)}  (T=${t.toFixed(6)})`
    );
  }

  console.log("\n--- Linear least-squares fit: ayanamsha(T) = A + B*T ---");
  const n = results.length;
  let sumT = 0, sumT2 = 0, sumY = 0, sumTY = 0;
  for (const r of results) {
    sumT += r.t;
    sumT2 += r.t * r.t;
    sumY += r.ayanamsha;
    sumTY += r.t * r.ayanamsha;
  }
  const B = (n * sumTY - sumT * sumY) / (n * sumT2 - sumT * sumT);
  const A = (sumY - B * sumT) / n;
  console.log(`A (ayanamsha at J2000, degrees) = ${A.toFixed(6)}`);
  console.log(`B (linear, degrees/century)     = ${B.toFixed(6)}  (=${(B * 3600 / 100).toFixed(4)} arcsec/year)`);

  console.log("\n--- Residuals of linear fit vs data ---");
  for (const r of results) {
    const predicted = A + B * r.t;
    console.log(`${r.label}: actual=${r.ayanamsha.toFixed(4)} predicted=${predicted.toFixed(4)} residual=${((r.ayanamsha - predicted) * 3600).toFixed(1)}"`);
  }

  console.log("\n--- Quadratic least-squares fit: ayanamsha(T) = A + B*T + C*T^2 ---");
  const sums = { T0: n, T1: sumT, T2: sumT2, T3: 0, T4: 0, Y0: sumY, Y1: sumTY, Y2: 0 };
  for (const r of results) {
    sums.T3 += r.t ** 3;
    sums.T4 += r.t ** 4;
    sums.Y2 += r.ayanamsha * r.t * r.t;
  }
  const M = [
    [sums.T0, sums.T1, sums.T2],
    [sums.T1, sums.T2, sums.T3],
    [sums.T2, sums.T3, sums.T4],
  ];
  const V = [sums.Y0, sums.Y1, sums.Y2];
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
  const Cq = V[2] / M[2][2];
  const Bq = (V[1] - M[1][2] * Cq) / M[1][1];
  const Aq = (V[0] - M[0][1] * Bq - M[0][2] * Cq) / M[0][0];
  console.log(`A = ${Aq.toFixed(6)}  B = ${Bq.toFixed(6)} deg/century (${(Bq * 36).toFixed(3)} "/yr)  C = ${Cq.toFixed(6)} deg/century^2`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
