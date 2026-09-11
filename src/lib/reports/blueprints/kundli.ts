// src/lib/reports/blueprints/kundli.ts
// The most comprehensive TrueLoger report — target 40-60 pages.
// Structurally inspired by the depth/organization of a traditional
// Brihat Kundli (basic details, planetary tables, key points, dashas,
// doshas, remedies, ...) but an original TrueLoger section set and
// wording, not a copy of any competitor's report.
import type { ReportBlueprint } from "./types";

export const KUNDLI_BLUEPRINT: ReportBlueprint = {
  type: "kundli",
  sections: [
    {
      id: "executive-summary",
      title: "Your Birth Chart at a Glance",
      instructions:
        "Write a warm, premium executive summary of this person's chart — their Ascendant, Moon sign, and Nakshatra, and the overall character these placements suggest together. Set the tone for the full report.",
      dataKeys: ["ascendant", "moonSign", "nakshatra"],
      targetWords: { min: 350, max: 500 },
    },
    {
      id: "key-themes",
      title: "Your Key Life Themes",
      instructions:
        "Identify 5-7 major life themes this chart suggests — core strength, main challenge, career direction, relationship theme, growth theme, an important upcoming period. Write each as a short keyPoint with one supporting sentence in the paragraphs.",
      dataKeys: ["ascendant", "moonSign", "yogas", "vimshottariDasha"],
      targetWords: { min: 300, max: 450 },
    },
    {
      id: "ascendant",
      title: "Ascendant (Lagna) Analysis",
      instructions:
        "Explain what this Ascendant sign traditionally means for personality, appearance, and life approach. Reference the exact degree placement.",
      dataKeys: ["ascendant"],
      targetWords: { min: 400, max: 600 },
    },
    {
      id: "moon-sign",
      title: "Moon Sign (Rashi) Analysis",
      instructions:
        "Explain what this Moon sign traditionally means for the person's emotional nature, mind, and inner world.",
      dataKeys: ["moonSign"],
      targetWords: { min: 400, max: 600 },
    },
    {
      id: "nakshatra",
      title: "Birth Nakshatra",
      instructions:
        "Explain the traditional significance of this Nakshatra and Pada — its ruling deity's traditional theme, symbol, and personality associations, in brief and accessible terms.",
      dataKeys: ["nakshatra"],
      targetWords: { min: 350, max: 500 },
    },
    {
      id: "planetary-positions",
      title: "Planetary Positions",
      instructions:
        "Present a clear table of every planet's sign, degree, and house placement, then write 2-3 paragraphs highlighting the most significant placements (any exalted, debilitated, combust, or retrograde planet) and what they traditionally suggest.",
      dataKeys: ["planets"],
      targetWords: { min: 400, max: 600 },
    },
    {
      id: "house-analysis",
      title: "House-by-House Overview",
      instructions:
        "Summarize the traditional significance of the houses most strongly occupied or aspected in this chart (do not cover all 12 in equal depth — focus on the 3-5 most significant), referencing which planets occupy them.",
      dataKeys: ["planets", "houses", "bhavabala"],
      targetWords: { min: 500, max: 750 },
    },
    {
      id: "yogas",
      title: "Special Yogas in Your Chart",
      instructions:
        "For each detected yoga, explain its traditional name and significance in plain language. If no yogas were detected, say so honestly and explain what that means (not every chart has a classical yoga — this is normal, not a deficiency).",
      dataKeys: ["yogas"],
      targetWords: { min: 400, max: 700 },
    },
    {
      id: "mangal-dosha",
      title: "Mangal Dosha (Kuja Dosha)",
      instructions:
        "Explain whether Mangal Dosha is present per the calculated result, the houses involved, and its traditional significance for marriage and temperament. If not present, state that clearly and reassuringly.",
      dataKeys: ["mangalDosha"],
      targetWords: { min: 300, max: 450 },
      includeRemedies: true,
    },
    {
      id: "sade-sati",
      title: "Sade Sati Status",
      instructions:
        "Explain the calculated Sade Sati status (active/inactive, and phase if active) and its traditional meaning for this period of life.",
      dataKeys: ["sadeSati"],
      targetWords: { min: 300, max: 450 },
      includeRemedies: true,
    },
    {
      id: "kaal-sarp",
      title: "Kaal Sarp Dosha",
      instructions:
        "Explain the calculated Kaal Sarp Dosha status and, if present, its general traditional significance.",
      dataKeys: ["kaalSarp"],
      targetWords: { min: 250, max: 400 },
      includeRemedies: true,
    },
    {
      id: "vimshottari-overview",
      title: "Vimshottari Dasha Timeline",
      instructions:
        "Present the Mahadasha sequence as a table (lord and date range) and explain the Vimshottari Dasha system briefly for a reader unfamiliar with it.",
      dataKeys: ["vimshottariDasha"],
      targetWords: { min: 350, max: 500 },
    },
    {
      id: "current-dasha",
      title: "Your Current Period",
      instructions:
        "Identify which Mahadasha (and Antardasha, if determinable from the data) is currently active for this person, and explain its traditional themes and likely areas of focus for this period.",
      dataKeys: ["vimshottariDasha"],
      targetWords: { min: 400, max: 600 },
    },
    {
      id: "career-theme",
      title: "Career & Profession",
      instructions:
        "Interpret the chart's career-relevant indicators (10th house, its lord, Saturn, Sun) and describe likely career strengths and direction.",
      dataKeys: ["planets", "bhavabala", "shadbala"],
      targetWords: { min: 400, max: 600 },
    },
    {
      id: "marriage-theme",
      title: "Marriage & Relationships",
      instructions:
        "Interpret the chart's marriage-relevant indicators (7th house, Venus, Jupiter) and describe general relationship tendencies and marriage prospects.",
      dataKeys: ["planets", "bhavabala"],
      targetWords: { min: 400, max: 600 },
    },
    {
      id: "finance-theme",
      title: "Wealth & Finance",
      instructions:
        "Interpret the chart's wealth-relevant indicators (2nd, 11th houses) and describe general financial tendencies. Frame clearly as traditional interpretation, not financial advice.",
      dataKeys: ["planets", "bhavabala"],
      targetWords: { min: 350, max: 550 },
    },
    {
      id: "family-theme",
      title: "Family & Home Life",
      instructions:
        "Interpret the chart's family-relevant indicators (4th house, Moon) and describe general family life themes.",
      dataKeys: ["planets", "moonSign"],
      targetWords: { min: 300, max: 450 },
    },
    {
      id: "favourable-periods",
      title: "Favourable Periods Ahead",
      instructions:
        "Based on the Dasha timeline, identify which upcoming period(s) are traditionally considered more favourable, and briefly why.",
      dataKeys: ["vimshottariDasha"],
      targetWords: { min: 300, max: 450 },
    },
    {
      id: "remedies",
      title: "Traditional Remedies",
      instructions:
        "Summarize the most relevant traditional remedies for this specific chart — drawing together the remedy suggestions already made in the dosha sections above into one consolidated, practical closing list. Include mantra, charity, and ritual categories as relevant.",
      dataKeys: ["mangalDosha", "sadeSati", "kaalSarp"],
      targetWords: { min: 350, max: 500 },
      includeRemedies: true,
    },
    {
      id: "conclusion",
      title: "Closing Summary",
      instructions:
        "Write a warm closing summary tying together the report's major findings into an encouraging, grounded final note.",
      dataKeys: ["ascendant", "moonSign", "yogas"],
      targetWords: { min: 250, max: 400 },
    },
  ],
};
