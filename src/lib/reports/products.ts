// src/lib/reports/products.ts
// Developer-controlled catalogue for the 7 paid report products —
// name/description/blueprint metadata/page targets/seed pricing. NEVER
// editable via Admin (see AGENTS §73/§117); Admin only edits the live
// Firestore pricing doc these seed values initialize (src/lib/reports/store.ts).
//
// Pricing researched against current Indian-market benchmarks
// (AstroSage Marriage/Career/Finance ~₹1,560 sale / ₹2,600 MRP for a
// shorter report; AstroSage's 250+ page Brihat Kundli ~₹996 sale /
// ₹2,100 MRP; AstroTalk's narrower problem-specific reports ₹999–1,299)
// — TrueLoger's reports are a genuinely longer, AI-personalized 30-60
// page document, positioned above the narrow AstroTalk products and
// broadly in line with AstroSage's specialized reports, with Kundli/Life
// (the two broadest, highest page-count reports) priced highest.
import type { ReportProductBlueprint, ReportType } from "./types";

export const REPORT_PRODUCTS: ReportProductBlueprint[] = [
  {
    slug: "kundli",
    type: "kundli",
    name: "Kundli Report",
    shortDescription:
      "A comprehensive birth-chart analysis covering your personality, planets, houses, yogas, dashas, and the major themes of your life.",
    whatItCovers: [
      "Complete planetary positions and house placements",
      "Ascendant, Moon sign, and Nakshatra analysis",
      "Key yogas and their significance",
      "Vimshottari Mahadasha and Antardasha timeline",
      "Mangal Dosha, Sade Sati, and Kaal Sarp status",
      "Traditional remedies — gemstones, mantras, and rituals",
    ],
    whoItsFor: "Anyone who wants a single, thorough reference to their complete birth chart.",
    whatYouReceive: [
      "A 40–60 page personalized Kundli report",
      "Read instantly in your TrueLoger account",
      "Downloadable PDF",
    ],
    minPages: 40,
    maxPages: 60,
    seedMrp: 2999,
    seedSalePrice: 1999,
  },
  {
    slug: "marriage",
    type: "marriage",
    name: "Marriage Report",
    shortDescription:
      "Understand your marriage prospects, timing indicators, relationship patterns, and the traditional astrological factors behind them.",
    whatItCovers: [
      "7th house and 7th lord analysis",
      "Venus and Jupiter's role in your marriage prospects",
      "Marriage-supporting yogas and possible delay factors",
      "Dasha and transit windows relevant to marriage",
      "Partner nature and relationship dynamics",
      "Traditional remedies for marital harmony",
    ],
    whoItsFor: "Those seeking clarity on marriage timing, readiness, and what to expect.",
    whatYouReceive: [
      "A 30–45 page personalized Marriage report",
      "Read instantly in your TrueLoger account",
      "Downloadable PDF",
    ],
    minPages: 30,
    maxPages: 45,
    seedMrp: 2499,
    seedSalePrice: 1799,
  },
  {
    slug: "career",
    type: "career",
    name: "Career Report",
    shortDescription:
      "Explore your career strengths, professional direction, growth periods, and the planetary influences shaping your work life.",
    whatItCovers: [
      "10th house, 10th lord, and career-relevant house analysis",
      "Sun, Saturn, Mercury, and Jupiter's professional significance",
      "Career-supporting yogas and natural strengths",
      "Job versus business tendencies",
      "Dasha and transit-based career timing",
      "Practical, action-oriented guidance",
    ],
    whoItsFor: "Professionals and job-seekers wanting chart-based clarity on career direction and timing.",
    whatYouReceive: [
      "A 30–45 page personalized Career report",
      "Read instantly in your TrueLoger account",
      "Downloadable PDF",
    ],
    minPages: 30,
    maxPages: 45,
    seedMrp: 2499,
    seedSalePrice: 1799,
  },
  {
    slug: "love-relationship",
    type: "love-relationship",
    name: "Love & Relationship Report",
    shortDescription:
      "Understand your emotional patterns, relationship tendencies, and the important periods shaping your romantic life.",
    whatItCovers: [
      "5th and 7th house analysis",
      "Venus, Moon, and Mars — your relationship style",
      "Attraction patterns and emotional needs",
      "Communication and commitment tendencies",
      "Favourable periods and possible challenges",
      "Traditional remedies for relationship harmony",
    ],
    whoItsFor: "Anyone wanting an individual relationship and love profile grounded in their own chart.",
    whatYouReceive: [
      "A 30–45 page personalized Love & Relationship report",
      "Read instantly in your TrueLoger account",
      "Downloadable PDF",
    ],
    minPages: 30,
    maxPages: 45,
    seedMrp: 2299,
    seedSalePrice: 1599,
  },
  {
    slug: "finance",
    type: "finance",
    name: "Finance Report",
    shortDescription:
      "Explore your wealth indicators, income patterns, financial strengths, and the periods most favourable for financial growth.",
    whatItCovers: [
      "2nd, 5th, 9th, 10th, and 11th house analysis",
      "Wealth yogas and income indicators",
      "Savings tendencies and financial discipline",
      "Business and income-opportunity indicators",
      "Dasha and transit-based financial timing",
      "Traditional remedies for financial stability",
    ],
    whoItsFor: "Anyone seeking a traditional astrological perspective on their financial life — not a substitute for professional financial advice.",
    whatYouReceive: [
      "A 30–45 page personalized Finance report",
      "Read instantly in your TrueLoger account",
      "Downloadable PDF",
    ],
    minPages: 30,
    maxPages: 45,
    seedMrp: 2499,
    seedSalePrice: 1799,
  },
  {
    slug: "life",
    type: "life",
    name: "Life Report",
    shortDescription:
      "The broadest TrueLoger report — a complete life analysis spanning personality, career, relationships, finances, family, and major life phases.",
    whatItCovers: [
      "Personality, strengths, and core challenges",
      "Career, finance, love, and marriage overview",
      "Family and major life-period timeline",
      "Key yogas across every life area",
      "Dasha and transit-based favourable and caution periods",
      "Overall life guidance and traditional remedies",
    ],
    whoItsFor: "Anyone wanting one complete, life-spanning read of their chart across every major area.",
    whatYouReceive: [
      "A 40–60 page personalized Life report",
      "Read instantly in your TrueLoger account",
      "Downloadable PDF",
    ],
    minPages: 40,
    maxPages: 60,
    seedMrp: 2999,
    seedSalePrice: 2199,
  },
  {
    slug: "dosha",
    type: "dosha",
    name: "Dosha Report",
    shortDescription:
      "Identify the dosha conditions actually present in your chart, understand their traditional interpretation, and explore appropriate remedies.",
    whatItCovers: [
      "Mangal Dosha — presence, intensity, and cancellation factors",
      "Sade Sati — current phase and timeline",
      "Kaal Sarp Dosha status",
      "Relevant Rahu/Ketu and Shani-related conditions",
      "Traditional remedial measures for each identified dosha",
    ],
    whoItsFor: "Anyone wanting a focused, calculation-based read of dosha conditions in their chart — only doshas the engine actually detects are included.",
    whatYouReceive: [
      "A 30–40 page personalized Dosha report",
      "Read instantly in your TrueLoger account",
      "Downloadable PDF",
    ],
    minPages: 30,
    maxPages: 40,
    seedMrp: 1799,
    seedSalePrice: 1299,
  },
];

export function getReportBlueprint(slug: string): ReportProductBlueprint | undefined {
  return REPORT_PRODUCTS.find((p) => p.slug === slug);
}

export function getReportBlueprintByType(type: ReportType): ReportProductBlueprint | undefined {
  return REPORT_PRODUCTS.find((p) => p.type === type);
}
