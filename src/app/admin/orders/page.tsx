"use client";

// src/app/admin/orders/page.tsx
// Admin order list — CONFIRMED orders only (Paid / Refunded). Every
// pre-confirmation state (a checkout session just created, a payment
// still in progress, a failed/cancelled/expired attempt) is noise for
// this screen by design: none of it is a real order to fulfill, and
// none of it should ever have been shown here in the first place. An
// admin who genuinely needs to investigate a failed payment attempt
// does that from Cashfree's own dashboard, not this list.
//
// PAGINATION / LIVE-UPDATE APPROACH:
// GET /api/admin/orders (paginated via `cursor`) stays the source of
// truth for the actual list and "Load more". A separate, lightweight
// Firestore `onSnapshot` listener on the `orders` collection
// (orderBy("updatedAt","desc"), limit(1) — a single-field index,
// nothing extra to deploy) watches for ANY order write newer than what
// this page has already seen — a brand-new order or an existing one
// just flipping to Paid/Refunded — and silently re-runs the first-page
// fetch when one arrives. No button: the admin never has to notice or
// act on a "new orders" banner themselves. Firestore Security Rules
// allow this: an admin's own ID token carries the admin claim, so
// `resource.data.userId == request.auth.uid || isAdmin()` passes for
// every order, not just the admin's own.
//
// PAYMENT-STATUS FILTER: "Refunded" is a single combined tab covering
// both `REFUNDED` and `PARTIALLY_REFUNDED` — operationally the admin
// just needs "orders with a refund on them", not the two split further.
// Since the API only accepts one `paymentStatus` value per request,
// that tab fires two parallel requests and merges+re-sorts the
// results; "Load more" tracks each status's own cursor independently.
//
// CATEGORY FILTERING: done CLIENT-SIDE on whatever page of orders is
// already loaded, via `orderCategories(order).includes(selected)` —
// the admin API has no category param, so this is a page-local filter,
// not a server-side one, which is an acceptable scope tradeoff at this
// catalogue's current scale.
//
// SEARCH: also client-side, over the currently loaded page(s) only —
// labeled honestly as filtering what's loaded, not a full-collection
// search (the API has no search param).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { firestoreDb } from "@/lib/firebase-client";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { formatInr } from "@/lib/consultation/pricing";
import { ORDER_ITEM_CATEGORIES, orderCategories, type Order, type OrderItemCategory, type PaymentStatus } from "@/lib/orders/types";
import { Search, PackageOpen, ArrowUpRight } from "lucide-react";

type PaymentFilter = "PAID" | "REFUNDED";

const PAYMENT_FILTERS: { key: PaymentFilter; label: string }[] = [
  { key: "PAID", label: "Paid" },
  { key: "REFUNDED", label: "Refunded" },
];

const CATEGORY_LABELS: Record<OrderItemCategory, string> = {
  gemstone: "Gemstones",
  bracelet: "Bracelets",
  rudraksha: "Rudraksha",
  spiritual: "Spiritual Products",
  yantra: "Yantras",
  consultation: "Consultations",
  report: "Personalized Reports",
};

function statusesForFilter(filter: PaymentFilter): PaymentStatus[] {
  return filter === "PAID" ? ["PAID"] : ["REFUNDED", "PARTIALLY_REFUNDED"];
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready" };

// Cursor bookkeeping per underlying status query that makes up the
// currently-selected filter (1 entry for "Paid", 2 for "Refunded").
type StatusStream = {
  key: PaymentStatus;
  cursor: string | null; // next cursor to send, null once exhausted
  exhausted: boolean;
};

export default function AdminOrdersPage() {
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("PAID");
  const [categoryFilter, setCategoryFilter] = useState<OrderItemCategory | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [streams, setStreams] = useState<StatusStream[]>([]);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [loadingMore, setLoadingMore] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const latestKnownUpdatedAt = useRef<number>(0);

  const loadFirstPage = useCallback(async (filter: PaymentFilter) => {
    setState({ status: "loading" });
    try {
      const queries = statusesForFilter(filter);
      const results = await Promise.all(
        queries.map(async (paymentStatus) => {
          const res = await authedFetch(`/api/admin/orders?paymentStatus=${paymentStatus}`);
          if (!res.ok) throw new Error("failed");
          return (await res.json()) as { orders: Order[]; nextCursor: string | null };
        }),
      );

      const merged = results.flatMap((r) => r.orders);
      merged.sort((a, b) => b.createdAt - a.createdAt);

      setOrders(merged);
      setStreams(
        results.map((r, i) => ({
          key: queries[i],
          cursor: r.nextCursor,
          exhausted: r.nextCursor === null,
        })),
      );
      latestKnownUpdatedAt.current = Math.max(0, ...merged.map((o) => o.updatedAt));
      setState({ status: "ready" });
    } catch {
      setState({ status: "error", message: "We couldn't load orders right now." });
    }
  }, []);

  useEffect(() => {
    // Deferred via queueMicrotask so the loading-state setState inside
    // loadFirstPage doesn't fire synchronously within this effect body
    // (react-hooks/set-state-in-effect).
    queueMicrotask(() => loadFirstPage(paymentFilter));
  }, [paymentFilter, loadFirstPage]);

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const active = streams.filter((s) => !s.exhausted);
      const results = await Promise.all(
        active.map(async (stream) => {
          const cursorQs = stream.cursor ? `&cursor=${stream.cursor}` : "";
          const res = await authedFetch(`/api/admin/orders?paymentStatus=${stream.key}${cursorQs}`);
          if (!res.ok) throw new Error("failed");
          const data = (await res.json()) as { orders: Order[]; nextCursor: string | null };
          return { key: stream.key, ...data };
        }),
      );

      setOrders((prev) => {
        const merged = [...prev, ...results.flatMap((r) => r.orders)];
        merged.sort((a, b) => b.createdAt - a.createdAt);
        return merged;
      });
      setStreams((prev) =>
        prev.map((s) => {
          const found = results.find((r) => r.key === s.key);
          if (!found) return s;
          return { ...s, cursor: found.nextCursor, exhausted: found.nextCursor === null };
        }),
      );
    } catch {
      // Leave the existing list intact; the user can just try "Load
      // more" again.
    } finally {
      setLoadingMore(false);
    }
  }

  // Live auto-refresh — no button, no banner to click. Any order write
  // newer than what's currently in view (a fresh order, or an existing
  // one just confirmed/refunded) silently re-runs the first-page fetch
  // for whichever filter is active. A brief "Updated" pulse near the
  // heading is the only feedback — enough to notice without demanding
  // a click.
  useEffect(() => {
    const q = query(collection(firestoreDb, "orders"), orderBy("updatedAt", "desc"), limit(1));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const latest = snap.docs[0]?.data() as Order | undefined;
        if (latest && latest.updatedAt > latestKnownUpdatedAt.current) {
          loadFirstPage(paymentFilter);
          setJustUpdated(true);
          window.setTimeout(() => setJustUpdated(false), 2500);
        }
      },
      () => {
        // Ignore listener errors (e.g. transient network) — "Load
        // more" and switching filters still work without this signal.
      },
    );
    return unsubscribe;
  }, [paymentFilter, loadFirstPage]);

  const hasMore = streams.some((s) => !s.exhausted);

  const visibleOrders = useMemo(() => {
    let list = orders;
    if (categoryFilter !== "ALL") {
      list = list.filter((o) => orderCategories(o).includes(categoryFilter));
    }
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (o) => o.id.toLowerCase().includes(term) || o.customerEmail.toLowerCase().includes(term),
      );
    }
    return list;
  }, [orders, categoryFilter, search]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
        <div>
          <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Orders</h1>
          <p className="mt-1.5 text-sm text-nav-plum/70">Confirmed orders — paid, and paid-then-refunded.</p>
        </div>
        <span
          className={`flex items-center gap-1.5 text-xs font-medium transition-opacity duration-500 ${
            justUpdated ? "text-nav-amethyst-deep opacity-100" : "text-nav-plum/40 opacity-100"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${justUpdated ? "bg-nav-amethyst motion-safe:animate-ping" : "bg-emerald-500"}`}
            aria-hidden="true"
          />
          {justUpdated ? "Updated just now" : "Live"}
        </span>
      </header>

      {/* Payment-status filter — just the two states that matter here */}
      <div className="flex gap-2">
        {PAYMENT_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setPaymentFilter(f.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-all duration-150 ${
              paymentFilter === f.key
                ? "bg-nav-amethyst text-white shadow-[0_4px_12px_-4px_rgba(90,55,140,0.5)]"
                : "bg-white text-nav-plum/80 ring-1 ring-nav-lavender-line hover:bg-nav-lavender-mist"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <div className="-mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <button
          type="button"
          onClick={() => setCategoryFilter("ALL")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
            categoryFilter === "ALL"
              ? "bg-nav-violet text-white"
              : "bg-nav-lavender-mist text-nav-plum/70 hover:text-nav-violet"
          }`}
        >
          All Categories
        </button>
        {ORDER_ITEM_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              categoryFilter === cat
                ? "bg-nav-violet text-white"
                : "bg-nav-lavender-mist text-nav-plum/70 hover:text-nav-violet"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Search — filters only what's already loaded */}
      <div className="relative mt-4 sm:max-w-sm">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-nav-plum/40" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search loaded orders by id or email…"
          className="w-full min-h-11 rounded-xl border border-nav-lavender-line bg-white py-2 pl-10 pr-3.5 text-sm text-nav-violet outline-none transition-colors focus:border-nav-amethyst focus:ring-2 focus:ring-nav-amethyst/30"
        />
      </div>

      <div className="mt-5">
        {state.status === "loading" && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-center gap-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center"
          >
            <span className="h-8 w-8 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
            <p className="text-sm text-nav-plum/70">Loading orders…</p>
          </div>
        )}

        {state.status === "error" && (
          <div role="alert" className="rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/80">
            {state.message}
          </div>
        )}

        {state.status === "ready" && visibleOrders.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-nav-lavender-line bg-nav-pearl/50 px-6 py-16 text-center">
            <PackageOpen aria-hidden="true" className="h-8 w-8 text-nav-plum/30" />
            <p className="text-sm text-nav-plum/70">No orders match this filter yet.</p>
          </div>
        )}

        {state.status === "ready" && visibleOrders.length > 0 && (
          <>
            {/* Mobile: cards */}
            <ul className="flex flex-col gap-3 lg:hidden">
              {visibleOrders.map((order) => (
                <li key={order.id}>
                  <OrderCard order={order} />
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-hidden rounded-2xl border border-nav-lavender-line bg-white shadow-[0_1px_2px_rgba(70,40,120,0.04)] lg:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-nav-lavender-line bg-nav-lavender-mist/70 text-[0.7rem] font-semibold uppercase tracking-wide text-nav-plum/70">
                    <tr>
                      <th className="px-5 py-3.5">Order</th>
                      <th className="px-5 py-3.5">Customer</th>
                      <th className="px-5 py-3.5">Categories</th>
                      <th className="px-5 py-3.5">Items</th>
                      <th className="px-5 py-3.5">Total</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleOrders.map((order) => (
                      <tr key={order.id} className="border-b border-nav-lavender-line/60 transition-colors last:border-0 hover:bg-nav-pearl/40">
                        <td className="px-5 py-3.5 font-medium text-nav-violet">#{order.id.slice(-8).toUpperCase()}</td>
                        <td className="px-5 py-3.5 text-nav-plum/80">{order.customerEmail}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {orderCategories(order).map((c) => (
                              <span key={c} className="rounded-full bg-nav-lavender-mist px-2 py-0.5 text-[0.68rem] text-nav-plum/70">
                                {CATEGORY_LABELS[c]}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-nav-plum/70">{order.items.length}</td>
                        <td className="px-5 py-3.5 font-semibold text-nav-amethyst-deep">{formatInr(order.total ?? order.subtotal)}</td>
                        <td className="px-5 py-3.5">
                          <PaymentBadge status={order.paymentStatus} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex items-center gap-1 font-medium text-nav-amethyst-deep transition-colors hover:text-nav-violet hover:underline"
                          >
                            View
                            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {state.status === "ready" && hasMore && !search.trim() && (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex min-h-11 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-6 py-2.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const categories = orderCategories(order);
  return (
    <Link
      href={`/admin/orders/${order.id}`}
      className="block rounded-2xl border border-nav-lavender-line bg-white p-4 shadow-[0_1px_2px_rgba(70,40,120,0.04)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-8px_rgba(90,55,140,0.25)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-nav-violet">#{order.id.slice(-8).toUpperCase()}</p>
          <p className="mt-0.5 text-xs text-nav-plum/60">{order.customerEmail}</p>
        </div>
        <PaymentBadge status={order.paymentStatus} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {categories.map((c) => (
          <span key={c} className="rounded-full bg-nav-lavender-mist px-2 py-0.5 text-[0.68rem] text-nav-plum/70">
            {CATEGORY_LABELS[c]}
          </span>
        ))}
        <span className="rounded-full bg-nav-lavender-mist px-2 py-0.5 text-[0.68rem] text-nav-plum/70">
          {order.items.length} item{order.items.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-nav-lavender-line pt-3">
        <span className="font-serif text-lg font-semibold text-nav-amethyst-deep">{formatInr(order.total ?? order.subtotal)}</span>
        <span className="flex min-h-9 items-center gap-1 rounded-full border border-nav-lavender-line px-4 py-1.5 text-sm font-medium text-nav-violet">
          View
          <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
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
