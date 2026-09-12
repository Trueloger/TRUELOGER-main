// src/app/api/admin/google/status/route.ts
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { getHostTokens, disconnectHost } from "@/lib/google/oauth";

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const tokens = await getHostTokens();
  return NextResponse.json({ connected: !!tokens, email: tokens?.email ?? null, connectedAt: tokens?.connectedAt ?? null });
}

export async function DELETE(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await disconnectHost();
  return NextResponse.json({ ok: true });
}
