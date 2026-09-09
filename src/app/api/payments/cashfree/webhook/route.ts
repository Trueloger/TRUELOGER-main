// src/app/api/payments/cashfree/webhook/route.ts
// Cashfree's server-to-server payment notification. This is the
// reliable "the browser was closed but the payment still succeeded"
// path — see cashfree/server.ts's doc comment. NOT protected by
// verifyRequest (Cashfree isn't a logged-in user) — protected instead
// by verifying Cashfree's own HMAC signature on every request, which
// is the actual authenticity check here. Always reads the RAW body as
// text before anything else, since the signature is computed over the
// exact raw bytes Cashfree sent, not a re-serialized JSON.parse/
// JSON.stringify round-trip (which can reorder keys/whitespace and
// silently break verification).
import { NextResponse } from "next/server";
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree/server";
import { applyPaymentStatus } from "@/lib/orders/store";
import type { PaymentStatus } from "@/lib/orders/types";

function mapWebhookEventType(type: string, paymentStatus: string | undefined): PaymentStatus | null {
  if (type === "PAYMENT_SUCCESS_WEBHOOK" || paymentStatus === "SUCCESS") return "PAID";
  if (type === "PAYMENT_FAILED_WEBHOOK" || paymentStatus === "FAILED") return "FAILED";
  if (type === "PAYMENT_USER_DROPPED_WEBHOOK") return "PENDING";
  if (type === "ORDER_EXPIRED_WEBHOOK") return "EXPIRED";
  return null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");
  const timestamp = request.headers.get("x-webhook-timestamp");

  if (!signature || !timestamp) {
    return NextResponse.json({ error: "Missing webhook signature." }, { status: 401 });
  }

  let signatureValid: boolean;
  try {
    signatureValid = verifyCashfreeWebhookSignature(rawBody, timestamp, signature);
  } catch {
    return NextResponse.json({ error: "Webhook verification misconfigured." }, { status: 500 });
  }
  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid webhook body." }, { status: 400 });
  }

  const event = payload as {
    type?: string;
    data?: {
      order?: { order_id?: string };
      payment?: { payment_status?: string; cf_payment_id?: string | number };
    };
  };

  const orderId = event.data?.order?.order_id;
  if (!orderId) {
    // Nothing we can act on — acknowledge so Cashfree doesn't retry a
    // malformed event forever, but there is genuinely no order to update.
    return NextResponse.json({ received: true });
  }

  const nextStatus = mapWebhookEventType(event.type ?? "", event.data?.payment?.payment_status);
  if (!nextStatus) {
    // An event type this route doesn't act on (e.g. a refund webhook
    // this integration doesn't handle yet) — acknowledge, don't error.
    return NextResponse.json({ received: true });
  }

  const cfPaymentId = event.data?.payment?.cf_payment_id;
  const eventId = cfPaymentId ? `webhook:${cfPaymentId}` : `webhook:${orderId}:${timestamp}`;

  try {
    await applyPaymentStatus(orderId, nextStatus, eventId);
  } catch {
    // A transient Firestore error here should make Cashfree retry the
    // webhook rather than silently losing the event — surface 500.
    return NextResponse.json({ error: "Failed to process webhook." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
