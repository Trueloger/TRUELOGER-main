"use client";

// src/components/cart/PriceBreakdown.tsx
// Full itemized, server-authoritative price breakdown. Fetches
// /api/coupons/preview with {lines, couponCode} on every cart-contents
// or coupon change and renders exactly what the server computed —
// never a client-side guess at subtotal/discount/tax/total. Used by
// both the cart drawer and checkout (same POST body shape create-order
// itself accepts, per resolve-cart.ts's CartLineHint).
import { useEffect, useState, type ReactNode } from "react";
import { Receipt, Tag, BadgePercent, Truck, PercentCircle } from "lucide-react";
import type { CartItem } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { formatInr } from "@/lib/consultation/pricing";
import { cartItemsToLines } from "./cartLines";
import type { CartPricingResult } from "@/lib/pricing/calculate";

export function PriceBreakdown({
  items,
  couponCode,
  onPricingResolved,
}: {
  items: CartItem[];
  couponCode?: string;
  onPricingResolved?: (pricing: CartPricingResult | null) => void;
}) {
  const { currentUser } = useAuth();
  const [pricing, setPricing] = useState<CartPricingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lines = cartItemsToLines(items);
  const linesKey = JSON.stringify(lines);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (lines.length === 0) {
        if (cancelled) return;
        setPricing(null);
        setLoading(false);
        onPricingResolved?.(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const body = JSON.stringify({ lines, couponCode: couponCode || undefined });
        const res = currentUser
          ? await authedFetch("/api/coupons/preview", { method: "POST", body })
          : await fetch("/api/coupons/preview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body,
            });
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setError((data && data.error) || "Couldn't calculate pricing.");
          setPricing(null);
          onPricingResolved?.(null);
          return;
        }
        setPricing(data.pricing ?? null);
        onPricingResolved?.(data.pricing ?? null);
      } catch {
        if (!cancelled) {
          setError("Network error while pricing your cart.");
          setPricing(null);
          onPricingResolved?.(null);
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
  }, [linesKey, couponCode, currentUser]);

  if (loading && !pricing) {
    return <p className="text-xs text-nav-plum/70">Calculating price…</p>;
  }

  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
        {error}
      </p>
    );
  }

  if (!pricing) return null;

  return (
    <div className="flex flex-col gap-2 text-sm">
      <Row icon={<Receipt className="h-4 w-4" aria-hidden="true" />} label="Subtotal" value={formatInr(pricing.subtotal)} />

      {pricing.productDiscount > 0 && (
        <Row
          icon={<BadgePercent className="h-4 w-4" aria-hidden="true" />}
          label="Product Discount"
          value={`-${formatInr(pricing.productDiscount)}`}
          tone="positive"
        />
      )}

      {pricing.couponDiscount > 0 && (
        <Row
          icon={<Tag className="h-4 w-4" aria-hidden="true" />}
          label={pricing.couponCode ? `Coupon (${pricing.couponCode})` : "Coupon Discount"}
          value={`-${formatInr(pricing.couponDiscount)}`}
          tone="positive"
        />
      )}

      <Row
        icon={<Truck className="h-4 w-4" aria-hidden="true" />}
        label="Delivery"
        value={pricing.deliveryFee > 0 ? formatInr(pricing.deliveryFee) : "Free"}
      />

      <Row
        icon={<PercentCircle className="h-4 w-4" aria-hidden="true" />}
        label={pricing.taxBreakdown.length > 0 ? `GST (${pricing.taxBreakdown.map((t) => `${t.ratePercent}%`).join(", ")})` : "GST"}
        value={formatInr(pricing.tax)}
      />

      {pricing.couponError && (
        <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {pricing.couponError}
        </p>
      )}

      <div className="mt-1 flex items-center justify-between border-t border-nav-lavender-line pt-2">
        <span className="text-sm font-semibold text-nav-plum">Total</span>
        <span className="font-serif text-lg font-semibold text-nav-amethyst-deep">{formatInr(pricing.total)}</span>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "positive";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-xs text-nav-plum">
        {icon}
        {label}
      </span>
      <span className={`text-xs font-medium ${tone === "positive" ? "text-emerald-700" : "text-nav-violet"}`}>
        {value}
      </span>
    </div>
  );
}
