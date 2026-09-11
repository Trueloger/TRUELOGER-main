// src/lib/reports/blueprints/dosha.ts
// Focused dosha report — target 30-40 pages. Only includes doshas the
// astro-engine actually calculates (AGENTS §33) — never a generic
// dump of every dosha name that exists in astrology.
import type { ReportBlueprint } from "./types";

export const DOSHA_BLUEPRINT: ReportBlueprint = {
  type: "dosha",
  sections: [
    {
      id: "executive-summary",
      title: "Your Dosha Overview",
      instructions:
        "Write a warm executive summary of which dosha conditions were found present or absent in this chart, setting expectations for the report — reassuring in tone, never alarming.",
      dataKeys: ["mangalDosha", "sadeSati", "kaalSarp"],
      targetWords: { min: 350, max: 500 },
    },
    {
      id: "mangal-dosha-status",
      title: "Mangal Dosha (Kuja Dosha)",
      instructions:
        "Explain the calculated Mangal Dosha status in detail — whether present, from Ascendant and/or Moon, the houses Mars occupies, and its classical significance for marriage and temperament.",
      dataKeys: ["mangalDosha", "planets"],
      targetWords: { min: 500, max: 750 },
    },
    {
      id: "mangal-dosha-remedies",
      title: "Mangal Dosha — Traditional Remedies",
      instructions:
        "If Mangal Dosha is present, give detailed traditional remedies. If absent, briefly note that no remedy is needed for this condition and explain why understanding it still matters.",
      dataKeys: ["mangalDosha"],
      targetWords: { min: 350, max: 500 },
      includeRemedies: true,
    },
    {
      id: "sade-sati-status",
      title: "Sade Sati",
      instructions:
        "Explain the calculated Sade Sati status in detail — active or not, which phase if active, and what this 7.5-year Saturn transit period traditionally means.",
      dataKeys: ["sadeSati", "moonSign"],
      targetWords: { min: 450, max: 650 },
    },
    {
      id: "sade-sati-remedies",
      title: "Sade Sati — Traditional Remedies",
      instructions:
        "Give traditional remedies appropriate to this person's Sade Sati status (if active) for navigating this Saturn period with steadiness.",
      dataKeys: ["sadeSati"],
      targetWords: { min: 300, max: 450 },
      includeRemedies: true,
    },
    {
      id: "kaal-sarp-status",
      title: "Kaal Sarp Dosha",
      instructions:
        "Explain the calculated Kaal Sarp Dosha status in detail and its general traditional significance for life patterns.",
      dataKeys: ["kaalSarp", "planets"],
      targetWords: { min: 400, max: 600 },
    },
    {
      id: "kaal-sarp-remedies",
      title: "Kaal Sarp Dosha — Traditional Remedies",
      instructions:
        "If present, give traditional remedies for Kaal Sarp Dosha. If absent, note that clearly.",
      dataKeys: ["kaalSarp"],
      targetWords: { min: 300, max: 450 },
      includeRemedies: true,
    },
    {
      id: "rahu-ketu",
      title: "Rahu & Ketu Placement",
      instructions:
        "Interpret the houses and signs Rahu and Ketu occupy in this chart and their general traditional significance, independent of the Kaal Sarp calculation above.",
      dataKeys: ["planets", "houses"],
      targetWords: { min: 400, max: 600 },
    },
    {
      id: "saturn-conditions",
      title: "Saturn's Placement & Strength",
      instructions:
        "Interpret Saturn's sign, house, and calculated strength (from the shadbala data) and what it suggests about discipline, delay, and long-term structure in this person's life, distinct from the Sade Sati analysis already covered.",
      dataKeys: ["planets", "shadbala"],
      targetWords: { min: 400, max: 600 },
    },
    {
      id: "overall-summary",
      title: "Overall Dosha Summary",
      instructions:
        "Provide a consolidated severity/summary view of every dosha covered in this report, and reassure the reader with practical, grounded closing guidance — doshas are traditional considerations to work with thoughtfully, not causes for alarm.",
      dataKeys: ["mangalDosha", "sadeSati", "kaalSarp"],
      targetWords: { min: 350, max: 500 },
    },
    {
      id: "remedies-summary",
      title: "Consolidated Remedy Plan",
      instructions:
        "Bring together the remedies already suggested in the report into one practical, prioritized closing action plan spanning mantra, charity, fasting/traditional practice, and gemstone categories as relevant to this specific chart.",
      dataKeys: ["mangalDosha", "sadeSati", "kaalSarp"],
      targetWords: { min: 350, max: 500 },
      includeRemedies: true,
    },
  ],
};
