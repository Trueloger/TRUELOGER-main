"use client";

// src/lib/auth/authed-fetch.ts
// Client-side helper: attaches the current Firebase ID token as
// `Authorization: Bearer <token>` to a fetch call — the one place this
// header gets built, so every protected page (profile, orders,
// checkout, admin) authenticates the same way. Throws a clear error if
// called while signed out rather than silently sending an
// unauthenticated request.
import { firebaseAuth } from "@/lib/firebase-client";

export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const user = firebaseAuth.currentUser;
  if (!user) {
    throw new Error("You need to be signed in to do that.");
  }
  const idToken = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${idToken}`);
  // FormData bodies (e.g. the admin product-image upload) must NOT get
  // an explicit Content-Type here — the browser sets one itself with
  // the correct multipart boundary parameter, which we have no way to
  // replicate by hand. Forcing "application/json" on top of it would
  // silently break the server's multipart parsing.
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, { ...init, headers });
}
