// src/lib/pricing/calculate.ts
// THE single authoritative price-calculation function — used by
// checkout (create-order), the coupon-preview API, and nowhere else
// computes a discount/tax/delivery/total independently. Pure and
// synchronous: callers resolve items/coupon/settings from Firestore
// first (see orders/resolve-cart.ts), then pass the results in here.
//
// Calculation order (documented per the "establish and document a
// deterministic pricing order" requirement):
//   1. Each line's own sale price (already baked into item.lineTotal
//      by resolve-cart.ts — this engine does not re-derive product
//      prices, it only combines already-resolved lines).
//   2. Subtotal = sum of line totals (sale-price based).
//   3. Coupon discount, computed against the subset of lines the
//      coupon is eligible for (category/product restriction), capped
//      at that eligible subtotal and at the coupon's own maxDiscount.
//   4. Taxable amount = subtotal - couponDiscount.
//   5. Tax = sum over active TaxRules of ratePercent% of the portion
//      of taxableAmount belonging to that rule's matching categories
//      (a rule with no categoryRestriction matches everything).
//      Coupon discount is allocated across categories proportionally
//      to each category's share of the pre-coupon subtotal, so tax is
//      computed on the ACTUAL discounted amount per category, not on
//      the full pre-coupon amount.
//   6. Delivery fee = 0 if delivery-free threshold met by the taxable
//      amount, else the category-specific fee (max across categories
//      present) or the default fee if no category override applies.
//   7. Total = taxableAmount + tax + deliveryFee — this is what gets
//      sent to Cashfree as order_amount.
import type { OrderLineItem, OrderItemCategory } from "@/lib/orders/types";
import type { Coupon } from "@/lib/coupons/types";
import { checkCouponEligibility, computeCouponDiscount } from "@/lib/coupons/types";
import type { TaxSettings, DeliverySettings } from "@/lib/settings/types";

export type CartPricingResult = {
  subtotal: number;
  productDiscount: number;
  couponCode?: string;
  couponDiscount: number;
  couponError?: string; // set (and couponDiscount=0) when a requested coupon couldn't be applied
  taxableAmount: number;
  tax: number;
  taxBreakdown: { name: string; ratePercent: number; amount: number }[];
  deliveryFee: number;
  total: number;
};

function lineCategory(item: OrderLineItem): OrderItemCategory {
  return item.category;
}

function lineMrpGap(item: OrderLineItem): number {
  if (item.category === "consultation") return 0;
  return (item.unitMrp - item.unitSalePrice) * item.quantity;
}

export function calculateCartPricing(
  items: OrderLineItem[],
  options: {
    coupon?: Coupon | null;
    taxSettings: TaxSettings;
    deliverySettings: DeliverySettings;
  },
): CartPricingResult {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const productDiscount = items.reduce((sum, item) => sum + lineMrpGap(item), 0);

  const categories = Array.from(new Set(items.map(lineCategory)));
  const productIds = items
    .map((item) => (item.category === "consultation" ? null : item.productId))
    .filter((id): id is string => id !== null);

  let couponDiscount = 0;
  let couponError: string | undefined;
  const couponCode = options.coupon?.code;

  // Per-category subtotal share — used both to figure out which lines
  // a restricted coupon can discount and to allocate that discount
  // proportionally for tax purposes (step 5 above).
  const categorySubtotals = new Map<OrderItemCategory, number>();
  for (const item of items) {
    categorySubtotals.set(lineCategory(item), (categorySubtotals.get(lineCategory(item)) ?? 0) + item.lineTotal);
  }

  if (options.coupon) {
    const eligibility = checkCouponEligibility(options.coupon, { subtotal, categories, productIds });
    if (!eligibility.eligible) {
      couponError = eligibility.reason;
    } else {
      const eligibleAmount = options.coupon.categoryRestriction?.length
        ? items
            .filter((item) => options.coupon!.categoryRestriction!.includes(lineCategory(item)))
            .reduce((sum, item) => sum + item.lineTotal, 0)
        : subtotal;
      couponDiscount = computeCouponDiscount(options.coupon, eligibleAmount);
    }
  }

  const taxableAmount = Math.max(0, subtotal - couponDiscount);

  // Allocate couponDiscount across categories proportionally to each
  // category's share of the PRE-coupon subtotal, so a category-wide
  // coupon's savings show up as reduced tax on exactly the categories
  // it actually discounted, not spread evenly across everything.
  const taxBreakdown: { name: string; ratePercent: number; amount: number }[] = [];
  let tax = 0;
  for (const rule of options.taxSettings.rules) {
    if (!rule.active) continue;
    let ruleBase = 0;
    for (const [category, catSubtotal] of categorySubtotals) {
      if (rule.categoryRestriction && !rule.categoryRestriction.includes(category)) continue;
      const shareOfCoupon = subtotal > 0 ? (catSubtotal / subtotal) * couponDiscount : 0;
      ruleBase += Math.max(0, catSubtotal - shareOfCoupon);
    }
    const amount = Math.round((ruleBase * rule.ratePercent) / 100);
    if (amount > 0 || rule.ratePercent > 0) {
      taxBreakdown.push({ name: rule.name, ratePercent: rule.ratePercent, amount });
    }
    tax += amount;
  }

  const deliveryFee = computeDeliveryFee(taxableAmount, categories, options.deliverySettings);

  const total = taxableAmount + tax + deliveryFee;

  return {
    subtotal,
    productDiscount,
    couponCode: couponDiscount > 0 ? couponCode : undefined,
    couponDiscount,
    couponError,
    taxableAmount,
    tax,
    taxBreakdown,
    deliveryFee,
    total,
  };
}

function computeDeliveryFee(
  taxableAmount: number,
  categories: OrderItemCategory[],
  settings: DeliverySettings,
): number {
  if (settings.freeDeliveryThreshold && taxableAmount >= settings.freeDeliveryThreshold) return 0;
  if (!settings.categoryFees) return settings.defaultFee;
  // A mixed cart pays the HIGHEST applicable per-category fee once
  // (not summed per category) — one delivery, priced for the most
  // expensive-to-ship category present.
  const fees = categories.map((c) => settings.categoryFees?.[c] ?? settings.defaultFee);
  return fees.length > 0 ? Math.max(...fees) : settings.defaultFee;
}
