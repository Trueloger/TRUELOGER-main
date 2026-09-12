// src/lib/policy/config.ts
// Centralized policy metadata (per AGENTS "do not scatter policy dates
// throughout the components") — every legal/policy page reads its
// "Last updated" date and version from here, never a hardcoded string
// in the page component itself. Update a date ONCE, here, when a
// page's content actually changes.
//
// Business/legal identity fields below (entityName, registeredAddress,
// gstin, grievanceOfficer, jurisdiction) are PLACEHOLDERS — this
// project has no real registered-business information configured
// anywhere (see src/components/footer/footer-data.ts's own
// placeholder email/phone). Every policy page must read these from
// here rather than hardcoding "[Legal Entity Name]" inline in 15
// different files, so filling in the real details later is a
// one-file change. See LEGAL_REVIEW_CHECKLIST.md at the repo root for
// the full list of what needs real business/legal input before these
// pages are relied upon as final, binding documents.
export type PolicyKey =
  | "terms"
  | "privacy"
  | "privacySecurity"
  | "refundCancellation"
  | "shippingDelivery"
  | "paymentBilling"
  | "disclaimer"
  | "cookiePolicy"
  | "dataDeletion"
  | "grievance"
  | "accessibility"
  | "astrologerTerms";

export type PolicyMeta = { lastUpdated: string; version: string };

export const POLICY_META: Record<PolicyKey, PolicyMeta> = {
  terms: { lastUpdated: "13 September 2026", version: "1.1" },
  privacy: { lastUpdated: "13 September 2026", version: "1.0" },
  privacySecurity: { lastUpdated: "13 September 2026", version: "1.0" },
  refundCancellation: { lastUpdated: "13 September 2026", version: "1.0" },
  shippingDelivery: { lastUpdated: "13 September 2026", version: "1.0" },
  paymentBilling: { lastUpdated: "13 September 2026", version: "1.0" },
  disclaimer: { lastUpdated: "13 September 2026", version: "1.0" },
  cookiePolicy: { lastUpdated: "13 September 2026", version: "1.0" },
  dataDeletion: { lastUpdated: "13 September 2026", version: "1.0" },
  grievance: { lastUpdated: "13 September 2026", version: "1.0" },
  accessibility: { lastUpdated: "13 September 2026", version: "1.0" },
  astrologerTerms: { lastUpdated: "13 September 2026", version: "1.0" },
};

/** PLACEHOLDER business/legal identity — see this file's doc comment.
 * Every `[bracketed]` value here must be replaced with the real
 * registered business detail before any policy page is relied upon as
 * a final, binding legal document. */
export const BUSINESS_INFO = {
  entityName: "[Legal Entity Name]",
  entityType: "[company/proprietorship/LLP — registered under the laws of India]",
  registeredAddress: "[Registered Business Address, City, State, PIN Code]",
  gstin: "[GSTIN Number]",
  jurisdictionCity: "[City]",
  jurisdictionState: "[State]",
  arbitrationSeat: "[City, State]",
  grievanceOfficer: {
    name: "[Grievance Officer Name]",
    designation: "[Designation]",
  },
};

/** Real support-response wording — no invented SLA. See AGENTS
 * "support SLA" — this project has no published response-time
 * commitment, so every page uses this exact neutral phrase rather
 * than each writer inventing their own "within 24 hours" claim. */
export const SUPPORT_RESPONSE_NOTE = "We aim to respond as promptly as possible.";

