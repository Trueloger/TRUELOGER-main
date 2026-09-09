"use client";

// src/app/account/orders/page.tsx
// /account/orders — the signed-in user's own order history. Fetches
// `GET /api/orders` (already scoped server-side to the caller's uid —
// see src/app/api/orders/route.ts) and renders each order as a premium
// card matching this site's ivory/lavender/amethyst card language
// (GemstoneCard/ServiceCard's corner-tick + hover-lift treatment),
// stacked on mobile and widening into a cleaner grid on desktop. Cards
// throughout, never an admin-style dense table — this is a customer-
// facing page, not the admin panel.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PackageX, RefreshCw } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { formatInr } from "@/lib/consultation/pricing";
import type { Order, OrderLineItem, PaymentStatus } from "@/lib/orders/types";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; orders: Order[] };

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersPageContent />
    </ProtectedRoute>
  );
}

function OrdersPageContent() {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await authedFetch("/api/orders");
      if (!res.ok) {
        throw new Error("Failed to load orders.");
      }
      const data = (await res.json()) as { orders: Order[] };
      // Newest first — createdAt is epoch ms.
      const sorted = [...data.orders].sort((a, b) => b.createdAt - a.createdAt);
      setState({ status: "ready", orders: sorted });
    } catch {
      setState({
        status: "error",
        message: "We couldn't load your orders right now. Please try again.",
      });
    }
  }, []);

  // Guarded with a ref (rather than a bare `useEffect(() => { load(); })`)
  // so this fires exactly once on mount — a bare call here is flagged by
  // the react-hooks/set-state-in-effect rule as an unconditional
  // setState-in-effect; the ref makes the call genuinely conditional.
  const hasLoaded = useRef(false);
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    load();
  }, [load]);

  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      <div className="mx-auto max-w-4xl px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
        <header className="mb-8 md:mb-10">
          <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Your Orders</h1>
          <p className="mt-1.5 text-sm text-nav-plum/70">
            Every gemstone, consultation, and product order you&apos;ve placed.
          </p>
        </header>

        {state.status === "loading" && <OrdersLoading />}
        {state.status === "error" && <OrdersError message={state.message} onRetry={load} />}
        {state.status === "ready" && state.orders.length === 0 && <OrdersEmpty />}
        {state.status === "ready" && state.orders.length > 0 && (
          <ul className="flex flex-col gap-4">
            {state.orders.map((order) => (
              <li key={order.id}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function OrdersLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center"
    >
      <span className="h-8 w-8 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
      <p className="text-sm text-nav-plum/70">Loading your orders…</p>
    </div>
  );
}

function OrdersError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center"
    >
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="flex min-h-11 items-center gap-2 rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl"
      >
        <RefreshCw aria-hidden="true" className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}

function OrdersEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center">
      <PackageX aria-hidden="true" strokeWidth={1.5} className="h-10 w-10 text-nav-amethyst-deep" />
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">
        You haven&apos;t placed any orders yet.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/consult"
          className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep"
        >
          Book a Consultation
        </Link>
        <Link
          href="/gemstones"
          className="flex min-h-11 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-6 py-2.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
        >
          Browse Gemstones
        </Link>
      </div>
    </div>
  );
}

function itemSummary(items: OrderLineItem[]): string {
  if (items.length === 0) return "No items";
  const first = items[0];
  const firstName = first.category === "consultation" ? first.serviceName : first.productName;
  const detail =
    first.category === "gemstone"
      ? `${first.ratti} Ratti`
      : first.category === "consultation"
        ? `${first.duration} min`
        : `Qty ${first.quantity}`;
  const label = `${firstName} · ${detail}`;
  if (items.length === 1) return label;
  return `${label} and ${items.length - 1} more`;
}

function OrderCard({ order }: { order: Order }) {
  const shortId = `#${order.id.slice(-8).toUpperCase()}`;
  const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="group relative rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-white to-nav-lavender-mist p-4 shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-14px_rgba(70,40,120,0.4)] sm:rounded-[1.4rem] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-serif text-base text-nav-violet sm:text-lg">Order {shortId}</p>
          <p className="mt-0.5 text-xs text-nav-plum/60">{date}</p>
        </div>
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>

      <p className="mt-3 text-sm text-nav-plum/80">{itemSummary(order.items)}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-nav-lavender-line pt-3">
        <span className="text-base font-semibold text-nav-amethyst-deep sm:text-lg">
          {formatInr(order.subtotal)}
        </span>
        <Link
          href={`/account/orders/${order.id}`}
          className="flex min-h-9 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-4 py-1.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
        >
          View Order
        </Link>
      </div>
    </div>
  );
}

/** Subtle, soft-palette status pill — never the harsh red/green of a
 * generic status system. Colors match this site's own tokens rather
 * than primary red/green/yellow. */
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, className } = paymentStatusStyle(status);
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium ${className}`}
    >
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
