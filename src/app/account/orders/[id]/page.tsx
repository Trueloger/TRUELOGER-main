"use client";

// src/app/account/orders/[id]/page.tsx
// /account/orders/[id] — full detail for one of the signed-in user's
// own orders. `GET /api/orders/[id]` already 404s for an order that
// isn't the caller's (see src/app/api/orders/[id]/route.ts's doc
// comment: 404, not 403, so a probing id can't even be confirmed to
// exist) — this page just renders that 404 as a friendly "not found"
// message, never a raw error dump.
//
// Cashfree identifiers (`cashfreeOrderId`/`cashfreePaymentSessionId`)
// are shown only as small muted "Payment reference" text near the
// bottom — never presented as a prominent/copyable secret-looking
// value, since neither is actually a secret but both are operationally
// useful for support conversations.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { use } from "react";
import { ArrowLeft, FileQuestion, RefreshCw } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { formatInr } from "@/lib/consultation/pricing";
import { rattiToCarat } from "@/lib/gemstones/types";
import type { FulfillmentStatus, Order, OrderLineItem, PaymentStatus } from "@/lib/orders/types";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "not-found" }
  | { status: "ready"; order: Order };

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProtectedRoute>
      <OrderDetailContent orderId={id} />
    </ProtectedRoute>
  );
}

function OrderDetailContent({ orderId }: { orderId: string }) {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await authedFetch(`/api/orders/${orderId}`);
      if (res.status === 404) {
        setState({ status: "not-found" });
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load order.");
      }
      const data = (await res.json()) as { order: Order };
      setState({ status: "ready", order: data.order });
    } catch {
      setState({
        status: "error",
        message: "We couldn't load this order right now. Please try again.",
      });
    }
  }, [orderId]);

  // Ref-guarded (rather than a bare `load()` call) so this fires once
  // per distinct orderId — needed both to satisfy the
  // react-hooks/set-state-in-effect rule (see the matching comment in
  // /account/orders/page.tsx) and to refetch correctly if the route
  // re-renders with a different [id] without a full remount.
  const lastLoadedOrderId = useRef<string | null>(null);
  useEffect(() => {
    if (lastLoadedOrderId.current === orderId) return;
    lastLoadedOrderId.current = orderId;
    load();
  }, [orderId, load]);

  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      <div className="mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
        <Link
          href="/account/orders"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-nav-violet hover:text-nav-amethyst-deep"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to Orders
        </Link>

        {state.status === "loading" && <DetailLoading />}
        {state.status === "error" && <DetailError message={state.message} onRetry={load} />}
        {state.status === "not-found" && <DetailNotFound />}
        {state.status === "ready" && <OrderDetailCard order={state.order} />}
      </div>
    </main>
  );
}

function DetailLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center"
    >
      <span className="h-8 w-8 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
      <p className="text-sm text-nav-plum/70">Loading order details…</p>
    </div>
  );
}

function DetailError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center"
    >
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="flex min-h-11 items-center gap-2 rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep"
      >
        <RefreshCw aria-hidden="true" className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}

function DetailNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center">
      <FileQuestion aria-hidden="true" strokeWidth={1.5} className="h-10 w-10 text-nav-amethyst-deep" />
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">
        Order not found. It may not exist, or it may belong to a different account.
      </p>
      <Link
        href="/account/orders"
        className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep"
      >
        Back to Orders
      </Link>
    </div>
  );
}

function OrderDetailCard({ order }: { order: Order }) {
  const shortId = `#${order.id.slice(-8).toUpperCase()}`;
  const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="relative rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-white to-nav-lavender-mist p-5 shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] sm:rounded-[1.4rem] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl text-nav-violet sm:text-2xl">Order {shortId}</h1>
          <p className="mt-1 text-xs text-nav-plum/60">Placed {date}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <PaymentStatusBadge status={order.paymentStatus} />
          <FulfillmentStatusBadge status={order.fulfillmentStatus} />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-nav-lavender-line pt-5">
        {order.items.map((item, i) => (
          <LineItemRow key={i} item={item} />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-nav-lavender-line pt-4">
        <span className="font-serif text-base text-nav-violet sm:text-lg">Total</span>
        <span className="text-lg font-semibold text-nav-amethyst-deep sm:text-xl">
          {formatInr(order.subtotal)}
        </span>
      </div>

      {order.cashfreeOrderId && (
        <p className="mt-6 text-[0.68rem] text-nav-plum/45">
          Payment reference: {order.cashfreeOrderId}
        </p>
      )}

      <Link
        href={`/contact?orderId=${encodeURIComponent(order.id)}&category=order`}
        className="mt-5 inline-block text-sm font-medium text-nav-amethyst-deep hover:underline"
      >
        Need help with this order?
      </Link>
    </div>
  );
}

function LineItemRow({ item }: { item: OrderLineItem }) {
  if (item.category === "gemstone" && item.ratti) {
    return (
      <div className="flex flex-wrap items-start justify-between gap-2 rounded-xl bg-white/60 px-3 py-2.5">
        <div>
          <p className="text-sm font-medium text-nav-violet">{item.productName}</p>
          <p className="mt-0.5 text-xs text-nav-plum/60">
            {item.ratti} Ratti (~{rattiToCarat(item.ratti)} carat) · Qty {item.quantity}
          </p>
        </div>
        <div className="text-right">
          {item.discountPercent > 0 && (
            <p className="text-xs text-nav-plum/50 line-through">{formatInr(item.unitMrp)}</p>
          )}
          <p className="text-sm font-semibold text-nav-amethyst-deep">{formatInr(item.lineTotal)}</p>
        </div>
      </div>
    );
  }
  if (item.category === "consultation") {
    return (
      <div className="flex flex-wrap items-start justify-between gap-2 rounded-xl bg-white/60 px-3 py-2.5">
        <div>
          <p className="text-sm font-medium text-nav-violet">{item.serviceName}</p>
          <p className="mt-0.5 text-xs text-nav-plum/60">
            {item.duration} min consultation · Qty {item.quantity}
            {item.preferredDate && item.preferredTime && (
              <> · {new Date(`${item.preferredDate}T${item.preferredTime}`).toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}</>
            )}
          </p>
        </div>
        <p className="text-sm font-semibold text-nav-amethyst-deep">{formatInr(item.lineTotal)}</p>
      </div>
    );
  }
  if (item.category === "report") {
    return (
      <div className="flex flex-wrap items-start justify-between gap-2 rounded-xl bg-white/60 px-3 py-2.5">
        <div>
          <p className="text-sm font-medium text-nav-violet">{item.productName}</p>
          <p className="mt-0.5 text-xs text-nav-plum/60">Personalized report · Qty {item.quantity}</p>
        </div>
        <div className="text-right">
          {item.discountPercent > 0 && (
            <p className="text-xs text-nav-plum/50 line-through">{formatInr(item.unitMrp)}</p>
          )}
          <p className="text-sm font-semibold text-nav-amethyst-deep">{formatInr(item.lineTotal)}</p>
        </div>
      </div>
    );
  }
  if (item.category === "healing" || item.category === "puja" || item.category === "course") {
    const label = item.category === "healing" ? "Healing session" : item.category === "puja" ? "Puja booking" : "Course enrollment";
    return (
      <div className="flex flex-wrap items-start justify-between gap-2 rounded-xl bg-white/60 px-3 py-2.5">
        <div>
          <p className="text-sm font-medium text-nav-violet">{item.productName}</p>
          <p className="mt-0.5 text-xs text-nav-plum/60">{label} · Qty {item.quantity}</p>
        </div>
        <div className="text-right">
          {item.discountPercent > 0 && (
            <p className="text-xs text-nav-plum/50 line-through">{formatInr(item.unitMrp)}</p>
          )}
          <p className="text-sm font-semibold text-nav-amethyst-deep">{formatInr(item.lineTotal)}</p>
        </div>
      </div>
    );
  }
  // Remaining member is the physical-product variant — "in" is used
  // here rather than further category-literal elimination, which TS
  // doesn't narrow away cleanly across this many union members.
  if (!("variantLabel" in item)) {
    return (
      <div className="flex flex-wrap items-start justify-between gap-2 rounded-xl bg-white/60 px-3 py-2.5">
        <p className="text-sm font-medium text-nav-violet">Item · Qty {item.quantity}</p>
        <p className="text-sm font-semibold text-nav-amethyst-deep">{formatInr(item.lineTotal)}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 rounded-xl bg-white/60 px-3 py-2.5">
      <div>
        <p className="text-sm font-medium text-nav-violet">{item.productName}</p>
        <p className="mt-0.5 text-xs text-nav-plum/60">
          {item.variantLabel} · Qty {item.quantity}
        </p>
      </div>
      <div className="text-right">
        {item.discountPercent > 0 && (
          <p className="text-xs text-nav-plum/50 line-through">{formatInr(item.unitMrp)}</p>
        )}
        <p className="text-sm font-semibold text-nav-amethyst-deep">{formatInr(item.lineTotal)}</p>
      </div>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, className } = paymentStatusStyle(status);
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium ${className}`}>
      {label}
    </span>
  );
}

function paymentStatusStyle(status: PaymentStatus): { label: string; className: string } {
  switch (status) {
    case "PAID":
      return { label: "Paid", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" };
    case "PENDING":
    case "CREATED":
      return { label: status === "PENDING" ? "Pending" : "Created", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" };
    case "FAILED":
    case "CANCELLED":
    case "EXPIRED":
      return {
        label: status === "FAILED" ? "Failed" : status === "CANCELLED" ? "Cancelled" : "Expired",
        className: "bg-rose-50/80 text-rose-700/90 ring-1 ring-rose-200/80",
      };
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return {
        label: status === "REFUNDED" ? "Refunded" : "Partially Refunded",
        className: "bg-nav-lavender-soft text-nav-amethyst-deep ring-1 ring-nav-lavender-line",
      };
    default:
      return { label: status, className: "bg-nav-lavender-soft text-nav-amethyst-deep ring-1 ring-nav-lavender-line" };
  }
}

function FulfillmentStatusBadge({ status }: { status: FulfillmentStatus }) {
  const labels: Record<FulfillmentStatus, string> = {
    AWAITING_PAYMENT: "Awaiting Payment",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    BOOKING_PENDING: "Booking Pending",
    SCHEDULED: "Scheduled",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-nav-lavender-soft px-2.5 py-0.5 text-[0.68rem] font-medium text-nav-amethyst-deep ring-1 ring-nav-lavender-line">
      {labels[status]}
    </span>
  );
}
