// src/app/api/admin/astrologer-applications/[id]/route.ts
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { getApplication, updateApplicationStatus } from "@/lib/astrologers/store";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/astrologers/types";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { id } = await params;
  const application = await getApplication(id);
  if (!application) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ application });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { status } = (body as Record<string, unknown>) ?? {};
  if (typeof status !== "string" || !APPLICATION_STATUSES.includes(status as ApplicationStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const updated = await updateApplicationStatus(id, status as ApplicationStatus);
  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ application: updated });
}
