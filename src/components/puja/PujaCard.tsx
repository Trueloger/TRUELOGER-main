import Link from "next/link";
import Image from "next/image";
import type { PujaService } from "./puja-data";

// The approved card artwork (border, puja photo, "Book Now →" button,
// corner ornaments, bottom lotus) — one shared asset, reused unscaled
// across all six cards. Its native ratio is preserved via CARD_ASPECT so
// nothing stretches; the browser only ever downloads it once regardless
// of how many cards render.
const CARD_SRC = "/puja cards.png";
const CARD_ASPECT = "512 / 768";

// The blank lavender band on the template, measured off the reference
// image as a fraction of the card's height — between the puja photo and
// the pre-made button. Overlay content is confined to this band so it
// never touches the artwork, the button, or the bottom lotus.
const CONTENT_TOP = "48%";
const CONTENT_BOTTOM = "17%";

export function PujaCard({ service }: { service: PujaService }) {
  return (
    <Link
      href={service.href}
      aria-label={`${service.title} — ${service.description} Book Now.`}
      className="group @container relative block w-full transition-transform duration-300 md:hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl"
      style={{ aspectRatio: CARD_ASPECT }}
    >
      <Image
        src={CARD_SRC}
        alt=""
        fill
        sizes="(min-width: 1024px) 30vw, (min-width: 480px) 45vw, 85vw"
        quality={95}
        loading="lazy"
        className="object-contain transition-[filter] duration-300 md:drop-shadow-[0_14px_30px_rgba(90,55,140,0.2)] md:group-hover:drop-shadow-[0_22px_42px_rgba(90,55,140,0.32)]"
      />

      {/* Real HTML content, positioned inside the template's blank area. */}
      <div
        className="absolute inset-x-[9%] flex flex-col items-center justify-center gap-[2.2cqw] px-[2%] text-center @sm:gap-2"
        style={{ top: CONTENT_TOP, bottom: CONTENT_BOTTOM }}
      >
        <span aria-hidden="true" className="text-[3.2cqw] leading-none text-nav-amethyst">
          ✦
        </span>

        <h3 className="font-serif font-semibold leading-tight text-nav-plum text-[clamp(0.95rem,6.5cqw,1.3rem)]">
          {service.title}
        </h3>

        <p className="line-clamp-3 leading-snug text-nav-plum/75 text-[clamp(0.55rem,4cqw,0.85rem)]">
          {service.description}
        </p>

        <span className="text-nav-amethyst-deep/70 text-[clamp(0.48rem,3.4cqw,0.75rem)]">
          {service.detail}
        </span>
      </div>
    </Link>
  );
}
