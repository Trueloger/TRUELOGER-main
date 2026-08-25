export type ExploreService = {
  id: string;
  title: string;
  description: string;
  href: string;
};

export const EXPLORE_SERVICES: ExploreService[] = [
  {
    id: "vedic-astrology",
    title: "Vedic Astrology",
    description: "Decode your birth chart and understand your path.",
    href: "/consult/vedic-astrology",
  },
  {
    id: "numerology",
    title: "Numerology",
    description: "Discover the meaning behind numbers.",
    href: "/consult/numerology",
  },
  {
    id: "tarot-reading",
    title: "Tarot Reading",
    description: "Gain clarity through intuitive tarot guidance.",
    href: "/consult/tarot",
  },
  {
    id: "vastu",
    title: "Vastu",
    description: "Harmonize your space for peace and prosperity.",
    href: "/consult/vastu",
  },
  {
    id: "spiritual-healing",
    title: "Spiritual Healing",
    description: "Heal, restore and awaken your inner energy.",
    href: "/consult/spiritual-healing",
  },
  {
    id: "puja-rituals",
    title: "Puja & Rituals",
    description: "Sacred rituals for blessings, protection and growth.",
    href: "/consult/puja-and-rituals",
  },
];
