// src/app/api/reports/route.ts
// Authenticated user's own purchased reports — never another user's
// (AGENTS §76: ownership enforced server-side, not just hidden URLs).
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verify-request";
import { listReportsForUser } from "@/lib/reports/store";

export async function GET(request: Request) {
  const verified = await verifyRequest(request);
  if (!verified) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });

  const reports = await listReportsForUser(verified.uid);
  // Never send the full AstrologySnapshot or generated section content
  // in a list response — that's a lot of personal data for a screen
  // that only needs status/summary. The detail route returns the full
  // document.
  const summaries = reports.map((r) => ({
    id: r.id,
    reportType: r.reportType,
    productSlug: r.productSlug,
    status: r.status,
    createdAt: r.createdAt,
    scheduledAt: r.scheduledAt,
    completedAt: r.completedAt,
    pageCount: r.pageCount,
  }));
  return NextResponse.json({ reports: summaries });
}
