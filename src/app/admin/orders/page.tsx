"use client";

// src/app/admin/orders/page.tsx
// Admin order list: payment-status filter pills, client-side category
// tabs, a client-side id/email search box, cursor-based "Load more",
// and a live "new orders" banner.
//
// PAGINATION / LIVE-UPDATE APPROACH CHOSEN:
// We keep GET /api/admin/orders (paginated via `cursor`) as the source
// of truth for the actual list and "Load more", and layer a SEPARATE,
// lightweight Firestore `onSnapshot` listener on the `orders`
// collection (orderBy("createdAt","desc"), limit(1)) purely to detect
// that something newer than what's currently loaded has arrived. When
// the listener's newest `createdAt` is greater than the newest one
// already in view, we show a small "New orders — Refresh" banner
// instead of silently rewriting the list out from under an admin who
// might be mid-read (or forcing a merge of two independently-paginated
// sources, which gets complicated fast). Clicking the banner just
// re-runs the first-page fetch for the current filter. This satisfies
// "no manual page refresh needed to notice a new order arrived" via a
// real Firestore listener, without replacing the REST pagination this
// page already needs for "Load more". Firestore Security Rules allow
// this: an admin's own ID token carries the admin claim, so
// `resource.data.userId == request.auth.uid || isAdmin()` passes for
// every order, not just the admin's own.
//
// PAYMENT-STATUS FILTER CHOICE: "Pending Payment" is implemented as a
// single combined tab covering BOTH `CREATED` and `PENDING` (rather
// than two separate tabs), since from an operational standpoint an
// admin doesn't need to distinguish "checkout not yet opened" from
// "payment in progress" — both just mean "not yet paid, nothing to
// fulfill". Since the API only accepts one `paymentStatus` value per
// request, this tab fires two parallel requests and merges+re-sorts
// the results; "Load more" tracks each status's own cursor
// independently and re-merges after fetching more of whichever isn't
// exhausted yet.
//
// CATEGORY FILTERING: done CLIENT-SIDE on whatever page of orders is
// already loaded, via `orderCategories(order).includes(selected)` —
// the admin API has no category param, so this is a page-local filter,
// not a server-side one, which is an acceptable scope tradeoff at this
// catalogue's current scale (see AGENTS.md task brief). All three
// `ORDER_ITEM_CATEGORIES` are shown as tabs (Gemstones / Consultations
// / Products) even though no "product" order may exist yet, since all
// three are real category types this system supports.
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

type PaymentFilter = "ALL" | "PENDING_PAYMENT" | "PAID" | "FAILED" | "CANCELLED" | "EXPIRED" | "REFUNDED";

const PAYMENT_FILTERS: { key: PaymentFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING_PAYMENT", label: "Pending Payment" },
  { key: "PAID", label: "Paid" },
  { key: "FAILED", label: "Failed" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "EXPIRED", label: "Expired" },
  { key: "REFUNDED", label: "Refunded" },
];

const CATEGORY_LABELS: Record<OrderItemCategory, string> = {
  gemstone: "Gemstones",
  bracelet: "Bracelets",
  rudraksha: "Rudraksha",
  spiritual: "Spiritual Products",
  yantra: "Yantras",
  consultation: "Consultations",
};

type SingleStatusQuery = PaymentStatus | undefined; // undefined = "All"

function statusesForFilter(filter: PaymentFilter): SingleStatusQuery[] {
  switch (filter) {
    case "ALL":
      return [undefined];
    case "PENDING_PAYMENT":
      return ["CREATED", "PENDING"];
    default:
      return [filter as PaymentStatus];
  }
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready" };

// Cursor bookkeeping per underlying status query that makes up the
// currently-selected filter (1 entry for a single-status filter, 2 for
// the combined "Pending Payment" filter).
type StatusStream = {
  key: string; // "ALL" | a PaymentStatus
  cursor: string | null; // next cursor to send, null once exhausted
  exhausted: boolean;
};

export default function AdminOrdersPage() {
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<OrderItemCategory | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [streams, setStreams] = useState<StatusStream[]>([]);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [loadingMore, setLoadingMore] = useState(false);
  const [newOrdersAvailable, setNewOrdersAvailable] = useState(false);
  const latestKnownCreatedAt = useRef<number>(0);

  const loadFirstPage = useCallback(async (filter: PaymentFilter) => {
    setState({ status: "loading" });
    setNewOrdersAvailable(false);
    try {
      const queries = statusesForFilter(filter);
      const results = await Promise.all(
        queries.map(async (paymentStatus) => {
          const qs = paymentStatus ? `?paymentStatus=${paymentStatus}` : "";
          const res = await authedFetch(`/api/admin/orders${qs}`);
          if (!res.ok) throw new Error("failed");
          return (await res.json()) as { orders: Order[]; nextCursor: string | null };
        }),
      );

      const merged = results.flatMap((r) => r.orders);
      merged.sort((a, b) => b.createdAt - a.createdAt);

      setOrders(merged);
      setStreams(
        results.map((r, i) => ({
          key: queries[i] ?? "ALL",
          cursor: r.nextCursor,
          exhausted: r.nextCursor === null,
        })),
      );
      latestKnownCreatedAt.current = merged[0]?.createdAt ?? 0;
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
          const qs = stream.key === "ALL" ? "" : `?paymentStatus=${stream.key}`;
          const cursorQs = stream.cursor ? `${qs ? "&" : "?"}cursor=${stream.cursor}` : "";
          const res = await authedFetch(`/api/admin/orders${qs}${cursorQs}`);
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

  // Lightweight live listener: only checks whether anything newer than
  // what's currently in view has shown up, then surfaces a banner —
  // see the top-of-file comment for why this doesn't replace the REST
  // pagination above.
  useEffect(() => {
    const q = query(collection(firestoreDb, "orders"), orderBy("createdAt", "desc"), limit(1));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const latest = snap.docs[0]?.data() as Order | undefined;
        if (latest && latest.createdAt > latestKnownCreatedAt.current) {
          setNewOrdersAvailable(true);
        }
      },
      () => {
        // Ignore listener errors (e.g. transient network) — the
        // "Load more"/refresh path still works without this signal.
      },
    );
    return unsubscribe;
  }, []);

  const hasMore = streams.some((s) => !s.exhausted);

  const visibleOrders = useMemo(() => {
    let list = orders;
    // Failed payment attempts are noise in the default view — they
    // never became a real order to fulfill. Still reachable via the
    // explicit "Failed" filter pill above for anyone who genuinely
    // needs to audit failed attempts; just not shown in "All".
    if (paymentFilter === "ALL") {
      list = list.filter((o) => o.paymentStatus !== "FAILED");
    }
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
  }, [orders, paymentFilter, categoryFilter, search]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-5">
        <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Orders</h1>
        <p className="mt-1.5 text-sm text-nav-plum/70">Browse, filter, and update order fulfillment.</p>
      </header>

      {newOrdersAvailable && (
        <button
          type="button"
          onClick={() => loadFirstPage(paymentFilter)}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-nav-amethyst px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-nav-amethyst-deep"
        >
          New orders have arrived — Refresh
        </button>
      )}

      {/* Payment-status filter pills */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {PAYMENT_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setPaymentFilter(f.key)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150 ${
              paymentFilter === f.key
                ? "bg-nav-amethyst text-white"
                : "bg-white text-nav-plum/80 ring-1 ring-nav-lavender-line hover:bg-nav-lavender-mist"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <div className="mt-3 flex gap-2 overflow-x-auto">
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
      <div className="mt-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search loaded orders by id or email…"
          className="w-full min-h-11 rounded-xl border border-nav-lavender-line bg-white px-3.5 py-2 text-sm text-nav-violet outline-none focus:border-nav-amethyst focus:ring-2 focus:ring-nav-amethyst/30 sm:max-w-sm"
        />
        {search.trim() && (
          <p className="mt-1 text-xs text-nav-plum/60">Searching only the orders currently loaded below.</p>
        )}
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
          <p className="rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/70">
            No orders match this filter.
          </p>
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
            <div className="hidden overflow-x-auto rounded-2xl border border-nav-lavender-line bg-white lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-nav-lavender-line bg-nav-lavender-mist text-xs uppercase tracking-wide text-nav-plum/70">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Categories</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((order) => (
                    <tr key={order.id} className="border-b border-nav-lavender-line/60 last:border-0">
                      <td className="px-4 py-3 font-medium text-nav-violet">#{order.id.slice(-8).toUpperCase()}</td>
                      <td className="px-4 py-3 text-nav-plum/80">{order.customerEmail}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {orderCategories(order).map((c) => (
                            <span key={c} className="rounded-full bg-nav-lavender-mist px-2 py-0.5 text-[0.68rem] text-nav-plum/70">
                              {CATEGORY_LABELS[c]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-nav-plum/70">{order.items.length}</td>
                      <td className="px-4 py-3 font-semibold text-nav-amethyst-deep">{formatInr(order.subtotal)}</td>
                      <td className="px-4 py-3">
                        <PaymentBadge status={order.paymentStatus} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/orders/${order.id}`} className="font-medium text-nav-amethyst-deep hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
    <div className="rounded-2xl border border-nav-lavender-line bg-white p-4">
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
        <span className="font-semibold text-nav-amethyst-deep">{formatInr(order.subtotal)}</span>
        <Link
          href={`/admin/orders/${order.id}`}
          className="flex min-h-11 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-4 py-1.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
        >
          View
        </Link>
      </div>
    </div>
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
