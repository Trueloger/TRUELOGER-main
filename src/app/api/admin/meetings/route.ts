// src/app/api/admin/meetings/route.ts
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { listMeetingsForAdmin } from "@/lib/meetings/store";

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const meetings = await listMeetingsForAdmin();
  return NextResponse.json({ meetings });
}
