"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import type { ZodiacCardData } from "./zodiac-ui-data";

// Session-only (never localStorage — this is "where was I a moment
// ago", not a durable preference) memory of which sign the user last
// opened from the homepage carousel/grid, so returning via the
// browser's Back button can highlight that exact card instead of the
// homepage silently resetting to Aries. Cleared the instant it's
// consumed, so a normal fresh visit never shows a stray highlight.
const LAST_SIGN_KEY = "truelogr:horoscope:last-sign";

export function rememberLastZodiacSign(slug: string) {
  try {
    sessionStorage.setItem(LAST_SIGN_KEY, slug);
  } catch {
    // sessionStorage unavailable (private mode, etc.) — losing the
    // return-highlight is a cosmetic no-op, never worth failing on.
  }
}

/** One zodiac sign, linking to its reading page. Sized entirely via
 * cqw/clamp() so it scales cleanly whether it's one of six in the
 * desktop grid or one of four visible in the mobile carousel — same
 * container-query approach as ProductCard. Equal width/height comes
 * from the parent grid/flex, not a fixed size here. */
export function ZodiacCard({ slug, name, dateRange, Icon }: ZodiacCardData) {
  const [justReturned, setJustReturned] = useState(false);

  useEffect(() => {
    let remembered: string | null = null;
    try {
      remembered = sessionStorage.getItem(LAST_SIGN_KEY);
    } catch {
      return;
    }
    if (remembered !== slug) return;
    // Consume once — the grid and carousel both mount this slug's card
    // simultaneously (one hidden via CSS, not unmounted), so clearing
    // here is idempotent between them, not a race.
    try {
      sessionStorage.removeItem(LAST_SIGN_KEY);
    } catch {
      /* ignore */
    }
    // Deferred a tick (not called directly in the effect body) so this
    // doesn't force a same-frame cascading render on mount.
    const showTimer = setTimeout(() => setJustReturned(true), 0);
    const hideTimer = setTimeout(() => setJustReturned(false), 900);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [slug]);

  return (
    <motion.div
      animate={justReturned ? { scale: [1, 1.06, 1] } : undefined}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`h-full rounded-2xl transition-shadow duration-500 ${
        justReturned ? "shadow-[0_0_0_3px_var(--color-nav-amethyst)]" : ""
      }`}
    >
      <Link
        href={`/horoscope/${slug}`}
        onClick={() => rememberLastZodiacSign(slug)}
        aria-label={`${name} daily horoscope, ${dateRange}`}
        className="group flex h-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-nav-pearl to-nav-lavender-mist px-1.5 py-4 text-center shadow-[0_6px_18px_-12px_rgba(70,40,120,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-nav-amethyst/50 hover:shadow-[0_14px_28px_-14px_rgba(70,40,120,0.4)]"
      >
        <Icon
          className="h-[clamp(1.6rem,6cqw,2.5rem)] w-[clamp(1.6rem,6cqw,2.5rem)] text-nav-amethyst-deep transition-colors duration-300 group-hover:text-nav-amethyst"
          strokeWidth={1.4}
        />
        <span className="font-serif text-[clamp(0.75rem,3.4cqw,0.95rem)] leading-tight text-nav-violet">
          {name}
        </span>
        <span className="text-[clamp(0.6rem,2.6cqw,0.7rem)] text-nav-plum/60">
          {dateRange}
        </span>
      </Link>
    </motion.div>
  );
}
