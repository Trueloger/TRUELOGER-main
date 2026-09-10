// scripts/dev/seed-products.ts
// One-time migration + catalogue-expansion seed for the unified
// Firestore product store (src/lib/products/store.ts). Two jobs:
//
//   1. Migrate the original 8 gemstones + the ₹1 test-payment item out
//      of the static src/lib/gemstones/gemstone-data.ts array into real
//      `products/{id}` documents, using the EXACT SAME id/slug each had
//      before ("ruby", "pearl", "test-payment", ...) so any existing
//      order document's `productId` still resolves correctly.
//   2. Seed a real, researched set of additional gemstones (selected —
//      not every AstroSage/AstroTalk stone, per the "use selection
//      criteria" requirement) plus one example product per new category
//      (bracelet, rudraksha, spiritual, yantra) so the generalized
//      product architecture is demonstrably real end-to-end, not just
//      types that compile.
//
// Idempotent: re-running skips any id that already exists in Firestore
// rather than overwriting admin edits, so this is safe to run again
// after an interrupted first run.
//
// Usage: node --env-file=.env.local scripts/dev/seed-products.ts
import { getAdminApp } from "../../src/lib/firebase-admin.ts";
import { getFirestore } from "firebase-admin/firestore";
import { GEMSTONE_PRODUCTS } from "../../src/lib/gemstones/gemstone-data.ts";
import type { Product, ProductVariant } from "../../src/lib/products/types.ts";
import type { GemstoneProduct } from "../../src/lib/gemstones/types.ts";

const COLLECTION = "products";

function fromLegacyGemstone(g: GemstoneProduct): Omit<Product, "createdAt" | "updatedAt"> {
  const variants: ProductVariant[] = g.rattiOptions.map((ratti) => {
    const entry = g.pricing[ratti];
    return {
      id: String(ratti),
      label: `${ratti} Ratti`,
      ratti,
      mrp: entry.mrp,
      salePrice: entry.salePrice,
      inStock: entry.inStock,
    };
  });
  return {
    id: g.id,
    slug: g.slug,
    name: g.name,
    category: "gemstone",
    status: "published",
    shortDescription: g.shortDescription,
    description: g.description,
    image: g.image,
    gallery: g.gallery,
    variants,
    defaultVariantId: String(g.defaultRatti),
    attributes: {
      alternateName: g.indianName,
      rulingPlanet: g.rulingPlanet,
      associatedDay: g.associatedDay,
      associatedMetal: g.associatedMetal,
      wearingFinger: g.wearingFinger,
      wearingMethod: g.wearingMethod,
      astrologicalSignificance: g.astrologicalSignificance,
      benefits: g.benefits,
      careInstructions: g.careInstructions,
    },
    certificationInfo: g.certificationInfo,
    deliveryEstimate: g.deliveryEstimate,
    faqs: g.faqs,
    seo: g.seo,
  };
}

// ---------------------------------------------------------------------
// New gemstones — selected for real market demand + a Navaratna-adjacent
// astrological role not already covered by the original 8, per the
// "use explicit selection criteria" requirement (not every stone on a
// competitor site, only ones with a genuine, well-established
// astrological use-case and real retail demand in India):
//   Moonstone, Opal, Amethyst, White Topaz, Turquoise, Green Tourmaline,
//   Sulemani Hakik, Iolite, Citrine, Tiger's Eye, White Coral, Rose
//   Quartz, Lapis Lazuli.
// ---------------------------------------------------------------------
type NewGemstoneSeed = Omit<Product, "id" | "createdAt" | "updatedAt">;

function gemstoneVariants(
  rows: Record<number, { mrp: number; salePrice: number }>,
): { variants: ProductVariant[]; defaultVariantId: string } {
  const rattis = Object.keys(rows).map(Number).sort((a, b) => a - b);
  const variants = rattis.map((ratti) => ({
    id: String(ratti),
    label: `${ratti} Ratti`,
    ratti,
    mrp: rows[ratti].mrp,
    salePrice: rows[ratti].salePrice,
  }));
  const mid = rattis[Math.floor((rattis.length - 1) / 2)];
  return { variants, defaultVariantId: String(mid) };
}

function gallery(name: string) {
  return [
    { role: "main" as const, label: `${name} — main product view` },
    { role: "angle" as const, label: `${name} — alternate angle` },
    { role: "closeup" as const, label: `${name} — close-up detail` },
    { role: "detail" as const, label: `${name} — certificate / product detail` },
    { role: "lifestyle" as const, label: `${name} — worn / lifestyle setting` },
  ];
}

const NEW_GEMSTONES: NewGemstoneSeed[] = [
  {
    slug: "moonstone",
    name: "Moonstone",
    category: "gemstone",
    status: "published",
    shortDescription: "A calming Moon substitute — traditionally worn for emotional balance and intuition.",
    description:
      "Moonstone is traditionally used as an accessible substitute for Pearl in Vedic astrology when strengthening the Moon is called for — its soft sheen (adularescence) has long been associated with calm, reflective energy. It is popular with those seeking Pearl's emotional-balance qualities at a lower price point.",
    image: { alt: "Moonstone gemstone — placeholder" },
    gallery: gallery("Moonstone"),
    ...gemstoneVariants({
      3: { mrp: 2800, salePrice: 2100 },
      4: { mrp: 3600, salePrice: 2700 },
      5: { mrp: 4500, salePrice: 3400 },
      6: { mrp: 5400, salePrice: 4100 },
    }),
    attributes: {
      alternateName: "Chandrakant Mani",
      rulingPlanet: "Moon",
      associatedDay: "Monday",
      associatedMetal: "Silver",
      wearingFinger: "Little finger",
      wearingMethod: "Worn as a ring or pendant, ideally after purification, on a Monday during the Hora of the Moon.",
      astrologicalSignificance:
        "Traditionally recommended as a gentler, more affordable substitute for Pearl when the Moon in the birth chart benefits from strengthening, particularly for emotional steadiness and intuition.",
      benefits: [
        "Traditionally associated with emotional balance and calm",
        "Traditionally worn to support intuition and inner reflection",
        "Traditionally believed to ease restlessness linked to a weak Moon",
      ],
      careInstructions: [
        "Avoid harsh chemicals and perfumes",
        "Remove before bathing or swimming",
        "Clean with a soft, dry cloth",
      ],
    },
    faqs: [
      {
        question: "Is Moonstone a substitute for Pearl?",
        answer:
          "Yes — it's traditionally worn as a more accessible alternative when an astrologer recommends strengthening the Moon, though Pearl remains the primary classical choice.",
      },
    ],
    seo: {
      title: "Moonstone | TRUELOGER",
      description: "Shop Moonstone, a traditional Moon gemstone, with transparent per-Ratti pricing.",
    },
  },
  {
    slug: "opal",
    name: "Opal",
    category: "gemstone",
    status: "published",
    shortDescription: "A Venus gemstone — traditionally worn for charm, creativity and relationship harmony.",
    description:
      "Opal is associated with Venus (Shukra) in Vedic astrology, the planet of love, beauty and artistic expression. Known for its distinctive play-of-colour, it is traditionally recommended for those seeking to strengthen Venus for relationship harmony, creativity or aesthetic pursuits.",
    image: { alt: "Opal gemstone — placeholder" },
    gallery: gallery("Opal"),
    ...gemstoneVariants({
      3: { mrp: 6200, salePrice: 4700 },
      4: { mrp: 8100, salePrice: 6300 },
      5: { mrp: 10400, salePrice: 8100 },
      6: { mrp: 12900, salePrice: 9600 },
    }),
    attributes: {
      alternateName: "Opal",
      rulingPlanet: "Venus",
      associatedDay: "Friday",
      associatedMetal: "Silver",
      wearingFinger: "Ring finger",
      wearingMethod: "Worn as a ring or pendant, ideally after purification, on a Friday during the Hora of Venus.",
      astrologicalSignificance:
        "Traditionally recommended when Venus is weak or afflicted in the birth chart, for those in creative, artistic, or relationship-focused pursuits.",
      benefits: [
        "Traditionally associated with charm and relationship harmony",
        "Traditionally worn to support artistic and creative expression",
        "Traditionally believed to strengthen the influence of Venus",
      ],
      careInstructions: [
        "Opal is a softer, more porous stone — avoid water and chemical exposure",
        "Remove before bathing, swimming or vigorous activity",
        "Store in a soft pouch away from heat and dry air",
      ],
    },
    faqs: [
      {
        question: "Who should wear Opal?",
        answer:
          "Opal is traditionally recommended for those whose chart shows Venus in a position that could benefit from strengthening — best confirmed with an astrologer through our /consult service.",
      },
    ],
    seo: {
      title: "Opal | TRUELOGER",
      description: "Explore Opal, the traditional Venus gemstone, with transparent per-Ratti pricing.",
    },
  },
  {
    slug: "amethyst",
    name: "Amethyst",
    category: "gemstone",
    status: "published",
    shortDescription: "A Saturn substitute — traditionally worn for calm focus and stress relief.",
    description:
      "Amethyst, known as Jamunia, is a purple quartz traditionally used as a milder substitute for Blue Sapphire when Saturn's influence needs gentle strengthening, without Blue Sapphire's reputation for fast, unpredictable effects. It's also popular simply for its calming, meditative associations.",
    image: { alt: "Amethyst gemstone — placeholder" },
    gallery: gallery("Amethyst"),
    ...gemstoneVariants({
      4: { mrp: 3200, salePrice: 2400 },
      5: { mrp: 4000, salePrice: 3100 },
      6: { mrp: 4900, salePrice: 3800 },
      7: { mrp: 5800, salePrice: 4500 },
    }),
    attributes: {
      alternateName: "Jamunia",
      rulingPlanet: "Saturn",
      associatedDay: "Saturday",
      associatedMetal: "Silver",
      wearingFinger: "Middle finger",
      wearingMethod: "Worn as a ring or pendant, ideally after purification, on a Saturday during the Hora of Saturn.",
      astrologicalSignificance:
        "Traditionally recommended as a gentler alternative to Blue Sapphire for those wanting to explore Saturn's influence without its fast-acting reputation.",
      benefits: [
        "Traditionally associated with calm focus and reduced stress",
        "Traditionally worn to support meditation and mental discipline",
        "Traditionally believed to ease mild Saturn-related restlessness",
      ],
      careInstructions: [
        "Avoid prolonged sun exposure, which can fade its colour",
        "Remove before bathing or swimming",
        "Clean with a soft, dry cloth",
      ],
    },
    faqs: [
      {
        question: "Is Amethyst a substitute for Blue Sapphire?",
        answer:
          "It's traditionally used as a gentler alternative for those wanting to explore Saturn's qualities without committing to Blue Sapphire's stronger, faster reputation.",
      },
    ],
    seo: {
      title: "Amethyst — Jamunia | TRUELOGER",
      description: "Shop Amethyst (Jamunia) with transparent per-Ratti pricing and traditional Saturn associations.",
    },
  },
  {
    slug: "white-topaz",
    name: "White Topaz",
    category: "gemstone",
    status: "published",
    shortDescription: "A Venus substitute — traditionally worn for clarity, charm and relationship harmony.",
    description:
      "White Topaz is traditionally worn as a more affordable substitute for Diamond or White Sapphire when strengthening Venus is recommended, valued for its brilliance and clarity.",
    image: { alt: "White Topaz gemstone — placeholder" },
    gallery: gallery("White Topaz"),
    ...gemstoneVariants({
      3: { mrp: 3800, salePrice: 2900 },
      4: { mrp: 4900, salePrice: 3700 },
      5: { mrp: 6100, salePrice: 4600 },
    }),
    attributes: {
      rulingPlanet: "Venus",
      associatedDay: "Friday",
      associatedMetal: "Silver",
      wearingFinger: "Ring finger",
      wearingMethod: "Worn as a ring or pendant, ideally after purification, on a Friday during the Hora of Venus.",
      astrologicalSignificance:
        "Traditionally recommended as an accessible substitute for Diamond/White Sapphire when Venus needs strengthening.",
      benefits: [
        "Traditionally associated with clarity of thought and charm",
        "Traditionally worn to support relationship harmony",
        "Traditionally believed to strengthen the influence of Venus",
      ],
      careInstructions: ["Avoid harsh chemicals", "Remove before bathing or swimming", "Clean with a soft, dry cloth"],
    },
    faqs: [
      {
        question: "Who should wear White Topaz?",
        answer:
          "Those whose chart shows Venus in a position that could benefit from strengthening — best confirmed with a chart review through /consult.",
      },
    ],
    seo: {
      title: "White Topaz | TRUELOGER",
      description: "Explore White Topaz, a traditional Venus gemstone, with transparent per-Ratti pricing.",
    },
  },
  {
    slug: "turquoise",
    name: "Turquoise",
    category: "gemstone",
    status: "published",
    shortDescription: "Firoza — traditionally worn for protection, communication and Jupiter's blessings.",
    description:
      "Turquoise, known as Firoza, is a traditional protective stone in South Asian and Persian astrology, often linked to both Jupiter and, in some traditions, Mercury for its association with safe travel, honest communication and general good fortune.",
    image: { alt: "Turquoise gemstone — placeholder" },
    gallery: gallery("Turquoise"),
    ...gemstoneVariants({
      3: { mrp: 3400, salePrice: 2600 },
      4: { mrp: 4300, salePrice: 3300 },
      5: { mrp: 5300, salePrice: 4100 },
    }),
    attributes: {
      alternateName: "Firoza",
      rulingPlanet: "Jupiter",
      associatedDay: "Thursday",
      associatedMetal: "Silver",
      wearingFinger: "Index finger",
      wearingMethod: "Worn as a ring or pendant, ideally after purification, on a Thursday during the Hora of Jupiter.",
      astrologicalSignificance:
        "Traditionally regarded as a protective stone associated with safe travel, honest communication and Jupiter's general good fortune.",
      benefits: [
        "Traditionally associated with protection during travel",
        "Traditionally worn to support honest, clear communication",
        "Traditionally believed to invite general good fortune",
      ],
      careInstructions: [
        "Turquoise is porous — avoid oils, perfumes and water exposure",
        "Remove before bathing, swimming or exercise",
        "Store separately in a soft pouch",
      ],
    },
    faqs: [
      {
        question: "Who should wear Turquoise?",
        answer:
          "Traditionally worn for general protection and Jupiter's blessings — an astrologer can confirm chart-specific suitability through /consult.",
      },
    ],
    seo: {
      title: "Turquoise — Firoza | TRUELOGER",
      description: "Shop Turquoise (Firoza) with transparent per-Ratti pricing and traditional protective associations.",
    },
  },
  {
    slug: "green-tourmaline",
    name: "Green Tourmaline",
    category: "gemstone",
    status: "published",
    shortDescription: "A Mercury/Budh substitute — traditionally worn for growth, balance and vitality.",
    description:
      "Green Tourmaline is prized for its vivid colour and is traditionally associated with growth, balance and heart-centred vitality, sometimes recommended alongside or as a substitute for Emerald.",
    image: { alt: "Green Tourmaline gemstone — placeholder" },
    gallery: gallery("Green Tourmaline"),
    ...gemstoneVariants({
      3: { mrp: 5200, salePrice: 4000 },
      4: { mrp: 6800, salePrice: 5300 },
      5: { mrp: 8600, salePrice: 6700 },
    }),
    attributes: {
      rulingPlanet: "Mercury",
      associatedDay: "Wednesday",
      associatedMetal: "Gold or silver",
      wearingFinger: "Little finger",
      wearingMethod: "Worn as a ring or pendant, ideally after purification, on a Wednesday during the Hora of Mercury.",
      astrologicalSignificance:
        "Traditionally worn as a substitute for Emerald when strengthening Mercury for communication and balance is recommended.",
      benefits: [
        "Traditionally associated with balance and personal growth",
        "Traditionally worn to support vitality and communication",
        "Traditionally believed to strengthen the influence of Mercury",
      ],
      careInstructions: ["Avoid sudden temperature changes", "Remove before bathing or swimming", "Clean with a soft, dry cloth"],
    },
    faqs: [
      {
        question: "Is Green Tourmaline a substitute for Emerald?",
        answer:
          "It's sometimes used as an alternative when strengthening Mercury is recommended, though Emerald remains the primary classical choice.",
      },
    ],
    seo: {
      title: "Green Tourmaline | TRUELOGER",
      description: "Explore Green Tourmaline with transparent per-Ratti pricing and traditional Mercury associations.",
    },
  },
  {
    slug: "sulemani-hakik",
    name: "Sulemani Hakik",
    category: "gemstone",
    status: "published",
    shortDescription: "A protective black-and-white agate — traditionally worn to ward off negative energy.",
    description:
      "Sulemani Hakik is a banded black-and-white agate widely worn in South Asia as a protective stone, traditionally believed to shield the wearer from negative energy, the evil eye, and ill fortune. It's one of the most accessible protective stones in the traditional catalogue.",
    image: { alt: "Sulemani Hakik gemstone — placeholder" },
    gallery: gallery("Sulemani Hakik"),
    ...gemstoneVariants({
      4: { mrp: 1400, salePrice: 999 },
      6: { mrp: 1900, salePrice: 1399 },
      8: { mrp: 2600, salePrice: 1899 },
    }),
    attributes: {
      alternateName: "Sulemani Hakik",
      rulingPlanet: "Saturn",
      associatedDay: "Saturday",
      wearingMethod: "Commonly worn as a bracelet or pendant, or kept as a protective charm.",
      astrologicalSignificance:
        "Traditionally worn as a general protective stone, not tied to strengthening a single planet the way Navaratna stones are — believed to guard against negative energy and the evil eye.",
      benefits: [
        "Traditionally believed to protect against negative energy and the evil eye",
        "Traditionally worn for general grounding and stability",
        "Traditionally considered an accessible protective stone for daily wear",
      ],
      careInstructions: ["Clean with a soft, dry cloth", "Avoid harsh chemicals"],
    },
    faqs: [
      {
        question: "What is Sulemani Hakik used for?",
        answer:
          "It's traditionally worn as a general protective stone against negative energy and the evil eye, rather than for strengthening a specific planet.",
      },
    ],
    seo: {
      title: "Sulemani Hakik | TRUELOGER",
      description: "Shop Sulemani Hakik, a traditional protective agate, with transparent pricing.",
    },
  },
  {
    slug: "iolite",
    name: "Iolite",
    category: "gemstone",
    status: "published",
    shortDescription: "Neeli — an affordable Blue Sapphire-family stone for Saturn.",
    description:
      "Iolite, known as Neeli, is a violet-blue stone from the same traditional astrological family as Blue Sapphire, offered as an accessible option for those wanting to explore Saturn's influence at a lower price point.",
    image: { alt: "Iolite gemstone — placeholder" },
    gallery: gallery("Iolite"),
    ...gemstoneVariants({
      3: { mrp: 2600, salePrice: 1999 },
      4: { mrp: 3400, salePrice: 2600 },
      5: { mrp: 4200, salePrice: 3200 },
    }),
    attributes: {
      alternateName: "Neeli",
      rulingPlanet: "Saturn",
      associatedDay: "Saturday",
      associatedMetal: "Silver",
      wearingFinger: "Middle finger",
      wearingMethod: "Worn as a ring or pendant, ideally after purification, on a Saturday during the Hora of Saturn.",
      astrologicalSignificance:
        "Traditionally worn as an accessible option within the Blue Sapphire family for exploring Saturn's influence.",
      benefits: [
        "Traditionally associated with focus and discipline",
        "Traditionally worn to support structured, long-term effort",
      ],
      careInstructions: ["Avoid harsh chemicals", "Remove before bathing or swimming", "Clean with a soft, dry cloth"],
    },
    faqs: [
      {
        question: "Is Iolite the same as Blue Sapphire?",
        answer:
          "No — it's a distinct, more affordable stone from the same traditional astrological family, offered for those exploring Saturn's influence at a lower price point.",
      },
    ],
    seo: {
      title: "Iolite — Neeli | TRUELOGER",
      description: "Shop Iolite (Neeli) with transparent per-Ratti pricing and traditional Saturn associations.",
    },
  },
  {
    slug: "citrine",
    name: "Citrine",
    category: "gemstone",
    status: "published",
    shortDescription: "Sunela — a Jupiter substitute traditionally worn for prosperity and wisdom.",
    description:
      "Citrine, known as Sunela, is a golden-yellow quartz traditionally worn as a substitute for Yellow Sapphire when strengthening Jupiter is recommended, valued for its warm colour and accessibility.",
    image: { alt: "Citrine gemstone — placeholder" },
    gallery: gallery("Citrine"),
    ...gemstoneVariants({
      4: { mrp: 2900, salePrice: 2200 },
      5: { mrp: 3700, salePrice: 2800 },
      6: { mrp: 4500, salePrice: 3400 },
    }),
    attributes: {
      alternateName: "Sunela",
      rulingPlanet: "Jupiter",
      associatedDay: "Thursday",
      associatedMetal: "Gold",
      wearingFinger: "Index finger",
      wearingMethod: "Worn as a ring or pendant, ideally after purification, on a Thursday during the Hora of Jupiter.",
      astrologicalSignificance:
        "Traditionally worn as a substitute for Yellow Sapphire when strengthening Jupiter for wisdom and prosperity is recommended.",
      benefits: [
        "Traditionally associated with prosperity and sound judgement",
        "Traditionally worn to support optimism and clarity",
      ],
      careInstructions: ["Avoid harsh chemicals", "Remove before bathing or swimming", "Clean with a soft, dry cloth"],
    },
    faqs: [
      {
        question: "Is Citrine a substitute for Yellow Sapphire?",
        answer:
          "Yes — it's a traditional, more accessible substitute for those wanting to explore Jupiter's influence without Yellow Sapphire's higher price.",
      },
    ],
    seo: {
      title: "Citrine — Sunela | TRUELOGER",
      description: "Explore Citrine (Sunela) with transparent per-Ratti pricing and traditional Jupiter associations.",
    },
  },
  {
    slug: "tigers-eye",
    name: "Tiger's Eye",
    category: "gemstone",
    status: "published",
    shortDescription: "A grounding stone traditionally worn for courage, focus and stability.",
    description:
      "Tiger's Eye, prized for its golden-brown chatoyant band, is traditionally worn as a grounding, protective stone associated with courage and mental focus — popular both for its astrological associations and its everyday wearability as a bracelet.",
    image: { alt: "Tiger's Eye gemstone — placeholder" },
    gallery: gallery("Tiger's Eye"),
    ...gemstoneVariants({
      4: { mrp: 1800, salePrice: 1350 },
      6: { mrp: 2400, salePrice: 1800 },
      8: { mrp: 3100, salePrice: 2350 },
    }),
    attributes: {
      rulingPlanet: "Sun",
      associatedDay: "Sunday",
      wearingMethod: "Commonly worn as a bracelet, ring or pendant.",
      astrologicalSignificance:
        "Traditionally worn as a grounding, protective stone linked to courage and personal willpower, often associated with the Sun.",
      benefits: [
        "Traditionally associated with courage and mental focus",
        "Traditionally worn for grounding and stability",
        "Traditionally believed to support confidence in decision-making",
      ],
      careInstructions: ["Clean with a soft, dry cloth", "Avoid harsh chemicals"],
    },
    faqs: [
      {
        question: "What is Tiger's Eye traditionally worn for?",
        answer: "Courage, focus and grounding — it's a popular everyday protective and confidence stone.",
      },
    ],
    seo: {
      title: "Tiger's Eye | TRUELOGER",
      description: "Shop Tiger's Eye, a traditional grounding gemstone, with transparent pricing.",
    },
  },
  {
    slug: "white-coral",
    name: "White Coral",
    category: "gemstone",
    status: "published",
    shortDescription: "Safed Moonga — a Rahu-calming stone in some traditional schools.",
    description:
      "White Coral, or Safed Moonga, is traditionally worn in some schools of Vedic astrology to ease Rahu-related disturbances, often as a gentler alternative when Hessonite isn't preferred.",
    image: { alt: "White Coral gemstone — placeholder" },
    gallery: gallery("White Coral"),
    ...gemstoneVariants({
      3: { mrp: 2200, salePrice: 1700 },
      4: { mrp: 2900, salePrice: 2200 },
      5: { mrp: 3600, salePrice: 2800 },
    }),
    attributes: {
      alternateName: "Safed Moonga",
      rulingPlanet: "Rahu",
      associatedDay: "Saturday",
      wearingFinger: "Middle finger",
      wearingMethod: "Worn as a ring or pendant, ideally after purification.",
      astrologicalSignificance:
        "Traditionally worn in some schools as a gentler alternative for easing Rahu-related disturbances.",
      benefits: [
        "Traditionally associated with calming Rahu-related restlessness",
        "Traditionally worn for protection against sudden setbacks",
      ],
      careInstructions: ["Remove before bathing or swimming", "Clean with a soft, dry cloth"],
    },
    faqs: [
      {
        question: "Is White Coral the same remedy as Hessonite?",
        answer:
          "No — they're traditionally used by different schools of thought for Rahu; an astrologer through /consult can advise which fits your chart.",
      },
    ],
    seo: {
      title: "White Coral — Safed Moonga | TRUELOGER",
      description: "Shop White Coral (Safed Moonga) with transparent per-Ratti pricing.",
    },
  },
  {
    slug: "rose-quartz",
    name: "Rose Quartz",
    category: "gemstone",
    status: "published",
    shortDescription: "A gentle Venus stone — traditionally worn for love, compassion and emotional healing.",
    description:
      "Rose Quartz is a soft pink stone widely associated with Venus and traditionally worn to encourage compassion, emotional healing and harmony in relationships — a gentle, accessible option in the Venus family.",
    image: { alt: "Rose Quartz gemstone — placeholder" },
    gallery: gallery("Rose Quartz"),
    ...gemstoneVariants({
      4: { mrp: 1500, salePrice: 1100 },
      6: { mrp: 2100, salePrice: 1550 },
      8: { mrp: 2700, salePrice: 2000 },
    }),
    attributes: {
      rulingPlanet: "Venus",
      associatedDay: "Friday",
      wearingMethod: "Commonly worn as a bracelet or pendant.",
      astrologicalSignificance:
        "Traditionally associated with Venus and worn to encourage compassion, emotional healing and relationship harmony.",
      benefits: [
        "Traditionally associated with love and emotional healing",
        "Traditionally worn to support compassion and self-acceptance",
      ],
      careInstructions: ["Avoid prolonged sun exposure", "Clean with a soft, dry cloth"],
    },
    faqs: [
      {
        question: "What is Rose Quartz traditionally worn for?",
        answer: "Love, compassion and emotional healing — a gentle, accessible stone in the Venus family.",
      },
    ],
    seo: {
      title: "Rose Quartz | TRUELOGER",
      description: "Shop Rose Quartz, a gentle Venus gemstone, with transparent pricing.",
    },
  },
];

// One example product per NEW category — proves the generalized
// architecture end-to-end (admin CRUD + order flow), while the
// dedicated storefront pages for these 4 categories remain deferred
// (the /mall hub already shows them as "Coming Soon" tiles).
const CATEGORY_SAMPLES: NewGemstoneSeed[] = [
  {
    slug: "rudraksha-5-mukhi-bracelet",
    name: "5 Mukhi Rudraksha Bracelet",
    category: "bracelet",
    status: "published",
    shortDescription: "A classic 5 Mukhi Rudraksha bead bracelet — traditionally worn for calm and focus.",
    description:
      "A hand-strung bracelet of 5 Mukhi (five-faced) Rudraksha beads, the most common and widely worn Rudraksha variety, traditionally associated with Lord Shiva and worn for calm, focus and general wellbeing.",
    image: { alt: "5 Mukhi Rudraksha bracelet — placeholder" },
    gallery: gallery("5 Mukhi Rudraksha Bracelet"),
    variants: [
      { id: "s", label: "Small (16cm)", mrp: 899, salePrice: 649 },
      { id: "m", label: "Medium (18cm)", mrp: 999, salePrice: 749 },
      { id: "l", label: "Large (20cm)", mrp: 1099, salePrice: 849 },
    ],
    defaultVariantId: "m",
    attributes: {
      associatedDeity: "Shiva",
      material: "5 Mukhi Rudraksha beads, elastic cord",
      astrologicalSignificance:
        "5 Mukhi Rudraksha is traditionally associated with Lord Shiva and Jupiter, worn for calm, focus and general wellbeing — the most commonly recommended Rudraksha for everyday wear.",
      benefits: [
        "Traditionally worn for calm and mental clarity",
        "Traditionally associated with general wellbeing and protection",
      ],
      careInstructions: ["Remove before bathing or swimming", "Avoid harsh chemicals and perfumes"],
    },
    faqs: [
      {
        question: "Who can wear a 5 Mukhi Rudraksha bracelet?",
        answer: "It's traditionally considered safe and beneficial for most wearers, regardless of chart specifics.",
      },
    ],
    seo: {
      title: "5 Mukhi Rudraksha Bracelet | TRUELOGER",
      description: "Shop a 5 Mukhi Rudraksha bead bracelet, traditionally worn for calm and focus.",
    },
  },
  {
    slug: "5-mukhi-rudraksha-mala",
    name: "5 Mukhi Rudraksha Mala (108 Beads)",
    category: "rudraksha",
    status: "published",
    shortDescription: "A traditional 108-bead 5 Mukhi Rudraksha mala for japa and meditation.",
    description:
      "A full 108-bead mala of 5 Mukhi Rudraksha, strung for daily japa (mantra repetition) and meditation practice, in the count traditionally considered complete for a full round of recitation.",
    image: { alt: "5 Mukhi Rudraksha mala — placeholder" },
    gallery: gallery("5 Mukhi Rudraksha Mala"),
    variants: [
      { id: "standard", label: "Standard (6mm beads)", mrp: 1599, salePrice: 1199 },
      { id: "large", label: "Large (8mm beads)", mrp: 2199, salePrice: 1699 },
    ],
    defaultVariantId: "standard",
    attributes: {
      associatedDeity: "Shiva",
      material: "5 Mukhi Rudraksha beads, cotton thread",
      origin: "Nepal",
      astrologicalSignificance:
        "A 108-bead mala is the traditional count for a complete round of japa, used across Vedic and Buddhist meditation practice alike.",
      benefits: [
        "Traditionally used for daily mantra repetition (japa)",
        "Traditionally associated with focus during meditation",
      ],
      careInstructions: ["Handle with clean, dry hands", "Store in a soft pouch when not in use"],
    },
    faqs: [
      {
        question: "How is a Rudraksha mala traditionally used?",
        answer: "For counting mantra repetitions (japa) during meditation, one bead per repetition around the full mala.",
      },
    ],
    seo: {
      title: "5 Mukhi Rudraksha Mala | TRUELOGER",
      description: "Shop a traditional 108-bead 5 Mukhi Rudraksha mala for japa and meditation.",
    },
  },
  {
    slug: "kuber-yantra",
    name: "Kuber Yantra",
    category: "yantra",
    status: "published",
    shortDescription: "A traditional geometric diagram worn/placed for prosperity and financial stability.",
    description:
      "The Kuber Yantra is a traditional sacred geometric diagram associated with Kuber, the treasurer of the gods in Hindu tradition, and is commonly placed in homes or workplaces to invite prosperity and financial stability.",
    image: { alt: "Kuber Yantra — placeholder" },
    gallery: gallery("Kuber Yantra"),
    variants: [
      { id: "small", label: "Small (3x3 inch, copper)", mrp: 799, salePrice: 599 },
      { id: "large", label: "Large (6x6 inch, copper)", mrp: 1499, salePrice: 1099 },
    ],
    defaultVariantId: "small",
    attributes: {
      associatedDeity: "Kuber",
      material: "Copper",
      mantra: "Om Yakshaya Kuberaya Vaishravanaya Dhanadhanyadi Padaye Dhana Dhanya Samriddhim Me Dehi Dapaya Swaha",
      astrologicalSignificance:
        "Traditionally placed in the north direction of a home or workplace to invite prosperity, wealth and financial stability.",
      benefits: [
        "Traditionally associated with financial stability and prosperity",
        "Traditionally placed in homes or businesses for abundance",
      ],
      suitableFor: ["Home placement", "Workplace/business placement"],
    },
    faqs: [
      {
        question: "Where should the Kuber Yantra be placed?",
        answer: "Traditionally in the north direction of the home or workplace, kept clean and undisturbed.",
      },
    ],
    seo: {
      title: "Kuber Yantra | TRUELOGER",
      description: "Shop a traditional Kuber Yantra for prosperity and financial stability.",
    },
  },
  {
    slug: "panchmukhi-hanuman-locket",
    name: "Panchmukhi Hanuman Locket",
    category: "spiritual",
    status: "published",
    shortDescription: "A protective pendant depicting the five-faced form of Lord Hanuman.",
    description:
      "A pendant depicting Panchmukhi Hanuman, the five-faced form of Lord Hanuman, traditionally worn for protection, courage and removal of obstacles.",
    image: { alt: "Panchmukhi Hanuman locket — placeholder" },
    gallery: gallery("Panchmukhi Hanuman Locket"),
    variants: [
      { id: "silver", label: "Silver-plated", mrp: 899, salePrice: 649 },
      { id: "gold", label: "Gold-plated", mrp: 1299, salePrice: 949 },
    ],
    defaultVariantId: "silver",
    attributes: {
      associatedDeity: "Hanuman",
      material: "Metal alloy, silver/gold plating",
      mantra: "Om Hanumate Namah",
      astrologicalSignificance:
        "Traditionally worn for protection, courage and removal of obstacles, and to ease the effects of a challenging Mars or Saturn placement in some traditions.",
      benefits: [
        "Traditionally associated with protection and courage",
        "Traditionally worn to help remove obstacles",
      ],
      careInstructions: ["Avoid water exposure to preserve plating", "Clean with a soft, dry cloth"],
    },
    faqs: [
      {
        question: "Who is Panchmukhi Hanuman?",
        answer:
          "The five-faced form of Lord Hanuman, depicting five different faces representing protection in all directions, traditionally worn for courage and removal of obstacles.",
      },
    ],
    seo: {
      title: "Panchmukhi Hanuman Locket | TRUELOGER",
      description: "Shop a Panchmukhi Hanuman pendant, traditionally worn for protection and courage.",
    },
  },
];

async function main() {
  const db = getFirestore(getAdminApp());
  const collection = db.collection(COLLECTION);

  const migrated = GEMSTONE_PRODUCTS.map(fromLegacyGemstone);
  const toSeed = [...migrated, ...NEW_GEMSTONES.map((p) => ({ ...p, id: p.slug })), ...CATEGORY_SAMPLES.map((p) => ({ ...p, id: p.slug }))];

  let created = 0;
  let skipped = 0;
  for (const product of toSeed) {
    const ref = collection.doc(product.id);
    const existing = await ref.get();
    if (existing.exists) {
      skipped++;
      continue;
    }
    const now = Date.now();
    const full: Product = { ...product, createdAt: now, updatedAt: now } as Product;
    await ref.set(full);
    created++;
    console.log(`created: ${product.id}`);
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped} (already existed).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
