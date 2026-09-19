// src/components/tools/tools-data.ts
// Every free astrology tool shown on /free-services — the page the
// homepage's "Tools" quick-service card and the navbar's "Tools"
// dropdown both link to (see src/components/nav/nav-data.ts's "Tools"
// entry's children, which this list mirrors 1:1). Short descriptions
// are trimmed versions of each tool page's own metadata description,
// not reinvented copy.
import type { ComponentType, SVGProps } from "react";
import { MoonStar, Sunrise, Hourglass, HeartHandshake } from "lucide-react";
import {
  KundliChartIcon,
  KundliMatchIcon,
  NumerologyGridIcon,
  NakshatraStarsIcon,
  PanchangCalendarIcon,
  MarsGlyphIcon,
  SaturnGlyphIcon,
} from "@/components/quick-services/icons";

export type ToolItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const TOOLS: ToolItem[] = [
  {
    id: "free-kundli",
    title: "Free Kundli",
    description: "Your complete Vedic birth chart — planets, houses, Ascendant, Moon sign and Nakshatra.",
    href: "/free-kundli",
    Icon: KundliChartIcon,
  },
  {
    id: "kundli-matching",
    title: "Kundli Matching",
    description: "Traditional 8-koota Ashtakoot Guna Milan score out of 36 for a bride and groom.",
    href: "/kundli-matching",
    Icon: KundliMatchIcon,
  },
  {
    id: "compatibility",
    title: "Compatibility",
    description: "A relationship-compatibility reading — emotional style, strengths and challenges, for real charts.",
    href: "/compatibility",
    Icon: HeartHandshake,
  },
  {
    id: "numerology",
    title: "Numerology",
    description: "Your Life Path, Destiny, Soul Urge, Personality and Birth numbers from name and birth date.",
    href: "/numerology",
    Icon: NumerologyGridIcon,
  },
  {
    id: "nakshatra",
    title: "Nakshatra",
    description: "Your birth Nakshatra — lunar mansion, ruling deity, symbol and pada.",
    href: "/nakshatra",
    Icon: NakshatraStarsIcon,
  },
  {
    id: "rashi",
    title: "Rashi",
    description: "Your Vedic Rashi — Moon sign, its element and ruling planet.",
    href: "/rashi",
    Icon: MoonStar,
  },
  {
    id: "ascendant",
    title: "Ascendant",
    description: "Your Vedic Lagna, or rising sign, from your exact birth date, time and place.",
    href: "/ascendant",
    Icon: Sunrise,
  },
  {
    id: "dasha",
    title: "Dasha",
    description: "Your current Mahadasha and Antardasha, and the full Vimshottari Dasha timeline.",
    href: "/dasha",
    Icon: Hourglass,
  },
  {
    id: "mangal-dosha",
    title: "Mangal Dosha",
    description: "Whether Mangal (Kuja) Dosha appears in your chart — explained clearly, without alarm.",
    href: "/mangal-dosha",
    Icon: MarsGlyphIcon,
  },
  {
    id: "sade-sati",
    title: "Sade Sati",
    description: "Whether Saturn's Sade Sati cycle is currently active for your natal Moon sign.",
    href: "/sade-sati",
    Icon: SaturnGlyphIcon,
  },
  {
    id: "panchang",
    title: "Panchang",
    description: "Today's Tithi, Nakshatra, Yoga, Karana, sunrise/sunset, Rahu Kalam and Choghadiya.",
    href: "/panchang",
    Icon: PanchangCalendarIcon,
  },
];
