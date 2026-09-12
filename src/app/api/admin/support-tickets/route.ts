// src/app/api/admin/support-tickets/route.ts
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { listTicketsForAdmin } from "@/lib/support/store";

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const tickets = await listTicketsForAdmin();
  return NextResponse.json({ tickets });
}
