"use client";

// src/components/auth/PurchaseGateModal.tsx
// Shown instead of navigating straight to /checkout when the buyer
// isn't allowed to purchase yet — either signed out, or signed in but
// with an incomplete profile (birth details are required for every
// consultation/product this site sells, and Checkout's own server-side
// validation depends on the profile existing). Two call sites: the
// "Checkout" button in CartDrawer.tsx (intercepts the click before
// navigating) and /checkout itself (in case someone lands there
// directly by URL, bypassing the cart button). Same portal/overlay
// pattern as DurationSheet.tsx.
//
// The cart itself is never touched by this flow — CartProvider sits
// above the router in the root layout, so it survives the
// login/signup/profile-complete detour untouched; every "Continue"
// link here carries `?redirect=<redirectTo>` so the user lands back on
// /checkout, cart intact, the moment they're eligible to buy.
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { LogIn, UserPlus, UserCheck } from "lucide-react";

export type PurchaseGateReason = "signed-out" | "profile-incomplete";

type PurchaseGateModalProps = {
  reason: PurchaseGateReason;
  open: boolean;
  onClose: () => void;
  /** Where to send the user back to once they're eligible to buy —
   * almost always "/checkout". */
  redirectTo: string;
};

export function PurchaseGateModal({ reason, open, onClose, redirectTo }: PurchaseGateModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
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
    };
  }, [open, onClose]);

  if (!open) return null;

  const redirect = encodeURIComponent(redirectTo);

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Close dialog overlay"
        onClick={onClose}
        className="absolute inset-0 bg-nav-violet/35 backdrop-blur-[1px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-gate-heading"
        className="absolute inset-x-0 bottom-0 flex max-h-[90vh] w-full flex-col rounded-t-3xl border border-nav-lavender-line bg-nav-pearl shadow-2xl sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85vh] sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
        style={{
          backgroundImage:
            "radial-gradient(circle at 100% 0%, rgba(164,128,207,0.10), transparent 55%)",
        }}
      >
        <div className="flex flex-col items-center gap-3 px-6 pb-2 pt-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-nav-amethyst/10 text-nav-amethyst-deep ring-1 ring-nav-amethyst/20">
            {reason === "signed-out" ? (
              <LogIn aria-hidden="true" className="h-5 w-5" />
            ) : (
              <UserCheck aria-hidden="true" className="h-5 w-5" />
            )}
          </span>
          <h2 id="purchase-gate-heading" className="font-serif text-xl text-nav-violet">
            {reason === "signed-out" ? "Sign in to continue" : "Complete your profile to continue"}
          </h2>
          <p className="text-sm leading-relaxed text-nav-plum/80">
            {reason === "signed-out"
              ? "You'll need an account to purchase a gemstone, product, or consultation — this keeps your order history and consultation reports tied to you. Your cart is saved and will still be here after you sign in."
              : "A few birth details (name, date of birth, and birth place) are required before you can check out — every consultation and remedy on this site depends on them. Your cart is saved and will still be here once you're done."}
          </p>
        </div>

        <div className="flex flex-col gap-2.5 px-6 pb-8 pt-5">
          {reason === "signed-out" ? (
            <>
              <Link
                href={`/login?redirect=${redirect}`}
                onClick={onClose}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-nav-amethyst px-4 font-medium text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep"
              >
                <LogIn aria-hidden="true" className="h-4 w-4" />
                Log In
              </Link>
              <Link
                href={`/signup?redirect=${redirect}`}
                onClick={onClose}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-nav-lavender-line bg-white px-4 font-medium text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-mist"
              >
                <UserPlus aria-hidden="true" className="h-4 w-4" />
                Create Account
              </Link>
            </>
          ) : (
            <Link
              href={`/profile/complete?redirect=${redirect}`}
              onClick={onClose}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-nav-amethyst px-4 font-medium text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep"
            >
              <UserCheck aria-hidden="true" className="h-4 w-4" />
              Complete Profile
            </Link>
          )}
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] w-full items-center justify-center rounded-full px-4 text-sm font-medium text-nav-plum/70 transition-colors duration-200 hover:bg-nav-lavender-mist"
          >
            Not now
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
