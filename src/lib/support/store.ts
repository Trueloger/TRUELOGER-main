// src/lib/support/store.ts
// Server-only Firestore access (Admin SDK) for support tickets —
// backs Contact, Grievance, and Privacy-Request submissions alike.
import { randomUUID } from "node:crypto";
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import type { SupportTicket, TicketStatus } from "./types";

const COLLECTION = "supportTickets";

function db() {
  return getFirestore(getAdminApp());
}

export async function createTicket(
  input: Omit<SupportTicket, "id" | "status" | "createdAt" | "updatedAt">,
): Promise<SupportTicket> {
  const now = Date.now();
  const id = `tkt_${randomUUID().replace(/-/g, "")}`;
  const ticket: SupportTicket = { ...input, id, status: "Open", createdAt: now, updatedAt: now };
  await db().collection(COLLECTION).doc(id).set(ticket);
  return ticket;
}

export async function getTicket(id: string): Promise<SupportTicket | null> {
  const snap = await db().collection(COLLECTION).doc(id).get();
  return snap.exists ? (snap.data() as SupportTicket) : null;
}

export async function listTicketsForUser(userId: string): Promise<SupportTicket[]> {
  const snap = await db().collection(COLLECTION).where("userId", "==", userId).get();
  return snap.docs.map((d) => d.data() as SupportTicket).sort((a, b) => b.createdAt - a.createdAt);
}

export async function listTicketsForAdmin(limitCount = 200): Promise<SupportTicket[]> {
  const snap = await db().collection(COLLECTION).limit(limitCount).get();
  return snap.docs.map((d) => d.data() as SupportTicket).sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateTicket(id: string, patch: { status?: TicketStatus; adminNote?: string }): Promise<SupportTicket | null> {
  const ref = db().collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.update({ ...patch, updatedAt: Date.now() });
  return { ...(snap.data() as SupportTicket), ...patch, updatedAt: Date.now() };
}

/** Unseen-count support for the admin notification badge (mirrors
 * src/lib/admin-notifications/store.ts's other count functions). */
export async function countTicketsSince(sinceMs: number): Promise<number> {
  const snap = await db().collection(COLLECTION).get();
  return snap.docs.filter((d) => (d.data() as SupportTicket).createdAt > sinceMs).length;
}

/** Simple abuse throttle for the public (unauthenticated-allowed)
 * ticket-submission route — a serverless function has no reliable
 * in-memory state between invocations, so this checks Firestore
 * directly rather than an in-process rate limiter. Not a CAPTCHA
 * replacement, just enough to stop naive repeat-submission abuse
 * (AGENTS "do not create a poor CAPTCHA experience unless necessary"
 * — this is the "unless necessary" threshold for a low-traffic
 * contact form). */
export async function countRecentTicketsByEmail(email: string, sinceMs: number): Promise<number> {
  const snap = await db().collection(COLLECTION).where("email", "==", email).get();
  return snap.docs.filter((d) => (d.data() as SupportTicket).createdAt > sinceMs).length;
}
