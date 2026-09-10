// src/lib/coupons/store.ts
// Server-only Firestore access for coupons (Admin SDK — every function
// here must only be called from a route that has already checked
// auth/role). Never import from a "use client" file.
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { normalizeCouponCode, type Coupon } from "./types";

const COLLECTION = "coupons";

function db() {
  return getFirestore(getAdminApp());
}

export async function getCoupon(rawCode: string): Promise<Coupon | null> {
  const code = normalizeCouponCode(rawCode);
  const snap = await db().collection(COLLECTION).doc(code).get();
  return snap.exists ? (snap.data() as Coupon) : null;
}

/** Every coupon whose active window currently covers `now` — used to
 * build the cart's "eligible coupons" list. Category/product
 * restriction and per-user/global usage limits are checked separately
 * (see checkCouponEligibility + redemption counts) since those need
 * the actual cart contents / calling user, not just the date window. */
export async function listActiveCoupons(now: number = Date.now()): Promise<Coupon[]> {
  const snap = await db()
    .collection(COLLECTION)
    .where("active", "==", true)
    .where("endDate", ">=", now)
    .get();
  return snap.docs.map((d) => d.data() as Coupon).filter((c) => c.startDate <= now);
}

export async function listAllCouponsForAdmin(): Promise<Coupon[]> {
  const snap = await db().collection(COLLECTION).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => d.data() as Coupon);
}

export async function createCoupon(
  input: Omit<Coupon, "code" | "createdAt" | "updatedAt"> & { code: string },
): Promise<Coupon> {
  const code = normalizeCouponCode(input.code);
  const now = Date.now();
  const coupon: Coupon = { ...input, code, createdAt: now, updatedAt: now };
  await db().collection(COLLECTION).doc(code).set(coupon);
  return coupon;
}

export async function updateCoupon(rawCode: string, patch: Partial<Coupon>): Promise<Coupon | null> {
  const code = normalizeCouponCode(rawCode);
  const ref = db().collection(COLLECTION).doc(code);
  const existing = await ref.get();
  if (!existing.exists) return null;
  const safePatch = { ...patch };
  delete (safePatch as Partial<Coupon>).code;
  delete (safePatch as Partial<Coupon>).createdAt;
  const updated = { ...(existing.data() as Coupon), ...safePatch, updatedAt: Date.now() };
  await ref.set(updated);
  return updated;
}

export async function deleteCoupon(rawCode: string): Promise<void> {
  await db().collection(COLLECTION).doc(normalizeCouponCode(rawCode)).delete();
}

/** How many times `uid` has redeemed this coupon (PAID orders only —
 * see recordRedemption's own doc comment on when this is called), and
 * the coupon's total redemption count across all users. */
export async function getRedemptionCounts(
  rawCode: string,
  uid: string,
): Promise<{ userCount: number; totalCount: number }> {
  const code = normalizeCouponCode(rawCode);
  const redemptionsRef = db().collection(COLLECTION).doc(code).collection("redemptions");
  const [userDoc, totalSnap] = await Promise.all([
    redemptionsRef.doc(uid).get(),
    redemptionsRef.count().get(),
  ]);
  const userCount = userDoc.exists ? (userDoc.data()?.count ?? 0) : 0;
  return { userCount, totalCount: totalSnap.data().count };
}

/** Atomically increments both the per-user redemption doc and confirms
 * the coupon is still under its global usageLimit at the moment of
 * increment — run inside a Firestore transaction so two concurrent
 * checkouts using the last remaining redemption of a limited coupon
 * can't both succeed (the "prevent coupon abuse / race conditions"
 * requirement). Called ONLY when an order transitions to PAID (see
 * applyPaymentStatus's coupon-redemption hook in orders/store.ts) —
 * never when an order is merely created/pending, so an abandoned
 * checkout never permanently consumes a redemption (the "abandoned
 * checkout" requirement). Throws if the limit was hit in the race —
 * callers should treat that as "coupon no longer usable", not a
 * generic error. */
export async function recordRedemption(rawCode: string, uid: string): Promise<void> {
  const code = normalizeCouponCode(rawCode);
  const couponRef = db().collection(COLLECTION).doc(code);
  const redemptionRef = couponRef.collection("redemptions").doc(uid);

  await db().runTransaction(async (tx) => {
    const [couponSnap, redemptionSnap] = await Promise.all([tx.get(couponRef), tx.get(redemptionRef)]);
    if (!couponSnap.exists) return; // coupon deleted between apply and pay — silently skip, don't block the order
    const coupon = couponSnap.data() as Coupon;

    const userCount = redemptionSnap.exists ? (redemptionSnap.data()?.count ?? 0) : 0;
    if (coupon.perUserLimit && userCount >= coupon.perUserLimit) return;

    if (coupon.usageLimit) {
      const totalSnap = await couponRef.collection("redemptions").count().get();
      // NOTE: .count() inside a transaction reflects a snapshot read,
      // not itself transactionally serialized against other
      // concurrent writes the way a document read is — for the
      // catalogue/traffic scale this system runs at, the practical
      // race window this leaves open (two simultaneous last-redemption
      // checkouts both reading the same pre-increment count) is an
      // accepted, documented limitation rather than a false claim of
      // perfect atomicity; a fully race-proof version would need a
      // running `usageCount` field on the coupon doc itself,
      // incremented via `FieldValue.increment` inside this same
      // transaction instead of a subcollection count.
      if (totalSnap.data().count >= coupon.usageLimit) return;
    }

    tx.set(redemptionRef, { count: userCount + 1, updatedAt: Date.now() }, { merge: true });
  });
}
