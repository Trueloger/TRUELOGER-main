// src/lib/rate-limit/firestore-rate-limit.ts
// Server-only. Distributed fixed-window rate limiter backed by Firestore
// (this project's existing database — see src/lib/firebase-admin.ts) —
// chosen over an in-memory counter specifically because Vercel Functions
// are stateless/distributed, so an in-memory counter would reset per
// instance and never actually limit anything in production. No Redis/
// Upstash account exists yet for this project; this is the pragmatic
// default until/unless one is added.
//
// Imports firebase-admin.ts by relative path with an explicit .ts
// extension (not the "@/" alias), matching every other file under
// src/lib/ — see src/lib/horoscope/store.ts for why: it lets this file
// (and any future scripts/dev/*.ts dry-run script) also run under plain
// `node`, not just inside Next's bundler.
import { getFirestoreDb } from "../firebase-admin.ts";

const COLLECTION = "rateLimits";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Unix ms when the current window resets. */
  resetAt: number;
};

/** Fixed-window counter: `identifier` (e.g. client IP) gets `limit`
 * requests per `windowSeconds`-second window for `routeKey`. Uses
 * Firestore's atomic `FieldValue.increment` so concurrent requests from
 * the same identifier in the same window can't race past the limit.
 *
 * Firestore has no code-level TTL — old window documents accumulate
 * until a Firestore TTL policy is configured (Firebase console → this
 * collection → TTL field `expiresAt`) to auto-delete them. Until that's
 * configured, old docs just sit there harmlessly (they're never read
 * again once their window has passed) — set the TTL policy before
 * relying on this at real production volume, so the collection doesn't
 * grow unbounded. */
export async function checkRateLimit(
  routeKey: string,
  identifier: string,
  opts: { limit: number; windowSeconds: number }
): Promise<RateLimitResult> {
  const { limit, windowSeconds } = opts;
  const windowMs = windowSeconds * 1000;
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const resetAt = windowStart + windowMs;

  // Doc id encodes route+identifier+window so each window is a fresh,
  // independently-expiring document rather than one doc mutated forever.
  const docId = `${routeKey}:${identifier}:${windowStart}`;
  const db = getFirestoreDb();
  const ref = db.collection(COLLECTION).doc(docId);

  const count = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? ((snap.data()?.count as number | undefined) ?? 0) : 0;
    const next = current + 1;
    tx.set(
      ref,
      { count: next, routeKey, identifier, windowStart, expiresAt: resetAt },
      { merge: true }
    );
    return next;
  });

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  };
}

/** Best-effort client IP extraction, matching standard Vercel behavior:
 * `x-forwarded-for` is a comma-separated list, client IP first. Falls
 * back to a constant so an unlimited "unknown" bucket still gets rate
 * limited as a single shared identifier rather than bypassing the limit
 * entirely (safer default than skipping the check when the header is
 * missing, e.g. in local dev). */
export function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
