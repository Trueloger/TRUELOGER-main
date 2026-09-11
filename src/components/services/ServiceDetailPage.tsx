import Link from "next/link";
import { ArrowLeft, Clock, HelpCircle } from "lucide-react";
import { formatInr } from "@/lib/consultation/pricing";
import { AddServiceToCartButton } from "./AddServiceToCartButton";
import type { ServiceProduct } from "@/lib/services/types";

const BASE_PATH: Record<ServiceProduct["category"], { path: string; backLabel: string }> = {
  healing: { path: "/healing", backLabel: "Back to Healing" },
  puja: { path: "/puja", backLabel: "Back to Puja" },
  course: { path: "/courses", backLabel: "Back to Courses" },
};

/** Shared product-detail page body for Healing / Puja / Course —
 * Server Component, one template for all three catalogues (mirrors
 * the Reports product page's structure/tone). Category-specific route
 * files (src/app/{healing,puja,courses}/[slug]/page.tsx) just fetch
 * their product and render this. */
export function ServiceDetailPage({ product }: { product: ServiceProduct }) {
  const { path, backLabel } = BASE_PATH[product.category];

  return (
    <section className="relative min-h-screen bg-nav-ivory px-4 pb-16 pt-28 sm:px-6 md:px-8 md:pb-24 md:pt-32">
      <div className="mx-auto max-w-3xl">
        <Link
          href={path}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-nav-amethyst-deep transition-colors duration-150 hover:text-nav-amethyst"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>

        <h1 className="mt-6 font-serif text-3xl leading-[1.15] text-nav-plum sm:text-4xl">{product.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-nav-plum/80 sm:text-base">{product.introduction}</p>

        {/* Price + facts + actions */}
        <div className="mt-6 rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-white to-nav-lavender-mist p-5 shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] sm:p-6">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            {product.discountPercent > 0 && (
              <span className="text-sm text-nav-plum/50 line-through">{formatInr(product.mrp)}</span>
            )}
            <span className="text-2xl font-semibold text-nav-amethyst-deep sm:text-3xl">{formatInr(product.salePrice)}</span>
            {product.discountPercent > 0 && (
              <span className="rounded-full bg-nav-lavender-soft px-2 py-0.5 text-xs font-medium text-nav-amethyst-deep">
                {product.discountPercent}% OFF
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-nav-plum/65 sm:text-sm">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {product.duration}
            </span>
            <span>{product.deliveryTime}</span>
          </div>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <AddServiceToCartButton product={product} />
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">What This Is</h2>
          <p className="mt-3 text-sm leading-relaxed text-nav-plum/85 sm:text-base">{product.whatItIs}</p>
        </div>

        <div className="mt-8">
          <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">Who It&apos;s For</h2>
          <p className="mt-3 text-sm leading-relaxed text-nav-plum/85 sm:text-base">{product.whoItsFor}</p>
        </div>

        <div className="mt-8">
          <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">What&apos;s Covered</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {product.whatItCovers.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm text-nav-plum/85 sm:text-base">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nav-gold" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">What To Expect</h2>
          <p className="mt-3 text-sm leading-relaxed text-nav-plum/85 sm:text-base">{product.whatToExpect}</p>
        </div>

        {product.course && (
          <div className="mt-8">
            <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">Curriculum</h2>
            <p className="mt-2 text-sm text-nav-plum/65">
              {product.course.level} · {product.course.format}
            </p>
            <ol className="mt-4 flex flex-col gap-3">
              {product.course.modules.map((m, i) => (
                <li key={m.title} className="rounded-xl border-l-2 border-nav-gold bg-nav-lavender-soft/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-nav-amethyst-deep">
                    {i + 1}. {m.title}
                  </p>
                  <p className="mt-1 text-sm text-nav-plum/80">{m.summary}</p>
                </li>
              ))}
            </ol>

            <h3 className="mt-6 font-serif text-lg text-nav-plum">What You&apos;ll Learn</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {product.course.outcomes.map((o) => (
                <li key={o} className="flex items-start gap-2.5 text-sm text-nav-plum/85">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nav-orchid" aria-hidden="true" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8">
          <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">FAQs</h2>
          <div className="mt-3 flex flex-col gap-3">
            {product.faqs.map((faq) => (
              <div key={faq.question} className="rounded-xl border border-nav-lavender-line bg-white p-4">
                <p className="flex items-start gap-2 text-sm font-semibold text-nav-plum">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-nav-amethyst" aria-hidden="true" />
                  {faq.question}
                </p>
                <p className="mt-1.5 pl-6 text-sm leading-relaxed text-nav-plum/80">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-nav-lavender-line pt-5">
          <p className="text-xs leading-relaxed text-nav-plum/50">{product.disclaimer}</p>
        </div>
      </div>
    </section>
  );
}
