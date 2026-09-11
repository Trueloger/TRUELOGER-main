import { ServiceCard } from "./ServiceCard";
import type { ServiceProduct } from "@/lib/services/types";

export function ServiceCatalogue({
  title,
  intro,
  products,
}: {
  title: string;
  intro: string;
  products: ServiceProduct[];
}) {
  return (
    <section className="relative min-h-screen bg-nav-ivory px-4 pb-16 pt-28 sm:px-6 md:px-8 md:pb-24 md:pt-32">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-serif text-3xl leading-[1.15] text-nav-plum sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-nav-plum/80 sm:text-base">{intro}</p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ServiceCard key={product.slug} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
