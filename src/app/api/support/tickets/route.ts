// src/app/api/support/tickets/route.ts
// Public submission endpoint — backs the Contact page, Grievance page,
// and every order/report/meeting "Need help?" link. Authenticated
// callers get userId attached (so /api/account/support-tickets can
// list "my tickets" later); unauthenticated Contact-page submissions
// are still accepted (userId: null) per AGENTS "the page should allow
// the user to include order id... category... message" without
// requiring login.
import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth/verify-request";
import { createTicket, countRecentTicketsByEmail } from "@/lib/support/store";
import { SUPPORT_CATEGORIES, type SupportCategory, type PrivacyRequestType } from "@/lib/support/types";
import { sendSupportTicketReceivedEmail, sendSupportTicketAdminNotification } from "@/lib/email/events";
import { FOOTER_CONTACT } from "@/components/footer/footer-data";

export const maxDuration = 20;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_CATEGORIES = new Set(SUPPORT_CATEGORIES.map((c) => c.value));
const VALID_PRIVACY_TYPES: PrivacyRequestType[] = ["access", "correction", "deletion", "withdraw-consent", "complaint"];

function str(value: unknown, max = 2000): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const b = (body as Record<string, unknown>) ?? {};

  // Honeypot — a real user never fills this (it's visually hidden on
  // the form); any non-empty value here is treated as a bot submission
  // and silently accepted-looking rejected, per AGENTS "honeypot
  // fields" rather than a CAPTCHA.
  if (typeof b.website === "string" && b.website.trim() !== "") {
    return NextResponse.json({ ok: true, id: "ignored" });
  }

  const name = str(b.name, 200);
  const email = str(b.email, 200);
  const category = str(b.category, 50) as SupportCategory;
  const message = str(b.message, 5000);
  const orderId = str(b.orderId, 100) || undefined;
  const reportId = str(b.reportId, 100) || undefined;
  const meetingId = str(b.meetingId, 100) || undefined;
  const privacyRequestType = str(b.privacyRequestType, 30) as PrivacyRequestType;

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (!VALID_CATEGORIES.has(category)) return NextResponse.json({ error: "Select a valid category." }, { status: 400 });
  if (message.length < 10) return NextResponse.json({ error: "Please write a slightly longer message (at least 10 characters)." }, { status: 400 });
  if (category === "privacy" && !VALID_PRIVACY_TYPES.includes(privacyRequestType)) {
    return NextResponse.json({ error: "Select the type of privacy request." }, { status: 400 });
  }

  // Abuse throttle — see store.ts's doc comment.
  const recentCount = await countRecentTicketsByEmail(email, Date.now() - 15 * 60 * 1000);
  if (recentCount >= 3) {
    return NextResponse.json({ error: "You've submitted several requests recently. Please wait a few minutes before trying again." }, { status: 429 });
  }

  const verified = await verifyRequest(request).catch(() => null);

  try {
    const ticket = await createTicket({
      userId: verified?.uid ?? null,
      name,
      email,
      category,
      ...(category === "privacy" ? { privacyRequestType } : {}),
      ...(orderId ? { orderId } : {}),
      ...(reportId ? { reportId } : {}),
      ...(meetingId ? { meetingId } : {}),
      message,
    });

    const categoryLabel = SUPPORT_CATEGORIES.find((c) => c.value === category)?.label ?? category;
    await sendSupportTicketReceivedEmail({ ticketId: ticket.id, toEmail: email, name, category: categoryLabel }).catch(() => {});
    await sendSupportTicketAdminNotification({
      ticketId: ticket.id,
      adminEmail: FOOTER_CONTACT.email,
      name,
      email,
      category: categoryLabel,
      message,
    }).catch(() => {});

    return NextResponse.json({ ok: true, id: ticket.id });
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : "Submission failed.";
    return NextResponse.json({ error: `Submission failed: ${errMessage}` }, { status: 502 });
  }
}
