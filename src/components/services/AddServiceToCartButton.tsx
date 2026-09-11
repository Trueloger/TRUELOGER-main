"use client";

// src/components/services/AddServiceToCartButton.tsx
// Shared "Add to Cart" client island for Healing / Puja / Course
// product-detail pages — mirrors AddReportToCartButton's structure but
// simpler: no profile-completeness gate (these purchases don't need
// birth-data), the resolve-cart server route enforces the real rules
// at checkout regardless of what the client sends.
import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { ServiceProduct } from "@/lib/services/types";

export function AddServiceToCartButton({ product }: { product: ServiceProduct }) {
  const { addItem, openCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  function handleClick() {
    addItem({
      id: `${product.category}__${product.slug}`,
      name: product.name,
      price: product.salePrice,
      type: "service",
      meta: { category: product.category as "healing" | "puja" | "course", productId: product.slug, productName: product.name },
    });
    openCart();
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2000);
  }

  return (
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
  );
}
