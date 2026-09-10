// src/lib/products/gemstone-adapter.ts
// Translates the new unified Firestore `Product` (products/types.ts)
// into the OLD static `GemstoneProduct` shape (gemstones/types.ts) that
// the existing gemstone UI (GemstoneCard, RattiSheet,
// GemstoneRattiSelector, GemstoneGallery, GemstoneCarousel) already
// expects and reads directly. This is what lets the gemstone catalogue
// migrate to the new admin-manageable Firestore store WITHOUT touching
// any of those already-shipped, already-verified components — they
// keep reading `product.rattiOptions`/`product.pricing`/`product.
// indianName` exactly as before; only the two page-level server
// components (/gemstones/page.tsx and /gemstones/[slug]/page.tsx) know
// this adapter exists at all.
//
// Only meaningful for category "gemstone" — every gemstone variant's
// id IS its Ratti number as a string (enforced by
// scripts/dev/seed-products.ts and by the admin Product form for this
// category), so `Number(variant.id)` is always a real Ratti value here.
import type { Product } from "./types";
import type { GemstoneProduct, GemstonePricingMatrix, RattiValue } from "@/lib/gemstones/types";

export function toGemstoneProduct(product: Product): GemstoneProduct {
  const pricing: GemstonePricingMatrix = {};
  const rattiOptions: RattiValue[] = [];
  for (const variant of product.variants) {
    const ratti = variant.ratti ?? Number(variant.id);
    rattiOptions.push(ratti);
    pricing[ratti] = { mrp: variant.mrp, salePrice: variant.salePrice, inStock: variant.inStock };
  }
  rattiOptions.sort((a, b) => a - b);

  const defaultVariant = product.variants.find((v) => v.id === product.defaultVariantId) ?? product.variants[0];
  const defaultRatti = defaultVariant.ratti ?? Number(defaultVariant.id);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    indianName: product.attributes.alternateName,
    category: mapCategory(product),
    shortDescription: product.shortDescription,
    description: product.description,
    image: product.image,
    gallery: product.gallery,
    rattiOptions,
    defaultRatti,
    pricing,
    rulingPlanet: product.attributes.rulingPlanet ?? "—",
    associatedDay: product.attributes.associatedDay,
    associatedMetal: product.attributes.associatedMetal,
    wearingFinger: product.attributes.wearingFinger,
    wearingMethod: product.attributes.wearingMethod,
    careInstructions: product.attributes.careInstructions ?? [],
    benefits: product.attributes.benefits ?? [],
    astrologicalSignificance: product.attributes.astrologicalSignificance ?? "",
    certificationInfo: product.certificationInfo,
    deliveryEstimate: product.deliveryEstimate,
    faqs: product.faqs,
    seo: product.seo,
  };
}

// GemstoneProduct's `category` is the old 8-value enum
// (ruby|pearl|coral|...) used only for a few internal
// grouping/labelling spots in the old gemstone UI — the new Product's
// `category` is always literally "gemstone" at this call site, so this
// derives the OLD narrower category from the slug/name instead of
// carrying a second, redundant category field on the new model.
function mapCategory(product: Product): GemstoneProduct["category"] {
  const slug = product.slug;
  if (slug.includes("ruby")) return "ruby";
  if (slug.includes("pearl")) return "pearl";
  if (slug.includes("coral")) return "coral";
  if (slug.includes("emerald")) return "emerald";
  if (slug.includes("yellow-sapphire")) return "yellow-sapphire";
  if (slug.includes("blue-sapphire")) return "blue-sapphire";
  if (slug.includes("hessonite")) return "hessonite";
  if (slug.includes("cats-eye") || slug.includes("cat-s-eye")) return "cats-eye";
  if (slug === "test-payment") return "test";
  return "other"; // every gemstone added beyond the original eight
}
