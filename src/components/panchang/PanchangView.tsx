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
import { Calendar, Clock, Moon, PartyPopper, Star, Sunrise, Sunset } from "lucide-react";
import { LotusIcon, NakshatraStarsIcon } from "@/components/quick-services/icons";
import { LoadingState } from "@/components/reports/LoadingState";
import { ErrorState } from "@/components/reports/ErrorState";
import type { DailyPanchang, HoraEntry, ChoghadiyaEntry, TimeWindow } from "@/lib/panchang/calculate";
import type { FestivalEvent } from "@/lib/panchang/festivals";

type PanchangApiResponse = {
  date: string;
  source: string;
  generatedAt: string;
  engineVersion: string;
  sunrise: string; // ISO
  sunset: string; // ISO
  panchang: DailyPanchang;
  festivals: FestivalEvent[];
};

type Status = "idle" | "loading" | "error" | "success" | "not-found";

// ---------------------------------------------------------------------
// Local time-formatting helpers — no date library. Every timestamp this
// engine returns is a real ISO instant (UTC); this page renders
// everything back in IST (Asia/Kolkata, UTC+5:30 flat — a Panchang
// feature is inherently current-era, so no historical-offset table is
// needed here, unlike birth-chart timezone handling).
// ---------------------------------------------------------------------

const IST_OFFSET_MS = 5.5 * 3600 * 1000;

/** Shifts an ISO instant by the IST offset so its UTC-* fields read as
 * IST wall-clock fields directly — avoids a date library for a single
 * fixed offset. */
function toIstWallClock(iso: string): Date {
  return new Date(new Date(iso).getTime() + IST_OFFSET_MS);
}

function istDatePart(iso: string): string {
  const d = toIstWallClock(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

function formatClockTime(iso: string): string {
  const d = toIstWallClock(iso);
  const hours24 = d.getUTCHours();
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes} ${period}`;
}

/** Formats a tithi/nakshatra/yoga/karana boundary, flagging when it
 * falls on the day after the Panchang being viewed — these can and do
 * complete after midnight. */
function formatCompletion(iso: string, referenceDate: string): string {
  const time = formatClockTime(iso);
  return istDatePart(iso) !== referenceDate ? `${time} (next day)` : time;
}

function formatWindow(window: TimeWindow): string {
  return `${formatClockTime(window.startsAt)} – ${formatClockTime(window.endsAt)}`;
}

function timeOfDayMinutes(iso: string): number {
  const d = toIstWallClock(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
}

/** Whether `window` contains `nowMinutes` (minutes since IST midnight),
 * tolerating windows that cross midnight (end < start). */
function isCurrentWindow(window: TimeWindow, nowMinutes: number): boolean {
  const start = timeOfDayMinutes(window.startsAt);
  const end = timeOfDayMinutes(window.endsAt);
  if (end >= start) return nowMinutes >= start && nowMinutes < end;
  return nowMinutes >= start || nowMinutes < end;
}

function todayIstIso(): string {
  return istDatePart(new Date().toISOString());
}

function addDaysIso(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
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
// slide into view" convention.
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

const FESTIVAL_CATEGORY_LABEL: Record<FestivalEvent["category"], string> = {
  "major-festival": "Festival",
  vrat: "Vrat",
  ekadashi: "Ekadashi",
  sankranti: "Sankranti",
  regional: "Regional",
};

// ---------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------

/** Panchang tool — date only, no personal birth data and no city input.
 * Fetches `/api/panchang?date=` (GET, backed by a locally-computed
 * archive — see src/lib/panchang/store.ts) and renders the real
 * returned Panchang for the fixed reference location (New Delhi).
 * Auto-loads once on mount with today's date. The date field lets a
 * visitor browse the archive up to a year in either direction — past
 * dates for history, future dates to look up an upcoming
 * festival/vrat's exact date in advance. */
export function PanchangView() {
  const [dateInput, setDateInput] = useState(todayIstIso());
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<PanchangApiResponse | null>(null);
  const hasAutoFetched = useRef(false);

  async function generate(date: string) {
    setStatus("loading");
    setErrorMessage("");
    try {
      const params = new URLSearchParams({ date });
      const res = await fetch(`/api/panchang?${params.toString()}`);
      const data = (await res.json()) as PanchangApiResponse | { error: string };

      if (res.status === 404) {
        setStatus("not-found");
        return;
      }

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

  useEffect(() => {
    if (hasAutoFetched.current) return;
    hasAutoFetched.current = true;
    void generate(dateInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!dateInput) return;
    void generate(dateInput);
  }

  const today = todayIstIso();
  const maxDate = addDaysIso(today, 365);
  const minDate = "1900-01-01";
  const isToday = result?.date === today;
  const nowMinutes = timeOfDayMinutes(new Date().toISOString());

  const horaList: HoraEntry[] = result?.panchang.hora ?? [];
  const choghadiyaList: ChoghadiyaEntry[] = result?.panchang.choghadiya ?? [];

  const currentHora = isToday ? horaList.find((h) => isCurrentWindow(h, nowMinutes)) : undefined;
  const currentChoghadiya = isToday
    ? choghadiyaList.find((c) => isCurrentWindow(c, nowMinutes))
    : undefined;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Reference-location note + date picker for browsing the archive */}
      <p className="mx-auto max-w-xl text-center text-xs text-nav-plum/60">
        Panchang shown for New Delhi, India Standard Time — available from 1900 up to a year ahead.
      </p>
      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-4 flex max-w-xs flex-col gap-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="panchang-date" className="block text-sm font-medium text-nav-plum">
            Date
          </label>
          <input
            id="panchang-date"
            type="date"
            value={dateInput}
            min={minDate}
            max={maxDate}
            onChange={(e) => setDateInput(e.target.value)}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-nav-lavender-line bg-nav-pearl px-4 py-2.5 text-nav-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst"
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

      {status === "loading" && <LoadingState message="Reading the Panchang…" />}

      {status === "error" && (
        <div className="mt-10">
          <ErrorState message={errorMessage} onRetry={() => void generate(dateInput)} />
        </div>
      )}

      {status === "not-found" && (
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-nav-lavender-line bg-nav-pearl/60 p-6 text-center">
          <p className="text-sm text-nav-plum/70">
            Panchang for this date isn&rsquo;t available in our archive.
          </p>
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
              <p className="mt-1 text-sm text-nav-plum/70">Panchang for {result.source}</p>
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

          {/* Festivals/vrats on this date */}
          {result.festivals.length > 0 && (
            <RevealCard>
              <div className="rounded-2xl border border-nav-gold/40 bg-nav-lavender-mist/60 p-5">
                <div className="flex items-center gap-2 text-nav-amethyst-deep">
                  <PartyPopper aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                  <p className="text-sm font-medium">
                    {result.festivals.length > 1 ? "Festivals & vrats today" : "Today"}
                  </p>
                </div>
                <ul className="mt-2 space-y-2">
                  {result.festivals.map((f, i) => (
                    <li key={`${f.date}-${f.name}-${i}`} className="text-sm text-nav-plum">
                      <span className="font-medium">{f.name}</span>{" "}
                      <span className="text-xs uppercase tracking-wide text-nav-plum/60">
                        ({FESTIVAL_CATEGORY_LABEL[f.category]})
                      </span>
                      {f.description && <p className="mt-0.5 text-xs text-nav-plum/70">{f.description}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealCard>
          )}

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
                  detail={`Until ${formatCompletion(result.panchang.tithi.endsAt, result.date)}`}
                />
              </RevealCard>
              <RevealCard delayMs={60}>
                <CoreCard icon={Calendar} label="Vara" title={result.panchang.vara.name} sub={`Lord: ${result.panchang.vara.lord}`} />
              </RevealCard>
              <RevealCard delayMs={120}>
                <CoreCard
                  icon={NakshatraStarsIcon}
                  label="Nakshatra"
                  title={result.panchang.nakshatra.name}
                  sub={`Pada ${result.panchang.nakshatra.pada}`}
                  detail={`Until ${formatCompletion(result.panchang.nakshatra.endsAt, result.date)}`}
                />
              </RevealCard>
              <RevealCard delayMs={180}>
                <CoreCard
                  icon={Star}
                  label="Yoga"
                  title={result.panchang.yoga.name}
                  detail={`Until ${formatCompletion(result.panchang.yoga.endsAt, result.date)}`}
                />
              </RevealCard>
              <RevealCard delayMs={240}>
                <CoreCard
                  icon={Clock}
                  label="Karana"
                  title={result.panchang.karana.name}
                  detail={`Until ${formatCompletion(result.panchang.karana.endsAt, result.date)}`}
                />
              </RevealCard>
            </div>
          </section>

          {/* Auspicious timings — honest gap notice, nothing fabricated */}
          <RevealCard>
            <div className="flex items-start gap-3 rounded-2xl border border-dashed border-nav-lavender-line bg-nav-pearl/60 p-4">
              <Star aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-nav-amethyst/70" strokeWidth={1.5} />
              <p className="text-xs leading-relaxed text-nav-plum/60">
                Abhijit Muhurat, Amrit Kaal, Brahma Muhurat, Dur Muhurat and Varjyam aren&apos;t computed by
                this engine yet, so they&apos;re intentionally left out rather than estimated. Coming soon.
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
