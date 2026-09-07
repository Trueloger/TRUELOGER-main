"use client";

// On-page Ratti selector + live price + Add to Cart for a gemstone
// product subpage (src/app/gemstones/[slug]/page.tsx). Distinct from
// the OTHER agent's RattiSheet.tsx modal (used for the direct-add-to-
// cart flow from a /gemstones card) — this one renders inline since the
// subpage already gives the selector its own dedicated section, so a
// second modal on top of it would be redundant (same precedent as
// ServiceDurationPicker.tsx vs. DurationSheet.tsx on /consult).
//
// Owns the live price display too (not just the buttons) so the "select
// Ratti -> price updates immediately" requirement has one shared piece
// of state instead of two components drifting out of sync.
//
// Always resolves the final add-to-cart price via POST
// /api/gemstones/validate (server-owned pricing authority) rather than
// trusting the client-computed display price — see the doc comment on
// that route.
import { useState } from "react";
import type { GemstoneProduct } from "@/lib/gemstones/types";
import { gemstoneVariantId } from "@/lib/gemstones/types";
import { getGemstonePrice, formatInr, DEFAULT_DELIVERY_ESTIMATE } from "@/lib/gemstones/pricing";
import { useCart } from "@/context/CartContext";

export function GemstoneRattiSelector({ product }: { product: GemstoneProduct }) {
  const { addItem } = useCart();
  const [selectedRatti, setSelectedRatti] = useState<number>(product.defaultRatti);
  const [status, setStatus] = useState<"idle" | "loading" | "added" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const price = getGemstonePrice(product.pricing, selectedRatti);
  const selectedEntry = product.pricing[selectedRatti];
  const outOfStock = selectedEntry?.inStock === false;

  function chooseRatti(ratti: number) {
    setSelectedRatti(ratti);
    setStatus("idle");
    setErrorMessage(null);
  }

  async function handleAddToCart() {
    if (outOfStock) return;
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/gemstones/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, ratti: selectedRatti }),
      });
      const data = (await res.json()) as
        | { productId: string; productName: string; ratti: number; mrp: number; salePrice: number; discountPercent: number }
        | { error: string };
      if (!res.ok || "error" in data) {
        const message = "error" in data ? data.error : "Could not add this to your cart.";
        setStatus("error");
        setErrorMessage(message);
        return;
      }
      addItem({
        id: gemstoneVariantId(data.productId, data.ratti),
        name: product.name,
        price: data.salePrice,
        type: "gemstone",
        meta: {
          productId: data.productId,
          productName: data.productName,
          ratti: data.ratti,
        },
      });
      setStatus("added");
      window.setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("error");
      setErrorMessage("Network error — please try again.");
    }
  }

  return (
    <div className="rounded-2xl border border-nav-lavender-line bg-nav-pearl p-5 sm:p-6">
      <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">Choose your weight</h2>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {product.rattiOptions.map((ratti) => {
          const entry = product.pricing[ratti];
          const disabled = entry?.inStock === false;
          const active = !disabled && selectedRatti === ratti;
          return (
            <button
              key={ratti}
              type="button"
              onClick={() => !disabled && chooseRatti(ratti)}
              disabled={disabled}
              aria-pressed={active}
              className={`flex min-h-[44px] flex-col items-center justify-center rounded-xl border px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${
                disabled
                  ? "cursor-not-allowed border-nav-lavender-line bg-nav-lavender-mist/40 text-nav-plum/40"
                  : active
                    ? "border-nav-amethyst bg-nav-amethyst text-white"
                    : "border-nav-lavender-line bg-white text-nav-plum hover:bg-nav-lavender-soft"
              }`}
            >
              <span>{ratti} Ratti</span>
              {disabled ? (
                <span className="text-[11px] font-normal">Out of Stock</span>
              ) : entry ? (
                <span
                  className={`text-[11px] font-normal ${active ? "text-white/85" : "text-nav-plum/60"}`}
                >
                  {formatInr(entry.salePrice)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-nav-lavender-line pt-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-nav-plum/60">Price</p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
            <span className="font-serif text-2xl text-nav-amethyst-deep">
              {formatInr(price.salePrice)}
            </span>
            {price.discountPercent > 0 && (
              <>
                <span className="text-sm text-nav-plum/50 line-through">
                  {formatInr(price.mrp)}
                </span>
                <span className="rounded-full bg-nav-gold/20 px-2 py-0.5 text-xs font-medium text-nav-amethyst-deep">
                  {price.discountPercent}% OFF
                </span>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock || status === "loading"}
          className="flex min-h-[44px] min-w-[160px] items-center justify-center rounded-full bg-nav-amethyst px-6 text-sm font-medium text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {outOfStock
            ? "Out of Stock"
            : status === "loading"
              ? "Adding…"
              : status === "added"
                ? "Added ✓"
                : "Add to Cart"}
        </button>
      </div>

      <p className="mt-4 text-xs text-nav-plum/60">
        Estimated Delivery: {product.deliveryEstimate ?? DEFAULT_DELIVERY_ESTIMATE}
      </p>

      {status === "error" && errorMessage && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
