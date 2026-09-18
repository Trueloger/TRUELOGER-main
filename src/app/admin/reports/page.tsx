"use client";

// src/app/admin/reports/page.tsx
// Admin "Paid Personalized Reports" screen — two tabs:
//   1. Report Products — the 7 report products with their live pricing
//      (GET/PATCH /api/admin/reports/products[/:slug]). Only mrp,
//      salePrice, and deliveryHours are ever editable here (see the
//      route's own doc comment) — name/description/sections are
//      developer-controlled in src/lib/reports/products.ts and never
//      shown as editable.
//   2. Report Orders — the report generation job list
//      (GET /api/admin/reports), a deliberately trimmed summary with no
//      birth details/sections (the API doesn't return them to this
//      view at all).
// Mirrors admin/orders/page.tsx and admin/coupons/page.tsx's structural
// conventions: header, mobile-card/desktop-table split, loading/error/
// empty states, the same ivory/lavender/amethyst/gold palette and
// min-h-11 touch targets, and reuses the shared form-input classes from
// src/components/admin/products/form-styles.ts.
import { useCallback, useEffect, useState } from "react";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { formatInr } from "@/lib/consultation/pricing";
import { REPORT_PRODUCTS } from "@/lib/reports/products";
import type { ReportProduct, ReportStatus } from "@/lib/reports/types";
import { INPUT_CLASS, LABEL_CLASS } from "@/components/admin/products/form-styles";

type Tab = "products" | "orders";

const TABS: { key: Tab; label: string }[] = [
  { key: "products", label: "Report Products" },
  { key: "orders", label: "Report Orders" },
];

export default function AdminReportsPage() {
  const [tab, setTab] = useState<Tab>("products");

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Reports</h1>
        <p className="mt-1.5 text-sm text-nav-plum/70">Paid personalized report pricing and generation jobs.</p>
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

      <div className="mt-5">{tab === "products" ? <ProductsTab /> : <OrdersTab />}</div>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Tab 1 — Report Products                                              */
/* -------------------------------------------------------------------- */

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready" };

type EditDraft = { mrp: string; salePrice: string; deliveryHours: string };

function ProductsTab() {
  const [products, setProducts] = useState<ReportProduct[]>([]);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft>({ mrp: "", salePrice: "", deliveryHours: "" });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successSlug, setSuccessSlug] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await authedFetch("/api/admin/reports/products");
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { products: ReportProduct[] };
      setProducts(data.products);
      setState({ status: "ready" });
    } catch {
      setState({ status: "error", message: "We couldn't load report products right now." });
    }
  }, []);

  useEffect(() => {
    // Deferred via queueMicrotask — see admin/orders/page.tsx's
    // identical comment (react-hooks/set-state-in-effect).
    queueMicrotask(() => load());
  }, [load]);

  function startEdit(product: ReportProduct) {
    setSaveError(null);
    setSuccessSlug(null);
    setEditingSlug(product.slug);
    setDraft({
      mrp: String(product.mrp),
      salePrice: String(product.salePrice),
      deliveryHours: String(product.deliveryHours),
    });
  }

  function cancelEdit() {
    setEditingSlug(null);
    setSaveError(null);
  }

  async function saveEdit(slug: string) {
    setSaveError(null);

    const mrp = Number(draft.mrp);
    const salePrice = Number(draft.salePrice);
    const deliveryHours = Number(draft.deliveryHours);

    if (!Number.isFinite(mrp) || mrp <= 0) {
      setSaveError("MRP must be a positive number.");
      return;
    }
    if (!Number.isFinite(salePrice) || salePrice <= 0) {
      setSaveError("Sale price must be a positive number.");
      return;
    }
    if (!Number.isFinite(deliveryHours) || deliveryHours < 0) {
      setSaveError("Delivery hours must be zero or more.");
      return;
    }
    if (salePrice > mrp) {
      setSaveError("Sale price cannot exceed MRP.");
      return;
    }

    setSaving(true);
    try {
      const res = await authedFetch(`/api/admin/reports/products/${slug}`, {
        method: "PATCH",
        body: JSON.stringify({ mrp, salePrice, deliveryHours }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSaveError((data && data.error) || "Couldn't save this product.");
        return;
      }
      const updated = data.product as ReportProduct;
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
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-center gap-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center"
      >
        <span className="h-8 w-8 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
        <p className="text-sm text-nav-plum/70">Loading report products…</p>
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

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/70">
        No report products found.
      </p>
    );
  }

  return (
    <>
      {/* Mobile: cards */}
      <ul className="flex flex-col gap-3 lg:hidden">
        {products.map((product) => (
          <li key={product.slug}>
            <ProductCard
              product={product}
              editing={editingSlug === product.slug}
              draft={draft}
              setDraft={setDraft}
              saving={saving}
              saveError={editingSlug === product.slug ? saveError : null}
              justSaved={successSlug === product.slug}
              onEdit={() => startEdit(product)}
              onCancel={cancelEdit}
              onSave={() => saveEdit(product.slug)}
            />
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-nav-lavender-line bg-white shadow-[0_1px_2px_rgba(70,40,120,0.04)] lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-nav-lavender-line bg-nav-lavender-mist/70 text-[0.7rem] font-semibold uppercase tracking-wide text-nav-plum/70">
              <tr>
                <th className="px-5 py-3.5">Report</th>
                <th className="px-5 py-3.5">Pages</th>
                <th className="px-5 py-3.5">MRP</th>
                <th className="px-5 py-3.5">Sale Price</th>
                <th className="px-5 py-3.5">Discount</th>
                <th className="px-5 py-3.5">Delivery</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const isEditing = editingSlug === product.slug;
                return (
                  <tr key={product.slug} className="border-b border-nav-lavender-line/60 last:border-0">
                    <td className="px-5 py-3.5 align-top font-medium text-nav-violet">{product.name}</td>
                    <td className="px-5 py-3.5 align-top text-nav-plum/70">
                      {product.minPages}–{product.maxPages}
                    </td>
                    {isEditing ? (
                      <>
                        <td className="px-5 py-3.5 align-top">
                          <input
                            type="number"
                            min={1}
                            value={draft.mrp}
                            onChange={(e) => setDraft((d) => ({ ...d, mrp: e.target.value }))}
                            className={`${INPUT_CLASS} w-28`}
                          />
                        </td>
                        <td className="px-5 py-3.5 align-top">
                          <input
                            type="number"
                            min={1}
                            value={draft.salePrice}
                            onChange={(e) => setDraft((d) => ({ ...d, salePrice: e.target.value }))}
                            className={`${INPUT_CLASS} w-28`}
                          />
                        </td>
                        <td className="px-5 py-3.5 align-top text-nav-plum/50">—</td>
                        <td className="px-5 py-3.5 align-top">
                          <input
                            type="number"
                            min={0}
                            value={draft.deliveryHours}
                            onChange={(e) => setDraft((d) => ({ ...d, deliveryHours: e.target.value }))}
                            className={`${INPUT_CLASS} w-24`}
                          />
                        </td>
                        <td className="px-5 py-3.5 align-top">
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-3">
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => saveEdit(product.slug)}
                                className="min-h-9 font-medium text-nav-amethyst-deep hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {saving ? "Saving…" : "Save"}
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={cancelEdit}
                                className="min-h-9 font-medium text-nav-plum/70 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Cancel
                              </button>
                            </div>
                            {saveError && <p className="max-w-52 text-right text-xs text-rose-700">{saveError}</p>}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-3.5 align-top text-nav-plum/80">{formatInr(product.mrp)}</td>
                        <td className="px-5 py-3.5 align-top font-semibold text-nav-amethyst-deep">{formatInr(product.salePrice)}</td>
                        <td className="px-5 py-3.5 align-top text-nav-plum/70">{product.discountPercent}%</td>
                        <td className="px-5 py-3.5 align-top text-nav-plum/70">{product.deliveryHours}h</td>
                        <td className="px-5 py-3.5 align-top text-right">
                          {successSlug === product.slug && <p className="mb-1 text-xs text-emerald-700">Saved</p>}
                          <button
                            type="button"
                            onClick={() => startEdit(product)}
                            className="min-h-9 font-medium text-nav-amethyst-deep hover:underline"
                          >
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function ProductCard({
  product,
  editing,
  draft,
  setDraft,
  saving,
  saveError,
  justSaved,
  onEdit,
  onCancel,
  onSave,
}: {
  product: ReportProduct;
  editing: boolean;
  draft: EditDraft;
  setDraft: (updater: (d: EditDraft) => EditDraft) => void;
  saving: boolean;
  saveError: string | null;
  justSaved: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="rounded-2xl border border-nav-lavender-line bg-white p-4 shadow-[0_1px_2px_rgba(70,40,120,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-nav-violet">{product.name}</p>
          <p className="mt-0.5 text-xs text-nav-plum/60">
            {product.minPages}–{product.maxPages} pages
          </p>
        </div>
        {justSaved && !editing && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.68rem] font-medium text-emerald-700 ring-1 ring-emerald-200">
            Saved
          </span>
        )}
      </div>

      {editing ? (
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <label className={LABEL_CLASS}>MRP (₹)</label>
            <input
              type="number"
              min={1}
              value={draft.mrp}
              onChange={(e) => setDraft((d) => ({ ...d, mrp: e.target.value }))}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Sale Price (₹)</label>
            <input
              type="number"
              min={1}
              value={draft.salePrice}
              onChange={(e) => setDraft((d) => ({ ...d, salePrice: e.target.value }))}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Delivery Hours</label>
            <input
              type="number"
              min={0}
              value={draft.deliveryHours}
              onChange={(e) => setDraft((d) => ({ ...d, deliveryHours: e.target.value }))}
              className={INPUT_CLASS}
            />
          </div>
          {saveError && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-200">
              {saveError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onSave}
              className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-nav-amethyst px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-nav-amethyst-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onCancel}
              className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-4 py-1.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-nav-lavender-mist/60 px-2 py-2">
              <p className="text-[0.65rem] uppercase tracking-wide text-nav-plum/60">MRP</p>
              <p className="mt-0.5 text-sm font-medium text-nav-plum/80">{formatInr(product.mrp)}</p>
            </div>
            <div className="rounded-xl bg-nav-lavender-mist/60 px-2 py-2">
              <p className="text-[0.65rem] uppercase tracking-wide text-nav-plum/60">Sale</p>
              <p className="mt-0.5 text-sm font-semibold text-nav-amethyst-deep">{formatInr(product.salePrice)}</p>
            </div>
            <div className="rounded-xl bg-nav-lavender-mist/60 px-2 py-2">
              <p className="text-[0.65rem] uppercase tracking-wide text-nav-plum/60">Off</p>
              <p className="mt-0.5 text-sm font-medium text-nav-plum/80">{product.discountPercent}%</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-nav-lavender-line pt-3">
            <p className="text-xs text-nav-plum/60">Delivery in {product.deliveryHours}h</p>
            <button
              type="button"
              onClick={onEdit}
              className="flex min-h-11 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-5 py-1.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
            >
              Edit
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Tab 2 — Report Orders                                                */
/* -------------------------------------------------------------------- */

type ReportSummary = {
  id: string;
  userId: string;
  orderId: string;
  reportType: string;
  productSlug: string;
  status: ReportStatus;
  customerName: string;
  createdAt: number;
  scheduledAt: number;
  startedAt?: number;
  completedAt?: number;
  deliveryDelayHours: number;
  pageCount?: number;
  errorCode?: string;
};

function reportProductName(productSlug: string, reportType: string): string {
  const product = REPORT_PRODUCTS.find((p) => p.slug === productSlug) ?? REPORT_PRODUCTS.find((p) => p.type === reportType);
  return product?.name ?? reportType;
}

function formatDateTime(ms: number | undefined): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const style =
    status === "READY"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "PURCHASED" || status === "SCHEDULED" || status === "GENERATING" || status === "RENDERING"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : status === "FAILED"
          ? "bg-rose-50 text-rose-700 ring-rose-200"
          : "bg-nav-lavender-soft text-nav-amethyst-deep ring-nav-lavender-line";
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium ring-1 ${style}`}>
      {status}
    </span>
  );
}

function OrdersTab() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await authedFetch("/api/admin/reports");
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { reports: ReportSummary[] };
      setReports(data.reports.sort((a, b) => b.createdAt - a.createdAt));
      setState({ status: "ready" });
    } catch {
      setState({ status: "error", message: "We couldn't load report orders right now." });
    }
  }, []);

  useEffect(() => {
    // Deferred via queueMicrotask — see admin/orders/page.tsx's
    // identical comment (react-hooks/set-state-in-effect).
    queueMicrotask(() => load());
  }, [load]);

  if (state.status === "loading") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-center gap-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center"
      >
        <span className="h-8 w-8 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
        <p className="text-sm text-nav-plum/70">Loading report orders…</p>
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

  if (reports.length === 0) {
    return (
      <p className="rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/70">
        No report orders yet.
      </p>
    );
  }

  return (
    <>
      {/* Mobile: cards */}
      <ul className="flex flex-col gap-3 lg:hidden">
        {reports.map((report) => (
          <li key={report.id}>
            <ReportOrderCard report={report} />
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-nav-lavender-line bg-white shadow-[0_1px_2px_rgba(70,40,120,0.04)] lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-nav-lavender-line bg-nav-lavender-mist/70 text-[0.7rem] font-semibold uppercase tracking-wide text-nav-plum/70">
              <tr>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Report</th>
                <th className="px-5 py-3.5">Order</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Purchased</th>
                <th className="px-5 py-3.5">Scheduled</th>
                <th className="px-5 py-3.5">Completed</th>
                <th className="px-5 py-3.5">Pages</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-nav-lavender-line/60 last:border-0">
                  <td className="px-5 py-3.5 font-medium text-nav-violet">{report.customerName}</td>
                  <td className="px-5 py-3.5 text-nav-plum/80">{reportProductName(report.productSlug, report.reportType)}</td>
                  <td className="px-5 py-3.5 text-nav-plum/70">#{report.orderId.slice(-8).toUpperCase()}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col items-start gap-1">
                      <ReportStatusBadge status={report.status} />
                      {report.errorCode && <span className="text-[0.68rem] text-rose-600">Generation failed — see server logs</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-nav-plum/70">{formatDateTime(report.createdAt)}</td>
                  <td className="px-5 py-3.5 text-nav-plum/70">{formatDateTime(report.scheduledAt)}</td>
                  <td className="px-5 py-3.5 text-nav-plum/70">{formatDateTime(report.completedAt)}</td>
                  <td className="px-5 py-3.5 text-nav-plum/70">{report.pageCount ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function ReportOrderCard({ report }: { report: ReportSummary }) {
  return (
    <div className="rounded-2xl border border-nav-lavender-line bg-white p-4 shadow-[0_1px_2px_rgba(70,40,120,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-nav-violet">{report.customerName}</p>
          <p className="mt-0.5 text-xs text-nav-plum/60">{reportProductName(report.productSlug, report.reportType)}</p>
        </div>
        <ReportStatusBadge status={report.status} />
      </div>
      {report.errorCode && <p className="mt-1.5 text-xs text-rose-600">Generation failed — see server logs</p>}
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-nav-lavender-line pt-3 text-xs">
        <div>
          <p className="text-nav-plum/50">Order</p>
          <p className="mt-0.5 text-nav-plum/80">#{report.orderId.slice(-8).toUpperCase()}</p>
        </div>
        <div>
          <p className="text-nav-plum/50">Pages</p>
          <p className="mt-0.5 text-nav-plum/80">{report.pageCount ?? "—"}</p>
        </div>
        <div>
          <p className="text-nav-plum/50">Purchased</p>
          <p className="mt-0.5 text-nav-plum/80">{formatDateTime(report.createdAt)}</p>
        </div>
        <div>
          <p className="text-nav-plum/50">Scheduled</p>
          <p className="mt-0.5 text-nav-plum/80">{formatDateTime(report.scheduledAt)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-nav-plum/50">Completed</p>
          <p className="mt-0.5 text-nav-plum/80">{formatDateTime(report.completedAt)}</p>
        </div>
      </div>
    </div>
  );
}
