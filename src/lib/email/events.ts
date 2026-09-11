// src/lib/email/events.ts
// Centralized event-driven email layer — Event -> render -> send,
// with idempotency, so email-sending code doesn't get scattered
// across order/report/application hooks (AGENTS "do not scatter
// email-sending code across dozens of components") and a webhook
// retry / duplicate listener fire can never send the same email twice
// (AGENTS "email idempotency").
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { sendEmail } from "./client";
import { emailShell } from "./template";
import { formatInr } from "@/lib/consultation/pricing";

const EVENTS_COLLECTION = "emailEvents";

function db() {
  return getFirestore(getAdminApp());
}

/** Claims an idempotency key via a Firestore create-only write —
 * `create()` fails if the doc already exists, so two concurrent
 * callers (a webhook + a verify-route race, or a retried webhook) can
 * never both win the claim. Returns true only for the caller that
 * actually gets to send. */
async function claimEventOnce(eventKey: string): Promise<boolean> {
  try {
    await db().collection(EVENTS_COLLECTION).doc(eventKey).create({ sentAt: Date.now() });
    return true;
  } catch {
    return false; // already claimed (or a transient Firestore error) — never double-send
  }
}

async function sendOnce(eventKey: string, to: string, subject: string, html: string): Promise<void> {
  const claimed = await claimEventOnce(eventKey);
  if (!claimed) return;
  const result = await sendEmail({ to, subject, html });
  if (!result.ok) {
    // Never throw — a failed email must never fail the underlying
    // order/payment/booking (AGENTS "email failure"). Release the
    // claim so a legitimate later retry (e.g. an admin resend action)
    // isn't permanently blocked by a transient send failure.
    await db().collection(EVENTS_COLLECTION).doc(eventKey).delete().catch(() => {});
    console.error(`[email] send failed for ${eventKey}:`, result.error);
  }
}

// --------------------------------------------------------------------
// Order / purchase confirmation — covers gemstone/bracelet/rudraksha/
// spiritual/yantra/healing/puja/course/report line items with one
// shared template; consultation gets its own copy (booking, not a
// generic "order").
// --------------------------------------------------------------------
export async function sendOrderConfirmationEmail(input: {
  orderId: string;
  toEmail: string;
  customerName: string;
  itemSummaries: string[];
  total: number;
}): Promise<void> {
  const html = emailShell({
    heading: "Your TrueLoger Order is Confirmed",
    bodyHtml: `
      <p>Hi ${escapeHtml(input.customerName)},</p>
      <p>Thank you for your order. Here's a summary:</p>
      <ul style="padding-left:18px;margin:12px 0;">
        ${input.itemSummaries.map((s) => `<li style="margin-bottom:4px;">${escapeHtml(s)}</li>`).join("")}
      </ul>
      <p style="font-weight:600;">Total paid: ${formatInr(input.total)}</p>
    `,
    ctaLabel: "View Order",
    ctaHref: `${appUrl()}/account/orders/${input.orderId}`,
  });
  await sendOnce(`order_confirmed:${input.orderId}`, input.toEmail, "Your TrueLoger order is confirmed", html);
}

export async function sendConsultationBookingEmail(input: {
  orderId: string;
  serviceId: string;
  toEmail: string;
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  durationMinutes: number;
}): Promise<void> {
  const html = emailShell({
    heading: "Your Consultation is Scheduled",
    bodyHtml: `
      <p>Hi ${escapeHtml(input.customerName)},</p>
      <p>Your <strong>${escapeHtml(input.serviceName)}</strong> consultation (${input.durationMinutes} min) is booked for:</p>
      <p style="font-size:16px;font-weight:600;color:#3E2A5C;">${escapeHtml(input.date)} at ${escapeHtml(input.time)} (IST)</p>
      <p>We're preparing your meeting link and will notify you once it's ready — check your Meetings page for the latest status.</p>
    `,
    ctaLabel: "View My Meetings",
    ctaHref: `${appUrl()}/account/meetings`,
  });
  await sendOnce(`consultation_booked:${input.orderId}:${input.serviceId}`, input.toEmail, "Your consultation is scheduled", html);
}

export async function sendMeetingScheduledEmail(input: {
  meetingId: string;
  toEmail: string;
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  durationMinutes: number;
  meetUrl: string;
}): Promise<void> {
  const html = emailShell({
    heading: "Your Meeting Link is Ready",
    bodyHtml: `
      <p>Hi ${escapeHtml(input.customerName)},</p>
      <p>Your <strong>${escapeHtml(input.serviceName)}</strong> consultation link is ready:</p>
      <p>${escapeHtml(input.date)} at ${escapeHtml(input.time)} (IST) · ${input.durationMinutes} min</p>
    `,
    ctaLabel: "Join Meeting",
    ctaHref: input.meetUrl,
  });
  await sendOnce(`meeting_scheduled:${input.meetingId}`, input.toEmail, "Your consultation meeting link is ready", html);
}

export async function sendReportReadyEmail(input: {
  reportId: string;
  toEmail: string;
  customerName: string;
  reportName: string;
}): Promise<void> {
  const html = emailShell({
    heading: "Your Report is Ready",
    bodyHtml: `
      <p>Hi ${escapeHtml(input.customerName)},</p>
      <p>Your <strong>${escapeHtml(input.reportName)}</strong> has been prepared and is ready to view or download.</p>
    `,
    ctaLabel: "View My Report",
    ctaHref: `${appUrl()}/reports/${input.reportId}`,
  });
  await sendOnce(`report_ready:${input.reportId}`, input.toEmail, "Your TrueLoger report is ready", html);
}

export async function sendAstrologerApplicationReceivedEmail(input: { applicationId: string; toEmail: string; fullName: string }): Promise<void> {
  const html = emailShell({
    heading: "Application Received",
    bodyHtml: `
      <p>Hi ${escapeHtml(input.fullName)},</p>
      <p>Thank you for applying to join TrueLoger as an astrologer. Your application has been received and is <strong>Pending Review</strong>. Our team will follow up with you by email.</p>
    `,
  });
  await sendOnce(`astrologer_application_received:${input.applicationId}`, input.toEmail, "Your astrologer application has been received", html);
}

export async function sendAstrologerApplicationStatusEmail(input: {
  applicationId: string;
  toEmail: string;
  fullName: string;
  status: string;
}): Promise<void> {
  const html = emailShell({
    heading: "Application Status Update",
    bodyHtml: `
      <p>Hi ${escapeHtml(input.fullName)},</p>
      <p>Your astrologer application status has been updated to: <strong>${escapeHtml(input.status)}</strong>.</p>
    `,
  });
  // Keyed with the status included so a genuine status change (e.g.
  // Pending -> Approved) is a NEW event, not blocked by an earlier
  // status update's claim — only an identical repeat status change is
  // deduplicated.
  await sendOnce(`astrologer_status:${input.applicationId}:${input.status}`, input.toEmail, "Your TrueLoger astrologer application status", html);
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://trueloger.vercel.app";
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
