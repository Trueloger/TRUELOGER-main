// src/components/admin/products/form-styles.ts
// Shared Tailwind class strings for the product form's inputs, so every
// field across VariantEditor/GalleryEditor/AttributesEditor/FaqEditor
// and the main [id]/page.tsx form matches the same input styling
// admin/orders/page.tsx already uses for its search box, rather than
// each component inventing its own.
export const INPUT_CLASS =
  "w-full min-h-10 rounded-lg border border-nav-lavender-line bg-white px-3 py-2 text-sm text-nav-violet outline-none focus:border-nav-amethyst focus:ring-2 focus:ring-nav-amethyst/30 disabled:cursor-not-allowed disabled:bg-nav-lavender-mist disabled:text-nav-plum/60";

export const TEXTAREA_CLASS = `${INPUT_CLASS} min-h-24 resize-y py-2`;

export const LABEL_CLASS = "mb-1 block text-[0.68rem] font-medium uppercase tracking-wide text-nav-plum/60";
