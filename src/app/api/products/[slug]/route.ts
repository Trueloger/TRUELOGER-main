// src/app/api/products/[slug]/route.ts
// Public product detail — published only. No auth required.
import { NextResponse } from "next/server";
import { getPublishedProductBySlug } from "@/lib/products/store";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
  return NextResponse.json({ product });
}
