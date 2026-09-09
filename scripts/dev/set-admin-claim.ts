// scripts/dev/set-admin-claim.ts
// One-off, server-side ADMIN BOOTSTRAP script. Sets the `admin: true`
// Firebase custom claim on the account for the given email — this is
// the ONLY supported way to grant admin access in this system (see
// src/lib/auth/verify-request.ts::verifyAdminRequest, which checks
// exactly this claim). Deliberately NOT an API route — a claim-setting
// endpoint reachable over HTTP would itself need to be admin-gated,
// which is a chicken-and-egg problem this script sidesteps by running
// with the Admin SDK's full trust, directly against the real project,
// invoked by a human with server/repo access only.
//
// This script does NOT create the account — the target user must have
// already signed up through the site's normal Signup flow first (so
// their password lives only in Firebase Auth, never touched by this
// script). If no account exists yet for the given email, this exits
// with a clear message instead of fabricating one.
//
// Usage: node --env-file=.env.local scripts/dev/set-admin-claim.ts <email>
import { getAdminApp } from "../../src/lib/firebase-admin.ts";
import { getAuth } from "firebase-admin/auth";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node --env-file=.env.local scripts/dev/set-admin-claim.ts <email>");
    process.exit(1);
  }

  const auth = getAuth(getAdminApp());

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    console.error(
      `No Firebase Auth account exists for ${email} yet. Ask them to sign up on the site first, then re-run this script.`,
    );
    process.exit(1);
  }

  await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: true });
  console.log(`Admin claim set for ${email} (uid: ${user.uid}).`);
  console.log("They must sign out and sign back in (or their ID token refresh) for the claim to take effect.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
