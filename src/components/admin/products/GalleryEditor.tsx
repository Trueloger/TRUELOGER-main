"use client";

// src/components/admin/products/GalleryEditor.tsx
// Exactly 5 fixed gallery slots (main/angle/closeup/detail/lifestyle
// per ProductGallerySlot). Each slot's `src` can be set either by
// uploading an image file directly (POSTs to
// /api/admin/products/upload-image, which stores it in Firebase
// Storage and returns a public URL) or by pasting a URL directly —
// upload is the primary path now that one exists, the URL field stays
// as a fallback for an image already hosted elsewhere. Mirrors the
// same placeholder language as ProductThumb/GemstoneImagePlaceholder
// when a slot has no `src` yet.
import { useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import type { ProductGallerySlot } from "@/lib/products/types";
import { authedFetch } from "@/lib/auth/authed-fetch";
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingRole, setUploadingRole] = useState<ProductGallerySlot["role"] | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function updateSlot(index: number, patch: Partial<GalleryRow>) {
    onChange(gallery.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  }

  async function handleFileSelected(index: number, role: ProductGallerySlot["role"], file: File) {
    setUploadError(null);
    setUploadingRole(role);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await authedFetch("/api/admin/products/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        setUploadError(data?.error ?? "Upload failed. Please try again.");
        return;
      }
      updateSlot(index, { src: data.url });
    } catch {
      setUploadError("Network error while uploading. Please try again.");
    } finally {
      setUploadingRole(null);
    }
  }

  return (
    <div className="rounded-2xl border border-nav-lavender-line bg-white p-4 sm:p-5">
      <h2 className="font-serif text-lg text-nav-violet">Gallery</h2>
      <p className="mt-1 text-xs text-nav-plum/60">
        5 fixed slots. Upload a photo directly, or paste an image URL if it&apos;s already hosted
        elsewhere — slots without an image show a placeholder. JPEG, PNG, or WEBP, up to 5MB.
      </p>

      {uploadError && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {uploadError}
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {gallery.map((slot, index) => {
          const isUploading = uploadingRole === slot.role;
          return (
            <div key={slot.role} className="flex flex-col gap-2 rounded-xl border border-nav-lavender-line bg-nav-pearl/60 p-3">
              <div className="h-28 w-full">
                <ProductThumb src={slot.src || undefined} alt={slot.label} />
              </div>
              <span className="text-[0.68rem] font-semibold uppercase tracking-wide text-nav-amethyst-deep">{ROLE_TITLES[slot.role]}</span>

              <input
                ref={(el) => {
                  fileInputRefs.current[slot.role] = el;
                }}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = ""; // allow re-selecting the same file next time
                  if (file) void handleFileSelected(index, slot.role, file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRefs.current[slot.role]?.click()}
                disabled={isUploading}
                className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-nav-lavender-line bg-white px-2 py-1.5 text-xs font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? (
                  <>
                    <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <UploadCloud aria-hidden="true" className="h-3.5 w-3.5" />
                    {slot.src ? "Replace photo" : "Upload photo"}
                  </>
                )}
              </button>

              <div>
                <span className={LABEL_CLASS}>Label</span>
                <input
                  value={slot.label}
                  onChange={(e) => updateSlot(index, { label: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <span className={LABEL_CLASS}>Image URL (or upload above)</span>
                <input
                  value={slot.src}
                  onChange={(e) => updateSlot(index, { src: e.target.value })}
                  placeholder="https://…"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
