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
import { ScoreCard } from "@/components/reports/ScoreCard";
import { SummaryCard } from "@/components/reports/SummaryCard";
import { KootaBreakdownTable } from "@/components/reports/KootaBreakdownTable";
import { InterpretationCard } from "@/components/reports/InterpretationCard";
import { InsightCard } from "@/components/reports/InsightCard";
import { KundliMatchIcon } from "@/components/quick-services/icons";
import { buildKootaRows } from "@/lib/astrology/ashtakoot-view";
import type { CompatibilityApiResponse } from "./types";

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

/** Runs the exact same validators the server re-runs (see
 * src/lib/astrology/match-request.ts) for ONE person's fields — the
 * page calls this twice, once per BirthDetailsForm instance. Only
 * name / date of birth / time of birth (unless unknown) / city are
 * blocking; state and country are soft, non-blocking notices. */
function validatePerson(values: BirthDetailsValues): BirthDetailsErrors {
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

/** A short, plain-language summary line derived from the SAME real
 * total_score/out_of the Kundli Matching tool shows — just narrated for
 * this tool's relationship-dynamics framing instead of a traditional
 * marriage-matching verdict. Deterministic, not AI-generated, so it can
 * never contradict the real number shown right below it. */
function plainLanguageSummary(totalScore: number, outOf: number): string {
  const pct = outOf > 0 ? totalScore / outOf : 0;
  if (pct >= 32 / 36) {
    return "The chart comparison points to a naturally easy, well-aligned connection across most areas.";
  }
  if (pct >= 25 / 36) {
    return "The chart comparison points to a generally strong connection, with a few areas worth extra attention.";
  }
  if (pct >= 18 / 36) {
    return "The chart comparison shows a workable connection — some real strengths, alongside a few areas that may take more conscious effort.";
  }
  return "The chart comparison shows several areas of natural friction — not a verdict on the relationship, but a map of where extra understanding may help.";
}

const submitButtonClass =
  "flex min-h-11 w-full items-center justify-center rounded-full bg-nav-amethyst px-6 py-3 text-sm font-medium tracking-wide text-white shadow-[0_4px_14px_rgba(90,55,140,0.28)] transition-colors duration-200 hover:bg-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

export function CompatibilityForm() {
  const [valuesA, setValuesA] = useState<BirthDetailsValues>(EMPTY_VALUES);
  const [valuesB, setValuesB] = useState<BirthDetailsValues>(EMPTY_VALUES);
  const [errorsA, setErrorsA] = useState<BirthDetailsErrors>({});
  const [errorsB, setErrorsB] = useState<BirthDetailsErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<CompatibilityApiResponse | null>(null);

  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  async function generate() {
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/compatibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personA: {
            name: valuesA.name,
            dateOfBirth: valuesA.dateOfBirth,
            timeOfBirth: valuesA.timeOfBirth,
            timeUnknown: valuesA.timeUnknown,
            city: valuesA.city,
            state: valuesA.state,
            country: valuesA.country,
          },
          personB: {
            name: valuesB.name,
            dateOfBirth: valuesB.dateOfBirth,
            timeOfBirth: valuesB.timeOfBirth,
            timeUnknown: valuesB.timeUnknown,
            city: valuesB.city,
            state: valuesB.state,
            country: valuesB.country,
          },
        }),
      });
      const data = (await res.json()) as CompatibilityApiResponse | { error: string };

      if (!res.ok || "error" in data) {
        setErrorMessage(
          "error" in data
            ? data.error
            : "We couldn't complete this reading right now. Please try again."
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
      setErrorMessage("We couldn't complete this reading right now. Please try again.");
      setStatus("error");
    }
  }

  /** Validates BOTH people, then submits — the single combined action
   * both BirthDetailsForm instances' onSubmit AND the one visible
   * submit button below call. */
  async function submitBoth() {
    const nextErrorsA = validatePerson(valuesA);
    const nextErrorsB = validatePerson(valuesB);
    setErrorsA(nextErrorsA);
    setErrorsB(nextErrorsB);
    if (hasBlockingError(nextErrorsA) || hasBlockingError(nextErrorsB)) return;
    await generate();
  }

  function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void submitBoth();
  }

  if (status === "loading") {
    return <LoadingState message="Comparing your charts…" />;
  }

  if (status === "error") {
    return (
      <ErrorState
        message={errorMessage}
        onRetry={() => void submitBoth()}
        onBack={() => setStatus("idle")}
      />
    );
  }

  if (status === "success" && result) {
    const { result: ashtakoot, timeUnknown, report, reportError } = result;
    const kootaRows = buildKootaRows(ashtakoot);
    const yourName = valuesA.name.trim();
    const partnerName = valuesB.name.trim();

    return (
      <div className="space-y-8">
        <h1 ref={resultHeadingRef} tabIndex={-1} className="sr-only">
          Your Compatibility Reading
        </h1>

        <ResultHeader
          title="Your Compatibility Reading"
          subtitle={yourName && partnerName ? `${yourName} & ${partnerName}` : undefined}
          Icon={KundliMatchIcon}
        />

        {/* Plain-language summary leads, as this tool's framing intends —
            but it's a deterministic sentence derived from the same real
            score below it, never a separate invented verdict. */}
        <SummaryCard
          heading="At a Glance"
          body={plainLanguageSummary(ashtakoot.total_score, ashtakoot.out_of)}
        />

        <ScoreCard
          label="Compatibility Score"
          score={ashtakoot.total_score}
          maxScore={ashtakoot.out_of}
          description="Calculated from the real Vedic Ashtakoot comparison between both birth charts."
        />

        <div className="space-y-3">
          <h2 className="font-serif text-lg text-nav-plum">Compatibility Breakdown</h2>
          <KootaBreakdownTable rows={kootaRows} personALabel="You" personBLabel="Partner" />
        </div>

        {timeUnknown && (
          <p className="text-center text-xs text-nav-plum/60">
            An exact birth time wasn&apos;t provided for at least one of you, so this reading used
            a default time of 12:00. Several factors above depend on the Moon&apos;s exact
            position and can shift with a more precise birth time.
          </p>
        )}

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
                <h2 className="font-serif text-lg text-nav-plum">Suggestions</h2>
                {report.recommendations.map((r) => (
                  <InsightCard key={r} text={r} />
                ))}
              </div>
            )}
          </div>
        )}

        {reportError && (
          <p className="text-center text-sm text-nav-plum/60">
            Your calculated compatibility score above is accurate. We couldn&apos;t generate the
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
            Check another pairing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="compatibility-form" className="mx-auto max-w-2xl space-y-8">
      <p className="text-center text-xs text-nav-plum/60">
        This reading is calculated using traditional Vedic astrological matching, which compares
        a male and a female birth chart — exact birth time helps accuracy for both of you.
      </p>

      <div className="space-y-4">
        <h2 className="font-serif text-xl text-nav-plum">Your Details</h2>
        {/* showSubmitButton=false on both instances — this page renders
            ONE combined submit button below, wired to submitBoth(). Each
            instance's onSubmit is still wired to the same combined
            handler as a safety net for any native form-submit path. */}
        <BirthDetailsForm
          values={valuesA}
          onChange={setValuesA}
          errors={errorsA}
          requireTime
          onSubmit={handleFormSubmit}
          idPrefix="person-a"
          showSubmitButton={false}
        />
      </div>

      <div className="space-y-4 border-t border-nav-lavender-line pt-8">
        <h2 className="font-serif text-xl text-nav-plum">Partner&apos;s Details</h2>
        <BirthDetailsForm
          values={valuesB}
          onChange={setValuesB}
          errors={errorsB}
          requireTime
          onSubmit={handleFormSubmit}
          idPrefix="person-b"
          showSubmitButton={false}
        />
      </div>

      <div className="text-center">
        <button type="button" onClick={() => void submitBoth()} className={submitButtonClass}>
          See Our Compatibility
        </button>
      </div>
    </div>
  );
}
