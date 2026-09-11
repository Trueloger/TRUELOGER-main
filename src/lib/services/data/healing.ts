// src/lib/services/data/healing.ts
// The 4 healing services — names/short descriptions kept identical to
// src/components/healing/healing-data.ts (the homepage's existing
// copy), per "use the exact existing service names/content from the
// homepage rather than creating alternate names." Pricing benchmarked
// against comparable Indian-market online healing sessions (roughly
// ₹800–2000/session for chakra/aura work, ₹1200–2500 for deeper
// relationship/abundance work) — a defensible starting point, fully
// admin-editable afterwards via src/lib/services/store.ts.
import type { ServiceBlueprint } from "../types";

const DISCLAIMER =
  "This is a spiritual, wellness-oriented practice rooted in traditional energy-healing concepts. It is not a substitute for medical, psychological, financial, or legal advice, and does not diagnose, treat, prevent, or cure any medical condition. It is intended for reflection, relaxation, and spiritual guidance.";

export const HEALING_BLUEPRINTS: ServiceBlueprint[] = [
  {
    category: "healing",
    slug: "chakra-healing",
    name: "Chakra Healing",
    shortDescription:
      "Balance and harmonize your seven chakras to restore natural energy flow and enhance well-being.",
    introduction:
      "A guided energy-healing session focused on your body's seven chakras — traditionally understood as the subtle centers that govern how life-energy (prana) moves through you.",
    whatItIs:
      "A one-on-one spiritual healing session where a TrueLoger healer works through each of the seven chakras — root, sacral, solar plexus, heart, throat, third eye, and crown — using traditional energy-balancing techniques, guided visualization, and intention-setting.",
    whoItsFor:
      "Anyone feeling emotionally blocked, low on energy, stuck in repetitive patterns, or simply seeking a grounded reset. Suitable for first-timers — no prior experience with energy work is needed.",
    whatItCovers: [
      "A brief consultation on what feels blocked or heavy right now",
      "Root-to-crown chakra assessment and energy balancing",
      "Guided breathing and visualization for each center",
      "Personalized reflection points to carry forward after the session",
    ],
    whatToExpect:
      "A calm, conversational session (in person or over video call, depending on availability) where you're guided through relaxation and awareness practices for each chakra. Most people describe feeling lighter, calmer, and more centered afterward — experiences vary from person to person.",
    duration: "45–60 minutes",
    faqs: [
      {
        question: "Do I need any prior experience?",
        answer: "No. Sessions are designed to be approachable for complete beginners as well as those familiar with energy work.",
      },
      {
        question: "Is this a medical treatment?",
        answer:
          "No. Chakra healing is a traditional spiritual practice, not a medical or psychological treatment, and it does not diagnose or cure any condition.",
      },
      {
        question: "How soon will I feel a difference?",
        answer: "Experiences are personal and vary — some feel lighter immediately, others notice shifts over the following days.",
      },
    ],
    disclaimer: DISCLAIMER,
    seedMrp: 1499,
    seedSalePrice: 999,
    seedDeliveryTime: "Scheduled within 24 hours of booking",
  },
  {
    category: "healing",
    slug: "aura-cleansing",
    name: "Aura Cleansing",
    shortDescription:
      "Purify your aura and clear negative energies to create a lighter, calmer and more positive you.",
    introduction:
      "A traditional energy-clearing session intended to release accumulated negative or stagnant energy from your aura, leaving you feeling lighter and calmer.",
    whatItIs:
      "A guided aura-cleansing ritual combining traditional cleansing techniques, breathwork, and intention-setting, performed by a TrueLoger healer to help clear energetic heaviness that can build up from stress, environments, or interactions.",
    whoItsFor:
      "Those feeling drained, foggy, unusually irritable, or simply wanting a periodic energetic reset — commonly sought after a difficult period, a big transition, or before an important life event.",
    whatItCovers: [
      "A short check-in on recent stress, environments, or events",
      "Guided aura cleansing using traditional techniques",
      "Grounding and protection practices to close the session",
      "Simple self-practice tips to maintain the effect",
    ],
    whatToExpect:
      "A gentle, calming session where you're guided to relax while the healer works through traditional cleansing practices. Many describe a sense of lightness and clarity afterward, though experiences vary.",
    duration: "45 minutes",
    faqs: [
      {
        question: "Will this remove 'negative energy' permanently?",
        answer:
          "Aura cleansing is a traditional practice intended to support a lighter, calmer state — it is not a guaranteed or permanent outcome, and results vary by person.",
      },
      {
        question: "Can I book this alongside Chakra Healing?",
        answer: "Yes — many people combine both for a more complete session; add each to your cart separately.",
      },
    ],
    disclaimer: DISCLAIMER,
    seedMrp: 1299,
    seedSalePrice: 899,
    seedDeliveryTime: "Scheduled within 24 hours of booking",
  },
  {
    category: "healing",
    slug: "relationship-healing",
    name: "Relationship Healing",
    shortDescription:
      "Heal emotional patterns, release past hurts and invite harmony, love and understanding into your relationships.",
    introduction:
      "A deeper healing session focused on emotional patterns that traditionally show up in relationships — past hurts, recurring conflict, or difficulty trusting again.",
    whatItIs:
      "A guided spiritual-healing session working with emotional and energetic patterns traditionally associated with relationship difficulty, combining reflective conversation, energy work, and intention-setting for harmony.",
    whoItsFor:
      "Anyone navigating relationship strain, recovering from a breakup, working on communication with a partner or family member, or wanting to release old relational patterns before starting fresh.",
    whatItCovers: [
      "A confidential conversation about the relationship pattern you'd like to work on",
      "Traditional energy-healing practices for emotional release",
      "Guidance on inviting harmony and understanding forward",
      "Optional traditional remedies genuinely relevant to your situation",
    ],
    whatToExpect:
      "A warm, private, judgment-free session. This is a spiritual and emotional-wellness practice, not couples therapy or a substitute for professional counseling where that is needed.",
    duration: "60 minutes",
    faqs: [
      {
        question: "Is this a replacement for couples counseling?",
        answer:
          "No. This is a traditional spiritual-healing practice focused on emotional and energetic patterns, not licensed therapy or counseling.",
      },
      {
        question: "Can this be done without my partner present?",
        answer: "Yes — most sessions are one-on-one and focus on your own emotional patterns and energy.",
      },
    ],
    disclaimer: DISCLAIMER,
    seedMrp: 1999,
    seedSalePrice: 1399,
    seedDeliveryTime: "Scheduled within 24 hours of booking",
  },
  {
    category: "healing",
    slug: "money-healing",
    name: "Money Healing",
    shortDescription:
      "Clear financial blocks and negative patterns to attract abundance, prosperity and lasting stability.",
    introduction:
      "A traditional abundance-focused healing session for those who feel financially 'stuck' — recurring debt patterns, difficulty saving, or a persistent sense of scarcity.",
    whatItIs:
      "A guided energy-healing session working with traditional concepts of abundance and prosperity, combined with reflective work on money mindset and intention-setting for financial stability.",
    whoItsFor:
      "Anyone feeling energetically or emotionally 'blocked' around money — not a substitute for financial planning, budgeting advice, or professional financial guidance.",
    whatItCovers: [
      "A conversation about your current relationship with money and recurring patterns",
      "Traditional energy-clearing practices around scarcity and blockage",
      "Abundance-oriented intention-setting and visualization",
      "Optional traditional remedies genuinely relevant to prosperity",
    ],
    whatToExpect:
      "A grounded, practical-feeling session — this is a spiritual and mindset-oriented practice, not financial or investment advice, and traditional astrological interpretation here is never a guarantee of financial outcome.",
    duration: "60 minutes",
    faqs: [
      {
        question: "Will this guarantee more income?",
        answer:
          "No traditional practice can guarantee a financial outcome. This session is intended to support a healthier mindset and traditional sense of energetic alignment around money.",
      },
      {
        question: "Is this financial advice?",
        answer: "No. For financial planning or investment decisions, please consult a licensed financial advisor.",
      },
    ],
    disclaimer: DISCLAIMER,
    seedMrp: 1999,
    seedSalePrice: 1399,
    seedDeliveryTime: "Scheduled within 24 hours of booking",
  },
];
