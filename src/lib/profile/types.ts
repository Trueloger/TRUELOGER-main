// src/lib/profile/types.ts
// Canonical user-profile shape, stored at Firestore `users/{uid}`.
// Reused across the astrology tools (so a signed-in user never re-types
// their own birth details) — kept STRICTLY separate from the existing
// per-report "Person A/Person B" inputs (free-kundli, kundli-matching,
// compatibility, etc.) which remain their own local form state and are
// never overwritten by this profile. See ProfileAutofillButton for the
// one, explicit, user-triggered bridge between the two.
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export type UserProfile = {
  uid: string;
  email: string;
  fullName: string;
  displayName?: string;
  phone?: string;
  gender?: Gender;
  country?: string;

  // Birth information — required for every astrology calculation this
  // site offers (Kundli, Nakshatra, Rashi, Ascendant, Mangal Dosha,
  // Sade Sati, Dasha, Compatibility, Numerology, consultations).
  dob?: string; // "YYYY-MM-DD"
  timeOfBirth?: string; // "HH:mm", 24h
  timeUnknown?: boolean;
  birthCity?: string;
  birthState?: string;
  birthCountry?: string;
  birthLatitude?: number;
  birthLongitude?: number;
  /** Hours EAST of UTC, e.g. 5.5 for India — resolved once at profile
   * save time via the same historically-accurate lookup the astro
   * tools already use (src/lib/astrology/geocode.ts), NEVER the
   * browser's current timezone. */
  birthTimezoneHours?: number;

  // Preferences
  preferredLanguage?: string;
  notificationsEnabled?: boolean;

  createdAt: number; // epoch ms
  updatedAt: number;
};

/** The fields a complete birth-chart-ready profile needs. Contact
 * fields (phone, gender, country) are always optional — see the
 * "do not force optional data" requirement. */
export const REQUIRED_PROFILE_FIELDS = [
  "fullName",
  "dob",
  "birthCity",
  "birthCountry",
] as const;

/** Time of birth is required UNLESS the user has explicitly marked it
 * unknown (many real users genuinely don't know their exact birth
 * time) — checked separately from the static required-field list
 * above since its rule is conditional. */
export function isProfileComplete(profile: Partial<UserProfile> | null | undefined): boolean {
  if (!profile) return false;
  const staticFieldsOk = REQUIRED_PROFILE_FIELDS.every((field) => {
    const value = profile[field];
    return typeof value === "string" && value.trim().length > 0;
  });
  if (!staticFieldsOk) return false;
  if (profile.timeUnknown) return true;
  return typeof profile.timeOfBirth === "string" && profile.timeOfBirth.trim().length > 0;
}

const ALL_TRACKED_FIELDS: (keyof UserProfile)[] = [
  "fullName",
  "phone",
  "gender",
  "country",
  "dob",
  "timeOfBirth",
  "birthCity",
  "birthState",
  "birthCountry",
];

/** 0-100 — a simple "how much of the profile is filled in" indicator
 * for the completion progress bar. Not the same test as
 * `isProfileComplete` (which only checks the fields astrology
 * calculations actually require) — this counts every tracked field so
 * the progress bar can meaningfully move past 100%-of-required. */
export function profileCompletionPercent(profile: Partial<UserProfile> | null | undefined): number {
  if (!profile) return 0;
  const filled = ALL_TRACKED_FIELDS.filter((field) => {
    const value = profile[field];
    if (profile.timeUnknown && field === "timeOfBirth") return true;
    return typeof value === "string" && value.trim().length > 0;
  }).length;
  return Math.round((filled / ALL_TRACKED_FIELDS.length) * 100);
}

/** Fields still missing for a birth-chart-ready profile — used by the
 * "Complete Your Profile" prompt when a user tries to use a service
 * that needs birth data but hasn't filled it in yet. */
export function missingRequiredFields(profile: Partial<UserProfile> | null | undefined): string[] {
  if (!profile) return [...REQUIRED_PROFILE_FIELDS, "timeOfBirth"];
  const missing: string[] = [];
  for (const field of REQUIRED_PROFILE_FIELDS) {
    const value = profile[field];
    if (typeof value !== "string" || value.trim().length === 0) missing.push(field);
  }
  if (!profile.timeUnknown && (!profile.timeOfBirth || profile.timeOfBirth.trim().length === 0)) {
    missing.push("timeOfBirth");
  }
  return missing;
}
