import {
  Home,
  UserRound,
  MoonStar,
  Gift,
  FileText,
  Flame,
  BookOpen,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export type NavChild = {
  label: string;
  href: string;
};

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavChild[];
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function childrenFrom(base: string, labels: string[]): NavChild[] {
  return labels.map((label) => ({
    label,
    href: `${base}/${slugify(label)}`,
  }));
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Consult",
    href: "/consult",
    icon: UserRound,
    // Explicit (not slugify-derived) so every href matches
    // CONSULTATION_SERVICES' own `slug` field exactly (see
    // src/lib/consultation/services-data.ts) — this is the single
    // navigation surface for the paid consultation catalogue; the
    // /consult landing page's own cards link to the same routes.
    // Puja & Rituals is deliberately NOT listed here per the "remove
    // Puja from the consultation dropdown" requirement — the Puja
    // section itself still exists at its own top-level nav entry below.
    children: [
      { label: "Vedic Astrology", href: "/consult/vedic-astrology" },
      { label: "Tarot Reading", href: "/consult/tarot-reading" },
      { label: "Numerology", href: "/consult/numerology" },
      { label: "Vastu", href: "/consult/vastu" },
      { label: "Spiritual Healing", href: "/consult/spiritual-healing" },
      { label: "Palmistry", href: "/consult/palmistry" },
      { label: "Lal Kitab", href: "/consult/lal-kitab" },
      { label: "KP Astrology", href: "/consult/kp-astrology" },
      { label: "Nadi Astrology", href: "/consult/nadi-astrology" },
      { label: "Love & Relationship Astrology", href: "/consult/love-relationship-astrology" },
      { label: "Career Astrology", href: "/consult/career-astrology" },
      { label: "Marriage Astrology", href: "/consult/marriage-astrology" },
      { label: "Prashna / Horary", href: "/consult/prashna-horary" },
    ],
  },
  {
    label: "Predictions",
    href: "/predictions",
    icon: MoonStar,
    children: childrenFrom("/predictions", [
      "Daily Horoscope",
      "Weekly Horoscope",
      "Monthly Horoscope",
      "Personalized Predictions",
    ]),
  },
  {
    label: "Free Services",
    href: "/free-services",
    icon: Gift,
    children: [
      { label: "Free Kundli", href: "/free-kundli" },
      { label: "Kundli Matching", href: "/kundli-matching" },
      { label: "Numerology", href: "/numerology" },
      { label: "Nakshatra", href: "/nakshatra" },
      { label: "Rashi", href: "/rashi" },
      { label: "Ascendant", href: "/ascendant" },
      { label: "Mangal Dosha", href: "/mangal-dosha" },
      { label: "Sade Sati", href: "/sade-sati" },
      { label: "Dasha", href: "/dasha" },
      { label: "Compatibility", href: "/compatibility" },
      { label: "Panchang", href: "/panchang" },
    ],
  },
  {
    // Real slugs (matching src/lib/reports/products.ts) rather than
    // childrenFrom()'s auto-slugified labels — deliberately routed
    // under /reports/personalized/*, NOT bare /reports/*, since a
    // PURCHASED report's own reader lives at /reports/[reportId] (a
    // dynamic top-level segment); a catalogue page at e.g.
    // /reports/kundli-report would collide with that same route
    // pattern in Next's router. See src/lib/reports/products.ts for
    // the full product data this menu links into.
    label: "Personalized Reports",
    href: "/reports/personalized",
    icon: FileText,
    children: [
      { label: "Kundli Report", href: "/reports/personalized/kundli" },
      { label: "Marriage Report", href: "/reports/personalized/marriage" },
      { label: "Career Report", href: "/reports/personalized/career" },
      { label: "Love & Relationship Report", href: "/reports/personalized/love-relationship" },
      { label: "Finance Report", href: "/reports/personalized/finance" },
      { label: "Life Report", href: "/reports/personalized/life" },
      { label: "Dosha Report", href: "/reports/personalized/dosha" },
    ],
  },
  {
    label: "Puja",
    href: "/puja",
    icon: Flame,
    children: childrenFrom("/puja", [
      "Popular Pujas",
      "Dosha Remedies",
      "Planetary Pujas",
      "Festival Pujas",
      "Special Pujas",
    ]),
  },
  {
    label: "Library",
    href: "/library",
    icon: BookOpen,
    children: childrenFrom("/library", [
      "Astrology Guides",
      "Spiritual Wisdom",
      "Mantras",
      "Chalisa",
      "Vedic Knowledge",
      "Astrology Concepts",
    ]),
  },
];

export const MALL_ITEM: NavItem = {
  label: "TRUELOGER Mall",
  href: "/mall",
  icon: ShoppingBag,
  // "Gemstones" is explicit (not slugify-derived via childrenFrom) —
  // it routes to the dedicated /gemstones catalogue (see
  // src/lib/gemstones/gemstone-data.ts), not /mall/gemstones. The
  // other Mall categories are unrelated to this task and keep their
  // existing /mall/* placeholder routes.
  children: [
    { label: "Gemstones", href: "/gemstones" },
    ...childrenFrom("/mall", ["Rudraksha", "Bracelets", "Yantras", "Spiritual Products"]),
  ],
};

export const PROFILE_MENU: NavChild[] = [
  { label: "Profile", href: "/account/profile" },
  { label: "Meetings", href: "/account/meetings" },
  { label: "Reports", href: "/account/reports" },
  { label: "Orders", href: "/account/orders" },
  { label: "Account Settings", href: "/account/settings" },
];

export const SUPPORT_LINKS: NavChild[] = [
  { label: "Help & Support", href: "/support" },
  { label: "About TRUELOGER", href: "/about" },
  { label: "Privacy & Security", href: "/privacy" },
];
