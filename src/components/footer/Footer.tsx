import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MessageCircle } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { storageImage } from "@/lib/storage-image";
import { LotusIcon } from "@/components/quick-services/icons";
import { FooterAccordion } from "./FooterAccordion";
import { InstagramGlyph, YoutubeGlyph, FacebookGlyph } from "./social-icons";
import {
  FOOTER_COMPANY,
  FOOTER_CONTACT,
  FOOTER_HELP,
  FOOTER_POLICIES,
  FOOTER_LEGAL_TRUST,
  FOOTER_EXPLORE,
  FOOTER_SOCIALS,
} from "./footer-data";

const SOCIAL_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  instagram: InstagramGlyph,
  youtube: YoutubeGlyph,
  facebook: FacebookGlyph,
};

// Same asset as the navbar logo (see Logo.tsx), just sized larger for the
// footer brand mark rather than a footer-specific variant.
const LOGO_SRC = storageImage("/logo-nav.png");
const LOGO_ASPECT = 1318 / 373;

/**
 * Site footer — rendered once in the root layout, after {children}, so it
 * appears at the bottom of every page. Picks up the ivory/lavender wash the
 * rest of the site uses (Testimonials, the last homepage section, ends on
 * nav-lavender-soft) and fades back to nav-ivory; no dark/black background.
 *
 * Brand mark + description, contact (email/phone/WhatsApp) + social icons,
 * five nav groups (Explore, Company, Help, Policies, Legal & Trust — the
 * full Legal/Company/Help/Support/Policy/Trust section) built from real
 * routes, and a copyright bar with a dynamic year plus the core legal
 * links. Contact details and social URLs are PLACEHOLDERS (see
 * footer-data.ts / LEGAL_REVIEW_CHECKLIST.md) pending real ones.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      aria-label="Site footer"
      className="relative -mt-px bg-gradient-to-b from-nav-lavender-soft via-nav-lavender-mist to-nav-ivory"
    >
      {/* Small closing-style ornament at the top too — echoes the
          lotus-flanked-by-lines motif every section above uses, scaled
          down, not the large hero->services dome (that curve is specific
          to that one seam). */}
      <div
        aria-hidden="true"
        className="flex items-center justify-center gap-3 pt-10 md:pt-14"
      >
        <span className="h-px w-10 bg-nav-lavender-line" />
        <LotusIcon className="h-5 w-5 text-nav-gold" strokeWidth={1.3} />
        <span className="h-px w-10 bg-nav-lavender-line" />
      </div>

      <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 md:px-8 md:py-14">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.7fr_0.7fr_1fr_1fr] md:gap-8 lg:gap-10">
          {/* Brand + short description + contact + socials */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <Link
              href="/"
              aria-label="TRUELOGER — go to homepage"
              className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-lavender-mist"
            >
              <Image
                src={LOGO_SRC}
                alt="TRUELOGER"
                width={Math.round(48 * LOGO_ASPECT)}
                height={48}
                className="h-10 w-auto md:h-12"
              />
            </Link>
            <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-nav-plum/80">
              Vedic astrology, personalized guidance, and sacred rituals —
              helping you find clarity and balance on your spiritual
              journey.
            </p>

            {/* Contact — placeholder values, see footer-data.ts. Real
                mailto:/tel:/wa.me links so they're genuinely functional
                once the placeholders are swapped for real details. */}
            <ul className="mt-5 flex flex-col items-center gap-2 md:items-start">
              <li>
                <a
                  href={`mailto:${FOOTER_CONTACT.email}`}
                  className="flex items-center gap-2 py-1 text-[0.9rem] text-nav-plum/80 transition-colors hover:text-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-lavender-mist"
                >
                  <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-nav-amethyst-deep" />
                  {FOOTER_CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${FOOTER_CONTACT.phone.replace(/\s+/g, "")}`}
                  className="flex items-center gap-2 py-1 text-[0.9rem] text-nav-plum/80 transition-colors hover:text-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-lavender-mist"
                >
                  <Phone aria-hidden="true" className="h-4 w-4 shrink-0 text-nav-amethyst-deep" />
                  {FOOTER_CONTACT.phone}
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${FOOTER_CONTACT.whatsappDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 py-1 text-[0.9rem] text-nav-plum/80 transition-colors hover:text-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-lavender-mist"
                >
                  <MessageCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-nav-amethyst-deep" />
                  WhatsApp Us
                </a>
              </li>
            </ul>

            {/* Social icons — placeholder URLs, see footer-data.ts. */}
            <ul className="mt-5 flex items-center gap-2">
              {FOOTER_SOCIALS.map((social) => {
                const Icon = SOCIAL_ICONS[social.iconKey];
                return (
                  <li key={social.iconKey}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`TRUELOGER on ${social.label} (opens in a new tab)`}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-nav-lavender-line text-nav-amethyst-deep transition-colors hover:border-nav-amethyst hover:bg-nav-pearl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-lavender-mist"
                    >
                      <Icon aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Primary nav group — real homepage utility links. */}
          <nav aria-label="Explore">
            <FooterAccordion title="Explore" links={FOOTER_EXPLORE} />
          </nav>

          {/* Company — About / Contact. */}
          <nav aria-label="Company">
            <FooterAccordion title="Company" links={FOOTER_COMPANY} />
          </nav>

          {/* Help — Help & Support / FAQ. */}
          <nav aria-label="Help">
            <FooterAccordion title="Help" links={FOOTER_HELP} />
          </nav>

          {/* Policies — the commerce/consumer-facing policy set. */}
          <nav aria-label="Policies">
            <FooterAccordion title="Policies" links={FOOTER_POLICIES} />
          </nav>

          {/* Legal & Trust — grievance, data deletion, accessibility,
              astrologer terms, security. */}
          <nav aria-label="Legal & Trust">
            <FooterAccordion title="Legal & Trust" links={FOOTER_LEGAL_TRUST} />
          </nav>
        </div>
      </div>

      {/* Bottom bar — dynamic copyright year, real brand name, and the
          core legal-links row. */}
      <div className="border-t border-nav-lavender-line px-4 py-6 sm:px-6 md:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-col items-center gap-3 text-center">
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.85rem] text-nav-plum/70">
            <span>&copy; {year} TRUELOGER. All rights reserved.</span>
            <Link href="/terms-and-conditions" className="underline underline-offset-2 hover:text-nav-amethyst-deep">Terms</Link>
            <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-nav-amethyst-deep">Privacy</Link>
            <Link href="/refund-cancellation" className="underline underline-offset-2 hover:text-nav-amethyst-deep">Refunds</Link>
            <Link href="/grievance" className="underline underline-offset-2 hover:text-nav-amethyst-deep">Grievance</Link>
          </p>
          <LotusIcon
            aria-hidden="true"
            className="h-4 w-4 text-nav-amethyst-deep"
            strokeWidth={1.3}
          />
        </div>
      </div>
    </footer>
  );
}
