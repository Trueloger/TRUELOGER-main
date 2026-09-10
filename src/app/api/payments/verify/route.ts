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
// hung upstream call fails fast with a clear error the confirmation
// page can retry, instead of silently eating the platform's default
// function timeout and leaving the browser's own fetch hanging with no
// response at all (the actual "never stops" symptom this fixes).
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
  // refresh once the order is already settled).
  if (["PAID", "FAILED", "CANCELLED", "EXPIRED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(order.paymentStatus)) {
    return NextResponse.json({ paymentStatus: order.paymentStatus, fulfillmentStatus: order.fulfillmentStatus });
  }

  try {
    const status = await getCashfreeOrderStatus(order.cashfreeOrderId);
    const nextStatus = mapCashfreeStatus(status.orderStatus, status.latestPaymentStatus);

    if (!nextStatus) {
      return NextResponse.json({ paymentStatus: "PENDING", fulfillmentStatus: order.fulfillmentStatus });
    }

    const eventId = `verify:${order.cashfreeOrderId}:${status.orderStatus}:${status.latestPaymentStatus ?? "none"}`;
    const updated = await applyPaymentStatus(orderId, nextStatus, eventId);

    return NextResponse.json({
      paymentStatus: updated?.paymentStatus ?? nextStatus,
      fulfillmentStatus: updated?.fulfillmentStatus ?? order.fulfillmentStatus,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to verify payment right now.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
