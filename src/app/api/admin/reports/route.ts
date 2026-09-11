// src/app/api/admin/reports/route.ts
// Admin listing of report generation jobs — deliberately excludes
// astrologySnapshot/sections/profileSnapshot from the response
// (AGENTS §75: don't expose unnecessary personal birth information in
// a list view). Full detail (if ever needed) would go through
// /api/reports/[id], which already allows admin access.
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { listReportsForAdmin } from "@/lib/reports/store";

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const reports = await listReportsForAdmin();
  const summaries = reports.map((r) => ({
    id: r.id,
    userId: r.userId,
    orderId: r.orderId,
    reportType: r.reportType,
    productSlug: r.productSlug,
    status: r.status,
    customerName: r.profileSnapshot.fullName,
    createdAt: r.createdAt,
    scheduledAt: r.scheduledAt,
    startedAt: r.startedAt,
    completedAt: r.completedAt,
    deliveryDelayHours: r.deliveryDelayHours,
    pageCount: r.pageCount,
    errorCode: r.errorCode,
  }));
  return NextResponse.json({ reports: summaries });
}
