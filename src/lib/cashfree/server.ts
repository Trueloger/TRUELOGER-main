// src/lib/cashfree/server.ts
// Server-only Cashfree Payment Gateway client (REST, no SDK — the PG
// API is a handful of plain JSON endpoints, so a thin typed fetch
// wrapper avoids pinning to a third-party SDK's own version churn).
// NEVER import this from a "use client" file — CASHFREE_SECRET_KEY
// must never reach the browser bundle, same rule as firebase-admin.ts.
//
// Uses the current Cashfree PG API version (2023-08-01): server
// creates the order and gets back a `payment_session_id`; the browser
// opens Cashfree's hosted checkout with ONLY that session id (never
// the secret key) via the Cashfree JS SDK. After return, and via
// webhook, the server re-fetches the order/payment status directly
// from Cashfree — the authoritative source of truth — rather than
// trusting the client's redirect.
import crypto from "node:crypto";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
// "sandbox" or "production" — public because it's not a secret, just
// which base URL to hit; mirrors NEXT_PUBLIC_CASHFREE_MODE so the
// client-side checkout script and the server API agree on environment.
const CASHFREE_MODE = process.env.NEXT_PUBLIC_CASHFREE_MODE === "production" ? "production" : "sandbox";
const CASHFREE_API_VERSION = "2023-08-01";

const BASE_URL =
  CASHFREE_MODE === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";

function requireCredentials(): { appId: string; secretKey: string } {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    throw new Error("Missing CASHFREE_APP_ID / CASHFREE_SECRET_KEY environment variables.");
  }
  return { appId: CASHFREE_APP_ID, secretKey: CASHFREE_SECRET_KEY };
}

function authHeaders(): HeadersInit {
  const { appId, secretKey } = requireCredentials();
  return {
    "Content-Type": "application/json",
    "x-client-id": appId,
    "x-client-secret": secretKey,
    "x-api-version": CASHFREE_API_VERSION,
  };
}

export type CreateCashfreeOrderInput = {
  /** The INTERNAL order id (Firestore orders/{orderId} doc id) — used
   * as the Cashfree order_id too, so the two systems share one key and
   * reconciliation never needs a lookup table. */
  orderId: string;
  amount: number;
  customerId: string;
  customerEmail: string;
  customerPhone?: string;
  customerName?: string;
  returnUrl: string;
  /** Explicit per-order webhook target — set on every order rather
   * than relying on whatever (if anything) is configured as the
   * default in the Cashfree merchant dashboard, which is exactly the
   * kind of environment-drift bug that made `returnUrl` point at
   * localhost in production before this field existed. This is what
   * lets the webhook (the FAST, push-based confirmation path — often
   * faster than the browser's own redirect completes) actually work,
   * instead of every confirmation depending solely on the
   * confirmation page polling Cashfree's REST API after redirect. */
  notifyUrl: string;
};

export type CashfreeOrderResult = {
  cfOrderId: string;
  paymentSessionId: string;
};

export async function createCashfreeOrder(
  input: CreateCashfreeOrderInput,
): Promise<CashfreeOrderResult> {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: input.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: input.customerId,
        customer_email: input.customerEmail,
        // Cashfree requires a phone number; fall back to a clearly
        // placeholder-looking number ONLY when the profile genuinely
        // has none yet — real UPI/card flows don't strictly need it to
        // be dialable for a web checkout, but the field is mandatory.
        customer_phone: input.customerPhone && input.customerPhone.trim() ? input.customerPhone : "9999999999",
        customer_name: input.customerName,
      },
      order_meta: {
        return_url: input.returnUrl,
        notify_url: input.notifyUrl,
      },
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data || typeof data.payment_session_id !== "string") {
    const message =
      data && typeof data.message === "string" ? data.message : `Cashfree order creation failed (${res.status}).`;
    throw new Error(message);
  }

  return { cfOrderId: data.order_id ?? input.orderId, paymentSessionId: data.payment_session_id };
}

export type CashfreeOrderStatus = {
  orderStatus: string; // "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | ...
  orderAmount: number;
  /** The most recent payment attempt's status, if any payment attempt
   * has been made yet ("SUCCESS" | "FAILED" | "PENDING" | ...). */
  latestPaymentStatus: string | null;
};

/** Authoritative order/payment status, fetched directly from Cashfree
 * — this is the source of truth the return-URL page and the
 * reconciliation path both call, never trusting a URL query param. */
export async function getCashfreeOrderStatus(orderId: string): Promise<CashfreeOrderStatus> {
  // Both Cashfree calls are independent (order-level status doesn't
  // need the payments list, and vice versa) — firing them concurrently
  // instead of one-after-another was previously the single largest
  // avoidable chunk of latency in the verify path (roughly doubling
  // this function's network time for no reason). A hard timeout on
  // each: without one, a slow/hung upstream response leaves the whole
  // verify request (and therefore the browser's own fetch) waiting
  // indefinitely with nothing to show.
  const [orderRes, paymentsRes] = await Promise.all([
    fetch(`${BASE_URL}/orders/${encodeURIComponent(orderId)}`, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(8000),
    }),
    fetch(`${BASE_URL}/orders/${encodeURIComponent(orderId)}/payments`, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(8000),
    }).catch(() => null),
  ]);

  const order = await orderRes.json().catch(() => null);
  if (!orderRes.ok || !order) {
    throw new Error(`Unable to fetch Cashfree order status (${orderRes.status}).`);
  }

  let latestPaymentStatus: string | null = null;
  if (paymentsRes) {
    const payments = await paymentsRes.json().catch(() => null);
    if (paymentsRes.ok && Array.isArray(payments) && payments.length > 0) {
      // Most recent attempt first per Cashfree's documented ordering.
      latestPaymentStatus = payments[0]?.payment_status ?? null;
    }
    // A non-ok/unparseable payments response doesn't invalidate the
    // order-level status above — latestPaymentStatus just stays null
    // and the caller falls back to orderStatus alone.
  }

  return {
    orderStatus: order.order_status ?? "UNKNOWN",
    orderAmount: order.order_amount ?? 0,
    latestPaymentStatus,
  };
}

/** Verifies a Cashfree webhook's HMAC-SHA256 signature. Per Cashfree's
 * current webhook documentation, the signature is
 * base64(HMAC_SHA256(timestamp + rawRequestBody, secretKey)) — verify
 * against the RAW body string (before any JSON.parse), which is why
 * every caller must read the body as text first and pass that exact
 * string here rather than a re-serialized object. */
export function verifyCashfreeWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
): boolean {
  const { secretKey } = requireCredentials();
  const expected = crypto
    .createHmac("sha256", secretKey)
    .update(timestamp + rawBody)
    .digest("base64");
  // Constant-time comparison — a plain `===` on signatures invites a
  // timing side-channel; both buffers must be equal length for
  // timingSafeEqual, so a length mismatch is treated as "not equal"
  // (a forged/truncated signature) rather than throwing.
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
