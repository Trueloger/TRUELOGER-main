import {
  Home,
  UserRound,
  Gift,
  FileText,
  Flame,
  ShoppingBag,
  Sparkles,
  GraduationCap,
  MoreHorizontal,
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
    // Label is "Tools" per the site-wide "Free Services" -> "Tools"
    // terminology change — the underlying route (/free-services) is
    // deliberately unchanged (this is a user-facing label rename, not
    // a route rename, per the spec's own "do not rename actual routes
    // unless necessary" instruction).
    label: "Tools",
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
    // Shorter top-level label ("Reports" not "Personalized Reports")
    // purely to keep the desktop nav row compact — the page itself,
    // its children, and every other mention of this product line
    // elsewhere keep the full "Personalized Reports"/"[X] Report"
    // naming.
    label: "Reports",
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
    label: "Healing",
    href: "/healing",
    icon: Sparkles,
    // Real names/hrefs from src/lib/services/data/healing.ts (which
    // mirrors the homepage's own HEALING_SERVICES copy exactly).
    children: [
      { label: "Chakra Healing", href: "/healing/chakra-healing" },
      { label: "Aura Cleansing", href: "/healing/aura-cleansing" },
      { label: "Relationship Healing", href: "/healing/relationship-healing" },
      { label: "Money Healing", href: "/healing/money-healing" },
    ],
  },
  {
    // The actual 6 Puja services offered on the homepage (see
    // src/components/puja/puja-data.ts / src/lib/services/data/puja.ts)
    // — replacing the earlier placeholder category-label children that
    // pointed nowhere real.
    label: "Puja",
    href: "/puja",
    icon: Flame,
    children: [
      { label: "Ganesh Puja", href: "/puja/ganesh-puja" },
      { label: "Lakshmi Puja", href: "/puja/lakshmi-puja" },
      { label: "Navgraha Puja", href: "/puja/navgraha-puja" },
      { label: "Rudrabhishek Puja", href: "/puja/rudrabhishek-puja" },
      { label: "Grah Shanti Puja", href: "/puja/grah-shanti-puja" },
      { label: "Maha Mrityunjaya Puja", href: "/puja/maha-mrityunjaya-puja" },
    ],
  },
  {
    label: "Courses",
    href: "/courses",
    icon: GraduationCap,
    children: [
      { label: "Vedic Astrology Fundamentals", href: "/courses/vedic-astrology-fundamentals" },
      { label: "Advanced Vedic Astrology", href: "/courses/advanced-vedic-astrology" },
      { label: "Numerology Foundations", href: "/courses/numerology-foundations" },
      { label: "Tarot Reading Mastery", href: "/courses/tarot-reading-mastery" },
      { label: "Vastu Shastra Essentials", href: "/courses/vastu-shastra-essentials" },
      { label: "Palmistry: Reading the Hand", href: "/courses/palmistry-reading-the-hand" },
      { label: "Spiritual Healing & Energy Healing", href: "/courses/energy-healing-practitioner" },
      { label: "Astrology for Career & Finance", href: "/courses/astrology-for-career-finance" },
    ],
  },
  {
    // Predictions + Library folded into one "More" entry purely to
    // fit the primary desktop row into real available width — both
    // keep their own real top-level pages/routes below, nothing is
    // hidden or removed. (The previous attempt at this broke because
    // of a since-fixed overflow-x-auto bug elsewhere in this file's
    // consumer, DesktopNav.tsx — not because of grouping itself.)
    label: "More",
    href: "/predictions",
    icon: MoreHorizontal,
    children: [
      ...childrenFrom("/predictions", ["Daily Horoscope", "Weekly Horoscope", "Monthly Horoscope", "Personalized Predictions"]),
      ...childrenFrom("/library", ["Astrology Guides", "Spiritual Wisdom", "Mantras", "Chalisa", "Vedic Knowledge", "Astrology Concepts"]),
    ],
  },
];

export const MALL_ITEM: NavItem = {
  // "Mall" on the desktop nav pill (kept short for the same width
  // reasons as the other trims here); the mobile accordion row still
  // shows the full "TRUELOGER Mall" via MobileNav's own ALL_ITEMS
  // list, which reads this same label — see DesktopNav.tsx's
  // MallControl for the desktop-only shortened display.
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
