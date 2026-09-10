// src/lib/orders/store.ts
// Server-only Firestore access for the `orders` top-level collection
// (Admin SDK — bypasses Security Rules, so every function here MUST be
// called only from a route that has already verified the caller via
// verify-request.ts and checked ownership/role itself). Never import
// from a "use client" file.
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import type { Order, OrderLineItem, PaymentStatus, FulfillmentStatus } from "./types";
import type { CartPricingResult } from "@/lib/pricing/calculate";
import { recordRedemption } from "@/lib/coupons/store";

const COLLECTION = "orders";

function db() {
  return getFirestore(getAdminApp());
}

export async function createPendingOrder(input: {
  orderId: string;
  userId: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderLineItem[];
  pricing: CartPricingResult;
}): Promise<Order> {
  const now = Date.now();
  const order: Order = {
    id: input.orderId,
    userId: input.userId,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    items: input.items,
    subtotal: input.pricing.subtotal,
    productDiscount: input.pricing.productDiscount,
    couponCode: input.pricing.couponCode,
    couponDiscount: input.pricing.couponDiscount,
    taxableAmount: input.pricing.taxableAmount,
    tax: input.pricing.tax,
    taxBreakdown: input.pricing.taxBreakdown,
    deliveryFee: input.pricing.deliveryFee,
    total: input.pricing.total,
    currency: "INR",
    paymentStatus: "CREATED",
    fulfillmentStatus: "AWAITING_PAYMENT",
    createdAt: now,
    updatedAt: now,
  };
  await db().collection(COLLECTION).doc(input.orderId).set(order);
  return order;
}

export async function attachCashfreeSession(
  orderId: string,
  cfOrderId: string,
  paymentSessionId: string,
): Promise<void> {
  await db().collection(COLLECTION).doc(orderId).update({
    cashfreeOrderId: cfOrderId,
    cashfreePaymentSessionId: paymentSessionId,
    updatedAt: Date.now(),
  });
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const snap = await db().collection(COLLECTION).doc(orderId).get();
  if (!snap.exists) return null;
  return snap.data() as Order;
}

const TERMINAL_PAYMENT_STATUSES: PaymentStatus[] = ["PAID", "FAILED", "CANCELLED", "EXPIRED", "REFUNDED", "PARTIALLY_REFUNDED"];

/** Idempotently applies a payment-status transition. Returns the
 * order as it stands after the call (which may be unchanged, if this
 * event was already applied). A terminal status (PAID/FAILED/...) is
 * NEVER overwritten by a later, different terminal status once set —
 * this is the "do not blindly overwrite historical PAID state"
 * reconciliation policy: once PAID, an order stays PAID regardless of
 * a later out-of-order FAILED/EXPIRED event arriving (e.g. webhook
 * races). Only a genuinely new, still-open (non-terminal) → terminal
 * transition is applied. Safe to call repeatedly with the exact same
 * status (webhook retries) — that's a true no-op, not just "allowed
 * once more". */
export async function applyPaymentStatus(
  orderId: string,
  nextStatus: PaymentStatus,
  eventId: string,
): Promise<Order | null> {
  const ref = db().collection(COLLECTION).doc(orderId);

  const { order: result, justPaid } = await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return { order: null, justPaid: false };
    const order = snap.data() as Order;

    if (order.lastCashfreeEventId === eventId) {
      // Exact same webhook delivery already processed — no-op.
      return { order, justPaid: false };
    }

    const wasAlreadyPaid = order.paymentStatus === "PAID";
    const alreadyTerminal = TERMINAL_PAYMENT_STATUSES.includes(order.paymentStatus);
    // The ONE legitimate terminal-to-terminal transition: a paid order
    // being refunded (full or partial) — everything else (PAID-> FAILED,
    // FAILED->PAID, REFUNDED->anything, etc.) stays a rejected
    // reconciliation conflict. Without this carve-out the guard below
    // silently no-ops every refund: PAID is itself in
    // TERMINAL_PAYMENT_STATUSES, so "already terminal, different status
    // incoming" was true for every PAID->REFUNDED call too, and the
    // admin "Mark as Refunded" action (src/app/api/admin/orders/route.ts)
    // would return 200 without ever actually changing the status — a
    // real bug caught by testing this live against a real order rather
    // than trusting the route's own 200 response.
    const isRefundOfPaidOrder =
      order.paymentStatus === "PAID" && (nextStatus === "REFUNDED" || nextStatus === "PARTIALLY_REFUNDED");
    if (alreadyTerminal && order.paymentStatus !== nextStatus && !isRefundOfPaidOrder) {
      // Once a terminal outcome is recorded, a DIFFERENT terminal
      // outcome arriving later is a reconciliation conflict, not a
      // normal transition — ignore it here rather than silently
      // flipping a paid order to failed (or vice versa). A real
      // conflict of this kind needs manual investigation; recording
      // the attempted event id (without changing status) at least
      // leaves a trace for that investigation.
      //
      // Writes inside a transaction callback MUST go through `tx`
      // (tx.update/tx.set/tx.delete), never a direct `ref.update()` —
      // a raw write to the same document the transaction is reading
      // breaks the SDK's optimistic-concurrency tracking and causes
      // the transaction to conflict with itself on every retry. This
      // was a real production bug (not a transport issue): it made
      // every webhook/verify call for a real order hang for the full
      // function timeout and left the document "Too much contention"
      // errors for anything else touching it, which is exactly what
      // happened live — confirmed via Vercel logs and a direct
      // reproduction. `ref.update()` here (previously also below) was
      // the bug; `tx.update()` is the fix.
      tx.update(ref, { lastCashfreeEventId: eventId, updatedAt: Date.now() });
      return { order, justPaid: false };
    }

    const fulfillmentStatus: FulfillmentStatus =
      nextStatus === "PAID"
        ? order.items.some((i) => i.category === "consultation")
          ? "BOOKING_PENDING"
          : "PROCESSING"
        : order.fulfillmentStatus;

    const updated: Partial<Order> = {
      paymentStatus: nextStatus,
      fulfillmentStatus,
      lastCashfreeEventId: eventId,
      updatedAt: Date.now(),
    };
    tx.update(ref, updated);
    // justPaid is true ONLY on the transition INTO PAID that this
    // exact call performs — never true again for the same order on any
    // later call (whether a duplicate event, a same-status repeat, or
    // a different terminal status arriving after), which is what makes
    // the coupon-redemption hook below safe to call unconditionally
    // whenever this flag is set.
    return { order: { ...order, ...updated } as Order, justPaid: nextStatus === "PAID" && !wasAlreadyPaid };
  });

  if (result && justPaid && result.couponCode) {
    // Coupon usage is only ever consumed once an order actually
    // reaches PAID (the "abandoned checkout must not permanently
    // consume a redemption" requirement) — run OUTSIDE the order's own
    // transaction above (a second, independent transaction inside
    // recordRedemption) since it touches a different document subtree.
    // `justPaid` above guarantees this runs at most once per order.
    await recordRedemption(result.couponCode, result.userId).catch(() => {});
  }

  return result;
}

export async function updateFulfillmentStatus(
  orderId: string,
  status: FulfillmentStatus,
): Promise<void> {
  await db().collection(COLLECTION).doc(orderId).update({
    fulfillmentStatus: status,
    updatedAt: Date.now(),
  });
}

export async function listOrdersForUser(userId: string, limit = 50): Promise<Order[]> {
  const snap = await db()
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data() as Order);
}

export type AdminOrdersPage = { orders: Order[]; nextCursor: string | null };

/** Admin listing — paginated (cursor = last doc's createdAt), never a
 * full-collection dump to the browser. `category` filters client-side
 * on the already-limited page (fine at this scale; if the catalogue
 * grows much larger this would want a denormalized `categories` array
 * field to filter server-side instead). */
export async function listOrdersForAdmin(options: {
  paymentStatus?: PaymentStatus;
  limit?: number;
  cursorCreatedAt?: number;
}): Promise<AdminOrdersPage> {
  const limit = options.limit ?? 25;
  let query = db().collection(COLLECTION).orderBy("createdAt", "desc").limit(limit);
  if (options.paymentStatus) {
    query = db()
      .collection(COLLECTION)
      .where("paymentStatus", "==", options.paymentStatus)
      .orderBy("createdAt", "desc")
      .limit(limit) as typeof query;
  }
  if (options.cursorCreatedAt) {
    query = query.startAfter(options.cursorCreatedAt);
  }
  const snap = await query.get();
  const orders = snap.docs.map((d) => d.data() as Order);
  const nextCursor = orders.length === limit ? String(orders[orders.length - 1].createdAt) : null;
  return { orders, nextCursor };
}

// Re-exported so callers building Firestore FieldValue-based updates
// elsewhere don't need their own separate import of the Admin SDK.
export { FieldValue };
