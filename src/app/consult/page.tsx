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

        {/* 3 columns from the narrowest phone up through tablet — every
            card (ServiceCard) has its own responsive compact layout
            below sm so 3-per-row stays readable/tappable at 320px —
            then 4 columns from desktop (lg) up. gap-3 on mobile keeps a
            real, deliberate gap between cards without eating too much
            of the ~88px-per-card width at 320px; gap-5 once cards have
            room to breathe from sm up. */}
        <ul className="mt-6 grid grid-cols-3 gap-3 sm:gap-5 md:mt-8 lg:grid-cols-4">
          {CONSULTATION_SERVICES.map((service) => (
            <li key={service.id} className="h-full">
              <ServiceCard service={service} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
