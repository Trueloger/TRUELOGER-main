"use client";

// src/app/checkout/page.tsx
// Real Cashfree checkout. Requires sign-in (per "require login before
// checkout" — the cart itself survives login/signup since CartContext
// is just in-memory React state untouched by auth, so nothing is lost
// redirecting through /login). Flow: read cart -> build {category,
// productId|serviceId, ratti|duration, quantity} HINTS only (never a
// price) -> POST /api/payments/create-order (server re-prices
// authoritatively and creates the internal order + Cashfree order) ->
// open Cashfree's hosted checkout with the returned paymentSessionId.
import { useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { useCart, type CartItem } from "@/context/CartContext";
import { formatInr } from "@/lib/consultation/pricing";
import { useAuth } from "@/context/AuthContext";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { CouponSelector } from "@/components/cart/CouponSelector";
import { PriceBreakdown } from "@/components/cart/PriceBreakdown";
import { cartItemToLineHint } from "@/components/cart/cartLines";
import { PurchaseGateModal, type PurchaseGateReason } from "@/components/auth/PurchaseGateModal";
import type { CartPricingResult } from "@/lib/pricing/calculate";

declare global {
  interface Window {
    Cashfree?: (config: { mode: "sandbox" | "production" }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget?: "_self" | "_modal" | "_blank" }) => void;
    };
  }
}

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const { currentUser, isProfileComplete, loading } = useAuth();
  const [sdkReady, setSdkReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [pricing, setPricing] = useState<CartPricingResult | null>(null);
  const [gateDismissed, setGateDismissed] = useState(false);
  const paying = useRef(false); // guards against a double-click firing two payment attempts

  // Landing on /checkout directly by URL (not via the cart drawer's own
  // gate — see CartDrawer.tsx) bypassing sign-in/profile-completion:
  // show the same modal in-page instead of a silent hard redirect, so
  // the reason is always explained, never just a surprise bounce to
  // /login. The gate reason is derived, not stored separately, so it
  // always reflects the live auth/profile state.
  const gateReason: PurchaseGateReason | null = loading
    ? null
    : !currentUser
      ? "signed-out"
      : !isProfileComplete
        ? "profile-incomplete"
        : null;

  async function handlePay() {
    if (paying.current) return; // ignore a second click while the first request is in flight
    paying.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const lines = items.map(cartItemToLineHint).filter((l): l is NonNullable<typeof l> => l !== null);
      if (lines.length === 0) {
        setError("Nothing in your cart can be checked out right now.");
        return;
      }

      const res = await authedFetch("/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify({ lines, couponCode: couponCode || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.paymentSessionId) {
        setError((data && data.error) || "Unable to start payment. Please try again.");
        return;
      }

      if (!sdkReady || !window.Cashfree) {
        setError("Payment is still loading — please try again in a moment.");
        return;
      }

      const cashfree = window.Cashfree({ mode: data.mode === "production" ? "production" : "sandbox" });
      cashfree.checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: "_self" });
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(false);
      paying.current = false;
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-nav-ivory">
        <p className="text-sm text-nav-plum/70">Loading…</p>
      </main>
    );
  }

  if (gateReason) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-nav-ivory px-6 text-center">
        <h1 className="font-serif text-2xl font-semibold text-nav-amethyst-deep">
          {gateReason === "signed-out" ? "Sign in to check out" : "Complete your profile to check out"}
        </h1>
        <p className="max-w-sm text-sm text-nav-plum/80">
          Your cart is saved — it will still be here once you are signed in
          {gateReason === "profile-incomplete" ? " with a complete profile" : ""}.
        </p>
        {gateDismissed && (
          <button
            type="button"
            onClick={() => setGateDismissed(false)}
            className="rounded-full border border-nav-lavender-line bg-nav-pearl px-5 py-2.5 text-sm font-medium text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-mist"
          >
            {gateReason === "signed-out" ? "Sign In / Sign Up" : "Complete Profile"}
          </button>
        )}
        <PurchaseGateModal
          reason={gateReason}
          open={!gateDismissed}
          onClose={() => setGateDismissed(true)}
          redirectTo="/checkout"
        />
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-4 bg-nav-ivory px-6 text-center">
        <h1 className="font-serif text-2xl font-semibold text-nav-amethyst-deep">
          Your cart is empty
        </h1>
        <p className="text-sm text-nav-plum">
          Add a consultation or product to your cart before checking out.
        </p>
        <Link
          href="/consult"
          className="rounded-full border border-nav-lavender-line bg-nav-pearl px-5 py-2.5 text-sm font-medium text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl"
        >
          Browse Consultations
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] w-full bg-nav-ivory px-6 py-10">
      <div className="mx-auto w-full max-w-2xl">
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        onLoad={() => setSdkReady(true)}
      />

      <h1 className="mb-6 font-serif text-2xl font-semibold text-nav-amethyst-deep">
        Checkout Summary
      </h1>

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <CheckoutLineRow key={item.id} item={item} />
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-4 rounded-xl border border-nav-lavender-line bg-nav-pearl px-5 py-4">
        <CouponSelector items={items} subtotal={subtotal} value={couponCode} onChange={setCouponCode} />
        <div className="border-t border-nav-lavender-line pt-4">
          <PriceBreakdown items={items} couponCode={couponCode || undefined} onPricingResolved={setPricing} />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={submitting || !pricing}
        className="mt-6 flex w-full items-center justify-center rounded-full bg-nav-amethyst px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl"
      >
        {submitting ? "Starting payment…" : "Pay Securely"}
      </button>
      <p className="mt-2 text-center text-xs text-nav-plum">
        Secured by Cashfree. You will be redirected to complete your payment.
      </p>
      </div>
    </main>
  );
}

function CheckoutLineRow({ item }: { item: CartItem }) {
  const isConsultation = item.type === "consultation";
  const isGemstone = item.type === "gemstone";
  const consultMeta = isConsultation
    ? (item.meta as { serviceName: string; duration: number; preferredDate?: string; preferredTime?: string } | undefined)
    : undefined;
  const gemstoneMeta = isGemstone ? (item.meta as { productName: string; ratti: number } | undefined) : undefined;

  return (
    <li className="flex items-start justify-between gap-3 rounded-xl border border-nav-lavender-line bg-nav-pearl px-4 py-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-nav-violet">
          {consultMeta?.serviceName ?? gemstoneMeta?.productName ?? item.name}
        </span>
        {consultMeta && (
          <span className="text-xs text-nav-plum">
            {consultMeta.duration} min
            {consultMeta.preferredDate && consultMeta.preferredTime && (
              <> · {formatConsultDateTime(consultMeta.preferredDate, consultMeta.preferredTime)}</>
            )}
          </span>
        )}
        {gemstoneMeta && <span className="text-xs text-nav-plum">{gemstoneMeta.ratti} Ratti</span>}
        <span className="text-xs text-nav-plum">Qty: {item.quantity}</span>
      </div>
      {typeof item.price === "number" && (
        <span className="shrink-0 text-sm font-semibold text-nav-amethyst-deep">
          {formatInr(item.price * item.quantity)}
        </span>
      )}
    </li>
  );
}

/** Mirrors src/components/cart/CartDrawer.tsx's identical helper —
 * "18 September 2026, 4:30 PM" from the stored "YYYY-MM-DD"/"HH:mm"
 * cart-meta strings. */
function formatConsultDateTime(date: string, time: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const d = new Date(year, (month ?? 1) - 1, day, hour, minute);
  const datePart = d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const timePart = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${datePart}, ${timePart}`;
}
