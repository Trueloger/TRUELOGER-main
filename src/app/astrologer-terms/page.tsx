import type { Metadata } from "next";
import { LegalPageLayout, PolicySection, PolicyNotice } from "@/components/legal/LegalPageLayout";
import type { PolicyTocEntry } from "@/components/legal/PolicyContents";
import { POLICY_META } from "@/lib/policy/config";

export const metadata: Metadata = {
  title: "Astrologer / Expert Terms | TRUELOGER",
  description: "Terms for astrologers and experts applying to join TrueLoger.",
};

const SECTIONS: PolicyTocEntry[] = [
  { id: "application", title: "1. Application & Review" },
  { id: "eligibility", title: "2. Eligibility & Truthful Information" },
  { id: "conduct", title: "3. Code of Conduct" },
  { id: "confidentiality", title: "4. Confidentiality" },
  { id: "commercial", title: "5. Commercial Terms" },
  { id: "content", title: "6. Content Ownership" },
  { id: "suspension", title: "7. Suspension & Platform Discretion" },
];

export default function AstrologerTermsPage() {
  return (
    <LegalPageLayout title="Astrologer / Expert Terms" lastUpdated={POLICY_META.astrologerTerms.lastUpdated} toc={SECTIONS}>
      <PolicySection id="application" title="1. Application & Review">
        <p>
          Applying to become an astrologer/expert on TrueLoger involves submitting your personal and professional
          details, your areas of expertise, languages, experience, and a resume/CV through our{" "}
          <a href="/register-as-astrologer" className="text-nav-amethyst-deep hover:underline">registration form</a>.
          Every application is reviewed by our team; submission does not guarantee acceptance. Your application
          starts in &quot;Pending&quot; status and moves through review to a final decision, which we will
          communicate to you by email.
        </p>
      </PolicySection>

      <PolicySection id="eligibility" title="2. Eligibility & Truthful Information">
        <p>
          You must provide accurate, truthful information about your experience, qualifications, and expertise.
          Misrepresenting your qualifications, experience, or identity is grounds for immediate rejection or
          removal from the platform.
        </p>
      </PolicySection>

      <PolicySection id="conduct" title="3. Code of Conduct">
        <p>As an astrologer/expert interacting with TrueLoger customers, you agree not to:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Engage in harassment, hate speech, or discriminatory behavior of any kind;</li>
          <li>Engage in sexual misconduct or inappropriate conduct toward a customer;</li>
          <li>Coerce or pressure a customer into additional purchases beyond what they sought;</li>
          <li>Impersonate a medical professional or make medical diagnostic claims;</li>
          <li>Guarantee a specific outcome from a consultation, remedy, or reading;</li>
          <li>Misrepresent certifications or qualifications you do not hold;</li>
          <li>Misuse a customer&apos;s personal data for any purpose outside the consultation itself;</li>
          <li>Solicit a customer to pay you outside the platform for a service TrueLoger facilitates.</li>
        </ul>
      </PolicySection>

      <PolicySection id="confidentiality" title="4. Confidentiality">
        <p>
          Information a customer shares with you during a consultation is confidential and must not be
          disclosed, shared, or used for any purpose beyond providing that consultation.
        </p>
      </PolicySection>

      <PolicySection id="commercial" title="5. Commercial Terms">
        <PolicyNotice tone="placeholder">
          <strong>Configuration/legal-review item:</strong> commission percentages, payout schedule, and other
          commercial terms between TrueLoger and an accepted astrologer/expert have not yet been finalized in
          this document and must be confirmed with each accepted applicant directly before publication as a
          final policy. See LEGAL_REVIEW_CHECKLIST.md.
        </PolicyNotice>
      </PolicySection>

      <PolicySection id="content" title="6. Content Ownership">
        <p>
          Any content you provide as part of your profile (bio, credentials) may be displayed on the platform to
          customers. You retain ownership of your professional credentials and qualifications; TrueLoger may
          use your submitted profile information solely to present your services on the platform.
        </p>
      </PolicySection>

      <PolicySection id="suspension" title="7. Suspension & Platform Discretion">
        <p>
          We may suspend or remove an astrologer/expert from the platform, with or without notice, for violating
          this Code of Conduct, providing false information, or for any conduct that we reasonably believe harms
          customers or the platform&apos;s integrity.
        </p>
      </PolicySection>
    </LegalPageLayout>
  );
}
