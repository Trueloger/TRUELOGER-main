// src/lib/reports/blueprints/finance.ts — target 30-45 pages.
// Traditional astrology interpretation only — never regulated
// financial advice (AGENTS §31/§81).
import type { ReportBlueprint } from "./types";

export const FINANCE_BLUEPRINT: ReportBlueprint = {
  type: "finance",
  sections: [
    { id: "executive-summary", title: "Your Financial Profile Overview", instructions: "Write a warm executive summary of this person's wealth-relevant chart indicators. Clearly frame this as traditional astrological interpretation, not financial advice.", dataKeys: ["ascendant", "moonSign"], targetWords: { min: 350, max: 500 } },
    { id: "second-house", title: "The 2nd House of Wealth", instructions: "Interpret the 2nd house sign, its lord, and any planets placed there, for their traditional significance to accumulated wealth and family resources.", dataKeys: ["planets", "houses", "bhavabala"], targetWords: { min: 450, max: 650 } },
    { id: "eleventh-house", title: "The 11th House of Gains", instructions: "Interpret the 11th house for its traditional significance to income, gains, and networks.", dataKeys: ["planets", "houses"], targetWords: { min: 400, max: 600 } },
    { id: "fifth-ninth-house", title: "5th & 9th House Influences", instructions: "Interpret the 5th (speculative gains, intelligence) and 9th (fortune, luck) houses for their financial significance.", dataKeys: ["planets", "bhavabala"], targetWords: { min: 400, max: 600 } },
    { id: "tenth-house-income", title: "10th House & Income Through Career", instructions: "Interpret the 10th house's connection to income generated through profession.", dataKeys: ["planets", "bhavabala"], targetWords: { min: 350, max: 550 } },
    { id: "wealth-yogas", title: "Wealth Yogas (Dhana Yogas)", instructions: "Identify any detected yogas relevant to wealth accumulation. If none are directly wealth-related, note the chart's general financial strengths instead.", dataKeys: ["yogas"], targetWords: { min: 350, max: 550 } },
    { id: "savings-discipline", title: "Savings Tendencies & Financial Discipline", instructions: "Interpret the chart's indications for saving habits and financial discipline, offering grounded, practical reflection rather than directive advice.", dataKeys: ["planets"], targetWords: { min: 350, max: 500 } },
    { id: "business-opportunities", title: "Business & Income Opportunities", instructions: "Traditionally interpret indications for business ventures or additional income streams suggested by the chart.", dataKeys: ["planets", "houses"], targetWords: { min: 350, max: 550 } },
    { id: "financial-timing", title: "Financial Timing", instructions: "Using the Vimshottari Dasha timeline, identify which periods are traditionally more favourable for financial growth.", dataKeys: ["vimshottariDasha"], targetWords: { min: 400, max: 600 } },
    { id: "current-period", title: "Your Current Period & Finances", instructions: "Interpret the currently active Dasha period specifically through the lens of financial matters.", dataKeys: ["vimshottariDasha"], targetWords: { min: 300, max: 450 } },
    { id: "favourable-periods", title: "Favourable Financial Periods Ahead", instructions: "Summarize upcoming periods traditionally more favourable for financial decisions.", dataKeys: ["vimshottariDasha"], targetWords: { min: 300, max: 450 } },
    { id: "challenges", title: "Financial Challenges to Watch", instructions: "Traditionally interpret potential financial challenges suggested by the chart, framed constructively — never as guaranteed loss or as financial advice.", dataKeys: ["planets"], targetWords: { min: 350, max: 500 } },
    { id: "remedies", title: "Traditional Remedies for Financial Stability", instructions: "Provide traditional remedies relevant to financial stability and growth, tailored to this chart.", dataKeys: ["planets"], targetWords: { min: 300, max: 450 }, includeRemedies: true },
    { id: "practical-guidance", title: "Practical Discipline Guidance", instructions: "Write a grounded closing summary emphasizing practical financial discipline alongside the traditional interpretation — clearly noting this is not professional financial advice.", dataKeys: ["ascendant"], targetWords: { min: 250, max: 400 } },
  ],
};
