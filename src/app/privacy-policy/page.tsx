import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, PolicySection, PolicyNotice } from "@/components/legal/LegalPageLayout";
import type { PolicyTocEntry } from "@/components/legal/PolicyContents";
import { POLICY_META, BUSINESS_INFO } from "@/lib/policy/config";
import { FOOTER_CONTACT } from "@/components/footer/footer-data";

export const metadata: Metadata = {
  title: "Privacy Policy | TRUELOGER",
  description: "How TrueLoger collects, uses, and protects your personal data.",
};

const SECTIONS: PolicyTocEntry[] = [
  { id: "who", title: "1. Who This Policy Covers" },
  { id: "data-we-collect", title: "2. Data We Actually Collect" },
  { id: "why", title: "3. Why We Collect It" },
  { id: "ai-processing", title: "4. AI Processing (Reports)" },
  { id: "third-parties", title: "5. Third Parties We Share Data With" },
  { id: "cookies", title: "6. Cookies & Tracking" },
  { id: "retention", title: "7. How Long We Keep Data" },
  { id: "security", title: "8. Security" },
  { id: "rights", title: "9. Your Rights" },
  { id: "consent", title: "10. Consent & Withdrawal" },
  { id: "children", title: "11. Children" },
  { id: "changes", title: "12. Changes to This Policy" },
  { id: "contact", title: "13. Contact & Grievance" },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated={POLICY_META.privacy.lastUpdated}
      toc={SECTIONS}
      intro={
        <>
          <p>
            This Privacy Policy explains, in plain language, what personal data TrueLoger actually collects
            through its website and app, why, who we share it with, and what rights you have over it. It is
            written to reflect the categories of data our platform is actually built to process — not a generic
            template — and is aligned with the Digital Personal Data Protection Act, 2023 and the Digital
            Personal Data Protection Rules, 2025 to the extent those provisions are in effect.
          </p>
          <PolicyNotice>
            <strong>Data → Purpose → Retention → Your Rights.</strong> Every category of data below follows that
            structure so you can see exactly what it&apos;s for and how long it&apos;s kept, rather than a single long
            paragraph.
          </PolicyNotice>
        </>
      }
      footnote={
        <p>
          This document describes TrueLoger&apos;s actual data practices as implemented. It is not a substitute
          for legal advice, and the placeholder business/legal details in it (see Section 1 and 13) require
          confirmation by qualified counsel before this is relied upon as final. See LEGAL_REVIEW_CHECKLIST.md.
        </p>
      }
    >
      <PolicySection id="who" title="1. Who This Policy Covers">
        <p>
          This Policy applies to anyone who visits, registers on, or purchases from the TrueLoger website,
          operated by <strong>{BUSINESS_INFO.entityName}</strong> ({BUSINESS_INFO.entityType}), registered at{" "}
          {BUSINESS_INFO.registeredAddress} (&quot;TrueLoger&quot;, &quot;we&quot;, &quot;us&quot;). If you only
          use our free tools (Kundli, horoscope, numerology calculators, etc.) without creating an account, only
          the technical/browser data described below applies to you.
        </p>
      </PolicySection>

      <PolicySection id="data-we-collect" title="2. Data We Actually Collect">
        <p>Organized by the part of the platform that collects it — we do not list categories we don&apos;t actually use.</p>

        <DataBlock
          title="Account data"
          fields="Name, email, phone (if provided), authentication provider (email/password or Google Sign-In)."
          purpose="Creating and securing your account, signing you in, and contacting you about your orders/bookings."
          retention="For the life of your account; deleted when you delete your account (see Data Deletion page), except where a linked order/payment record is separately retained."
        />
        <DataBlock
          title="Profile data"
          fields="Date of birth, time of birth, place of birth, resolved coordinates and timezone, gender (if provided)."
          purpose="This is the single source of truth for every astrological calculation on the platform — free tools, paid consultations, and personalized reports. It is captured once in your profile and reused, never re-typed per purchase."
          retention="Kept while your account exists; a personalized report already generated uses a frozen SNAPSHOT of this data taken at the time you purchased it, so a later profile edit never silently changes an already-delivered report."
        />
        <DataBlock
          title="Order & payment data"
          fields="What you purchased, price/discount/tax breakdown, coupon codes used, and payment references/status from our payment gateway (Cashfree). We do not receive or store your card, UPI, or net-banking credentials — those are captured directly by Cashfree."
          purpose="Processing your purchase, fulfilling it, showing your order history, and handling refunds/disputes."
          retention="Retained for accounting, tax, and dispute-resolution purposes even after account deletion — see the Data Deletion page."
        />
        <DataBlock
          title="Consultation & meeting data"
          fields="Service booked, duration, your preferred date/time, and — once a Google Meet link is created — the meeting's Google Calendar event details."
          purpose="Scheduling your consultation and creating a real Google Meet link for it (see Section 5 on Google)."
          retention="Kept with the related order record."
        />
        <DataBlock
          title="Personalized report data"
          fields="The immutable profile snapshot used to generate the report, the calculated astrological data (planetary positions, houses, dashas, yogas, etc.), the AI-generated narrative sections, and the final PDF."
          purpose="Generating and delivering your report, and letting you view/re-download it later."
          retention="Kept as part of your order history; the PDF is stored privately and is never publicly accessible (see Section 8)."
        />
        <DataBlock
          title="Astrologer application data"
          fields="If you apply to register as an astrologer: name, email, phone, location, experience, expertise, languages, a written &quot;about you&quot;, and your uploaded resume file."
          purpose="Reviewing your application to join TrueLoger's consultant roster."
          retention="Kept while the application is active/under review; the resume file is stored privately and is only ever accessible to admins reviewing applications."
        />
        <DataBlock
          title="Support & grievance data"
          fields="Whatever you write in a Contact, Grievance, or order/report/meeting support request — your name, email, category, message, and any order/report/meeting reference you attach."
          purpose="Responding to your request."
          retention="Kept for accountability/audit purposes; see the Data Deletion page."
        />
        <DataBlock
          title="Technical data"
          fields="Standard web-server/browser data such as IP address and basic request logs, collected automatically by our hosting provider (Vercel) as part of normal operation — not collected or processed separately by TrueLoger's own code."
          purpose="Security, abuse prevention, and diagnosing technical issues."
          retention="Governed by our hosting provider's own log-retention practices."
        />
      </PolicySection>

      <PolicySection id="why" title="3. Why We Collect It">
        <p>
          Every category above exists to run a specific, real feature of the platform — never collected merely
          &quot;because it&apos;s common for websites to collect it.&quot; If a field isn&apos;t listed in
          Section 2, we don&apos;t collect it.
        </p>
      </PolicySection>

      <PolicySection id="ai-processing" title="4. AI Processing (Reports)">
        <p>
          Personalized reports combine two distinct things: (a) real astrological calculations, performed
          entirely by our own deterministic calculation engine — never invented or altered by AI — and (b)
          narrative interpretation of those calculations, generated section-by-section by an AI model (Claude,
          via the OpenRouter API) based on developer-written prompts.
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>
            <strong>What is sent:</strong> only the specific calculated data fields a given report section
            actually needs (e.g. planetary positions for a planetary-positions section) — never your name,
            contact details, or full profile, and never the whole report&apos;s data in one request.
          </li>
          <li>
            <strong>Why:</strong> to write the human-readable interpretive text that makes up each report
            section.
          </li>
          <li>
            <strong>Retention by the AI provider:</strong> we have not independently verified OpenRouter/Claude&apos;s
            data-retention practices for API requests at the time of writing this page, and do not claim the
            provider retains no data at all — this is a legal-review item (see LEGAL_REVIEW_CHECKLIST.md). Do
            not rely on this page as a representation of the provider&apos;s own retention policy; refer to
            OpenRouter&apos;s and Anthropic&apos;s own current terms.
          </li>
        </ul>
        <p className="mt-2">
          AI-generated interpretation is not a substitute for professional medical, legal, or financial advice,
          and can contain errors — see our <Link href="/disclaimer" className="text-nav-amethyst-deep hover:underline">Disclaimer</Link>.
        </p>
      </PolicySection>

      <PolicySection id="third-parties" title="5. Third Parties We Share Data With">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Firebase (Google)</strong> — authentication and our primary database (Firestore) and file storage. If you sign in with Google, Google shares your basic account info (name, email) with us for that purpose; we never see or receive your Google password.</li>
          <li><strong>Cashfree Payments</strong> — processes your payment. Cashfree receives whatever payment/customer information it needs to process the transaction; we do not receive your card/UPI credentials in return.</li>
          <li><strong>Google Calendar / Google Meet</strong> — used to create a real meeting link for paid consultations. Only your name, email, and appointment schedule are shared with this integration, only for bookings that require a meeting.</li>
          <li><strong>OpenRouter / Anthropic (Claude)</strong> — processes the specific report-section data described in Section 4.</li>
          <li><strong>Resend</strong> — our transactional email provider, used to send order confirmations, booking confirmations, and similar account emails. Resend receives your email address and the content of the specific email being sent.</li>
          <li><strong>Vercel</strong> — our hosting provider, which necessarily processes standard request/technical data to serve the website.</li>
        </ul>
        <p className="mt-2">We do not sell personal data to anyone, and do not use third-party advertising or marketing-analytics trackers (see Section 6).</p>
      </PolicySection>

      <PolicySection id="cookies" title="6. Cookies & Tracking">
        <p>
          See our dedicated <Link href="/cookie-policy" className="text-nav-amethyst-deep hover:underline">Cookie Policy</Link> for
          the full, audited list of what this site actually stores in your browser. In summary: only essential
          authentication-session and cart-persistence storage, and whatever cookies Cashfree&apos;s own checkout page
          sets during payment. No advertising or marketing-analytics cookies are currently used.
        </p>
      </PolicySection>

      <PolicySection id="retention" title="7. How Long We Keep Data">
        <p>
          Retention is described per data category in Section 2. Where an exact legally-mandated retention
          period applies (for example, under tax or accounting law) and has not yet been confirmed by legal
          review for this business, that is flagged as a configuration/legal-review item rather than an invented
          number — see LEGAL_REVIEW_CHECKLIST.md.
        </p>
      </PolicySection>

      <PolicySection id="security" title="8. Security">
        <p>
          See our dedicated <Link href="/privacy-security" className="text-nav-amethyst-deep hover:underline">Privacy & Security</Link> page
          for how we actually protect your data (access controls, private storage for reports/resumes, server-side
          authorization, etc.). We do not claim any specific security certification unless we actually hold it.
        </p>
      </PolicySection>

      <PolicySection id="rights" title="9. Your Rights">
        <p>Under the Digital Personal Data Protection Act, 2023 (to the extent its provisions are in effect) and applicable Indian law, you may:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Access the personal data we hold about you;</li>
          <li>Request correction of inaccurate or incomplete data;</li>
          <li>Request erasure of your personal data, subject to our legal/accounting retention obligations (see Section 7 and the Data Deletion page);</li>
          <li>Withdraw consent where consent is the basis for processing, as easily as you gave it;</li>
          <li>Raise a grievance with us, and, where applicable, escalate it to the relevant authority.</li>
        </ul>
        <p className="mt-2">
          You can exercise any of these rights via our <Link href="/contact" className="text-nav-amethyst-deep hover:underline">Contact page</Link> (select
          &quot;Privacy Request&quot;), or delete your account directly from Account Settings.
        </p>
      </PolicySection>

      <PolicySection id="consent" title="10. Consent & Withdrawal">
        <p>
          Creating an account and completing your profile is how you provide the birth/contact data our services
          are built around; placing an order is how you consent to the processing needed to fulfil it. Where a
          specific action requires separate, standalone consent (for example, a future non-essential cookie),
          we will ask for it explicitly rather than relying on continued use. You can withdraw consent, or
          delete your account, at any time — see Section 9.
        </p>
      </PolicySection>

      <PolicySection id="children" title="11. Children">
        <p>
          The platform is intended for users 18 years of age or older, consistent with the eligibility
          requirement in our <Link href="/terms-and-conditions" className="text-nav-amethyst-deep hover:underline">Terms & Conditions</Link>. We
          do not knowingly collect personal data from children.
        </p>
      </PolicySection>

      <PolicySection id="changes" title="12. Changes to This Policy">
        <p>
          We may update this Policy as our services or applicable law change. The &quot;Last updated&quot; date
          at the top reflects the most recent revision; material changes will be highlighted where reasonably
          practicable.
        </p>
      </PolicySection>

      <PolicySection id="contact" title="13. Contact & Grievance">
        <p>
          For any question about this Policy, or to exercise a right described in Section 9, contact us at{" "}
          <a href={`mailto:${FOOTER_CONTACT.email}`} className="text-nav-amethyst-deep hover:underline">{FOOTER_CONTACT.email}</a>{" "}
          or via our <Link href="/contact" className="text-nav-amethyst-deep hover:underline">Contact page</Link>. For
          a formal grievance, see our <Link href="/grievance" className="text-nav-amethyst-deep hover:underline">Grievance Redressal</Link> page.
        </p>
      </PolicySection>
    </LegalPageLayout>
  );
}

function DataBlock({ title, fields, purpose, retention }: { title: string; fields: string; purpose: string; retention: string }) {
  return (
    <div className="mt-3 rounded-xl border border-nav-lavender-line bg-white/60 p-4">
      <p className="font-medium text-nav-plum">{title}</p>
      <dl className="mt-2 flex flex-col gap-1.5 text-sm">
        <div><dt className="inline font-semibold text-nav-plum/70">What: </dt><dd className="inline">{fields}</dd></div>
        <div><dt className="inline font-semibold text-nav-plum/70">Why: </dt><dd className="inline">{purpose}</dd></div>
        <div><dt className="inline font-semibold text-nav-plum/70">Retention: </dt><dd className="inline">{retention}</dd></div>
      </dl>
    </div>
  );
}
