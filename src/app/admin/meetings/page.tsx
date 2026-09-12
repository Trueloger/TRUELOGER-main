"use client";

// src/app/admin/meetings/page.tsx
// Admin meetings — a month-view calendar (click a day to filter the
// list below to it) plus the full upcoming-first list beneath. No
// calendar library — a plain CSS grid is enough for a month view and
// keeps this dependency-free.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { authedFetch } from "@/lib/auth/authed-fetch";
import type { Meeting, MeetingStatus } from "@/lib/meetings/types";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready" };

const STATUS_STYLES: Record<MeetingStatus, string> = {
  BOOKING_PENDING: "bg-nav-lavender-soft text-nav-amethyst-deep ring-1 ring-nav-lavender-line",
  MEETING_CREATION_PENDING: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  SCHEDULED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  RESCHEDULED: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  MEETING_CREATION_FAILED: "bg-red-50 text-red-700 ring-1 ring-red-200",
  CANCELLED: "bg-red-50 text-red-700 ring-1 ring-red-200",
  COMPLETED: "bg-nav-lavender-mist text-nav-plum/70 ring-1 ring-nav-lavender-line",
};

const DOT_COLOR: Record<MeetingStatus, string> = {
  BOOKING_PENDING: "bg-nav-amethyst-deep",
  MEETING_CREATION_PENDING: "bg-sky-500",
  SCHEDULED: "bg-emerald-500",
  RESCHEDULED: "bg-amber-500",
  MEETING_CREATION_FAILED: "bg-red-500",
  CANCELLED: "bg-red-500",
  COMPLETED: "bg-nav-plum/40",
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await authedFetch("/api/admin/meetings");
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { meetings: Meeting[] };
      setMeetings(data.meetings.sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)));
      setState({ status: "ready" });
    } catch {
      setState({ status: "error", message: "We couldn't load meetings right now." });
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  const meetingsByDate = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    for (const m of meetings) {
      const list = map.get(m.date) ?? [];
      list.push(m);
      map.set(m.date, list);
    }
    return map;
  }, [meetings]);

  const calendarCells = useMemo(() => {
    const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const startOffset = firstOfMonth.getDay(); // 0=Sun
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [viewMonth]);

  const visibleMeetings = selectedDate ? meetings.filter((m) => m.date === selectedDate) : meetings;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Meetings</h1>
        <p className="mt-1.5 text-sm text-nav-plum/70">Click a day to see its bookings, or scroll the full list below.</p>
      </header>

      {state.status === "loading" && (
        <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center">
          <span className="h-8 w-8 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
          <p className="text-sm text-nav-plum/70">Loading…</p>
        </div>
      )}
      {state.status === "error" && (
        <div role="alert" className="rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/80">
          {state.message}
        </div>
      )}

      {state.status === "ready" && (
        <>
          {/* Month calendar */}
          <div className="rounded-2xl border border-nav-lavender-line bg-white p-4 shadow-[0_1px_2px_rgba(70,40,120,0.04)] sm:p-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full text-nav-plum/70 hover:bg-nav-lavender-mist"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <p className="font-serif text-lg text-nav-violet">
                {viewMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </p>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full text-nav-plum/70 hover:bg-nav-lavender-mist"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-nav-plum/50">
              {WEEKDAY_LABELS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
              {calendarCells.map((d) => {
                const key = toDateKey(d);
                const inMonth = d.getMonth() === viewMonth.getMonth();
                const dayMeetings = meetingsByDate.get(key) ?? [];
                const isToday = key === toDateKey(new Date());
                const isSelected = selectedDate === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate((cur) => (cur === key ? null : key))}
                    className={`flex min-h-[52px] flex-col items-center gap-1 rounded-lg py-1.5 text-xs transition-colors sm:min-h-[64px] ${
                      isSelected
                        ? "bg-nav-amethyst text-white"
                        : inMonth
                          ? "text-nav-plum hover:bg-nav-lavender-mist"
                          : "text-nav-plum/25 hover:bg-nav-lavender-mist/50"
                    }`}
                  >
                    <span className={isToday && !isSelected ? "flex h-5 w-5 items-center justify-center rounded-full bg-nav-lavender-soft font-semibold text-nav-amethyst-deep" : ""}>
                      {d.getDate()}
                    </span>
                    {dayMeetings.length > 0 && (
                      <span className="flex gap-0.5">
                        {dayMeetings.slice(0, 3).map((m) => (
                          <span key={m.id} className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : DOT_COLOR[m.status]}`} />
                        ))}
                        {dayMeetings.length > 3 && <span className="text-[0.6rem]">+{dayMeetings.length - 3}</span>}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List — filtered to the selected day, or everything */}
          <div className="mt-6 flex items-center justify-between">
            <h2 className="font-serif text-lg text-nav-plum">
              {selectedDate ? `Bookings on ${selectedDate}` : "All Bookings"}
            </h2>
            {selectedDate && (
              <button type="button" onClick={() => setSelectedDate(null)} className="text-sm font-medium text-nav-amethyst-deep hover:underline">
                Clear filter
              </button>
            )}
          </div>

          {visibleMeetings.length === 0 && (
            <p className="mt-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/70">
              No meetings {selectedDate ? "on this day." : "yet."}
            </p>
          )}

          {visibleMeetings.length > 0 && (
            <ul className="mt-3 flex flex-col gap-3">
              {visibleMeetings.map((m) => (
                <li key={m.id} className="rounded-2xl border border-nav-lavender-line bg-white p-4 shadow-[0_1px_2px_rgba(70,40,120,0.04)] sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-nav-violet">{m.serviceName}</p>
                      <p className="mt-0.5 text-xs text-nav-plum/60">
                        {m.customerName} · {m.customerEmail}
                      </p>
                      <p className="mt-1 text-sm text-nav-plum">
                        {m.date} at {m.startTime} ({m.timezone}) · {m.durationMinutes} min
                      </p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium ${STATUS_STYLES[m.status]}`}>
                      {m.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link href={`/admin/orders/${m.orderId}`} className="text-sm font-medium text-nav-amethyst-deep hover:underline">
                      View Order
                    </Link>
                    {m.googleMeetUrl && (
                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(m.googleMeetUrl ?? "")}
                        className="text-sm font-medium text-nav-amethyst-deep hover:underline"
                      >
                        Copy Meeting Link
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
