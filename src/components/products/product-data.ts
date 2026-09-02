export type Product = {
  id: string;
  name: string;
  subtitle: string;
  image: string;
};

// The first six gemstones from public/gemstones image/ (1.png..6.png, the
// folder's existing numeric ordering). Each source file is already a
// complete, pre-designed card — border, gemstone photo, title, subtitle,
// gold/lotus ornaments, and a shared blank box near the bottom reserved
// for the CTA — generated from the approved gemstone-card reference, one
// unique render per product. Cropped (not redrawn) to a single shared
// bounding box shared by all six so every card is pixel-identical in
// size regardless of the source canvas's per-image shadow bleed — see
// public/gemstones image/cards/. Real HTML content is limited to the Add
// to Cart button, overlaid inside that shared blank box — see
// ProductCard. Subtitles are transcribed from the artwork (used for
// accessible alt text, not re-rendered as visible HTML) since the site
// has no existing gemstone product metadata to draw from yet.
export const FEATURED_PRODUCTS: Product[] = [
  {
    id: "blue-sapphire",
    name: "Blue Sapphire",
    subtitle:
      "A powerful gemstone for wisdom, clarity, inner peace & spiritual protection.",
    image: "/gemstones image/cards/1.png",
  },
  {
    id: "yellow-sapphire",
    name: "Yellow Sapphire",
    subtitle:
      "A powerful gemstone for wisdom, prosperity, confidence & success.",
    image: "/gemstones image/cards/2.png",
  },
  {
    id: "ceylon-sapphire",
    name: "Ceylon Sapphire",
    subtitle:
      "A rare and radiant gemstone for wisdom, clarity, intuition & spiritual growth.",
    image: "/gemstones image/cards/3.png",
  },
  {
    id: "white-pukhraj",
    name: "White Pukhraj",
    subtitle:
      "A rare gemstone for wisdom, clarity, mental peace & spiritual growth.",
    image: "/gemstones image/cards/4.png",
  },
  {
    id: "ceylon-neelam",
    name: "Ceylon Neelam",
    subtitle:
      "A rare and powerful gemstone for clarity, intuition, focus & spiritual protection.",
    image: "/gemstones image/cards/5.png",
  },
  {
    id: "peetambari-neelam",
    name: "Peetambari Neelam",
    subtitle:
      "A rare and auspicious gemstone for wisdom, prosperity, confidence & positive transformation.",
    image: "/gemstones image/cards/6.png",
  },
];
