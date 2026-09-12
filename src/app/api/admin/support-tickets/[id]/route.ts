// src/app/api/admin/support-tickets/[id]/route.ts
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { updateTicket } from "@/lib/support/store";
import { TICKET_STATUSES, type TicketStatus } from "@/lib/support/types";

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
  const { status, adminNote } = (body as Record<string, unknown>) ?? {};

  const patch: { status?: TicketStatus; adminNote?: string } = {};
  if (status !== undefined) {
    if (typeof status !== "string" || !TICKET_STATUSES.includes(status as TicketStatus)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    patch.status = status as TicketStatus;
  }
  if (adminNote !== undefined) {
    if (typeof adminNote !== "string") return NextResponse.json({ error: "Invalid note." }, { status: 400 });
    patch.adminNote = adminNote.slice(0, 2000);
  }

  const updated = await updateTicket(id, patch);
  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ticket: updated });
}
