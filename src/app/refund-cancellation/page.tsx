import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, PolicySection } from "@/components/legal/LegalPageLayout";
import type { PolicyTocEntry } from "@/components/legal/PolicyContents";
import { POLICY_META } from "@/lib/policy/config";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | TRUELOGER",
  description: "TrueLoger's refund and cancellation policy for gemstones, consultations, healing, puja, courses, and reports.",
};

const SECTIONS: PolicyTocEntry[] = [
  { id: "gemstones", title: "1. Gemstones & Physical Products" },
  { id: "consultations", title: "2. Consultations" },
  { id: "healing", title: "3. Healing Sessions" },
  { id: "puja", title: "4. Puja Bookings" },
  { id: "courses", title: "5. Courses" },
  { id: "reports", title: "6. Personalized Reports" },
  { id: "processing", title: "7. How Refunds Are Processed" },
  { id: "how-to-request", title: "8. How to Request a Refund or Cancellation" },
];

export default function RefundCancellationPage() {
  return (
    <LegalPageLayout
      title="Refund & Cancellation Policy"
      lastUpdated={POLICY_META.refundCancellation.lastUpdated}
      toc={SECTIONS}
      intro={
        <p>
          Different products and services on TrueLoger are fulfilled in fundamentally different ways, so we use
          one clear rule per category rather than a single blanket policy that wouldn&apos;t make sense for all
          of them.
        </p>
      }
    >
      <PolicySection id="gemstones" title="1. Gemstones & Physical Products">
        <p>Gemstones, bracelets, Rudraksha, Yantras, and other physical products:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>You may request a return/replacement/refund within 7 days of delivery if the item received is damaged, defective, or materially different from what was ordered, provided it is unused and in its original condition/packaging.</li>
          <li>Gemstones are natural materials; minor variation in colour/clarity/inclusion from the reference image is expected and is not grounds for return on its own.</li>
          <li>Before delivery, you may cancel an order that has not yet shipped by contacting us — see Section 8.</li>
        </ul>
      </PolicySection>

      <PolicySection id="consultations" title="2. Consultations">
        <p>A consultation is booked for a specific date and time, chosen by you before payment:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Cancel or reschedule up to 24 hours before the scheduled time for a full refund or free reschedule.</li>
          <li>Cancelling less than 24 hours before the scheduled time is eligible for a 50% refund, unless the delay/cancellation is caused by us or our consultant, in which case you&apos;re entitled to a full refund or free reschedule.</li>
          <li>Once the session has taken place, it is fully rendered and non-refundable, except where what was delivered was materially different from what was described.</li>
          <li>
            If a Google Meet link could not be created for a technical reason on our end, your booking is not
            cancelled — it&apos;s marked for admin follow-up and a working link is created as soon as possible;
            see <Link href="/help" className="text-nav-amethyst-deep hover:underline">Help & Support</Link>.
          </li>
        </ul>
      </PolicySection>

      <PolicySection id="healing" title="3. Healing Sessions">
        <p>
          Healing sessions follow the same cancellation window as Consultations above (24-hour free
          cancellation/reschedule window). These are spiritual, wellness-oriented sessions, not medical
          treatment — see our <Link href="/disclaimer" className="text-nav-amethyst-deep hover:underline">Disclaimer</Link>.
        </p>
      </PolicySection>

      <PolicySection id="puja" title="4. Puja Bookings">
        <p>
          A Puja is scheduled and performed by our associated priests on your behalf (or with your attendance,
          where available). Because a Puja involves booking a priest&apos;s time and, in many cases, procuring
          ritual materials in advance:
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Cancellation more than 48 hours before the scheduled date is eligible for a full refund.</li>
          <li>Cancellation within 48 hours may not be fully refundable where materials/priest time have already been committed; contact us and we will confirm what&apos;s possible for your specific booking.</li>
          <li>Once a Puja has been performed, it is fully rendered and non-refundable.</li>
        </ul>
      </PolicySection>

      <PolicySection id="courses" title="5. Courses">
        <p>
          Courses are self-paced digital content, delivered as instant access after payment. You may request a
          refund within 3 days of purchase provided you have not completed more than a small portion of the
          course content; this is a goodwill window, not a right to a refund after substantially consuming
          digital content that has already been delivered to you.
        </p>
      </PolicySection>

      <PolicySection id="reports" title="6. Personalized Reports">
        <p>
          Because report generation begins automatically after payment (astrological calculation, then
          AI-assisted interpretation, then PDF rendering):
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>You may cancel and receive a full refund only before generation has started (your report status shows &quot;Preparing your chart&quot; or earlier) — contact us immediately after purchase if you need this.</li>
          <li>Once generation has started, the report is being actively produced against real computation and AI cost; it is not refundable for change-of-mind once generation has begun, except where the final report is not delivered due to our fault, or is delivered but materially defective (e.g. fails our own validation and never reaches a usable state).</li>
          <li>A report that reaches &quot;Ready&quot; and is downloadable is deemed delivered.</li>
        </ul>
      </PolicySection>

      <PolicySection id="processing" title="7. How Refunds Are Processed">
        <p>
          Approved refunds are processed to your original payment method within 7–10 business days of approval,
          subject to your bank&apos;s or payment provider&apos;s own processing timelines, which we do not control.
        </p>
      </PolicySection>

      <PolicySection id="how-to-request" title="8. How to Request a Refund or Cancellation">
        <p>
          Go to your <Link href="/account/orders" className="text-nav-amethyst-deep hover:underline">Orders</Link> page,
          open the relevant order, and use &quot;Need help with this order?&quot; — this pre-fills your order
          reference so you don&apos;t need to type it. You can also use our{" "}
          <Link href="/contact" className="text-nav-amethyst-deep hover:underline">Contact page</Link> directly.
        </p>
      </PolicySection>
    </LegalPageLayout>
  );
}
