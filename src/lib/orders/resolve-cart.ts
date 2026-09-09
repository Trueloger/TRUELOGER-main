// src/lib/orders/resolve-cart.ts
// The ONE place a checkout request's cart lines get turned into
// authoritative, priced order line-items. The client sends only
// {category, productId|serviceId, ratti|duration, quantity} — pure
// hints — and this function re-derives everything else (name, MRP,
// sale price, discount, unit price) from the SAME server-owned pricing
// engines the rest of the site already trusts
// (src/lib/gemstones/pricing.ts, src/lib/consultation/pricing.ts). No
// price, name, or discount is ever accepted from the client. Used by
// /api/payments/create-order — the single call site.
import { getGemstoneById } from "@/lib/gemstones/gemstone-data";
import { getGemstonePrice, validateRatti } from "@/lib/gemstones/pricing";
import { getServiceById } from "@/lib/consultation/services-data";
import { getConsultationPrice, validateDuration } from "@/lib/consultation/pricing";
import type { OrderLineItem } from "./types";

export type CartLineHint =
  | { category: "gemstone"; productId: string; ratti: number; quantity?: number }
  | { category: "consultation"; serviceId: string; duration: number; quantity?: number };

export type ResolveCartResult =
  | { ok: true; items: OrderLineItem[]; subtotal: number }
  | { ok: false; error: string };

const MAX_QUANTITY = 10;

function normalizeQuantity(input: unknown): number {
  if (typeof input !== "number" || !Number.isInteger(input) || input < 1) return 1;
  return Math.min(input, MAX_QUANTITY);
}

export function resolveCartLines(hints: unknown): ResolveCartResult {
  if (!Array.isArray(hints) || hints.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }
  if (hints.length > 20) {
    return { ok: false, error: "Too many items in one order." };
  }

  const items: OrderLineItem[] = [];

  for (const raw of hints) {
    if (typeof raw !== "object" || raw === null) {
      return { ok: false, error: "Invalid cart item." };
    }
    const hint = raw as Record<string, unknown>;
    const quantity = normalizeQuantity(hint.quantity);

    if (hint.category === "gemstone") {
      if (typeof hint.productId !== "string") return { ok: false, error: "Invalid gemstone item." };
      const product = getGemstoneById(hint.productId);
      if (!product) return { ok: false, error: "Unknown gemstone product." };
      const check = validateRatti(product.rattiOptions, product.pricing, hint.ratti);
      if (!check.valid) return { ok: false, error: check.reason };
      const price = getGemstonePrice(product.pricing, check.ratti);
      items.push({
        category: "gemstone",
        productId: product.id,
        productName: product.name,
        ratti: check.ratti,
        quantity,
        unitMrp: price.mrp,
        unitSalePrice: price.salePrice,
        discountPercent: price.discountPercent,
        lineTotal: price.salePrice * quantity,
      });
    } else if (hint.category === "consultation") {
      if (typeof hint.serviceId !== "string") return { ok: false, error: "Invalid consultation item." };
      const service = getServiceById(hint.serviceId);
      if (!service) return { ok: false, error: "Unknown consultation service." };
      const check = validateDuration(hint.duration);
      if (!check.valid) return { ok: false, error: check.reason };
      const unitPrice = getConsultationPrice(service.pricing, check.duration);
      items.push({
        category: "consultation",
        serviceId: service.id,
        serviceName: service.name,
        duration: check.duration,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
      });
    } else {
      return { ok: false, error: "Unsupported cart item type." };
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  if (subtotal <= 0) return { ok: false, error: "Order amount must be greater than zero." };

  return { ok: true, items, subtotal };
}
