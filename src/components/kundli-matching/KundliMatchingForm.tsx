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
import { KootaBreakdownTable } from "@/components/reports/KootaBreakdownTable";
import { SummaryCard } from "@/components/reports/SummaryCard";
import { InterpretationCard } from "@/components/reports/InterpretationCard";
import { InsightCard } from "@/components/reports/InsightCard";
import { KundliMatchIcon } from "@/components/quick-services/icons";
import { buildKootaRows } from "@/lib/astrology/ashtakoot-view";
import { BirthChartCard } from "@/components/charts/BirthChartCard";
import type { KundliMatchingApiResponse } from "./types";

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

/** Traditional verdict banding for the total /36 score — presentational
 * only; matches the wording the AI prompt is told to use (see
 * src/app/api/kundli-matching/route.ts) so the two never contradict
 * each other. */
function verdictFor(totalScore: number): string {
  if (totalScore >= 32) return "Excellent match";
  if (totalScore >= 25) return "Favorable match";
  if (totalScore >= 18) return "Acceptable match";
  return "Traditionally considered weak";
}

const submitButtonClass =
  "flex min-h-11 w-full items-center justify-center rounded-full bg-nav-amethyst px-6 py-3 text-sm font-medium tracking-wide text-white shadow-[0_4px_14px_rgba(90,55,140,0.28)] transition-colors duration-200 hover:bg-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

export function KundliMatchingForm() {
  const [valuesA, setValuesA] = useState<BirthDetailsValues>(EMPTY_VALUES);
  const [valuesB, setValuesB] = useState<BirthDetailsValues>(EMPTY_VALUES);
  const [errorsA, setErrorsA] = useState<BirthDetailsErrors>({});
  const [errorsB, setErrorsB] = useState<BirthDetailsErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<KundliMatchingApiResponse | null>(null);

  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  async function generate() {
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/kundli-matching", {
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
      const data = (await res.json()) as KundliMatchingApiResponse | { error: string };

      if (!res.ok || "error" in data) {
        setErrorMessage(
          "error" in data
            ? data.error
            : "We couldn't complete this match right now. Please try again."
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
      setErrorMessage("We couldn't complete this match right now. Please try again.");
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
    return <LoadingState message="Calculating the Guna Milan score…" />;
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
    const { result: ashtakoot, timeUnknown, report, reportError, brideChart, groomChart } = result;
    const kootaRows = buildKootaRows(ashtakoot);
    const brideName = valuesA.name.trim();
    const groomName = valuesB.name.trim();

    return (
      <div className="space-y-8">
        <h1 ref={resultHeadingRef} tabIndex={-1} className="sr-only">
          Your Kundli Matching Report
        </h1>

        <ResultHeader
          title="Your Kundli Matching Report"
          subtitle={brideName && groomName ? `${brideName} & ${groomName}` : undefined}
          Icon={KundliMatchIcon}
        />

        <ScoreCard
          label="Guna Milan Score"
          score={ashtakoot.totalScore}
          maxScore={ashtakoot.outOf}
          description={`${verdictFor(ashtakoot.totalScore)} — traditional Ashtakoot guidance, not a guarantee of relationship success or failure.`}
        />

        <div className="space-y-6">
          <h2 className="font-serif text-lg text-nav-plum">Birth Charts</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="space-y-2 text-center">
              <h3 className="text-sm font-medium text-nav-amethyst">Bride</h3>
              <BirthChartCard ascendantSign={brideChart.ascendantSign} planets={brideChart.planets} />
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-sm font-medium text-nav-amethyst">Groom</h3>
              <BirthChartCard ascendantSign={groomChart.ascendantSign} planets={groomChart.planets} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-serif text-lg text-nav-plum">Guna Milan Breakdown</h2>
          <KootaBreakdownTable rows={kootaRows} personALabel="Bride" personBLabel="Groom" />
        </div>

        {timeUnknown && (
          <p className="text-center text-xs text-nav-plum/60">
            An exact birth time wasn&apos;t provided for at least one chart, so this reading used
            a default time of 12:00. Several kootas (Tara, Yoni, Gana, Bhakoot, Nadi) depend on
            the Moon&apos;s exact position and can shift with a more precise birth time.
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
                <h2 className="font-serif text-lg text-nav-plum">Traditional Guidance</h2>
                {report.recommendations.map((r) => (
                  <InsightCard key={r} text={r} />
                ))}
              </div>
            )}
          </div>
        )}

        {reportError && (
          <p className="text-center text-sm text-nav-plum/60">
            Your calculated Guna Milan score above is accurate. We couldn&apos;t generate the
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
            Check another match
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="kundli-matching-form" className="mx-auto max-w-2xl space-y-8">
      <p className="text-center text-xs text-nav-plum/60">
        Traditional Vedic Kundli Matching (Ashtakoot / Guna Milan) is calculated from a male and a
        female birth chart — exact birth time helps accuracy for both.
      </p>

      <div className="space-y-4">
        <h2 className="font-serif text-xl text-nav-plum">Bride&apos;s Details</h2>
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
        <h2 className="font-serif text-xl text-nav-plum">Groom&apos;s Details</h2>
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
          Check Compatibility
        </button>
      </div>
    </div>
  );
}
