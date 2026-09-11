// src/app/api/reports/[id]/route.ts
// Single report — ownership-checked (owner or admin only). This is
// also what the in-app HTML reader (src/app/reports/[reportId]/page.tsx)
// reads from, so it returns the full section content when READY — but
// NEVER to anyone but the owner/admin (AGENTS §35/§76/§77).
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verify-request";
import { getReport } from "@/lib/reports/store";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const verified = await verifyRequest(request);
  if (!verified) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });

  const { id } = await params;
  const report = await getReport(id);
  // Same uniform 404 whether the report doesn't exist or belongs to
  // someone else — never reveal existence of another user's report.
  if (!report || (report.userId !== verified.uid && !verified.isAdmin)) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  return NextResponse.json({ report });
}
