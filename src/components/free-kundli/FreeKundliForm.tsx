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
import { PlanetaryTable } from "@/components/reports/PlanetaryTable";
import { InterpretationCard } from "@/components/reports/InterpretationCard";
import { InsightCard } from "@/components/reports/InsightCard";
import { KundliChartIcon } from "@/components/quick-services/icons";
import { BirthChartCard } from "@/components/charts/BirthChartCard";
import type { FreeKundliApiResponse } from "./types";

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

/** Runs the exact same validators the server re-runs — see
 * src/app/api/free-kundli/route.ts (via src/lib/astrology/birth-request.ts).
 * Only name / date of birth / time of birth (unless unknown) / city are
 * blocking; state and country are soft, non-blocking notices. */
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

export function FreeKundliForm() {
  const [values, setValues] = useState<BirthDetailsValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<BirthDetailsErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<FreeKundliApiResponse | null>(null);

  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  async function generate() {
    setStatus("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/free-kundli", {
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
      const data = (await res.json()) as FreeKundliApiResponse | { error: string };

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
      // Move focus to the result heading once generated — accessibility
      // requirement: a screen-reader user submitting the form should
      // land on the new content, not stay on a now-stale form.
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
    return <LoadingState message="Calculating your birth chart…" />;
  }

  if (status === "error") {
    return (
      <ErrorState message={errorMessage} onRetry={() => void generate()} onBack={() => setStatus("idle")} />
    );
  }

  if (status === "success" && result) {
    const {
      calculated,
      planetaryRows,
      chart,
      navamsaChart,
      yogas,
      planetaryStrength,
      houseStrength,
      report,
      reportError,
    } = result;
    const presentYogas = yogas.filter((y) => y.present);

    return (
      <div className="space-y-8">
        <h1 ref={resultHeadingRef} tabIndex={-1} className="sr-only">
          Your Free Kundli
        </h1>

        <ResultHeader
          title="Your Free Kundli"
          subtitle={values.name.trim() ? `For ${values.name.trim()}` : undefined}
          Icon={KundliChartIcon}
        />

        {calculated.timeUnknown && (
          <p
            role="alert"
            className="mx-auto max-w-xl rounded-xl border border-nav-lavender-line bg-nav-lavender-mist px-4 py-3 text-center text-xs leading-relaxed text-nav-plum/80 sm:text-sm"
          >
            Your exact birth time wasn&apos;t provided, so this reading used a default time of
            12:00. The Ascendant and every house placement below are therefore approximate —
            provide your exact birth time for an accurate chart.
          </p>
        )}

        <SummaryCard heading="At a Glance">
          <dl className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.12em] text-nav-amethyst">
                Ascendant
              </dt>
              <dd className="mt-1 font-serif text-xl text-nav-plum">{calculated.ascendant.sign}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.12em] text-nav-amethyst">
                Moon Sign
              </dt>
              <dd className="mt-1 font-serif text-xl text-nav-plum">
                {calculated.moonSign ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.12em] text-nav-amethyst">
                Nakshatra
              </dt>
              <dd className="mt-1 font-serif text-xl text-nav-plum">
                {calculated.moonNakshatra
                  ? `${calculated.moonNakshatra}${calculated.moonNakshatraPada ? ` (Pada ${calculated.moonNakshatraPada})` : ""}`
                  : "—"}
              </dd>
            </div>
          </dl>
        </SummaryCard>

        {/* Real, locally-computed structured chart data rendered as a
            real React SVG component — never third-party markup, so
            there's nothing here to sanitize. BirthChartCard is the one
            shared entry point for every chart style. */}
        <BirthChartCard ascendantSign={chart.ascendantSign} planets={chart.planets} />

        <div>
          <h2 className="mb-3 font-serif text-lg text-nav-plum">Planetary Positions</h2>
          <PlanetaryTable rows={planetaryRows} caption="Planetary positions, houses, and degrees" />
        </div>

        {/* D9 Navamsa — the chart traditionally consulted for marriage and
            a planet's deeper strength, real placements only. */}
        <div>
          <h2 className="mb-1 font-serif text-lg text-nav-plum">Navamsa (D9) Chart</h2>
          <p className="mb-3 text-xs text-nav-plum/60">
            Each planet&rsquo;s Navamsa placement — traditionally consulted for marriage and a
            planet&rsquo;s deeper strength.
          </p>
          <BirthChartCard ascendantSign={navamsaChart.ascendantSign} planets={navamsaChart.planets} />
        </div>

        {/* Yogas — real detected/not-detected data only, no invented
            interpretation. Only the hits are listed; the full checked
            set is in the API response for anyone who needs it. */}
        <div>
          <h2 className="mb-1 font-serif text-lg text-nav-plum">Yogas</h2>
          <p className="mb-3 text-xs text-nav-plum/60">
            Classical planetary combinations this chart was checked against.
          </p>
          {presentYogas.length > 0 ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {presentYogas.map((y) => (
                <li
                  key={y.id}
                  className="rounded-xl border border-nav-lavender-line bg-nav-pearl px-4 py-2.5 text-sm text-nav-plum"
                >
                  <span className="font-medium">{y.name}</span>
                  {y.strength && (
                    <span className="ml-1.5 text-xs uppercase tracking-wide text-nav-plum/60">
                      ({y.strength})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-nav-plum/70">
              None of the classical yogas this engine checks for were detected in this chart.
            </p>
          )}
        </div>

        {/* Shadbala — core/simplified classical planetary strength, not
            a full BPHS reproduction (see src/lib/astro-engine/shadbala.ts).
            Real computed Rupas only, never an interpretive score. */}
        <div>
          <h2 className="mb-1 font-serif text-lg text-nav-plum">Planetary Strength (Shadbala)</h2>
          <p className="mb-3 text-xs text-nav-plum/60">
            A simplified core version of the classical six-fold strength system, for the 7
            classical planets. &ldquo;Meets requirement&rdquo; compares each planet&rsquo;s total
            against its own classical minimum.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {planetaryStrength.map((s) => (
              <li
                key={s.planet}
                className="flex items-center justify-between rounded-xl border border-nav-lavender-line bg-nav-pearl px-4 py-2.5 text-sm text-nav-plum"
              >
                <span className="font-medium">{s.planet}</span>
                <span className="text-xs text-nav-plum/70">
                  {s.totalRupas.toFixed(1)} / {s.requiredRupas} Rupas
                  {s.meetsRequirement ? " ✓" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bhava Bala — core/simplified classical house strength, not a
            full BPHS reproduction (see src/lib/astro-engine/bhavabala.ts).
            Real computed strength totals only, never an interpretive
            score. */}
        <div>
          <h2 className="mb-1 font-serif text-lg text-nav-plum">House Strength (Bhava Bala)</h2>
          <p className="mb-3 text-xs text-nav-plum/60">
            A simplified core version of the classical house-strength system, for all 12
            whole-sign houses counted from the Ascendant.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {houseStrength.map((h) => (
              <li
                key={h.house}
                className="flex items-center justify-between rounded-xl border border-nav-lavender-line bg-nav-pearl px-4 py-2.5 text-sm text-nav-plum"
              >
                <span className="font-medium">
                  House {h.house} <span className="text-xs text-nav-plum/60">({h.houseLord})</span>
                </span>
                <span className="text-xs text-nav-plum/70">{h.totalStrength.toFixed(1)}</span>
              </li>
            ))}
          </ul>
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
                <h2 className="font-serif text-lg text-nav-plum">Recommendations</h2>
                {report.recommendations.map((r) => (
                  <InsightCard key={r} text={r} />
                ))}
              </div>
            )}
          </div>
        )}

        {reportError && (
          <p className="text-center text-sm text-nav-plum/60">
            Your calculated chart above is accurate. We couldn&apos;t generate the extended
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
            Generate another chart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="free-kundli-form" className="mx-auto max-w-xl">
      <BirthDetailsForm
        values={values}
        onChange={setValues}
        errors={errors}
        requireTime
        onSubmit={handleSubmit}
        submitLabel="Generate My Kundli"
        idPrefix="free-kundli"
      />
    </div>
  );
}
