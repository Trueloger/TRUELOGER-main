import type { ComponentType, SVGProps } from "react";
import {
  KundliChartIcon,
  KundliMatchIcon,
  HoroscopeDialIcon,
  NumerologyGridIcon,
  NakshatraStarsIcon,
  PanchangCalendarIcon,
  FreeServicesGridIcon,
  TalkToExpertIcon,
  MallBagIcon,
} from "./icons";

export type QuickService = {
  id: string;
  title: string;
  description: string;
  href: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  featured?: boolean;
};

// hrefs match the top-level routes used by the nav dropdown's "Free
// Services" children (see nav-data.ts) — top-level, not nested under
// /free-services, so this section and the navbar point at the same
// routes for the same tools. Two exceptions: the featured first card,
// "Talk To Astrologer", routes to the PAID consultation catalogue
// (/consult) rather than a free tool, and "TRUELOGER Mall" (3rd
// position) routes to /mall, the mall category-overview page — both
// paid-commerce entry points, not free tools, deliberately placed near
// the top for visibility. "Free Kundli" is kept as the second card.
// "Mangal Dosha" was removed outright to make room for the Mall card
// (rather than being backfilled elsewhere) and "Sade Sati" was removed
// outright per an earlier task — the remaining tiles simply shift up
// to fill the grid.
export const QUICK_SERVICES: QuickService[] = [
  {
    id: "talk-to-astrologer",
    title: "Talk To Astrologer",
    description: "Consult a specialist for personal guidance",
    href: "/consult",
    Icon: TalkToExpertIcon,
    featured: true,
  },
  {
    id: "free-kundli",
    title: "Free Kundli",
    description: "Create your Vedic birth chart",
    href: "/free-kundli",
    Icon: KundliChartIcon,
  },
  {
    id: "truloger-mall",
    title: "TRUELOGER Mall",
    description: "Shop gemstones, rudraksha & spiritual products",
    href: "/mall",
    Icon: MallBagIcon,
  },
  {
    id: "kundli-matching",
    title: "Kundli Matching",
    description: "Explore compatibility with your partner",
    href: "/kundli-matching",
    Icon: KundliMatchIcon,
  },
  {
    id: "daily-horoscope",
    title: "Daily Horoscope",
    description: "Get today's guidance for your zodiac sign",
    href: "/predictions/daily-horoscope",
    Icon: HoroscopeDialIcon,
  },
  {
    id: "numerology",
    title: "Numerology",
    description: "Discover the power of your numbers",
    href: "/numerology",
    Icon: NumerologyGridIcon,
  },
  {
    id: "nakshatra",
    title: "Nakshatra",
    description: "Explore your birth star and its significance",
    href: "/nakshatra",
    Icon: NakshatraStarsIcon,
  },
  {
    id: "panchang",
    title: "Panchang",
    description: "View today's tithi, muhurta & more",
    href: "/panchang",
    Icon: PanchangCalendarIcon,
  },
  {
    id: "free-services",
    title: "Tools",
    description: "Explore all our free astrology tools",
    href: "/free-services",
    Icon: FreeServicesGridIcon,
  },
];
