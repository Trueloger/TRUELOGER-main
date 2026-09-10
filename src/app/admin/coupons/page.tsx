"use client";

// src/app/admin/coupons/page.tsx
// Admin coupon management: list + create/edit form + activate/
// deactivate + delete. Mirrors admin/orders/page.tsx's structural
// conventions (header, mobile-card/desktop-table list, loading/error/
// empty states) and the same ivory/lavender/amethyst/gold palette.
//
// Every coupon field comes straight from the real `Coupon` type
// (src/lib/coupons/types.ts) — there's no redeemed-count field on the
// admin list response (GET /api/admin/coupons just returns
// `listAllCouponsForAdmin()`, i.e. Coupon[] with no redemption
// subcollection join), so "usage" here shows the configured limits
// only, never a fabricated redeemed count.
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { formatInr } from "@/lib/consultation/pricing";
import { PRODUCT_CATEGORY_LABELS, type ProductCategory } from "@/lib/products/types";
import type { Coupon } from "@/lib/coupons/types";
import CouponForm from "@/components/admin/coupons/CouponForm";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready" };

type FormMode = { kind: "closed" } | { kind: "create" } | { kind: "edit"; coupon: Coupon };

type CouponStatus = "active" | "scheduled" | "expired" | "disabled";

function couponStatus(coupon: Coupon, now: number = Date.now()): CouponStatus {
  if (!coupon.active) return "disabled";
  if (now < coupon.startDate) return "scheduled";
  if (now > coupon.endDate) return "expired";
  return "active";
}

function formatDiscount(coupon: Coupon): string {
  if (coupon.discountType === "percentage") {
    const cap = coupon.maxDiscount ? ` (up to ${formatInr(coupon.maxDiscount)})` : "";
    return `${coupon.value}% off${cap}`;
  }
  return `${formatInr(coupon.value)} off`;
}

function formatUsage(coupon: Coupon): string {
  if (!coupon.usageLimit && !coupon.perUserLimit) return "Unlimited";
  const parts: string[] = [];
  if (coupon.usageLimit) parts.push(`Limit ${coupon.usageLimit}`);
  if (coupon.perUserLimit) parts.push(`${coupon.perUserLimit}/user`);
  return parts.join(" · ");
}

function formatDateWindow(coupon: Coupon): string {
  const fmt = (ms: number) => new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(coupon.startDate)} – ${fmt(coupon.endDate)}`;
}

export function StatusBadge({ status }: { status: CouponStatus }) {
  const style =
    status === "active"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "scheduled"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : status === "expired"
          ? "bg-rose-50 text-rose-700 ring-rose-200"
          : "bg-nav-lavender-soft text-nav-amethyst-deep ring-nav-lavender-line";
  const label = status === "active" ? "Active" : status === "scheduled" ? "Scheduled" : status === "expired" ? "Expired" : "Disabled";
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium ring-1 ${style}`}>
      {label}
    </span>
  );
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [formMode, setFormMode] = useState<FormMode>({ kind: "closed" });
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await authedFetch("/api/admin/coupons");
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { coupons: Coupon[] };
      setCoupons(data.coupons.sort((a, b) => b.createdAt - a.createdAt));
      setState({ status: "ready" });
    } catch {
      setState({ status: "error", message: "We couldn't load coupons right now." });
    }
  }, []);

  useEffect(() => {
    // Deferred via queueMicrotask — see admin/orders/page.tsx's
    // identical comment (react-hooks/set-state-in-effect).
    queueMicrotask(() => load());
  }, [load]);

  function handleSaved(coupon: Coupon) {
    setCoupons((prev) => {
      const exists = prev.some((c) => c.code === coupon.code);
      const next = exists ? prev.map((c) => (c.code === coupon.code ? coupon : c)) : [coupon, ...prev];
      return next.sort((a, b) => b.createdAt - a.createdAt);
    });
    setFormMode({ kind: "closed" });
  }

  async function handleToggleActive(coupon: Coupon) {
    setActionError(null);
    setPendingCode(coupon.code);
    try {
      const res = await authedFetch(`/api/admin/coupons/${encodeURIComponent(coupon.code)}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !coupon.active }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setActionError((data && data.error) || "Couldn't update this coupon.");
        return;
      }
      const updated = data.coupon as Coupon;
      setCoupons((prev) => prev.map((c) => (c.code === updated.code ? updated : c)));
    } catch {
      setActionError("Network error — please try again.");
    } finally {
      setPendingCode(null);
    }
  }

  async function handleDelete(coupon: Coupon) {
    if (!window.confirm(`Delete coupon ${coupon.code}? This can't be undone.`)) return;
    setActionError(null);
    setPendingCode(coupon.code);
    try {
      const res = await authedFetch(`/api/admin/coupons/${encodeURIComponent(coupon.code)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setActionError((data && data.error) || "Couldn't delete this coupon.");
        return;
      }
      setCoupons((prev) => prev.filter((c) => c.code !== coupon.code));
    } catch {
      setActionError("Network error — please try again.");
    } finally {
      setPendingCode(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Coupons</h1>
          <p className="mt-1.5 text-sm text-nav-plum/70">Create and manage cart discount coupons.</p>
        </div>
        {formMode.kind === "closed" && (
          <button
            type="button"
            onClick={() => setFormMode({ kind: "create" })}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-nav-amethyst px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-nav-amethyst-deep"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Create Coupon
          </button>
        )}
      </header>

      {formMode.kind !== "closed" && (
        <div className="mb-6">
          <CouponForm
            mode={formMode.kind === "create" ? "create" : "edit"}
            initial={formMode.kind === "edit" ? formMode.coupon : undefined}
            onCancel={() => setFormMode({ kind: "closed" })}
            onSaved={handleSaved}
          />
        </div>
      )}

      {actionError && (
        <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {actionError}
        </p>
      )}

      {state.status === "loading" && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center"
        >
          <span className="h-8 w-8 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
          <p className="text-sm text-nav-plum/70">Loading coupons…</p>
        </div>
      )}

      {state.status === "error" && (
        <div role="alert" className="rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/80">
          {state.message}
        </div>
      )}

      {state.status === "ready" && coupons.length === 0 && (
        <p className="rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/70">
          No coupons yet — create one to get started.
        </p>
      )}

      {state.status === "ready" && coupons.length > 0 && (
        <>
          {/* Mobile: cards */}
          <ul className="flex flex-col gap-3 lg:hidden">
            {coupons.map((coupon) => (
              <li key={coupon.code}>
                <CouponCard
                  coupon={coupon}
                  busy={pendingCode === coupon.code}
                  onEdit={() => setFormMode({ kind: "edit", coupon })}
                  onToggleActive={() => handleToggleActive(coupon)}
                  onDelete={() => handleDelete(coupon)}
                />
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-nav-lavender-line bg-white lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-nav-lavender-line bg-nav-lavender-mist text-xs uppercase tracking-wide text-nav-plum/70">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3">Window</th>
                  <th className="px-4 py-3">Restriction</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.code} className="border-b border-nav-lavender-line/60 last:border-0">
                    <td className="px-4 py-3 font-medium text-nav-violet">
                      {coupon.code}
                      {coupon.description && <p className="mt-0.5 text-xs font-normal text-nav-plum/60">{coupon.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-nav-plum/80">{formatDiscount(coupon)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={couponStatus(coupon)} />
                    </td>
                    <td className="px-4 py-3 text-nav-plum/70">{formatUsage(coupon)}</td>
                    <td className="px-4 py-3 text-nav-plum/70">{formatDateWindow(coupon)}</td>
                    <td className="px-4 py-3">
                      <CategoryRestrictionTags categories={coupon.categoryRestriction} productCount={coupon.productRestriction?.length} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setFormMode({ kind: "edit", coupon })}
                          className="font-medium text-nav-amethyst-deep hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={pendingCode === coupon.code}
                          onClick={() => handleToggleActive(coupon)}
                          className="font-medium text-nav-plum/70 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {coupon.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          disabled={pendingCode === coupon.code}
                          onClick={() => handleDelete(coupon)}
                          className="font-medium text-rose-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function CategoryRestrictionTags({ categories, productCount }: { categories?: string[]; productCount?: number }) {
  if (!categories?.length && !productCount) {
    return <span className="text-xs text-nav-plum/50">Any</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {categories?.map((c) => (
        <span key={c} className="rounded-full bg-nav-lavender-mist px-2 py-0.5 text-[0.68rem] text-nav-plum/70">
          {PRODUCT_CATEGORY_LABELS[c as ProductCategory] ?? c}
        </span>
      ))}
      {productCount ? (
        <span className="rounded-full bg-nav-lavender-mist px-2 py-0.5 text-[0.68rem] text-nav-plum/70">
          {productCount} product{productCount === 1 ? "" : "s"}
        </span>
      ) : null}
    </div>
  );
}

function CouponCard({
  coupon,
  busy,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  coupon: Coupon;
  busy: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-nav-lavender-line bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-nav-violet">{coupon.code}</p>
          {coupon.description && <p className="mt-0.5 text-xs text-nav-plum/60">{coupon.description}</p>}
        </div>
        <StatusBadge status={couponStatus(coupon)} />
      </div>
      <p className="mt-2 text-sm font-semibold text-nav-amethyst-deep">{formatDiscount(coupon)}</p>
      <div className="mt-2 flex flex-wrap gap-1 text-xs text-nav-plum/60">
        <span className="rounded-full bg-nav-lavender-mist px-2 py-0.5">{formatUsage(coupon)}</span>
        <span className="rounded-full bg-nav-lavender-mist px-2 py-0.5">{formatDateWindow(coupon)}</span>
      </div>
      <div className="mt-2">
        <CategoryRestrictionTags categories={coupon.categoryRestriction} productCount={coupon.productRestriction?.length} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-nav-lavender-line pt-3">
        <button
          type="button"
          onClick={onEdit}
          className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-4 py-1.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onToggleActive}
          className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-4 py-1.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist disabled:cursor-not-allowed disabled:opacity-60"
        >
          {coupon.active ? "Deactivate" : "Activate"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-1.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
