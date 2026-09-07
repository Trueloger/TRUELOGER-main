import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { getServiceById, getAllServiceSlugs } from "@/lib/consultation/services-data";
import { ConsultServiceIcon } from "@/components/consult/ConsultServiceIcon";
import { ServiceDurationPicker } from "@/components/consult/ServiceDurationPicker";
import { DemoReportSection } from "@/components/consult/DemoReportSection";
import { FaqAccordion } from "@/components/consult/FaqAccordion";

const GENERAL_DISCLAIMER =
  "This consultation offers guidance and interpretation; it is not a substitute for professional medical, legal, or financial advice.";

/** One shared template for every consultation service subpage
 * (/consult/[slug]) — statically generated for all 13 services from
 * the shared catalogue in services-data.ts. Server component: the data
 * lookup and every static section render here, with only the duration
 * selector and the demo-report toggle/FAQ accordion needing client
 * state (delegated to their own small client components). */
export async function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceById(slug);
  if (!service) notFound();
  return {
    title: service.seo.title,
    description: service.seo.description,
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceById(slug);
  if (!service) notFound();

  return (
    <section className="relative min-h-screen bg-nav-ivory px-4 pb-16 pt-28 sm:px-6 md:px-8 md:pb-24 md:pt-32">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/consult"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-nav-amethyst-deep transition-colors duration-150 hover:text-nav-amethyst"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Consultations
        </Link>

        {/* Hero */}
        <div className="mt-6 rounded-2xl border border-nav-lavender-line bg-gradient-to-br from-nav-lavender-mist to-nav-pearl p-6 sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-nav-amethyst text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)]">
            <ConsultServiceIcon icon={service.icon} className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-serif text-3xl leading-[1.15] text-nav-plum sm:text-4xl">
            {service.name}
          </h1>
          <p className="mt-2 text-base font-medium text-nav-amethyst-deep">
            {service.subtitle}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-nav-plum/80 sm:text-base">
            {service.description}
          </p>
        </div>

        {/* What this consultation covers */}
        <div className="mt-8">
          <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">
            What this consultation covers
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {service.highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-2.5 text-sm text-nav-plum/85 sm:text-base">
                <Check className="mt-0.5 h-4.5 w-4.5 shrink-0 text-nav-amethyst" aria-hidden="true" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Common questions people bring */}
        <div className="mt-8">
          <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">
            Common questions people bring
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {service.topics.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-nav-lavender-line bg-nav-lavender-soft px-3.5 py-1.5 text-xs font-medium text-nav-plum sm:text-sm"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>

        {/* Ideal for */}
        <div className="mt-8">
          <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">Ideal for</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {service.suitableFor.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-nav-plum/85 sm:text-base">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nav-orchid" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Duration + pricing + Add to Cart */}
        <div className="mt-8">
          <ServiceDurationPicker service={service} />
        </div>

        {/* View Demo Report */}
        <div className="mt-8">
          <DemoReportSection service={service} />
        </div>

        {/* FAQ */}
        {service.faqs.length > 0 && (
          <div className="mt-8">
            <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">
              Frequently asked questions
            </h2>
            <div className="mt-3">
              <FaqAccordion faqs={service.faqs} />
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-10 border-t border-nav-lavender-line pt-5">
          <p className="text-xs leading-relaxed text-nav-plum/50">{GENERAL_DISCLAIMER}</p>
          {service.extraDisclaimer && (
            <p className="mt-1.5 text-xs leading-relaxed text-nav-plum/50">
              {service.extraDisclaimer}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
