"use client";

// src/app/template.tsx
// Next.js re-mounts template.tsx's subtree on every navigation (unlike
// layout.tsx, which persists) — that remount is exactly what drives a
// short enter-only transition on every route change: a brief fade +
// slight upward settle, not a cross-fade (Next unmounts the old route
// before this mounts, so there's no old/new coexistence window for a
// true exit animation) and not a spinner/curtain, per the "feel like
// an app, not an intro animation" guidance. Respects reduced-motion
// automatically via the root MotionConfig in layout.tsx.
//
// flex flex-1 flex-col matches every page's own root element (e.g.
// src/app/page.tsx's `<main className="flex flex-1 flex-col">`) so
// this wrapper doesn't break the sticky-footer layout that depends on
// being a direct flex-1 item of <body>'s flex-col (see SiteChrome.tsx)
// — without this, the page content would stop growing to fill the
// viewport and the footer would ride up under short pages.
import { motion } from "motion/react";
import type { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
