// src/lib/astrologers/types.ts
// Astrologer job-application system — a real applicant record with a
// securely-stored resume, distinct from the site's customer/user
// model (an applicant need not have a TrueLoger account).
export type ApplicationStatus = "Pending" | "Under Review" | "Approved" | "Rejected";

export const APPLICATION_STATUSES: ApplicationStatus[] = ["Pending", "Under Review", "Approved", "Rejected"];

export const EXPERTISE_OPTIONS = [
  "Vedic Astrology",
  "Tarot",
  "Numerology",
  "Vastu",
  "Palmistry",
  "Lal Kitab",
  "Spiritual Healing",
  "KP Astrology",
  "Nadi Astrology",
  "Prashna / Horary",
] as const;

export const CONSULTATION_FORMATS = ["Chat", "Voice Call", "Video Call"] as const;

export type AstrologerApplication = {
  id: string;
  // Personal
  fullName: string;
  email: string;
  phone: string;
  location: string;
  // Professional
  yearsExperience: number;
  primaryExpertise: string;
  secondaryExpertise: string[];
  languages: string[];
  consultationCategories: string[];
  about: string;
  qualifications?: string;
  socialProfile?: string;
  preferredFormats: string[];
  // Resume — private, never a public URL (see store.ts)
  resumeStorageRef: string;
  resumeFileName: string;
  // Status
  status: ApplicationStatus;
  submittedAt: number;
  updatedAt: number;
};
