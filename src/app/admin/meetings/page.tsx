"use client";

// src/app/admin/meetings/page.tsx
// Admin meeting list — sorted upcoming-first. A full month/week/day
// calendar view is a larger follow-up (needs a calendar UI library +
// design pass); this list already surfaces everything the spec's
// "click a meeting -> see customer/service/date/time/status/order"
// requirement needs, just not in calendar-grid form yet.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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

export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [state, setState] = useState<LoadState>({ status: "loading" });

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

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Meetings</h1>
        <p className="mt-1.5 text-sm text-nav-plum/70">All booked consultations, upcoming first.</p>
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
      {state.status === "ready" && meetings.length === 0 && (
        <p className="rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/70">
          No meetings yet.
        </p>
      )}

      {state.status === "ready" && meetings.length > 0 && (
        <ul className="flex flex-col gap-3">
          {meetings.map((m) => (
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
    </div>
  );
}
