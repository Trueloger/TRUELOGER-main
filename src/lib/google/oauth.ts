// src/lib/google/oauth.ts
// Server-only Google OAuth client + refresh-token storage. The host
// account is a normal/personal Google account (per the earlier
// decision — not Workspace domain-wide delegation), so this uses a
// standard one-time OAuth consent + refresh-token flow: an admin
// authorizes once via /admin/google, the refresh token is stored
// server-side (Firestore, Admin-SDK-only access), and every future
// Calendar/Meet event is created using that stored token — no
// interactive step needed again unless the admin revokes access.
import { randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

const TOKENS_COLLECTION = "googleAuth";
const TOKENS_DOC = "host";
const STATES_COLLECTION = "googleOAuthStates";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const USERINFO_SCOPE = "https://www.googleapis.com/auth/userinfo.email";

function db() {
  return getFirestore(getAdminApp());
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export function createOAuthClient(): OAuth2Client {
  return new OAuth2Client(
    requireEnv("GOOGLE_OAUTH_CLIENT_ID"),
    requireEnv("GOOGLE_OAUTH_CLIENT_SECRET"),
    requireEnv("GOOGLE_OAUTH_REDIRECT_URI"),
  );
}

/** Random state, stored with a short expiry so the callback can verify
 * this authorization round-trip was actually initiated by an admin
 * from /admin/google — standard OAuth CSRF protection, since the
 * callback route itself is hit by Google's redirect (no bearer auth
 * header available there to check admin status directly). */
export async function createPendingState(): Promise<string> {
  // A real CSPRNG (Node's crypto.randomBytes), not Math.random() —
  // this token is the actual CSRF/OAuth-state gate on the public
  // callback route, so it needs real unpredictable entropy.
  const state = `st_${randomBytes(32).toString("base64url")}`;
  await db().collection(STATES_COLLECTION).doc(state).set({ createdAt: Date.now() });
  return state;
}

export async function consumeState(state: string): Promise<boolean> {
  const ref = db().collection(STATES_COLLECTION).doc(state);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  const createdAt = (snap.data() as { createdAt: number }).createdAt;
  return Date.now() - createdAt < 10 * 60 * 1000; // 10-minute window
}

export function buildConsentUrl(state: string): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline", // required to receive a refresh_token
    prompt: "consent", // forces refresh_token on every connect, not just the very first time
    scope: [CALENDAR_SCOPE, USERINFO_SCOPE],
    state,
  });
}

export async function storeHostTokens(refreshToken: string, email: string): Promise<void> {
  await db().collection(TOKENS_COLLECTION).doc(TOKENS_DOC).set({
    refreshToken,
    email,
    connectedAt: Date.now(),
  });
}

export type HostTokens = { refreshToken: string; email: string; connectedAt: number };

export async function getHostTokens(): Promise<HostTokens | null> {
  const snap = await db().collection(TOKENS_COLLECTION).doc(TOKENS_DOC).get();
  return snap.exists ? (snap.data() as HostTokens) : null;
}

export async function disconnectHost(): Promise<void> {
  await db().collection(TOKENS_COLLECTION).doc(TOKENS_DOC).delete();
}

/** An authenticated client for making real Calendar API calls, using
 * the stored refresh token — throws if nothing is connected yet
 * (callers should catch this and honestly report
 * MEETING_CREATION_FAILED / MEETING_CREATION_PENDING, never fabricate
 * a meeting). */
export async function getAuthorizedClient(): Promise<OAuth2Client> {
  const tokens = await getHostTokens();
  if (!tokens) throw new Error("Google Calendar is not connected yet.");
  const client = createOAuthClient();
  client.setCredentials({ refresh_token: tokens.refreshToken });
  return client;
}
