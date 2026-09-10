"use client";

// src/app/account/orders/[id]/confirmation/page.tsx
// Cashfree's return URL lands here after checkout. Landing on this
// page proves NOTHING about payment outcome by itself — Cashfree
// redirects the browser back whether the payment succeeded, failed, or
// was abandoned, and a user can hit this URL directly.
//
// ARCHITECTURE (root-cause fix for the old "stuck verifying forever /
// needs a Retry click" problem — see git history for the prior
// polling-loop version this replaces):
//
// The old version treated the confirmation page's own repeated POSTs
// to /api/payments/verify as the only source of truth, so it was only
// ever as fast as (a) the browser being willing to keep asking and
// (b) Cashfree's REST API answering quickly. The actual bug was that
// Cashfree's webhook (the FAST, server-push confirmation path) never
// fired at all, because order creation never told Cashfree where to
// send it (see src/lib/cashfree/server.ts's notifyUrl — now fixed) —
// so every confirmation was forced onto the slow, client-polled path.
//
// This version makes the internal Firestore `orders/{orderId}` document
// itself the single source of truth, via a live `onSnapshot` listener
// (same pattern AuthContext.tsx already uses for the profile doc,
// allowed by firestore.rules' existing owner/admin-only read rule) —
// NOT a client-side polling loop. Two independent signals can write to
// that document (the webhook, and this page's own one-shot verify
// call, both going through the same idempotent applyPaymentStatus —
// see orders/store.ts), and whichever one lands first is what the
// listener shows, typically within a second or two. The confirmation
// page reacts to that write the instant it happens — no interval, no
// user action, no "Retry" button. If the webhook genuinely never
// arrives (a real edge case despite the fix), exactly ONE additional
// server-side re-check fires automatically after a short delay — never
// more than that, and never surfaced to the user as something to click.
import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { firestoreDb } from "@/lib/firebase-client";
import { useCart } from "@/context/CartContext";
import { formatInr } from "@/lib/consultation/pricing";
import type { Order, PaymentStatus } from "@/lib/orders/types";

// A single automatic safety-net re-check, fired once if the order is
// still non-terminal this long after mount — covers the rare case
// where the webhook truly never arrives (network issue on Cashfree's
// side, a misconfigured dashboard default, etc). Not a loop, not
// user-facing, and the Firestore listener above is what actually shows
// the result the moment either this call or the webhook writes it.
const SAFETY_RECHECK_DELAY_MS = 8000;

const TERMINAL_FAILURE_STATUSES: PaymentStatus[] = ["FAILED", "CANCELLED", "EXPIRED"];
const REFUND_STATUSES: PaymentStatus[] = ["REFUNDED", "PARTIALLY_REFUNDED"];

export default function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <ConfirmationContent orderId={id} />
    </ProtectedRoute>
  );
}

function ConfirmationContent({ orderId }: { orderId: string }) {
  // undefined = listener hasn't emitted its first snapshot yet; null =
  // it emitted and the document genuinely does not exist (or isn't
  // readable) — those are different states, not the same "no order".
  const [liveOrder, setLiveOrder] = useState<Order | null | undefined>(undefined);
  const [docMissing, setDocMissing] = useState(false);
  const { clearCart } = useCart();
  const clearedRef = useRef(false);

  // Live Firestore listener — the actual fix. Fires immediately with
  // whatever the document currently holds, then again on every write,
  // whether that write came from the webhook or from this page's own
  // verify call below. This is push-based, not polling: there is no
  // interval here at all.
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(firestoreDb, "orders", orderId),
      (snap) => {
        if (!snap.exists()) {
          setLiveOrder(null);
          setDocMissing(true);
          return;
        }
        setLiveOrder(snap.data() as Order);
      },
      () => {
        // Read denied (not this user's order) or a transient listener
        // error — treated the same as "document not visible to me".
        setLiveOrder(null);
        setDocMissing(true);
      },
    );
    return unsubscribe;
  }, [orderId]);

  // One-shot server verify on mount — this is what actually asks
  // Cashfree and writes the result (via the same applyPaymentStatus
  // the webhook uses) when the webhook hasn't already done so. Its own
  // response isn't what drives the UI (the listener above is) — this
  // just kicks the reconciliation off as early as possible.
  const didInitialVerify = useRef(false);
  const safetyRecheckFired = useRef(false);
  useEffect(() => {
    if (didInitialVerify.current) return;
    didInitialVerify.current = true;
    void runVerifyOnce(orderId);
  }, [orderId]);

  // The one allowed safety net: if still non-terminal after a short
  // delay, fire runVerifyOnce exactly one more time. Guarded so it can
  // only ever happen once per page load, regardless of how many times
  // this effect re-runs as liveOrder changes.
  useEffect(() => {
    const status = liveOrder?.paymentStatus;
    const stillPending = liveOrder !== undefined && liveOrder !== null && (status === "PENDING" || status === "CREATED");
    if (!stillPending || safetyRecheckFired.current) return;

    const timer = window.setTimeout(() => {
      if (safetyRecheckFired.current) return;
      safetyRecheckFired.current = true;
      void runVerifyOnce(orderId);
    }, SAFETY_RECHECK_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [liveOrder, orderId]);

  const status = liveOrder?.paymentStatus;

  // Clear the cart exactly once, only once payment is confirmed PAID —
  // never on a failed/pending/cancelled outcome, and never as a side
  // effect of merely landing on this page (this used to happen
  // "for free" as an accident of the cart living only in memory and
  // getting wiped by Cashfree's full-page redirect; now that the cart
  // persists across that redirect — see CartContext.tsx — this has to
  // be explicit, or a successful purchase would leave already-bought
  // items sitting in the cart).
  useEffect(() => {
    if (status !== "PAID" || clearedRef.current) return;
    clearedRef.current = true;
    clearCart();
  }, [status, clearCart]);

  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      <div className="mx-auto max-w-2xl px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
        {liveOrder === undefined && <ConfirmingState />}
        {liveOrder === null && docMissing && <NotFoundState />}
        {liveOrder && status === "PAID" && <PaidState order={liveOrder} orderId={orderId} />}
        {liveOrder && (status === "PENDING" || status === "CREATED") && <ConfirmingState />}
        {liveOrder && status && TERMINAL_FAILURE_STATUSES.includes(status) && (
          <FailedState status={status as "FAILED" | "CANCELLED" | "EXPIRED"} />
        )}
        {liveOrder && status && REFUND_STATUSES.includes(status) && (
          <RefundedState orderId={orderId} status={status as "REFUNDED" | "PARTIALLY_REFUNDED"} />
        )}
      </div>
    </main>
  );
}

/** Fire-and-forget: asks the server to check Cashfree and reconcile
 * the order if needed. Never throws to its caller and never drives UI
 * state directly — a transient failure here is invisible to the user
 * because the Firestore listener (and, if truly needed, the webhook
 * arriving on its own) is what actually resolves the page. */
async function runVerifyOnce(orderId: string): Promise<void> {
  try {
    await authedFetch("/api/payments/verify", {
      method: "POST",
      body: JSON.stringify({ orderId }),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    // Swallowed on purpose — see doc comment above.
  }
}

function ConfirmingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center sm:rounded-[1.4rem]"
    >
      <span className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute h-12 w-12 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
        <Sparkles aria-hidden="true" className="h-5 w-5 text-nav-amethyst-deep" />
      </span>
      <h1 className="font-serif text-lg text-nav-violet">Confirming your payment</h1>
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/70">
        Your payment was received. We&apos;re securely confirming your order — this page will
        update automatically the moment it&apos;s done. There&apos;s nothing else you need to do.
      </p>
    </div>
  );
}

function NotFoundState() {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center sm:rounded-[1.4rem]"
    >
      <XCircle aria-hidden="true" strokeWidth={1.5} className="h-11 w-11 text-rose-500" />
      <h1 className="font-serif text-xl text-nav-violet">We couldn&apos;t find this order</h1>
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">
        This order link doesn&apos;t match one of your orders, or it may not exist. If you just
        completed a payment, check your order history — it should be there.
      </p>
      <Link
        href="/account/orders"
        className="mt-1 flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep"
      >
        View Your Orders
      </Link>
    </div>
  );
}

function PaidState({ order, orderId }: { order: Order; orderId: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-white to-nav-lavender-mist px-6 py-14 text-center shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] sm:rounded-[1.4rem]">
      <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="h-12 w-12 text-emerald-600" />
      <h1 className="font-serif text-2xl text-nav-violet">Payment Successful</h1>
      <p className="text-sm text-nav-plum/70">
        Order #{orderId.slice(-8).toUpperCase()} · {formatInr(order.total ?? order.subtotal)}
      </p>
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">
        Thank you — your order is confirmed. You&apos;ll find full details, including next steps for
        any consultations, on your order page.
      </p>
      <Link
        href={`/account/orders/${orderId}`}
        className="mt-2 flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep"
      >
        View Order
      </Link>
    </div>
  );
}

function FailedState({ status }: { status: "FAILED" | "CANCELLED" | "EXPIRED" }) {
  const heading =
    status === "FAILED" ? "Payment Failed" : status === "CANCELLED" ? "Payment Cancelled" : "Payment Session Expired";
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center sm:rounded-[1.4rem]">
      <XCircle aria-hidden="true" strokeWidth={1.5} className="h-12 w-12 text-rose-500" />
      <h1 className="font-serif text-xl text-nav-violet">{heading}</h1>
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">
        Your payment didn&apos;t go through. Your cart is untouched, so you can safely try again —
        this starts a new payment, not a re-check of this one.
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/checkout"
          className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep"
        >
          Try Payment Again
        </Link>
        <Link
          href="/checkout"
          className="flex min-h-11 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-6 py-2.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
        >
          Return to Cart
        </Link>
      </div>
    </div>
  );
}

function RefundedState({ orderId, status }: { orderId: string; status: "REFUNDED" | "PARTIALLY_REFUNDED" }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center sm:rounded-[1.4rem]">
      <h1 className="font-serif text-xl text-nav-violet">
        {status === "REFUNDED" ? "This order was refunded" : "This order was partially refunded"}
      </h1>
      <Link
        href={`/account/orders/${orderId}`}
        className="mt-1 flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep"
      >
        View Order
      </Link>
    </div>
  );
}
