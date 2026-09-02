// src/lib/cache/firestore-cache.ts
// Server-only. Generic get-or-compute cache backed by Firestore (this
// project's existing database), for deterministic results that are safe
// to share across requests/users — e.g. Panchang for a given date+city,
// which thousands of visitors may request identically on the same day.
//
// PRIVACY WARNING, read before using this for anything else: never pass
// a namespace+input containing a user's name/DOB/birth-time/location to
// getOrCompute if the result is meant to be reused across different
// users — that would leak one visitor's personalized report to another
// visitor who happens to submit similar-looking input. This cache is
// for genuinely shared, non-personal data only (Panchang: date + city
// name, nothing about who's asking). Personalized reports (birth charts,
// numerology, dosha checks, etc.) should instead use a per-request
// dedupe keyed to that specific user's submission (see the request-
// deduplication note in each tool's own route) or simply not be cached
// at all — recompute is cheap relative to the privacy risk.
//
// Imports firebase-admin.ts by relative path with an explicit .ts
// extension, matching every other src/lib/ file (see
// src/lib/horoscope/store.ts's comment for why).
import { createHash } from "node:crypto";
import { getFirestoreDb } from "../firebase-admin.ts";

const COLLECTION = "cache";

/** Stable cache key: sorts object keys recursively before hashing so
 * `{a:1,b:2}` and `{b:2,a:1}` produce the same key, then SHA-256 hashes
 * the JSON (Node's built-in crypto — no new dependency). `namespace` is
 * kept as a plain path segment (not hashed) so cache entries stay
 * browsable/debuggable in the Firestore console by namespace. Returns a
 * full 4-segment Firestore document path (`cache/{namespace}/entries/
 * {hash}`) — a Firestore doc path must have an even number of segments
 * (collection/doc/collection/doc), which this satisfies:
 * `cache`(coll)/`namespace`(doc)/`entries`(coll)/`hash`(doc). */
export function cacheKeyFor(namespace: string, input: unknown): string {
  const stable = stableStringify(input);
  const hash = createHash("sha256").update(stable).digest("hex");
  return `${COLLECTION}/${namespace}/entries/${hash}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

/** Reads `cache/{namespace}/entries/{hash}`; if present and not expired,
 * returns the cached value without calling `compute`. Otherwise calls
 * `compute()`, stores the result with a TTL, and returns it. `compute`
 * is only invoked on a cache miss/expiry — never speculatively. */
export async function getOrCompute<T>(
  namespace: string,
  input: unknown,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<T> {
  const db = getFirestoreDb();
  const path = cacheKeyFor(namespace, input);
  const ref = db.doc(path);

  const snap = await ref.get();
  if (snap.exists) {
    const data = snap.data() as { value: T; expiresAt: number } | undefined;
    if (data && data.expiresAt > Date.now()) {
      return data.value;
    }
  }

  const value = await compute();
  await ref.set({
    value,
    computedAt: Date.now(),
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  return value;
}
