"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type FormEvent,
  type ReactNode,
  type SVGProps,
} from "react";
import { Calendar, Clock, Moon, Star, Sunrise, Sunset } from "lucide-react";
import { LotusIcon, NakshatraStarsIcon } from "@/components/quick-services/icons";
import { LoadingState } from "@/components/reports/LoadingState";
import { ErrorState } from "@/components/reports/ErrorState";
import type {
  DurMuhuratResult,
  PanchangResult,
  TimeWindow,
  VarjyamResult,
} from "@/lib/astrology/types";

type PanchangApiResponse = {
  date: string;
  city: string;
  sunrise: string;
  sunset: string;
  panchang: PanchangResult;
};

type Status = "idle" | "loading" | "error" | "success";

const DEFAULT_CITY = "New Delhi";

// ---------------------------------------------------------------------
// Local time-formatting helpers — no date library. Every raw string
// this page formats is either bare "H:mm:ss" (sunrise/sunset) or
// "YYYY-MM-DD HH:mm:ss[.ffffff]" (everything else), per PanchangResult's
// field docs in src/lib/astrology/types.ts.
// ---------------------------------------------------------------------

function formatClockTime(raw: string): string {
  const timePart = raw.includes(" ") ? raw.split(" ")[1] : raw;
  const match = /^(\d{1,2}):(\d{2}):(\d{2})/.exec(timePart ?? "");
  if (!match) return raw;
  const hours24 = Number(match[1]);
  const minutes = match[2];
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes} ${period}`;
}

/** Formats a completion timestamp (tithi/nakshatra/yoga/karana boundary),
 * flagging when it falls on the day after the Panchang being viewed —
 * these can and do complete after midnight. */
function formatCompletion(raw: string, referenceDate: string): string {
  const [datePart, timePart] = raw.includes(" ") ? raw.split(" ") : [referenceDate, raw];
  const time = formatClockTime(timePart ?? raw);
  return datePart && datePart !== referenceDate ? `${time} (next day)` : time;
}

function formatWindow(window: TimeWindow): string {
  return `${formatClockTime(window.starts_at)} – ${formatClockTime(window.ends_at)}`;
}

/** dur-muhurat/varjyam can each come back as one {starts_at,ends_at}
 * window or several under numeric string keys — normalize to an array
 * either way (real API quirk, documented on DurMuhuratResult/
 * VarjyamResult in types.ts). */
function normalizeWindows(value: DurMuhuratResult | VarjyamResult): TimeWindow[] {
  if (typeof value === "object" && value !== null && "starts_at" in value && "ends_at" in value) {
    return [value as TimeWindow];
  }
  return Object.values(value as Record<string, TimeWindow>);
}

function sortedByKey<T>(record: Record<string, T>): T[] {
  return Object.keys(record)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => record[key]);
}

function timeOfDayMinutes(raw: string): number | null {
  const timePart = raw.includes(" ") ? raw.split(" ")[1] : raw;
  const match = /^(\d{1,2}):(\d{2}):(\d{2})/.exec(timePart ?? "");
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]) + Number(match[3]) / 60;
}

/** Whether `window` contains `nowMinutes` (minutes since local midnight),
 * tolerating windows that cross midnight (end < start). */
function isCurrentWindow(window: TimeWindow, nowMinutes: number): boolean {
  const start = timeOfDayMinutes(window.starts_at);
  const end = timeOfDayMinutes(window.ends_at);
  if (start === null || end === null) return false;
  if (end >= start) return nowMinutes >= start && nowMinutes < end;
  return nowMinutes >= start || nowMinutes < end;
}

function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------
// Reveal-on-mount wrapper — this codebase's established "cards fade/
// slide into view" convention (see TestimonialsSection.tsx / globals.css
// .testimonial-marquee-track's reduced-motion guard), reimplemented with
// a plain CSS transition instead of a scroll-linked marquee since this
// page's cards mount all at once after a fetch rather than scrolling
// into view. prefers-reduced-motion resolves to the final state
// immediately, with no transition and no flash.
// ---------------------------------------------------------------------

function RevealCard({
  children,
  delayMs = 0,
  className = "",
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  // Lazy initializer, not an effect: a reduced-motion viewer starts
  // already-visible, so no synchronous setState-in-effect ever fires for
  // that path (and no flash of invisible content either).
  const [visible, setVisible] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (visible) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [visible]);

  return (
    <div
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------

function CoreCard({
  icon: Icon,
  label,
  title,
  detail,
  sub,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  title: string;
  detail?: string;
  sub?: string;
}) {
  return (
    <div className="h-full rounded-2xl border border-nav-lavender-line bg-nav-pearl p-5 shadow-[0_10px_26px_-18px_rgba(70,40,120,0.35)] transition-transform duration-300 motion-safe:hover:-translate-y-1">
      <div className="flex items-center gap-2 text-nav-amethyst">
        <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
        <p className="text-xs font-medium uppercase tracking-[0.12em]">{label}</p>
      </div>
      <p className="mt-2 font-serif text-lg leading-snug text-nav-plum">{title}</p>
      {detail && <p className="mt-1 text-sm text-nav-plum/80">{detail}</p>}
      {sub && <p className="mt-1 text-xs text-nav-plum/60">{sub}</p>}
    </div>
  );
}

function WindowCard({ label, window }: { label: string; window: TimeWindow }) {
  return (
    <div className="rounded-2xl border border-nav-lavender-line bg-nav-pearl p-4">
      <p className="text-xs font-medium uppercase tracking-[0.1em] text-nav-amethyst-deep">{label}</p>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-nav-plum">
        <Clock aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.5} />
        {formatWindow(window)}
      </p>
    </div>
  );
}

function TimeStrip<T extends TimeWindow>({
  entries,
  isToday,
  nowMinutes,
  renderLabel,
}: {
  entries: T[];
  isToday: boolean;
  nowMinutes: number;
  renderLabel: (entry: T) => string;
}) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2" style={{ scrollbarWidth: "thin" }}>
      {entries.map((entry, i) => {
        const current = isToday && isCurrentWindow(entry, nowMinutes);
        return (
          <div
            key={i}
            className={`flex shrink-0 flex-col items-center gap-1 rounded-xl border px-3.5 py-2.5 text-center ${
              current
                ? "border-nav-amethyst bg-nav-lavender-soft motion-safe:animate-pulse motion-reduce:animate-none"
                : "border-nav-lavender-line bg-nav-pearl"
            }`}
          >
            <span className={`text-sm font-medium ${current ? "text-nav-amethyst-deep" : "text-nav-plum"}`}>
              {renderLabel(entry)}
            </span>
            <span className="whitespace-nowrap text-xs text-nav-plum/60">{formatWindow(entry)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------

/** Panchang tool — date + city only, no personal birth data. Fetches
 * `/api/panchang` (GET, cacheable) and renders the real returned
 * PanchangResult. Auto-loads once on mount with today's date + a
 * default city so the page "just works" immediately; the form above the
 * results lets a visitor change either and re-fetch. */
export function PanchangView() {
  const [dateInput, setDateInput] = useState(todayISO());
  const [cityInput, setCityInput] = useState(DEFAULT_CITY);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<PanchangApiResponse | null>(null);
  const hasAutoFetched = useRef(false);

  async function generate(date: string, city: string) {
    setStatus("loading");
    setErrorMessage("");
    try {
      const params = new URLSearchParams({ date, city });
      const res = await fetch(`/api/panchang?${params.toString()}`);
      const data = (await res.json()) as PanchangApiResponse | { error: string };

      if (!res.ok || "error" in data) {
        setErrorMessage(
          "error" in data
            ? data.error
            : "We couldn't fetch the Panchang right now. Please try again."
        );
        setStatus("error");
        return;
      }

      setResult(data);
      setStatus("success");
    } catch {
      setErrorMessage("We couldn't fetch the Panchang right now. Please try again.");
      setStatus("error");
    }
  }

  // Auto-load once on mount with the default date + city — a visitor
  // sees a real, useful Panchang immediately without filling anything in.
  useEffect(() => {
    if (hasAutoFetched.current) return;
    hasAutoFetched.current = true;
    void generate(dateInput, cityInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedCity = cityInput.trim();
    if (!trimmedCity || !dateInput) return;
    void generate(dateInput, trimmedCity);
  }

  const isToday = result?.date === todayISO();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

  const yogaList = result ? sortedByKey(result.panchang.yoga) : [];
  const karanaList = result ? sortedByKey(result.panchang.karana) : [];
  const horaList = result ? sortedByKey(result.panchang.hora) : [];
  const choghadiyaList = result ? sortedByKey(result.panchang.choghadiya) : [];
  const durMuhuratWindows = result ? normalizeWindows(result.panchang.durMuhurat) : [];
  const varjyamWindows = result ? normalizeWindows(result.panchang.varjyam) : [];

  const currentHora = isToday ? horaList.find((h) => isCurrentWindow(h, nowMinutes)) : undefined;
  const currentChoghadiya = isToday
    ? choghadiyaList.find((c) => isCurrentWindow(c, nowMinutes))
    : undefined;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Date + city form */}
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex max-w-xl flex-col gap-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="panchang-date" className="block text-sm font-medium text-nav-plum">
            Date
          </label>
          <input
            id="panchang-date"
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-nav-lavender-line bg-nav-pearl px-4 py-2.5 text-nav-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="panchang-city" className="block text-sm font-medium text-nav-plum">
            City
          </label>
          <input
            id="panchang-city"
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="e.g. Mumbai"
            maxLength={80}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-nav-lavender-line bg-nav-pearl px-4 py-2.5 text-nav-plum placeholder:text-nav-plum/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl disabled:opacity-60"
        >
          Show Panchang
        </button>
      </form>

      {status === "loading" && <LoadingState message="Reading today&rsquo;s Panchang…" />}

      {status === "error" && (
        <div className="mt-10">
          <ErrorState message={errorMessage} onRetry={() => void generate(dateInput, cityInput)} />
        </div>
      )}

      {status === "success" && result && (
        <div className="mt-10 space-y-12">
          {/* Header: date + sunrise/sunset */}
          <RevealCard>
            <div className="rounded-3xl border border-nav-lavender-line bg-gradient-to-b from-nav-pearl to-nav-lavender-mist p-6 text-center shadow-[0_16px_40px_-24px_rgba(70,40,120,0.4)] sm:p-8">
              <div className="flex items-center justify-center gap-3">
                <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
                <LotusIcon className="h-6 w-6 text-nav-amethyst-deep" strokeWidth={1.3} />
                <span className="h-px w-8 bg-nav-lavender-line" aria-hidden="true" />
              </div>
              <h2 className="mt-3 font-serif text-2xl text-nav-plum sm:text-3xl">
                {formatDisplayDate(result.date)}
              </h2>
              <p className="mt-1 text-sm text-nav-plum/70">Panchang for {result.city}</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-nav-plum">
                  <Sunrise aria-hidden="true" className="h-5 w-5 text-nav-gold" strokeWidth={1.5} />
                  <span className="text-sm">Sunrise {formatClockTime(result.sunrise)}</span>
                </div>
                <div className="flex items-center gap-2 text-nav-plum">
                  <Sunset aria-hidden="true" className="h-5 w-5 text-nav-amethyst-deep" strokeWidth={1.5} />
                  <span className="text-sm">Sunset {formatClockTime(result.sunset)}</span>
                </div>
              </div>
            </div>
          </RevealCard>

          {/* Core five */}
          <section aria-labelledby="panchang-core-heading">
            <h3 id="panchang-core-heading" className="font-serif text-xl text-nav-plum">
              The Five Elements
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <RevealCard delayMs={0}>
                <CoreCard
                  icon={Moon}
                  label="Tithi"
                  title={result.panchang.tithi.name}
                  sub={result.panchang.tithi.paksha === "shukla" ? "Shukla Paksha" : "Krishna Paksha"}
                  detail={`Until ${formatCompletion(result.panchang.tithi.completes_at, result.date)}`}
                />
              </RevealCard>
              <RevealCard delayMs={60}>
                <CoreCard
                  icon={Calendar}
                  label="Vara"
                  title={result.panchang.weekday.vedic_weekday_name}
                  sub={result.panchang.weekday.weekday_name}
                />
              </RevealCard>
              <RevealCard delayMs={120}>
                <CoreCard
                  icon={NakshatraStarsIcon}
                  label="Nakshatra"
                  title={result.panchang.nakshatra.name}
                  detail={`Until ${formatCompletion(result.panchang.nakshatra.ends_at, result.date)}`}
                />
              </RevealCard>
              <RevealCard delayMs={180}>
                <CoreCard
                  icon={Star}
                  label="Yoga"
                  title={yogaList[0]?.name ?? "—"}
                  detail={
                    yogaList[0] ? `Until ${formatCompletion(yogaList[0].completion, result.date)}` : undefined
                  }
                  sub={yogaList.length > 1 ? `+${yogaList.length - 1} more later today` : undefined}
                />
              </RevealCard>
              <RevealCard delayMs={240}>
                <CoreCard
                  icon={Clock}
                  label="Karana"
                  title={karanaList[0]?.name ?? "—"}
                  detail={
                    karanaList[0]
                      ? `Until ${formatCompletion(karanaList[0].completion, result.date)}`
                      : undefined
                  }
                  sub={karanaList.length > 1 ? `+${karanaList.length - 1} more later today` : undefined}
                />
              </RevealCard>
            </div>
          </section>

          {/* Auspicious timings — honest gap notice, nothing fabricated */}
          <RevealCard>
            <div className="flex items-start gap-3 rounded-2xl border border-dashed border-nav-lavender-line bg-nav-pearl/60 p-4">
              <Star aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-nav-amethyst/70" strokeWidth={1.5} />
              <p className="text-xs leading-relaxed text-nav-plum/60">
                Additional auspicious timings — Abhijit Muhurat, Amrit Kaal and Brahma Muhurat — aren&apos;t
                available from this data source yet, so they&apos;re intentionally left out rather than
                estimated. Coming soon.
              </p>
            </div>
          </RevealCard>

          {/* Inauspicious / important timings */}
          <section aria-labelledby="panchang-timings-heading">
            <h3 id="panchang-timings-heading" className="font-serif text-xl text-nav-plum">
              Inauspicious &amp; Important Timings
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <RevealCard delayMs={0}>
                <WindowCard label="Rahu Kalam" window={result.panchang.rahuKalam} />
              </RevealCard>
              <RevealCard delayMs={40}>
                <WindowCard label="Yama Gandam" window={result.panchang.yamaGandam} />
              </RevealCard>
              <RevealCard delayMs={80}>
                <WindowCard label="Gulika Kalam" window={result.panchang.gulikaKalam} />
              </RevealCard>
              {durMuhuratWindows.map((w, i) => (
                <RevealCard key={`dur-muhurat-${i}`} delayMs={120 + i * 30}>
                  <WindowCard
                    label={durMuhuratWindows.length > 1 ? `Dur Muhurat ${i + 1}` : "Dur Muhurat"}
                    window={w}
                  />
                </RevealCard>
              ))}
              {varjyamWindows.map((w, i) => (
                <RevealCard key={`varjyam-${i}`} delayMs={120 + (durMuhuratWindows.length + i) * 30}>
                  <WindowCard label={varjyamWindows.length > 1 ? `Varjyam ${i + 1}` : "Varjyam"} window={w} />
                </RevealCard>
              ))}
            </div>
          </section>

          {/* Hora */}
          <section aria-labelledby="panchang-hora-heading">
            <h3 id="panchang-hora-heading" className="font-serif text-xl text-nav-plum">
              Hora
            </h3>
            {currentHora && (
              <p className="mt-1 text-sm text-nav-plum/70">
                Current hora: <span className="font-medium text-nav-amethyst-deep">{currentHora.lord}</span>{" "}
                ({formatWindow(currentHora)})
              </p>
            )}
            <div className="mt-3">
              <TimeStrip
                entries={horaList}
                isToday={isToday}
                nowMinutes={nowMinutes}
                renderLabel={(h) => h.lord}
              />
            </div>
          </section>

          {/* Choghadiya */}
          <section aria-labelledby="panchang-choghadiya-heading">
            <h3 id="panchang-choghadiya-heading" className="font-serif text-xl text-nav-plum">
              Choghadiya
            </h3>
            {currentChoghadiya && (
              <p className="mt-1 text-sm text-nav-plum/70">
                Current choghadiya:{" "}
                <span className="font-medium text-nav-amethyst-deep">{currentChoghadiya.name}</span> (
                {formatWindow(currentChoghadiya)})
              </p>
            )}
            <div className="mt-3">
              <TimeStrip
                entries={choghadiyaList}
                isToday={isToday}
                nowMinutes={nowMinutes}
                renderLabel={(c) => c.name}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
