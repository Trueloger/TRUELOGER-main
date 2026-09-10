// src/components/admin/products/ProductThumb.tsx
// Small square thumbnail used in the admin product list — renders the
// product's `image.src` when set, otherwise the same restrained ivory/
// lavender gradient placeholder language as
// src/components/gemstones/GemstoneImagePlaceholder.tsx, generalized
// with a neutral "package" glyph rather than a gemstone-only one since
// this thumbnail covers every product category, not just gemstones.
import { Package } from "lucide-react";

export function ProductThumb({ src, alt, className = "" }: { src?: string; alt: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- admin-entered arbitrary URLs, not a static/optimizable asset
    return <img src={src} alt={alt} className={`h-full w-full rounded-xl object-cover ${className}`} />;
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-nav-lavender-mist via-nav-pearl to-nav-lavender-soft ${className}`}
    >
      <Package aria-hidden="true" className="h-[38%] w-[38%] text-nav-amethyst/30" />
    </div>
  );
}
