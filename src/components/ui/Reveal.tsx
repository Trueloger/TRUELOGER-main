"use client";

// src/components/ui/Reveal.tsx
// Shared scroll-reveal wrapper — a section heading or card grid fades
// and lifts slightly into place the first time it enters the
// viewport, then never re-triggers (viewport once:true). Used
// selectively (section headings, card grids, promotional banners),
// never on every paragraph/icon — see each page's usage. Respects
// prefers-reduced-motion automatically: Motion's `useReducedMotion`
// isn't needed here since a 16px translate + opacity fade is exactly
// the kind of "short fade" the reduced-motion guidance keeps, not the
// kind of motion it strips (no parallax, no continuous movement).
import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Per-card stagger variant — a card grid uses this instead of Reveal
// when each card should fade/lift in with a small cascade rather than
// the whole grid appearing as one block. StaggerContainer orchestrates
// (whileInView, once) and StaggerItem is the per-card fade+lift; since
// each card here IS its own image (ExploreServices/HealingSection/
// PujaCard/GemstoneCard are all Image-in-Link cards), this cascade
// doubles as the "image reveal" the spec asks for — no separate
// per-image onLoad animation needed on top of it.
export const STAGGER_CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export function StaggerContainer({
  children,
  className,
  style,
  as: Component = motion.div,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: typeof motion.div | typeof motion.ul;
}) {
  return (
    <Component
      variants={STAGGER_CONTAINER}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className={className}
      style={style}
    >
      {children}
    </Component>
  );
}
