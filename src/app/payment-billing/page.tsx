import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, PolicySection } from "@/components/legal/LegalPageLayout";
import { POLICY_META } from "@/lib/policy/config";
import { FOOTER_CONTACT } from "@/components/footer/footer-data";

export const metadata: Metadata = {
  title: "Payment & Billing | TRUELOGER",
  description: "How payments, taxes, and billing work on TrueLoger.",
};

export default function PaymentBillingPage() {
  return (
    <LegalPageLayout title="Payment & Billing" lastUpdated={POLICY_META.paymentBilling.lastUpdated}>
      <PolicySection id="processor" title="Payment Processing">
        <p>
          All payments are processed through Cashfree Payments (India). We do not collect or store your card,
          UPI, or net-banking credentials — these are captured directly by Cashfree, which is responsible for
          their security in accordance with applicable RBI guidelines and PCI-DSS standards.
        </p>
      </PolicySection>

      <PolicySection id="pricing" title="Pricing, Discounts & Taxes">
        <p>
          Prices are shown in Indian Rupees. Where a product/service has a discount, the sale price and the
          discount percentage shown are always calculated from a real MRP — we do not inflate a reference price
          to display an inflated-looking discount. Applicable GST is computed automatically at checkout based on
          our current tax configuration and shown as a separate line before you pay.
        </p>
      </PolicySection>

      <PolicySection id="statuses" title="Payment Success, Pending & Failure">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Success:</strong> your order is confirmed and fulfilment (report generation, meeting scheduling, shipping, etc.) begins automatically.</li>
          <li><strong>Pending:</strong> some payment methods (e.g. certain UPI flows) report as pending briefly; we verify the final status with Cashfree and update your order automatically.</li>
          <li><strong>Failed:</strong> no charge is applied to a genuinely failed payment; if an amount was deducted from your account but the order still shows as unpaid, contact us with your payment reference.</li>
        </ul>
      </PolicySection>

      <PolicySection id="duplicate" title="Duplicate Payments">
        <p>
          Our checkout and payment-confirmation flow is built to be idempotent — a webhook or confirmation
          firing more than once for the same payment cannot create a duplicate order or duplicate fulfilment
          (a duplicate report, meeting, or email). If you believe you were genuinely charged twice for two
          separate payment attempts, contact us with both payment references and we will investigate.
        </p>
      </PolicySection>

      <PolicySection id="refunds" title="Refunds">
        <p>
          See our <Link href="/refund-cancellation" className="text-nav-amethyst-deep hover:underline">Refund & Cancellation Policy</Link> for
          what&apos;s refundable and when. Approved refunds are returned to your original payment method within
          7–10 business days, subject to your bank&apos;s own processing time.
        </p>
      </PolicySection>

      <PolicySection id="invoices" title="Receipts">
        <p>
          Your order confirmation email and your <Link href="/account/orders" className="text-nav-amethyst-deep hover:underline">Orders</Link> page
          both show the full price breakdown for a purchase. If you require a formal tax invoice for a specific
          order, contact us at {FOOTER_CONTACT.email} with your order reference.
        </p>
      </PolicySection>
    </LegalPageLayout>
  );
}
