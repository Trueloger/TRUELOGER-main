import type { MetadataRoute } from "next";

// Admin and account (user-specific) routes are private — never indexed.
// Everything else, including the new Legal/Company/Help/Support/Policy
// pages, is public and discoverable, per AGENTS "public policies
// generally need to be discoverable."
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://trueloger.vercel.app";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/api"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
