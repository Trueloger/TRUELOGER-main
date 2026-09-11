import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HEALING_BLUEPRINTS } from "@/lib/services/data/healing";
import { getServiceProduct } from "@/lib/services/store";
import { ServiceDetailPage } from "@/components/services/ServiceDetailPage";

export const revalidate = 300;

export async function generateStaticParams() {
  return HEALING_BLUEPRINTS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getServiceProduct("healing", slug);
  if (!product) return {};
  return { title: `${product.name} | TRUELOGER`, description: product.shortDescription };
}

export default async function HealingServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getServiceProduct("healing", slug);
  if (!product) notFound();
  return <ServiceDetailPage product={product} />;
}
