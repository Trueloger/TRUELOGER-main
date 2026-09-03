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
import { Timeline } from "@/components/reports/Timeline";
import { InterpretationCard } from "@/components/reports/InterpretationCard";
import { InsightCard } from "@/components/reports/InsightCard";
import { BirthChartCard } from "@/components/charts/BirthChartCard";
import { parseApiDate } from "@/lib/dasha/format";
import type { DashaApiResponse } from "./types";

const INITIAL_VALUES: BirthDetailsValues = {
  name: "",
  gender: "",
  dateOfBirth: "",
  timeOfBirth: "",
  timeUnknown: false,
  city: "",
  state: "",
  country: "",
};

/** Human-readable date from the API's "YYYY-MM-DD HH:mm:ss[.ffffff]"
 * strings — display only, never used for comparison logic (that lives
 * in src/lib/dasha/format.ts, already applied server-side). */
function formatDisplayDate(apiDate: string): string {
  return parseApiDate(apiDate).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function validateAll(values: BirthDetailsValues): BirthDetailsErrors {
  const errors: BirthDetailsErrors = {};

  const nameError = validateName(values.name);
  if (nameError) errors.name = nameError;

  const dobError = validateDateOfBirth(values.dateOfBirth);
  if (dobError) errors.dateOfBirth = dobError;

  // Time is only blocking when the user hasn't flagged it unknown — an
  // unknown time still proceeds (server defaults to 12:00 and the result
  // UI discloses the accuracy caveat).
  if (!values.timeUnknown) {
    const timeError = validateTimeOfBirth(values.timeOfBirth);
    if (timeError) errors.timeOfBirth = timeError;
  }

  const placeErrors = validatePlaceOfBirth({
    city: values.city,
    state: values.state,
    country: values.country,
  });
  // city is blocking (checked below); state/country are soft notices —
  // PlaceOfBirthField already renders them as non-blocking hint text.
  if (placeErrors.city) errors.city = placeErrors.city;
  if (placeErrors.state) errors.state = placeErrors.state;
  if (placeErrors.country) errors.country = placeErrors.country;

  return errors;
}

type Status = "idle" | "loading" | "error" | "success";

export function DashaForm() {
  const [values, setValues] = useState<BirthDetailsValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<BirthDetailsErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [result, setResult] = useState<DashaApiResponse | null>(null);

  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  async function generate() {
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/dasha", {
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
      const data = (await res.json()) as DashaApiResponse | { error: string };

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
    const validationErrors = validateAll(values);
    setErrors(validationErrors);
    if (validationErrors.name || validationErrors.dateOfBirth || validationErrors.timeOfBirth || validationErrors.city) {
      return;
    }
    void generate();
  }

  if (status === "loading") {
    return <LoadingState message="Calculating your dasha timeline…" />;
  }

  if (status === "error") {
    return (
      <ErrorState message={errorMessage} onRetry={() => void generate()} onBack={() => setStatus("idle")} />
    );
  }

  if (status === "success" && result) {
    const currentLord = result.currentMahaDasha?.lord ?? null;

    return (
      <div className="space-y-8">
        <h1 ref={resultHeadingRef} tabIndex={-1} className="sr-only">
          Your Vimshottari Dasha Timeline
        </h1>

        <ResultHeader
          title="Your Vimshottari Dasha Timeline"
          subtitle={`For ${values.name.trim()}`}
        />

        {result.timeUnknown && (
          <div className="rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3.5 text-sm leading-relaxed text-amber-900">
            <strong className="font-semibold">Birth time wasn&apos;t provided</strong> — a
            default of 12:00 PM was used. Dasha start dates depend on the Moon&apos;s exact
            position at birth, so without your real birth time the dates below could shift by
            weeks or even months. For an accurate timeline, come back with your exact time of
            birth.
          </div>
        )}

        <SummaryCard heading="Current Dasha">
          <div className="space-y-1.5">
            <p className="font-serif text-xl text-nav-plum">
              {currentLord ? `${currentLord} Mahadasha` : "Not available"}
            </p>
            <p className="text-sm text-nav-violet/80">
              {result.currentAntarDasha
                ? `${result.currentAntarDasha.lord} Antardasha`
                : "Antardasha currently unavailable"}
            </p>
          </div>
        </SummaryCard>

        <div>
          <h2 className="mb-4 font-serif text-lg text-nav-plum">Mahadasha Timeline</h2>
          <Timeline
            items={result.mahaDashaTimeline.map((entry) => ({
              label: `${entry.lord} Mahadasha`,
              startDate: formatDisplayDate(entry.start_time),
              endDate: formatDisplayDate(entry.end_time),
              active: currentLord === entry.lord,
            }))}
          />
        </div>

        <div className="space-y-3">
          <h2 className="font-serif text-lg text-nav-plum">Birth Chart</h2>
          <BirthChartCard ascendantSign={result.chart.ascendantSign} planets={result.chart.planets} />
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
            Your calculated dasha timeline above is accurate. We couldn&apos;t generate the
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
            Calculate another reading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="dasha-form">
      <BirthDetailsForm
        values={values}
        onChange={setValues}
        errors={errors}
        requireTime
        onSubmit={handleSubmit}
        submitLabel="Generate My Dasha Timeline"
      />
    </div>
  );
}
