// src/lib/auth/verify-request.ts
// Server-only: verifies a Firebase ID token sent by the browser as
// `Authorization: Bearer <idToken>` and returns the decoded, trusted
// claims. Every protected API route (checkout, orders, profile writes,
// admin) MUST call this and use the returned uid/claims — never trust
// a uid or role the client sends in the request body. See
// firebase-admin.ts's own doc comment: this file is server-only too.
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase-admin";

function getAdminAuth() {
  return getAuth(getAdminApp());
}

export type VerifiedRequest = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  /** True only when the token carries the `admin: true` custom claim,
   * set exclusively via the server-side bootstrap script
   * (scripts/dev/set-admin-claim.ts) — never settable by the user
   * themselves. See ADMIN.md / that script's doc comment. */
  isAdmin: boolean;
  token: DecodedIdToken;
};

/** Returns the verified caller identity, or `null` if the request has
 * no valid, current Firebase ID token — callers should respond 401 in
 * that case. Never throws on a missing/invalid/expired token (those
 * are all just "not authenticated"); only throws if the Admin SDK
 * itself is misconfigured (missing env vars), which is a real server
 * setup bug that should surface as a 500, not a silent 401. */
export async function verifyRequest(request: Request): Promise<VerifiedRequest | null> {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) return null;

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      emailVerified: decoded.email_verified ?? false,
      isAdmin: decoded.admin === true,
      token: decoded,
    };
  } catch {
    // Expired/malformed/revoked token — treat identically to "not
    // authenticated" rather than leaking why to the caller.
    return null;
  }
}

/** Convenience for admin-only routes: verifies the token AND requires
 * the admin claim in one call. Returns null for both "not logged in"
 * and "logged in but not admin" — callers respond 401/403 either way
 * without needing to distinguish (an admin route should not confirm to
 * a probing non-admin user whether their login itself was valid). */
export async function verifyAdminRequest(request: Request): Promise<VerifiedRequest | null> {
  const verified = await verifyRequest(request);
  if (!verified || !verified.isAdmin) return null;
  return verified;
}
