// src/lib/admin-notifications/store.ts
// Per-admin "last seen" state for the unseen-count badges — stored at
// adminNotifications/{adminUid}, one doc per admin (not shared across
// admins), so each admin's badge reflects their own last visit to a
// tab, not a global "someone looked at this" flag.
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { countPaidOrdersSince } from "@/lib/orders/store";
import { countMeetingsSince } from "@/lib/meetings/store";
import { countApplicationsSince } from "@/lib/astrologers/store";
import { countReadyReportsSince } from "@/lib/reports/store";

const COLLECTION = "adminNotifications";

export type NotificationTab = "orders" | "meetings" | "astrologerApplications" | "reports";
const TABS: NotificationTab[] = ["orders", "meetings", "astrologerApplications", "reports"];

type LastSeenMap = Partial<Record<NotificationTab, number>>;

function db() {
  return getFirestore(getAdminApp());
}

async function getLastSeen(adminUid: string): Promise<LastSeenMap> {
  const snap = await db().collection(COLLECTION).doc(adminUid).get();
  return snap.exists ? (snap.data() as LastSeenMap) : {};
}

export async function getUnseenCounts(adminUid: string): Promise<Record<NotificationTab, number>> {
  const lastSeen = await getLastSeen(adminUid);
  // Never-visited tabs default to "0 unseen" (not "everything ever
  // created") — an admin's FIRST visit to a brand-new tab shouldn't
  // show an alarming full-catalogue count; the badge is only
  // meaningful once a baseline "last seen" exists.
  const since = (tab: NotificationTab) => lastSeen[tab] ?? Date.now();

  const [orders, meetings, astrologerApplications, reports] = await Promise.all([
    countPaidOrdersSince(since("orders")),
    countMeetingsSince(since("meetings")),
    countApplicationsSince(since("astrologerApplications")),
    countReadyReportsSince(since("reports")),
  ]);

  return { orders, meetings, astrologerApplications, reports };
}

export async function markTabSeen(adminUid: string, tab: NotificationTab): Promise<void> {
  if (!TABS.includes(tab)) return;
  await db()
    .collection(COLLECTION)
    .doc(adminUid)
    .set({ [tab]: Date.now() }, { merge: true });
}
