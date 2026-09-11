// src/app/api/admin/astrologer-applications/route.ts
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { listApplicationsForAdmin } from "@/lib/astrologers/store";

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const applications = await listApplicationsForAdmin();
  return NextResponse.json({ applications });
}
