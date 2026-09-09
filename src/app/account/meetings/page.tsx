"use client";

// src/app/account/meetings/page.tsx
//
// This site has no consultation-booking/scheduling system yet — a
// "consultation" purchase today just creates an Order whose
// `fulfillmentStatus` starts at "BOOKING_PENDING" (see
// src/lib/orders/types.ts). There is no calendar, no expert
// assignment, and no join-link infrastructure, so this page reads the
// user's own orders (`authedFetch("/api/orders")`), filters to those
// containing at least one consultation line item, and renders each as
// a "Meeting" derived HONESTLY from that order's real
// `fulfillmentStatus` — never a fabricated astrologer name, date/time,
// or "Join" button, since none of that data exists anywhere yet.
//
// The mapping below (BOOKING_PENDING -> "Pending Scheduling",
// SCHEDULED -> "Scheduled", COMPLETED -> "Completed",
// CANCELLED -> "Cancelled") IS the architecture for a future real
// booking backend: the moment a scheduling system starts writing
// scheduledAt/astrologerName/joinUrl-type fields onto the order (or a
// related booking record), this page's cards are the natural place to
// surface them — deriving status from the order model rather than a
// parallel one keeps a single source of truth. Until then, the extra
// fields simply aren't rendered because they don't exist.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarClock, RefreshCw } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { authedFetch } from "@/lib/auth/authed-fetch";
import type { FulfillmentStatus, Order, OrderLineItem } from "@/lib/orders/types";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; orders: Order[] };

type MeetingStatusLabel = "Pending Scheduling" | "Scheduled" | "Completed" | "Cancelled" | "Awaiting Payment";

/** Honest fulfillment -> meeting-status mapping. Only the statuses a
 * consultation order can actually reach are mapped meaningfully;
 * anything else (e.g. a physical-goods-only status that can't apply
 * to a consultation line) falls back to a neutral label rather than
 * throwing. */
function meetingStatusLabel(status: FulfillmentStatus): MeetingStatusLabel {
  switch (status) {
    case "BOOKING_PENDING":
      return "Pending Scheduling";
    case "SCHEDULED":
      return "Scheduled";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    case "AWAITING_PAYMENT":
      return "Awaiting Payment";
    default:
      return "Pending Scheduling";
  }
}

function hasConsultation(order: Order): boolean {
  return order.items.some((item) => item.category === "consultation");
}

function consultationItems(order: Order): OrderLineItem[] {
  return order.items.filter((item) => item.category === "consultation");
}

export default function MeetingsPage() {
  return (
    <ProtectedRoute>
      <MeetingsPageContent />
    </ProtectedRoute>
  );
}

function MeetingsPageContent() {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await authedFetch("/api/orders");
      if (!res.ok) {
        throw new Error("Failed to load meetings.");
      }
      const data = (await res.json()) as { orders: Order[] };
      const meetingOrders = data.orders
        .filter(hasConsultation)
        .sort((a, b) => b.createdAt - a.createdAt);
      setState({ status: "ready", orders: meetingOrders });
    } catch {
      setState({
        status: "error",
        message: "We couldn't load your meetings right now. Please try again.",
      });
    }
  }, []);

  // Ref-guarded so this fires exactly once on mount — see the matching
  // comment in /account/orders/page.tsx for why the guard is needed to
  // satisfy react-hooks/set-state-in-effect.
  const hasLoaded = useRef(false);
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    load();
  }, [load]);

  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      <div className="mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
        <header className="mb-8 md:mb-10">
          <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Your Meetings</h1>
          <p className="mt-1.5 text-sm text-nav-plum/70">Consultations you&apos;ve booked with TRUELOGER.</p>
        </header>

        {state.status === "loading" && <MeetingsLoading />}
        {state.status === "error" && <MeetingsError message={state.message} onRetry={load} />}
        {state.status === "ready" && state.orders.length === 0 && <MeetingsEmpty />}
        {state.status === "ready" && state.orders.length > 0 && (
          <ul className="flex flex-col gap-4">
            {state.orders.map((order) => (
              <li key={order.id}>
                <MeetingCard order={order} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function MeetingsLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center"
    >
      <span className="h-8 w-8 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
      <p className="text-sm text-nav-plum/70">Loading your meetings…</p>
    </div>
  );
}

function MeetingsError({ message, onRetry }: { message: string; onRetry: () => void }) {
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

function MeetingsEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center">
      <CalendarClock aria-hidden="true" strokeWidth={1.5} className="h-10 w-10 text-nav-amethyst-deep" />
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">
        You haven&apos;t booked any consultations yet.
      </p>
      <Link
        href="/consult"
        className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep"
      >
        Book a Consultation
      </Link>
    </div>
  );
}

function MeetingCard({ order }: { order: Order }) {
  const items = consultationItems(order);
  const label = meetingStatusLabel(order.fulfillmentStatus);

  return (
    <div className="group relative rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-white to-nav-lavender-mist p-4 shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] sm:rounded-[1.4rem] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          {items.map((item, i) =>
            item.category === "consultation" ? (
              <p key={i} className="font-serif text-base text-nav-violet sm:text-lg">
                {item.serviceName}
                <span className="ml-1.5 text-sm font-sans text-nav-plum/60">· {item.duration} min</span>
              </p>
            ) : null,
          )}
        </div>
        <MeetingStatusBadge label={label} />
      </div>

      <Link
        href={`/account/orders/${order.id}`}
        className="mt-4 inline-flex min-h-9 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-4 py-1.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
      >
        View Order
      </Link>
    </div>
  );
}

function MeetingStatusBadge({ label }: { label: MeetingStatusLabel }) {
  const className =
    label === "Completed"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      : label === "Cancelled"
        ? "bg-rose-50/80 text-rose-700/90 ring-1 ring-rose-200/80"
        : label === "Scheduled"
          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
          : "bg-nav-lavender-soft text-nav-amethyst-deep ring-1 ring-nav-lavender-line";
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium ${className}`}>
      {label}
    </span>
  );
}
