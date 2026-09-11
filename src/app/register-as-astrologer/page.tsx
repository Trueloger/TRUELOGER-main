"use client";

// src/app/register-as-astrologer/page.tsx
// Public astrologer job-application form. No sign-in required — this
// is a job application, not a customer purchase. Client validates for
// UX; the server (src/app/api/astrologer-applications/route.ts)
// re-validates everything and is the real gate.
import { useState, type FormEvent } from "react";
import { LotusIcon } from "@/components/quick-services/icons";
import { fieldLabelClass, fieldInputClass, fieldHintTextClass } from "@/components/forms/field-styles";
import { EXPERTISE_OPTIONS, CONSULTATION_FORMATS } from "@/lib/astrologers/types";

const LANGUAGE_SUGGESTIONS = ["Hindi", "English", "Punjabi", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati"];

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-[40px] items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-nav-plum transition-colors hover:bg-nav-lavender-mist">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-nav-lavender-line text-nav-amethyst focus-visible:ring-2 focus-visible:ring-nav-amethyst"
      />
      {label}
    </label>
  );
}

export default function RegisterAsAstrologerPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [primaryExpertise, setPrimaryExpertise] = useState("");
  const [secondaryExpertise, setSecondaryExpertise] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [about, setAbout] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [socialProfile, setSocialProfile] = useState("");
  const [preferredFormats, setPreferredFormats] = useState<string[]>([]);
  const [resume, setResume] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !phone.trim() || !location.trim()) {
      setError("Please fill in all personal information fields.");
      return;
    }
    if (!primaryExpertise) {
      setError("Please select your primary expertise.");
      return;
    }
    if (languages.length === 0) {
      setError("Please select at least one language.");
      return;
    }
    if (about.trim().length < 30) {
      setError("Please write at least a short paragraph about yourself (30+ characters).");
      return;
    }
    if (!resume) {
      setError("Please attach your resume (PDF, DOC, or DOCX).");
      return;
    }
    if (resume.size > 5 * 1024 * 1024) {
      setError("Resume must be under 5MB.");
      return;
    }

    const formData = new FormData();
    formData.set("fullName", fullName.trim());
    formData.set("email", email.trim());
    formData.set("phone", phone.trim());
    formData.set("location", location.trim());
    formData.set("yearsExperience", yearsExperience || "0");
    formData.set("primaryExpertise", primaryExpertise);
    formData.set("secondaryExpertise", secondaryExpertise.join(","));
    formData.set("languages", languages.join(","));
    formData.set("consultationCategories", secondaryExpertise.concat(primaryExpertise).join(","));
    formData.set("about", about.trim());
    formData.set("qualifications", qualifications.trim());
    formData.set("socialProfile", socialProfile.trim());
    formData.set("preferredFormats", preferredFormats.join(","));
    formData.set("resume", resume);

    setSubmitting(true);
    try {
      const res = await fetch("/api/astrologer-applications", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data && data.error) || "Something went wrong submitting your application.");
        setSubmitting(false);
        return;
      }
      setSubmittedId(data.id);
    } catch {
      setError("Network error — please check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (submittedId) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-md text-center">
          <LotusIcon className="mx-auto h-10 w-10 text-nav-gold" strokeWidth={1.3} />
          <h1 className="mt-4 font-serif text-2xl text-nav-violet sm:text-3xl">Application Received</h1>
          <p className="mt-3 text-sm leading-relaxed text-nav-plum/75">
            Thank you for applying to join TrueLoger as an astrologer. Our team will review your application and
            get back to you by email. Your application is now marked <strong>Pending Review</strong>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
            <LotusIcon className="h-6 w-6 text-nav-gold" strokeWidth={1.3} />
            <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
          </div>
          <h1 className="mt-4 font-serif text-[1.75rem] leading-tight text-nav-violet sm:text-3xl">
            Register as an Astrologer
          </h1>
          <p className="mt-2 text-sm text-nav-plum/70">Join TrueLoger&apos;s team of consultants and share your expertise.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-6 rounded-2xl border border-nav-lavender-line bg-white p-5 shadow-[0_10px_26px_-18px_rgba(70,40,120,0.3)] sm:p-7">
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <fieldset className="flex flex-col gap-4">
            <legend className="font-serif text-lg text-nav-plum">Personal Information</legend>
            <div>
              <label htmlFor="fullName" className={fieldLabelClass}>Full Name</label>
              <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={`mt-1.5 ${fieldInputClass}`} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className={fieldLabelClass}>Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={`mt-1.5 ${fieldInputClass}`} />
              </div>
              <div>
                <label htmlFor="phone" className={fieldLabelClass}>Phone</label>
                <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className={`mt-1.5 ${fieldInputClass}`} />
              </div>
            </div>
            <div>
              <label htmlFor="location" className={fieldLabelClass}>Location</label>
              <input id="location" value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="City, State" className={`mt-1.5 ${fieldInputClass}`} />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-4 border-t border-nav-lavender-line pt-5">
            <legend className="font-serif text-lg text-nav-plum">Professional Information</legend>
            <div>
              <label htmlFor="years" className={fieldLabelClass}>Years of Experience</label>
              <input id="years" type="number" min={0} max={70} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} required className={`mt-1.5 ${fieldInputClass}`} />
            </div>
            <div>
              <label htmlFor="primaryExpertise" className={fieldLabelClass}>Primary Expertise</label>
              <select
                id="primaryExpertise"
                value={primaryExpertise}
                onChange={(e) => setPrimaryExpertise(e.target.value)}
                required
                className={`mt-1.5 ${fieldInputClass}`}
              >
                <option value="">Select…</option>
                {EXPERTISE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <p className={fieldLabelClass}>Secondary Expertise (optional)</p>
              <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-xl border border-nav-lavender-line p-2 sm:grid-cols-3">
                {EXPERTISE_OPTIONS.filter((o) => o !== primaryExpertise).map((opt) => (
                  <Checkbox key={opt} label={opt} checked={secondaryExpertise.includes(opt)} onChange={() => toggle(secondaryExpertise, setSecondaryExpertise, opt)} />
                ))}
              </div>
            </div>
            <div>
              <p className={fieldLabelClass}>Languages</p>
              <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-xl border border-nav-lavender-line p-2 sm:grid-cols-4">
                {LANGUAGE_SUGGESTIONS.map((lang) => (
                  <Checkbox key={lang} label={lang} checked={languages.includes(lang)} onChange={() => toggle(languages, setLanguages, lang)} />
                ))}
              </div>
            </div>
            <div>
              <p className={fieldLabelClass}>Preferred Consultation Formats</p>
              <div className="mt-1.5 flex flex-wrap gap-1 rounded-xl border border-nav-lavender-line p-2">
                {CONSULTATION_FORMATS.map((fmt) => (
                  <Checkbox key={fmt} label={fmt} checked={preferredFormats.includes(fmt)} onChange={() => toggle(preferredFormats, setPreferredFormats, fmt)} />
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="about" className={fieldLabelClass}>About You</label>
              <textarea
                id="about"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                required
                rows={4}
                placeholder="Tell us about your background and approach to consultations…"
                className={`mt-1.5 ${fieldInputClass} min-h-24 resize-y`}
              />
            </div>
            <div>
              <label htmlFor="qualifications" className={fieldLabelClass}>Qualifications / Certifications (optional)</label>
              <input id="qualifications" value={qualifications} onChange={(e) => setQualifications(e.target.value)} className={`mt-1.5 ${fieldInputClass}`} />
            </div>
            <div>
              <label htmlFor="social" className={fieldLabelClass}>Social / Professional Profile (optional)</label>
              <input id="social" value={socialProfile} onChange={(e) => setSocialProfile(e.target.value)} placeholder="LinkedIn, website, etc." className={`mt-1.5 ${fieldInputClass}`} />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2 border-t border-nav-lavender-line pt-5">
            <legend className="font-serif text-lg text-nav-plum">Resume</legend>
            <label htmlFor="resume" className={fieldLabelClass}>Upload Resume (PDF, DOC, or DOCX — max 5MB)</label>
            <input
              id="resume"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setResume(e.target.files?.[0] ?? null)}
              required
              className="mt-1.5 min-h-11 w-full rounded-xl border border-nav-lavender-line bg-nav-pearl px-3 py-2 text-sm text-nav-plum file:mr-3 file:rounded-full file:border-0 file:bg-nav-amethyst file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
            />
            {resume && <p className={fieldHintTextClass}>{resume.name} ({Math.round(resume.size / 1024)} KB)</p>}
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-11 w-full items-center justify-center rounded-full bg-nav-amethyst px-6 py-3 text-sm font-medium tracking-wide text-white shadow-[0_4px_14px_rgba(90,55,140,0.28)] transition-colors duration-200 hover:bg-nav-amethyst-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Application"}
          </button>
        </form>
      </div>
    </main>
  );
}
