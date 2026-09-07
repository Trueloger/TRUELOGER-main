// src/app/api/gemstones/validate/route.ts
// Server-side authoritative pricing for a gemstone add-to-cart request
// — mirrors src/app/api/consult/validate/route.ts exactly. The client
// sends only productId + ratti; this route looks up the real product,
// validates the Ratti against THAT product's own rattiOptions/pricing
// (never a global range), and computes mrp/salePrice/discount itself
// from the server-owned pricing matrix. A client-supplied price, MRP,
// or discount is never accepted or trusted. Every gemstone add-to-cart
// path (the direct card Ratti sheet AND the product-page Ratti
// selector) calls this before calling `addItem()`.
import { NextResponse } from "next/server";
import { getGemstoneById } from "@/lib/gemstones/gemstone-data";
import { getGemstonePrice, validateRatti } from "@/lib/gemstones/pricing";

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

  const product = getGemstoneById(productId);
  if (!product) {
    return NextResponse.json({ error: "Unknown gemstone product." }, { status: 404 });
  }

  const rattiCheck = validateRatti(product.rattiOptions, product.pricing, ratti);
  if (!rattiCheck.valid) {
    return NextResponse.json({ error: rattiCheck.reason }, { status: 400 });
  }

  const price = getGemstonePrice(product.pricing, rattiCheck.ratti);

  return NextResponse.json({
    productId: product.id,
    productName: product.name,
    ratti: rattiCheck.ratti,
    mrp: price.mrp,
    salePrice: price.salePrice,
    discountPercent: price.discountPercent,
  });
}
