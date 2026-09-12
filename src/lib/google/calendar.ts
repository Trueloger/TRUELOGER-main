// src/lib/google/calendar.ts
// Real Google Calendar API call to create an event with a Google Meet
// conference attached — uses the official googleapis client, never a
// manually-constructed meet.google.com URL (AGENTS "do not attempt to
// generate Meet URLs by manually constructing strings").
import { google } from "googleapis";
import { getAuthorizedClient, getHostTokens } from "./oauth";

export type CreateMeetEventInput = {
  serviceName: string;
  customerName: string;
  customerEmail: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  durationMinutes: number;
  timezone: string; // e.g. "Asia/Kolkata"
  orderId: string;
  consultationServiceId: string;
};

export type CreateMeetEventResult = { eventId: string; meetUrl: string; hostEmail: string };

/** Creates a real Calendar event with a Meet conference, the host
 * account as organizer, and the customer invited as an attendee.
 *
 * Access-control honesty note (AGENTS "do not claim features Google
 * doesn't actually expose"): a personal/free Google account's Calendar
 * API can attach a Meet conference and invite a specific attendee, but
 * it CANNOT configure Meet's RESTRICTED/TRUSTED moderation controls —
 * those (and admission/knock requests) require either the separate
 * Google Meet REST API with Workspace-level access, or manual
 * in-meeting host controls at join time. What this DOES give: the
 * event and its Meet link are only visible to invited attendees (this
 * account + the customer), not publicly discoverable, and the host
 * can still use Meet's own in-call "quick access"/admit controls
 * manually. That's the real, honest guarantee for this account type. */
export async function createMeetEvent(input: CreateMeetEventInput): Promise<CreateMeetEventResult> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: "v3", auth });

  const [year, month, day] = input.date.split("-").map(Number);
  const [hour, minute] = input.startTime.split(":").map(Number);
  const start = new Date(Date.UTC(year, (month ?? 1) - 1, day, hour, minute));
  // Interpret the stored wall-clock date/time as being IN input.timezone
  // (not UTC) — Calendar's API takes an ISO dateTime + a separate
  // timeZone field and does this conversion itself when both are
  // supplied together, so we pass the naive local time directly.
  const startIso = `${input.date}T${input.startTime}:00`;
  const endDate = new Date(start.getTime() + input.durationMinutes * 60_000);
  const endIso = `${endDate.getUTCFullYear()}-${String(endDate.getUTCMonth() + 1).padStart(2, "0")}-${String(endDate.getUTCDate()).padStart(2, "0")}T${String(endDate.getUTCHours()).padStart(2, "0")}:${String(endDate.getUTCMinutes()).padStart(2, "0")}:00`;

  const requestId = `tl_${input.orderId}_${input.consultationServiceId}`.slice(0, 64);

  const res = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary: `TrueLoger Consultation — ${input.serviceName}`,
      description: `Consultation booked via TrueLoger.\nOrder: ${input.orderId}\nService: ${input.consultationServiceId}`,
      start: { dateTime: startIso, timeZone: input.timezone },
      end: { dateTime: endIso, timeZone: input.timezone },
      attendees: [{ email: input.customerEmail, displayName: input.customerName }],
      visibility: "private",
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: false,
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  const event = res.data;
  const meetUrl = event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri;
  if (!event.id || !meetUrl) {
    throw new Error("Google Calendar did not return a Meet link.");
  }

  const hostTokens = await getHostTokens();
  return { eventId: event.id, meetUrl, hostEmail: hostTokens?.email ?? "unknown" };
}
