import type { Metadata } from "next";
import { listServiceProducts } from "@/lib/services/store";
import { ServiceCatalogue } from "@/components/services/ServiceCatalogue";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Healing Services | TRUELOGER",
  description: "Traditional spiritual healing sessions — Chakra Healing, Aura Cleansing, Relationship Healing and Money Healing.",
};

export default async function HealingPage() {
  const products = await listServiceProducts("healing");
  return (
    <ServiceCatalogue
      title="Healing Services"
      intro="Traditional, wellness-oriented healing sessions guided by TrueLoger's practitioners — for reflection, relaxation, and spiritual guidance."
      products={products}
    />
  );
}
