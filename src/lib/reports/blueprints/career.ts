// src/lib/reports/blueprints/career.ts — target 30-45 pages.
import type { ReportBlueprint } from "./types";

export const CAREER_BLUEPRINT: ReportBlueprint = {
  type: "career",
  sections: [
    { id: "executive-summary", title: "Your Career Overview", instructions: "Write a warm executive summary of this person's career-relevant chart indicators and what the report will cover.", dataKeys: ["ascendant", "moonSign"], targetWords: { min: 350, max: 500 } },
    { id: "tenth-house", title: "The 10th House of Career", instructions: "Interpret the 10th house sign, its lord, and any planets placed there, and what they traditionally suggest about profession and public standing.", dataKeys: ["planets", "houses", "bhavabala"], targetWords: { min: 500, max: 750 } },
    { id: "sixth-second-eleventh", title: "6th, 2nd & 11th House Influences", instructions: "Interpret the 6th (service/competition), 2nd (resources), and 11th (gains/networks) houses for their career and income significance.", dataKeys: ["planets", "bhavabala"], targetWords: { min: 450, max: 650 } },
    { id: "key-planets", title: "Sun, Saturn, Mercury & Jupiter", instructions: "Interpret these four planets' sign, house, and calculated strength for their traditional significance to authority, discipline, communication, and growth in career.", dataKeys: ["planets", "shadbala"], targetWords: { min: 500, max: 700 } },
    { id: "career-yogas", title: "Career-Supporting Yogas", instructions: "Identify any detected yogas relevant to career success and professional strength. If none are directly career-related, note the chart's general professional strengths instead.", dataKeys: ["yogas"], targetWords: { min: 350, max: 550 } },
    { id: "work-style", title: "Professional Strengths & Work Style", instructions: "Describe this person's likely natural working style, leadership tendencies, and professional strengths based on the chart.", dataKeys: ["planets", "ascendant"], targetWords: { min: 400, max: 600 } },
    { id: "job-vs-business", title: "Job vs. Business Tendencies", instructions: "Traditionally interpret whether the chart leans more toward stable employment or entrepreneurial/business pursuits, and why.", dataKeys: ["planets", "bhavabala"], targetWords: { min: 350, max: 550 } },
    { id: "suitable-fields", title: "Suitable Career Environments", instructions: "Based on the planetary influences identified, suggest general categories of work environment or field this chart traditionally suits — framed as tendencies, not prescriptions.", dataKeys: ["planets"], targetWords: { min: 350, max: 550 } },
    { id: "career-timing", title: "Career Timing", instructions: "Using the Vimshottari Dasha timeline, identify which periods are traditionally more favourable for career growth and change.", dataKeys: ["vimshottariDasha"], targetWords: { min: 400, max: 600 } },
    { id: "current-period", title: "Your Current Period & Career", instructions: "Interpret the currently active Dasha period specifically through the lens of career and professional growth.", dataKeys: ["vimshottariDasha"], targetWords: { min: 350, max: 500 } },
    { id: "growth-windows", title: "Growth Windows Ahead", instructions: "Summarize the most favourable upcoming periods for career decisions and growth based on the Dasha data.", dataKeys: ["vimshottariDasha"], targetWords: { min: 300, max: 450 } },
    { id: "challenges", title: "Professional Challenges", instructions: "Traditionally interpret potential career challenges suggested by the chart, framed constructively.", dataKeys: ["planets", "shadbala"], targetWords: { min: 350, max: 500 } },
    { id: "financial-connection", title: "Career & Financial Connection", instructions: "Briefly interpret how the career indicators connect to financial outcomes per the 2nd and 11th houses.", dataKeys: ["planets", "bhavabala"], targetWords: { min: 300, max: 450 } },
    { id: "remedies", title: "Traditional Remedies for Career Growth", instructions: "Provide traditional remedies relevant to strengthening career prospects, tailored to this chart's specific indications.", dataKeys: ["planets"], targetWords: { min: 300, max: 450 }, includeRemedies: true },
    { id: "summary", title: "Action-Oriented Summary", instructions: "Write a practical, encouraging closing summary of the career report's key findings and next steps to reflect on.", dataKeys: ["ascendant"], targetWords: { min: 250, max: 400 } },
  ],
};
