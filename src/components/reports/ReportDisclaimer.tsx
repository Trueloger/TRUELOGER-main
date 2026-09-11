// src/components/reports/ReportDisclaimer.tsx
// Standard closing disclaimer — same text the PDF renderer uses (see
// src/lib/reports/render-pdf.tsx's DisclaimerPage), kept as its own
// small component here so the web reader and PDF stay in sync if this
// wording is ever updated.
export function ReportDisclaimer() {
  return (
    <div className="text-xs leading-relaxed text-nav-plum/50">
      <p>
        This report reflects traditional Vedic astrology interpretations based on the birth details
        provided and calculated planetary positions. It is intended for guidance and self-reflection
        only, and should not be treated as a medical diagnosis, legal advice, financial advice, or a
        guaranteed prediction of future events. Traditional astrological interpretation suggests
        certain tendencies and patterns; individual outcomes depend on many factors beyond the scope
        of this report. Please consult appropriately licensed professionals for medical, legal, or
        financial decisions. Remedies described are traditional practices offered for reflection, not
        a substitute for professional advice.
      </p>
      <p className="mt-2">© TrueLoger. This report is generated exclusively for the named recipient and is confidential.</p>
    </div>
  );
}
