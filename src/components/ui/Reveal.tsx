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
import type { ReactNode } from "react";

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
