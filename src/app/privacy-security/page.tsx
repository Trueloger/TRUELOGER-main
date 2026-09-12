import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, PolicySection } from "@/components/legal/LegalPageLayout";
import type { PolicyTocEntry } from "@/components/legal/PolicyContents";
import { POLICY_META } from "@/lib/policy/config";

export const metadata: Metadata = {
  title: "Privacy & Security | TRUELOGER",
  description: "The technical security practices behind TrueLoger's platform.",
};

const SECTIONS: PolicyTocEntry[] = [
  { id: "authentication", title: "1. Authentication" },
  { id: "access-control", title: "2. Access Control" },
  { id: "payments", title: "3. Payment Security" },
  { id: "private-files", title: "4. Reports, PDFs & Resumes" },
  { id: "encryption", title: "5. Encryption" },
  { id: "admin", title: "6. Admin Access" },
  { id: "incidents", title: "7. Security Incidents" },
  { id: "not-claimed", title: "8. What We Do Not Claim" },
];

export default function PrivacySecurityPage() {
  return (
    <LegalPageLayout
      title="Privacy & Security"
      lastUpdated={POLICY_META.privacySecurity.lastUpdated}
      toc={SECTIONS}
      intro={
        <p>
          This page explains, in plain terms, the actual technical controls behind TrueLoger — not marketing
          claims. For what data we collect and why, see our <Link href="/privacy-policy" className="text-nav-amethyst-deep hover:underline">Privacy Policy</Link>.
        </p>
      }
    >
      <PolicySection id="authentication" title="1. Authentication">
        <p>
          Sign-in is handled by Firebase Authentication (email/password or Google Sign-In). We never see or
          store your password — Firebase handles credential verification, and for Google Sign-In, your Google
          password is never shared with us at all.
        </p>
      </PolicySection>

      <PolicySection id="access-control" title="2. Access Control">
        <p>
          Every server-side action that reads or writes personal data verifies the caller&apos;s identity from a
          signed Firebase ID token — never a value the browser is trusted to self-report. Firestore Security
          Rules additionally restrict direct database reads so a signed-in user can only read their own profile,
          orders, reports, and meetings; a real cross-user isolation test (one user attempting to access
          another user&apos;s report/PDF) was run against this system and confirmed to correctly deny access.
        </p>
      </PolicySection>

      <PolicySection id="payments" title="3. Payment Security">
        <p>
          Payments are processed by Cashfree Payments. Your card, UPI, or net-banking credentials are entered
          directly on Cashfree&apos;s own secure checkout and are never transmitted to or stored by TrueLoger. We
          store only the payment reference and status Cashfree reports back to us. We do not claim PCI-DSS
          certification for TrueLoger itself — that responsibility sits with Cashfree as the payment processor.
        </p>
      </PolicySection>

      <PolicySection id="private-files" title="4. Reports, PDFs & Resumes">
        <p>
          Generated report PDFs and astrologer-application resumes are stored in private cloud storage —
          neither is ever given a public URL. A report PDF is only ever served to its owning user (verified by
          server-side ownership check) or an admin; a resume is only ever accessible to an authenticated admin
          via a dedicated, access-controlled route.
        </p>
      </PolicySection>

      <PolicySection id="encryption" title="5. Encryption">
        <p>
          All traffic to and from the site is served over HTTPS/TLS. Data at rest in our database and file
          storage is encrypted using our infrastructure providers&apos; (Google Firebase) standard encryption-at-rest.
        </p>
      </PolicySection>

      <PolicySection id="admin" title="6. Admin Access">
        <p>
          Administrative access is granted only via a server-controlled Firebase custom claim, never a
          client-editable flag — a normal user account cannot make itself an admin by any action available in
          the app. Admin actions (editing prices, viewing orders, reviewing applications) are themselves
          re-verified server-side on every request.
        </p>
      </PolicySection>

      <PolicySection id="incidents" title="7. Security Incidents">
        <p>
          If we become aware of a security incident affecting your personal data, we will take reasonable steps
          to contain it and notify affected users and, where legally required, the relevant authority (India&apos;s
          CERT-In publishes directions relevant to incident reporting for covered entities). We do not publish
          internal infrastructure details, logs, or specific controls that could assist an attacker.
        </p>
      </PolicySection>

      <PolicySection id="not-claimed" title="8. What We Do Not Claim">
        <p>
          We do not claim TrueLoger is &quot;100% secure,&quot; unhackable, or holds any certification (ISO,
          SOC 2, PCI-DSS, or otherwise) that has not actually been obtained. Security is an ongoing practice,
          not a one-time guarantee.
        </p>
      </PolicySection>
    </LegalPageLayout>
  );
}
