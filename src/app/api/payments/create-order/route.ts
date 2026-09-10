// src/app/api/payments/create-order/route.ts
// Step 1 of the Cashfree flow: authenticate the caller, re-price the
// cart lines server-side (never trust a client-provided amount), write
// an internal `orders/{orderId}` doc in CREATED state, create the
// matching Cashfree order, and return only the `paymentSessionId` the
// browser needs to open Cashfree's checkout — never the secret key.
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { verifyRequest } from "@/lib/auth/verify-request";
import { resolveCartLines } from "@/lib/orders/resolve-cart";
import { createPendingOrder, attachCashfreeSession } from "@/lib/orders/store";
import { createCashfreeOrder } from "@/lib/cashfree/server";
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

export const maxDuration = 30;

function newOrderId(uid: string): string {
  // Cashfree order_id allows alphanumeric, underscore, hyphen only.
  const shortUid = uid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  return `ord_${shortUid}_${Date.now()}_${randomBytes(3).toString("hex")}`;
}

export async function POST(request: Request) {
  const verified = await verifyRequest(request);
  if (!verified) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }
  if (!verified.email) {
    return NextResponse.json({ error: "Your account has no email on file." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { lines, couponCode } = (body as { lines?: unknown; couponCode?: unknown }) ?? {};

  const resolved = await resolveCartLines(lines, {
    couponCode: typeof couponCode === "string" ? couponCode : undefined,
    uid: verified.uid,
  });
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  // Best-effort profile lookup for a friendlier Cashfree checkout
  // (name/phone) — never required, never trusted for pricing.
  let customerName: string | undefined;
  let customerPhone: string | undefined;
  try {
    const profileSnap = await getFirestore(getAdminApp()).collection("users").doc(verified.uid).get();
    const profile = profileSnap.data();
    customerName = profile?.fullName;
    customerPhone = profile?.phone;
  } catch {
    // Profile lookup is a courtesy, not a requirement for checkout.
  }

  const orderId = newOrderId(verified.uid);

  await createPendingOrder({
    orderId,
    userId: verified.uid,
    customerEmail: verified.email,
    customerName,
    customerPhone,
    items: resolved.items,
    pricing: resolved.pricing,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const cf = await createCashfreeOrder({
      orderId,
      amount: resolved.pricing.total,
      customerId: verified.uid,
      customerEmail: verified.email,
      customerPhone,
      customerName,
      returnUrl: `${appUrl}/account/orders/${orderId}/confirmation`,
    });
    await attachCashfreeSession(orderId, cf.cfOrderId, cf.paymentSessionId);

    return NextResponse.json({
      orderId,
      paymentSessionId: cf.paymentSessionId,
      amount: resolved.pricing.total,
      pricing: resolved.pricing,
      mode: process.env.NEXT_PUBLIC_CASHFREE_MODE === "production" ? "production" : "sandbox",
    });
  } catch (err) {
    // The internal order row stays behind in CREATED state (harmless —
    // it just never got a Cashfree session) rather than being deleted,
    // so this failure is still traceable if it happens repeatedly.
    const message = err instanceof Error ? err.message : "Unable to start payment.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
