import type { Metadata } from "next";
import { LegalPageLayout, PolicySection } from "@/components/legal/LegalPageLayout";
import { POLICY_META } from "@/lib/policy/config";
import { FOOTER_CONTACT } from "@/components/footer/footer-data";

export const metadata: Metadata = {
  title: "Accessibility | TRUELOGER",
  description: "TrueLoger's approach to accessibility.",
};

export default function AccessibilityPage() {
  return (
    <LegalPageLayout title="Accessibility" lastUpdated={POLICY_META.accessibility.lastUpdated}>
      <PolicySection id="commitment" title="Our Approach">
        <p>
          We want TrueLoger to be usable by as many people as possible, on any device. We have not undergone a
          formal third-party accessibility audit or certification (we do not claim WCAG conformance), but
          accessibility is considered as an ongoing part of how the site is built:
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Semantic HTML headings and lists throughout content pages;</li>
          <li>Keyboard-operable navigation, dropdowns, and dialogs, with visible focus states;</li>
          <li>Readable typography and touch targets sized for mobile use;</li>
          <li>Mobile-first responsive layouts tested down to small phone widths;</li>
          <li>Descriptive labels on interactive controls (buttons, form fields, icons) for screen readers.</li>
        </ul>
      </PolicySection>

      <PolicySection id="feedback" title="Tell Us About a Problem">
        <p>
          If you encounter an accessibility barrier anywhere on TrueLoger, please let us know at{" "}
          <a href={`mailto:${FOOTER_CONTACT.email}`} className="text-nav-amethyst-deep hover:underline">{FOOTER_CONTACT.email}</a>{" "}
          or via our <a href="/contact" className="text-nav-amethyst-deep hover:underline">Contact page</a>, describing the page and the issue you ran into. We take this feedback seriously and will look into it.
        </p>
      </PolicySection>
    </LegalPageLayout>
  );
}
