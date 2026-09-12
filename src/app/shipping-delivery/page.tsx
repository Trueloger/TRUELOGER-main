import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, PolicySection } from "@/components/legal/LegalPageLayout";
import { POLICY_META } from "@/lib/policy/config";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | TRUELOGER",
  description: "Shipping and delivery information for TrueLoger's gemstones and physical products.",
};

export default function ShippingDeliveryPage() {
  return (
    <LegalPageLayout
      title="Shipping & Delivery Policy"
      lastUpdated={POLICY_META.shippingDelivery.lastUpdated}
      intro={
        <p>
          This page covers physical products only — gemstones, bracelets, Rudraksha, Yantras, and other spiritual
          products. Consultations, Healing sessions, Puja bookings, Courses, and Personalized Reports are digital
          or service-based and are covered by their own delivery timing shown on each product/service page and
          in our <Link href="/terms-and-conditions" className="text-nav-amethyst-deep hover:underline">Terms & Conditions</Link>.
        </p>
      }
    >
      <PolicySection id="timelines" title="Delivery Timelines">
        <p>
          Each product page shows its own estimated delivery window, set by us per product/category — we do not
          apply one universal delivery time across every physical item, since sourcing and dispatch timelines
          genuinely differ by product. The timeline shown at checkout for the specific item(s) in your cart is
          the estimate that applies to your order.
        </p>
      </PolicySection>

      <PolicySection id="processing" title="Processing & Dispatch">
        <p>
          Orders are processed and prepared for dispatch after payment is confirmed. Processing time is separate
          from, and in addition to, the courier&apos;s own transit time to your address.
        </p>
      </PolicySection>

      <PolicySection id="regions" title="Delivery Regions">
        <p>We currently ship within India. If you are outside a serviceable delivery area, this will be indicated at checkout.</p>
      </PolicySection>

      <PolicySection id="delays" title="Delays & Issues Outside Our Control">
        <p>
          Estimated delivery timelines are good-faith estimates, not guaranteed dates, and may be affected by
          courier delays, remote-area logistics, weather, strikes, or other circumstances beyond our reasonable
          control.
        </p>
      </PolicySection>

      <PolicySection id="address" title="Incorrect Address">
        <p>
          It&apos;s your responsibility to provide a complete, accurate delivery address and a reachable phone number.
          We are not liable for non-delivery or delay caused by incorrect or incomplete address information you
          provided.
        </p>
      </PolicySection>

      <PolicySection id="damaged" title="Damaged or Failed Delivery">
        <p>
          If a package arrives damaged, or a delivery fails, see our{" "}
          <Link href="/refund-cancellation" className="text-nav-amethyst-deep hover:underline">Refund & Cancellation Policy</Link>{" "}
          for what qualifies for a return/replacement, and contact us with your order reference.
        </p>
      </PolicySection>

      <PolicySection id="contact" title="Questions About a Delivery">
        <p>
          Go to your <Link href="/account/orders" className="text-nav-amethyst-deep hover:underline">Orders</Link> page,
          open the order, and use &quot;Need help with this order?&quot; — or reach us via our{" "}
          <Link href="/contact" className="text-nav-amethyst-deep hover:underline">Contact page</Link>.
        </p>
      </PolicySection>
    </LegalPageLayout>
  );
}
