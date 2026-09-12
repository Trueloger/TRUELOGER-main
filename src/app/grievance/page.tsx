import type { Metadata } from "next";
import { SupportForm } from "@/components/legal/SupportForm";
import { LegalPageLayout, PolicySection, PolicyNotice } from "@/components/legal/LegalPageLayout";
import { BUSINESS_INFO, POLICY_META, SUPPORT_RESPONSE_NOTE } from "@/lib/policy/config";
import { FOOTER_CONTACT } from "@/components/footer/footer-data";

export const metadata: Metadata = {
  title: "Grievance Redressal | TRUELOGER",
  description: "Submit a grievance or complaint to TrueLoger and track its resolution.",
};

export default function GrievancePage() {
  return (
    <LegalPageLayout
      title="Grievance Redressal"
      lastUpdated={POLICY_META.grievance.lastUpdated}
      intro={
        <p>
          If you have a complaint about any order, consultation, report, Puja, healing session, course, or how
          your personal data has been handled, you can raise it here. This mechanism is provided in line with
          the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and the
          Consumer Protection (E-Commerce) Rules, 2020, which require published grievance-officer contact
          details and a complaint mechanism for platforms of this kind.
        </p>
      }
    >
      <PolicySection id="officer" title="Grievance Officer">
        <PolicyNotice tone="placeholder">
          <strong>Configuration placeholder:</strong> the Grievance Officer&apos;s name and designation below must
          be filled in with the actual appointed person before this page is relied upon as a final, binding
          disclosure. See LEGAL_REVIEW_CHECKLIST.md.
        </PolicyNotice>
        <div className="mt-3 rounded-xl border border-nav-lavender-line bg-white/60 p-4 text-sm">
          <p><strong>Grievance Officer:</strong> {BUSINESS_INFO.grievanceOfficer.name}</p>
          <p className="mt-1"><strong>Designation:</strong> {BUSINESS_INFO.grievanceOfficer.designation}</p>
          <p className="mt-1"><strong>Email:</strong> {FOOTER_CONTACT.email}</p>
          <p className="mt-1"><strong>Phone:</strong> {FOOTER_CONTACT.phone}</p>
        </div>
      </PolicySection>

      <PolicySection id="process" title="How It Works">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Submit the form below with your details and complaint.</li>
          <li>You&apos;ll receive a reference number and a confirmation email immediately.</li>
          <li>Your complaint is reviewed and, where applicable, an acknowledgment is sent.</li>
          <li>{SUPPORT_RESPONSE_NOTE}</li>
          <li>You can follow up by replying to the confirmation email with your reference number.</li>
        </ol>
      </PolicySection>

      <PolicySection id="form" title="Submit a Grievance">
        <SupportForm fixedCategory="grievance" heading="Grievance Details" />
      </PolicySection>
    </LegalPageLayout>
  );
}
