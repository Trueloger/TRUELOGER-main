// src/lib/reports/blueprints/life.ts — the broadest report after
// Kundli, target 40-60 pages, spanning every major life area.
import type { ReportBlueprint } from "./types";

export const LIFE_BLUEPRINT: ReportBlueprint = {
  type: "life",
  sections: [
    { id: "executive-summary", title: "Your Life Overview", instructions: "Write a warm, comprehensive executive summary of this person's chart and the major life themes the report will cover.", dataKeys: ["ascendant", "moonSign", "nakshatra"], targetWords: { min: 400, max: 550 } },
    { id: "personality", title: "Personality & Core Nature", instructions: "Interpret the Ascendant, Moon, and Sun placements together for a rounded picture of personality, temperament, and self-expression.", dataKeys: ["ascendant", "moonSign", "planets"], targetWords: { min: 450, max: 650 } },
    { id: "strengths-challenges", title: "Core Strengths & Challenges", instructions: "Identify this chart's most significant strengths (well-placed/strong planets) and challenges (afflicted/weak placements) based on the shadbala data.", dataKeys: ["shadbala", "planets"], targetWords: { min: 450, max: 650 } },
    { id: "family", title: "Family & Roots", instructions: "Interpret the 4th house and Moon for family life, home, and early roots.", dataKeys: ["planets", "moonSign"], targetWords: { min: 350, max: 550 } },
    { id: "education", title: "Education & Learning", instructions: "Interpret the 4th/5th houses and Mercury/Jupiter for educational strengths and learning style.", dataKeys: ["planets"], targetWords: { min: 350, max: 500 } },
    { id: "career", title: "Career & Profession", instructions: "Interpret the 10th house, its lord, and Saturn/Sun for career direction and professional strengths.", dataKeys: ["planets", "bhavabala"], targetWords: { min: 450, max: 650 } },
    { id: "finance", title: "Finance & Wealth", instructions: "Interpret the 2nd and 11th houses for wealth and income tendencies. Frame as traditional interpretation, not financial advice.", dataKeys: ["planets", "bhavabala"], targetWords: { min: 400, max: 600 } },
    { id: "love", title: "Love & Relationships", instructions: "Interpret the 5th house and Venus for romantic tendencies and emotional patterns in relationships.", dataKeys: ["planets"], targetWords: { min: 400, max: 600 } },
    { id: "marriage", title: "Marriage", instructions: "Interpret the 7th house and its lord for marriage prospects and partnership dynamics.", dataKeys: ["planets", "mangalDosha"], targetWords: { min: 400, max: 600 } },
    { id: "children", title: "Children", instructions: "Interpret the 5th house for traditional indications relating to children, framed gently and without definitive claims.", dataKeys: ["planets"], targetWords: { min: 300, max: 450 } },
    { id: "wellbeing", title: "Health & Wellbeing", instructions: "Interpret the 6th house and Ascendant lord's strength for general vitality themes. Explicitly state this is not medical advice or diagnosis.", dataKeys: ["planets", "shadbala"], targetWords: { min: 350, max: 500 } },
    { id: "spirituality", title: "Spirituality & Inner Growth", instructions: "Interpret the 9th and 12th houses and Jupiter/Ketu for spiritual inclination and inner growth themes.", dataKeys: ["planets"], targetWords: { min: 350, max: 500 } },
    { id: "property", title: "Property & Assets", instructions: "Interpret the 4th house for traditional indications relating to property and fixed assets.", dataKeys: ["planets", "bhavabala"], targetWords: { min: 300, max: 450 } },
    { id: "yogas", title: "Special Yogas in Your Chart", instructions: "For each detected yoga, explain its traditional significance across the relevant life area. If none are detected, note that honestly.", dataKeys: ["yogas"], targetWords: { min: 400, max: 650 } },
    { id: "doshas-overview", title: "Doshas at a Glance", instructions: "Give a brief overview of Mangal Dosha, Sade Sati, and Kaal Sarp status — full detail is available in TrueLoger's dedicated Dosha Report; this is a summary within the broader life picture.", dataKeys: ["mangalDosha", "sadeSati", "kaalSarp"], targetWords: { min: 350, max: 500 } },
    { id: "dasha-timeline", title: "Vimshottari Dasha Timeline", instructions: "Present the Mahadasha sequence and explain how to read it as a life timeline.", dataKeys: ["vimshottariDasha"], targetWords: { min: 350, max: 500 } },
    { id: "current-period", title: "Your Current Life Period", instructions: "Interpret the currently active Dasha period across multiple life areas — career, relationships, and personal growth.", dataKeys: ["vimshottariDasha"], targetWords: { min: 400, max: 600 } },
    { id: "favourable-periods", title: "Important Favourable Periods", instructions: "Identify upcoming periods that are traditionally favourable, and for which life areas.", dataKeys: ["vimshottariDasha"], targetWords: { min: 350, max: 500 } },
    { id: "caution-periods", title: "Important Periods to Navigate Carefully", instructions: "Identify upcoming periods traditionally associated with more caution, framed constructively as periods for mindful planning rather than fear.", dataKeys: ["vimshottariDasha", "sadeSati"], targetWords: { min: 350, max: 500 } },
    { id: "remedies", title: "Traditional Remedies", instructions: "Consolidate the most relevant traditional remedies across all life areas covered in this report.", dataKeys: ["mangalDosha", "sadeSati", "kaalSarp"], targetWords: { min: 400, max: 550 }, includeRemedies: true },
    { id: "life-guidance", title: "Overall Life Guidance", instructions: "Write a comprehensive, warm closing summary tying together the full life report's major findings into encouraging, grounded final guidance.", dataKeys: ["ascendant", "moonSign", "yogas"], targetWords: { min: 350, max: 500 } },
  ],
};
