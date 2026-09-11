// src/components/cart/cartLines.ts
// Shared cart -> API-hint conversion, used by CouponSelector,
// PriceBreakdown, and checkout/page.tsx so every caller that needs to
// tell the server what's in the cart builds the SAME shapes the same
// way. Never includes a price — every price is server-derived (see
// resolve-cart.ts's CartLineHint and coupons/eligible's body shape).
import type { CartItem } from "@/context/CartContext";

export type CartLineHint =
  | { category: string; productId: string; ratti: number; quantity: number }
  | { category: string; serviceId: string; duration: number; quantity: number }
  | { category: string; productId: string; variantId: string; quantity: number }
  | { category: "report"; productId: string; quantity: number };

/** Converts one cart line into the `{category, productId|serviceId,
 * variantId|ratti|duration, quantity}` hint shape POSTed as `lines` to
 * /api/coupons/preview and /api/payments/create-order. Returns null for
 * a line with no meta a hint can be built from (nothing in the current
 * cart flows should hit that, but a legacy price-less product line is
 * defensively skipped rather than sent malformed). */
export function cartItemToLineHint(item: CartItem): CartLineHint | null {
  if (item.type === "gemstone" && item.meta && "ratti" in item.meta) {
    return { category: "gemstone", productId: item.meta.productId, ratti: item.meta.ratti, quantity: item.quantity };
  }
  if (item.type === "consultation" && item.meta && "serviceId" in item.meta) {
    return { category: "consultation", serviceId: item.meta.serviceId, duration: item.meta.duration, quantity: item.quantity };
  }
  if (item.type === "product" && item.meta && "variantId" in item.meta) {
    return {
      category: item.meta.category,
      productId: item.meta.productId,
      variantId: item.meta.variantId,
      quantity: item.quantity,
    };
  }
  if (item.type === "report" && item.meta && "reportSlug" in item.meta) {
    return { category: "report", productId: item.meta.reportSlug, quantity: item.quantity };
  }
  return null;
}

/** All cart lines converted to hints, dropping any that can't be built
 * (see cartItemToLineHint). */
export function cartItemsToLines(items: CartItem[]): CartLineHint[] {
  return items.map(cartItemToLineHint).filter((l): l is CartLineHint => l !== null);
}

/** One entry per cart line's category + (when it has one) productId —
 * the shape /api/coupons/eligible wants to decide which coupons are
 * even worth showing. Consultations have no productId. */
export function cartItemsToCategoriesAndProductIds(items: CartItem[]): {
  categories: string[];
  productIds: string[];
} {
  const categories = new Set<string>();
  const productIds = new Set<string>();
  for (const item of items) {
    if (item.type === "gemstone" && item.meta && "productId" in item.meta) {
      categories.add("gemstone");
      productIds.add(item.meta.productId);
    } else if (item.type === "consultation") {
      categories.add("consultation");
    } else if (item.type === "product" && item.meta && "category" in item.meta) {
      categories.add(item.meta.category);
      if ("productId" in item.meta) productIds.add(item.meta.productId);
    } else if (item.type === "report" && item.meta && "reportSlug" in item.meta) {
      categories.add("report");
      productIds.add(item.meta.reportSlug);
    }
  }
  return { categories: Array.from(categories), productIds: Array.from(productIds) };
}
