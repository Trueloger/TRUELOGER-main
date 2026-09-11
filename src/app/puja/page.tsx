import type { Metadata } from "next";
import { listServiceProducts } from "@/lib/services/store";
import { ServiceCatalogue } from "@/components/services/ServiceCatalogue";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Puja Services | TRUELOGER",
  description: "Traditional Vedic Puja rituals performed by TrueLoger's associated priests — Ganesh, Lakshmi, Navgraha, Rudrabhishek, Grah Shanti and Maha Mrityunjaya Puja.",
};

export default async function PujaPage() {
  const products = await listServiceProducts("puja");
  return (
    <ServiceCatalogue
      title="Puja Services"
      intro="Traditional Vedic rituals performed by TrueLoger's associated priests — book a Puja for your name and intention, or attend where available."
      products={products}
    />
  );
}
