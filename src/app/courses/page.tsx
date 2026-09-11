import type { Metadata } from "next";
import { listServiceProducts } from "@/lib/services/store";
import { ServiceCatalogue } from "@/components/services/ServiceCatalogue";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Courses | TRUELOGER",
  description: "Learn Vedic astrology, numerology, tarot, vastu, palmistry, energy healing and more with TrueLoger's self-paced courses.",
};

export default async function CoursesPage() {
  const products = await listServiceProducts("course");
  return (
    <ServiceCatalogue
      title="Courses"
      intro="Self-paced courses to genuinely learn astrology and spiritual practices — real curriculum, real practice, at your own pace."
      products={products}
    />
  );
}
