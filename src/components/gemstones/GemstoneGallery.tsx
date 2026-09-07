"use client";

// The 5-image gallery for a gemstone product-page (/gemstones/[slug]).
// Mobile: one main image with a tap-to-switch thumbnail row below it.
// Desktop: main image with a thumbnail column beside it. Every slot
// renders through GemstoneImagePlaceholder today (no product has a real
// `src` yet) but each slot branches on `slot.src` so real photography
// drops into the exact same layout later without touching this file —
// see the doc comment on GemstoneGallerySlot in lib/gemstones/types.ts.
//
// No fullscreen lightbox here (tap just switches the main slot) — so
// the DurationSheet.tsx "fixed inside a transformed ancestor" bug this
// site has already hit does not apply; if a lightbox is added later it
// must be portaled to document.body the same way that fix was.
import { useState } from "react";
import Image from "next/image";
import type { GemstoneGallerySlot } from "@/lib/gemstones/types";
import { GemstoneImagePlaceholder } from "./GemstoneImagePlaceholder";

export function GemstoneGallery({ gallery }: { gallery: GemstoneGallerySlot[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = gallery[activeIndex] ?? gallery[0];

  return (
    <div className="flex flex-col gap-3 md:flex-row md:gap-4">
      {/* Thumbnail column — desktop only, sits left of the main image */}
      <div className="hidden shrink-0 flex-col gap-2.5 md:flex md:w-20">
        {gallery.map((slot, i) => (
          <GalleryThumbnail
            key={slot.role}
            slot={slot}
            active={i === activeIndex}
            onSelect={() => setActiveIndex(i)}
          />
        ))}
      </div>

      {/* Main image */}
      <div className="min-w-0 flex-1">
        <GallerySlotImage slot={active} className="rounded-2xl" priority />
      </div>

      {/* Thumbnail row — mobile only, sits below the main image */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 md:hidden">
        {gallery.map((slot, i) => (
          <div key={slot.role} className="w-16 shrink-0">
            <GalleryThumbnail
              slot={slot}
              active={i === activeIndex}
              onSelect={() => setActiveIndex(i)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryThumbnail({
  slot,
  active,
  onSelect,
}: {
  slot: GemstoneGallerySlot;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Show ${slot.label}`}
      aria-pressed={active}
      className={`block w-full overflow-hidden rounded-lg border-2 transition-colors duration-150 ${
        active ? "border-nav-amethyst" : "border-transparent hover:border-nav-lavender-line"
      }`}
    >
      <GallerySlotImage slot={slot} />
    </button>
  );
}

function GallerySlotImage({
  slot,
  className = "",
  priority = false,
}: {
  slot: GemstoneGallerySlot;
  className?: string;
  priority?: boolean;
}) {
  if (slot.src) {
    return (
      <div className={`relative aspect-[4/5] w-full overflow-hidden ${className}`}>
        <Image
          src={slot.src}
          alt={slot.label}
          fill
          sizes="(min-width: 768px) 40vw, 90vw"
          className="object-cover"
          priority={priority}
        />
      </div>
    );
  }
  return <GemstoneImagePlaceholder alt={slot.label} className={className} />;
}
