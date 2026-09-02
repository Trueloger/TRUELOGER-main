"use client";

import { useRef, useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { LoadingState } from "@/components/reports/LoadingState";
import { ErrorState } from "@/components/reports/ErrorState";
import { ResultHeader } from "@/components/reports/ResultHeader";
import { InterpretationCard } from "@/components/reports/InterpretationCard";
import { InsightCard } from "@/components/reports/InsightCard";
import {
  BirthDetailsForm,
  type BirthDetailsValues,
  type BirthDetailsErrors,
} from "@/components/forms/BirthDetailsForm";
import { validateName } from "@/components/forms/NameField";
import { validateDateOfBirth } from "@/components/forms/DateOfBirthField";
import { validateTimeOfBirth } from "@/components/forms/TimeOfBirthField";
import { validatePlaceOfBirth } from "@/components/forms/PlaceOfBirthField";
import type { RashiApiResponse } from "./types";

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

/** Rashi (Moon sign) tool: BirthDetailsForm -> POST /api/rashi ->
 * loading/error/result. Mirrors NumerologyForm.tsx's flow, adapted to a
 * real external-API call and the shared birth-details form. Time of
 * birth is required (matters near a sign boundary); checking "I don't
 * know my exact birth time" defaults to noon and the result discloses
 * that. */
export function RashiForm() {
  const [values, setValues] = useState<BirthDetailsValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<BirthDetailsErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<RashiApiResponse | null>(null);

  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  function handleValuesChange(next: BirthDetailsValues) {
    // Toggling "I don't know my exact birth time" defaults to noon —
    // TimeOfBirthField itself doesn't decide this, the caller does.
    if (next.timeUnknown && !values.timeUnknown) {
      setValues({ ...next, timeOfBirth: "12:00" });
    } else if (!next.timeUnknown && values.timeUnknown) {
      setValues({ ...next, timeOfBirth: "" });
    } else {
      setValues(next);
    }
  }

  function validate(): boolean {
    const nextErrors: BirthDetailsErrors = {};

    const nameError = validateName(values.name);
    if (nameError) nextErrors.name = nameError;

    const dobError = validateDateOfBirth(values.dateOfBirth);
    if (dobError) nextErrors.dateOfBirth = dobError;

    if (!values.timeUnknown) {
      const timeError = validateTimeOfBirth(values.timeOfBirth);
      if (timeError) nextErrors.timeOfBirth = timeError;
    }

    const placeErrors = validatePlaceOfBirth(values);
    if (placeErrors.city) nextErrors.city = placeErrors.city;
    if (placeErrors.state) nextErrors.state = placeErrors.state;
    if (placeErrors.country) nextErrors.country = placeErrors.country;

    setErrors(nextErrors);
    return !(nextErrors.name || nextErrors.dateOfBirth || nextErrors.timeOfBirth || nextErrors.city);
  }

  async function generate() {
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/rashi", {
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
      const data = (await res.json()) as RashiApiResponse | { error: string };

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
      // Move focus to the result heading once generated — a screen-reader
      // user submitting the form should land on the new content.
      requestAnimationFrame(() => resultHeadingRef.current?.focus());
    } catch {
      setErrorMessage("We couldn't complete your reading right now. Please try again.");
      setStatus("error");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;
    void generate();
  }

  if (status === "loading") {
    return <LoadingState message="Reading the stars for your Rashi…" />;
  }

  if (status === "error") {
    return (
      <ErrorState
        message={errorMessage}
        onRetry={() => void generate()}
        onBack={() => setStatus("idle")}
      />
    );
  }

  if (status === "success" && result) {
    const { calculated } = result;
    return (
      <div className="space-y-8">
        <h1 ref={resultHeadingRef} tabIndex={-1} className="sr-only">
          Your Rashi Reading
        </h1>

        <ResultHeader
          title="Your Rashi"
          subtitle={`${calculated.signName} Moon, for ${values.name.trim()}`}
        />

        <div className="rounded-2xl border border-nav-lavender-line bg-nav-pearl p-6 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-nav-amethyst">
            Moon Sign
          </p>
          <p className="mt-1 font-serif text-3xl text-nav-plum">{calculated.signName}</p>
          {calculated.traits && (
            <p className="mx-auto mt-2 max-w-sm text-sm text-nav-plum/70">{calculated.traits}</p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-4 text-left sm:grid-cols-4">
            <div>
              <p className="text-[0.7rem] uppercase tracking-wide text-nav-plum/50">Element</p>
              <p className="text-sm text-nav-plum">{calculated.element ?? "—"}</p>
            </div>
            <div>
              <p className="text-[0.7rem] uppercase tracking-wide text-nav-plum/50">
                Ruling Planet
              </p>
              <p className="text-sm text-nav-plum">{calculated.rulingPlanet}</p>
            </div>
            <div>
              <p className="text-[0.7rem] uppercase tracking-wide text-nav-plum/50">Degree</p>
              <p className="text-sm text-nav-plum">{calculated.degreeInSign.toFixed(2)}°</p>
            </div>
            <div>
              <p className="text-[0.7rem] uppercase tracking-wide text-nav-plum/50">Nakshatra</p>
              <p className="text-sm text-nav-plum">
                {calculated.nakshatraName} (Pada {calculated.nakshatraPada})
              </p>
            </div>
          </div>
        </div>

        {calculated.timeUnknown && (
          <p className="text-center text-sm text-nav-plum/60">
            Your birth time wasn&apos;t provided, so we used noon (12:00) as a default. Near a
            sign boundary, an unknown birth time can shift the calculated Moon sign — for full
            accuracy, come back with your exact birth time if you learn it.
          </p>
        )}

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
              <InterpretationCard
                key={section.title}
                title={section.title}
                content={section.content}
              />
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
            Your calculated Rashi above is accurate. We couldn&apos;t generate the extended
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
    <div id="rashi-form" className="mx-auto max-w-md">
      <BirthDetailsForm
        values={values}
        onChange={handleValuesChange}
        errors={errors}
        showGender={false}
        requireTime={true}
        onSubmit={handleSubmit}
        submitLabel="Generate My Rashi"
        submitting={false}
      />
    </div>
  );
}
