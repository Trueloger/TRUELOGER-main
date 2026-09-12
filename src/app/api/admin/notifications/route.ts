// src/app/api/admin/notifications/route.ts
// GET: this admin's unseen counts. POST {tab}: mark one tab seen.
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/verify-request";
import { getUnseenCounts, markTabSeen, type NotificationTab } from "@/lib/admin-notifications/store";

const VALID_TABS: NotificationTab[] = ["orders", "meetings", "astrologerApplications", "reports", "support"];

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const counts = await getUnseenCounts(admin.uid);
  return NextResponse.json({ counts });
}

export async function POST(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin) return NextResponse.json({ error: "Not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { tab } = (body as Record<string, unknown>) ?? {};
  if (typeof tab !== "string" || !VALID_TABS.includes(tab as NotificationTab)) {
    return NextResponse.json({ error: "Invalid tab." }, { status: 400 });
  }

  await markTabSeen(admin.uid, tab as NotificationTab);
  return NextResponse.json({ ok: true });
}
