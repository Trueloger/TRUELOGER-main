// src/lib/orders/resolve-cart.ts
// The ONE place a checkout request's cart lines get turned into
// authoritative, priced order line-items PLUS the full cart pricing
// breakdown (coupon/tax/delivery/total via
// src/lib/pricing/calculate.ts). The client sends only hints — never a
// price, name, or discount — and this function re-derives everything
// from Firestore-backed product data (src/lib/products/store.ts) or
// the consultation catalogue (src/lib/consultation/*, unchanged).
//
// Backward compatibility: the existing gemstone UI
// (GemstoneCard/RattiSheet/GemstoneRattiSelector, none of which were
// touched for this pricing-engine upgrade) sends
// `{category:"gemstone", productId, ratti, quantity}` — `ratti` (a
// number) is accepted as an alias for `variantId` and converted to
// `String(ratti)` internally, since every gemstone product's variant
// ids ARE their Ratti numbers as strings (see
// scripts/dev/seed-products.ts). New categories (bracelet/rudraksha/
// spiritual/yantra) use `variantId` directly — there is no
// category-specific "ratti-only" path in the resolver itself, only in
// this one input-normalization step.
import { getConsultationPrice, validateDuration } from "@/lib/consultation/pricing";
import { getServiceById } from "@/lib/consultation/services-data";
import { getProductById } from "@/lib/products/store";
import { findVariant, variantDiscountPercent, type ProductCategory } from "@/lib/products/types";
import { getCoupon, getRedemptionCounts } from "@/lib/coupons/store";
import { getTaxSettings, getDeliverySettings } from "@/lib/settings/store";
import { calculateCartPricing, type CartPricingResult } from "@/lib/pricing/calculate";
import type { OrderLineItem } from "./types";

const PRODUCT_CATEGORIES: ProductCategory[] = ["gemstone", "bracelet", "rudraksha", "spiritual", "yantra"];

export type CartLineHint =
  | { category: ProductCategory; productId: string; variantId?: string; ratti?: number; quantity?: number }
  | { category: "consultation"; serviceId: string; duration: number; quantity?: number };

export type ResolveCartResult =
  | {
      ok: true;
      items: OrderLineItem[];
      pricing: CartPricingResult;
    }
  | { ok: false; error: string };

const MAX_QUANTITY = 10;

function normalizeQuantity(input: unknown): number {
  if (typeof input !== "number" || !Number.isInteger(input) || input < 1) return 1;
  return Math.min(input, MAX_QUANTITY);
}

async function resolveOneLine(raw: unknown): Promise<OrderLineItem | { error: string }> {
  if (typeof raw !== "object" || raw === null) return { error: "Invalid cart item." };
  const hint = raw as Record<string, unknown>;
  const quantity = normalizeQuantity(hint.quantity);

  if (hint.category === "consultation") {
    if (typeof hint.serviceId !== "string") return { error: "Invalid consultation item." };
    const service = getServiceById(hint.serviceId);
    if (!service) return { error: "Unknown consultation service." };
    const check = validateDuration(hint.duration);
    if (!check.valid) return { error: check.reason };
    const unitPrice = getConsultationPrice(service.pricing, check.duration);
    return {
      category: "consultation",
      serviceId: service.id,
      serviceName: service.name,
      duration: check.duration,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    };
  }

  if (typeof hint.category !== "string" || !PRODUCT_CATEGORIES.includes(hint.category as ProductCategory)) {
    return { error: "Unsupported cart item type." };
  }
  if (typeof hint.productId !== "string") return { error: "Invalid product item." };

  const product = await getProductById(hint.productId);
  if (!product || product.status !== "published") return { error: "This product is no longer available." };
  if (product.category !== hint.category) return { error: "Product category mismatch." };

  // Accept either an explicit variantId, or (gemstone backward-compat)
  // a numeric `ratti` that maps to the variant of the same id.
  const variantId =
    typeof hint.variantId === "string"
      ? hint.variantId
      : typeof hint.ratti === "number"
        ? String(hint.ratti)
        : undefined;
  if (!variantId) return { error: "Select a valid option before adding to cart." };

  const variant = findVariant(product, variantId);
  if (!variant) return { error: "This option is not available for this product." };
  if (variant.inStock === false) return { error: "This option is currently out of stock." };

  return {
    category: product.category,
    productId: product.id,
    productName: product.name,
    variantId: variant.id,
    variantLabel: variant.label,
    ratti: product.category === "gemstone" ? variant.ratti ?? Number(variant.id) : undefined,
    quantity,
    unitMrp: variant.mrp,
    unitSalePrice: variant.salePrice,
    discountPercent: variantDiscountPercent(variant),
    lineTotal: variant.salePrice * quantity,
  };
}

export async function resolveCartLines(
  hints: unknown,
  options: { couponCode?: string; uid?: string } = {},
): Promise<ResolveCartResult> {
  if (!Array.isArray(hints) || hints.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }
  if (hints.length > 20) {
    return { ok: false, error: "Too many items in one order." };
  }

  const items: OrderLineItem[] = [];
  for (const raw of hints) {
    const resolved = await resolveOneLine(raw);
    if ("error" in resolved) return { ok: false, error: resolved.error };
    items.push(resolved);
  }

  const rawSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  if (rawSubtotal <= 0) return { ok: false, error: "Order amount must be greater than zero." };

  const [taxSettings, deliverySettings] = await Promise.all([getTaxSettings(), getDeliverySettings()]);

  let coupon = null;
  if (options.couponCode) {
    coupon = await getCoupon(options.couponCode);
    if (coupon && options.uid) {
      const { userCount, totalCount } = await getRedemptionCounts(coupon.code, options.uid);
      if (coupon.perUserLimit && userCount >= coupon.perUserLimit) coupon = null;
      else if (coupon.usageLimit && totalCount >= coupon.usageLimit) coupon = null;
    }
  }

  const pricing = calculateCartPricing(items, { coupon, taxSettings, deliverySettings });

  return { ok: true, items, pricing };
}
