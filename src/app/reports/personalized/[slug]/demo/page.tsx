// src/app/reports/personalized/[slug]/demo/page.tsx
// Public demo reader — no login required. Uses the SAME shared
// section-rendering components the purchased-report reader uses
// (src/components/reports/Report{Cover,TableOfContents,Section,Disclaimer}.tsx)
// so a demo and a real report never diverge in presentation (AGENTS
// §70). Content comes from a pre-generated, cached Firestore doc
// (src/lib/reports/demo-store.ts) built from FICTIONAL sample data —
// never a real user's chart.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getReportBlueprint } from "@/lib/reports/products";
import { getDemoReport } from "@/lib/reports/demo-store";
import { ReportCover } from "@/components/reports/ReportCover";
import { ReportTableOfContents } from "@/components/reports/ReportTableOfContents";
import { ReportSection } from "@/components/reports/ReportSection";
import { ReportDisclaimer } from "@/components/reports/ReportDisclaimer";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getReportBlueprint(slug);
  if (!product) return {};
  return {
    title: `${product.name} — Demo | TRUELOGER`,
    description: `Preview a sample ${product.name} — see the structure, depth, and quality of a TrueLoger personalized report before you buy.`,
  };
}

export default async function DemoReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getReportBlueprint(slug);
  if (!product) notFound();

  const demo = await getDemoReport(product.type);

  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/reports/personalized/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-nav-amethyst-deep transition-colors hover:text-nav-amethyst"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to {product.name}
        </Link>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
          <Sparkles aria-hidden="true" className="h-4 w-4 shrink-0" />
          This is a Sample / Demo Report using fictional sample data — not a real personalized reading.
        </div>

        {!demo ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-nav-lavender-line bg-white/60 px-6 py-16 text-center">
            <p className="text-sm text-nav-plum/70">This demo report is being prepared. Please check back shortly.</p>
            <Link
              href={`/reports/personalized/${slug}`}
              className="mt-2 flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-nav-amethyst-deep"
            >
              Back to {product.name}
            </Link>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-nav-lavender-line bg-white shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] sm:rounded-[1.4rem]">
            <ReportCover
              name={demo.profileSnapshot.fullName}
              productName={demo.productName}
              date={new Date(demo.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              isDemo
            />
            <div className="px-4 py-6 sm:px-8">
              <ReportTableOfContents sections={demo.sections} />
              <div className="mt-8 flex flex-col gap-10">
                {demo.sections.map((section) => (
                  <ReportSection key={section.id} section={section} />
                ))}
              </div>
              <div className="mt-10 border-t border-nav-lavender-line pt-6">
                <ReportDisclaimer />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
