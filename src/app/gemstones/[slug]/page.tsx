import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getGemstoneById, getAllGemstoneSlugs } from "@/lib/gemstones/gemstone-data";
import { GemstoneGallery } from "@/components/gemstones/GemstoneGallery";
import { GemstoneRattiSelector } from "@/components/gemstones/GemstoneRattiSelector";
import { FaqAccordion } from "@/components/consult/FaqAccordion";

const GEMSTONE_DISCLAIMER =
  "Gemstones are traditionally associated with astrological and spiritual practices. Suitability can vary based on an individual's birth chart. Consider consulting a qualified astrologer before selecting a gemstone or wearing weight.";

/** One shared template for every gemstone product subpage
 * (/gemstones/[slug]) — statically generated for all 8 products from
 * the shared catalogue in gemstone-data.ts. Server component: the data
 * lookup and every static section render here, mirroring
 * src/app/consult/[slug]/page.tsx's server/client split — only the
 * gallery and the Ratti selector/pricing/Add to Cart block need client
 * state, delegated to their own small client components. */
export async function generateStaticParams() {
  return getAllGemstoneSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getGemstoneById(slug);
  if (!product) return {};
  return {
    title: product.seo.title,
    description: product.seo.description,
  };
}

export default async function GemstonePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getGemstoneById(slug);
  if (!product) notFound();

  const wearingInfo: { label: string; value: string }[] = [
    { label: "Ruling Planet", value: product.rulingPlanet },
    ...(product.associatedDay ? [{ label: "Associated Day", value: product.associatedDay }] : []),
    ...(product.associatedMetal
      ? [{ label: "Associated Metal", value: product.associatedMetal }]
      : []),
    ...(product.wearingFinger ? [{ label: "Wearing Finger", value: product.wearingFinger }] : []),
    ...(product.wearingMethod ? [{ label: "Wearing Method", value: product.wearingMethod }] : []),
  ];

  return (
    <section className="relative min-h-screen bg-nav-ivory px-4 pb-16 pt-28 sm:px-6 md:px-8 md:pb-24 md:pt-32">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/gemstones"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-nav-amethyst-deep transition-colors duration-150 hover:text-nav-amethyst"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Gemstones
        </Link>

        {/* Gallery */}
        <div className="mt-6">
          <GemstoneGallery gallery={product.gallery} />
        </div>

        {/* Name + short description */}
        <div className="mt-6">
          <h1 className="font-serif text-3xl leading-[1.15] text-nav-plum sm:text-4xl">
            {product.name}
            {product.indianName && (
              <span className="text-nav-amethyst-deep"> — {product.indianName}</span>
            )}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-nav-plum/80 sm:text-base">
            {product.shortDescription}
          </p>
        </div>

        {/* Ratti selector + live price + Add to Cart + delivery estimate */}
        <div className="mt-6">
          <GemstoneRattiSelector product={product} />
        </div>

        {/* About this Gemstone */}
        <div className="mt-8">
          <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">About this Gemstone</h2>
          <p className="mt-3 text-sm leading-relaxed text-nav-plum/85 sm:text-base">
            {product.description}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-nav-plum/85 sm:text-base">
            {product.astrologicalSignificance}
          </p>
        </div>

        {/* Traditional Benefits */}
        <div className="mt-8">
          <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">Traditional Benefits</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {product.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5 text-sm text-nav-plum/85 sm:text-base">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nav-orchid" aria-hidden="true" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Wearing Information */}
        {wearingInfo.length > 0 && (
          <div className="mt-8">
            <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">Wearing Information</h2>
            <dl className="mt-3 flex flex-col gap-2">
              {wearingInfo.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 rounded-lg border border-nav-lavender-line bg-white px-4 py-2.5"
                >
                  <dt className="text-xs font-medium uppercase tracking-wide text-nav-plum/60">
                    {item.label}
                  </dt>
                  <dd className="text-sm font-medium text-nav-plum">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Care Instructions */}
        <div className="mt-8">
          <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">Care Instructions</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {product.careInstructions.map((instruction) => (
              <li key={instruction} className="flex items-start gap-2.5 text-sm text-nav-plum/85 sm:text-base">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nav-orchid" aria-hidden="true" />
                <span>{instruction}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Certification — only rendered when the data actually has it */}
        {product.certificationInfo && (
          <div className="mt-8">
            <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">Certification</h2>
            <p className="mt-3 text-sm leading-relaxed text-nav-plum/85 sm:text-base">
              {product.certificationInfo}
            </p>
          </div>
        )}

        {/* FAQ */}
        {product.faqs.length > 0 && (
          <div className="mt-8">
            <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">
              Frequently asked questions
            </h2>
            <div className="mt-3">
              <FaqAccordion faqs={product.faqs} />
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-10 border-t border-nav-lavender-line pt-5">
          <p className="text-xs leading-relaxed text-nav-plum/50">{GEMSTONE_DISCLAIMER}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-nav-plum/50">
            Not sure which gemstone or weight is right for you?{" "}
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
