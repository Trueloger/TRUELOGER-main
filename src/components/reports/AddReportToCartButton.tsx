"use client";

// src/components/reports/AddReportToCartButton.tsx
// Client island for the report product-detail page's "Add to Cart"
// action — the page itself is a Server Component (getReportProduct is
// Admin-SDK/server-only), but cart + auth state are client-only, so
// this one small piece is split out, taking the already-resolved
// ReportProduct as a prop. Mirrors the gate-check pattern in
// CartDrawer.tsx's handleCheckoutClick and the justAdded confirmation
// flash in GemstoneCard.tsx.
import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { PurchaseGateModal, type PurchaseGateReason } from "@/components/auth/PurchaseGateModal";
import type { ReportProduct } from "@/lib/reports/types";

export function AddReportToCartButton({ product }: { product: ReportProduct }) {
  const { addItem, openCart } = useCart();
  const { isAuthenticated, isProfileComplete, loading: authLoading } = useAuth();
  const [gateReason, setGateReason] = useState<PurchaseGateReason | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  function handleClick() {
    // Auth state is still loading — ignore the click rather than
    // gating on a guess; the button re-renders correctly the instant
    // loading resolves.
    if (authLoading) return;

    if (!isAuthenticated) {
      setGateReason("signed-out");
      return;
    }
    if (!isProfileComplete) {
      setGateReason("profile-incomplete");
      return;
    }

    addItem({
      id: product.slug,
      name: product.name,
      price: product.salePrice,
      type: "report",
      meta: { reportSlug: product.slug, reportName: product.name },
    });
    openCart();
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-nav-amethyst px-5 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep active:scale-[0.98] sm:flex-none sm:px-8"
      >
        {justAdded ? (
          <>
            <Check className="h-4 w-4" aria-hidden="true" />
            Added ✓
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            Add to Cart
          </>
        )}
      </button>

      {gateReason && (
        <PurchaseGateModal
          reason={gateReason}
          open={true}
          onClose={() => setGateReason(null)}
          redirectTo={`/reports/personalized/${product.slug}`}
        />
      )}
    </>
  );
}
