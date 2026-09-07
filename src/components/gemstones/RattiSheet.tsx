"use client";

// src/components/gemstones/RattiSheet.tsx
// Shared Ratti-selection modal/bottom-sheet used by the direct
// "Add to Cart" flow on a GemstoneCard (see GemstoneCard.tsx). Direct
// structural copy of src/components/consult/DurationSheet.tsx — same
// portal/scroll-lock/focus/Escape/backdrop handling — adapted for a
// fixed, product-specific list of Ratti options instead of a
// continuous/custom duration range (no "Custom" option here: Ratti is
// always one of `product.rattiOptions`).
//
// CRITICAL: this sheet is triggered from inside GemstoneCard, which
// (matching this site's card convention) carries a hover-only CSS
// transform. ANY transform on an ancestor — even hover-only — creates a
// new containing block for `position: fixed` descendants, so a fixed
// sheet rendered inline inside the card would get trapped inside the
// card's own small box instead of the viewport (confirmed bug, now
// fixed, in DurationSheet.tsx's history). Portaling straight to
// document.body sidesteps this entirely — do not remove the portal.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GemstoneProduct, RattiValue } from "@/lib/gemstones/types";
import { rattiToCarat, gemstoneVariantId } from "@/lib/gemstones/types";
import { getGemstonePrice, formatInr } from "@/lib/gemstones/pricing";
import { useCart } from "@/context/CartContext";

type RattiSheetProps = {
  product: GemstoneProduct;
  open: boolean;
  onClose: () => void;
  onConfirm: (ratti: RattiValue, salePrice: number) => void;
};

export function RattiSheet({ product, open, onClose, onConfirm }: RattiSheetProps) {
  const { addItem } = useCart();
  const [selection, setSelection] = useState<RattiValue>(product.defaultRatti);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<Element | null>(null);

  // Reset transient state whenever the sheet transitions from closed to
  // open — same pattern as DurationSheet.tsx (adjust state during
  // render rather than in an effect, to avoid an extra render pass).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSelection(product.defaultRatti);
      setError(null);
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  const canConfirm = !submitting;

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/gemstones/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, ratti: selection }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || typeof data.salePrice !== "number") {
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Something went wrong confirming this weight. Please try again.",
        );
        setSubmitting(false);
        return;
      }

      const confirmedRatti: RattiValue = data.ratti ?? selection;

      addItem({
        id: gemstoneVariantId(product.id, confirmedRatti),
        name: product.name,
        price: data.salePrice,
        type: "gemstone",
        meta: {
          productId: product.id,
          productName: product.name,
          ratti: confirmedRatti,
        },
      });

      onConfirm(confirmedRatti, data.salePrice);
      onClose();
    } catch {
      setError("Network error — please check your connection and try again.");
      setSubmitting(false);
    }
  }

  // Portaled straight into document.body — see the file-level comment
  // above for why this is required, not optional.
  return createPortal(
    <div className="fixed inset-0 z-[70]">
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close dialog overlay"
        onClick={onClose}
        className="absolute inset-0 bg-nav-violet/35 backdrop-blur-[1px]"
      />

      {/* panel — bottom sheet on mobile, centered modal from sm up */}
      <div
        id="ratti-sheet-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ratti-sheet-heading"
        className="absolute inset-x-0 bottom-0 flex max-h-[90vh] w-full flex-col rounded-t-3xl border border-nav-lavender-line bg-nav-pearl shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85vh] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
        style={{
          backgroundImage:
            "radial-gradient(circle at 100% 0%, rgba(164,128,207,0.10), transparent 55%)",
        }}
      >
        {/* header */}
        <div className="flex shrink-0 items-center justify-between border-b border-nav-lavender-line px-5 py-4">
          <h2 id="ratti-sheet-heading" className="font-serif text-lg text-nav-violet">
            Choose Gemstone Weight
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-soft"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-sm text-nav-plum/75">
            {product.name} — pick a Ratti weight. Prices update instantly.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            {product.rattiOptions.map((ratti) => {
              const selected = selection === ratti;
              const price = getGemstonePrice(product.pricing, ratti);
              const outOfStock = product.pricing[ratti]?.inStock === false;
              return (
                <button
                  key={ratti}
                  type="button"
                  onClick={() => setSelection(ratti)}
                  disabled={outOfStock}
                  aria-pressed={selected}
                  className={`flex min-h-[48px] w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
                    selected
                      ? "border-nav-amethyst bg-nav-lavender-soft text-nav-violet"
                      : "border-nav-lavender-line bg-white text-nav-plum hover:bg-nav-lavender-mist"
                  }`}
                >
                  <span className="font-medium">
                    {ratti} Ratti ({rattiToCarat(ratti)} ct)
                    {outOfStock && <span className="ml-2 text-xs text-nav-plum/50">Out of stock</span>}
                  </span>
                  <span className={selected ? "text-nav-amethyst-deep font-semibold" : "text-nav-plum/70"}>
                    {formatInr(price.salePrice)}
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        {/* footer */}
        <div className="flex shrink-0 items-center gap-3 border-t border-nav-lavender-line px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-nav-lavender-line bg-white text-nav-plum transition-colors duration-200 hover:bg-nav-lavender-mist"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-full bg-nav-amethyst px-4 font-medium text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Adding…" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
