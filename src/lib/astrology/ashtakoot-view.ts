// src/lib/astrology/ashtakoot-view.ts
// Pure, isomorphic (safe to import from either a "use client" form
// component or a server route) view-model builder for a real
// AshtakootMatchResult["output"]. Kundli Matching and Compatibility
// render the exact same 8-koota breakdown from the exact same
// calculation (see each tool's route.ts top comment for the
// shared-calculation decision) — this is the one place that translates
// the API's real, sometimes oddly-named per-koota fields (see
// types.ts's comments — e.g. the Gana koota's bride/groom sub-fields
// are actually named "*_nadi"/"*_nadi_name", a genuine API quirk) into
// one consistent row shape both tools' Form components render
// identically. Only the headings/copy AROUND this table differ per
// tool; the numbers and labels inside it never do — every value below
// is read straight off the real API response, never invented.
import type { AshtakootMatchResult } from "./types.ts";

export type KootaRow = {
  key: string;
  label: string;
  score: number;
  outOf: number;
  /** What the "female"/bride API role has for this koota — a moon
   * sign, nakshatra, or similar, whatever that koota compares. */
  personA: string;
  /** Same, for the "male"/groom API role. */
  personB: string;
};

/** Builds the 8 traditional Ashtakoot kootas, in their standard
 * ascending max-score order (Varna /1, Vashya /2, Tara /3, Yoni /4,
 * Graha Maitri /5, Gana /6, Bhakoot /7, Nadi /8 — summing to /36), from
 * a real AshtakootMatchResult["output"]. */
export function buildKootaRows(output: AshtakootMatchResult["output"]): KootaRow[] {
  return [
    {
      key: "varna",
      label: "Varna",
      score: output.varna_kootam.score,
      outOf: output.varna_kootam.out_of,
      personA: output.varna_kootam.bride.varnam_name,
      personB: output.varna_kootam.groom.varnam_name,
    },
    {
      key: "vashya",
      label: "Vashya",
      score: output.vasya_kootam.score,
      outOf: output.vasya_kootam.out_of,
      personA: output.vasya_kootam.bride.bride_kootam_name,
      personB: output.vasya_kootam.groom.groom_kootam_name,
    },
    {
      key: "tara",
      label: "Tara",
      score: output.tara_kootam.score,
      outOf: output.tara_kootam.out_of,
      personA: output.tara_kootam.bride.star_name,
      personB: output.tara_kootam.groom.star_name,
    },
    {
      key: "yoni",
      label: "Yoni",
      score: output.yoni_kootam.score,
      outOf: output.yoni_kootam.out_of,
      personA: output.yoni_kootam.bride.yoni,
      personB: output.yoni_kootam.groom.yoni,
    },
    {
      key: "graha-maitri",
      label: "Graha Maitri",
      score: output.graha_maitri_kootam.score,
      outOf: output.graha_maitri_kootam.out_of,
      personA: output.graha_maitri_kootam.bride.moon_sign,
      personB: output.graha_maitri_kootam.groom.moon_sign,
    },
    {
      key: "gana",
      label: "Gana",
      score: output.gana_kootam.score,
      outOf: output.gana_kootam.out_of,
      // Real API quirk (see types.ts): this koota's bride/groom
      // sub-fields are named "*_nadi"/"*_nadi_name" despite being the
      // Gana koota, not the separate Nadi koota below.
      personA: output.gana_kootam.bride.bride_nadi_name,
      personB: output.gana_kootam.groom.groom_nadi_name,
    },
    {
      key: "bhakoot",
      label: "Bhakoot",
      score: output.rasi_kootam.score,
      outOf: output.rasi_kootam.out_of,
      personA: output.rasi_kootam.bride.moon_sign_name,
      personB: output.rasi_kootam.groom.moon_sign_name,
    },
    {
      key: "nadi",
      label: "Nadi",
      score: output.nadi_kootam.score,
      outOf: output.nadi_kootam.out_of,
      personA: output.nadi_kootam.bride.nadi_name,
      personB: output.nadi_kootam.groom.nadi_name,
    },
  ];
}
