// src/app/api/admin/reports/products/route.ts
// Admin listing of the 7 report products with their live pricing —
// the same merged blueprint+pricing shape the public storefront reads.
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { listReportProducts } from "@/lib/reports/store";

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const products = await listReportProducts();
  return NextResponse.json({ products });
}
