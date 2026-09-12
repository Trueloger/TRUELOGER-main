import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, PolicySection, PolicyNotice } from "@/components/legal/LegalPageLayout";
import { POLICY_META } from "@/lib/policy/config";

export const metadata: Metadata = {
  title: "Account & Data Deletion | TRUELOGER",
  description: "How to delete your TrueLoger account and understand what happens to your data.",
};

export default function DataDeletionPage() {
  return (
    <LegalPageLayout
      title="Account & Data Deletion"
      lastUpdated={POLICY_META.dataDeletion.lastUpdated}
      intro={<p>You can permanently delete your TrueLoger account and profile at any time from Account Settings.</p>}
    >
      <PolicySection id="how" title="How to Delete Your Account">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Sign in and go to <Link href="/account/settings" className="text-nav-amethyst-deep hover:underline">Account Settings</Link>.</li>
          <li>Scroll to the <strong>Delete Account</strong> section and select &quot;Delete my account&quot;.</li>
          <li>Re-enter your password to confirm your identity (required by Firebase Authentication before any account deletion).</li>
          <li>Type &quot;DELETE&quot; to confirm — this step is deliberate and cannot be undone.</li>
          <li>Your profile is deleted, your account is removed from Firebase Authentication, and you are signed out.</li>
          <li>You&apos;ll receive a confirmation email.</li>
        </ol>
      </PolicySection>

      <PolicySection id="what-is-deleted" title="What Is Deleted Immediately">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Your Firebase Authentication account (you can no longer sign in with it).</li>
          <li>Your profile document (name, date/time/place of birth, contact details, and other profile fields).</li>
        </ul>
      </PolicySection>

      <PolicySection id="what-is-retained" title="What Is Retained, and Why">
        <p>
          Deleting your account does not delete the following records, which are kept separately and are no
          longer linked to an active, sign-in-able account of yours:
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li><strong>Order and payment records</strong> — retained for accounting, tax, and fraud/dispute-resolution purposes, and because Indian tax and consumer-protection law requires transaction records to be kept for a period even after a customer relationship ends.</li>
          <li><strong>Generated reports</strong> already delivered against a paid order, for the same reason.</li>
          <li><strong>Support tickets and grievances</strong> you previously submitted, for accountability and audit purposes.</li>
          <li><strong>Astrologer applications</strong>, if you separately applied to register as an astrologer — that application is a distinct record from a customer account.</li>
        </ul>
        <PolicyNotice tone="placeholder">
          <strong>Configuration/legal-review item:</strong> the exact retention period for each of the above
          categories has not been finalized by legal/business review — see LEGAL_REVIEW_CHECKLIST.md. This page
          will be updated with a specific retention period once that review is complete.
        </PolicyNotice>
      </PolicySection>

      <PolicySection id="request-only" title="Requesting Deletion of Retained Records">
        <p>
          If you would like to request deletion, correction, or anonymization of a retained record beyond what
          the account-deletion flow above already removes, you can submit a request through our{" "}
          <Link href="/contact" className="text-nav-amethyst-deep hover:underline">Contact page</Link> (category:
          Privacy Request). We will review the request against applicable legal/retention obligations and respond.
        </p>
      </PolicySection>

      <PolicySection id="related" title="Related Pages">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><Link href="/privacy-policy" className="text-nav-amethyst-deep hover:underline">Privacy Policy</Link> — full data-retention section</li>
          <li><Link href="/account/settings" className="text-nav-amethyst-deep hover:underline">Account Settings</Link> — the actual deletion flow</li>
        </ul>
      </PolicySection>
    </LegalPageLayout>
  );
}
