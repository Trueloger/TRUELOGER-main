"use client";

import { useRef, useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { LoadingState } from "@/components/reports/LoadingState";
import { ErrorState } from "@/components/reports/ErrorState";
import { ResultHeader } from "@/components/reports/ResultHeader";
import { InterpretationCard } from "@/components/reports/InterpretationCard";
import { InsightCard } from "@/components/reports/InsightCard";
import type {
  NumerologyApiResponse,
  NumerologyCalculated,
} from "./types";

// Self-contained validation — this tool only needs name + DOB (unlike the
// other 9 wave-2 tools, which need time/place/gender too and share
// BirthDetailsForm), so it deliberately doesn't pull in that shared
// component. Mirrors the server-side checks in
// src/app/api/numerology/route.ts exactly.
const MIN_BIRTH_YEAR = 1900;

function validateName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Please enter your full name.";
  if (!/[a-zA-Z]/.test(trimmed)) return "Full name must include letters.";
  return null;
}

function validateDob(value: string): string | null {
  if (!value) return "Please enter your date of birth.";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "Please enter a valid date of birth.";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!isRealDate) return "Please enter a valid date of birth.";

  const maxYear = new Date().getFullYear();
  if (year < MIN_BIRTH_YEAR || year > maxYear) {
    return `Year of birth must be between ${MIN_BIRTH_YEAR} and ${maxYear}.`;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) return "Date of birth cannot be in the future.";

  return null;
}

const NUMBER_LABELS: { key: keyof NumerologyCalculated; label: string }[] = [
  { key: "lifePathNumber", label: "Life Path Number" },
  { key: "destinyNumber", label: "Destiny Number" },
  { key: "soulUrgeNumber", label: "Soul Urge Number" },
  { key: "personalityNumber", label: "Personality Number" },
  { key: "birthNumber", label: "Birth Number" },
];

type Status = "idle" | "loading" | "error" | "success";

export function NumerologyForm() {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [dobError, setDobError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [result, setResult] = useState<NumerologyApiResponse | null>(null);

  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  async function generate() {
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/numerology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, dateOfBirth: dob }),
      });
      const data = (await res.json()) as NumerologyApiResponse | { error: string };

      if (!res.ok || "error" in data) {
        setErrorMessage(
          "error" in data ? data.error : "We couldn't complete your reading right now. Please try again."
        );
        setStatus("error");
        return;
      }

      setResult(data);
      setStatus("success");
      // Move focus to the result heading once generated — accessibility
      // requirement: a screen-reader user submitting the form should land
      // on the new content, not stay on a now-stale form.
      requestAnimationFrame(() => resultHeadingRef.current?.focus());
    } catch {
      setErrorMessage("We couldn't complete your reading right now. Please try again.");
      setStatus("error");
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nErr = validateName(name);
    const dErr = validateDob(dob);
    setNameError(nErr);
    setDobError(dErr);
    if (nErr || dErr) return;
    void generate();
  }

  if (status === "loading") {
    return <LoadingState message="Calculating your numbers…" />;
  }

  if (status === "error") {
    return (
      <ErrorState
        message={errorMessage}
        onRetry={() => void generate()}
        backHref="#numerology-form"
      />
    );
  }

  if (status === "success" && result) {
    return (
      <div className="space-y-8">
        <h1
          ref={resultHeadingRef}
          tabIndex={-1}
          className="sr-only"
        >
          Your Numerology Reading
        </h1>

        <ResultHeader
          title="Your Numerology Reading"
          subtitle={`For ${name.trim()}`}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {NUMBER_LABELS.map(({ key, label }) => {
            const value = result.calculated[key];
            const meaning = result.meanings[key];
            return (
              <div
                key={key}
                className="rounded-2xl border border-nav-lavender-line bg-nav-pearl p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-nav-amethyst to-nav-amethyst-deep font-serif text-lg font-semibold text-white">
                    {value}
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.1em] text-nav-amethyst">
                      {label}
                    </p>
                    <p className="font-serif text-base text-nav-plum">{meaning.title}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-nav-plum/80">{meaning.meaning}</p>
              </div>
            );
          })}
        </div>

        {result.report && (
          <div className="space-y-4">
            {result.report.summary && (
              <div className="rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-nav-pearl to-nav-lavender-mist p-6 shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)]">
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.15em] text-nav-amethyst">
                  Overview
                </p>
                <p className="mt-3 text-[1.05rem] leading-relaxed text-nav-violet">
                  {result.report.summary}
                </p>
              </div>
            )}

            {result.report.sections.map((section) => (
              <InterpretationCard key={section.title} title={section.title} content={section.content} />
            ))}

            {result.report.highlights.length > 0 && (
              <div className="space-y-2">
                <h2 className="font-serif text-lg text-nav-plum">Highlights</h2>
                {result.report.highlights.map((h) => (
                  <InsightCard key={h} icon={Sparkles} text={h} />
                ))}
              </div>
            )}

            {result.report.recommendations.length > 0 && (
              <div className="space-y-2">
                <h2 className="font-serif text-lg text-nav-plum">Recommendations</h2>
                {result.report.recommendations.map((r) => (
                  <InsightCard key={r} text={r} />
                ))}
              </div>
            )}
          </div>
        )}

        {result.reportError && (
          <p className="text-center text-sm text-nav-plum/60">
            Your calculated numbers above are accurate. We couldn&apos;t generate the extended
            interpretation right now — please try again shortly for the full reading.
          </p>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setResult(null);
            }}
            className="flex min-h-11 items-center justify-center rounded-full border border-nav-lavender-line px-6 py-2.5 text-sm font-medium text-nav-plum transition-colors hover:border-nav-amethyst/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl"
          >
            Calculate another reading
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      id="numerology-form"
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto max-w-md space-y-5"
    >
      <div>
        <label htmlFor="numerology-name" className="block text-sm font-medium text-nav-plum">
          Full Name
        </label>
        <input
          id="numerology-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "numerology-name-error" : undefined}
          className="mt-1.5 min-h-11 w-full rounded-xl border border-nav-lavender-line bg-nav-pearl px-4 py-2.5 text-nav-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst"
          placeholder="As given at birth"
        />
        {nameError && (
          <p id="numerology-name-error" className="mt-1.5 text-sm text-red-600">
            {nameError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="numerology-dob" className="block text-sm font-medium text-nav-plum">
          Date of Birth
        </label>
        <input
          id="numerology-dob"
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          min={`${MIN_BIRTH_YEAR}-01-01`}
          max={new Date().toISOString().slice(0, 10)}
          aria-invalid={dobError ? true : undefined}
          aria-describedby={dobError ? "numerology-dob-error" : undefined}
          className="mt-1.5 min-h-11 w-full rounded-xl border border-nav-lavender-line bg-nav-pearl px-4 py-2.5 text-nav-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst"
        />
        {dobError && (
          <p id="numerology-dob-error" className="mt-1.5 text-sm text-red-600">
            {dobError}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="flex min-h-11 w-full items-center justify-center rounded-full bg-nav-amethyst px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl"
      >
        Generate My Reading
      </button>
    </form>
  );
}
