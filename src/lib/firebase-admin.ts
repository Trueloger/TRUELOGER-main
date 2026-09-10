// src/lib/firebase-admin.ts
// Server-only Firestore access (Admin SDK) — never import this from a
// "use client" file. Reads FIREBASE_ADMIN_* env vars, which must never
// reach the browser bundle. There's no "server-only" package in this
// repo to enforce that mechanically — it's enforced purely by
// convention: only import this from Route Handlers / Server Components.
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;

/** Shared Admin SDK app singleton — also used by
 * src/lib/auth/verify-request.ts (ID token verification) and the admin
 * custom-claim bootstrap script, so there is only ever one Admin app
 * instance per process regardless of which server module initializes
 * it first. */
export function getAdminApp(): App {
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

  // Optional order/profile fields (customerPhone, customerName, etc.)
  // are frequently `undefined` rather than omitted — plain object
  // spreads and TypeScript's optional-field shapes produce that
  // naturally. The Admin SDK rejects `undefined` field values by
  // default ("Cannot use 'undefined' as a Firestore value"), which
  // otherwise turns every optional field into a landmine at write
  // time.
  //
  // `preferRest: true` — the real fix for a serious production bug:
  // db.runTransaction() (used only by applyPaymentStatus, i.e. only
  // the /api/payments/verify and /api/payments/cashfree/webhook
  // routes) was hanging for the FULL 15s function timeout on every
  // single invocation in production, confirmed via Vercel logs
  // ("Task timed out after 15 seconds") while every other route using
  // plain .get()/.set() calls (create-order, gemstones/validate, etc.)
  // worked normally. The Admin SDK defaults to a gRPC transport for
  // Firestore, and gRPC's long-lived streams are a known source of
  // exactly this symptom on serverless platforms that aggressively
  // freeze/thaw function instances between invocations (the stream
  // can be left in a broken half-open state that neither errors nor
  // completes). Forcing plain HTTP/REST for all Firestore calls
  // sidesteps that transport entirely — this is Google's own
  // documented workaround for "Firestore Admin SDK hangs on
  // serverless" reports. This was the actual root cause of payments
  // getting stuck on "Confirming your payment" indefinitely: the
  // webhook DID fire, and the return-URL verify call DID run, but
  // both hung inside the same transaction and never returned, so
  // neither ever finished writing PAID to the order document (and the
  // client saw no error either, since the browser's own 10s abort
  // fired before the server's 15s one, then the confirmation page
  // just kept waiting on the Firestore listener for a write that was
  // never going to arrive).
  //
  // Settings must be applied exactly once, before the first Firestore
  // operation on this app — safe here since this only runs on the
  // branch that just created the app, before anyone else has had a
  // chance to call getFirestore(app) yet.
  getFirestore(app).settings({ ignoreUndefinedProperties: true, preferRest: true });

  return app;
}

export function getFirestoreDb(): Firestore {
  return getFirestore(getAdminApp());
}
