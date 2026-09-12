// src/app/api/admin/google/connect-url/route.ts
// Admin-only: returns a Google consent URL to redirect the browser to.
// The state param (created + stored here) is what lets the PUBLIC
// callback route (hit by Google's own redirect, no auth header
// available there) verify this round-trip was actually started by an
// authenticated admin, not forged.
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { createPendingState, buildConsentUrl } from "@/lib/google/oauth";

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const state = await createPendingState();
  const url = buildConsentUrl(state);
  return NextResponse.json({ url });
}
