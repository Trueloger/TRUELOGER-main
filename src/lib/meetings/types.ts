// src/lib/meetings/types.ts
// A scheduled consultation meeting — created from a PAID consultation
// order. Google Meet/Calendar creation itself needs a one-time OAuth
// authorization from the business's Google account (not yet
// connected), so today every meeting is honestly created in
// MEETING_CREATION_PENDING and stays there — this is the real,
// forward-compatible data model + state machine (AGENTS "never lose
// the paid order, never fake a meeting that doesn't exist") ready for
// the actual Google Meet API call to be dropped in later without any
// schema change.
export type MeetingStatus =
  | "BOOKING_PENDING" // order not yet PAID
  | "MEETING_CREATION_PENDING" // PAID, Google Meet not yet connected/created
  | "SCHEDULED" // Google Meet event created successfully
  | "RESCHEDULED"
  | "MEETING_CREATION_FAILED"
  | "CANCELLED"
  | "COMPLETED";

export type Meeting = {
  id: string;
  orderId: string;
  consultationServiceId: string;
  serviceName: string;
  userId: string;
  customerName: string;
  customerEmail: string;

  // Canonical ISO datetime + explicit timezone — never a bare "4:30
  // PM" string with no date/timezone context.
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  durationMinutes: number;
  timezone: string; // e.g. "Asia/Kolkata"

  status: MeetingStatus;

  // Google Meet/Calendar fields — all null until that integration is
  // connected; never fabricated.
  googleEventId: string | null;
  googleMeetUrl: string | null;
  hostEmail: string | null;

  // Reschedule trail (data model ready even though rescheduling isn't
  // exposed in the UI yet, per "don't make future rescheduling
  // impossible").
  originalDate?: string;
  originalStartTime?: string;

  createdAt: number;
  updatedAt: number;
};
