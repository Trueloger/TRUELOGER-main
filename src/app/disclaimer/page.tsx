import type { Metadata } from "next";
import { LegalPageLayout, PolicySection } from "@/components/legal/LegalPageLayout";
import { POLICY_META } from "@/lib/policy/config";

export const metadata: Metadata = {
  title: "Disclaimer | TRUELOGER",
  description: "Important disclaimers about astrology, AI-generated content, and spiritual services on TrueLoger.",
};

export default function DisclaimerPage() {
  return (
    <LegalPageLayout title="Disclaimer" lastUpdated={POLICY_META.disclaimer.lastUpdated}>
      <PolicySection id="astrology" title="Astrology & Spiritual Services">
        <p>
          Astrology, numerology, tarot, Vastu, healing, and Puja are traditional systems of belief and spiritual
          practice, not empirical or medical sciences. All consultations, reports, predictions, remedies, and
          recommendations on TrueLoger are provided for informational, spiritual, and traditional-interpretive
          purposes only. We make no guarantee that any consultation, remedy, gemstone, healing session, or Puja
          will produce any specific outcome.
        </p>
      </PolicySection>

      <PolicySection id="not-professional-advice" title="Not Medical, Legal, or Financial Advice">
        <p>
          Nothing on TrueLoger constitutes medical, psychiatric, legal, financial, investment, or tax advice.
          Financial-astrology content (e.g. our Finance report) reflects traditional astrological interpretation
          of wealth-related planetary indicators — it is not regulated financial or investment advice, and
          should never be the basis for an investment decision on its own. Health-related content is never
          diagnostic and never a substitute for a licensed medical professional. Consult an appropriately
          licensed professional before making any significant medical, legal, or financial decision.
        </p>
      </PolicySection>

      <PolicySection id="ai" title="AI-Generated Content">
        <p>
          Personalized reports combine real astrological calculations (never altered by AI) with narrative
          interpretation written by an AI model. AI-generated text can contain errors and is not a human expert
          opinion — it should be read as a traditional interpretive aid, not a guaranteed or authoritative
          statement.
        </p>
      </PolicySection>

      <PolicySection id="astrologers" title="Independent Astrologers & Consultants">
        <p>
          Astrologers and consultants available through TrueLoger are independent practitioners. We facilitate
          booking and payment for their services but do not control the specific content of the advice given
          during a session, and are not liable for the accuracy or consequences of that advice.
        </p>
      </PolicySection>

      <PolicySection id="emergency" title="Emergencies">
        <p>
          If you are experiencing a medical emergency, mental-health crisis, or any emergency, contact emergency
          services or a qualified professional immediately — do not rely on TrueLoger.
        </p>
      </PolicySection>
    </LegalPageLayout>
  );
}
