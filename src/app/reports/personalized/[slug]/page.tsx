// src/app/reports/personalized/[slug]/page.tsx
// Full product-detail page for one paid personalized report. Server
// Component — mirrors src/app/gemstones/[slug]/page.tsx's server/client
// split: all static copy renders here, only the Add to Cart action
// (cart + auth are client-only) is delegated to a small client island.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, FileText, ScrollText, Sparkles } from "lucide-react";
import { REPORT_PRODUCTS } from "@/lib/reports/products";
import { getReportProduct } from "@/lib/reports/store";
import { formatInr } from "@/lib/consultation/pricing";
import { AddReportToCartButton } from "@/components/reports/AddReportToCartButton";

const REPORT_DISCLAIMER =
  "This report is a traditional astrological interpretation generated from your birth details. It is not medical, legal, or financial advice, and does not guarantee any outcome. Consider it guidance to reflect on, not a substitute for professional advice.";

export const revalidate = 300;

export async function generateStaticParams() {
  return REPORT_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getReportProduct(slug);
  if (!product) return {};
  return {
    title: `${product.name} | TRUELOGER`,
    description: product.shortDescription,
  };
}

export default async function ReportProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getReportProduct(slug);
  if (!product) notFound();

  return (
    <section className="relative min-h-screen bg-nav-ivory px-4 pb-16 pt-28 sm:px-6 md:px-8 md:pb-24 md:pt-32">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/reports/personalized"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-nav-amethyst-deep transition-colors duration-150 hover:text-nav-amethyst"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Reports
        </Link>

        {/* Hero */}
        <div className="mt-6 flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-nav-amethyst/10 text-nav-amethyst-deep ring-1 ring-nav-amethyst/20">
            <ScrollText className="h-5.5 w-5.5" strokeWidth={1.4} aria-hidden="true" />
          </span>
          <h1 className="font-serif text-3xl leading-[1.15] text-nav-plum sm:text-4xl">
            {product.name}
          </h1>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-nav-plum/80 sm:text-base">
          {product.shortDescription}
        </p>

        {/* Price + facts + actions */}
        <div className="mt-6 rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-white to-nav-lavender-mist p-5 shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] sm:p-6">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            {product.discountPercent > 0 && (
              <span className="text-sm text-nav-plum/50 line-through">
                {formatInr(product.mrp)}
              </span>
            )}
            <span className="text-2xl font-semibold text-nav-amethyst-deep sm:text-3xl">
              {formatInr(product.salePrice)}
            </span>
            {product.discountPercent > 0 && (
              <span className="rounded-full bg-nav-lavender-soft px-2 py-0.5 text-xs font-medium text-nav-amethyst-deep">
                {product.discountPercent}% OFF
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-nav-plum/65 sm:text-sm">
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" aria-hidden="true" />
              {product.minPages}–{product.maxPages} pages
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Delivery: within {product.deliveryHours} hours
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <AddReportToCartButton product={product} />
            <Link
              href={`/reports/personalized/${product.slug}/demo`}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border border-nav-lavender-line bg-white px-5 text-sm font-medium text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-mist sm:flex-none sm:px-8"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              View Demo Report
            </Link>
          </div>
        </div>

        {/* What It Covers */}
        <div className="mt-8">
          <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">What This Report Covers</h2>
          <p className="mt-2 text-sm leading-relaxed text-nav-plum/75 sm:text-base">
            Your {product.name.replace(" Report", "").toLowerCase()} report is built directly from
            your birth chart&apos;s real calculated positions, then written into clear, readable
            sections covering:
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {product.whatItCovers.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm text-nav-plum/85 sm:text-base">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nav-gold" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Who It's For */}
        <div className="mt-8">
          <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">Who It&apos;s For</h2>
          <p className="mt-3 text-sm leading-relaxed text-nav-plum/85 sm:text-base">
            {product.whoItsFor}
          </p>
        </div>

        {/* What You'll Receive */}
        <div className="mt-8">
          <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">What You&apos;ll Receive</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {product.whatYouReceive.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-nav-plum/85 sm:text-base">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nav-orchid" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Disclaimer */}
        <div className="mt-10 border-t border-nav-lavender-line pt-5">
          <p className="text-xs leading-relaxed text-nav-plum/50">{REPORT_DISCLAIMER}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-nav-plum/50">
            Not sure which report is right for you?{" "}
            <Link href="/consult" className="font-medium text-nav-amethyst-deep hover:underline">
              Speak with an astrologer
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
