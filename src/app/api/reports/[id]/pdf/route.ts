// src/app/api/reports/[id]/pdf/route.ts
// Secure PDF download — verifies authenticated user + ownership +
// READY status before ever touching Storage (AGENTS §93/§94). Streams
// the file directly through this route rather than redirecting to a
// signed URL, so no report URL — signed or otherwise — is ever handed
// to the browser or logged in a redirect chain.
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verify-request";
import { getReport } from "@/lib/reports/store";
import { getAdminApp } from "@/lib/firebase-admin";
import { getStorage } from "firebase-admin/storage";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const verified = await verifyRequest(request);
  if (!verified) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });

  const { id } = await params;
  const report = await getReport(id);
  if (!report || (report.userId !== verified.uid && !verified.isAdmin)) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }
  if (report.status !== "READY" || !report.pdfStorageRef) {
    return NextResponse.json({ error: "This report isn't ready yet." }, { status: 409 });
  }

  const [buffer] = await getStorage(getAdminApp()).bucket().file(report.pdfStorageRef).download();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="TrueLoger-${report.reportType}-report.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
