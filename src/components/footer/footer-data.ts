// Footer navigation data — real routes and real homepage-section
// anchors only. Every href here resolves to something that actually
// exists.
export type FooterLink = {
  label: string;
  href: string;
};

// Company / Help / Policies / Legal & Trust — the full Legal, Company
// Information, Help, Support, Policy and Trust section. Kept as four
// distinct groups (not one giant list) so the footer stays scannable
// rather than overwhelming.
export const FOOTER_COMPANY: FooterLink[] = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

export const FOOTER_HELP: FooterLink[] = [
  { label: "Help & Support", href: "/help" },
  { label: "FAQ", href: "/faq" },
];

export const FOOTER_POLICIES: FooterLink[] = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Refund & Cancellation", href: "/refund-cancellation" },
  { label: "Shipping & Delivery", href: "/shipping-delivery" },
  { label: "Payment & Billing", href: "/payment-billing" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Disclaimer", href: "/disclaimer" },
];

export const FOOTER_LEGAL_TRUST: FooterLink[] = [
  { label: "Privacy & Security", href: "/privacy-security" },
  { label: "Grievance Redressal", href: "/grievance" },
  { label: "Account & Data Deletion", href: "/data-deletion" },
  { label: "Accessibility", href: "/accessibility" },
  { label: "Astrologer Terms", href: "/astrologer-terms" },
];

// PLACEHOLDER contact details — real values pending, see
// LEGAL_REVIEW_CHECKLIST.md. Update all three here when real details
// are available; nothing else needs to change.
export const FOOTER_CONTACT = {
  email: "support@trueloger.com",
  phone: "+91 98765 43210",
  // Digits only, no "+"/spaces — required by the wa.me deep-link format.
  whatsappDigits: "919876543210",
};

// PLACEHOLDER social URLs — same as above, real handles to follow.
export type FooterSocial = {
  label: string;
  href: string;
  iconKey: "instagram" | "youtube" | "facebook";
};

export const FOOTER_SOCIALS: FooterSocial[] = [
  { label: "Instagram", href: "https://instagram.com/trueloger", iconKey: "instagram" },
  { label: "YouTube", href: "https://youtube.com/@trueloger", iconKey: "youtube" },
  { label: "Facebook", href: "https://facebook.com/trueloger", iconKey: "facebook" },
];

export const FOOTER_EXPLORE: FooterLink[] = [
  { label: "Home", href: "/" },
  { label: "Daily Horoscope", href: "/predictions/daily-horoscope" },
  { label: "Quick Services", href: "/#quick-services-heading" },
  { label: "Puja & Rituals", href: "/#puja-heading" },
  { label: "Sacred Gemstones", href: "/#products-heading" },
];
