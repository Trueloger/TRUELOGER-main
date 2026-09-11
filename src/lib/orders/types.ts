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

import type { ProductCategory } from "@/lib/products/types";

/** The 5 physical-product categories (from products/types.ts) plus
 * "consultation" — this is the FULL taxonomy the admin Orders category
 * tabs are built from (see ORDER_ITEM_CATEGORIES below), not a
 * hardcoded subset. */
export type OrderItemCategory = ProductCategory | "consultation" | "report" | "healing" | "puja" | "course";

/** A line-item SNAPSHOT taken at checkout time — deliberately NOT a
 * live reference to product/service data, so a later admin price
 * change never alters a historical order. ONE shape covers every
 * physical-product category (gemstone/bracelet/rudraksha/spiritual/
 * yantra) via `variantId`/`variantLabel` — a gemstone's variantId is a
 * stringified Ratti ("5"), a Rudraksha's a Mukhi count ("6"); `ratti`
 * is additionally populated (as a number) ONLY for the gemstone
 * category, kept for backward compatibility with the existing
 * gemstone-specific UI (Orders page, admin order detail, cart rows)
 * that already reads `item.ratti` directly rather than parsing
 * variantId. Consultations keep their own separate shape (duration
 * instead of a variant, no MRP/discount concept). */
export type OrderLineItem =
  | {
      category: ProductCategory;
      productId: string;
      productName: string;
      variantId: string;
      variantLabel: string;
      /** Gemstone-only — see the shape-level doc comment above. */
      ratti?: RattiValue;
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
      /** Preferred appointment date/time, validated server-side at
       * order-creation time (src/lib/consultation/availability.ts) —
       * see AGENTS "ask date/time before cart". Optional for backward
       * compatibility with orders placed before this field existed. */
      preferredDate?: string;
      preferredTime?: string;
      timezone?: string;
    }
  | {
      category: "report";
      productId: string; // report product slug
      productName: string;
      reportType: import("@/lib/reports/types").ReportType;
      /** Immutable snapshot of the profile at ORDER-CREATION time (not
       * at payment-confirmation time) — see AGENTS §13/§14. This is
       * what src/lib/orders/store.ts's applyPaymentStatus reads when
       * creating the actual generation job on justPaid, so a profile
       * edit made between placing the order and completing payment can
       * never change what gets generated. */
      profileSnapshot: import("@/lib/reports/types").ReportProfileSnapshot;
      quantity: number;
      unitMrp: number;
      unitSalePrice: number;
      discountPercent: number;
      lineTotal: number;
    }
  | {
      /** Healing / Puja / Courses — the shared "simple service" model
       * (src/lib/services/types.ts). One shape covers all three since
       * they're commercially identical (fixed price, no variant, no
       * profile snapshot) — see AGENTS/spec "one extensible service
       * model, not three duplicated ones." */
      category: "healing" | "puja" | "course";
      productId: string; // service slug
      productName: string;
      quantity: number;
      unitMrp: number;
      unitSalePrice: number;
      discountPercent: number;
      lineTotal: number;
      deliveryTime: string;
    };

export type Order = {
  id: string;
  userId: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;

  items: OrderLineItem[];

  // --- Full price breakdown (all server-computed, see
  // src/lib/pricing/calculate.ts — the ONE place every one of these
  // numbers is derived; never recomputed differently anywhere else) ---
  /** Sum of every line's lineTotal (i.e. already sale-price-based, NOT
   * MRP-based — "productDiscount" below is purely the informational
   * MRP-vs-sale-price gap, already baked into this number). */
  subtotal: number;
  /** Sum of (unitMrp - unitSalePrice) * quantity across every line —
   * shown in the breakdown as "Product Discount", informational only
   * (subtotal already reflects sale prices, so this is NOT subtracted
   * again). */
  productDiscount: number;
  couponCode?: string;
  couponDiscount: number;
  /** subtotal - couponDiscount — what tax is actually computed on. */
  taxableAmount: number;
  tax: number;
  taxBreakdown: { name: string; ratePercent: number; amount: number }[];
  deliveryFee: number;
  /** taxableAmount + tax + deliveryFee — the SAME number sent to
   * Cashfree as order_amount. This, not `subtotal`, is the
   * authoritative payment amount once coupons/tax/delivery exist. */
  total: number;
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
export const ORDER_ITEM_CATEGORIES: OrderItemCategory[] = [
  "gemstone",
  "bracelet",
  "rudraksha",
  "spiritual",
  "yantra",
  "consultation",
  "report",
  "healing",
  "puja",
  "course",
];

/** True once every line in the order is one specific category — used
 * by the admin category filter/tabs. */
export function orderCategories(order: Pick<Order, "items">): OrderItemCategory[] {
  return Array.from(new Set(order.items.map((item) => item.category)));
}
