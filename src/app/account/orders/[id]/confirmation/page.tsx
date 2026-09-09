"use client";

// src/app/account/orders/[id]/confirmation/page.tsx
// Cashfree's return URL lands here after checkout. Landing on this
// page proves NOTHING about payment outcome by itself — Cashfree
// redirects the browser back whether the payment succeeded, failed, or
// was abandoned, and a user can hit this URL directly. The only source
// of truth is `POST /api/payments/verify`, which re-checks the REAL
// Cashfree order status server-side and reconciles the internal order
// (see src/app/api/payments/verify/route.ts) — this page never renders
// a success state from anything other than that call's response.
//
// Refresh/reload test: verify is idempotent server-side, so simply
// re-running it on every mount already satisfies "refresh this page
// and it still behaves correctly" — the only client-side care needed
// is a mount-guard ref so React's dev double-invoke / a fast
// re-render doesn't fire the network call twice for one real mount.
//
// PENDING/CREATED: auto-retries verify every ~3.5s, capped at 5
// attempts total, then requires a manual "Check again" click — never
// polls forever unattended.
import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, RefreshCw, XCircle } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { formatInr } from "@/lib/consultation/pricing";
import type { Order, PaymentStatus } from "@/lib/orders/types";

const MAX_AUTO_RETRIES = 5;
const RETRY_DELAY_MS = 3500;

type VerifyState =
  | { phase: "verifying" }
  | { phase: "error"; message: string }
  | { phase: "done"; paymentStatus: PaymentStatus };

export default function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <ConfirmationContent orderId={id} />
    </ProtectedRoute>
  );
}

function ConfirmationContent({ orderId }: { orderId: string }) {
  const [verify, setVerify] = useState<VerifyState>({ phase: "verifying" });
  const [order, setOrder] = useState<Order | null>(null);
  const [attempt, setAttempt] = useState(0);
  const inFlightRef = useRef(false);

  const runVerify = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setVerify({ phase: "verifying" });
    try {
      const res = await authedFetch("/api/payments/verify", {
        method: "POST",
        body: JSON.stringify({ orderId }),
      });
      const data = (await res.json()) as { paymentStatus?: PaymentStatus; error?: string };
      if (!res.ok || !data.paymentStatus) {
        setVerify({
          phase: "error",
          message: data.error ?? "We couldn't verify your payment right now.",
        });
        return;
      }
      setVerify({ phase: "done", paymentStatus: data.paymentStatus });
    } catch {
      setVerify({
        phase: "error",
        message: "We couldn't verify your payment right now. Please check again.",
      });
    } finally {
      inFlightRef.current = false;
    }
  }, [orderId]);

  // Fetch the order's own detail (for amount/items on the success
  // screen) once, independent of the verify polling loop.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authedFetch(`/api/orders/${orderId}`);
        if (!res.ok) return;
        const data = (await res.json()) as { order: Order };
        if (!cancelled) setOrder(data.order);
      } catch {
        // Non-fatal — the confirmation screen still works without it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // Initial verify on mount — guarded against a double-fire.
  const didInitialVerify = useRef(false);
  useEffect(() => {
    if (didInitialVerify.current) return;
    didInitialVerify.current = true;
    setAttempt(1);
    runVerify();
  }, [runVerify]);

  // Auto-retry loop while status is still PENDING/CREATED, capped at
  // MAX_AUTO_RETRIES total attempts.
  useEffect(() => {
    if (verify.phase !== "done") return;
    if (verify.paymentStatus !== "PENDING" && verify.paymentStatus !== "CREATED") return;
    if (attempt >= MAX_AUTO_RETRIES) return;

    const timer = window.setTimeout(() => {
      setAttempt((a) => a + 1);
      runVerify();
    }, RETRY_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [verify, attempt, runVerify]);

  function handleManualRetry() {
    setAttempt((a) => a + 1);
    runVerify();
  }

  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      <div className="mx-auto max-w-2xl px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
        {verify.phase === "verifying" && <VerifyingState />}
        {verify.phase === "error" && <VerifyErrorState message={verify.message} onRetry={handleManualRetry} />}
        {verify.phase === "done" && verify.paymentStatus === "PAID" && (
          <PaidState order={order} orderId={orderId} />
        )}
        {verify.phase === "done" && (verify.paymentStatus === "PENDING" || verify.paymentStatus === "CREATED") && (
          <PendingState
            attempt={attempt}
            exhausted={attempt >= MAX_AUTO_RETRIES}
            onCheckAgain={handleManualRetry}
          />
        )}
        {verify.phase === "done" &&
          (verify.paymentStatus === "FAILED" ||
            verify.paymentStatus === "CANCELLED" ||
            verify.paymentStatus === "EXPIRED") && <FailedState status={verify.paymentStatus} />}
        {verify.phase === "done" &&
          (verify.paymentStatus === "REFUNDED" || verify.paymentStatus === "PARTIALLY_REFUNDED") && (
            <RefundedState orderId={orderId} status={verify.paymentStatus} />
          )}
      </div>
    </main>
  );
}

function VerifyingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center sm:rounded-[1.4rem]"
    >
      <span className="h-10 w-10 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
      <p className="font-serif text-lg text-nav-violet">Verifying your payment…</p>
      <p className="max-w-sm text-sm text-nav-plum/70">
        Please hold on while we confirm your payment status with Cashfree.
      </p>
    </div>
  );
}

function VerifyErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center sm:rounded-[1.4rem]"
    >
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="flex min-h-11 items-center gap-2 rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep"
      >
        <RefreshCw aria-hidden="true" className="h-4 w-4" />
        Check again
      </button>
    </div>
  );
}

function PaidState({ order, orderId }: { order: Order | null; orderId: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-white to-nav-lavender-mist px-6 py-14 text-center shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] sm:rounded-[1.4rem]">
      <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="h-12 w-12 text-emerald-600" />
      <h1 className="font-serif text-2xl text-nav-violet">Payment Successful</h1>
      <p className="text-sm text-nav-plum/70">
        Order #{orderId.slice(-8).toUpperCase()}
        {order ? ` · ${formatInr(order.subtotal)}` : ""}
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

function PendingState({
  attempt,
  exhausted,
  onCheckAgain,
}: {
  attempt: number;
  exhausted: boolean;
  onCheckAgain: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center sm:rounded-[1.4rem]">
      <Clock aria-hidden="true" strokeWidth={1.5} className="h-11 w-11 text-amber-600" />
      <h1 className="font-serif text-xl text-nav-violet">Your payment is still being confirmed</h1>
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">
        This can take a moment for some payment methods. Your order hasn&apos;t been lost, and nothing
        else needs to be done on your end right now.
      </p>
      {!exhausted && (
        <p className="text-xs text-nav-plum/50">Checking automatically… (attempt {attempt} of 5)</p>
      )}
      <button
        type="button"
        onClick={onCheckAgain}
        className="mt-1 flex min-h-11 items-center gap-2 rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep"
      >
        <RefreshCw aria-hidden="true" className="h-4 w-4" />
        Check again
      </button>
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
        Your payment didn&apos;t go through. Your cart is untouched, so you can safely try again.
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/checkout"
          className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep"
        >
          Retry Payment
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
