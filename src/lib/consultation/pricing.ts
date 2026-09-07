// src/lib/consultation/pricing.ts
// The single authoritative pricing calculation layer for consultations
// (see the ConsultationPricingMatrix doc comment in types.ts). Every
// surface that needs a price — service card, duration modal, service
// subpage, cart, checkout, and the server-side /api/consult/validate
// route — MUST go through `getConsultationPrice()` here rather than
// recomputing or hardcoding a number. Pure functions only, no import of
// services-data.ts, so this module has zero risk of a circular
// dependency and can be unit-tested with plain fixtures.
import {
  DURATION_PRESETS,
  MIN_CONSULTATION_MINUTES,
  MAX_CONSULTATION_MINUTES,
  type ConsultationPricingMatrix,
  type DurationPreset,
} from "./types";

export type DurationValidation =
  | { valid: true; duration: number }
  | { valid: false; reason: string };

/** Validates a requested consultation duration in minutes. Accepts only
 * a finite integer between MIN_CONSULTATION_MINUTES and
 * MAX_CONSULTATION_MINUTES inclusive — rejects non-numbers, NaN,
 * decimals, out-of-range values, and (implicitly, since it requires a
 * `number`) empty/missing input. Used identically by the client-side
 * custom-duration input and the server-side validation route so the
 * two can never disagree. */
export function validateDuration(input: unknown): DurationValidation {
  if (typeof input !== "number" || !Number.isFinite(input)) {
    return { valid: false, reason: "Duration must be a number." };
  }
  if (!Number.isInteger(input)) {
    return { valid: false, reason: "Duration must be a whole number of minutes." };
  }
  if (input < MIN_CONSULTATION_MINUTES || input > MAX_CONSULTATION_MINUTES) {
    return {
      valid: false,
      reason: `Duration must be between ${MIN_CONSULTATION_MINUTES} and ${MAX_CONSULTATION_MINUTES} minutes.`,
    };
  }
  return { valid: true, duration: input };
}

/** Price (whole rupees) for `duration` minutes given a service's fixed
 * 4-point pricing matrix. Exact presets (15/30/45/60) return the
 * matrix value directly; any other whole-minute value in range is
 * priced by piecewise-linear interpolation between the two bracketing
 * presets, rounded to the nearest rupee 10 for a clean displayed price
 * (matching this matrix's own round-number convention). Throws only if
 * `duration` is outside the valid range — callers must run
 * `validateDuration` first (this function does not itself return a
 * validation-shaped result, to keep it a total function over valid
 * input for the many call sites that already know the value is
 * pre-validated, e.g. re-deriving a cart line's price for display). */
export function getConsultationPrice(
  pricing: ConsultationPricingMatrix,
  duration: number,
): number {
  const validation = validateDuration(duration);
  if (!validation.valid) {
    throw new Error(`getConsultationPrice: ${validation.reason}`);
  }

  const presets = DURATION_PRESETS as readonly DurationPreset[];
  const exact = presets.find((p) => p === duration);
  if (exact !== undefined) return pricing[exact];

  // Find the two bracketing presets and interpolate. DURATION_PRESETS
  // is sorted ascending and covers [MIN,MAX], so for any in-range,
  // non-preset duration there is always exactly one adjacent pair that
  // brackets it.
  let lower: DurationPreset = presets[0];
  let upper: DurationPreset = presets[presets.length - 1];
  for (let i = 0; i < presets.length - 1; i++) {
    if (duration > presets[i] && duration < presets[i + 1]) {
      lower = presets[i];
      upper = presets[i + 1];
      break;
    }
  }

  const lowerPrice = pricing[lower];
  const upperPrice = pricing[upper];
  const fraction = (duration - lower) / (upper - lower);
  const raw = lowerPrice + fraction * (upperPrice - lowerPrice);
  return Math.round(raw / 10) * 10;
}

/** Convenience formatter matching this site's existing plain "₹1,299"
 * INR display convention (whole rupees, comma-grouped, no decimals). */
export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
