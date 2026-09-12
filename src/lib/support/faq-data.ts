// src/lib/support/faq-data.ts
// Real questions drawn from actually-implemented workflows only — no
// generic filler unrelated to TrueLoger (AGENTS "do not create generic
// questions unrelated to TrueLoger").
export type FaqCategory = "Account" | "Orders & Payments" | "Consultations" | "Reports" | "Healing & Puja" | "Courses" | "Gemstones";

export type CategorizedFaq = { category: FaqCategory; question: string; answer: string };

export const FAQ_ITEMS: CategorizedFaq[] = [
  { category: "Account", question: "How do I create an account?", answer: "Click \"Login / Sign Up\" in the navbar, choose Sign Up, and register with your email and password, or continue with Google." },
  { category: "Account", question: "How do I log in with Google?", answer: "Click \"Continue with Google\" on the login or signup page. You'll be redirected to Google to choose your account, then brought back to TrueLoger automatically." },
  { category: "Account", question: "How do I complete my profile?", answer: "After signing up (or on first purchase attempt), you'll be asked to complete your profile — full name, date/time/place of birth, and gender. This is required before any purchase because it's the source of truth for all astrological calculations." },
  { category: "Account", question: "How do I delete my account?", answer: "Go to Account Settings and use \"Delete my account.\" See our Account & Data Deletion page for exactly what is and isn't deleted." },
  { category: "Orders & Payments", question: "How do I track my order?", answer: "Go to Account → Orders to see every order's status, or open a specific order for full details." },
  { category: "Orders & Payments", question: "Can I cancel an order?", answer: "It depends on the category — gemstones, consultations, healing, Puja, courses, and reports each have their own cancellation window. See our Refund & Cancellation Policy." },
  { category: "Orders & Payments", question: "How do refunds work?", answer: "Approved refunds are returned to your original payment method within 7–10 business days. See our Refund & Cancellation Policy for what qualifies." },
  { category: "Orders & Payments", question: "How do I use a coupon?", answer: "Apply your coupon code in the cart before checkout — the discount is validated and applied server-side, so the price you see is the price you pay." },
  { category: "Orders & Payments", question: "My payment was deducted but the order shows unpaid — what do I do?", answer: "Contact us with your payment reference and we'll verify the transaction status with our payment gateway and resolve it." },
  { category: "Consultations", question: "How do consultation bookings work?", answer: "Choose a consultation service, pick a duration, then a preferred date and time (required before it's added to your cart), then check out." },
  { category: "Consultations", question: "How do I choose a consultation duration?", answer: "Each consultation offers preset durations (15/30/45/60 minutes) or a custom duration between 15 and 60 minutes; the price updates live as you choose." },
  { category: "Consultations", question: "How do I select a consultation date and time?", answer: "After choosing a duration, you'll pick a date and a time slot within our business hours (10:00 AM – 9:00 PM IST) before the item is added to your cart." },
  { category: "Consultations", question: "How will I receive my Google Meet link?", answer: "Once your payment is confirmed, we automatically create a Google Meet link for your appointment. It appears on your Meetings page, and we also email it to you once it's ready." },
  { category: "Consultations", question: "My meeting link isn't ready yet — is something wrong?", answer: "Your Meetings page shows an honest status (e.g. \"Preparing Your Meeting\") while the link is being created. This is normal and usually resolves quickly; if it's stuck, contact Meeting Support from that page." },
  { category: "Reports", question: "How do I purchase a personalized report?", answer: "Browse Personalized Reports, choose a report type, and add it to your cart. You'll need a complete profile first." },
  { category: "Reports", question: "How long does a personalized report take?", answer: "Delivery time is shown on each report's product page before you buy. Generation happens automatically after payment — real chart calculation, then AI-assisted interpretation section by section, then PDF rendering." },
  { category: "Reports", question: "How do I download my report?", answer: "Once your report status shows \"Ready\" on your Reports page, open it and use the Download PDF button." },
  { category: "Reports", question: "Will my report change if I edit my profile later?", answer: "No — your report is generated from a snapshot of your profile taken at the moment you purchased it, so a later profile edit never changes an already-purchased report." },
  { category: "Healing & Puja", question: "What happens during a healing session?", answer: "Each healing service page describes what the session covers, who it's for, and what to expect. These are traditional, wellness-oriented practices, not medical treatment." },
  { category: "Healing & Puja", question: "How does a Puja booking work?", answer: "Choose a Puja, add it to your cart, and check out. The Puja is performed by our associated priests on your behalf (or with your attendance where available) — see each Puja's own page for details." },
  { category: "Courses", question: "How do I access a course after buying it?", answer: "Courses are self-paced digital content delivered as instant access after payment." },
  { category: "Gemstones", question: "What is the estimated gemstone delivery time?", answer: "Each product page shows its own estimated delivery window — this varies by product, so check the specific gemstone's page." },
  { category: "Gemstones", question: "What does Ratti mean?", answer: "Ratti is the traditional unit gemstone weight is measured in on TrueLoger (1 Ratti ≈ 0.91 carat)." },
];
