import { Star } from "lucide-react";
import type { Testimonial } from "./testimonial-data";

/**
 * A single testimonial card, fixed width/height so every card in a
 * marquee row lines up identically regardless of quote length (the quote
 * itself is line-clamped to guarantee this). No <Link> — these are
 * decorative/informational, not clickable — so real semantic markup
 * (<blockquote>/<cite>) carries the content instead of a div soup,
 * matching the "must stay real, accessible HTML" requirement for a
 * section built mostly out of CSS-animated marquee rows.
 */
export function TestimonialCard({
  testimonial,
  ariaHidden,
}: {
  testimonial: Testimonial;
  ariaHidden?: boolean;
}) {
  return (
    <article
      aria-hidden={ariaHidden || undefined}
      className="flex h-[260px] w-[240px] shrink-0 flex-col items-center rounded-2xl border border-nav-lavender-line bg-nav-pearl px-5 py-6 text-center shadow-[0_8px_24px_-14px_rgba(90,55,140,0.3)] transition-transform duration-300 md:hover:-translate-y-1 md:hover:border-nav-amethyst/40 md:hover:shadow-[0_16px_32px_-14px_rgba(90,55,140,0.38)] sm:h-[270px] sm:w-[280px] sm:px-6 md:w-[300px]"
    >
      <span aria-hidden="true" className="text-lg leading-none text-nav-gold">
        ✦
      </span>

      <div className="mt-2.5 flex items-center justify-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={
              i < testimonial.rating
                ? "h-3.5 w-3.5 fill-nav-gold text-nav-gold"
                : "h-3.5 w-3.5 fill-nav-lavender-line text-nav-lavender-line"
            }
          />
        ))}
      </div>
      <span className="sr-only">Rated {testimonial.rating} out of 5</span>

      <blockquote className="mt-3 line-clamp-4 text-[0.9rem] leading-relaxed text-nav-plum/80">
        &ldquo;{testimonial.text}&rdquo;
      </blockquote>

      <footer className="mt-auto flex w-full items-center gap-3 pt-4 text-left">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nav-lavender-soft text-sm font-semibold text-nav-plum"
        >
          {testimonial.name.charAt(0)}
        </span>
        <cite className="min-w-0 flex-1 not-italic">
          <span className="block truncate font-serif font-semibold text-nav-plum">
            {testimonial.name}
          </span>
          <span className="block truncate text-xs text-nav-plum/60">
            {testimonial.service}
            {testimonial.location ? ` · ${testimonial.location}` : ""}
          </span>
        </cite>
      </footer>
    </article>
  );
}
