// src/app/terms-and-conditions/page.tsx
// Static legal page — server component, no client state needed.
// Drafted to comply with, and cross-reference, the Indian legal
// framework actually applicable to this business: the Indian Contract
// Act 1872, the Consumer Protection Act 2019 and the Consumer
// Protection (E-Commerce) Rules 2020, the Information Technology Act
// 2000 and the IT (Intermediary Guidelines and Digital Media Ethics
// Code) Rules 2021 (grievance officer requirement), and the Digital
// Personal Data Protection Act 2023. PLACEHOLDER values — legal entity
// name, registered address, GSTIN, grievance officer name, and
// jurisdiction city — are marked inline with [ ] and must be filled in
// with the real registered business details before this is relied on
// as a binding document; everything else is real, considered legal
// drafting, not filler text.
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { LotusIcon } from "@/components/quick-services/icons";
import { FOOTER_CONTACT } from "@/components/footer/footer-data";
import { POLICY_META, BUSINESS_INFO } from "@/lib/policy/config";

export const metadata: Metadata = {
  title: "Terms & Conditions | TRUELOGER",
  description:
    "Terms and Conditions governing the use of TRUELOGER's website, astrology consultations, and gemstone/spiritual product purchases.",
};

const LAST_UPDATED = POLICY_META.terms.lastUpdated;

const SECTIONS: { id: string; title: string }[] = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "definitions", title: "2. Definitions" },
  { id: "eligibility", title: "3. Eligibility" },
  { id: "nature-of-services", title: "4. Nature of Our Services — Important Disclaimer" },
  { id: "account", title: "5. Account Registration, Profile, and Security" },
  { id: "products", title: "6. Products and Services Offered" },
  { id: "meetings-astrologers", title: "6A. Google Meet Consultations and Astrologer Registration" },
  { id: "ai-content", title: "6B. AI-Assisted Report Content" },
  { id: "pricing-payments", title: "7. Pricing, Taxes, and Payments" },
  { id: "orders", title: "8. Order Placement and Acceptance" },
  { id: "cancellation-refunds", title: "9. Cancellation, Return, and Refund Policy" },
  { id: "shipping", title: "10. Shipping and Delivery" },
  { id: "product-disclaimers", title: "11. Gemstone and Product-Specific Disclaimers" },
  { id: "coupons", title: "12. Coupons, Discounts, and Promotions" },
  { id: "ip", title: "13. Intellectual Property" },
  { id: "conduct", title: "14. User Conduct and Prohibited Uses" },
  { id: "third-party", title: "15. Third-Party Services and Links" },
  { id: "liability", title: "16. Disclaimer of Warranties and Limitation of Liability" },
  { id: "indemnity", title: "17. Indemnification" },
  { id: "privacy", title: "18. Privacy and Data Protection" },
  { id: "cookies", title: "19. Cookies" },
  { id: "grievance", title: "20. Grievance Redressal" },
  { id: "disputes", title: "21. Governing Law and Dispute Resolution" },
  { id: "force-majeure", title: "22. Force Majeure" },
  { id: "suspension", title: "23. Suspension and Termination" },
  { id: "changes", title: "24. Changes to These Terms" },
  { id: "misc", title: "25. Severability, Waiver, and Entire Agreement" },
  { id: "contact", title: "26. Contact Us" },
];

export default function TermsAndConditionsPage() {
  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-nav-lavender-line" aria-hidden="true" />
          <LotusIcon className="h-6 w-6 text-nav-gold" strokeWidth={1.3} />
          <span className="h-px w-10 bg-nav-lavender-line" aria-hidden="true" />
        </div>

        <h1 className="mt-4 text-center font-serif text-3xl leading-[1.15] text-nav-plum sm:text-4xl">
          Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-center text-sm text-nav-plum/70">Last updated: {LAST_UPDATED}</p>

        <p className="mt-6 text-sm leading-relaxed text-nav-plum/85">
          These Terms and Conditions (&quot;Terms&quot;) constitute a legally binding agreement
          between you (&quot;User&quot;, &quot;you&quot;, &quot;your&quot;) and{" "}
          <strong>{BUSINESS_INFO.entityName}, {BUSINESS_INFO.entityType}</strong> having its
          registered office at {BUSINESS_INFO.registeredAddress}, operating the website located at
          trueloger.vercel.app and any successor domain (collectively, &quot;TRUELOGER&quot;,
          &quot;we&quot;, &quot;us&quot;, &quot;our&quot;, the &quot;Platform&quot;). GSTIN: {BUSINESS_INFO.gstin}.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-nav-plum/85">
          By accessing or using the Platform, creating an account, placing an order, or
          purchasing any consultation, gemstone, or product from us, you agree to be bound by
          these Terms, our Privacy Policy, and any additional guidelines or rules applicable to
          specific services (collectively, the &quot;Agreement&quot;). If you do not agree to
          these Terms in their entirety, you must not access or use the Platform.
        </p>

        {/* Table of contents */}
        <nav aria-label="Table of contents" className="mt-8 rounded-xl border border-nav-lavender-line bg-white/60 p-5">
          <h2 className="font-serif text-lg text-nav-violet">Contents</h2>
          <ol className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-nav-amethyst-deep underline-offset-2 hover:underline"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 flex flex-col gap-10">
          <Section id="acceptance" title="1. Acceptance of Terms">
            <p>
              Use of the Platform is conditional upon your acceptance of these Terms without
              modification. Your continued use of the Platform after any revision to these Terms
              constitutes your acceptance of the revised Terms. If you are using the Platform on
              behalf of an organisation, you represent that you have the authority to bind that
              organisation to this Agreement.
            </p>
          </Section>

          <Section id="definitions" title="2. Definitions">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>&quot;Consultation&quot;</strong> means any paid astrology, tarot,
                numerology, Vastu, or related advisory session booked through the Platform.
              </li>
              <li>
                <strong>&quot;Products&quot;</strong> means gemstones, bracelets, Rudraksha,
                Yantras, and other spiritual/physical items listed for sale on the Platform.
              </li>
              <li>
                <strong>&quot;Order&quot;</strong> means a request placed by you through the
                Platform to purchase one or more Consultations and/or Products.
              </li>
              <li>
                <strong>&quot;Payment Gateway&quot;</strong> means Cashfree Payments (India) Pvt.
                Ltd. or any successor/additional payment processor we engage.
              </li>
              <li>
                <strong>&quot;Content&quot;</strong> means all text, graphics, reports,
                horoscopes, images, and other material made available on the Platform.
              </li>
            </ul>
          </Section>

          <Section id="eligibility" title="3. Eligibility">
            <p>
              You must be at least 18 (eighteen) years of age and competent to enter into a
              contract under Section 11 of the Indian Contract Act, 1872 to register on, or
              transact through, the Platform. Persons who are minors, of unsound mind, or
              otherwise disqualified from contracting under applicable law are not permitted to
              use the Platform to place Orders. If you are a minor, you may browse informational
              content only with the involvement and consent of a parent or legal guardian, and
              any purchase must be made by that parent or guardian in their own name and account.
              We reserve the right to terminate any account and cancel any Order where we
              reasonably believe the account holder does not meet this eligibility requirement,
              and to require proof of age or identity at any time.
            </p>
          </Section>

          <Section id="nature-of-services" title="4. Nature of Our Services — Important Disclaimer">
            <p>
              TRUELOGER offers astrology, Vedic astrology, numerology, tarot, Vastu, and related
              consultations, along with gemstones and spiritual products traditionally associated
              with these practices. You expressly acknowledge and agree that:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                Astrology, numerology, tarot, and Vastu are systems of belief and traditional
                practice, not empirical or medical sciences. All Consultations, horoscopes,
                predictions, gemstone recommendations, and reports are provided for
                informational, spiritual, and entertainment purposes only.
              </li>
              <li>
                Nothing on the Platform constitutes, and must not be relied upon as, medical,
                psychiatric, legal, financial, investment, tax, or professional advice of any
                kind. You must consult an appropriately licensed professional before making any
                medical, legal, financial, or other significant life decision.
              </li>
              <li>
                We make no guarantee, warranty, or representation — express or implied — that any
                Consultation, remedy, gemstone, or product will produce any specific outcome,
                benefit, cure, or result. Any benefits described (e.g. under &quot;traditionally
                associated with&quot;) reflect traditional belief, not a scientifically proven or
                guaranteed effect.
              </li>
              <li>
                Astrologers, tarot readers, and other consultants available through the Platform
                are independent practitioners. We facilitate the booking and payment for their
                services but do not control the content of the advice given, and are not liable
                for the accuracy, suitability, or consequences of any advice rendered during a
                Consultation.
              </li>
              <li>
                If you are experiencing a medical emergency, mental health crisis, or an
                emergency of any kind, contact emergency services or a qualified professional
                immediately — do not rely on the Platform.
              </li>
            </ul>
          </Section>

          <Section id="account" title="5. Account Registration, Profile, and Security">
            <p>
              To place an Order for any Consultation or Product, you must register for an account
              using a valid email address and complete your user profile (including full name,
              date of birth, and place of birth, which are required for accurate astrological
              computation). You agree to:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Provide accurate, current, and complete information during registration and profile completion, and keep it updated;</li>
              <li>Maintain the confidentiality of your account password and be solely responsible for all activity under your account;</li>
              <li>Notify us immediately at {FOOTER_CONTACT.email} of any unauthorised use of your account or any other breach of security;</li>
              <li>Not create more than one account for fraudulent purposes, or use another person&apos;s account without permission.</li>
            </ul>
            <p className="mt-2">
              We reserve the right to require a complete profile before permitting you to place
              an Order, and to refuse, suspend, or cancel any Order or account where the
              information provided is inaccurate, incomplete, or where we suspect fraud.
            </p>
          </Section>

          <Section id="products" title="6. Products and Services Offered">
            <p>
              We offer, on a rolling and admin-managed basis: astrology and related Consultations;
              Healing sessions; Puja bookings; Courses; Personalized Reports; gemstones; bracelets;
              Rudraksha; Yantras; and other spiritual products. Product/service descriptions,
              images (including placeholder imagery pending real product photography), pricing,
              and availability are managed by us and may be added, modified, discontinued, or
              marked out of stock/unavailable at any time without prior notice. Certain free tools
              on the Platform (for example, basic horoscope, Kundli, Rashi, Nakshatra, or
              compatibility calculators marked as free) may be used without registration or
              payment; these Terms apply to your use of those free tools as well, except that
              Sections 7 through 10 (pricing, orders, cancellation/refunds, and shipping) apply
              only to paid Consultations, Healing, Puja, Courses, Reports, and Products. Category-
              specific terms for each of these are set out in our{" "}
              <Link href="/refund-cancellation" className="text-nav-amethyst-deep hover:underline">Refund & Cancellation Policy</Link>.
            </p>
          </Section>

          <Section id="meetings-astrologers" title="6A. Google Meet Consultations and Astrologer Registration">
            <p>
              For paid Consultations that involve a live session, we create a Google Meet link for
              your appointment using the Google Calendar/Meet API after your payment is confirmed.
              Only your name, email, and appointment schedule are shared with this integration for
              that purpose. If a link cannot be created immediately due to a technical issue, your
              order and payment remain valid — see our{" "}
              <Link href="/refund-cancellation" className="text-nav-amethyst-deep hover:underline">Refund & Cancellation Policy</Link>{" "}
              and <Link href="/help" className="text-nav-amethyst-deep hover:underline">Help & Support</Link>. Astrologers
              and experts who apply to join the Platform are additionally bound by our{" "}
              <Link href="/astrologer-terms" className="text-nav-amethyst-deep hover:underline">Astrologer / Expert Terms</Link>.
            </p>
          </Section>

          <Section id="ai-content" title="6B. AI-Assisted Report Content">
            <p>
              Personalized Reports combine real astrological calculations — performed by our own
              deterministic engine and never invented or altered by AI — with narrative
              interpretation generated section-by-section by an AI model (via the OpenRouter API).
              AI-generated content can contain errors and is not a substitute for professional
              medical, legal, or financial advice; see our{" "}
              <Link href="/disclaimer" className="text-nav-amethyst-deep hover:underline">Disclaimer</Link>.
            </p>
          </Section>

          <Section id="pricing-payments" title="7. Pricing, Taxes, and Payments">
            <p>
              All prices are listed in Indian Rupees (INR) and are inclusive or exclusive of
              applicable Goods and Services Tax (GST) as indicated at checkout, computed
              automatically based on our then-current, admin-configured tax settings. We reserve
              the right to change prices, delivery charges, and applicable taxes at any time;
              the price and total payable shown to you at the time you complete payment for a
              given Order is the price that applies to that Order and will not change
              retroactively.
            </p>
            <p className="mt-2">
              All payments are processed through our Payment Gateway (Cashfree Payments). We do
              not collect, store, or have access to your full card, UPI, or net-banking
              credentials at any point — these are captured directly by the Payment Gateway,
              which is separately responsible for the security of that data in accordance with
              applicable Reserve Bank of India (RBI) guidelines and PCI-DSS standards. Your use
              of the Payment Gateway is additionally subject to its own terms and privacy policy.
            </p>
            <p className="mt-2">
              An Order is confirmed only upon successful receipt of payment. If a payment is
              deducted from your account but not reflected as successful on the Platform, please
              contact us at {FOOTER_CONTACT.email} with your payment reference; we will verify
              the transaction with the Payment Gateway and either confirm your Order or refund
              the amount within a reasonable time, and in any event within the timelines
              prescribed under RBI&apos;s Turnaround Time (TAT) rules for failed transactions.
            </p>
          </Section>

          <Section id="orders" title="8. Order Placement and Acceptance">
            <p>
              Placing an Order and completing payment constitutes an offer by you to purchase the
              selected Consultation(s) and/or Product(s) on these Terms. We reserve the right to
              accept or decline any Order, in whole or in part, for reasons including but not
              limited to: inaccurate pricing or product information due to a technical error,
              suspected fraudulent activity, unavailability of stock or of a requested
              consultant&apos;s time slot, or an incomplete user profile. Where we decline an
              Order after payment has been received, we will issue a full refund of the amount
              paid for the declined portion within the timelines described in Section 9.
            </p>
          </Section>

          <Section id="cancellation-refunds" title="9. Cancellation, Return, and Refund Policy">
            <p>
              This Section is drafted in line with the Consumer Protection (E-Commerce) Rules,
              2020. Different categories of purchase are treated differently because of their
              inherent nature — see our full{" "}
              <Link href="/refund-cancellation" className="text-nav-amethyst-deep hover:underline">Refund & Cancellation Policy</Link>{" "}
              for the complete, per-category rules (including Healing, Puja, Courses, and
              Personalized Reports, which are summarised here and covered in full detail there):
            </p>
            <p className="mt-3 font-medium text-nav-plum">Consultations</p>
            <ul className="mt-1 list-disc space-y-1.5 pl-5">
              <li>
                A Consultation may be cancelled or rescheduled by you free of charge up to 24
                (twenty-four) hours before the scheduled time, for a full refund or
                rescheduling, at your option.
              </li>
              <li>
                Cancellations made less than 24 hours before the scheduled time are eligible for
                a 50% (fifty percent) refund, except where the delay or cancellation is caused by
                us or our consultant, in which case you are entitled to a full refund or a free
                reschedule.
              </li>
              <li>
                Once a Consultation has been delivered (the session has taken place, or a report
                has been generated and delivered to you), it is deemed fully rendered and is
                non-refundable, except where the service delivered was materially different from
                what was described, or was not delivered due to our fault.
              </li>
            </ul>
            <p className="mt-3 font-medium text-nav-plum">Gemstones and Physical Products</p>
            <ul className="mt-1 list-disc space-y-1.5 pl-5">
              <li>
                You may request a return and replacement/refund within 7 (seven) days of
                delivery if the Product received is materially different from what was
                ordered, damaged, defective, or counterfeit, subject to the Product being unused,
                in its original condition and packaging, with all tags/certificates (if any)
                intact.
              </li>
              <li>
                Gemstones are natural materials and may exhibit minor, expected variations in
                colour, clarity, and inclusions from the reference image shown on the Platform;
                such natural variation alone is not a valid ground for return.
              </li>
              <li>
                For hygiene and safety reasons, certain items (if any, such as items worn against
                the skin once unsealed) may be marked non-returnable at the time of purchase;
                where marked, this exception will be clearly stated on the product page before
                you complete the Order, as required under the E-Commerce Rules, 2020.
              </li>
              <li>
                The ₹1 &quot;Test Payment&quot; item listed on the Platform exists solely to
                verify the payment flow and is not a real product; no physical item will be
                shipped for it, and if you did not intend to purchase it, contact us for a
                refund.
              </li>
            </ul>
            <p className="mt-3 font-medium text-nav-plum">Refund Processing</p>
            <p className="mt-1">
              Approved refunds will be processed to the original payment method within 7–10
              (seven to ten) business days of approval, subject to your bank&apos;s or payment
              provider&apos;s own processing timelines, over which we have no control. Delivery
              charges, where levied, are refunded only where the return is due to our error or a
              defective/incorrect Product.
            </p>
          </Section>

          <Section id="shipping" title="10. Shipping and Delivery">
            <p>
              See our full <Link href="/shipping-delivery" className="text-nav-amethyst-deep hover:underline">Shipping & Delivery Policy</Link> for
              physical products. In summary:
            </p>
            <p className="mt-2">
              Estimated delivery timelines shown on a Product page or at checkout are good-faith
              estimates, not guaranteed delivery dates, and may be affected by courier delays,
              remote delivery locations, natural events, strikes, or other circumstances beyond
              our reasonable control. Risk of loss and title to physical Products passes to you
              upon delivery to the shipping address provided by you. It is your responsibility to
              provide a complete and accurate delivery address and a reachable contact number; we
              are not liable for non-delivery or delay caused by incorrect or incomplete address
              information provided by you.
            </p>
          </Section>

          <Section id="product-disclaimers" title="11. Gemstone and Product-Specific Disclaimers">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Gemstone weights are listed in Ratti (1 Ratti ≈ 0.91 carat, a fixed conversion
                used consistently across the Platform); minor natural variance in weight within
                trade-standard tolerance is normal and not a defect.
              </li>
              <li>
                Certification claims (where explicitly stated on a Product page) apply only to
                that specific Product; absence of a certification statement means no
                certification is claimed for that item.
              </li>
              <li>
                Traditional/astrological benefits described for a Product (e.g. &quot;traditionally
                associated with prosperity&quot;) are statements of traditional belief associated
                with that gemstone or item in Vedic astrology, not a scientific or medical claim,
                and are not guaranteed.
              </li>
              <li>
                Wearing instructions, care instructions, and recommended Ratti weights are general
                guidance only; we strongly recommend consulting a qualified astrologer (available
                through our Consultation services) before wearing any gemstone for astrological
                purposes, particularly Blue Sapphire (Neelam), Hessonite (Gomed), and Cat&apos;s
                Eye (Lehsunia), which are traditionally regarded as fast-acting and are commonly
                trial-worn first.
              </li>
            </ul>
          </Section>

          <Section id="coupons" title="12. Coupons, Discounts, and Promotions">
            <p>
              Coupon codes and discounts made available on the Platform are subject to their own
              stated conditions (minimum cart value, maximum discount cap, validity window, usage
              limits, and eligible categories/products), are non-transferable, cannot be
              exchanged for cash, and may be withdrawn, modified, or invalidated by us at any
              time before use, including where we detect misuse, abuse, or a technical error in
              how a coupon was issued or applied. Applying a coupon does not itself confirm an
              Order — payment must still be completed for the discounted amount.
            </p>
          </Section>

          <Section id="ip" title="13. Intellectual Property">
            <p>
              All Content on the Platform, including the TRUELOGER name and logo, text, graphics,
              horoscope/report formats, and the underlying software, is owned by or licensed to
              us and is protected under the Copyright Act, 1957, the Trade Marks Act, 1999, and
              other applicable intellectual property laws. You may view and use the Platform for
              your personal, non-commercial use only. You may not reproduce, distribute, modify,
              publicly display, create derivative works from, sell, or otherwise exploit any
              Content without our prior written consent, except that you may retain and use, for
              your personal reference, any report or Consultation output specifically generated
              for you.
            </p>
          </Section>

          <Section id="conduct" title="14. User Conduct and Prohibited Uses">
            <p>You agree not to, and not to attempt to:</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Use the Platform for any unlawful purpose or in violation of any applicable Indian law, including the Information Technology Act, 2000;</li>
              <li>Impersonate any person or entity, or misrepresent your affiliation with any person or entity, including providing false birth details to obtain a Consultation for another person without disclosure;</li>
              <li>Interfere with, disrupt, or attempt to gain unauthorised access to the Platform, its servers, or any connected database (including our Firebase/Firestore backend), whether by hacking, password mining, or any other means;</li>
              <li>Use any automated system (bot, scraper, crawler) to access the Platform for any purpose without our prior written permission;</li>
              <li>Upload or transmit any content that is defamatory, obscene, harassing, or otherwise objectionable, or that infringes any third party&apos;s intellectual property or privacy rights;</li>
              <li>Use the Platform to place fraudulent Orders, initiate chargebacks in bad faith, or abuse the coupon/refund process.</li>
            </ul>
            <p className="mt-2">
              We reserve the right to investigate and take appropriate legal action, including
              suspension or termination of your account and reporting to law enforcement
              authorities, against anyone who violates this Section.
            </p>
          </Section>

          <Section id="third-party" title="15. Third-Party Services and Links">
            <p>
              The Platform relies on and may link to third-party services, including Firebase
              (Google) for authentication and data storage, Cashfree Payments for payment
              processing, and social media platforms. We are not responsible for the content,
              accuracy, availability, or privacy practices of any third-party service or website,
              and your use of them is governed by their own respective terms and privacy
              policies.
            </p>
          </Section>

          <Section id="liability" title="16. Disclaimer of Warranties and Limitation of Liability">
            <p>
              To the maximum extent permitted under applicable Indian law, the Platform and all
              Content, Consultations, and Products are provided on an &quot;as is&quot; and
              &quot;as available&quot; basis, without warranties of any kind, whether express or
              implied, including but not limited to implied warranties of merchantability,
              fitness for a particular purpose, and non-infringement — except that this
              disclaimer does not exclude or limit any statutory right or protection available to
              you as a &quot;consumer&quot; under the Consumer Protection Act, 2019, which cannot
              be validly excluded by contract.
            </p>
            <p className="mt-2">
              To the maximum extent permitted by law, our aggregate liability to you arising out
              of or relating to these Terms or your use of the Platform, whether in contract,
              tort, or otherwise, shall not exceed the total amount actually paid by you to us
              for the specific Order giving rise to the claim in the 3 (three) months preceding
              the event. We are not liable for any indirect, incidental, consequential, special,
              or punitive damages, including loss of profit, data, or goodwill, arising from your
              use of, or inability to use, the Platform or any Consultation or Product,
              including any decision you make in reliance on astrological guidance received
              through the Platform (see Section 4).
            </p>
            <p className="mt-2">
              Nothing in this Section limits our liability for death or personal injury caused by
              our negligence, for fraud or fraudulent misrepresentation, or for any other
              liability that cannot be excluded or limited under Indian law.
            </p>
          </Section>

          <Section id="indemnity" title="17. Indemnification">
            <p>
              You agree to indemnify and hold harmless TRUELOGER, its owners, directors,
              employees, consultants, and affiliates from and against any claims, liabilities,
              damages, losses, and expenses (including reasonable legal fees) arising out of or
              in any way connected with: your breach of these Terms; your violation of any
              applicable law; your violation of any third party&apos;s rights; or any information
              or birth details you provide that is false, inaccurate, or belongs to another
              person without their consent.
            </p>
          </Section>

          <Section id="privacy" title="18. Privacy and Data Protection">
            <p>
              We collect and process your personal data — including your name, contact details,
              date, time, and place of birth, and payment-related metadata — in accordance with
              the Information Technology Act, 2000, the Information Technology (Reasonable
              Security Practices and Procedures and Sensitive Personal Data or Information)
              Rules, 2011, and the Digital Personal Data Protection Act, 2023, to the extent it is
              in force. Your birth details are used solely to generate your astrological
              calculations, Consultation reports, and personalised recommendations, and are not
              sold to third parties. Full details of what we collect, why, and your rights over
              it (including the right to access, correct, and request deletion of your data) are
              set out in our <Link href="/privacy-policy" className="text-nav-amethyst-deep hover:underline">Privacy Policy</Link>, with
              the underlying technical/security practices described in{" "}
              <Link href="/privacy-security" className="text-nav-amethyst-deep hover:underline">Privacy & Security</Link>. You
              may request full details of our data practices at any time at {FOOTER_CONTACT.email}.
            </p>
          </Section>

          <Section id="cookies" title="19. Cookies">
            <p>
              See our full <Link href="/cookie-policy" className="text-nav-amethyst-deep hover:underline">Cookie & Tracking Policy</Link> for
              the complete, audited list. In summary:
            </p>
            <p className="mt-2">
              The Platform uses only essential cookies and browser storage required for it to
              function — specifically: (a) Firebase Authentication session cookies/tokens, which
              keep you signed in between visits; and (b) cookies set directly by our Payment
              Gateway (Cashfree) during the checkout process, which are necessary to securely
              complete your payment. We do not currently use third-party advertising or analytics
              cookies. Your browser may also store small amounts of data locally (such as your
              cookie-notice acceptance, or draft form values) purely to improve your experience on
              this device; this data is never transmitted to us. You can control or delete cookies
              through your browser settings at any time; disabling essential cookies may prevent
              you from signing in or completing a purchase.
            </p>
          </Section>

          <Section id="grievance" title="20. Grievance Redressal">
            <p>
              In accordance with the Information Technology Act, 2000, the Information Technology
              (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, and the
              Consumer Protection (E-Commerce) Rules, 2020, the details of our Grievance Officer
              are published below:
            </p>
            <div className="mt-3 rounded-xl border border-nav-lavender-line bg-white/60 p-4 text-sm">
              <p><strong>Grievance Officer:</strong> {BUSINESS_INFO.grievanceOfficer.name}</p>
              <p className="mt-1"><strong>Designation:</strong> {BUSINESS_INFO.grievanceOfficer.designation}</p>
              <p className="mt-1">
                <strong>Email:</strong>{" "}
                <a href={`mailto:${FOOTER_CONTACT.email}`} className="text-nav-amethyst-deep hover:underline">
                  {FOOTER_CONTACT.email}
                </a>
              </p>
              <p className="mt-1"><strong>Phone:</strong> {FOOTER_CONTACT.phone}</p>
              <p className="mt-1"><strong>Address:</strong> {BUSINESS_INFO.registeredAddress}</p>
            </div>
            <p className="mt-3">
              Any complaint or grievance regarding any Content, Order, Consultation, Product, or
              your data may be sent to the Grievance Officer above, or submitted through our{" "}
              <Link href="/grievance" className="text-nav-amethyst-deep hover:underline">Grievance Redressal</Link> page.
              We will acknowledge receipt of your complaint within 48 (forty-eight) hours and
              endeavour to redress it within 1 (one) month of its receipt, or such other timeline
              as may be prescribed by applicable law from time to time.
            </p>
          </Section>

          <Section id="disputes" title="21. Governing Law and Dispute Resolution">
            <p>
              These Terms are governed by and construed in accordance with the laws of India,
              without regard to conflict-of-law principles. Subject to Section 20 above, any
              dispute, controversy, or claim arising out of or relating to these Terms, or the
              breach, termination, or invalidity thereof, shall first be attempted to be resolved
              amicably through good-faith negotiation between the parties for a period of 30
              (thirty) days. If the dispute is not resolved within that period, it shall be
              referred to and finally resolved by arbitration under the Arbitration and
              Conciliation Act, 1996, conducted by a sole arbitrator appointed by mutual consent,
              with the seat and venue of arbitration at {BUSINESS_INFO.arbitrationSeat}, India,
              and the proceedings conducted in English. This arbitration agreement does not affect
              your right to approach a consumer forum/commission under the Consumer Protection
              Act, 2019, which remains available to you as a consumer, at your option. Subject to
              the foregoing, the courts at {BUSINESS_INFO.jurisdictionCity}, {BUSINESS_INFO.jurisdictionState} shall
              have exclusive jurisdiction over any matter not subject to arbitration or the
              consumer forum.
            </p>
          </Section>

          <Section id="force-majeure" title="22. Force Majeure">
            <p>
              We shall not be liable for any failure or delay in performance of our obligations
              under these Terms to the extent such failure or delay is caused by circumstances
              beyond our reasonable control, including but not limited to acts of God, natural
              disaster, pandemic or epidemic, war, riot, strike, governmental action, internet or
              telecommunications failure, or failure of a third-party service (including the
              Payment Gateway or our hosting/cloud providers).
            </p>
          </Section>

          <Section id="suspension" title="23. Suspension and Termination">
            <p>
              We may suspend or terminate your account and access to the Platform, with or
              without notice, if we reasonably believe you have violated these Terms, provided
              false information, engaged in fraudulent or abusive conduct, or if required to do
              so by law or a competent authority. You may close your account at any time by
              contacting us at {FOOTER_CONTACT.email}; this does not entitle you to a refund of
              any amount for Consultations already delivered or Products already shipped, and any
              amount owed to us at the time of termination remains due. Sections 4, 6–9 (in
              respect of completed Orders), 13, 16, 17, 18, 19, 20, 21, and 25 of these Terms
              survive termination of your account.
            </p>
          </Section>

          <Section id="changes" title="24. Changes to These Terms">
            <p>
              We may revise these Terms from time to time to reflect changes in our services,
              legal or regulatory requirements, or business practices. The &quot;Last
              updated&quot; date at the top of this page will be revised accordingly, and, for
              material changes, we will make reasonable efforts to notify registered users (for
              example, via email or an on-site notice). Your continued use of the Platform after
              a revised version of these Terms is published constitutes your acceptance of the
              revised Terms. Where required by law, we will seek your fresh consent instead of
              relying on continued use.
            </p>
          </Section>

          <Section id="misc" title="25. Severability, Waiver, and Entire Agreement">
            <p>
              If any provision of these Terms is held by a court or arbitrator of competent
              jurisdiction to be invalid, illegal, or unenforceable, that provision shall be
              modified to the minimum extent necessary to make it enforceable, or severed if it
              cannot be so modified, and the remaining provisions shall continue in full force
              and effect. Our failure to enforce any right or provision of these Terms shall not
              be deemed a waiver of that right or provision. These Terms, together with our
              Privacy Policy and any service-specific terms referenced herein, constitute the
              entire agreement between you and us regarding your use of the Platform, and
              supersede all prior agreements and understandings, whether written or oral,
              regarding the subject matter herein.
            </p>
          </Section>

          <Section id="contact" title="26. Contact Us">
            <p>
              For any questions about these Terms, please contact us at:
            </p>
            <div className="mt-3 rounded-xl border border-nav-lavender-line bg-white/60 p-4 text-sm">
              <p><strong>{BUSINESS_INFO.entityName}</strong></p>
              <p className="mt-1">{BUSINESS_INFO.registeredAddress}</p>
              <p className="mt-1">
                Email:{" "}
                <a href={`mailto:${FOOTER_CONTACT.email}`} className="text-nav-amethyst-deep hover:underline">
                  {FOOTER_CONTACT.email}
                </a>
              </p>
              <p className="mt-1">Phone: {FOOTER_CONTACT.phone}</p>
            </div>
          </Section>
        </div>

        <p className="mt-10 border-t border-nav-lavender-line pt-5 text-xs leading-relaxed text-nav-plum/50">
          This document is drafted to align with Indian consumer-protection, e-commerce, and
          information-technology law as currently in force, and should be reviewed by a qualified
          legal professional and updated with the business&apos;s actual registered entity
          details, GSTIN, grievance officer, and jurisdiction before being relied upon as a final,
          binding document — see LEGAL_REVIEW_CHECKLIST.md. See also our{" "}
          <Link href="/privacy-policy" className="text-nav-amethyst-deep hover:underline">Privacy Policy</Link>,{" "}
          <Link href="/refund-cancellation" className="text-nav-amethyst-deep hover:underline">Refund & Cancellation Policy</Link>,{" "}
          <Link href="/disclaimer" className="text-nav-amethyst-deep hover:underline">Disclaimer</Link>, and{" "}
          our full <Link href="/help" className="text-nav-amethyst-deep hover:underline">Help & Support</Link> section.
        </p>
      </div>
    </main>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">{title}</h2>
      <div className="mt-3 text-sm leading-relaxed text-nav-plum/85">{children}</div>
    </section>
  );
}
