"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Star, X } from "lucide-react";
import type { Testimonial } from "./testimonial-data";

/**
 * Centered, focus-trapped expanded view of a testimonial card — opened
 * by TestimonialCard's onExpand, closed by the backdrop, the X button,
 * or Escape. Mounted directly under TestimonialsSection's outer
 * <section> (no transform there), so this panel's `fixed` positioning
 * escapes the marquee's `overflow-hidden` correctly.
 */
export function ExpandedTestimonial({
  testimonial,
  onClose,
}: {
  testimonial: Testimonial;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <>
      <motion.button
        type="button"
        aria-label="Close testimonial"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 cursor-default bg-nav-violet/40 backdrop-blur-sm"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Testimonial from ${testimonial.name}`}
          initial={{ opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 6 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative flex max-h-[85vh] w-full max-w-md flex-col items-center overflow-y-auto rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-8 text-center shadow-[0_30px_70px_-20px_rgba(60,30,100,0.45)] [padding-bottom:max(2rem,env(safe-area-inset-bottom))]"
        >
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-nav-plum/60 transition-colors duration-150 hover:bg-nav-lavender-mist hover:text-nav-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst"
          >
            <X className="h-5 w-5" />
          </button>

          <span aria-hidden="true" className="text-2xl leading-none text-nav-gold">
            ✦
          </span>

          <div className="mt-3 flex items-center justify-center gap-1" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-nav-gold text-nav-gold" />
            ))}
          </div>
          <span className="sr-only">Rated 5 out of 5</span>

          <blockquote className="mt-4 text-[1.05rem] leading-relaxed text-nav-plum/85">
            &ldquo;{testimonial.text}&rdquo;
          </blockquote>

          <footer className="mt-6 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nav-lavender-soft text-base font-semibold text-nav-plum">
              {testimonial.name.charAt(0)}
            </span>
            <cite className="text-left not-italic">
              <span className="block font-serif font-semibold text-nav-plum">{testimonial.name}</span>
              <span className="block text-xs text-nav-plum/60">
                {testimonial.service}
                {testimonial.location ? ` · ${testimonial.location}` : ""}
              </span>
            </cite>
          </footer>
        </motion.div>
      </div>
    </>
  );
}
