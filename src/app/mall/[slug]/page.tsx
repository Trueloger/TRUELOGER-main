// src/app/mall/[slug]/page.tsx
// The destination for the 4 non-Gemstones Mall categories (Rudraksha,
// Bracelets, Yantras, Spiritual Products) — the navbar's "TRUELOGER
// Mall" dropdown (see MALL_ITEM in src/components/nav/nav-data.ts)
// links straight to /mall/<slug> for each of these, and until now
// none of those routes existed at all, so every one of those 4 links
// was a real 404. This is an honest "Coming Soon" landing, not a fake
// catalogue — no products/pricing are invented; visiting here for an
// unknown slug still 404s (notFound()), only these 4 real categories
// render.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

type MallComingSoonCategory = {
  slug: string;
  name: string;
  blurb: string;
};

const CATEGORIES: MallComingSoonCategory[] = [
  { slug: "rudraksha", name: "Rudraksha", blurb: "Mukhi beads and malas for daily practice." },
  { slug: "bracelets", name: "Bracelets", blurb: "Crystal and bead bracelets for everyday wear." },
  { slug: "yantras", name: "Yantras", blurb: "Sacred geometry for the home and altar." },
  { slug: "spiritual-products", name: "Spiritual Products", blurb: "Diyas, incense and puja essentials." },
];

function findCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = findCategory(slug);
  if (!category) return {};
  return {
    title: `${category.name} — Coming Soon | TRUELOGER`,
    description: `${category.name} at the TRUELOGER Mall is coming soon. ${category.blurb}`,
  };
}

export default async function MallCategoryComingSoonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = findCategory(slug);
  if (!category) notFound();

  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-28 pb-20 text-center sm:px-6 md:px-8 md:pt-32">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          <Sparkles className="h-6 w-6 text-nav-gold" strokeWidth={1.3} aria-hidden="true" />
          <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
        </div>

        <h1 className="mt-4 font-serif text-[1.9rem] leading-[1.15] text-nav-violet sm:text-4xl">
          {category.name}
        </h1>

        <span className="mt-3 inline-flex items-center rounded-full border border-dashed border-nav-lavender-line bg-nav-lavender-mist/60 px-4 py-1.5 text-xs font-medium tracking-wide text-nav-plum/70">
          Coming Soon
        </span>

        <p className="mx-auto mt-5 max-w-md text-[0.95rem] leading-relaxed text-nav-plum/80">
          {category.blurb} We&apos;re still preparing this part of the TRUELOGER Mall — check back
          soon, or explore what&apos;s already live below.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/gemstones"
            className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep"
          >
            Shop Gemstones
          </Link>
          <Link
            href="/mall"
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-nav-lavender-line bg-white px-6 py-2.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to Mall
          </Link>
        </div>
      </div>
    </main>
  );
}
