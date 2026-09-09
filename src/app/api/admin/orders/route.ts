// src/app/api/admin/orders/route.ts
// Admin-only, paginated order listing + fulfillment-status updates.
// Every request is verified via verifyAdminRequest — the `admin: true`
// Firebase custom claim, never a client-sent role/email. A normal
// signed-in user hitting this route gets the exact same 401 as an
// anonymous request (see verify-request.ts's doc comment on why admin
// routes don't distinguish "not logged in" from "logged in, not
// admin").
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { listOrdersForAdmin, updateFulfillmentStatus, getOrder } from "@/lib/orders/store";
import type { FulfillmentStatus, PaymentStatus } from "@/lib/orders/types";

const VALID_PAYMENT_STATUSES: PaymentStatus[] = [
  "CREATED", "PENDING", "PAID", "FAILED", "CANCELLED", "EXPIRED", "REFUNDED", "PARTIALLY_REFUNDED",
];

// What an admin may advance fulfillment TO, and from which payment
// state that's allowed — this is the "do not let admin mark an unpaid
// order as delivered" guard. Only forward-moving, PAID-gated
// transitions are permitted; payment status itself is never editable
// here at all (it only ever comes from Cashfree via verify/webhook).
const ADMIN_ALLOWED_FULFILLMENT: FulfillmentStatus[] = [
  "PROCESSING", "SHIPPED", "DELIVERED", "BOOKING_PENDING", "SCHEDULED", "COMPLETED", "CANCELLED",
];

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const url = new URL(request.url);
  const paymentStatusParam = url.searchParams.get("paymentStatus");
  const cursorParam = url.searchParams.get("cursor");

  const paymentStatus =
    paymentStatusParam && VALID_PAYMENT_STATUSES.includes(paymentStatusParam as PaymentStatus)
      ? (paymentStatusParam as PaymentStatus)
      : undefined;

  const page = await listOrdersForAdmin({
    paymentStatus,
    cursorCreatedAt: cursorParam ? Number(cursorParam) : undefined,
  });

  return NextResponse.json(page);
}

export async function PATCH(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { orderId, fulfillmentStatus } = (body as { orderId?: unknown; fulfillmentStatus?: unknown }) ?? {};

  if (typeof orderId !== "string" || !orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }
  if (typeof fulfillmentStatus !== "string" || !ADMIN_ALLOWED_FULFILLMENT.includes(fulfillmentStatus as FulfillmentStatus)) {
    return NextResponse.json({ error: "Invalid fulfillment status." }, { status: 400 });
  }

  const order = await getOrder(orderId);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.paymentStatus !== "PAID") {
    return NextResponse.json(
      { error: "Fulfillment can only be updated on a paid order." },
      { status: 409 },
    );
  }

  await updateFulfillmentStatus(orderId, fulfillmentStatus as FulfillmentStatus);

  // Minimal admin audit trail (per the "important admin changes must
  // be traceable" requirement) — a lightweight, append-only log rather
  // than a full audit UI, given scope.
  const { getAdminApp } = await import("@/lib/firebase-admin");
  const { getFirestore } = await import("firebase-admin/firestore");
  await getFirestore(getAdminApp())
    .collection("adminAuditLog")
    .add({
      adminUid: admin.uid,
      action: "update_fulfillment_status",
      orderId,
      newStatus: fulfillmentStatus,
      timestamp: Date.now(),
    });

  return NextResponse.json({ ok: true });
}
