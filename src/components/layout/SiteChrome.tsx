"use client";

// src/components/layout/SiteChrome.tsx
// Wraps the customer-facing chrome (Navbar, Footer, cart drawer, cookie
// banner) around {children} — but only OUTSIDE /admin/*. The admin
// panel is its own separate app shell (src/app/admin/layout.tsx: its
// own side-nav/mobile header, no shopping cart, no cookie banner to
// show an admin) — the public Navbar had no reason to render on top of
// it (it doesn't link anywhere useful there and was purely getting in
// the way, requiring the admin shell to pad itself to clear it), and
// neither does the Footer, CartDrawer, or CookieConsentBanner.
// AuthProvider/CartProvider stay mounted everywhere regardless (both
// contexts are still needed on /admin/* — admin auth guard, and the
// cart persists across an admin visit even though the cart UI itself
// stays hidden there), so this only wraps the presentational pieces.
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Navbar } from "@/components/nav/Navbar";
import { Footer } from "@/components/footer/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CookieConsentBanner } from "@/components/cookie/CookieConsentBanner";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <CartDrawer />
      <CookieConsentBanner />
    </>
  );
}
