import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { formatInr } from "@/lib/consultation/pricing";
import type { ServiceProduct } from "@/lib/services/types";

const BASE_PATH: Record<ServiceProduct["category"], string> = {
  healing: "/healing",
  puja: "/puja",
  course: "/courses",
};

/** Shared catalogue card for Healing / Puja / Course listing pages —
 * one component, category-agnostic, so the three catalogues stay
 * visually and structurally identical (per "one extensible service
 * model, not three duplicated ones"). */
export function ServiceCard({ product }: { product: ServiceProduct }) {
  const href = `${BASE_PATH[product.category]}/${product.slug}`;
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-nav-lavender-line bg-white shadow-[0_10px_26px_-18px_rgba(70,40,120,0.3)] transition-shadow duration-200 hover:shadow-[0_14px_32px_-16px_rgba(70,40,120,0.4)]"
    >
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-serif text-lg text-nav-plum sm:text-xl">{product.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-nav-plum/75">{product.shortDescription}</p>

        <div className="mt-4 flex items-center gap-1.5 text-xs text-nav-plum/60">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {product.duration}
        </div>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {product.discountPercent > 0 && (
            <span className="text-xs text-nav-plum/45 line-through">{formatInr(product.mrp)}</span>
          )}
          <span className="text-lg font-semibold text-nav-amethyst-deep">{formatInr(product.salePrice)}</span>
          {product.discountPercent > 0 && (
            <span className="rounded-full bg-nav-lavender-soft px-2 py-0.5 text-[11px] font-medium text-nav-amethyst-deep">
              {product.discountPercent}% OFF
            </span>
          )}
        </div>

        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-nav-amethyst-deep">
          View Details
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
