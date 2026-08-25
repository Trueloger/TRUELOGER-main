import type { ComponentType, SVGProps } from "react";
import {
  KundliChartIcon,
  KundliMatchIcon,
  HoroscopeDialIcon,
  NumerologyGridIcon,
  MarsGlyphIcon,
  SaturnGlyphIcon,
  NakshatraStarsIcon,
  PanchangCalendarIcon,
  FreeServicesGridIcon,
} from "./icons";

export type QuickService = {
  id: string;
  title: string;
  description: string;
  href: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  featured?: boolean;
};

// hrefs match the slugs already used by the nav dropdowns, so this section
// and the navbar point at the same routes for the same tools.
export const QUICK_SERVICES: QuickService[] = [
  {
    id: "free-kundli",
    title: "Free Kundli",
    description: "Create your Vedic birth chart",
    href: "/free-services/free-kundli",
    Icon: KundliChartIcon,
    featured: true,
  },
  {
    id: "kundli-matching",
    title: "Kundli Matching",
    description: "Explore compatibility with your partner",
    href: "/free-services/kundli-matching",
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
    href: "/free-services/numerology",
    Icon: NumerologyGridIcon,
  },
  {
    id: "mangal-dosha",
    title: "Mangal Dosha",
    description: "Check Mangal Dosha in your chart",
    href: "/free-services/mangal-dosha",
    Icon: MarsGlyphIcon,
  },
  {
    id: "sade-sati",
    title: "Sade Sati",
    description: "Understand Saturn's impact on your life",
    href: "/free-services/sade-sati",
    Icon: SaturnGlyphIcon,
  },
  {
    id: "nakshatra",
    title: "Nakshatra",
    description: "Explore your birth star and its significance",
    href: "/free-services/nakshatra",
    Icon: NakshatraStarsIcon,
  },
  {
    id: "panchang",
    title: "Panchang",
    description: "View today's tithi, muhurta & more",
    href: "/free-services/panchang",
    Icon: PanchangCalendarIcon,
  },
  {
    id: "free-services",
    title: "Free Services",
    description: "Explore all our free astrology tools",
    href: "/free-services",
    Icon: FreeServicesGridIcon,
  },
];
