// src/app/library/[slug]/page.tsx
// The destination for the navbar's "Library" dropdown's 6 children
// (see NAV_ITEMS's "Library" entry in src/components/nav/nav-data.ts)
// — none of these routes existed at all until now, so every one of
// these 6 links was a real 404 (reachable from both desktop and
// mobile nav). An honest "Coming Soon" landing, not a fake article
// index — no content is invented; an unknown slug still 404s
// (notFound()), only these 6 real categories render. Same pattern as
// src/app/mall/[slug]/page.tsx.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";

type LibraryComingSoonCategory = {
  slug: string;
  name: string;
  blurb: string;
};

const CATEGORIES: LibraryComingSoonCategory[] = [
  { slug: "astrology-guides", name: "Astrology Guides", blurb: "Clear, practical guides to Vedic astrology concepts." },
  { slug: "spiritual-wisdom", name: "Spiritual Wisdom", blurb: "Traditional teachings for everyday spiritual practice." },
  { slug: "mantras", name: "Mantras", blurb: "Traditional mantras with meaning and correct pronunciation." },
  { slug: "chalisa", name: "Chalisa", blurb: "Devotional chalisas for daily recitation." },
  { slug: "vedic-knowledge", name: "Vedic Knowledge", blurb: "The foundations of Vedic astrology, explained simply." },
  { slug: "astrology-concepts", name: "Astrology Concepts", blurb: "Houses, planets, yogas and doshas — explained clearly." },
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
    description: `${category.name} in the TRUELOGER Library is coming soon. ${category.blurb}`,
  };
}

export default async function LibraryCategoryComingSoonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = findCategory(slug);
  if (!category) notFound();

  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-28 pb-20 text-center sm:px-6 md:px-8 md:pt-32">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          <BookOpen className="h-6 w-6 text-nav-gold" strokeWidth={1.3} aria-hidden="true" />
          <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
        </div>

        <h1 className="mt-4 font-serif text-[1.9rem] leading-[1.15] text-nav-violet sm:text-4xl">
          {category.name}
        </h1>

        <span className="mt-3 inline-flex items-center rounded-full border border-dashed border-nav-lavender-line bg-nav-lavender-mist/60 px-4 py-1.5 text-xs font-medium tracking-wide text-nav-plum/70">
          Coming Soon
        </span>

        <p className="mx-auto mt-5 max-w-md text-[0.95rem] leading-relaxed text-nav-plum/80">
          {category.blurb} We&apos;re still preparing this part of the TRUELOGER Library — check
          back soon, or explore what&apos;s already live below.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/free-services"
            className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep"
          >
            Explore Free Tools
          </Link>
          <Link
            href="/"
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-nav-lavender-line bg-white px-6 py-2.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
