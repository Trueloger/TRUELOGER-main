// src/app/api/coupons/eligible/route.ts
// Customer-facing: given a cart summary (subtotal + categories +
// productIds — NEVER prices computed client-side, this is only used
// to decide which coupons are worth SHOWING, the actual discount is
// always recomputed authoritatively by /api/coupons/preview and by
// checkout itself), returns the coupons currently eligible for this
// cart. Public — no auth required to see what coupons exist, since
// browsing available offers isn't privileged (per-user usage-limit
// filtering only happens once an authenticated preview/checkout
// actually tries to apply one).
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verify-request";
import { listActiveCoupons, getRedemptionCounts } from "@/lib/coupons/store";
import { checkCouponEligibility } from "@/lib/coupons/types";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const b = (body as Record<string, unknown>) ?? {};
  const subtotal = typeof b.subtotal === "number" ? b.subtotal : 0;
  const categories = Array.isArray(b.categories) ? (b.categories as string[]) : [];
  const productIds = Array.isArray(b.productIds) ? (b.productIds as string[]) : [];

  const verified = await verifyRequest(request); // optional — used only for per-user limit filtering
  const active = await listActiveCoupons();

  const eligible = [];
  for (const coupon of active) {
    const check = checkCouponEligibility(coupon, { subtotal, categories, productIds });
    if (!check.eligible) continue;
    if (verified) {
      const { userCount } = await getRedemptionCounts(coupon.code, verified.uid);
      if (coupon.perUserLimit && userCount >= coupon.perUserLimit) continue;
    }
    eligible.push({
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.value,
      maxDiscount: coupon.maxDiscount,
      description: coupon.description,
    });
  }

  return NextResponse.json({ coupons: eligible });
}
