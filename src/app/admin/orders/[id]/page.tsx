"use client";

// src/app/admin/orders/[id]/page.tsx
// Admin order detail + fulfillment-status update. Fetches the SAME
// GET /api/orders/:id endpoint the customer's own order-detail page
// uses — that route already allows an admin to read any order, not
// just their own (see its own doc comment). Fulfillment status is
// updated via the admin-only PATCH /api/admin/orders. Payment status
// is shown read-only — no route anywhere lets an admin set it.
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { formatInr } from "@/lib/consultation/pricing";
import { orderCategories, type FulfillmentStatus, type Order } from "@/lib/orders/types";
import { PaymentBadge } from "../page";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; order: Order };

// Which fulfillment statuses an admin may set, scoped by the
// categories actually present on this order — mirrors the server's own
// ADMIN_ALLOWED_FULFILLMENT list (src/app/api/admin/orders/route.ts),
// just narrowed further per-category for a sane UI. If an order mixes
// gemstone + consultation items, both sets of options are offered.
const GEMSTONE_STATUSES: FulfillmentStatus[] = ["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const CONSULTATION_STATUSES: FulfillmentStatus[] = ["BOOKING_PENDING", "SCHEDULED", "COMPLETED", "CANCELLED"];

const STATUS_LABELS: Record<FulfillmentStatus, string> = {
  AWAITING_PAYMENT: "Awaiting Payment",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  BOOKING_PENDING: "Booking Pending",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<FulfillmentStatus | null>(null);
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await authedFetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { order: Order };
      setState({ status: "ready", order: data.order });
    } catch {
      setState({ status: "error", message: "We couldn't load this order." });
    }
  }, [orderId]);

  useEffect(() => {
    // Deferred via queueMicrotask — see admin/orders/page.tsx's
    // identical comment (react-hooks/set-state-in-effect).
    queueMicrotask(() => load());
  }, [load]);

  async function handleUpdateStatus(next: FulfillmentStatus) {
    if (state.status !== "ready") return;
    setUpdating(true);
    setUpdateError(null);
    setJustSaved(null);
    try {
      const res = await authedFetch("/api/admin/orders", {
        method: "PATCH",
        body: JSON.stringify({ orderId, fulfillmentStatus: next }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setUpdateError((data && data.error) || "Couldn't update fulfillment status.");
        return;
      }
      setState({ status: "ready", order: { ...state.order, fulfillmentStatus: next } });
      setJustSaved(next);
    } catch {
      setUpdateError("Network error — please try again.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleMarkRefunded() {
    if (state.status !== "ready") return;
    const confirmed = window.confirm(
      "Mark this order as refunded? Only do this after the actual refund has been issued through Cashfree — this just updates TRUELOGER's own record and cannot be undone here.",
    );
    if (!confirmed) return;

    setRefunding(true);
    setRefundError(null);
    try {
      const res = await authedFetch("/api/admin/orders", {
        method: "PATCH",
        body: JSON.stringify({ orderId, action: "mark_refunded" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setRefundError((data && data.error) || "Couldn't mark this order as refunded.");
        return;
      }
      setState({ status: "ready", order: { ...state.order, paymentStatus: "REFUNDED" } });
    } catch {
      setRefundError("Network error — please try again.");
    } finally {
      setRefunding(false);
    }
  }

  if (state.status === "loading") {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center">
        <span className="h-8 w-8 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
        <p className="text-sm text-nav-plum/70">Loading order…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div role="alert" className="rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/80">
        {state.message}
      </div>
    );
  }

  const { order } = state;
  const categories = orderCategories(order);
  const availableStatuses = Array.from(
    new Set([
      ...(categories.includes("gemstone") ? GEMSTONE_STATUSES : []),
      ...(categories.includes("consultation") ? CONSULTATION_STATUSES : []),
    ]),
  );
  const canUpdateFulfillment = order.paymentStatus === "PAID";

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-nav-amethyst-deep hover:underline">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to Orders
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">
            Order #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-nav-plum/70">{order.customerName ?? "—"} · {order.customerEmail}</p>
          {order.customerPhone && <p className="text-sm text-nav-plum/70">{order.customerPhone}</p>}
        </div>
        <PaymentBadge status={order.paymentStatus} />
      </header>

      {/* Line items */}
      <section className="rounded-2xl border border-nav-lavender-line bg-white p-4 sm:p-5">
        <h2 className="mb-3 font-serif text-lg text-nav-violet">Items</h2>
        <ul className="flex flex-col gap-3">
          {order.items.map((item, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-2 border-b border-nav-lavender-line/60 pb-3 last:border-0 last:pb-0">
              <div>
                <p className="font-medium text-nav-violet">
                  {item.category === "consultation" ? item.serviceName : item.productName}
                </p>
                <p className="text-xs text-nav-plum/60">
                  {item.category === "consultation"
                    ? `${item.duration} min · Qty ${item.quantity}`
                    : item.category === "report"
                      ? `Personalized report · Qty ${item.quantity}`
                      : `${item.ratti ? `${item.ratti} Ratti` : item.variantLabel} · Qty ${item.quantity}`}
                </p>
              </div>
              <span className="font-semibold text-nav-amethyst-deep">{formatInr(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-1.5 border-t border-nav-lavender-line pt-3 text-sm">
          <div className="flex items-center justify-between text-nav-plum/70">
            <span>Subtotal</span>
            <span>{formatInr(order.subtotal)}</span>
          </div>
          {order.productDiscount > 0 && (
            <div className="flex items-center justify-between text-nav-plum/70">
              <span>Product Discount</span>
              <span>−{formatInr(order.productDiscount)}</span>
            </div>
          )}
          {order.couponDiscount > 0 && (
            <div className="flex items-center justify-between text-nav-plum/70">
              <span>Coupon{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span>−{formatInr(order.couponDiscount)}</span>
            </div>
          )}
          {order.tax > 0 && (
            <div className="flex items-center justify-between text-nav-plum/70">
              <span>Tax</span>
              <span>{formatInr(order.tax)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-nav-plum/70">
            <span>Delivery</span>
            <span>{order.deliveryFee > 0 ? formatInr(order.deliveryFee) : "Free"}</span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-nav-lavender-line pt-2">
            <span className="font-medium text-nav-plum/70">Total</span>
            {/* order.total is undefined for any order placed before the
                pricing-breakdown upgrade — fall back to subtotal so an
                old order still shows a real number instead of "₹undefined". */}
            <span className="text-lg font-semibold text-nav-amethyst-deep">{formatInr(order.total ?? order.subtotal)}</span>
          </div>
        </div>
      </section>

      {/* Timestamps + reconciliation */}
      <section className="mt-4 rounded-2xl border border-nav-lavender-line bg-white p-4 text-sm text-nav-plum/70 sm:p-5">
        <p>Created: {new Date(order.createdAt).toLocaleString("en-IN")}</p>
        <p>Updated: {new Date(order.updatedAt).toLocaleString("en-IN")}</p>
        {order.cashfreeOrderId && (
          <p className="mt-2 text-xs text-nav-plum/50">Cashfree order id: {order.cashfreeOrderId}</p>
        )}

        {order.paymentStatus === "PAID" && (
          <div className="mt-4 border-t border-nav-lavender-line pt-4">
            <button
              type="button"
              onClick={handleMarkRefunded}
              disabled={refunding}
              className="flex min-h-11 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition-colors duration-150 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refunding ? "Marking as refunded…" : "Mark as Refunded"}
            </button>
            <p className="mt-1.5 text-xs text-nav-plum/50">
              Issue the actual refund through Cashfree first — this only updates TRUELOGER&apos;s own record.
            </p>
            {refundError && (
              <p role="alert" className="mt-2 text-sm text-rose-700">
                {refundError}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Fulfillment status */}
      <section className="mt-4 rounded-2xl border border-nav-lavender-line bg-white p-4 sm:p-5">
        <h2 className="mb-1 font-serif text-lg text-nav-violet">Fulfillment</h2>
        <p className="mb-3 text-sm text-nav-plum/70">
          Current status: <span className="font-medium text-nav-violet">{STATUS_LABELS[order.fulfillmentStatus]}</span>
        </p>

        {!canUpdateFulfillment ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
            Fulfillment can only be updated once this order is paid.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {availableStatuses.map((s) => {
                const active = order.fulfillmentStatus === s;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={updating || active}
                    onClick={() => handleUpdateStatus(s)}
                    className={`min-h-11 rounded-full px-4 py-2.5 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed ${
                      active
                        ? "bg-nav-amethyst text-white"
                        : "bg-nav-lavender-mist text-nav-plum/80 hover:bg-nav-lavender-soft disabled:opacity-60"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
            {updating && <p className="mt-2 text-sm text-nav-plum/60">Saving…</p>}
            {justSaved && !updating && (
              <p className="mt-2 text-sm text-emerald-700">Saved — status updated to {STATUS_LABELS[justSaved]}.</p>
            )}
            {updateError && (
              <p role="alert" className="mt-2 text-sm text-rose-700">
                {updateError}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
