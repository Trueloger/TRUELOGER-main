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
    children: childrenFrom("/consult", [
      "Vedic Astrology",
      "Numerology",
      "Tarot",
      "Vastu",
      "Spiritual Healing",
      "Puja & Rituals",
    ]),
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
    label: "Personalized Reports",
    href: "/reports",
    icon: FileText,
    children: childrenFrom("/reports", [
      "Kundli Report",
      "Marriage Report",
      "Career Report",
      "Love & Relationship Report",
      "Finance Report",
      "Life Report",
      "Dosha Report",
    ]),
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
  children: childrenFrom("/mall", [
    "Gemstones",
    "Rudraksha",
    "Bracelets",
    "Yantras",
    "Spiritual Products",
  ]),
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
