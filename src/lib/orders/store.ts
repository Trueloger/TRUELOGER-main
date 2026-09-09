// src/lib/orders/store.ts
// Server-only Firestore access for the `orders` top-level collection
// (Admin SDK — bypasses Security Rules, so every function here MUST be
// called only from a route that has already verified the caller via
// verify-request.ts and checked ownership/role itself). Never import
// from a "use client" file.
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import type { Order, OrderLineItem, PaymentStatus, FulfillmentStatus } from "./types";

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
  subtotal: number;
}): Promise<Order> {
  const now = Date.now();
  const order: Order = {
    id: input.orderId,
    userId: input.userId,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    items: input.items,
    subtotal: input.subtotal,
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
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const order = snap.data() as Order;

    if (order.lastCashfreeEventId === eventId) {
      // Exact same webhook delivery already processed — no-op.
      return order;
    }

    const alreadyTerminal = TERMINAL_PAYMENT_STATUSES.includes(order.paymentStatus);
    if (alreadyTerminal && order.paymentStatus !== nextStatus) {
      // Once a terminal outcome is recorded, a DIFFERENT terminal
      // outcome arriving later is a reconciliation conflict, not a
      // normal transition — ignore it here rather than silently
      // flipping a paid order to failed (or vice versa). A real
      // conflict of this kind needs manual investigation; recording
      // the attempted event id (without changing status) at least
      // leaves a trace for that investigation.
      await ref.update({ lastCashfreeEventId: eventId, updatedAt: Date.now() });
      return order;
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
    await ref.update(updated);
    return { ...order, ...updated } as Order;
  });
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
