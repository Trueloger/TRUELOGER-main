// Footer navigation data — real routes and real homepage-section anchors
// only. Every href here resolves to something that actually exists today:
// `/` and `/predictions/daily-horoscope` are real pages; the `/#*-heading`
// links point at real section headings that carry that exact id (see each
// section's <h2 id="...">, which also now carries a matching scroll-mt-*
// so the anchor jump clears the fixed navbar). Nothing here references the
// aspirational routes in `src/components/nav/nav-data.ts` (e.g. /consult,
// /reports, /puja, /mall, /account/*) — those don't have pages yet.
//
// Two distinct groupings on purpose (not the same six links twice): FOOTER_EXPLORE
// is "get around the site" (home, the one real standalone route, then the
// homepage sections in page order); FOOTER_DISCOVER is "what's on this
// page" framed differently (a different subset, different order, its own
// standalone-route repeat is fine since it's the only real non-anchor
// route in the whole site).
export type FooterLink = {
  label: string;
  href: string;
};

// /about and /support don't exist yet — user explicitly asked for these
// footer entries now, pages to follow later. Everything else in this file
// stays link-to-real-destinations-only; this pair is the one deliberate
// exception, by request.
export const FOOTER_COMPANY: FooterLink[] = [
  { label: "About Us", href: "/about" },
  { label: "Support", href: "/support" },
];

// PLACEHOLDER contact details — user asked to wire these up now with
// placeholders, to be swapped for real values later. Update all three here
// when real details are available; nothing else needs to change.
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

export const FOOTER_DISCOVER: FooterLink[] = [
  { label: "Explore Services", href: "/#explore-services-heading" },
  { label: "Today's Horoscope", href: "/#horoscope-heading" },
  { label: "Healing & Balance", href: "/#healing-heading" },
  { label: "Seeker Stories", href: "/#testimonials-heading" },
  { label: "Daily Horoscope", href: "/predictions/daily-horoscope" },
];
