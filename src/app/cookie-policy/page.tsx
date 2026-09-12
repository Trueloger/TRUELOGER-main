import type { Metadata } from "next";
import { LegalPageLayout, PolicySection, PolicyNotice } from "@/components/legal/LegalPageLayout";
import { POLICY_META } from "@/lib/policy/config";

export const metadata: Metadata = {
  title: "Cookie & Tracking Policy | TRUELOGER",
  description: "What TrueLoger actually stores in your browser, and why.",
};

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      title="Cookie & Tracking Policy"
      lastUpdated={POLICY_META.cookiePolicy.lastUpdated}
      intro={
        <PolicyNotice>
          We audited the actual site code for this page rather than listing generic cookie categories. As of
          this policy&apos;s last update, TrueLoger does <strong>not</strong> use Google Analytics, marketing
          pixels, or any third-party advertising tracker. If that ever changes, this page — and a consent
          mechanism where required — will be updated before such tracking goes live.
        </PolicyNotice>
      }
    >
      <PolicySection id="essential" title="Essential — Required for the Site to Function">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Firebase Authentication session</strong> — keeps you signed in between visits. Without it, you&apos;d need to log in on every page load.</li>
          <li><strong>Cashfree checkout cookies</strong> — set directly by our payment gateway&apos;s own hosted checkout page while you&apos;re completing a payment, necessary for the payment to work securely.</li>
        </ul>
      </PolicySection>

      <PolicySection id="local-storage" title="Browser Local Storage — Convenience, Stays on Your Device">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Cart contents</strong> — so your cart survives a page reload or the redirect to/from Cashfree&apos;s checkout page. This never leaves your browser except when you actually check out.</li>
        </ul>
        <p className="mt-2">This data is stored only on your own device and is never transmitted to us as &quot;tracking.&quot;</p>
      </PolicySection>

      <PolicySection id="not-used" title="What We Do Not Use">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>No Google Analytics or any other analytics/behavioral-tracking script.</li>
          <li>No advertising or retargeting pixels (Facebook Pixel, etc.).</li>
          <li>No third-party marketing cookies.</li>
        </ul>
      </PolicySection>

      <PolicySection id="control" title="Controlling Cookies">
        <p>
          You can view, block, or delete cookies through your browser&apos;s own settings at any time. Disabling
          essential authentication cookies will prevent you from signing in or completing a purchase.
        </p>
      </PolicySection>
    </LegalPageLayout>
  );
}
