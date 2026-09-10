"use client";

// src/components/admin/coupons/CouponForm.tsx
// Create/edit form for a single coupon. Shared by both flows: in
// "create" mode `initial` is omitted and the code field is editable
// (normalized client-side, but the server — normalizeCouponCode via
// createCoupon — is the real authority); in "edit" mode `initial` is
// the coupon being edited, the code field is locked (the code IS the
// Firestore doc id — PATCH /api/admin/coupons/[code] updates fields on
// that doc, it doesn't rename it), and its date/number fields are
// pre-filled from the real Coupon.
import { useState } from "react";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from "@/lib/products/types";
import { normalizeCouponCode, type Coupon, type CouponDiscountType } from "@/lib/coupons/types";

type CouponFormProps = {
  mode: "create" | "edit";
  initial?: Coupon;
  onCancel: () => void;
  onSaved: (coupon: Coupon) => void;
};

function msToLocalInput(ms: number | undefined): string {
  if (!ms) return "";
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToMs(value: string): number | undefined {
  if (!value) return undefined;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

type FieldState = {
  code: string;
  discountType: CouponDiscountType;
  value: string;
  maxDiscount: string;
  minCartValue: string;
  startDate: string;
  endDate: string;
  usageLimit: string;
  perUserLimit: string;
  categoryRestriction: string[];
  productRestriction: string; // comma-separated product ids
  active: boolean;
  description: string;
};

function initialState(initial?: Coupon): FieldState {
  if (!initial) {
    const now = new Date();
    const inAMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return {
      code: "",
      discountType: "percentage",
      value: "",
      maxDiscount: "",
      minCartValue: "",
      startDate: msToLocalInput(now.getTime()),
      endDate: msToLocalInput(inAMonth.getTime()),
      usageLimit: "",
      perUserLimit: "",
      categoryRestriction: [],
      productRestriction: "",
      active: true,
      description: "",
    };
  }
  return {
    code: initial.code,
    discountType: initial.discountType,
    value: String(initial.value),
    maxDiscount: initial.maxDiscount != null ? String(initial.maxDiscount) : "",
    minCartValue: initial.minCartValue != null ? String(initial.minCartValue) : "",
    startDate: msToLocalInput(initial.startDate),
    endDate: msToLocalInput(initial.endDate),
    usageLimit: initial.usageLimit != null ? String(initial.usageLimit) : "",
    perUserLimit: initial.perUserLimit != null ? String(initial.perUserLimit) : "",
    categoryRestriction: initial.categoryRestriction ?? [],
    productRestriction: initial.productRestriction?.join(", ") ?? "",
    active: initial.active,
    description: initial.description ?? "",
  };
}

const inputClass =
  "w-full min-h-11 rounded-xl border border-nav-lavender-line bg-white px-3.5 py-2 text-sm text-nav-violet outline-none focus:border-nav-amethyst focus:ring-2 focus:ring-nav-amethyst/30";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-nav-plum/60";

export default function CouponForm({ mode, initial, onCancel, onSaved }: CouponFormProps) {
  const [fields, setFields] = useState<FieldState>(() => initialState(initial));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FieldState>(key: K, value: FieldState[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCategory(cat: string) {
    setFields((prev) => ({
      ...prev,
      categoryRestriction: prev.categoryRestriction.includes(cat)
        ? prev.categoryRestriction.filter((c) => c !== cat)
        : [...prev.categoryRestriction, cat],
    }));
  }

  function validate(): string | null {
    if (!fields.code.trim()) return "Coupon code is required.";
    const value = Number(fields.value);
    if (!fields.value || Number.isNaN(value) || value <= 0) return "Discount value must be a positive number.";
    if (fields.discountType === "percentage" && value > 100) return "Percentage discount cannot exceed 100.";
    if (fields.maxDiscount) {
      const maxDiscount = Number(fields.maxDiscount);
      if (Number.isNaN(maxDiscount) || maxDiscount <= 0) return "Max discount cap must be a positive number.";
    }
    if (fields.minCartValue) {
      const minCartValue = Number(fields.minCartValue);
      if (Number.isNaN(minCartValue) || minCartValue < 0) return "Minimum cart value can't be negative.";
    }
    if (!fields.startDate || !fields.endDate) return "Both a start and expiry date are required.";
    const startMs = localInputToMs(fields.startDate);
    const endMs = localInputToMs(fields.endDate);
    if (startMs == null || endMs == null) return "Invalid date.";
    if (endMs <= startMs) return "Expiry date must be after the start date.";
    if (fields.usageLimit) {
      const usageLimit = Number(fields.usageLimit);
      if (Number.isNaN(usageLimit) || usageLimit <= 0 || !Number.isInteger(usageLimit)) {
        return "Usage limit must be a positive whole number.";
      }
    }
    if (fields.perUserLimit) {
      const perUserLimit = Number(fields.perUserLimit);
      if (Number.isNaN(perUserLimit) || perUserLimit <= 0 || !Number.isInteger(perUserLimit)) {
        return "Per-user limit must be a positive whole number.";
      }
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const productRestriction = fields.productRestriction
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const payload = {
      code: normalizeCouponCode(fields.code),
      discountType: fields.discountType,
      value: Number(fields.value),
      maxDiscount: fields.maxDiscount ? Number(fields.maxDiscount) : undefined,
      minCartValue: fields.minCartValue ? Number(fields.minCartValue) : undefined,
      startDate: localInputToMs(fields.startDate),
      endDate: localInputToMs(fields.endDate),
      usageLimit: fields.usageLimit ? Number(fields.usageLimit) : undefined,
      perUserLimit: fields.perUserLimit ? Number(fields.perUserLimit) : undefined,
      categoryRestriction: fields.categoryRestriction.length ? fields.categoryRestriction : undefined,
      productRestriction: productRestriction.length ? productRestriction : undefined,
      active: fields.active,
      description: fields.description.trim() || undefined,
    };

    setSubmitting(true);
    try {
      const res =
        mode === "create"
          ? await authedFetch("/api/admin/coupons", { method: "POST", body: JSON.stringify(payload) })
          : await authedFetch(`/api/admin/coupons/${encodeURIComponent(fields.code)}`, {
              method: "PATCH",
              body: JSON.stringify(payload),
            });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data && data.error) || "Something went wrong saving this coupon.");
        return;
      }
      onSaved(data.coupon as Coupon);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-nav-lavender-line bg-white p-4 sm:p-5"
    >
      <h2 className="mb-4 font-serif text-lg text-nav-violet">
        {mode === "create" ? "Create Coupon" : `Edit ${fields.code}`}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="coupon-code" className={labelClass}>
            Code
          </label>
          <input
            id="coupon-code"
            type="text"
            value={fields.code}
            disabled={mode === "edit"}
            onChange={(e) => update("code", e.target.value.toUpperCase())}
            placeholder="SAVE20"
            className={`${inputClass} uppercase disabled:cursor-not-allowed disabled:bg-nav-lavender-mist disabled:text-nav-plum/60`}
          />
        </div>

        <div>
          <label htmlFor="coupon-discount-type" className={labelClass}>
            Discount Type
          </label>
          <select
            id="coupon-discount-type"
            value={fields.discountType}
            onChange={(e) => update("discountType", e.target.value as CouponDiscountType)}
            className={inputClass}
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount (₹)</option>
          </select>
        </div>

        <div>
          <label htmlFor="coupon-value" className={labelClass}>
            {fields.discountType === "percentage" ? "Percentage Off (1-100)" : "Amount Off (₹)"}
          </label>
          <input
            id="coupon-value"
            type="number"
            min={0}
            value={fields.value}
            onChange={(e) => update("value", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="coupon-max-discount" className={labelClass}>
            Max Discount Cap (₹, optional{fields.discountType === "fixed" ? " — ignored for fixed coupons" : ""})
          </label>
          <input
            id="coupon-max-discount"
            type="number"
            min={0}
            value={fields.maxDiscount}
            onChange={(e) => update("maxDiscount", e.target.value)}
            disabled={fields.discountType === "fixed"}
            className={`${inputClass} disabled:cursor-not-allowed disabled:bg-nav-lavender-mist disabled:text-nav-plum/60`}
          />
        </div>

        <div>
          <label htmlFor="coupon-min-cart" className={labelClass}>
            Minimum Cart Value (₹, optional)
          </label>
          <input
            id="coupon-min-cart"
            type="number"
            min={0}
            value={fields.minCartValue}
            onChange={(e) => update("minCartValue", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex items-end">
          <label className="flex min-h-11 w-full items-center justify-between rounded-xl border border-nav-lavender-line bg-white px-3.5 py-2">
            <span className="text-sm font-medium text-nav-violet">Active</span>
            <input
              type="checkbox"
              checked={fields.active}
              onChange={(e) => update("active", e.target.checked)}
              className="h-5 w-5 accent-nav-amethyst"
            />
          </label>
        </div>

        <div>
          <label htmlFor="coupon-start" className={labelClass}>
            Starts
          </label>
          <input
            id="coupon-start"
            type="datetime-local"
            value={fields.startDate}
            onChange={(e) => update("startDate", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="coupon-end" className={labelClass}>
            Expires
          </label>
          <input
            id="coupon-end"
            type="datetime-local"
            value={fields.endDate}
            onChange={(e) => update("endDate", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="coupon-usage-limit" className={labelClass}>
            Total Usage Limit (optional)
          </label>
          <input
            id="coupon-usage-limit"
            type="number"
            min={1}
            step={1}
            value={fields.usageLimit}
            onChange={(e) => update("usageLimit", e.target.value)}
            placeholder="Unlimited"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="coupon-per-user-limit" className={labelClass}>
            Per-User Limit (optional)
          </label>
          <input
            id="coupon-per-user-limit"
            type="number"
            min={1}
            step={1}
            value={fields.perUserLimit}
            onChange={(e) => update("perUserLimit", e.target.value)}
            placeholder="Unlimited"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="coupon-description" className={labelClass}>
            Description (optional — shown in the cart&apos;s coupon list)
          </label>
          <input
            id="coupon-description"
            type="text"
            value={fields.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="20% off gemstones"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <span className={labelClass}>Category Restriction (optional — applies to any category if none selected)</span>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.map((cat) => {
              const selected = fields.categoryRestriction.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150 ${
                    selected
                      ? "bg-nav-amethyst text-white"
                      : "bg-nav-lavender-mist text-nav-plum/80 hover:bg-nav-lavender-soft"
                  }`}
                >
                  {PRODUCT_CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="coupon-product-restriction" className={labelClass}>
            Product Restriction (optional — comma-separated product ids)
          </label>
          <input
            id="coupon-product-restriction"
            type="text"
            value={fields.productRestriction}
            onChange={(e) => update("productRestriction", e.target.value)}
            placeholder="prod_abc123, prod_def456"
            className={inputClass}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-nav-amethyst-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving…" : mode === "create" ? "Create Coupon" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="flex min-h-11 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-6 py-2.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
