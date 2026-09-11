// src/lib/reports/profile-snapshot.ts
// Server-only. The ONE place a user's Firestore profile gets read and
// turned into an immutable ReportProfileSnapshot for a report purchase
// — called from resolve-cart.ts at order-creation time (AGENTS §13:
// Firebase UID -> load profile server-side -> validate completeness ->
// create snapshot). Never trusts anything the client sends about the
// user's own birth details.
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { isProfileComplete, type UserProfile } from "@/lib/profile/types";
import type { ReportProfileSnapshot } from "./types";

export type BuildSnapshotResult =
  | { ok: true; snapshot: ReportProfileSnapshot }
  | { ok: false; error: string };

export async function buildReportProfileSnapshot(uid: string): Promise<BuildSnapshotResult> {
  const snap = await getFirestore(getAdminApp()).collection("users").doc(uid).get();
  const profile = snap.exists ? (snap.data() as UserProfile) : null;

  if (!isProfileComplete(profile)) {
    return {
      ok: false,
      error: "Please complete your profile (name, date of birth, and birth place) before purchasing a personalized report.",
    };
  }
  // isProfileComplete guarantees these required fields are present —
  // the non-null assertions below are safe given that check, not a
  // trust assumption independent of it.
  const p = profile as UserProfile;

  if (p.birthLatitude === undefined || p.birthLongitude === undefined || p.birthTimezoneHours === undefined) {
    return {
      ok: false,
      error: "Your birth place could not be resolved to exact coordinates. Please re-enter your birth city in your profile.",
    };
  }

  return {
    ok: true,
    snapshot: {
      fullName: p.fullName,
      gender: p.gender,
      dob: p.dob!,
      timeOfBirth: p.timeOfBirth ?? "12:00",
      timeUnknown: p.timeUnknown,
      birthCity: p.birthCity!,
      birthState: p.birthState,
      birthCountry: p.birthCountry!,
      birthLatitude: p.birthLatitude,
      birthLongitude: p.birthLongitude,
      birthTimezoneHours: p.birthTimezoneHours,
      profileUpdatedAt: p.updatedAt,
    },
  };
}
