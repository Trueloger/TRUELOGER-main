// src/app/api/admin/reports/[id]/expedite/route.ts
// Admin-only: bring a stuck SCHEDULED report's due time forward to now
// and kick processing immediately, instead of waiting out the
// original delivery delay. No-op (404) on any report not currently
// SCHEDULED — never resurrects a FAILED/READY report.
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { expediteReport } from "@/lib/reports/store";
import { triggerReportProcessing } from "@/lib/reports/trigger";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { id } = await params;
  const updated = await expediteReport(id);
  if (!updated) {
    return NextResponse.json({ error: "Report not found or not currently scheduled." }, { status: 404 });
  }

  triggerReportProcessing(id);
  return NextResponse.json({ report: updated });
}
