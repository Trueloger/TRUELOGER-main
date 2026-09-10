"use client";

// src/app/admin/products/page.tsx
// Admin product list: category tabs (server-filtered — the GET route
// accepts `category` directly, unlike orders which has no category
// param and so filters client-side), a status filter row, a
// client-side search-as-you-type over the currently loaded page (same
// "filters only what's loaded" convention as admin/orders/page.tsx),
// and cursor-based "Load more". Row actions: a Publish/Draft toggle
// (PATCH) and a Delete action (DELETE) that may come back "archived"
// instead of "deleted" when the product has existing orders — the API
// is the source of truth for which happened, so we just relay it.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { formatInr } from "@/lib/consultation/pricing";
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS, type Product, type ProductCategory, type ProductStatus } from "@/lib/products/types";
import { ProductThumb } from "@/components/admin/products/ProductThumb";
import { StatusBadge } from "@/components/admin/products/StatusBadge";

type StatusFilter = ProductStatus | "ALL";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "All statuses" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Draft" },
  { key: "archived", label: "Archived" },
];

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready" };

export default function AdminProductsPage() {
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  const buildQuery = useCallback((category: ProductCategory | "ALL", status: StatusFilter, cursorId?: string) => {
    const params = new URLSearchParams();
    if (category !== "ALL") params.set("category", category);
    if (status !== "ALL") params.set("status", status);
    if (cursorId) params.set("cursor", cursorId);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, []);

  const loadFirstPage = useCallback(
    async (category: ProductCategory | "ALL", status: StatusFilter) => {
      setState({ status: "loading" });
      try {
        const res = await authedFetch(`/api/admin/products${buildQuery(category, status)}`);
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as { products: Product[]; nextCursor: string | null };
        setProducts(data.products);
        setCursor(data.nextCursor);
        setState({ status: "ready" });
      } catch {
        setState({ status: "error", message: "We couldn't load products right now." });
      }
    },
    [buildQuery],
  );

  useEffect(() => {
    // Deferred via queueMicrotask so the loading-state setState inside
    // loadFirstPage doesn't fire synchronously within this effect body
    // (react-hooks/set-state-in-effect) — same pattern as admin/orders.
    queueMicrotask(() => loadFirstPage(categoryFilter, statusFilter));
  }, [categoryFilter, statusFilter, loadFirstPage]);

  async function handleLoadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const res = await authedFetch(`/api/admin/products${buildQuery(categoryFilter, statusFilter, cursor)}`);
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { products: Product[]; nextCursor: string | null };
      setProducts((prev) => [...prev, ...data.products]);
      setCursor(data.nextCursor);
    } catch {
      // Leave the existing list intact; the admin can just try again.
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleToggleStatus(product: Product) {
    const nextStatus: ProductStatus = product.status === "published" ? "draft" : "published";
    setBusyId(product.id);
    try {
      const res = await authedFetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { product: Product };
      setProducts((prev) => prev.map((p) => (p.id === product.id ? data.product : p)));
    } catch {
      setNoteById((prev) => ({ ...prev, [product.id]: "Couldn't update status — try again." }));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? If this product has past orders it will be archived instead of deleted.`,
    );
    if (!confirmed) return;
    setBusyId(product.id);
    try {
      const res = await authedFetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { result: "deleted" | "archived" };
      if (data.result === "deleted") {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
      } else {
        setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, status: "archived" } : p)));
        setNoteById((prev) => ({ ...prev, [product.id]: "Has past orders — archived instead of deleted." }));
      }
    } catch {
      setNoteById((prev) => ({ ...prev, [product.id]: "Couldn't delete — try again." }));
    } finally {
      setBusyId(null);
    }
  }

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => p.name.toLowerCase().includes(term));
  }, [products, search]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Products</h1>
          <p className="mt-1.5 text-sm text-nav-plum/70">Manage the catalogue across every category.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-nav-amethyst-deep"
        >
          + Add Product
        </Link>
      </header>

      {/* Category tabs */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        <button
          type="button"
          onClick={() => setCategoryFilter("ALL")}
          className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150 ${
            categoryFilter === "ALL"
              ? "bg-nav-amethyst text-white"
              : "bg-white text-nav-plum/80 ring-1 ring-nav-lavender-line hover:bg-nav-lavender-mist"
          }`}
        >
          All
        </button>
        {PRODUCT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150 ${
              categoryFilter === cat
                ? "bg-nav-amethyst text-white"
                : "bg-white text-nav-plum/80 ring-1 ring-nav-lavender-line hover:bg-nav-lavender-mist"
            }`}
          >
            {PRODUCT_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStatusFilter(f.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              statusFilter === f.key
                ? "bg-nav-violet text-white"
                : "bg-nav-lavender-mist text-nav-plum/70 hover:text-nav-violet"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search — filters only what's already loaded */}
      <div className="mt-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search loaded products by name…"
          className="w-full min-h-11 rounded-xl border border-nav-lavender-line bg-white px-3.5 py-2 text-sm text-nav-violet outline-none focus:border-nav-amethyst focus:ring-2 focus:ring-nav-amethyst/30 sm:max-w-sm"
        />
        {search.trim() && (
          <p className="mt-1 text-xs text-nav-plum/60">Searching only the products currently loaded below.</p>
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
            <p className="text-sm text-nav-plum/70">Loading products…</p>
          </div>
        )}

        {state.status === "error" && (
          <div role="alert" className="rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/80">
            {state.message}
          </div>
        )}

        {state.status === "ready" && visibleProducts.length === 0 && (
          <p className="rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/70">
            No products match this filter.
          </p>
        )}

        {state.status === "ready" && visibleProducts.length > 0 && (
          <>
            {/* Mobile: cards */}
            <ul className="flex flex-col gap-3 lg:hidden">
              {visibleProducts.map((product) => (
                <li key={product.id}>
                  <ProductCard
                    product={product}
                    busy={busyId === product.id}
                    note={noteById[product.id]}
                    onToggleStatus={() => handleToggleStatus(product)}
                    onDelete={() => handleDelete(product)}
                  />
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-2xl border border-nav-lavender-line bg-white lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-nav-lavender-line bg-nav-lavender-mist text-xs uppercase tracking-wide text-nav-plum/70">
                  <tr>
                    <th className="px-4 py-3" />
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Variants</th>
                    <th className="px-4 py-3">From</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      busy={busyId === product.id}
                      note={noteById[product.id]}
                      onToggleStatus={() => handleToggleStatus(product)}
                      onDelete={() => handleDelete(product)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {state.status === "ready" && cursor && !search.trim() && (
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

function priceRange(product: Product): string {
  if (product.variants.length === 0) return "—";
  const lowestSale = Math.min(...product.variants.map((v) => v.salePrice));
  return `${formatInr(lowestSale)}`;
}

function ProductRow({
  product,
  busy,
  note,
  onToggleStatus,
  onDelete,
}: {
  product: Product;
  busy: boolean;
  note?: string;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b border-nav-lavender-line/60 last:border-0 align-top">
      <td className="px-4 py-3">
        <div className="h-12 w-12">
          <ProductThumb src={product.image.src} alt={product.image.alt} />
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-nav-violet">{product.name}</p>
        {note && <p className="mt-0.5 text-xs text-nav-plum/60">{note}</p>}
      </td>
      <td className="px-4 py-3 text-nav-plum/70">{PRODUCT_CATEGORY_LABELS[product.category]}</td>
      <td className="px-4 py-3">
        <StatusBadge status={product.status} />
      </td>
      <td className="px-4 py-3 text-nav-plum/70">{product.variants.length}</td>
      <td className="px-4 py-3 font-semibold text-nav-amethyst-deep">from {priceRange(product)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Link href={`/admin/products/${product.id}`} className="font-medium text-nav-amethyst-deep hover:underline">
            Edit
          </Link>
          {product.status !== "archived" && (
            <button
              type="button"
              disabled={busy}
              onClick={onToggleStatus}
              className="rounded-full border border-nav-lavender-line bg-white px-2.5 py-1 text-xs font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist disabled:cursor-not-allowed disabled:opacity-60"
            >
              {product.status === "published" ? "Set draft" : "Publish"}
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="rounded-full border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function ProductCard({
  product,
  busy,
  note,
  onToggleStatus,
  onDelete,
}: {
  product: Product;
  busy: boolean;
  note?: string;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-nav-lavender-line bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0">
          <ProductThumb src={product.image.src} alt={product.image.alt} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-medium text-nav-violet">{product.name}</p>
            <StatusBadge status={product.status} />
          </div>
          <p className="mt-0.5 text-xs text-nav-plum/60">{PRODUCT_CATEGORY_LABELS[product.category]}</p>
          <p className="mt-1 text-sm font-semibold text-nav-amethyst-deep">
            from {priceRange(product)} · {product.variants.length} variant{product.variants.length === 1 ? "" : "s"}
          </p>
          {note && <p className="mt-1 text-xs text-nav-plum/60">{note}</p>}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-nav-lavender-line pt-3">
        <Link
          href={`/admin/products/${product.id}`}
          className="flex min-h-9 flex-1 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-3 py-1.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
        >
          Edit
        </Link>
        {product.status !== "archived" && (
          <button
            type="button"
            disabled={busy}
            onClick={onToggleStatus}
            className="flex min-h-9 flex-1 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-3 py-1.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist disabled:cursor-not-allowed disabled:opacity-60"
          >
            {product.status === "published" ? "Set draft" : "Publish"}
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="flex min-h-9 flex-1 items-center justify-center rounded-full border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
