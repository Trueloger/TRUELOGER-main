"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "./product-data";
import { useCart } from "@/context/CartContext";

// Crop ratio shared by every file in public/gemstones image/cards/ — see
// product-data.ts for why the source canvases needed cropping at all.
const CARD_ASPECT = "440 / 730";

// The blank rounded box baked into every card template, measured off the
// artwork (pixel-sampled on the 440x730 crop: box spans x 52-388, y
// 554-655) as a fraction of the card's size — sits between the subtitle
// and the bottom lotus mark. The real Add to Cart button lives inside it
// so nothing overlaps the artwork. Both the vertical band and the
// horizontal inset are deliberately tighter than the box's own edges so
// the button never touches the box border or covers the corner
// ornaments baked into the art. The box is only ~14% of the card's
// height, too short for a full 44px touch target at small card sizes —
// the button is sized with cqw/clamp (no fixed px floor) so it always
// stays comfortably inside the box instead of overflowing it.
const CTA_TOP = "79%";
const CTA_BOTTOM = "9.5%";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    addItem({ id: product.id, name: product.name });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <article className="@container relative block w-full" style={{ aspectRatio: CARD_ASPECT }}>
      {/* Real, accessible product title — the card art bakes the name in
          as pixels, so this gives screen-reader heading navigation a real
          DOM node without visually duplicating text already on screen. */}
      <h3 className="sr-only">{product.name}</h3>

      <Image
        src={product.image}
        alt={`${product.name} — ${product.subtitle}`}
        fill
        sizes="(min-width: 1024px) 15vw, (min-width: 640px) 30vw, 45vw"
        quality={95}
        loading="lazy"
        className="object-contain"
      />

      <div
        className="absolute inset-x-[15%] flex items-center justify-center"
        style={{ top: CTA_TOP, bottom: CTA_BOTTOM }}
      >
        <button
          type="button"
          onClick={handleAdd}
          aria-label={`Add ${product.name} to Cart`}
          className="flex w-full items-center justify-center rounded-full bg-nav-amethyst px-[4%] py-[clamp(0.15rem,1.1cqw,0.35rem)] text-[clamp(0.58rem,2.3cqw,0.72rem)] font-medium tracking-wide text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl active:scale-[0.97]"
        >
          {justAdded ? "Added ✓" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}
