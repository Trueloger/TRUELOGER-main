// src/lib/coupons/types.ts
// Coupon model — Firestore `coupons/{code}` (the code itself,
// normalized, IS the doc id: uppercased, trimmed — see
// normalizeCouponCode below, used identically by every layer that
// touches a code so "save20" and "SAVE20 " always mean the same
// coupon). Redemption counts live in a subcollection
// (`coupons/{code}/redemptions/{uid}`) rather than a map field on the
// coupon doc, so incrementing one user's count never contends with a
// different user's concurrent redemption of the SAME coupon (a map
// field would require a full-document read-modify-write, serializing
// every redemption of a popular coupon through one hot document).
export type CouponDiscountType = "percentage" | "fixed";

export type Coupon = {
  code: string; // normalized, uppercase — see normalizeCouponCode
  discountType: CouponDiscountType;
  /** Percentage (0-100) or a flat rupee amount, per discountType. */
  value: number;
  /** Caps how much a percentage coupon can discount in rupees — has no
   * effect on a fixed-amount coupon (its value already IS the cap). */
  maxDiscount?: number;
  minCartValue?: number;
  /** Epoch ms. Both inclusive of the instant given. */
  startDate: number;
  endDate: number;
  /** Total redemptions allowed across all users, ever. */
  usageLimit?: number;
  /** Redemptions allowed per signed-in user. */
  perUserLimit?: number;
  /** When set, the coupon only discounts lines whose category is in
   * this list — other lines in a mixed cart are left undiscounted by
   * it (see pricing engine). Omitted = applies to any category. */
  categoryRestriction?: string[];
  /** When set, only these specific productIds are discounted. Omitted
   * = no product restriction (still subject to categoryRestriction if
   * that's also set). */
  productRestriction?: string[];
  active: boolean;
  description?: string; // shown in the cart's coupon list, e.g. "20% off gemstones"
  createdAt: number;
  updatedAt: number;
};

export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export type CouponEligibility =
  | { eligible: true }
  | { eligible: false; reason: string };

/** Pure, side-effect-free eligibility check against a cart's pre-coupon
 * subtotal and category mix — does NOT check usage limits (that
 * requires a Firestore read of the redemptions subcollection, done
 * separately in store.ts since it needs the current user's id and a
 * live count). Shared by the coupon-apply API (to explain WHY a coupon
 * isn't eligible) and the cart's "eligible coupons" list (to decide
 * which coupons to even show). */
export function checkCouponEligibility(
  coupon: Coupon,
  cart: { subtotal: number; categories: string[]; productIds: string[] },
  now: number = Date.now(),
): CouponEligibility {
  if (!coupon.active) return { eligible: false, reason: "This coupon is no longer active." };
  if (now < coupon.startDate) return { eligible: false, reason: "This coupon isn't active yet." };
  if (now > coupon.endDate) return { eligible: false, reason: "This coupon has expired." };
  if (coupon.minCartValue && cart.subtotal < coupon.minCartValue) {
    return {
      eligible: false,
      reason: `Add items worth ${coupon.minCartValue - cart.subtotal} more to use this coupon.`,
    };
  }
  if (coupon.categoryRestriction?.length) {
    const hasEligibleCategory = cart.categories.some((c) => coupon.categoryRestriction!.includes(c));
    if (!hasEligibleCategory) {
      return { eligible: false, reason: "This coupon isn't valid for the items in your cart." };
    }
  }
  if (coupon.productRestriction?.length) {
    const hasEligibleProduct = cart.productIds.some((id) => coupon.productRestriction!.includes(id));
    if (!hasEligibleProduct) {
      return { eligible: false, reason: "This coupon isn't valid for the items in your cart." };
    }
  }
  return { eligible: true };
}

/** The discount amount a coupon contributes, given the portion of the
 * cart subtotal it's actually eligible to discount (i.e. only the
 * lines matching its category/product restriction, pre-computed by the
 * caller — see pricing/calculate.ts). Never negative, never more than
 * `eligibleAmount` itself. */
export function computeCouponDiscount(coupon: Coupon, eligibleAmount: number): number {
  if (eligibleAmount <= 0) return 0;
  let discount =
    coupon.discountType === "percentage" ? Math.round((eligibleAmount * coupon.value) / 100) : coupon.value;
  if (coupon.discountType === "percentage" && coupon.maxDiscount) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  return Math.max(0, Math.min(discount, eligibleAmount));
}
