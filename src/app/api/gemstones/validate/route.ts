// src/app/api/gemstones/validate/route.ts
// Server-side authoritative pricing for a gemstone add-to-cart request
// — mirrors src/app/api/consult/validate/route.ts exactly. The client
// sends only productId + ratti; this route looks up the real product
// and validates the Ratti against THAT product's own variants — never
// a global range — and computes mrp/salePrice/discount itself. A
// client-supplied price, MRP, or discount is never accepted or trusted.
//
// Backed by the unified Firestore product store (src/lib/products/
// store.ts) as of the catalogue expansion — the RESPONSE SHAPE is
// deliberately unchanged from before that migration, so the existing
// gemstone UI (GemstoneCard/RattiSheet/GemstoneRattiSelector) needed
// zero changes to keep working against this route. A gemstone
// product's variant ids ARE its Ratti numbers as strings (see
// scripts/dev/seed-products.ts), which is what makes that
// compatibility possible without any shape translation here.
import { NextResponse } from "next/server";
import { getProductById } from "@/lib/products/store";
import { findVariant, variantDiscountPercent } from "@/lib/products/types";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { productId, ratti } = body as { productId?: unknown; ratti?: unknown };

  if (typeof productId !== "string" || !productId) {
    return NextResponse.json({ error: "productId is required." }, { status: 400 });
  }
  if (typeof ratti !== "number" || !Number.isFinite(ratti)) {
    return NextResponse.json({ error: "Select a valid Ratti weight." }, { status: 400 });
  }

  const product = await getProductById(productId);
  if (!product || product.status !== "published" || product.category !== "gemstone") {
    return NextResponse.json({ error: "Unknown gemstone product." }, { status: 404 });
  }

  const variant = findVariant(product, String(ratti));
  if (!variant) {
    return NextResponse.json({ error: "This Ratti weight is not offered for this gemstone." }, { status: 400 });
  }
  if (variant.inStock === false) {
    return NextResponse.json({ error: "This Ratti weight is currently out of stock." }, { status: 400 });
  }

  return NextResponse.json({
    productId: product.id,
    productName: product.name,
    ratti,
    mrp: variant.mrp,
    salePrice: variant.salePrice,
    discountPercent: variantDiscountPercent(variant),
  });
}
