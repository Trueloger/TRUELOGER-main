// scripts/dev/verify-firebase-admin.ts
// Manual connectivity check — proves the FIREBASE_ADMIN_* credentials
// in .env.local actually authenticate against the real project. Not
// an automated test (there's no way to fake Firestore in this repo);
// re-run this any time Firestore access seems broken.
//
// Usage: node --env-file=.env.local scripts/dev/verify-firebase-admin.ts
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKeyRaw) {
  throw new Error("Missing FIREBASE_ADMIN_* env vars — run with --env-file=.env.local");
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
    }),
  });

const db = getFirestore(app);
const ref = db.collection("_connectivityProbe").doc("verify-firebase-admin");

await ref.set({ checkedAt: new Date().toISOString() });
const snap = await ref.get();
console.log("write+read ok:", snap.data());
await ref.delete();
console.log("cleanup ok — Firestore connectivity confirmed");
