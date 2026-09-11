// src/app/api/admin/astrologer-applications/[id]/resume/route.ts
// Admin-only resume access. Streams the file directly (rather than
// redirecting to a signed URL) so the resume never touches a URL bar
// or browser history, matching the report-PDF route's own pattern.
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { getApplication } from "@/lib/astrologers/store";
import { getAdminApp } from "@/lib/firebase-admin";
import { getStorage } from "firebase-admin/storage";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { id } = await params;
  const application = await getApplication(id);
  if (!application) return NextResponse.json({ error: "Not found." }, { status: 404 });

  try {
    const bucket = getStorage(getAdminApp()).bucket();
    const [buffer] = await bucket.file(application.resumeStorageRef).download();
    const extension = application.resumeStorageRef.split(".").pop() ?? "pdf";
    const contentType =
      extension === "pdf"
        ? "application/pdf"
        : extension === "docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/msword";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${application.resumeFileName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Resume file not found." }, { status: 404 });
  }
}
