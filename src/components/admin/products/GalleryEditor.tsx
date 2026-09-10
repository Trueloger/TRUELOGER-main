"use client";

// src/components/admin/products/GalleryEditor.tsx
// Exactly 5 fixed gallery slots (main/angle/closeup/detail/lifestyle
// per ProductGallerySlot) — the admin only sets a label and a `src`
// URL for each slot, no file upload (this site has no image-upload
// pipeline yet, per the task brief). Mirrors the same placeholder
// language as ProductThumb/GemstoneImagePlaceholder when a slot has no
// `src` yet.
import type { ProductGallerySlot } from "@/lib/products/types";
import { ProductThumb } from "./ProductThumb";
import { INPUT_CLASS, LABEL_CLASS } from "./form-styles";

export type GalleryRow = { role: ProductGallerySlot["role"]; label: string; src: string };

export const GALLERY_ROLE_ORDER: ProductGallerySlot["role"][] = ["main", "angle", "closeup", "detail", "lifestyle"];

const ROLE_TITLES: Record<ProductGallerySlot["role"], string> = {
  main: "Main product view",
  angle: "Alternate angle",
  closeup: "Close-up detail",
  detail: "Certificate / product detail",
  lifestyle: "Worn / lifestyle setting",
};

export function emptyGallery(namePrefix: string): GalleryRow[] {
  return GALLERY_ROLE_ORDER.map((role) => ({
    role,
    label: `${namePrefix || "Product"} — ${ROLE_TITLES[role].toLowerCase()}`,
    src: "",
  }));
}

export function GalleryEditor({ gallery, onChange }: { gallery: GalleryRow[]; onChange: (gallery: GalleryRow[]) => void }) {
  function updateSlot(index: number, patch: Partial<GalleryRow>) {
    onChange(gallery.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  }

  return (
    <div className="rounded-2xl border border-nav-lavender-line bg-white p-4 sm:p-5">
      <h2 className="font-serif text-lg text-nav-violet">Gallery</h2>
      <p className="mt-1 text-xs text-nav-plum/60">5 fixed slots. Set an image URL and label for each — slots without a URL show a placeholder.</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {gallery.map((slot, index) => (
          <div key={slot.role} className="flex flex-col gap-2 rounded-xl border border-nav-lavender-line bg-nav-pearl/60 p-3">
            <div className="h-28 w-full">
              <ProductThumb src={slot.src || undefined} alt={slot.label} />
            </div>
            <span className="text-[0.68rem] font-semibold uppercase tracking-wide text-nav-amethyst-deep">{ROLE_TITLES[slot.role]}</span>
            <div>
              <span className={LABEL_CLASS}>Label</span>
              <input
                value={slot.label}
                onChange={(e) => updateSlot(index, { label: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <span className={LABEL_CLASS}>Image URL</span>
              <input
                value={slot.src}
                onChange={(e) => updateSlot(index, { src: e.target.value })}
                placeholder="https://…"
                className={INPUT_CLASS}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
