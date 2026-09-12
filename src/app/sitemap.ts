import type { MetadataRoute } from "next";

// Static top-level public pages — the Legal/Company/Help/Support/
// Policy/Trust section plus core marketing pages. Deliberately not
// exhaustive of every dynamic product page (reports/gemstones/etc.
// already have their own generateStaticParams-driven static
// generation, discoverable via normal crawling); this covers the
// pages that have no other discovery path.
const STATIC_ROUTES = [
  "/",
  "/about",
  "/contact",
  "/help",
  "/faq",
  "/privacy-policy",
  "/privacy-security",
  "/terms-and-conditions",
  "/refund-cancellation",
  "/shipping-delivery",
  "/payment-billing",
  "/disclaimer",
  "/cookie-policy",
  "/data-deletion",
  "/grievance",
  "/accessibility",
  "/astrologer-terms",
  "/register-as-astrologer",
  "/healing",
  "/puja",
  "/courses",
  "/gemstones",
  "/reports/personalized",
  "/consult",
  "/free-services",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://trueloger.vercel.app";
  const now = new Date();
  return STATIC_ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
  }));
}
