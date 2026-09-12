// src/app/api/admin/meetings/[id]/create-meet/route.ts
// Admin-triggered retry — for a meeting that's stuck in
// MEETING_CREATION_PENDING (booked before Google Calendar was
// connected) or MEETING_CREATION_FAILED (a transient Calendar API
// error). Same real createMeetEvent call the payment hook makes;
// never re-charges the customer, never creates a duplicate order.
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { getMeeting, updateMeetingStatus } from "@/lib/meetings/store";
import { createMeetEvent } from "@/lib/google/calendar";
import { sendMeetingScheduledEmail } from "@/lib/email/events";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { id } = await params;
  const meeting = await getMeeting(id);
  if (!meeting) return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
  if (meeting.status !== "MEETING_CREATION_PENDING" && meeting.status !== "MEETING_CREATION_FAILED") {
    return NextResponse.json({ error: `Meeting is already ${meeting.status}.` }, { status: 400 });
  }

  try {
    const created = await createMeetEvent({
      serviceName: meeting.serviceName,
      customerName: meeting.customerName,
      customerEmail: meeting.customerEmail,
      date: meeting.date,
      startTime: meeting.startTime,
      durationMinutes: meeting.durationMinutes,
      timezone: meeting.timezone,
      orderId: meeting.orderId,
      consultationServiceId: meeting.consultationServiceId,
    });
    await updateMeetingStatus(meeting.id, "SCHEDULED", {
      googleEventId: created.eventId,
      googleMeetUrl: created.meetUrl,
      hostEmail: created.hostEmail,
    });
    await sendMeetingScheduledEmail({
      meetingId: meeting.id,
      toEmail: meeting.customerEmail,
      customerName: meeting.customerName,
      serviceName: meeting.serviceName,
      date: meeting.date,
      time: meeting.startTime,
      durationMinutes: meeting.durationMinutes,
      meetUrl: created.meetUrl,
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (err) {
    await updateMeetingStatus(meeting.id, "MEETING_CREATION_FAILED").catch(() => {});
    const message = err instanceof Error ? err.message : "Failed to create meeting.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
