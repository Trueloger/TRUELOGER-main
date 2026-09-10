"use client";

// src/components/cart/CouponSelector.tsx
// A real <select> dropdown (not a bare text-entry field) populated from
// /api/coupons/eligible — only coupons the current cart actually
// qualifies for are shown. Controlled: the parent owns the selected
// code and re-fetches its own pricing preview whenever `onChange`
// fires (see PriceBreakdown.tsx). Works signed-in or signed-out — the
// eligible endpoint is public; per-user usage-limit filtering only
// kicks in once a user is signed in (handled server-side).
import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
import type { CartItem } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { formatInr } from "@/lib/consultation/pricing";
import { cartItemsToCategoriesAndProductIds } from "./cartLines";

type EligibleCoupon = {
  code: string;
  discountType: "percentage" | "fixed";
  value: number;
  maxDiscount?: number;
  description?: string;
};

function couponLabel(c: EligibleCoupon): string {
  const amount = c.discountType === "percentage" ? `${c.value}% off` : `${formatInr(c.value)} off`;
  return c.description ? `${c.code} — ${c.description} (${amount})` : `${c.code} — ${amount}`;
}

export function CouponSelector({
  items,
  subtotal,
  value,
  onChange,
}: {
  items: CartItem[];
  subtotal: number;
  value: string;
  onChange: (code: string) => void;
}) {
  const { currentUser } = useAuth();
  const [coupons, setCoupons] = useState<EligibleCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Serialize the parts of `items` eligibility actually depends on so
  // the effect doesn't re-fire on every unrelated cart re-render (e.g.
  // the drawer opening) — only when what's being bought actually
  // changes.
  const { categories, productIds } = cartItemsToCategoriesAndProductIds(items);
  const depKey = JSON.stringify({ categories, productIds, subtotal, signedIn: !!currentUser });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (items.length === 0) {
        if (cancelled) return;
        setCoupons([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const body = JSON.stringify({ subtotal, categories, productIds });
        const res = currentUser
          ? await authedFetch("/api/coupons/eligible", { method: "POST", body })
          : await fetch("/api/coupons/eligible", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body,
            });
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setError((data && data.error) || "Couldn't load coupons.");
          setCoupons([]);
          return;
        }
        setCoupons(Array.isArray(data?.coupons) ? data.coupons : []);
      } catch {
        if (!cancelled) {
          setError("Couldn't load coupons.");
          setCoupons([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey, items.length, currentUser]);

  // A coupon that's no longer in the eligible list (cart changed under
  // it) is silently deselected so the preview falls back to "no
  // coupon" instead of repeatedly failing server-side.
  useEffect(() => {
    if (!value || loading) return;
    if (!coupons.some((c) => c.code === value)) onChange("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupons, loading]);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="cart-coupon-select" className="flex items-center gap-1.5 text-xs font-medium text-nav-plum">
        <Tag className="h-4 w-4" aria-hidden="true" />
        Coupon
      </label>
      <select
        id="cart-coupon-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || coupons.length === 0}
        className="w-full rounded-lg border border-nav-lavender-line bg-white px-3 py-2 text-sm text-nav-violet disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst"
      >
        <option value="">No coupon</option>
        {coupons.map((c) => (
          <option key={c.code} value={c.code}>
            {couponLabel(c)}
          </option>
        ))}
      </select>
      {loading && <p className="text-xs text-nav-plum/70">Checking available coupons…</p>}
      {!loading && !error && coupons.length === 0 && (
        <p className="text-xs text-nav-plum/70">No coupons available right now.</p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
