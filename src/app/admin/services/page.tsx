"use client";

// src/app/admin/services/page.tsx
// Admin pricing management for Healing / Puja / Course products — one
// page, 3 tabs, mirroring admin/reports/page.tsx's ProductsTab exactly
// (same edit/save flow, same restriction: ONLY mrp/salePrice/
// deliveryTime/active are ever editable here; name/description/
// curriculum/FAQs are developer-controlled in src/lib/services/data/*
// and never shown as editable).
import { useCallback, useEffect, useState } from "react";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { formatInr } from "@/lib/consultation/pricing";
import { INPUT_CLASS } from "@/components/admin/products/form-styles";
import type { ServiceCategory, ServiceProduct } from "@/lib/services/types";

const TABS: { key: ServiceCategory; label: string }[] = [
  { key: "healing", label: "Healing" },
  { key: "puja", label: "Puja" },
  { key: "course", label: "Courses" },
];

export default function AdminServicesPage() {
  const [tab, setTab] = useState<ServiceCategory>("healing");

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Services</h1>
        <p className="mt-1.5 text-sm text-nav-plum/70">
          Healing, Puja and Course pricing. Only price, MRP, discount and delivery time are editable here.
        </p>
      </header>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`min-h-11 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-all duration-150 ${
              tab === t.key
                ? "bg-nav-amethyst text-white shadow-[0_4px_12px_-4px_rgba(90,55,140,0.5)]"
                : "bg-white text-nav-plum/80 ring-1 ring-nav-lavender-line hover:bg-nav-lavender-mist"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <CategoryTab category={tab} />
      </div>
    </div>
  );
}

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready" };
type EditDraft = { mrp: string; salePrice: string; deliveryTime: string };

function CategoryTab({ category }: { category: ServiceCategory }) {
  const [products, setProducts] = useState<ServiceProduct[]>([]);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft>({ mrp: "", salePrice: "", deliveryTime: "" });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successSlug, setSuccessSlug] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await authedFetch(`/api/admin/services?category=${category}`);
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { products: ServiceProduct[] };
      setProducts(data.products);
      setState({ status: "ready" });
    } catch {
      setState({ status: "error", message: "We couldn't load these products right now." });
    }
  }, [category]);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  function startEdit(product: ServiceProduct) {
    setSaveError(null);
    setSuccessSlug(null);
    setEditingSlug(product.slug);
    setDraft({ mrp: String(product.mrp), salePrice: String(product.salePrice), deliveryTime: product.deliveryTime });
  }

  function cancelEdit() {
    setEditingSlug(null);
    setSaveError(null);
  }

  async function saveEdit(slug: string) {
    setSaveError(null);
    const mrp = Number(draft.mrp);
    const salePrice = Number(draft.salePrice);
    if (!Number.isFinite(mrp) || mrp <= 0) return setSaveError("MRP must be a positive number.");
    if (!Number.isFinite(salePrice) || salePrice <= 0) return setSaveError("Sale price must be a positive number.");
    if (salePrice > mrp) return setSaveError("Sale price cannot exceed MRP.");
    if (!draft.deliveryTime.trim()) return setSaveError("Delivery time is required.");

    setSaving(true);
    try {
      const res = await authedFetch(`/api/admin/services/${category}/${slug}`, {
        method: "PATCH",
        body: JSON.stringify({ mrp, salePrice, deliveryTime: draft.deliveryTime.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSaveError((data && data.error) || "Couldn't save this product.");
        return;
      }
      const updated = data.product as ServiceProduct;
      setProducts((prev) => prev.map((p) => (p.slug === updated.slug ? updated : p)));
      setEditingSlug(null);
      setSuccessSlug(updated.slug);
      window.setTimeout(() => setSuccessSlug((s) => (s === updated.slug ? null : s)), 3000);
    } catch {
      setSaveError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (state.status === "loading") {
    return (
      <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center">
        <span className="h-8 w-8 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
        <p className="text-sm text-nav-plum/70">Loading…</p>
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

  return (
    <ul className="flex flex-col gap-3">
      {products.map((product) => {
        const isEditing = editingSlug === product.slug;
        return (
          <li
            key={product.slug}
            className="rounded-2xl border border-nav-lavender-line bg-white p-4 shadow-[0_1px_2px_rgba(70,40,120,0.04)] sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-nav-violet">{product.name}</p>
                <p className="mt-0.5 text-xs text-nav-plum/60">{product.duration}</p>
              </div>
              {successSlug === product.slug && (
                <span className="text-xs font-medium text-emerald-600">Saved ✓</span>
              )}
            </div>

            {isEditing ? (
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1 text-xs text-nav-plum/70">
                  MRP
                  <input
                    type="number"
                    min={1}
                    value={draft.mrp}
                    onChange={(e) => setDraft((d) => ({ ...d, mrp: e.target.value }))}
                    className={`${INPUT_CLASS} w-28`}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-nav-plum/70">
                  Sale Price
                  <input
                    type="number"
                    min={1}
                    value={draft.salePrice}
                    onChange={(e) => setDraft((d) => ({ ...d, salePrice: e.target.value }))}
                    className={`${INPUT_CLASS} w-28`}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-nav-plum/70">
                  Delivery Time
                  <input
                    type="text"
                    value={draft.deliveryTime}
                    onChange={(e) => setDraft((d) => ({ ...d, deliveryTime: e.target.value }))}
                    className={`${INPUT_CLASS} w-52`}
                  />
                </label>
                <div className="flex gap-3 pb-1.5">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => saveEdit(product.slug)}
                    className="min-h-9 font-medium text-nav-amethyst-deep hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button type="button" onClick={cancelEdit} className="min-h-9 font-medium text-nav-plum/60 hover:underline">
                    Cancel
                  </button>
                </div>
                {saveError && <p className="w-full text-xs text-red-600">{saveError}</p>}
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  {product.discountPercent > 0 && (
                    <span className="text-nav-plum/45 line-through">{formatInr(product.mrp)}</span>
                  )}
                  <span className="font-semibold text-nav-amethyst-deep">{formatInr(product.salePrice)}</span>
                  {product.discountPercent > 0 && (
                    <span className="rounded-full bg-nav-lavender-soft px-2 py-0.5 text-[11px] font-medium text-nav-amethyst-deep">
                      {product.discountPercent}% OFF
                    </span>
                  )}
                  <span className="text-nav-plum/60">· {product.deliveryTime}</span>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(product)}
                  className="min-h-9 font-medium text-nav-amethyst-deep hover:underline"
                >
                  Edit
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
