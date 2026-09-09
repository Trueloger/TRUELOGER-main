// src/app/api/admin/users/route.ts
// Admin-only, paginated user listing — name/email/registration date/
// profile-completion only (per "don't expose sensitive birth data in
// a summary table"). No client-side full-collection dump: this route
// itself paginates via Firestore, and the admin UI must page through
// it rather than requesting everything at once.
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { isProfileComplete, type UserProfile } from "@/lib/profile/types";

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const url = new URL(request.url);
  const cursorParam = url.searchParams.get("cursor");
  const limit = 25;

  let query = getFirestore(getAdminApp()).collection("users").orderBy("createdAt", "desc").limit(limit);
  if (cursorParam) query = query.startAfter(Number(cursorParam));

  const snap = await query.get();
  const users = snap.docs.map((doc) => {
    const profile = doc.data() as UserProfile;
    return {
      uid: profile.uid,
      fullName: profile.fullName,
      email: profile.email,
      createdAt: profile.createdAt,
      profileComplete: isProfileComplete(profile),
    };
  });

  const nextCursor = users.length === limit ? String(users[users.length - 1].createdAt) : null;
  return NextResponse.json({ users, nextCursor });
}
