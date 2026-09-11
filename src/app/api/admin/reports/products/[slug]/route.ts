// src/app/api/admin/reports/products/[slug]/route.ts
// Admin editing of ONE report product — ONLY mrp / salePrice /
// deliveryHours are ever settable here (AGENTS §73/§117/§139). There
// is no path in this route, or anywhere else, that lets Admin touch a
// report's section blueprint, prompts, or calculation logic — those
// live only in src/lib/reports/blueprints/*.ts and
// src/lib/ai/paid-report-section.ts, both developer-controlled files
// with no Firestore-backed override.
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { updateReportProductPricing } from "@/lib/reports/store";
import { getReportBlueprint } from "@/lib/reports/products";

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { slug } = await params;
  if (!getReportBlueprint(slug)) return NextResponse.json({ error: "Unknown report product." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { mrp, salePrice, deliveryHours } = (body as Record<string, unknown>) ?? {};

  const patch: { mrp?: number; salePrice?: number; deliveryHours?: number } = {};
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
  if (deliveryHours !== undefined) {
    if (typeof deliveryHours !== "number" || deliveryHours < 0) {
      return NextResponse.json({ error: "Invalid delivery hours." }, { status: 400 });
    }
    patch.deliveryHours = deliveryHours;
  }
  if ((patch.mrp ?? patch.salePrice) !== undefined) {
    const effectiveMrp = patch.mrp;
    const effectiveSale = patch.salePrice;
    if (effectiveMrp !== undefined && effectiveSale !== undefined && effectiveSale > effectiveMrp) {
      return NextResponse.json({ error: "Sale price cannot exceed MRP." }, { status: 400 });
    }
  }

  const updated = await updateReportProductPricing(slug, patch);
  return NextResponse.json({ product: updated });
}
