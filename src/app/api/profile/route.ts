// src/app/api/profile/route.ts
// Server-side read/write of the caller's OWN profile doc
// (users/{uid}). Firestore Security Rules already restrict direct
// client writes to a user's own uid (see firestore.rules), so the
// profile page could in principle write directly via the client SDK —
// this route exists for the one write that genuinely needs a server
// step: resolving birth city/state/country to authoritative lat/lng/
// timezone via the same geocoding this site's astrology tools already
// trust (never the browser's own timezone), so that resolution can't
// be spoofed by a client sending fake coordinates.
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verify-request";
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { resolveCityCoordinates, historicalIndiaOffsetHours } from "@/lib/astrology/geocode";
import type { UserProfile } from "@/lib/profile/types";

function db() {
  return getFirestore(getAdminApp());
}

export async function GET(request: Request) {
  const verified = await verifyRequest(request);
  if (!verified) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });

  const snap = await db().collection("users").doc(verified.uid).get();
  return NextResponse.json({ profile: snap.exists ? snap.data() : null });
}

export async function PUT(request: Request) {
  const verified = await verifyRequest(request);
  if (!verified) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  if (!verified.email) return NextResponse.json({ error: "Your account has no email on file." }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const input = body as Partial<UserProfile>;

  // Never trust these from the client — always the server's own
  // verified values / computed timestamps.
  delete (input as Record<string, unknown>).uid;
  delete (input as Record<string, unknown>).email;
  delete (input as Record<string, unknown>).createdAt;
  delete (input as Record<string, unknown>).updatedAt;
  delete (input as Record<string, unknown>).birthLatitude;
  delete (input as Record<string, unknown>).birthLongitude;
  delete (input as Record<string, unknown>).birthTimezoneHours;

  // Same India-city lookup + historically-correct UTC-offset table the
  // astrology tools already trust (src/lib/astrology/birth-request.ts)
  // — never the browser's own timezone, never a client-supplied
  // lat/lng (both were stripped above). Unresolved city name still
  // saves the rest of the profile — the birth-details form surfaces
  // this so the user can correct the spelling and re-save.
  if (input.birthCity) {
    const coords = resolveCityCoordinates(input.birthCity);
    if (coords) {
      input.birthLatitude = coords.lat;
      input.birthLongitude = coords.lon;
      input.birthTimezoneHours = input.dob ? historicalIndiaOffsetHours(input.dob) : coords.timezone;
    }
  }

  const ref = db().collection("users").doc(verified.uid);
  const existing = await ref.get();
  const now = Date.now();

  const next: UserProfile = {
    ...(existing.exists ? (existing.data() as UserProfile) : {}),
    ...input,
    uid: verified.uid,
    email: verified.email,
    createdAt: existing.exists ? (existing.data() as UserProfile).createdAt : now,
    updatedAt: now,
  } as UserProfile;

  await ref.set(next, { merge: false });
  return NextResponse.json({ profile: next });
}

// Added for account deletion (src/app/account/settings/page.tsx): deletes
// only the caller's OWN Firestore profile doc (users/{uid}) — order/
// report records are a SEPARATE collection and are intentionally never
// touched here, per the "retain order history for business/legal
// records" requirement. The Firebase Auth account itself is deleted
// client-side via `deleteUser` (needs the user's own fresh ID token/
// session, which only the client has) — this route just cleans up the
// Firestore side of account deletion.
export async function DELETE(request: Request) {
  const verified = await verifyRequest(request);
  if (!verified) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });

  await db().collection("users").doc(verified.uid).delete();
  return NextResponse.json({ ok: true });
}
