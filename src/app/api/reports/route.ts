// src/app/api/reports/route.ts
// Authenticated user's own purchased reports — never another user's
// (AGENTS §76: ownership enforced server-side, not just hidden URLs).
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verify-request";
import { listReportsForUser } from "@/lib/reports/store";
import { isReportDelivered } from "@/lib/reports/types";

export async function GET(request: Request) {
  const verified = await verifyRequest(request);
  if (!verified) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });

  const reports = await listReportsForUser(verified.uid);
  // Never send the full AstrologySnapshot or generated section content
  // in a list response — that's a lot of personal data for a screen
  // that only needs status/summary. The detail route returns the full
  // document.
  //
  // Status shown here reflects the DELIVERY promise, not raw
  // generation state — a report that finished generating early still
  // shows as its last pre-READY stage (never "Ready") until
  // scheduledAt passes, matching the pdf/detail routes' own gate (see
  // isReportDelivered's doc comment). completedAt/pageCount are
  // likewise withheld until then.
  const summaries = reports.map((r) => {
    const delivered = isReportDelivered(r, false);
    return {
      id: r.id,
      reportType: r.reportType,
      productSlug: r.productSlug,
      status: delivered ? r.status : r.status === "READY" ? "RENDERING" : r.status,
      createdAt: r.createdAt,
      scheduledAt: r.scheduledAt,
      completedAt: delivered ? r.completedAt : undefined,
      pageCount: delivered ? r.pageCount : undefined,
    };
  });
  return NextResponse.json({ reports: summaries });
}
