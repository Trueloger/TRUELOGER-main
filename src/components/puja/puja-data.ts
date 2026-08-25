export type PujaService = {
  id: string;
  title: string;
  description: string;
  detail: string;
  href: string;
};

// Real HTML content rendered as an overlay inside the shared card
// template's blank area (public/puja cards.png) — see PujaCard. Kept as
// data (not baked into per-card artwork) so titles/descriptions stay
// editable, crawlable and easy to extend with more pujas later without
// touching the card component.
export const PUJA_SERVICES: PujaService[] = [
  {
    id: "ganesh-puja",
    title: "Ganesh Puja",
    description:
      "Remove obstacles, invite new beginnings, and seek blessings for success, wisdom, and prosperity.",
    detail: "Ideal for new beginnings • 60–90 min",
    href: "/consult/puja-and-rituals/ganesh-puja",
  },
  {
    id: "lakshmi-puja",
    title: "Lakshmi Puja",
    description:
      "A sacred ritual for prosperity, abundance, financial wellbeing, and blessings of Goddess Lakshmi.",
    detail: "Prosperity & abundance • 60–90 min",
    href: "/consult/puja-and-rituals/lakshmi-puja",
  },
  {
    id: "navgraha-puja",
    title: "Navgraha Puja",
    description:
      "Traditional Vedic rituals to harmonize planetary influences and support balance, peace, and progress.",
    detail: "Planetary harmony • 60–90 min",
    href: "/consult/puja-and-rituals/navgraha-puja",
  },
  {
    id: "rudrabhishek-puja",
    title: "Rudrabhishek Puja",
    description:
      "A powerful Shiva ritual traditionally performed for purification, protection, inner peace, and spiritual strength.",
    detail: "Peace & purification • 60–90 min",
    href: "/consult/puja-and-rituals/rudrabhishek-puja",
  },
  {
    id: "grah-shanti-puja",
    title: "Grah Shanti Puja",
    description:
      "Vedic rituals performed to promote harmony, stability, peace, and positive energy within the home.",
    detail: "Home harmony • 60–90 min",
    href: "/consult/puja-and-rituals/grah-shanti-puja",
  },
  {
    id: "maha-mrityunjaya-puja",
    title: "Maha Mrityunjaya Puja",
    description:
      "A sacred Vedic prayer ritual traditionally performed for protection, strength, peace, and spiritual wellbeing.",
    detail: "Protection & wellbeing • 60–90 min",
    href: "/consult/puja-and-rituals/maha-mrityunjaya-puja",
  },
];
