// src/app/api/admin/services/[category]/[slug]/route.ts
// Admin editing of ONE Healing/Puja/Course product — ONLY
// mrp/salePrice/deliveryTime/active are ever settable here. There is
// no path here (or anywhere else) that lets Admin touch a service's
// actual content (description/curriculum/FAQs/disclaimer) — those
// live only in src/lib/services/data/*.ts, developer-controlled files
// with no Firestore-backed override.
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { updateServicePricing } from "@/lib/services/store";
import { getBlueprint } from "@/lib/services/registry";
import type { ServiceCategory } from "@/lib/services/types";

const VALID_CATEGORIES: ServiceCategory[] = ["healing", "puja", "course"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ category: string; slug: string }> },
) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { category, slug } = await params;
  if (!VALID_CATEGORIES.includes(category as ServiceCategory)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }
  if (!getBlueprint(category as ServiceCategory, slug)) {
    return NextResponse.json({ error: "Unknown service." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { mrp, salePrice, deliveryTime, active } = (body as Record<string, unknown>) ?? {};

  const patch: { mrp?: number; salePrice?: number; deliveryTime?: string; active?: boolean } = {};
  if (mrp !== undefined) {
    if (typeof mrp !== "number" || mrp <= 0) return NextResponse.json({ error: "Invalid MRP." }, { status: 400 });
    patch.mrp = mrp;
  }
  if (salePrice !== undefined) {
    if (typeof salePrice !== "number" || salePrice <= 0) {
      return NextResponse.json({ error: "Invalid sale price." }, { status: 400 });
    }
    patch.salePrice = salePrice;
  }
  if (deliveryTime !== undefined) {
    if (typeof deliveryTime !== "string" || !deliveryTime.trim()) {
      return NextResponse.json({ error: "Invalid delivery time." }, { status: 400 });
    }
    patch.deliveryTime = deliveryTime.trim();
  }
  if (active !== undefined) {
    if (typeof active !== "boolean") return NextResponse.json({ error: "Invalid active flag." }, { status: 400 });
    patch.active = active;
  }
  if (patch.mrp !== undefined && patch.salePrice !== undefined && patch.salePrice > patch.mrp) {
    return NextResponse.json({ error: "Sale price cannot exceed MRP." }, { status: 400 });
  }

  const updated = await updateServicePricing(category as ServiceCategory, slug, patch);
  return NextResponse.json({ product: updated });
}
