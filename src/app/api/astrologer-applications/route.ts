// src/app/api/astrologer-applications/route.ts
// Public submission endpoint for the "Register as an Astrologer" form.
// No sign-in required — an applicant need not be an existing TrueLoger
// customer. Validates every field server-side (never trust client
// validation alone), uploads the resume to private Firebase Storage,
// then creates the application doc with status "Pending".
import { NextResponse } from "next/server";
import { createApplication, newApplicationId, uploadResume } from "@/lib/astrologers/store";
import { EXPERTISE_OPTIONS, CONSULTATION_FORMATS } from "@/lib/astrologers/types";

export const maxDuration = 30;

const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_RESUME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

function str(value: FormDataEntryValue | null, max = 2000): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function strList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || !value.trim()) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  }

  const fullName = str(formData.get("fullName"), 200);
  const email = str(formData.get("email"), 200);
  const phone = str(formData.get("phone"), 30);
  const location = str(formData.get("location"), 200);
  const yearsExperience = Number(formData.get("yearsExperience"));
  const primaryExpertise = str(formData.get("primaryExpertise"), 100);
  const secondaryExpertise = strList(formData.get("secondaryExpertise"));
  const languages = strList(formData.get("languages"));
  const consultationCategories = strList(formData.get("consultationCategories"));
  const about = str(formData.get("about"), 3000);
  const qualifications = str(formData.get("qualifications"), 1000) || undefined;
  const socialProfile = str(formData.get("socialProfile"), 300) || undefined;
  const preferredFormats = strList(formData.get("preferredFormats"));

  if (!fullName) return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  if (!location) return NextResponse.json({ error: "Location is required." }, { status: 400 });
  if (!Number.isFinite(yearsExperience) || yearsExperience < 0 || yearsExperience > 70) {
    return NextResponse.json({ error: "Enter a valid number of years of experience." }, { status: 400 });
  }
  if (!EXPERTISE_OPTIONS.includes(primaryExpertise as (typeof EXPERTISE_OPTIONS)[number])) {
    return NextResponse.json({ error: "Select a valid primary expertise." }, { status: 400 });
  }
  if (!languages.length) return NextResponse.json({ error: "List at least one language." }, { status: 400 });
  if (!about || about.length < 30) {
    return NextResponse.json({ error: "Please write a short description (at least 30 characters)." }, { status: 400 });
  }
  if (!preferredFormats.every((f) => (CONSULTATION_FORMATS as readonly string[]).includes(f))) {
    return NextResponse.json({ error: "Invalid consultation format selected." }, { status: 400 });
  }

  const file = formData.get("resume");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Please attach your resume." }, { status: 400 });
  }
  const extension = ALLOWED_RESUME_TYPES[file.type];
  if (!extension) {
    return NextResponse.json({ error: "Resume must be a PDF, DOC, or DOCX file." }, { status: 400 });
  }
  if (file.size === 0) return NextResponse.json({ error: "Resume file appears to be empty." }, { status: 400 });
  if (file.size > MAX_RESUME_BYTES) {
    return NextResponse.json({ error: "Resume is too large — please keep it under 5MB." }, { status: 400 });
  }

  try {
    // Application id first, then upload keyed to it, so the resume's
    // storage path is deterministic and never a client-supplied name
    // (avoids path traversal / unsafe filenames entirely).
    const applicationId = newApplicationId();
    const buffer = Buffer.from(await file.arrayBuffer());
    const resumeStorageRef = await uploadResume(applicationId, buffer, file.type, extension);

    const application = await createApplication(applicationId, {
      fullName,
      email,
      phone,
      location,
      yearsExperience,
      primaryExpertise,
      secondaryExpertise,
      languages,
      consultationCategories,
      about,
      qualifications,
      socialProfile,
      preferredFormats,
      resumeStorageRef,
      resumeFileName: file.name.slice(0, 200),
    });

    return NextResponse.json({ ok: true, id: application.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Submission failed.";
    return NextResponse.json({ error: `Submission failed: ${message}` }, { status: 502 });
  }
}
