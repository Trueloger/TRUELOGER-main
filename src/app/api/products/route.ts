// src/app/api/products/route.ts
// Public storefront listing — published products only, LISTING fields
// only (the full Product object is small enough here that this route
// just returns it as-is; the perf-sensitive omission that matters is
// not fetching every product's full gallery/FAQ set on every listing
// page load, which this satisfies since Product itself doesn't nest
// anything heavier than 5 short gallery-slot labels and a handful of
// FAQs — see products/types.ts). No auth required — this is public
// catalogue data.
import { NextResponse } from "next/server";
import { listPublishedProducts } from "@/lib/products/store";
import { PRODUCT_CATEGORIES, type ProductCategory } from "@/lib/products/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const categoryParam = url.searchParams.get("category");
  const category =
    categoryParam && PRODUCT_CATEGORIES.includes(categoryParam as ProductCategory)
      ? (categoryParam as ProductCategory)
      : undefined;

  const products = await listPublishedProducts(category);
  return NextResponse.json({ products });
}
