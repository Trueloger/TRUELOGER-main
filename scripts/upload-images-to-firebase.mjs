// One-off: upload every image the site actually references (see the list
// below — deliberately NOT all of public/, which also holds unused
// design-reference screenshots that have no "position" in the app to
// connect to) to Firebase Storage, make each object public, and print
// the resulting local-path -> public-URL mapping as JSON so it can be
// pasted into the source files that reference them.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getAdminApp } from "./firebase-admin-client.mjs";
import { getStorage } from "firebase-admin/storage";

const BUCKET_NAME = "trueloger-d4432.firebasestorage.app";
// Objects live under this prefix in the bucket, mirroring their public/
// path, so the bucket stays organized if other assets get added later.
const DEST_PREFIX = "site-images";

// Every image path actually referenced in src/ (grepped for
// `["'`]/...\.(png|jpg|jpeg|svg|webp)["'`]` across the whole tree).
const IMAGES = [
  "/puja cards.png",
  "/explore-section-cards/vedic-astrology.png",
  "/explore-section-cards/numerology.png",
  "/explore-section-cards/tarot-reading.png",
  "/explore-section-cards/vastu.png",
  "/explore-section-cards/spiritual-healing.png",
  "/explore-section-cards/puja-rituals.png",
  "/personalized-reports/banner.png",
  "/banner/banner-1.png",
  "/banner/banner-2.png",
  "/banner/banner-3.png",
  "/banner/banner-4.png",
  "/banner/banner-5.png",
  "/healing/chakra-healing.png",
  "/healing/aura-cleansing.png",
  "/healing/relationship-healing.png",
  "/healing/money-healing.png",
  "/logo-nav.png",
];

getAdminApp();
const bucket = getStorage().bucket(BUCKET_NAME);
const publicRoot = path.resolve(import.meta.dirname, "..", "public");

const mapping = {};

for (const localPath of IMAGES) {
  const filePath = path.join(publicRoot, localPath);
  const destination = `${DEST_PREFIX}${localPath}`;
  const contents = await readFile(filePath);

  await bucket.file(destination).save(contents, {
    contentType: "image/png",
    public: true,
    metadata: { cacheControl: "public, max-age=31536000, immutable" },
  });

  const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${encodeURI(destination)}`;
  mapping[localPath] = publicUrl;
  console.log(`✓ ${localPath} -> ${publicUrl}`);
}

console.log("\n--- mapping.json ---");
console.log(JSON.stringify(mapping, null, 2));
