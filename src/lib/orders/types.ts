// src/lib/orders/types.ts
// Canonical order shape, stored at top-level Firestore collection
// `orders/{orderId}` with a `userId` field (not nested under
// `users/{uid}/orders`) — per the "top-level collections for
// scalability, avoid deep nesting that makes admin queries difficult"
// guidance: the admin panel needs to query ACROSS all users' orders
// (by status, by category, newest-first), which a deeply-nested
// per-user subcollection can't do without a collection-group query.
//
// Payment status and fulfillment status are deliberately two separate
// fields (never merged into one enum) — see the "separate payment
// status from order/fulfillment status" requirement.
import type { RattiValue } from "@/lib/gemstones/types";

/** The full Cashfree-driven payment lifecycle for one order. PAID is
 * reached ONLY via verified server-side status/webhook — never set by
 * client code. */
export type PaymentStatus =
  | "CREATED" // internal order + Cashfree order both created, checkout not yet opened/completed
  | "PENDING" // Cashfree reports the payment as in-progress (e.g. UPI collect awaiting approval)
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

/** Fulfillment/operational status — independent of payment status.
 * Physical products (gemstones) use the SHIPPED/DELIVERED arm;
 * consultations use the BOOKING_PENDING/SCHEDULED/COMPLETED arm. Admin
 * may only advance this once the order is PAID (enforced server-side,
 * not just in the UI). */
export type FulfillmentStatus =
  | "AWAITING_PAYMENT"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "BOOKING_PENDING"
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

export type OrderItemCategory = "gemstone" | "consultation" | "product";

/** A line-item SNAPSHOT taken at checkout time — deliberately NOT a
 * live reference to the product/service data, so a later price change
 * to a gemstone or consultation never alters a historical order (see
 * "order snapshot" requirement). Mirrors the shape of
 * CartContext.tsx's `GemstoneCartMeta`/`ConsultationCartMeta` plus the
 * pricing fields those don't carry. */
export type OrderLineItem =
  | {
      category: "gemstone";
      productId: string;
      productName: string;
      ratti: RattiValue;
      quantity: number;
      unitMrp: number;
      unitSalePrice: number;
      discountPercent: number;
      lineTotal: number;
    }
  | {
      category: "consultation";
      serviceId: string;
      serviceName: string;
      duration: number;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }
  | {
      category: "product";
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    };

export type Order = {
  id: string;
  userId: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;

  items: OrderLineItem[];
  /** Sum of every line's lineTotal — the SAME number sent to Cashfree
   * as order_amount. Recomputed server-side at checkout time from
   * authoritative pricing, never trusted from the client. */
  subtotal: number;
  currency: "INR";

  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;

  cashfreeOrderId?: string;
  cashfreePaymentSessionId?: string;
  /** Set only once a webhook or verified status check reports a
   * terminal payment outcome — used to make webhook processing
   * idempotent (see cashfree/server.ts). */
  lastCashfreeEventId?: string;

  createdAt: number;
  updatedAt: number;
};

/** Every category actually present in this catalogue right now — used
 * to build the admin Orders category filter dynamically rather than
 * hardcoding categories that might not correspond to real products
 * (per the "don't create fake categories with no products" rule). */
export const ORDER_ITEM_CATEGORIES: OrderItemCategory[] = ["gemstone", "consultation", "product"];

/** True once every line in the order is one specific category — used
 * by the admin category filter/tabs. */
export function orderCategories(order: Pick<Order, "items">): OrderItemCategory[] {
  return Array.from(new Set(order.items.map((item) => item.category)));
}
