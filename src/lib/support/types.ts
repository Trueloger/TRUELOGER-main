// src/lib/support/types.ts
// One lightweight ticket system backs Contact, Grievance, and every
// order/report/meeting "Need help?" link — a single category field
// distinguishes them, per AGENTS "do not create an unnecessarily
// complex help-desk system."
export type SupportCategory =
  | "general"
  | "order"
  | "payment"
  | "consultation"
  | "healing"
  | "puja"
  | "course"
  | "gemstone"
  | "report"
  | "meeting"
  | "account"
  | "technical"
  | "grievance"
  | "privacy"
  | "other";

export const SUPPORT_CATEGORIES: { value: SupportCategory; label: string }[] = [
  { value: "general", label: "General Enquiry" },
  { value: "order", label: "Order" },
  { value: "payment", label: "Payment" },
  { value: "consultation", label: "Consultation" },
  { value: "healing", label: "Healing" },
  { value: "puja", label: "Puja" },
  { value: "course", label: "Course" },
  { value: "gemstone", label: "Gemstone / Product" },
  { value: "report", label: "Personalized Report" },
  { value: "meeting", label: "Meeting / Google Meet" },
  { value: "account", label: "Account" },
  { value: "technical", label: "Technical Issue" },
  { value: "privacy", label: "Privacy Request" },
  { value: "grievance", label: "Grievance / Complaint" },
  { value: "other", label: "Other" },
];

export type TicketStatus = "Open" | "In Review" | "Waiting for Customer" | "Resolved" | "Closed";
export const TICKET_STATUSES: TicketStatus[] = ["Open", "In Review", "Waiting for Customer", "Resolved", "Closed"];

/** Privacy-request-specific sub-type, used only when category is
 * "privacy" — reflects the DPDP-aligned rights this project can
 * actually action (access/correct/delete/withdraw-consent/complaint),
 * not an invented broader set. */
export type PrivacyRequestType = "access" | "correction" | "deletion" | "withdraw-consent" | "complaint";

export type SupportTicket = {
  id: string;
  userId: string | null; // null for an unauthenticated Contact-page submission
  name: string;
  email: string;
  category: SupportCategory;
  privacyRequestType?: PrivacyRequestType;
  orderId?: string;
  reportId?: string;
  meetingId?: string;
  message: string;
  status: TicketStatus;
  adminNote?: string;
  createdAt: number;
  updatedAt: number;
};
