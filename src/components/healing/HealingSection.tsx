import Link from "next/link";
import Image from "next/image";
import { LotusIcon } from "@/components/quick-services/icons";
import { HEALING_SERVICES, type HealingService } from "./healing-data";
import { HEALING_ART } from "./healing-art";
import { CrystalCluster, DiyaCandle, FourPointStar, LavenderFlower, MandalaRing } from "./decorative";

/**
 * Restore Your Inner Balance — the four healing-service cards (Chakra
 * Healing, Aura Cleansing, Relationship Healing, Money Healing) plus a
 * primary "Book Your Healing Session" CTA. Each card is a single
 * pre-designed image (medallion artwork, title, description and its own
 * "Explore Healing" line already baked in) — the same approach used for
 * Explore Services' cards — so this component only supplies the section
 * chrome: heading, ambient sacred-geometry background, corner framing,
 * the cards grid and the main CTA. No background of its own: the shared
 * wash in page.tsx carries the ivory→lavender colour through from the
 * sections above so there's no per-section edge to misalign.
 */
export function HealingSection() {
  return (
    <section aria-labelledby="healing-heading" className="relative">
      <HealingAtmosphere />

      <div className="relative mx-auto max-w-[1320px] px-4 py-16 sm:px-6 md:px-8 md:py-24">
        {/* Heading */}
        <div className="mx-auto max-w-md text-center sm:max-w-xl md:max-w-2xl">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
            <LotusIcon className="h-6 w-6 text-nav-amethyst-deep" strokeWidth={1.3} />
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          </div>

          <h2
            id="healing-heading"
            className="mt-3 font-serif text-[2rem] leading-[1.15] text-nav-plum sm:text-4xl md:text-5xl"
          >
            Restore Your
            <br />
            <span className="text-nav-amethyst">Inner Balance</span>
          </h2>

          <p className="mx-auto mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80 sm:max-w-md sm:text-base">
            Explore thoughtful healing practices designed to bring harmony to
            your energy, emotions and everyday life.
          </p>
        </div>

        {/* Cards — 2x2 on mobile, one row of four from lg up. Each image
            already contains the title, description and CTA line, so we
            only add real (visually-hidden) text alongside for
            accessibility and search crawlability. */}
        <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:gap-5 md:mt-14 lg:max-w-none lg:grid-cols-4 lg:gap-6">
          {HEALING_SERVICES.map((service) => (
            <li key={service.id}>
              <HealingCard service={service} />
            </li>
          ))}
        </ul>

        {/* Primary CTA */}
        <div className="mt-10 flex justify-center md:mt-14">
          <Link
            href="/consult/healing"
            className="group flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-b from-nav-amethyst to-nav-amethyst-deep px-7 py-4 text-nav-pearl shadow-[0_18px_40px_-16px_rgba(106,60,176,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-14px_rgba(106,60,176,0.65)] sm:w-auto sm:px-9"
          >
            <LotusIcon className="h-5 w-5 shrink-0 text-nav-pearl" strokeWidth={1.4} />
            <span className="font-serif text-[1.02rem] sm:text-lg">Book Your Healing Session</span>
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function HealingCard({ service }: { service: HealingService }) {
  const art = HEALING_ART[service.id];

  return (
    <Link
      href={service.href}
      aria-label={`${service.title} — ${service.description} Explore Healing.`}
      className="group relative block transition-transform duration-300 hover:-translate-y-1"
    >
      <span className="relative block w-full overflow-hidden rounded-[1.4rem] drop-shadow-[0_12px_26px_rgba(90,55,140,0.2)] transition-[filter] duration-300 group-hover:drop-shadow-[0_20px_38px_rgba(90,55,140,0.32)]">
        <Image
          src={art.src}
          alt=""
          width={art.width}
          height={art.height}
          sizes="(min-width: 1024px) 22vw, 45vw"
          quality={95}
          className="h-auto w-full transition-[filter] duration-300 group-hover:brightness-[1.03]"
        />
      </span>
      {/* Real, crawlable text — the visual is the card image, this keeps
          the service names and descriptions accessible and indexable. */}
      <span className="sr-only">
        {service.title}. {service.description} Explore Healing.
      </span>
    </Link>
  );
}

/** Ambient sacred geometry + corner floral/crystal/diya framing. Purely
 * decorative (aria-hidden), extremely low opacity, and scoped to its own
 * absolutely-positioned layer so clipping it never touches the section's
 * own box (no background of its own to risk misaligning with neighbouring
 * sections — see the comment in page.tsx). */
function HealingAtmosphere() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Faint mandala rings, upper corners */}
      <MandalaRing className="absolute -left-16 -top-10 h-48 w-48 text-nav-orchid/25 sm:h-64 sm:w-64 md:-left-10 md:-top-16 md:h-80 md:w-80" />
      <MandalaRing className="absolute -right-16 -top-16 h-48 w-48 text-nav-orchid/20 sm:h-64 sm:w-64 md:-right-10 md:-top-20 md:h-80 md:w-80" />
      <MandalaRing className="absolute -bottom-24 left-1/2 hidden h-72 w-72 -translate-x-1/2 text-nav-orchid/15 md:block" />

      {/* Tiny scattered sparkles */}
      {[
        { top: "10%", left: "18%", size: 5 },
        { top: "16%", left: "82%", size: 4 },
        { top: "46%", left: "6%", size: 4 },
        { top: "52%", left: "94%", size: 5 },
        { top: "88%", left: "30%", size: 4 },
        { top: "84%", left: "70%", size: 4 },
      ].map((s, i) => (
        <FourPointStar
          key={i}
          style={{ top: s.top, left: s.left, width: s.size, height: s.size }}
          className="absolute text-nav-gold/40"
        />
      ))}

      {/* Bottom-left framing: flowers + crystal + diya */}
      <div className="absolute -bottom-2 -left-4 flex items-end gap-1 opacity-70 sm:opacity-90 md:bottom-0 md:left-0">
        <CrystalCluster className="h-12 w-12 text-nav-amethyst sm:h-16 sm:w-16 md:h-20 md:w-20" />
        <LavenderFlower className="mb-3 h-6 w-6 text-nav-orchid sm:h-8 sm:w-8" />
        <DiyaCandle className="mb-1 hidden h-10 w-10 text-nav-gold sm:block md:h-12 md:w-12" />
      </div>

      {/* Bottom-right framing: mirrored */}
      <div className="absolute -bottom-2 -right-4 flex items-end gap-1 opacity-70 sm:opacity-90 md:bottom-0 md:right-0">
        <DiyaCandle className="mb-1 hidden h-10 w-10 text-nav-gold sm:block md:h-12 md:w-12" />
        <LavenderFlower className="mb-3 h-6 w-6 text-nav-orchid sm:h-8 sm:w-8" />
        <CrystalCluster className="h-12 w-12 scale-x-[-1] text-nav-amethyst sm:h-16 sm:w-16 md:h-20 md:w-20" />
      </div>
    </div>
  );
}
