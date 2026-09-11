import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COURSE_BLUEPRINTS } from "@/lib/services/data/courses";
import { getServiceProduct } from "@/lib/services/store";
import { ServiceDetailPage } from "@/components/services/ServiceDetailPage";

export const revalidate = 300;

export async function generateStaticParams() {
  return COURSE_BLUEPRINTS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getServiceProduct("course", slug);
  if (!product) return {};
  return { title: `${product.name} | TRUELOGER`, description: product.shortDescription };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getServiceProduct("course", slug);
  if (!product) notFound();
  return <ServiceDetailPage product={product} />;
}
