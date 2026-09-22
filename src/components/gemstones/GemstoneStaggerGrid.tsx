"use client";

// src/components/gemstones/GemstoneStaggerGrid.tsx
// Desktop grid for ProductsSection's homepage showcase, with per-card
// stagger reveal — pulled into its own client component because
// ProductsSection itself is an async Server Component (it fetches the
// product list) and passing a component reference like `motion.ul` as
// a prop across that server/client boundary is the same category of
// bug this session already hit once (ZodiacGrid/ZodiacCard's Icon
// prop) — safer to keep the motion.* usage entirely inside a client
// file and only pass serializable data (the product array) in.
import { motion } from "motion/react";
import { GemstoneCard } from "./GemstoneCard";
import { StaggerContainer, STAGGER_ITEM } from "@/components/ui/Reveal";
import type { GemstoneProduct } from "@/lib/gemstones/types";

export function GemstoneStaggerGrid({ products }: { products: GemstoneProduct[] }) {
  return (
    <StaggerContainer as={motion.ul} className="hidden md:grid sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
      {products.map((product) => (
        <motion.li key={product.id} variants={STAGGER_ITEM}>
          <GemstoneCard product={product} />
        </motion.li>
      ))}
    </StaggerContainer>
  );
}
