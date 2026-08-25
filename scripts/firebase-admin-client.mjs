// Shared Firebase Admin SDK init for one-off local scripts (upload, etc).
// Server-only — reads credentials from .env.local (gitignored, never
// committed). Not imported by the Next.js app itself. Uses the modular
// firebase-admin API (import from "firebase-admin/app" etc) rather than
// the default namespace import, which doesn't interop cleanly with ESM.
import { initializeApp, cert, getApps } from "firebase-admin/app";

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in .env.local`);
  return v;
}

let app;
export function getAdminApp() {
  if (app) return app;
  const existing = getApps();
  if (existing.length) {
    app = existing[0];
    return app;
  }
  const projectId = required("FIREBASE_ADMIN_PROJECT_ID");
  const clientEmail = required("FIREBASE_ADMIN_CLIENT_EMAIL");
  const privateKey = required("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n");

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
  return app;
}
