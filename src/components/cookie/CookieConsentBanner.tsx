"use client";

// src/components/cookie/CookieConsentBanner.tsx
// First-visit cookie notice — bottom banner, dismissed once and
// remembered in localStorage (per-browser, same convention as any
// other "don't show this again" UI; never blocks the page underneath,
// unlike PurchaseGateModal, since browsing the site doesn't require
// accepting cookies, only using it does). Covers the essential cookies
// this site actually sets: Firebase Authentication session state and
// Cashfree's own checkout-session cookies — there is no third-party
// analytics/ad tracking in this codebase to disclose separately, so a
// single "Accept" action (not a granular preference center) is
// accurate, not a dark pattern. Full detail lives in the Cookies
// section of /terms-and-conditions, linked from here.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "trueloger-cookie-consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Reads an external system (localStorage) exactly once on mount to
    // decide whether to show the banner — the one legitimate case the
    // "no setState in an effect body" rule itself calls out as fine
    // (synchronizing with an external system), not a derived-state
    // anti-pattern. Can't be a lazy useState initializer instead:
    // localStorage isn't available during server render, and reading it
    // there would produce a server/client hydration mismatch.
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisible(true);
      }
    } catch {
      // Storage inaccessible (private mode, blocked site data) — fail
      // open by just not showing the banner rather than crashing.
    }
  }, []);

  function accept() {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // If storage can't persist the choice, the banner will simply
      // reappear next visit — harmless, not worth surfacing an error.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-nav-lavender-line bg-nav-pearl/98 px-4 py-4 shadow-[0_-4px_16px_rgba(90,55,140,0.12)] backdrop-blur-sm sm:px-6"
    >
      <div className="mx-auto flex max-w-[1320px] flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-6">
        <div className="flex items-start gap-3 text-center sm:text-left">
          <Cookie aria-hidden="true" className="mt-0.5 hidden h-5 w-5 shrink-0 text-nav-amethyst-deep sm:block" />
          <p className="text-sm leading-relaxed text-nav-plum/85">
            We use essential cookies to keep you signed in and to process payments securely
            through Cashfree. By continuing to use TRUELOGER, you agree to this.{" "}
            <Link
              href="/terms-and-conditions#cookies"
              className="font-medium text-nav-amethyst-deep underline underline-offset-2 hover:text-nav-violet"
            >
              Learn more
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={accept}
          className="flex min-h-[44px] w-full shrink-0 items-center justify-center rounded-full bg-nav-amethyst px-6 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl sm:w-auto"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
