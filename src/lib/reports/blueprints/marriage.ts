// src/lib/reports/blueprints/marriage.ts — target 30-45 pages.
import type { ReportBlueprint } from "./types";

export const MARRIAGE_BLUEPRINT: ReportBlueprint = {
  type: "marriage",
  sections: [
    { id: "executive-summary", title: "Your Marriage Overview", instructions: "Write a warm executive summary of this person's marriage-relevant chart indicators and what the report will cover.", dataKeys: ["ascendant", "moonSign"], targetWords: { min: 350, max: 500 } },
    { id: "seventh-house", title: "The 7th House of Partnership", instructions: "Interpret the 7th house sign, its lord, and any planets placed there, and what they traditionally suggest about marriage and partnership.", dataKeys: ["planets", "houses", "bhavabala"], targetWords: { min: 500, max: 750 } },
    { id: "venus-jupiter", title: "Venus & Jupiter — Love and Commitment", instructions: "Interpret Venus's and Jupiter's sign/house placements and their traditional significance for love, attraction, and marital happiness.", dataKeys: ["planets", "shadbala"], targetWords: { min: 450, max: 650 } },
    { id: "marriage-yogas", title: "Marriage-Supporting Yogas", instructions: "Identify any detected yogas relevant to marriage and relationships. If none are directly marriage-related, note the chart's general relationship strengths instead.", dataKeys: ["yogas"], targetWords: { min: 350, max: 550 } },
    { id: "delay-factors", title: "Possible Delay Factors", instructions: "Traditionally interpret any chart factors (afflictions to the 7th house/lord, Mangal Dosha if present) that might relate to marriage timing or delay. Keep the tone measured, never alarming.", dataKeys: ["mangalDosha", "planets"], targetWords: { min: 400, max: 600 } },
    { id: "partner-nature", title: "Partner Characteristics", instructions: "Based on the 7th house and its lord, describe the general traditional indications about the nature and temperament of a likely life partner. Do not claim to identify a specific real person.", dataKeys: ["planets", "houses"], targetWords: { min: 400, max: 600 } },
    { id: "relationship-dynamics", title: "Relationship Dynamics", instructions: "Interpret how this person likely engages in a committed relationship — communication style, emotional needs, and compatibility themes — from the Moon and Venus placements.", dataKeys: ["planets", "moonSign"], targetWords: { min: 400, max: 600 } },
    { id: "marriage-timing", title: "Marriage Timing Indicators", instructions: "Using the Vimshottari Dasha timeline, identify which periods are traditionally more favourable for marriage.", dataKeys: ["vimshottariDasha"], targetWords: { min: 400, max: 600 } },
    { id: "current-period", title: "Your Current Period & Marriage", instructions: "Interpret the currently active Dasha period specifically through the lens of marriage and relationships.", dataKeys: ["vimshottariDasha"], targetWords: { min: 350, max: 500 } },
    { id: "family-considerations", title: "Family & Emotional Compatibility", instructions: "Interpret the 4th house and Moon for family harmony and emotional compatibility themes relevant to married life.", dataKeys: ["planets", "moonSign"], targetWords: { min: 350, max: 500 } },
    { id: "favourable-periods", title: "Favourable Periods Ahead", instructions: "Summarize the most favourable upcoming periods for marriage-related decisions based on the Dasha data.", dataKeys: ["vimshottariDasha"], targetWords: { min: 300, max: 450 } },
    { id: "challenges", title: "Potential Challenges", instructions: "Traditionally interpret potential relationship challenges suggested by the chart, framed constructively with a focus on awareness rather than fatalism.", dataKeys: ["planets", "mangalDosha"], targetWords: { min: 350, max: 500 } },
    { id: "remedies", title: "Traditional Remedies for Marital Harmony", instructions: "Provide traditional remedies relevant to strengthening marriage prospects and harmony, tailored to this chart's specific indications.", dataKeys: ["mangalDosha", "planets"], targetWords: { min: 350, max: 500 }, includeRemedies: true },
    { id: "summary", title: "Closing Guidance", instructions: "Write a warm, grounded closing summary of the marriage report's key findings.", dataKeys: ["ascendant", "moonSign"], targetWords: { min: 250, max: 400 } },
  ],
};
