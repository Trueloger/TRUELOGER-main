export type HealingService = {
  id: string;
  title: string;
  description: string;
  href: string;
};

// Titles/descriptions match the copy already baked into each card's
// artwork exactly — kept here as real HTML text (sr-only alongside the
// image) so the service names stay crawlable/accessible, per the same
// pattern used for Explore Services' pre-designed cards.
export const HEALING_SERVICES: HealingService[] = [
  {
    id: "chakra-healing",
    title: "Chakra Healing",
    description:
      "Balance and harmonize your seven chakras to restore natural energy flow and enhance well-being.",
    href: "/consult/chakra-healing",
  },
  {
    id: "aura-cleansing",
    title: "Aura Cleansing",
    description:
      "Purify your aura and clear negative energies to create a lighter, calmer and more positive you.",
    href: "/consult/aura-cleansing",
  },
  {
    id: "relationship-healing",
    title: "Relationship Healing",
    description:
      "Heal emotional patterns, release past hurts and invite harmony, love and understanding into your relationships.",
    href: "/consult/relationship-healing",
  },
  {
    id: "money-healing",
    title: "Money Healing",
    description:
      "Clear financial blocks and negative patterns to attract abundance, prosperity and lasting stability.",
    href: "/consult/money-healing",
  },
];
