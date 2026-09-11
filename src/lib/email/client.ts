// src/lib/email/client.ts
// Server-only Resend wrapper. RESEND_API_KEY / EMAIL_FROM never reach
// the browser — every caller of sendEmail() is itself a server module
// (order/report/application hooks), never a "use client" file.
import { Resend } from "resend";

let client: Resend | null = null;

function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export async function sendEmail(input: { to: string; subject: string; html: string }): Promise<{ ok: boolean; error?: string }> {
  const r = resend();
  if (!r) {
    // No key configured — never throw (an email failure must never
    // fail the underlying order/payment, per AGENTS "email failure").
    console.warn("[email] RESEND_API_KEY not set — skipping send:", input.subject);
    return { ok: false, error: "not_configured" };
  }
  const from = process.env.EMAIL_FROM ?? "TrueLoger <onboarding@resend.dev>";
  try {
    const result = await r.emails.send({ from, to: input.to, subject: input.subject, html: input.html });
    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "send_failed" };
  }
}
