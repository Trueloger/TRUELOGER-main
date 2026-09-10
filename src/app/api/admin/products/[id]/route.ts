// src/app/api/admin/products/[id]/route.ts
// Admin-only single-product update + delete-or-archive.
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { getProductById, updateProduct, deleteOrArchiveProduct } from "@/lib/products/store";
import type { Product } from "@/lib/products/types";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid product data." }, { status: 400 });
  }

  const patch = body as Partial<Product>;
  if (patch.variants) {
    for (const v of patch.variants) {
      if (v.mrp <= 0 || v.salePrice <= 0 || v.salePrice > v.mrp) {
        return NextResponse.json({ error: "Sale price must be positive and no greater than MRP." }, { status: 400 });
      }
    }
  }

  const updated = await updateProduct(id, patch);
  if (!updated) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ product: updated });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { id } = await params;
  const result = await deleteOrArchiveProduct(id);
  if (result === "not_found") return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ result });
}
