// src/app/api/admin/products/upload-image/route.ts
// Admin-only image upload for a product's gallery slots. Accepts a
// single file via multipart/form-data (field name "file"), validates
// it server-side (type + size — never trust the browser's own
// <input accept> filtering, that's a UI hint only), and stores it in
// Firebase Storage via the Admin SDK — the same "server does the real
// work, client only ever gets back a safe result" pattern every other
// admin write in this codebase follows. Returns the file's public URL
// for the admin form to drop straight into a ProductGallerySlot's
// `src` field.
//
// Deliberately server-side-mediated rather than a direct
// client-to-Storage upload (which would need its own Storage Security
// Rules to gate who can write, and a signed-upload-URL dance to keep
// that gate real) — routing through this admin-auth-gated route reuses
// the exact same verifyAdminRequest check every other /api/admin/*
// route already relies on, with no separate rules file to keep in
// sync.
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { getAdminApp } from "@/lib/firebase-admin";
import { getStorage } from "firebase-admin/storage";

export const maxDuration = 30;

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB — plenty for a product photo, small enough to stay fast.
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload — expected multipart/form-data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload a JPEG, PNG, or WEBP image." },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Image is too large — please keep it under 5MB." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "That file appears to be empty." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const objectPath = `products/${Date.now()}-${randomBytes(6).toString("hex")}.${extension}`;

  try {
    const bucket = getStorage(getAdminApp()).bucket();
    const object = bucket.file(objectPath);
    await object.save(buffer, {
      contentType: file.type,
      // Product photos are public storefront content by nature (the
      // same images end up on the public /gemstones pages) — making
      // the object itself public at upload time gives a permanent,
      // token-free URL, rather than a signed URL that would need
      // periodic renewal for no real benefit here.
      public: true,
      metadata: { cacheControl: "public, max-age=31536000, immutable" },
    });

    const url = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 502 });
  }
}
