// src/lib/services/data/puja.ts
// The 6 Puja services actually offered on the homepage (see
// src/components/puja/puja-data.ts — PUJA_SERVICES) — names/short
// descriptions kept identical to that authoritative source, per "use
// those exact six services as the initial catalogue." These get
// dedicated commerce-ready pages here; the homepage cards and navbar
// dropdown are updated to link into these slugs instead of the old
// /consult/puja-and-rituals/* placeholder routes. Pricing benchmarked
// against comparable Indian-market online Puja bookings (roughly
// ₹1,500–5,000 depending on ritual complexity and typical duration).
import type { ServiceBlueprint } from "../types";

const DISCLAIMER =
  "This is a traditional Vedic ritual performed by TrueLoger's associated priests according to customary practice. It is offered for spiritual, devotional, and wellness purposes and does not guarantee any specific spiritual, financial, relationship, or health outcome.";

export const PUJA_BLUEPRINTS: ServiceBlueprint[] = [
  {
    category: "puja",
    slug: "ganesh-puja",
    name: "Ganesh Puja",
    shortDescription:
      "Remove obstacles, invite new beginnings, and seek blessings for success, wisdom, and prosperity.",
    introduction:
      "A traditional worship of Lord Ganesha, invoked first in Vedic ritual as the remover of obstacles — commonly performed before starting something new.",
    whatItIs:
      "A Vedic Puja performed by a qualified priest with traditional mantras, offerings, and rituals dedicated to Lord Ganesha.",
    whoItsFor:
      "Anyone starting a new venture, home, business, or life chapter, or simply seeking blessings for clarity and smooth progress.",
    whatItCovers: [
      "Sankalpa (formal ritual intention) in your name and gotra where provided",
      "Traditional invocation and worship of Lord Ganesha",
      "Mantra chanting and offerings as per Vedic tradition",
      "Prasad and a recording/summary of the ritual where applicable",
    ],
    whatToExpect:
      "Performed by TrueLoger's associated priests at a designated temple/location on an auspicious date; you may attend in person or have it performed on your behalf (Sankalp puja) depending on the option chosen at booking.",
    duration: "60–90 minutes",
    faqs: [
      {
        question: "Do I need to be physically present?",
        answer:
          "No — many customers opt for the Puja to be performed on their behalf with their name and intention included; in-person attendance can be arranged where available.",
      },
      {
        question: "Will I receive proof the Puja was performed?",
        answer: "A summary and, where available, photos/video of the ritual are shared after completion.",
      },
    ],
    disclaimer: DISCLAIMER,
    seedMrp: 2499,
    seedSalePrice: 1799,
    seedDeliveryTime: "Scheduled within 2–3 days",
  },
  {
    category: "puja",
    slug: "lakshmi-puja",
    name: "Lakshmi Puja",
    shortDescription:
      "A sacred ritual for prosperity, abundance, financial wellbeing, and blessings of Goddess Lakshmi.",
    introduction:
      "A traditional worship of Goddess Lakshmi, associated with prosperity, abundance, and financial wellbeing in Vedic tradition.",
    whatItIs:
      "A Vedic Puja performed with traditional mantras and offerings dedicated to Goddess Lakshmi, commonly sought around new business ventures, home purchases, or festival occasions.",
    whoItsFor:
      "Anyone seeking traditional blessings for financial stability and abundance — not a substitute for financial planning or investment advice.",
    whatItCovers: [
      "Sankalpa in your name and intention",
      "Traditional invocation and worship of Goddess Lakshmi",
      "Mantra chanting and offerings as per Vedic tradition",
      "Prasad and ritual summary where applicable",
    ],
    whatToExpect:
      "Performed by TrueLoger's associated priests on an auspicious date; traditional astrological interpretation frames this as devotional support for abundance, never a guaranteed financial outcome.",
    duration: "60–90 minutes",
    faqs: [
      { question: "Will this guarantee financial gain?", answer: "No traditional ritual can guarantee a financial outcome; this is a devotional practice for traditional blessings of abundance." },
      { question: "Is there a best time to book this Puja?", answer: "Fridays and festival occasions like Diwali are traditionally considered auspicious, though it can be performed on other dates too." },
    ],
    disclaimer: DISCLAIMER,
    seedMrp: 2999,
    seedSalePrice: 2199,
    seedDeliveryTime: "Scheduled within 2–3 days",
  },
  {
    category: "puja",
    slug: "navgraha-puja",
    name: "Navgraha Puja",
    shortDescription:
      "Traditional Vedic rituals to harmonize planetary influences and support balance, peace, and progress.",
    introduction:
      "A traditional worship of the nine planetary deities (Navagrahas), performed to traditionally harmonize their influence on one's life.",
    whatItIs:
      "A comprehensive Vedic Puja invoking all nine Grahas — Surya, Chandra, Mangal, Budh, Guru, Shukra, Shani, Rahu, and Ketu — with dedicated mantras and offerings for each.",
    whoItsFor:
      "Those experiencing a difficult planetary period (as identified in a personal chart or consultation), or anyone seeking broad traditional balance and stability.",
    whatItCovers: [
      "Sankalpa in your name and birth details where provided",
      "Sequential worship of all nine Navagraha deities",
      "Mantra chanting and offerings specific to each planet",
      "Prasad and ritual summary where applicable",
    ],
    whatToExpect:
      "A longer, more elaborate ritual than a single-deity Puja, performed by TrueLoger's associated priests, traditionally recommended alongside (not instead of) a personal consultation for chart-specific guidance.",
    duration: "90–120 minutes",
    faqs: [
      { question: "Do I need my birth chart for this?", answer: "It's helpful but not required — providing birth details lets the Sankalpa be more personalized." },
      { question: "How is this different from a single-planet Puja like Shani Puja?", answer: "Navgraha Puja worships all nine planetary deities together, rather than focusing on just one." },
    ],
    disclaimer: DISCLAIMER,
    seedMrp: 3999,
    seedSalePrice: 2999,
    seedDeliveryTime: "Scheduled within 3–5 days",
  },
  {
    category: "puja",
    slug: "rudrabhishek-puja",
    name: "Rudrabhishek Puja",
    shortDescription:
      "A powerful Shiva ritual traditionally performed for purification, protection, inner peace, and spiritual strength.",
    introduction:
      "A traditional Abhishekam (ritual bathing) of the Shiva Lingam with sacred substances, accompanied by Rudra mantra chanting.",
    whatItIs:
      "A Vedic Puja in which the Shiva Lingam is ceremonially bathed with milk, honey, water, and other traditional offerings while Rudram/Chamakam mantras are chanted by qualified priests.",
    whoItsFor:
      "Those seeking traditional spiritual purification, protection, and inner strength, or observing occasions like Mahashivratri and Mondays (traditionally associated with Lord Shiva).",
    whatItCovers: [
      "Sankalpa in your name and intention",
      "Traditional Rudrabhishek ritual with sacred offerings",
      "Rudram/Chamakam mantra chanting",
      "Prasad and ritual summary where applicable",
    ],
    whatToExpect:
      "A deeply traditional, mantra-intensive ritual performed by TrueLoger's associated priests at a designated Shiva temple.",
    duration: "60–90 minutes",
    faqs: [
      { question: "Is this suitable for a specific problem I'm facing?", answer: "Rudrabhishek is traditionally sought broadly for protection and peace; for a chart-specific concern, a consultation alongside this Puja is recommended." },
      { question: "Is Monday required for booking?", answer: "Monday is traditionally considered auspicious for Shiva worship, but the ritual can be performed on other days as well." },
    ],
    disclaimer: DISCLAIMER,
    seedMrp: 3499,
    seedSalePrice: 2599,
    seedDeliveryTime: "Scheduled within 2–3 days",
  },
  {
    category: "puja",
    slug: "grah-shanti-puja",
    name: "Grah Shanti Puja",
    shortDescription:
      "Vedic rituals performed to promote harmony, stability, peace, and positive energy within the home.",
    introduction:
      "A traditional home-peace ritual intended to bring harmony and positive energy to your household.",
    whatItIs:
      "A Vedic Puja combining planetary pacification mantras with rituals traditionally aimed at reducing domestic discord and inviting stability.",
    whoItsFor:
      "Households experiencing frequent conflict, instability, or wanting traditional blessings before or after a major home event (moving in, renovation, a difficult period).",
    whatItCovers: [
      "Sankalpa in the family's name and intention",
      "Traditional Grah Shanti rituals and mantra chanting",
      "Guidance on simple home practices to sustain harmony",
      "Prasad and ritual summary where applicable",
    ],
    whatToExpect:
      "Can be performed at your home (where available in your city) or on your behalf at a designated location — confirm option availability at booking.",
    duration: "60–90 minutes",
    faqs: [
      { question: "Can this be performed at my home?", answer: "Where available in your city; otherwise it is performed on your behalf with your name and intention included." },
      { question: "Will this resolve family conflict?", answer: "This is a devotional practice for traditional harmony and peace, not a substitute for family counseling where that may be needed." },
    ],
    disclaimer: DISCLAIMER,
    seedMrp: 3999,
    seedSalePrice: 2999,
    seedDeliveryTime: "Scheduled within 3–5 days",
  },
  {
    category: "puja",
    slug: "maha-mrityunjaya-puja",
    name: "Maha Mrityunjaya Puja",
    shortDescription:
      "A sacred Vedic prayer ritual traditionally performed for protection, strength, peace, and spiritual wellbeing.",
    introduction:
      "A traditional recitation of the Maha Mrityunjaya Mantra — one of the most revered mantras in Vedic tradition, associated with protection and resilience.",
    whatItIs:
      "A Vedic Puja centered on repeated chanting (jaap) of the Maha Mrityunjaya Mantra by qualified priests, along with traditional offerings to Lord Shiva.",
    whoItsFor:
      "Those going through a challenging period and seeking traditional spiritual support, protection, and strength — never framed as a medical treatment.",
    whatItCovers: [
      "Sankalpa in your name and intention",
      "Traditional Maha Mrityunjaya mantra chanting (a set number of repetitions)",
      "Offerings to Lord Shiva as per Vedic tradition",
      "Prasad and ritual summary where applicable",
    ],
    whatToExpect:
      "A solemn, mantra-focused ritual performed by TrueLoger's associated priests — this is a spiritual practice for traditional protection and wellbeing, not a medical intervention of any kind.",
    duration: "60–90 minutes",
    faqs: [
      { question: "Is this a substitute for medical treatment?", answer: "No. This is a traditional spiritual practice and does not diagnose, treat, prevent, or cure any medical condition." },
      { question: "How many mantra repetitions are included?", answer: "A traditional count is performed by the priest as part of the standard ritual; details are shared in the ritual summary." },
    ],
    disclaimer: DISCLAIMER,
    seedMrp: 4999,
    seedSalePrice: 3799,
    seedDeliveryTime: "Scheduled within 3–5 days",
  },
];
