// src/lib/firebase-admin.ts
// Server-only Firestore access (Admin SDK) — never import this from a
// "use client" file. Reads FIREBASE_ADMIN_* env vars, which must never
// reach the browser bundle. There's no "server-only" package in this
// repo to enforce that mechanically — it's enforced purely by
// convention: only import this from Route Handlers / Server Components.
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;

function getAdminApp(): App {
  if (app) return app;

  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0];
    return app;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      "Missing FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY"
    );
  }

  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      // The env var stores the PEM key with literal "\n" sequences
      // (a multi-line PEM can't survive a single-line .env value
      // otherwise) — turn them back into real newlines.
      privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
    }),
  });
  return app;
}

export function getFirestoreDb(): Firestore {
  return getFirestore(getAdminApp());
}
