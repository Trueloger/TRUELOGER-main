"use client";

// src/app/admin/page.tsx
// Admin dashboard overview — a light operational summary, not a report
// generator. Fetches only the FIRST page of /api/admin/orders (no
// filter) and /api/admin/users, so every stat here is honestly labeled
// against "this page" (25 most-recent orders/users) rather than
// implying an exact count across the whole collection — a real
// collection-wide count would need a separate aggregate query, which
// is a nice-to-have this page deliberately skips per scope.
import { useEffect, useState } from "react";
import Link from "next/link";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { formatInr } from "@/lib/consultation/pricing";
import type { Order, PaymentStatus } from "@/lib/orders/types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; orders: Order[]; userCount: number };

export default function AdminDashboardPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ordersRes, usersRes] = await Promise.all([
          authedFetch("/api/admin/orders"),
          authedFetch("/api/admin/users"),
        ]);
        if (!ordersRes.ok || !usersRes.ok) throw new Error("failed");
        const ordersData = (await ordersRes.json()) as { orders: Order[] };
        const usersData = (await usersRes.json()) as { users: unknown[] };
        if (cancelled) return;
        setState({
          status: "ready",
          orders: ordersData.orders,
          userCount: usersData.users.length,
        });
      } catch {
        if (!cancelled) {
          setState({ status: "error", message: "We couldn't load the dashboard right now." });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 md:mb-8">
        <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Dashboard</h1>
        <p className="mt-1.5 text-sm text-nav-plum/70">A quick look at recent activity.</p>
      </header>

      {state.status === "loading" && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center"
        >
          <span className="h-8 w-8 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
          <p className="text-sm text-nav-plum/70">Loading…</p>
        </div>
      )}

      {state.status === "error" && (
        <div role="alert" className="rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/80">
          {state.message}
        </div>
      )}

      {state.status === "ready" && (
        <>
          <StatTiles orders={state.orders} userCount={state.userCount} />

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-lg text-nav-violet">Recent Orders</h2>
              <Link href="/admin/orders" className="text-sm font-medium text-nav-amethyst-deep hover:underline">
                View all
              </Link>
            </div>

            {state.orders.length === 0 ? (
              <p className="rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-10 text-center text-sm text-nav-plum/70">
                No orders yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {state.orders.slice(0, 10).map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-nav-lavender-line bg-white px-4 py-3 text-sm transition-colors hover:bg-nav-lavender-mist"
                    >
                      <span className="font-medium text-nav-violet">#{order.id.slice(-8).toUpperCase()}</span>
                      <span className="text-nav-plum/70">{order.customerEmail}</span>
                      <span className="font-semibold text-nav-amethyst-deep">{formatInr(order.subtotal)}</span>
                      <DashboardBadge status={order.paymentStatus} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatTiles({ orders, userCount }: { orders: Order[]; userCount: number }) {
  const paid = orders.filter((o) => o.paymentStatus === "PAID").length;
  const pending = orders.filter((o) => o.paymentStatus === "CREATED" || o.paymentStatus === "PENDING").length;

  const tiles = [
    { label: "Recent orders (this page)", value: orders.length },
    { label: "Paid (this page)", value: paid },
    { label: "Pending payment (this page)", value: pending },
    { label: "Recent users (this page)", value: userCount },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-2xl border border-nav-lavender-line bg-white px-4 py-4 text-center">
          <p className="text-2xl font-semibold text-nav-amethyst-deep">{tile.value}</p>
          <p className="mt-1 text-[0.75rem] leading-snug text-nav-plum/70">{tile.label}</p>
        </div>
      ))}
    </div>
  );
}

function DashboardBadge({ status }: { status: PaymentStatus }) {
  const style =
    status === "PAID"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "CREATED" || status === "PENDING"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : status === "FAILED" || status === "CANCELLED" || status === "EXPIRED"
          ? "bg-rose-50 text-rose-700 ring-rose-200"
          : "bg-nav-lavender-soft text-nav-amethyst-deep ring-nav-lavender-line";
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium ring-1 ${style}`}>
      {status}
    </span>
  );
}
