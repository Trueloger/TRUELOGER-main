"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useCart, type CartItem } from "@/context/CartContext";
import { formatInr } from "@/lib/consultation/pricing";

export function CartDrawer() {
  const { items, subtotal, removeLine, isOpen, closeCart } = useCart();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  // Two-phase mount: render off-screen first, then flip to the resting
  // transform on the next frame so the transform transition actually
  // animates instead of snapping in already-settled.
  const [slidIn, setSlidIn] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    document.addEventListener("keydown", onKeyDown);

    const raf = requestAnimationFrame(() => setSlidIn(true));

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(raf);
      setSlidIn(false);
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  // Portaled to document.body for the same reason DurationSheet and
  // DemoReportViewer are (see DurationSheet.tsx's doc comment): any
  // ancestor with a CSS transform — including a hover-only one on a
  // card that opened the cart from deep in the tree — would otherwise
  // trap this `position: fixed` drawer inside that ancestor's box
  // instead of the viewport.
  return createPortal(
    <div className="fixed inset-0 z-[70]">
      {/* overlay */}
      <button
        type="button"
        aria-label="Close cart overlay"
        onClick={closeCart}
        className="absolute inset-0 bg-nav-violet/25 backdrop-blur-[1px]"
      />

      {/* panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className={`absolute inset-y-0 right-0 flex w-[88%] max-w-sm sm:w-[400px] sm:max-w-[400px] flex-col bg-nav-ivory shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
          slidIn ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          backgroundImage:
            "radial-gradient(circle at 0% 0%, rgba(164,128,207,0.10), transparent 55%)",
        }}
      >
        {/* header */}
        <div className="flex shrink-0 items-center justify-between border-b border-nav-lavender-line px-5 py-4">
          <h2 className="font-serif text-lg font-semibold text-nav-amethyst-deep">Your Cart</h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="flex h-10 w-10 items-center justify-center rounded-full text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-nav-plum">Your cart is empty.</p>
              <Link
                href="/consult"
                onClick={closeCart}
                className="rounded-full border border-nav-lavender-line bg-nav-pearl px-4 py-2 text-sm font-medium text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl"
              >
                Browse Consultations
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <CartLineRow key={item.id} item={item} onRemove={() => removeLine(item.id)} />
              ))}
            </ul>
          )}
        </div>

        {/* sticky bottom summary */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-nav-lavender-line bg-nav-pearl px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-nav-plum">Subtotal</span>
              <span className="font-serif text-lg font-semibold text-nav-amethyst-deep">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="flex w-full items-center justify-center rounded-full bg-nav-amethyst px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function CartLineRow({ item, onRemove }: { item: CartItem; onRemove: () => void }) {
  const isConsultation = item.type === "consultation";

  return (
    <li className="flex flex-col gap-1 rounded-xl border border-nav-lavender-line bg-nav-pearl px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-nav-violet">
          {isConsultation ? item.meta?.serviceName ?? item.name : item.name}
        </span>
        {typeof item.price === "number" && (
          <span className="shrink-0 text-sm font-semibold text-nav-amethyst-deep">
            {formatInr(item.price)}
          </span>
        )}
      </div>

      {isConsultation && item.meta?.duration && (
        <span className="text-xs text-nav-plum">{item.meta.duration} min</span>
      )}

      <div className="mt-1 flex items-center justify-between">
        {item.quantity > 1 ? (
          <span className="text-xs text-nav-plum">Qty: {item.quantity}</span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full px-2 py-1 text-xs font-medium text-nav-amethyst-deep transition-colors duration-150 hover:bg-nav-lavender-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl"
        >
          Remove
        </button>
      </div>
    </li>
  );
}
