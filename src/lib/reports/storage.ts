// src/lib/reports/storage.ts
// Firebase Storage access for finalized report PDFs — PRIVATE, unlike
// the admin product-image uploads (src/app/api/admin/products/upload-image/route.ts),
// which are deliberately public storefront content. A report PDF
// contains a customer's real birth details and personal chart
// interpretation, so the object is never made public here (AGENTS
// §91/§93/§94) — only /api/reports/[id]/pdf (ownership + READY
// checked) can read it, via a short-lived signed URL generated
// on-demand per request rather than a permanent public link.
import { getAdminApp } from "@/lib/firebase-admin";
import { getStorage } from "firebase-admin/storage";

function bucket() {
  return getStorage(getAdminApp()).bucket();
}

export async function uploadReportPdf(reportId: string, pdfBuffer: Buffer): Promise<{ storageRef: string }> {
  const objectPath = `reports/${reportId}.pdf`;
  await bucket().file(objectPath).save(pdfBuffer, {
    contentType: "application/pdf",
    // Explicitly private — no `public: true` here, unlike the product
    // image uploader. Firebase Storage objects default to private
    // (bucket-level IAM only) unless made public, so this is also just
    // documenting that choice rather than changing default behavior.
    metadata: { cacheControl: "private, max-age=0, no-store" },
  });
  return { storageRef: objectPath };
}

/** A short-lived (10 minute) signed download URL — generated fresh on
 * every authorized request rather than stored, so there is never a
 * long-lived public link to a private report sitting in Firestore. */
export async function getReportPdfSignedUrl(storageRef: string): Promise<string> {
  const [url] = await bucket().file(storageRef).getSignedUrl({
    action: "read",
    expires: Date.now() + 10 * 60 * 1000,
  });
  return url;
}
