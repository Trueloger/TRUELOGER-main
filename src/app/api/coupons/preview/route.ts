// src/app/api/coupons/preview/route.ts
// Customer-facing cart pricing preview — the cart drawer calls this on
// every quantity/coupon change to show the real, server-authoritative
// breakdown (subtotal/discount/coupon/tax/delivery/total) WITHOUT
// creating an order (create-order does the exact same resolution, this
// route exists purely so the cart UI can show accurate numbers before
// the user ever commits to checkout). Auth optional — a signed-out
// visitor can still see an accurate preview; only the per-user coupon
// usage-limit check is skipped for them (same as /api/coupons/eligible).
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verify-request";
import { resolveCartLines } from "@/lib/orders/resolve-cart";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { lines, couponCode } = (body as { lines?: unknown; couponCode?: unknown }) ?? {};

  const verified = await verifyRequest(request);
  const resolved = await resolveCartLines(lines, {
    couponCode: typeof couponCode === "string" ? couponCode : undefined,
    uid: verified?.uid,
  });

  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }
  return NextResponse.json({ pricing: resolved.pricing });
}
