// src/app/api/admin/google/callback/route.ts
// Hit directly by Google's redirect after consent — deliberately NOT
// gated by verifyAdminRequest (there's no Authorization header on a
// browser-navigated redirect); the `state` param (created by
// connect-url, single-use, 10-minute expiry) is the real gate here.
import { NextResponse } from "next/server";
import { consumeState, createOAuthClient, storeHostTokens } from "@/lib/google/oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  const redirectTo = (query: string) => NextResponse.redirect(`${appOrigin(request)}/admin/google${query}`);

  if (errorParam) return redirectTo(`?error=${encodeURIComponent(errorParam)}`);
  if (!code || !state) return redirectTo("?error=missing_code_or_state");

  const validState = await consumeState(state);
  if (!validState) return redirectTo("?error=invalid_or_expired_state");

  try {
    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token) {
      // Google omits refresh_token on a repeat consent unless
      // prompt=consent forces it (already set in buildConsentUrl) —
      // if this still happens, the admin needs to revoke prior access
      // at myaccount.google.com/permissions and reconnect.
      return redirectTo("?error=no_refresh_token");
    }
    client.setCredentials(tokens);

    // Fetch the connected account's email for display in /admin/google.
    const { google } = await import("googleapis");
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const userinfo = await oauth2.userinfo.get();
    const email = userinfo.data.email ?? "unknown";

    await storeHostTokens(tokens.refresh_token, email);
    return redirectTo("?connected=1");
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return redirectTo(`?error=${encodeURIComponent(message)}`);
  }
}

function appOrigin(request: Request): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
}
