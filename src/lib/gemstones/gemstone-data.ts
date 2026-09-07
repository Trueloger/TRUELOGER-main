// src/lib/gemstones/gemstone-data.ts
// The authoritative content/data registry for the gemstone catalogue —
// mirrors src/lib/consultation/* the same way it mirrors pricing.ts: one
// hand-curated source of truth for the /gemstones grid, the
// /gemstones/[slug] product page, the cart, and server-side validation
// (src/app/api/gemstones/validate/route.ts). Every field here conforms
// to the shape in ./types.ts (DO NOT modify) and every price is read
// exclusively through ./pricing.ts's getGemstonePrice (DO NOT modify).
//
// Pricing notes: all figures are researched, India-market-plausible
// per-Ratti bands for a Navaratna storefront (see the task brief for the
// benchmark ranges used per stone). Every Ratti variant carries its own
// {mrp, salePrice} pair with a realistic 15–30% discount baked in — the
// discount percentage itself is never stored, only ever derived by
// pricing.ts. No product declares certificationInfo (no real
// certification data exists yet) or a per-product deliveryEstimate (all
// eight rely on the shared DEFAULT_DELIVERY_ESTIMATE).

import type { GemstoneProduct } from "./types";

export const GEMSTONE_PRODUCTS: GemstoneProduct[] = [
  // ---------------------------------------------------------------------
  // Ruby — Manik / Manikya (Sun)
  // ---------------------------------------------------------------------
  {
    id: "ruby",
    slug: "ruby",
    name: "Ruby",
    indianName: "Manik",
    category: "ruby",
    shortDescription: "The gemstone of the Sun — worn for leadership, vitality and confidence.",
    description:
      "Ruby, known as Manik or Manikya in Vedic astrology, is the gemstone of the Sun (Surya), the karaka of self, authority and vitality. It has been prized across Indian royal courts for centuries for its deep red colour and its association with strength and command. Astrologers commonly recommend it for individuals whose birth chart shows the Sun in a weak, afflicted, or beneficially placed position where its natural significations can be amplified.",
    image: { alt: "Ruby gemstone — placeholder" },
    gallery: [
      { role: "main", label: "Ruby — main product view" },
      { role: "angle", label: "Ruby — alternate angle" },
      { role: "closeup", label: "Ruby — close-up detail" },
      { role: "detail", label: "Ruby — certificate / product detail" },
      { role: "lifestyle", label: "Ruby — worn / lifestyle setting" },
    ],
    rattiOptions: [3, 4, 5, 6, 7],
    defaultRatti: 5,
    pricing: {
      3: { mrp: 16100, salePrice: 12900 },
      4: { mrp: 22200, salePrice: 16900 },
      5: { mrp: 25100, salePrice: 20600 },
      6: { mrp: 33300, salePrice: 24300 },
      7: { mrp: 35600, salePrice: 27800 },
    },
    rulingPlanet: "Sun",
    associatedDay: "Sunday",
    associatedMetal: "Gold",
    wearingFinger: "Ring finger",
    wearingMethod:
      "Worn as a ring or pendant, ideally after purification, on the day and time traditionally considered auspicious for the Sun.",
    careInstructions: [
      "Avoid contact with harsh chemicals, perfumes and cleaning agents",
      "Remove before swimming, bathing or strenuous physical activity",
      "Clean gently with a soft, dry cloth after wearing",
      "Store separately from other jewellery to prevent scratching",
    ],
    benefits: [
      "Traditionally associated with leadership qualities and personal authority",
      "Traditionally worn to support vitality, stamina and overall energy",
      "Traditionally associated with self-confidence and clarity of purpose",
      "Traditionally believed to strengthen the influence of the Sun in the birth chart",
      "Traditionally worn by those in positions of responsibility or public standing",
      "Traditionally associated with improved relationships with father figures and authority",
    ],
    astrologicalSignificance:
      "According to Vedic astrology, Ruby is the primary gemstone for the Sun, the significator of soul, ego and vitality. It is traditionally recommended when the Sun is weak, debilitated, or otherwise positioned in a way an astrologer identifies as benefiting from strengthening. As with any gemstone recommendation, its suitability depends on the individual's full birth chart.",
    faqs: [
      {
        question: "Who should wear a Ruby?",
        answer:
          "Ruby is traditionally recommended for individuals whose birth chart shows the Sun in a position that could benefit from strengthening. This varies from person to person, so it is best confirmed against your own chart rather than assumed from general rules.",
      },
      {
        question: "How do I choose the right Ratti weight?",
        answer:
          "Ratti weight is typically chosen based on the wearer's body weight, budget and the astrologer's specific recommendation for their chart. A moderate weight such as 5 Ratti is a common starting point, but there is no single weight that suits everyone.",
      },
      {
        question: "Can I wear this without consulting an astrologer?",
        answer:
          "You can, but gemstone recommendations are chart-specific — the Sun's placement, its dignity, and its relationship with other planets all matter. We'd recommend a consultation with an astrologer through our /consult service before wearing Ruby for astrological purposes.",
      },
      {
        question: "How should Ruby be worn for the best traditional results?",
        answer:
          "Ruby is traditionally set in gold and worn as a ring on the ring finger, or as a pendant close to the chest, typically after a purification ritual performed on a Sunday during the Hora of the Sun.",
      },
    ],
    seo: {
      title: "Ruby — Manik | TRUELOGER",
      description:
        "Explore Ruby (Manik), the traditional Sun gemstone, with transparent per-Ratti pricing and guidance on care, wearing method, and traditional benefits.",
    },
  },

  // ---------------------------------------------------------------------
  // Pearl — Moti (Moon)
  // ---------------------------------------------------------------------
  {
    id: "pearl",
    slug: "pearl",
    name: "Pearl",
    indianName: "Moti",
    category: "pearl",
    shortDescription: "The Moon's gemstone — traditionally worn for calm, clarity and emotional balance.",
    description:
      "Pearl, or Moti, is the gemstone associated with the Moon (Chandra) in Vedic astrology, the planet that governs the mind, emotions and inner peace. Softer and more affordable than most other Navaratna stones, it has long been recommended for those seeking steadiness of mood and mental clarity. Astrologers typically suggest it when the Moon's placement in the birth chart is considered weak or in need of support.",
    image: { alt: "Pearl gemstone — placeholder" },
    gallery: [
      { role: "main", label: "Pearl — main product view" },
      { role: "angle", label: "Pearl — alternate angle" },
      { role: "closeup", label: "Pearl — close-up detail" },
      { role: "detail", label: "Pearl — certificate / product detail" },
      { role: "lifestyle", label: "Pearl — worn / lifestyle setting" },
    ],
    rattiOptions: [2, 3, 4, 5],
    defaultRatti: 4,
    pricing: {
      2: { mrp: 3100, salePrice: 2400 },
      3: { mrp: 4350, salePrice: 3550 },
      4: { mrp: 6450, salePrice: 4650 },
      5: { mrp: 7200, salePrice: 5750 },
    },
    rulingPlanet: "Moon",
    associatedDay: "Monday",
    associatedMetal: "Silver",
    wearingFinger: "Little finger",
    wearingMethod:
      "Worn as a ring or pendant, ideally after purification, on the day and time traditionally considered auspicious for the Moon.",
    careInstructions: [
      "Keep away from perfumes, hairspray and household chemicals",
      "Remove before bathing, swimming or vigorous exercise, as Pearl is a soft, porous stone",
      "Wipe clean with a soft, slightly damp cloth and dry immediately",
      "Store flat and separately, away from harder gemstones that could scratch it",
    ],
    benefits: [
      "Traditionally associated with emotional calm and inner steadiness",
      "Traditionally worn for mental peace and improved sleep quality",
      "Traditionally associated with clarity of thought and reduced anxiety",
      "Traditionally believed to strengthen the influence of the Moon in the birth chart",
      "Traditionally worn to support harmony within family and close relationships",
      "Traditionally associated with intuition and emotional sensitivity",
    ],
    astrologicalSignificance:
      "According to Vedic astrology, Pearl is the gemstone of the Moon, the karaka of mind and emotion. It is traditionally recommended when the Moon is weak, waning, or afflicted in the birth chart and its calming qualities are considered beneficial. As always, suitability should be assessed against the individual's own chart.",
    faqs: [
      {
        question: "Who should wear a Pearl?",
        answer:
          "Pearl is traditionally recommended for those whose birth chart shows a Moon that could benefit from support — often linked to emotional restlessness or mind-related concerns. This is chart-specific and not a general rule for everyone.",
      },
      {
        question: "How do I choose the right Ratti weight?",
        answer:
          "Lower Ratti weights such as 2–3 are common starting points for Pearl given its affordability and softness, with heavier weights chosen based on an astrologer's specific recommendation.",
      },
      {
        question: "Can I wear this without consulting an astrologer?",
        answer:
          "Pearl is generally considered a gentle stone, but its astrological effect still depends on the Moon's placement in your chart. We'd recommend a consultation through our /consult service to confirm it's right for you.",
      },
      {
        question: "Why is Pearl priced lower than most other gemstones?",
        answer:
          "Pearl is naturally more abundant and easier to source at gem quality than stones like Ruby or Blue Sapphire, which keeps it among the more accessible options in the Navaratna family.",
      },
    ],
    seo: {
      title: "Pearl — Moti | TRUELOGER",
      description:
        "Shop Pearl (Moti), the traditional Moon gemstone, with clear per-Ratti pricing and guidance on care, wearing method, and traditional benefits.",
    },
  },

  // ---------------------------------------------------------------------
  // Red Coral — Moonga (Mars)
  // ---------------------------------------------------------------------
  {
    id: "red-coral",
    slug: "red-coral",
    name: "Red Coral",
    indianName: "Moonga",
    category: "coral",
    shortDescription: "Mars's gemstone — traditionally worn for courage, vitality and overcoming obstacles.",
    description:
      "Red Coral, known as Moonga, is the gemstone associated with Mars (Mangal) in Vedic astrology — the planet of energy, courage and action. Organic in origin and deep red in colour, it has traditionally been worn to support physical vigour and determination. Astrologers commonly recommend it for individuals whose birth chart shows Mars in a position considered weak or in need of strengthening, including for those addressing Mangal Dosha.",
    image: { alt: "Red Coral gemstone — placeholder" },
    gallery: [
      { role: "main", label: "Red Coral — main product view" },
      { role: "angle", label: "Red Coral — alternate angle" },
      { role: "closeup", label: "Red Coral — close-up detail" },
      { role: "detail", label: "Red Coral — certificate / product detail" },
      { role: "lifestyle", label: "Red Coral — worn / lifestyle setting" },
    ],
    rattiOptions: [2, 3, 4, 5, 6],
    defaultRatti: 4,
    pricing: {
      2: { mrp: 3400, salePrice: 2800 },
      3: { mrp: 5450, salePrice: 4100 },
      4: { mrp: 6750, salePrice: 5400 },
      5: { mrp: 9450, salePrice: 6600 },
      6: { mrp: 9950, salePrice: 7750 },
    },
    rulingPlanet: "Mars",
    associatedDay: "Tuesday",
    associatedMetal: "Copper or panchdhatu",
    wearingFinger: "Ring finger",
    wearingMethod:
      "Worn as a ring or pendant, ideally after purification, on the day and time traditionally considered auspicious for Mars.",
    careInstructions: [
      "Avoid exposure to acidic substances, perfumes and household chemicals",
      "Remove before swimming, bathing or intense physical activity",
      "Clean with a soft, dry cloth — avoid ultrasonic or steam cleaning",
      "Store away from harder gemstones to prevent surface scratches",
    ],
    benefits: [
      "Traditionally associated with courage, willpower and physical vitality",
      "Traditionally worn to support determination in overcoming obstacles",
      "Traditionally associated with confidence in taking decisive action",
      "Traditionally believed to strengthen the influence of Mars in the birth chart",
      "Traditionally worn by those addressing concerns linked to Mangal Dosha",
      "Traditionally associated with resilience during periods of conflict or challenge",
    ],
    astrologicalSignificance:
      "According to Vedic astrology, Red Coral is the gemstone of Mars, the karaka of energy, courage and action. It is traditionally recommended when Mars is weak, afflicted, or positioned in a way that an astrologer identifies as needing support. Its suitability, as with all gemstones, depends on the specific placements in the individual's birth chart.",
    faqs: [
      {
        question: "Who should wear a Red Coral?",
        answer:
          "Red Coral is traditionally recommended for individuals whose chart shows Mars in a weak or challenging position, including cases where Mangal Dosha is identified. This should be confirmed against your specific chart.",
      },
      {
        question: "How do I choose the right Ratti weight?",
        answer:
          "Ratti weight is generally chosen based on body weight, the astrologer's recommendation and budget — a mid-range weight like 4 Ratti is a common starting point for most wearers.",
      },
      {
        question: "Can I wear this without consulting an astrologer?",
        answer:
          "Mars-related recommendations, including for Mangal Dosha, are highly chart-specific. We'd recommend speaking with an astrologer through our /consult service before wearing Red Coral for astrological purposes.",
      },
      {
        question: "Is Red Coral a natural or treated stone?",
        answer:
          "Red Coral is an organic gemstone formed by marine coral polyps rather than a mineral crystal, which is part of why its care instructions differ from harder stones like Ruby or Sapphire.",
      },
    ],
    seo: {
      title: "Red Coral — Moonga | TRUELOGER",
      description:
        "Browse Red Coral (Moonga), the traditional Mars gemstone, with transparent per-Ratti pricing and guidance on care, wearing method, and traditional benefits.",
    },
  },

  // ---------------------------------------------------------------------
  // Emerald — Panna (Mercury)
  // ---------------------------------------------------------------------
  {
    id: "emerald",
    slug: "emerald",
    name: "Emerald",
    indianName: "Panna",
    category: "emerald",
    shortDescription: "Mercury's gemstone — traditionally worn for communication, intellect and business acumen.",
    description:
      "Emerald, called Panna in Sanskrit, is the gemstone associated with Mercury (Budh), the planet of intellect, communication and commerce in Vedic astrology. Its rich green colour has made it a favourite among those in fields requiring sharp analytical thinking and persuasive communication. It is traditionally recommended for individuals whose birth chart shows Mercury in a position considered weak or beneficially reinforceable.",
    image: { alt: "Emerald gemstone — placeholder" },
    gallery: [
      { role: "main", label: "Emerald — main product view" },
      { role: "angle", label: "Emerald — alternate angle" },
      { role: "closeup", label: "Emerald — close-up detail" },
      { role: "detail", label: "Emerald — certificate / product detail" },
      { role: "lifestyle", label: "Emerald — worn / lifestyle setting" },
    ],
    rattiOptions: [3, 4, 5, 6],
    defaultRatti: 4,
    pricing: {
      3: { mrp: 14300, salePrice: 11400 },
      4: { mrp: 17700, salePrice: 14900 },
      5: { mrp: 23900, salePrice: 18200 },
      6: { mrp: 29900, salePrice: 21500 },
    },
    rulingPlanet: "Mercury",
    associatedDay: "Wednesday",
    associatedMetal: "Gold or silver",
    wearingFinger: "Little finger",
    wearingMethod:
      "Worn as a ring or pendant, ideally after purification, on the day and time traditionally considered auspicious for Mercury.",
    careInstructions: [
      "Avoid sudden temperature changes and exposure to harsh chemicals",
      "Remove before swimming, bathing or activities involving impact, as Emerald can be brittle",
      "Clean gently with a soft, dry cloth — avoid ultrasonic cleaners",
      "Store separately in a soft pouch to prevent chipping or scratching",
    ],
    benefits: [
      "Traditionally associated with sharper communication and articulate expression",
      "Traditionally worn to support intellect, memory and analytical thinking",
      "Traditionally associated with business acumen and sound decision-making",
      "Traditionally believed to strengthen the influence of Mercury in the birth chart",
      "Traditionally worn by those in trade, writing, or communication-focused professions",
      "Traditionally associated with adaptability and quick problem-solving",
    ],
    astrologicalSignificance:
      "According to Vedic astrology, Emerald is the gemstone of Mercury, the karaka of intellect, speech and commerce. It is traditionally recommended when Mercury is weak, afflicted, or positioned such that its qualities benefit from reinforcement. As with all gemstone recommendations, this depends on the wearer's individual birth chart.",
    faqs: [
      {
        question: "Who should wear an Emerald?",
        answer:
          "Emerald is traditionally recommended for those whose chart shows Mercury in a position that could benefit from strengthening — often relevant to students, communicators, and those in business or trade. This varies by chart.",
      },
      {
        question: "How do I choose the right Ratti weight?",
        answer:
          "Ratti weight is usually selected based on the astrologer's recommendation, body weight and budget, with a moderate weight such as 4 Ratti being a common starting point.",
      },
      {
        question: "Can I wear this without consulting an astrologer?",
        answer:
          "Mercury's placement and its relationship to other planets vary widely between charts, so we'd recommend confirming suitability through our /consult service before wearing Emerald astrologically.",
      },
      {
        question: "Why should Emerald be handled more carefully than some other gemstones?",
        answer:
          "Emerald is naturally included with internal fractures more often than harder stones like Ruby or Sapphire, which is why it needs gentler handling and should avoid sudden knocks or temperature shocks.",
      },
    ],
    seo: {
      title: "Emerald — Panna | TRUELOGER",
      description:
        "Discover Emerald (Panna), the traditional Mercury gemstone, with transparent per-Ratti pricing and guidance on care, wearing method, and traditional benefits.",
    },
  },

  // ---------------------------------------------------------------------
  // Yellow Sapphire — Pukhraj (Jupiter)
  // ---------------------------------------------------------------------
  {
    id: "yellow-sapphire",
    slug: "yellow-sapphire",
    name: "Yellow Sapphire",
    indianName: "Pukhraj",
    category: "yellow-sapphire",
    shortDescription: "Jupiter's gemstone — traditionally worn for wisdom, prosperity and marital harmony.",
    description:
      "Yellow Sapphire, known as Pukhraj, is the gemstone associated with Jupiter (Guru), the planet of wisdom, wealth and good fortune in Vedic astrology. It is one of the most widely sought-after Navaratna stones, traditionally worn for its association with prosperity, higher learning and marital happiness. Astrologers typically recommend it when Jupiter's placement in the birth chart is considered weak or in a position to benefit from support.",
    image: { alt: "Yellow Sapphire gemstone — placeholder" },
    gallery: [
      { role: "main", label: "Yellow Sapphire — main product view" },
      { role: "angle", label: "Yellow Sapphire — alternate angle" },
      { role: "closeup", label: "Yellow Sapphire — close-up detail" },
      { role: "detail", label: "Yellow Sapphire — certificate / product detail" },
      { role: "lifestyle", label: "Yellow Sapphire — worn / lifestyle setting" },
    ],
    rattiOptions: [3, 4, 5, 6, 7],
    defaultRatti: 5,
    pricing: {
      3: { mrp: 15900, salePrice: 13500 },
      4: { mrp: 22600, salePrice: 17600 },
      5: { mrp: 26700, salePrice: 21600 },
      6: { mrp: 34300, salePrice: 25400 },
      7: { mrp: 36800, salePrice: 29100 },
    },
    rulingPlanet: "Jupiter",
    associatedDay: "Thursday",
    associatedMetal: "Gold",
    wearingFinger: "Index finger",
    wearingMethod:
      "Worn as a ring or pendant, ideally after purification, on the day and time traditionally considered auspicious for Jupiter.",
    careInstructions: [
      "Avoid contact with harsh chemicals, chlorine and perfumes",
      "Remove before swimming, bathing or strenuous physical activity",
      "Clean with a soft, dry cloth to maintain its natural lustre",
      "Store separately from other jewellery to avoid scratching",
    ],
    benefits: [
      "Traditionally associated with wisdom, sound judgement and higher learning",
      "Traditionally worn to support prosperity and financial growth",
      "Traditionally associated with marital harmony and relationship stability",
      "Traditionally believed to strengthen the influence of Jupiter in the birth chart",
      "Traditionally worn by those seeking guidance in career, education or spiritual pursuits",
      "Traditionally associated with optimism and a broader outlook on life",
    ],
    astrologicalSignificance:
      "According to Vedic astrology, Yellow Sapphire is the gemstone of Jupiter, the karaka of wisdom, wealth and marriage. It is traditionally recommended when Jupiter is weak, afflicted, or in a position where an astrologer identifies room for reinforcement. Its effectiveness, like every gemstone, depends on the individual's full birth chart.",
    faqs: [
      {
        question: "Who should wear a Yellow Sapphire?",
        answer:
          "Yellow Sapphire is traditionally recommended for those whose chart shows Jupiter in a weak or beneficial-to-strengthen position — often relevant to questions of marriage, education or prosperity. This is chart-specific.",
      },
      {
        question: "How do I choose the right Ratti weight?",
        answer:
          "Ratti weight is typically chosen based on body weight, budget and the astrologer's specific recommendation, with a mid-range weight such as 5 Ratti being a common starting point.",
      },
      {
        question: "Can I wear this without consulting an astrologer?",
        answer:
          "Jupiter's role varies significantly between charts, especially around marriage and finance, so we'd recommend a consultation through our /consult service before wearing Yellow Sapphire astrologically.",
      },
      {
        question: "Why is natural, untreated Yellow Sapphire priced higher?",
        answer:
          "Untreated Yellow Sapphire with good clarity and colour is comparatively rare, which is why natural stones command a higher price per Ratti than heat-treated or lower-clarity material.",
      },
    ],
    seo: {
      title: "Yellow Sapphire — Pukhraj | TRUELOGER",
      description:
        "Explore Yellow Sapphire (Pukhraj), the traditional Jupiter gemstone, with transparent per-Ratti pricing and guidance on care, wearing method, and traditional benefits.",
    },
  },

  // ---------------------------------------------------------------------
  // Blue Sapphire — Neelam (Saturn)
  // ---------------------------------------------------------------------
  {
    id: "blue-sapphire",
    slug: "blue-sapphire",
    name: "Blue Sapphire",
    indianName: "Neelam",
    category: "blue-sapphire",
    shortDescription: "Saturn's gemstone — traditionally worn for discipline, focus and career growth.",
    description:
      "Blue Sapphire, known as Neelam, is the gemstone associated with Saturn (Shani) in Vedic astrology — the planet of discipline, structure and long-term achievement. It is the most highly priced of the Navaratna stones and is well known in astrological tradition for acting quickly and powerfully, for better or worse, which is why it is traditionally trial-worn before committing to it. Astrologers generally recommend a short trial period and a careful chart review before Blue Sapphire is worn regularly.",
    image: { alt: "Blue Sapphire gemstone — placeholder" },
    gallery: [
      { role: "main", label: "Blue Sapphire — main product view" },
      { role: "angle", label: "Blue Sapphire — alternate angle" },
      { role: "closeup", label: "Blue Sapphire — close-up detail" },
      { role: "detail", label: "Blue Sapphire — certificate / product detail" },
      { role: "lifestyle", label: "Blue Sapphire — worn / lifestyle setting" },
    ],
    rattiOptions: [4, 5, 6, 7, 8],
    defaultRatti: 6,
    pricing: {
      4: { mrp: 29300, salePrice: 24000 },
      5: { mrp: 38200, salePrice: 29400 },
      6: { mrp: 41700, salePrice: 34600 },
      7: { mrp: 52000, salePrice: 39500 },
      8: { mrp: 55400, salePrice: 44300 },
    },
    rulingPlanet: "Saturn",
    associatedDay: "Saturday",
    associatedMetal: "Silver or panchdhatu",
    wearingFinger: "Middle finger",
    wearingMethod:
      "Worn as a ring or pendant, ideally after purification and a short trial period, on the day and time traditionally considered auspicious for Saturn.",
    careInstructions: [
      "Avoid contact with harsh chemicals, perfumes and abrasive cleaners",
      "Remove before swimming, bathing or strenuous physical activity",
      "Clean with a soft, dry cloth to preserve its natural shine",
      "Store separately from other jewellery to prevent scratching",
    ],
    benefits: [
      "Traditionally associated with discipline, focus and sustained effort",
      "Traditionally worn to support long-term career growth and professional stability",
      "Traditionally associated with patience and structured decision-making",
      "Traditionally believed to strengthen the influence of Saturn in the birth chart",
      "Traditionally worn by those navigating demanding professional Saturn periods (such as Sade Sati)",
      "Traditionally noted as a stone that should be trial-worn first, since Saturn's effects are considered unpredictable and chart-dependent",
    ],
    astrologicalSignificance:
      "According to Vedic astrology, Blue Sapphire is the gemstone of Saturn, the karaka of discipline, delay and long-term structure. It is traditionally regarded as the fastest-acting and most unpredictable of the Navaratna stones, which is why a trial period and a careful astrological review are strongly advised before committing to it.",
    faqs: [
      {
        question: "Who should wear a Blue Sapphire?",
        answer:
          "Blue Sapphire is traditionally recommended for individuals whose chart shows Saturn in a position considered favourable to strengthen — but because its effects are believed to be fast and pronounced, it is one of the stones astrologers most consistently recommend trialling first.",
      },
      {
        question: "How do I choose the right Ratti weight?",
        answer:
          "Ratti weight for Blue Sapphire is usually chosen conservatively, often starting on the lower end of the offered range, based on the astrologer's recommendation, body weight and budget.",
      },
      {
        question: "Can I wear this without consulting an astrologer?",
        answer:
          "We would strongly recommend against it. Blue Sapphire's traditional reputation for fast, pronounced effects makes a proper chart review especially important — please consider a consultation through our /consult service first.",
      },
      {
        question: "What does 'trial wearing' Blue Sapphire mean?",
        answer:
          "It traditionally means wearing the stone for a short period, such as a few days, to observe how it feels before committing to it long-term — a precaution rooted in Saturn's reputation for unpredictable effects.",
      },
    ],
    seo: {
      title: "Blue Sapphire — Neelam | TRUELOGER",
      description:
        "Browse Blue Sapphire (Neelam), the traditional Saturn gemstone, with transparent per-Ratti pricing and guidance on care, wearing method, and traditional benefits.",
    },
  },

  // ---------------------------------------------------------------------
  // Hessonite — Gomed (Rahu)
  // ---------------------------------------------------------------------
  {
    id: "hessonite",
    slug: "hessonite",
    name: "Hessonite",
    indianName: "Gomed",
    category: "hessonite",
    shortDescription: "Rahu's gemstone — traditionally worn to help ease Rahu-related doshas.",
    description:
      "Hessonite, called Gomed or Gomedh, is the gemstone associated with the shadow planet Rahu in Vedic astrology. A honey-brown garnet variety, it is traditionally worn to help balance Rahu's influence in the birth chart, particularly where Rahu is placed in a challenging house or forms doshas such as Kaal Sarp. Astrologers generally review the entire chart, not just Rahu's placement, before recommending it.",
    image: { alt: "Hessonite gemstone — placeholder" },
    gallery: [
      { role: "main", label: "Hessonite — main product view" },
      { role: "angle", label: "Hessonite — alternate angle" },
      { role: "closeup", label: "Hessonite — close-up detail" },
      { role: "detail", label: "Hessonite — certificate / product detail" },
      { role: "lifestyle", label: "Hessonite — worn / lifestyle setting" },
    ],
    rattiOptions: [3, 4, 5, 6],
    defaultRatti: 4,
    pricing: {
      3: { mrp: 4400, salePrice: 3300 },
      4: { mrp: 5300, salePrice: 4300 },
      5: { mrp: 6800, salePrice: 5300 },
      6: { mrp: 7400, salePrice: 6200 },
    },
    rulingPlanet: "Rahu",
    associatedDay: "Saturday",
    associatedMetal: "Panchdhatu or silver",
    wearingFinger: "Middle finger",
    wearingMethod:
      "Worn as a ring or pendant, ideally after purification, on the day and time traditionally considered auspicious for Rahu.",
    careInstructions: [
      "Avoid exposure to harsh chemicals, perfumes and household cleaners",
      "Remove before swimming, bathing or strenuous physical activity",
      "Clean with a soft, dry cloth after wearing",
      "Store separately from other jewellery to prevent scratching",
    ],
    benefits: [
      "Traditionally used to help ease Rahu-related doshas, including Kaal Sarp Dosha",
      "Traditionally associated with mental clarity during periods of confusion or restlessness",
      "Traditionally worn to support steadiness against sudden, unexplained setbacks",
      "Traditionally believed to balance the shadow influence of Rahu in the birth chart",
      "Traditionally associated with protection from illusion and misdirection",
      "Traditionally worn during challenging Rahu dasha or transit periods",
    ],
    astrologicalSignificance:
      "According to Vedic astrology, Hessonite is the gemstone of Rahu, a shadow planet associated with illusion, ambition and sudden change. It is traditionally recommended when Rahu is unfavourably placed or contributing to specific doshas identified in the birth chart. As Rahu's effects are considered complex, an individual chart review is especially advised.",
    faqs: [
      {
        question: "Who should wear a Hessonite?",
        answer:
          "Hessonite is traditionally recommended for individuals whose chart shows Rahu in a challenging placement, including those exploring remedies for Kaal Sarp Dosha. This should be confirmed against the individual's chart.",
      },
      {
        question: "How do I choose the right Ratti weight?",
        answer:
          "Ratti weight is generally chosen based on the astrologer's recommendation, body weight and budget, with a mid-range weight such as 4 Ratti being a common starting point.",
      },
      {
        question: "Can I wear this without consulting an astrologer?",
        answer:
          "Rahu's effects are considered particularly chart-dependent in Vedic astrology, so we'd recommend a consultation through our /consult service before wearing Hessonite for astrological purposes.",
      },
      {
        question: "Is Hessonite different from Garnet in general jewellery?",
        answer:
          "Hessonite is technically a variety of grossular garnet, but in Vedic astrology it is treated as its own distinct gemstone associated specifically with Rahu, separate from red garnet varieties used in general jewellery.",
      },
    ],
    seo: {
      title: "Hessonite — Gomed | TRUELOGER",
      description:
        "Shop Hessonite (Gomed), the traditional Rahu gemstone, with transparent per-Ratti pricing and guidance on care, wearing method, and traditional benefits.",
    },
  },

  // ---------------------------------------------------------------------
  // Cat's Eye — Lehsunia (Ketu)
  // ---------------------------------------------------------------------
  {
    id: "cats-eye",
    slug: "cats-eye",
    name: "Cat's Eye",
    indianName: "Lehsunia",
    category: "cats-eye",
    shortDescription: "Ketu's gemstone — traditionally worn for protection and Ketu-related balance.",
    description:
      "Cat's Eye, known as Lehsunia, is the gemstone associated with the shadow planet Ketu in Vedic astrology. Named for the sharp band of light — chatoyancy — that appears to move across its surface like a cat's eye, it is traditionally worn to help balance Ketu's often intense or detaching influence in the birth chart. Astrologers typically recommend it after a full chart review, given Ketu's complex and sometimes unpredictable significations.",
    image: { alt: "Cat's Eye gemstone — placeholder" },
    gallery: [
      { role: "main", label: "Cat's Eye — main product view" },
      { role: "angle", label: "Cat's Eye — alternate angle" },
      { role: "closeup", label: "Cat's Eye — close-up detail" },
      { role: "detail", label: "Cat's Eye — certificate / product detail" },
      { role: "lifestyle", label: "Cat's Eye — worn / lifestyle setting" },
    ],
    rattiOptions: [2, 3, 4, 5],
    defaultRatti: 3,
    pricing: {
      2: { mrp: 4550, salePrice: 3600 },
      3: { mrp: 7200, salePrice: 5250 },
      4: { mrp: 8350, salePrice: 6850 },
      5: { mrp: 11000, salePrice: 8350 },
    },
    rulingPlanet: "Ketu",
    associatedDay: "Tuesday",
    associatedMetal: "Panchdhatu or silver",
    wearingFinger: "Middle finger",
    wearingMethod:
      "Worn as a ring or pendant, ideally after purification, on the day and time traditionally considered auspicious for Ketu.",
    careInstructions: [
      "Avoid exposure to harsh chemicals, perfumes and household cleaners",
      "Remove before swimming, bathing or strenuous physical activity",
      "Clean with a soft, dry cloth to preserve its chatoyant band",
      "Store separately from other jewellery to prevent scratching",
    ],
    benefits: [
      "Traditionally used for Ketu-related doshas and protection",
      "Traditionally associated with sudden reversals of fortune being eased",
      "Traditionally worn to support intuition and spiritual grounding",
      "Traditionally believed to balance the detaching, unpredictable influence of Ketu",
      "Traditionally associated with protection from hidden dangers or sudden loss",
      "Traditionally worn during challenging Ketu dasha or transit periods",
    ],
    astrologicalSignificance:
      "According to Vedic astrology, Cat's Eye is the gemstone of Ketu, a shadow planet associated with detachment, intuition and sudden events. It is traditionally recommended when Ketu is unfavourably placed or linked to specific doshas identified in the birth chart. Given Ketu's complex nature, an individual chart review is especially recommended before wearing it.",
    faqs: [
      {
        question: "Who should wear a Cat's Eye?",
        answer:
          "Cat's Eye is traditionally recommended for individuals whose chart shows Ketu in a challenging or dosha-forming placement. As with Rahu, this is highly specific to the individual chart.",
      },
      {
        question: "How do I choose the right Ratti weight?",
        answer:
          "Ratti weight is generally chosen based on the astrologer's recommendation, body weight and budget, with a moderate weight such as 3 Ratti being a common starting point.",
      },
      {
        question: "Can I wear this without consulting an astrologer?",
        answer:
          "Ketu's placement and effects vary significantly across charts, so we'd recommend a consultation through our /consult service before wearing Cat's Eye for astrological purposes.",
      },
      {
        question: "What causes the 'eye' effect in Cat's Eye gemstones?",
        answer:
          "The band of light is caused by chatoyancy — parallel fibrous inclusions inside the stone that reflect light in a single sharp line as the stone is turned, which is also why cut quality matters more for this stone than for many others.",
      },
    ],
    seo: {
      title: "Cat's Eye — Lehsunia | TRUELOGER",
      description:
        "Explore Cat's Eye (Lehsunia), the traditional Ketu gemstone, with transparent per-Ratti pricing and guidance on care, wearing method, and traditional benefits.",
    },
  },
];

export function getGemstoneById(id: string): GemstoneProduct | undefined {
  return GEMSTONE_PRODUCTS.find((product) => product.id === id);
}

export function getAllGemstoneSlugs(): string[] {
  return GEMSTONE_PRODUCTS.map((product) => product.slug);
}
