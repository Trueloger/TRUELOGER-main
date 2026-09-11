// src/app/api/admin/services/route.ts
// Admin listing of Healing/Puja/Course products with live pricing.
// ?category=healing|puja|course filters; omitted returns all three.
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { listServiceProducts, listAllServiceProductsForAdmin } from "@/lib/services/store";
import type { ServiceCategory } from "@/lib/services/types";

const VALID_CATEGORIES: ServiceCategory[] = ["healing", "puja", "course"];

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const category = new URL(request.url).searchParams.get("category");
  if (category && !VALID_CATEGORIES.includes(category as ServiceCategory)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  const products = category
    ? await listServiceProducts(category as ServiceCategory)
    : await listAllServiceProductsForAdmin();
  return NextResponse.json({ products });
}
