// src/app/reports/personalized/page.tsx
// /reports/personalized landing page: premium banner + a responsive
// grid of every report product. Server component — mirrors
// src/app/gemstones/page.tsx's structure exactly (listReportProducts()
// is server-only, Admin SDK backed, so this stays a Server Component
// rather than a client fetch).
import type { Metadata } from "next";
import { ReportsHero } from "@/components/reports/ReportsHero";
import { ReportCard } from "@/components/reports/ReportCard";
import { listReportProducts } from "@/lib/reports/store";

export const metadata: Metadata = {
  title: "Personalized Reports | TRUELOGER",
  description:
    "In-depth, AI-personalized Vedic astrology reports — Kundli, Marriage, Career, Love & Relationship, Finance, Life, and Dosha — generated from your exact birth details and delivered to your account.",
};

// Re-fetched at most every 5 minutes so an admin pricing/delivery-time
// edit shows up on the public grid without a redeploy — same tradeoff
// as /gemstones.
export const revalidate = 300;

export default async function PersonalizedReportsPage() {
  const products = await listReportProducts();

  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      <div className="mx-auto max-w-[1320px] px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
        <ReportsHero />

        <p
          id="report-grid"
          className="mx-auto mt-10 max-w-2xl scroll-mt-28 text-center text-[0.95rem] text-nav-plum/80 md:mt-14 md:scroll-mt-32"
        >
          Choose a report below — each is generated fresh from your own
          birth chart, never a generic template.
        </p>

        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:mt-8 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.slug} className="h-full">
              <ReportCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
