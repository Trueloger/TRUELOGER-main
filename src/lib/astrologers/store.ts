// src/lib/astrologers/store.ts
// Server-only Firestore access (Admin SDK) for astrologer job
// applications. Resume files live in Firebase Storage, PRIVATE (never
// `public: true`, never a stored public URL) — served only via a
// signed URL generated on demand by an admin-authenticated route.
import { randomUUID } from "node:crypto";
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import type { ApplicationStatus, AstrologerApplication } from "./types";

const COLLECTION = "astrologerApplications";

function db() {
  return getFirestore(getAdminApp());
}

function bucket() {
  return getStorage(getAdminApp()).bucket();
}

export async function uploadResume(applicationId: string, buffer: Buffer, contentType: string, extension: string): Promise<string> {
  const objectPath = `astrologer-applications/${applicationId}/resume.${extension}`;
  await bucket().file(objectPath).save(buffer, {
    contentType,
    // Never public — resumes are personal documents, admin-only access.
    public: false,
    metadata: { cacheControl: "private, no-store" },
  });
  return objectPath;
}

export async function getResumeSignedUrl(storageRef: string): Promise<string> {
  const [url] = await bucket().file(storageRef).getSignedUrl({
    action: "read",
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes, generated fresh per request — never stored
  });
  return url;
}

/** Generates the id up front so the caller can use it as the resume's
 * storage path (astrologer-applications/{id}/resume.ext) BEFORE the
 * Firestore doc exists — see the route's upload-then-create ordering. */
export function newApplicationId(): string {
  return `app_${randomUUID().replace(/-/g, "")}`;
}

export async function createApplication(
  id: string,
  input: Omit<AstrologerApplication, "id" | "status" | "submittedAt" | "updatedAt">,
): Promise<AstrologerApplication> {
  const now = Date.now();
  const application: AstrologerApplication = {
    ...input,
    id,
    status: "Pending",
    submittedAt: now,
    updatedAt: now,
  };
  await db().collection(COLLECTION).doc(id).set(application);
  return application;
}

export async function getApplication(id: string): Promise<AstrologerApplication | null> {
  const snap = await db().collection(COLLECTION).doc(id).get();
  return snap.exists ? (snap.data() as AstrologerApplication) : null;
}

export async function listApplicationsForAdmin(limitCount = 200): Promise<AstrologerApplication[]> {
  const snap = await db().collection(COLLECTION).limit(limitCount).get();
  return snap.docs.map((d) => d.data() as AstrologerApplication).sort((a, b) => b.submittedAt - a.submittedAt);
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus): Promise<AstrologerApplication | null> {
  const ref = db().collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.update({ status, updatedAt: Date.now() });
  return { ...(snap.data() as AstrologerApplication), status, updatedAt: Date.now() };
}

/** Unseen-count support for the admin notification badge — see
 * src/lib/admin-notifications/store.ts. */
export async function countApplicationsSince(sinceMs: number): Promise<number> {
  const snap = await db().collection(COLLECTION).where("submittedAt", ">", sinceMs).get();
  return snap.size;
}
