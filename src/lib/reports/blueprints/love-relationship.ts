// src/lib/reports/blueprints/love-relationship.ts — target 30-45 pages.
// An INDIVIDUAL relationship/love profile — no second person's birth
// data exists in this product, so this never claims to be
// "compatibility with your partner" (AGENTS §30).
import type { ReportBlueprint } from "./types";

export const LOVE_RELATIONSHIP_BLUEPRINT: ReportBlueprint = {
  type: "love-relationship",
  sections: [
    { id: "executive-summary", title: "Your Love & Relationship Overview", instructions: "Write a warm executive summary of this person's emotional and relationship patterns as suggested by their chart. This is an individual love profile, not a compatibility reading with a specific partner.", dataKeys: ["ascendant", "moonSign"], targetWords: { min: 350, max: 500 } },
    { id: "fifth-house", title: "The 5th House of Romance", instructions: "Interpret the 5th house sign, its lord, and any planets placed there, and what they traditionally suggest about romance and attraction.", dataKeys: ["planets", "houses", "bhavabala"], targetWords: { min: 450, max: 650 } },
    { id: "seventh-house", title: "The 7th House of Partnership", instructions: "Interpret the 7th house for its significance to committed partnership and long-term relationship style.", dataKeys: ["planets", "houses"], targetWords: { min: 400, max: 600 } },
    { id: "venus", title: "Venus — Your Love Language", instructions: "Interpret Venus's sign and house placement for what it traditionally suggests about attraction patterns and what this person values in romance.", dataKeys: ["planets"], targetWords: { min: 400, max: 600 } },
    { id: "moon-emotional-pattern", title: "Moon — Emotional Patterns", instructions: "Interpret the Moon's placement for emotional needs and how this person processes closeness and intimacy.", dataKeys: ["moonSign", "planets"], targetWords: { min: 400, max: 600 } },
    { id: "mars-drive", title: "Mars — Passion & Drive", instructions: "Interpret Mars's placement for passion, assertiveness, and how this person pursues what they want in relationships.", dataKeys: ["planets"], targetWords: { min: 350, max: 550 } },
    { id: "attraction-patterns", title: "Attraction Patterns", instructions: "Synthesize Venus, Moon, and Mars into a picture of this person's typical attraction and relationship-seeking patterns.", dataKeys: ["planets"], targetWords: { min: 400, max: 600 } },
    { id: "communication", title: "Communication in Relationships", instructions: "Interpret Mercury's placement and relevant house influences for communication style within close relationships.", dataKeys: ["planets"], targetWords: { min: 350, max: 500 } },
    { id: "commitment-tendencies", title: "Commitment Tendencies", instructions: "Traditionally interpret this chart's indications around commitment, pacing, and relationship stability.", dataKeys: ["planets", "houses"], targetWords: { min: 350, max: 550 } },
    { id: "relationship-challenges", title: "Relationship Challenges", instructions: "Traditionally interpret potential relationship challenges suggested by the chart, framed constructively and without fatalism.", dataKeys: ["planets"], targetWords: { min: 350, max: 500 } },
    { id: "timing", title: "Timing for Love", instructions: "Using the Vimshottari Dasha timeline, identify which periods are traditionally more favourable for romance and relationship developments.", dataKeys: ["vimshottariDasha"], targetWords: { min: 400, max: 600 } },
    { id: "current-period", title: "Your Current Period & Love Life", instructions: "Interpret the currently active Dasha period specifically through the lens of romance and relationships.", dataKeys: ["vimshottariDasha"], targetWords: { min: 300, max: 450 } },
    { id: "favourable-periods", title: "Favourable Periods Ahead", instructions: "Summarize upcoming periods that are traditionally more favourable for love and relationships.", dataKeys: ["vimshottariDasha"], targetWords: { min: 300, max: 450 } },
    { id: "remedies", title: "Traditional Remedies for Relationship Harmony", instructions: "Provide traditional remedies relevant to strengthening romantic harmony, tailored to this chart.", dataKeys: ["planets"], targetWords: { min: 300, max: 450 }, includeRemedies: true },
    { id: "practical-guidance", title: "Practical Guidance", instructions: "Write a warm, practical closing summary with grounded reflection points for this person's love life.", dataKeys: ["moonSign"], targetWords: { min: 250, max: 400 } },
  ],
};
