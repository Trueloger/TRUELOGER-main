// src/app/api/payments/verify/route.ts
// Step 2: called by the order-confirmation page after Cashfree
// redirects the browser back. Never trusts the return URL's query
// params as proof of payment — re-fetches the order/payment status
// directly from Cashfree (the authoritative source) and reconciles the
// internal order via the same idempotent transition used by the
// webhook (src/lib/orders/store.ts::applyPaymentStatus), so calling
// this endpoint repeatedly (e.g. the user refreshing the confirmation
// page) is always safe and never double-applies anything.
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verify-request";
import { getOrder, applyPaymentStatus } from "@/lib/orders/store";
import { getCashfreeOrderStatus } from "@/lib/cashfree/server";
import type { PaymentStatus } from "@/lib/orders/types";

// Bounds how long a single verify call can run — Cashfree's status
// calls normally complete in well under a second; capping this means a
// hung upstream call fails fast with a clear error instead of silently
// eating the platform's default function timeout and leaving the
// browser's own fetch hanging with no response at all.
export const maxDuration = 15;

function mapCashfreeStatus(orderStatus: string, latestPaymentStatus: string | null): PaymentStatus | null {
  if (latestPaymentStatus === "SUCCESS" || orderStatus === "PAID") return "PAID";
  if (latestPaymentStatus === "FAILED") return "FAILED";
  if (orderStatus === "EXPIRED") return "EXPIRED";
  if (orderStatus === "TERMINATED") return "CANCELLED";
  // ACTIVE order with a pending/user-dropped/no payment attempt yet —
  // nothing terminal to record; caller keeps polling/shows "pending".
  return null;
}

export async function POST(request: Request) {
  // Lightweight timing only — no secrets, no card/payment details,
  // just enough to see which leg (auth / order lookup / Cashfree call
  // / order write) is actually slow if this ever needs diagnosing
  // again. Cheap enough to leave on permanently.
  const t0 = Date.now();

  const verified = await verifyRequest(request);
  if (!verified) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { orderId } = (body as { orderId?: unknown }) ?? {};
  if (typeof orderId !== "string" || !orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  const order = await getOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.userId !== verified.uid && !verified.isAdmin) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (!order.cashfreeOrderId) {
    return NextResponse.json({ error: "Payment was never started for this order." }, { status: 400 });
  }

  // Already terminal — nothing to re-verify, just report it (avoids an
  // unnecessary extra Cashfree API call on every confirmation-page
  // refresh once the order is already settled, and is usually already
  // moot in practice since the live order the confirmation page
  // listens to reflects this before this response even lands).
  if (["PAID", "FAILED", "CANCELLED", "EXPIRED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(order.paymentStatus)) {
    console.log(`[payments/verify] ${orderId} already terminal (${order.paymentStatus}) in ${Date.now() - t0}ms`);
    return NextResponse.json({ paymentStatus: order.paymentStatus, fulfillmentStatus: order.fulfillmentStatus });
  }

  const tOrderLoaded = Date.now();

  try {
    const status = await getCashfreeOrderStatus(order.cashfreeOrderId);
    const tCashfree = Date.now();
    const nextStatus = mapCashfreeStatus(status.orderStatus, status.latestPaymentStatus);

    if (!nextStatus) {
      console.log(
        `[payments/verify] ${orderId} still pending — order-load ${tOrderLoaded - t0}ms, cashfree ${tCashfree - tOrderLoaded}ms`,
      );
      return NextResponse.json({ paymentStatus: "PENDING", fulfillmentStatus: order.fulfillmentStatus });
    }

    const eventId = `verify:${order.cashfreeOrderId}:${status.orderStatus}:${status.latestPaymentStatus ?? "none"}`;
    const updated = await applyPaymentStatus(orderId, nextStatus, eventId);
    console.log(
      `[payments/verify] ${orderId} -> ${nextStatus} — order-load ${tOrderLoaded - t0}ms, cashfree ${tCashfree - tOrderLoaded}ms, write ${Date.now() - tCashfree}ms, total ${Date.now() - t0}ms`,
    );

    return NextResponse.json({
      paymentStatus: updated?.paymentStatus ?? nextStatus,
      fulfillmentStatus: updated?.fulfillmentStatus ?? order.fulfillmentStatus,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to verify payment right now.";
    console.log(`[payments/verify] ${orderId} failed after ${Date.now() - t0}ms: ${message}`);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
