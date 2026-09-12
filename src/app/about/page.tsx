import type { Metadata } from "next";
import Link from "next/link";
import { LotusIcon } from "@/components/quick-services/icons";

export const metadata: Metadata = {
  title: "About TrueLoger",
  description: "TrueLoger brings Vedic astrology, consultations, healing, Puja, courses, and personalized reports together on one platform.",
};

const OFFERINGS = [
  { title: "Consultations", body: "Book a live session with an astrologer across Vedic astrology, tarot, numerology, Vastu, palmistry, and more — with your preferred date and time confirmed before you pay.", href: "/consult" },
  { title: "Personalized Reports", body: "In-depth reports built from your real birth chart — calculated by our own astrology engine, then written into readable sections.", href: "/reports/personalized" },
  { title: "Healing", body: "Traditional, wellness-oriented energy-healing sessions — Chakra Healing, Aura Cleansing, Relationship Healing, and Money Healing.", href: "/healing" },
  { title: "Puja", body: "Traditional Vedic rituals performed by our associated priests, booked in your name and intention.", href: "/puja" },
  { title: "Courses", body: "Self-paced courses to genuinely learn astrology, numerology, tarot, Vastu, palmistry, and energy healing.", href: "/courses" },
  { title: "Gemstones & Products", body: "A curated catalogue of gemstones, bracelets, Rudraksha, and Yantras, each with real pricing and delivery information.", href: "/gemstones" },
  { title: "Free Tools", body: "Free Kundli, Kundli Matching, Numerology, Nakshatra, Rashi, Ascendant, Mangal Dosha, Sade Sati, Dasha, and daily/weekly/monthly horoscopes — no payment or account needed for most of these.", href: "/free-services" },
];

export default function AboutPage() {
  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-nav-lavender-line" aria-hidden="true" />
          <LotusIcon className="h-6 w-6 text-nav-gold" strokeWidth={1.3} />
          <span className="h-px w-10 bg-nav-lavender-line" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-center font-serif text-3xl leading-[1.15] text-nav-plum sm:text-4xl">About TrueLoger</h1>

        <p className="mt-6 text-center text-[0.95rem] leading-relaxed text-nav-plum/85">
          TrueLoger brings traditional Vedic astrology and spiritual practice together with a modern, trustworthy
          platform — real astrological calculation, real astrologers, and real traditional rituals, presented
          clearly and without gimmicks.
        </p>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">Our Approach</h2>
          <p className="mt-3 text-sm leading-relaxed text-nav-plum/85">
            Every personalized report on TrueLoger starts with real astronomical calculation — planetary
            positions, houses, dashas, and yogas computed by our own deterministic engine, never guessed or
            invented by AI. Interpretive narrative is then written to help make that calculation readable, and
            traditional astrological content is always framed as traditional interpretation, not a guaranteed
            outcome — see our <Link href="/disclaimer" className="text-nav-amethyst-deep hover:underline">Disclaimer</Link>.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">What We Offer</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {OFFERINGS.map((o) => (
              <Link
                key={o.title}
                href={o.href}
                className="flex flex-col gap-1.5 rounded-2xl border border-nav-lavender-line bg-white p-5 transition-colors hover:bg-nav-lavender-mist/40"
              >
                <p className="font-serif text-lg text-nav-violet">{o.title}</p>
                <p className="text-sm leading-relaxed text-nav-plum/75">{o.body}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-nav-lavender-line bg-white/60 p-5 sm:p-6">
          <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">Questions?</h2>
          <p className="mt-2 text-sm leading-relaxed text-nav-plum/85">
            Visit our <Link href="/help" className="text-nav-amethyst-deep hover:underline">Help & Support</Link> page,
            or <Link href="/contact" className="text-nav-amethyst-deep hover:underline">contact us</Link> directly.
          </p>
        </section>
      </div>
    </main>
  );
}
