import Link from "next/link";
import Image from "next/image";
import { LotusIcon } from "@/components/quick-services/icons";
import { EXPLORE_SERVICES, type ExploreService } from "./explore-services-data";
import { EXPLORE_SERVICE_ART } from "./explore-service-art";

export function ExploreServices() {
  return (
    <section
      aria-labelledby="explore-services-heading"
      className="relative py-16 md:py-24"
    >
      {/* No background here — the page-level wrapper (see page.tsx) now
          paints one continuous wash behind this, QuickServices and
          PersonalizedReportsBanner together, so there's no per-section
          edge that has to line up pixel-perfectly with its neighbour. */}
      <div className="relative mx-auto max-w-[1320px] px-4 sm:px-6 md:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-md text-center sm:max-w-xl md:max-w-2xl">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
            <LotusIcon className="h-6 w-6 text-nav-amethyst-deep" strokeWidth={1.3} />
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          </div>

          <h2
            id="explore-services-heading"
            className="mt-3 scroll-mt-28 font-serif text-[2rem] leading-[1.15] text-nav-violet sm:text-4xl md:scroll-mt-32 md:text-5xl"
          >
            Explore Your Path
            <br />
            <span className="text-nav-amethyst">of Guidance</span>
          </h2>
        </div>

        {/* Cards — the images already contain title/description/CTA, so
            each card is just the image plus real (visually-hidden) text
            for accessibility and search crawlability. */}
        <ul className="mt-8 grid grid-cols-3 gap-2 sm:gap-4 md:mt-14 lg:grid-cols-6 lg:gap-4">
          {EXPLORE_SERVICES.map((service) => (
            <li key={service.id}>
              <ServiceCard service={service} />
            </li>
          ))}
        </ul>

        {/* View All Services CTA */}
        <div className="mt-10 flex justify-center md:mt-14">
          <Link
            href="/consult"
            className="group flex w-full items-center justify-center gap-3 rounded-full border border-nav-amethyst/40 bg-nav-lavender-mist px-6 py-3.5 text-[0.95rem] font-medium text-nav-violet shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-nav-lavender-soft hover:shadow-[0_16px_32px_-14px_rgba(70,40,120,0.4)] sm:w-auto sm:px-8"
          >
            <LotusIcon className="h-4 w-4 shrink-0 text-nav-amethyst-deep" strokeWidth={1.3} />
            <span className="font-serif text-base">View All Services</span>
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

// One shared box ratio for every card. The six source crops aren't
// pixel-identical (216–235 × 399–403), so sizing each card to its own
// image's exact ratio made the row visibly uneven — every card now uses
// this same ratio, with object-fit: contain absorbing the small per-image
// variance instead of it showing up as a size mismatch.
const CARD_ASPECT = "223 / 401";

function ServiceCard({ service }: { service: ExploreService }) {
  const art = EXPLORE_SERVICE_ART[service.id];

  return (
    <Link
      href={service.href}
      aria-label={`${service.title} — ${service.description}`}
      className="group relative block transition-transform duration-300 hover:-translate-y-1"
    >
      <span
        className="relative block w-full drop-shadow-[0_10px_24px_rgba(70,40,120,0.18)] transition-[filter] duration-300 group-hover:drop-shadow-[0_18px_34px_rgba(70,40,120,0.3)]"
        style={{ aspectRatio: CARD_ASPECT }}
      >
        <Image
          src={art.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 16vw, 32vw"
          quality={100}
          className="object-contain"
        />
      </span>
      {/* real, crawlable text — the visual is the image, this keeps the
          content accessible and indexable */}
      <span className="sr-only">
        {service.title}. {service.description} Explore Service.
      </span>
    </Link>
  );
}
