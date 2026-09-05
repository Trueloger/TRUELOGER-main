"use client";

import { useRef, useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import {
  BirthDetailsForm,
  type BirthDetailsValues,
  type BirthDetailsErrors,
} from "@/components/forms/BirthDetailsForm";
import { validateName } from "@/components/forms/NameField";
import { validateDateOfBirth } from "@/components/forms/DateOfBirthField";
import { validateTimeOfBirth } from "@/components/forms/TimeOfBirthField";
import { validatePlaceOfBirth } from "@/components/forms/PlaceOfBirthField";
import { LoadingState } from "@/components/reports/LoadingState";
import { ErrorState } from "@/components/reports/ErrorState";
import { ResultHeader } from "@/components/reports/ResultHeader";
import { SummaryCard } from "@/components/reports/SummaryCard";
import { InterpretationCard } from "@/components/reports/InterpretationCard";
import { InsightCard } from "@/components/reports/InsightCard";
import { ScoreCard } from "@/components/reports/ScoreCard";
import { BirthChartCard } from "@/components/charts/BirthChartCard";
import { SaturnGlyphIcon } from "@/components/quick-services/icons";
import type { SadeSatiApiResponse } from "./types";
import type { SadeSatiPhase } from "@/lib/astrology/derive";

const EMPTY_VALUES: BirthDetailsValues = {
  name: "",
  gender: "",
  dateOfBirth: "",
  timeOfBirth: "",
  timeUnknown: false,
  city: "",
  state: "",
  country: "",
};

type Status = "idle" | "loading" | "error" | "success";

const PHASE_LABELS: Record<SadeSatiPhase, string> = {
  rising: "Rising",
  peak: "Peak",
  setting: "Setting",
};

const PHASE_STEP: Record<SadeSatiPhase, number> = {
  rising: 1,
  peak: 2,
  setting: 3,
};

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

const PHASE_DESCRIPTIONS: Record<SadeSatiPhase, string> = {
  rising:
    "Saturn is transiting the sign before your natal Moon — traditionally the opening phase, easing the chart into the cycle.",
  peak: "Saturn is transiting your natal Moon sign itself — traditionally the most emphasized phase of the cycle.",
  setting:
    "Saturn is transiting the sign after your natal Moon — traditionally the closing phase, as the cycle winds down.",
};

/** Runs the exact same validators the server re-runs — see
 * src/app/api/sade-sati/route.ts. Only name / date of birth / time of
 * birth (unless unknown) / city are blocking; state and country are
 * soft, non-blocking notices (handled by validatePlaceOfBirth itself). */
function validateAll(values: BirthDetailsValues): BirthDetailsErrors {
  const errors: BirthDetailsErrors = {};

  const nameError = validateName(values.name);
  if (nameError) errors.name = nameError;

  const dobError = validateDateOfBirth(values.dateOfBirth);
  if (dobError) errors.dateOfBirth = dobError;

  if (!values.timeUnknown) {
    const timeError = validateTimeOfBirth(values.timeOfBirth);
    if (timeError) errors.timeOfBirth = timeError;
  }

  const placeErrors = validatePlaceOfBirth(values);
  if (placeErrors.city) errors.city = placeErrors.city;
  if (placeErrors.state) errors.state = placeErrors.state;
  if (placeErrors.country) errors.country = placeErrors.country;

  return errors;
}

function hasBlockingError(errors: BirthDetailsErrors): boolean {
  return Boolean(errors.name || errors.dateOfBirth || errors.timeOfBirth || errors.city);
}

export function SadeSatiForm() {
  const [values, setValues] = useState<BirthDetailsValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<BirthDetailsErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<SadeSatiApiResponse | null>(null);

  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  async function generate() {
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/sade-sati", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          dateOfBirth: values.dateOfBirth,
          timeOfBirth: values.timeOfBirth,
          timeUnknown: values.timeUnknown,
          city: values.city,
          state: values.state,
          country: values.country,
        }),
      });
      const data = (await res.json()) as SadeSatiApiResponse | { error: string };

      if (!res.ok || "error" in data) {
        setErrorMessage(
          "error" in data
            ? data.error
            : "We couldn't complete your reading right now. Please try again."
        );
        setStatus("error");
        return;
      }

      setResult(data);
      setStatus("success");
      requestAnimationFrame(() => resultHeadingRef.current?.focus());
    } catch {
      setErrorMessage("We couldn't complete your reading right now. Please try again.");
      setStatus("error");
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors = validateAll(values);
    setErrors(nextErrors);
    if (hasBlockingError(nextErrors)) return;
    void generate();
  }

  if (status === "loading") {
    return <LoadingState message="Checking your chart for Sade Sati…" />;
  }

  if (status === "error") {
    return (
      <ErrorState message={errorMessage} onRetry={() => void generate()} onBack={() => setStatus("idle")} />
    );
  }

  if (status === "success" && result) {
    const { calculated, chart, timeUnknown, report, reportError, nextSaturnSignChange } = result;
    const phase = calculated.phase;

    return (
      <div className="space-y-8">
        <h1 ref={resultHeadingRef} tabIndex={-1} className="sr-only">
          Your Sade Sati Reading
        </h1>

        <ResultHeader
          title="Your Sade Sati Reading"
          subtitle={values.name.trim() ? `For ${values.name.trim()}` : undefined}
          Icon={SaturnGlyphIcon}
        />

        {/* The real, calculated status — always shown as plain fact,
            never only inside the AI-generated prose below. */}
        <div className="rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-nav-pearl to-nav-lavender-mist p-6 text-center shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] sm:p-8">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.15em] text-nav-amethyst">
            Sade Sati Status
          </p>
          <p className="mt-3 font-serif text-2xl text-nav-plum sm:text-3xl">
            {calculated.active && phase
              ? `Currently active — ${PHASE_LABELS[phase]} phase`
              : "Not currently active"}
          </p>
          {nextSaturnSignChange && (
            <p className="mx-auto mt-3 max-w-md text-xs text-nav-plum/60">
              Saturn remains in {SIGN_NAMES[nextSaturnSignChange.fromSign - 1]} until{" "}
              {new Date(nextSaturnSignChange.ingressUtc).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              , when it moves into {SIGN_NAMES[nextSaturnSignChange.toSign - 1]}.
            </p>
          )}
          {timeUnknown && (
            <p className="mx-auto mt-3 max-w-md text-xs text-nav-plum/60">
              Your exact birth time wasn&apos;t provided, so this reading used a default time of
              12:00. Providing your exact birth time can refine accuracy.
            </p>
          )}
        </div>

        {calculated.active && phase && (
          <ScoreCard
            label="Sade Sati Phase Progress"
            score={PHASE_STEP[phase]}
            maxScore={3}
            description={PHASE_DESCRIPTIONS[phase]}
          />
        )}

        <div className="space-y-3">
          <h2 className="font-serif text-lg text-nav-plum">Birth Chart</h2>
          <BirthChartCard ascendantSign={chart.ascendantSign} planets={chart.planets} />
        </div>

        {report && (
          <div className="space-y-4">
            <SummaryCard heading="Overview" body={report.summary} />

            {report.sections.map((section) => (
              <InterpretationCard key={section.title} title={section.title} content={section.content} />
            ))}

            {report.highlights.length > 0 && (
              <div className="space-y-2">
                <h2 className="font-serif text-lg text-nav-plum">Highlights</h2>
                {report.highlights.map((h) => (
                  <InsightCard key={h} icon={Sparkles} text={h} />
                ))}
              </div>
            )}

            {report.recommendations.length > 0 && (
              <div className="space-y-2">
                <h2 className="font-serif text-lg text-nav-plum">Traditional Remedies &amp; Context</h2>
                {report.recommendations.map((r) => (
                  <InsightCard key={r} text={r} />
                ))}
              </div>
            )}
          </div>
        )}

        {reportError && (
          <p className="text-center text-sm text-nav-plum/60">
            Your calculated Sade Sati status above is accurate. We couldn&apos;t generate the
            extended interpretation right now — please try again shortly for the full reading.
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
            Check another chart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="sade-sati-form" className="mx-auto max-w-xl">
      <BirthDetailsForm
        values={values}
        onChange={setValues}
        errors={errors}
        requireTime
        onSubmit={handleSubmit}
        submitLabel="Check My Chart"
        idPrefix="sade-sati"
      />
    </div>
  );
}
