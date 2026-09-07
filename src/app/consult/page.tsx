// src/app/consult/page.tsx
// /consult landing page: premium banner, a one-line intro (no extra
// subheading block — the cards carry the content), and a responsive
// grid of every consultation service. Server component — ServiceCard
// itself is the client boundary (needs useCart + the duration sheet).
import type { Metadata } from "next";
import { ConsultHero } from "@/components/consult/ConsultHero";
import { ServiceCard } from "@/components/consult/ServiceCard";
import { CONSULTATION_SERVICES } from "@/lib/consultation/services-data";

export const metadata: Metadata = {
  title: "Talk to an Expert | TRUELOGER",
  description:
    "Book a one-on-one consultation with a TRUELOGER expert — Vedic astrology, Tarot, Numerology, Vastu, and spiritual healing, in a duration that fits your question.",
};

export default function ConsultPage() {
  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      <div className="mx-auto max-w-[1320px] px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
        <ConsultHero />

        <p
          id="consult-grid"
          className="mx-auto mt-10 max-w-2xl scroll-mt-28 text-center text-[0.95rem] text-nav-plum/80 md:mt-14 md:scroll-mt-32"
        >
          Choose a consultation below, pick a duration, and connect with an expert.
        </p>

        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 md:mt-8 lg:grid-cols-3 xl:grid-cols-4">
          {CONSULTATION_SERVICES.map((service) => (
            <li key={service.id}>
              <ServiceCard service={service} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
