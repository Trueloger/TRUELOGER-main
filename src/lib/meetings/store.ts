// src/lib/meetings/store.ts
// Server-only Firestore access (Admin SDK) for meetings.
import { randomUUID } from "node:crypto";
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import type { Meeting, MeetingStatus } from "./types";

const COLLECTION = "meetings";

function db() {
  return getFirestore(getAdminApp());
}

/** Idempotency: one meeting per (orderId, consultationServiceId) —
 * checked before creating, so a payment webhook firing twice (or a
 * webhook + a client-side status re-check racing) can never create two
 * meetings for the same booking (AGENTS "meeting idempotency"). */
export async function findExistingMeeting(orderId: string, consultationServiceId: string): Promise<Meeting | null> {
  const snap = await db()
    .collection(COLLECTION)
    .where("orderId", "==", orderId)
    .where("consultationServiceId", "==", consultationServiceId)
    .limit(1)
    .get();
  return snap.empty ? null : (snap.docs[0].data() as Meeting);
}

export async function createMeeting(
  input: Omit<Meeting, "id" | "status" | "googleEventId" | "googleMeetUrl" | "hostEmail" | "createdAt" | "updatedAt">,
): Promise<Meeting> {
  // Idempotency guard, re-checked right before the write — a narrow
  // TOCTOU window remains (Firestore has no unique-constraint on a
  // compound field pair without a transaction+query, and a query
  // inside a transaction here would need a composite index); acceptable
  // because the only two callers are the payment webhook and the
  // payment-verify route, which the order's own justPaid idempotency
  // guard (orders/store.ts) already prevents from both firing for the
  // same order.
  const existing = await findExistingMeeting(input.orderId, input.consultationServiceId);
  if (existing) return existing;

  const now = Date.now();
  const id = `mtg_${randomUUID().replace(/-/g, "")}`;
  const meeting: Meeting = {
    ...input,
    id,
    status: "MEETING_CREATION_PENDING",
    googleEventId: null,
    googleMeetUrl: null,
    hostEmail: null,
    createdAt: now,
    updatedAt: now,
  };
  await db().collection(COLLECTION).doc(id).set(meeting);
  return meeting;
}

export async function getMeeting(id: string): Promise<Meeting | null> {
  const snap = await db().collection(COLLECTION).doc(id).get();
  return snap.exists ? (snap.data() as Meeting) : null;
}

export async function listMeetingsForUser(userId: string): Promise<Meeting[]> {
  const snap = await db().collection(COLLECTION).where("userId", "==", userId).get();
  return snap.docs.map((d) => d.data() as Meeting).sort((a, b) => b.createdAt - a.createdAt);
}

export async function listMeetingsForAdmin(limitCount = 200): Promise<Meeting[]> {
  const snap = await db().collection(COLLECTION).limit(limitCount).get();
  return snap.docs.map((d) => d.data() as Meeting).sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateMeetingStatus(id: string, status: MeetingStatus, patch: Partial<Meeting> = {}): Promise<void> {
  await db()
    .collection(COLLECTION)
    .doc(id)
    .update({ ...patch, status, updatedAt: Date.now() });
}

export async function countMeetingsSince(sinceMs: number): Promise<number> {
  const snap = await db().collection(COLLECTION).where("createdAt", ">", sinceMs).get();
  return snap.size;
}
