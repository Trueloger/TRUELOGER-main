"use client";

// src/app/account/meetings/page.tsx
// Real scheduled-meeting records (src/lib/meetings/store.ts), created
// automatically when a consultation order is paid (see
// orders/store.ts's applyPaymentStatus). Google Meet/Calendar creation
// itself isn't connected yet (needs a one-time OAuth authorization),
// so every meeting today sits honestly in MEETING_CREATION_PENDING —
// this page shows that real status, never a fabricated "Join" link.
// The moment Meet creation is wired in, `googleMeetUrl` starts getting
// populated and the Join button appears automatically — no change
// needed here.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarClock, RefreshCw, Video } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { authedFetch } from "@/lib/auth/authed-fetch";
import type { Meeting, MeetingStatus } from "@/lib/meetings/types";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; meetings: Meeting[] };

const STATUS_LABELS: Record<MeetingStatus, string> = {
  BOOKING_PENDING: "Awaiting Payment",
  MEETING_CREATION_PENDING: "Preparing Your Meeting",
  SCHEDULED: "Scheduled",
  RESCHEDULED: "Rescheduled",
  MEETING_CREATION_FAILED: "Needs Attention",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

export default function MeetingsPage() {
  return (
    <ProtectedRoute>
      <MeetingsPageContent />
    </ProtectedRoute>
  );
}

function MeetingsPageContent() {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await authedFetch("/api/meetings");
      if (!res.ok) throw new Error("Failed to load meetings.");
      const data = (await res.json()) as { meetings: Meeting[] };
      setState({ status: "ready", meetings: data.meetings });
    } catch {
      setState({ status: "error", message: "We couldn't load your meetings right now. Please try again." });
    }
  }, []);

  const hasLoaded = useRef(false);
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    load();
  }, [load]);

  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      <div className="mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
        <header className="mb-8 md:mb-10">
          <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Your Meetings</h1>
          <p className="mt-1.5 text-sm text-nav-plum/70">Consultations you&apos;ve booked with TRUELOGER.</p>
        </header>

        {state.status === "loading" && <MeetingsLoading />}
        {state.status === "error" && <MeetingsError message={state.message} onRetry={load} />}
        {state.status === "ready" && state.meetings.length === 0 && <MeetingsEmpty />}
        {state.status === "ready" && state.meetings.length > 0 && (
          <ul className="flex flex-col gap-4">
            {state.meetings.map((meeting) => (
              <li key={meeting.id}>
                <MeetingCard meeting={meeting} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function MeetingsLoading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center">
      <span className="h-8 w-8 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
      <p className="text-sm text-nav-plum/70">Loading your meetings…</p>
    </div>
  );
}

function MeetingsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center">
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">{message}</p>
      <button type="button" onClick={onRetry} className="flex min-h-11 items-center gap-2 rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep">
        <RefreshCw aria-hidden="true" className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}

function MeetingsEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center">
      <CalendarClock aria-hidden="true" strokeWidth={1.5} className="h-10 w-10 text-nav-amethyst-deep" />
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">You haven&apos;t booked any consultations yet.</p>
      <Link href="/consult" className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep">
        Book a Consultation
      </Link>
    </div>
  );
}

function formatMeetingDateTime(meeting: Meeting): string {
  const [year, month, day] = meeting.date.split("-").map(Number);
  const [hour, minute] = meeting.startTime.split(":").map(Number);
  const d = new Date(year, (month ?? 1) - 1, day, hour, minute);
  const datePart = d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const timePart = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${datePart}, ${timePart}`;
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  return (
    <div className="group relative rounded-2xl border border-nav-lavender-line bg-gradient-to-b from-white to-nav-lavender-mist p-4 shadow-[0_10px_26px_-16px_rgba(70,40,120,0.35)] sm:rounded-[1.4rem] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-serif text-base text-nav-violet sm:text-lg">
            {meeting.serviceName}
            <span className="ml-1.5 text-sm font-sans text-nav-plum/60">· {meeting.durationMinutes} min</span>
          </p>
          <p className="mt-1 text-sm text-nav-plum/70">
            {formatMeetingDateTime(meeting)} ({meeting.timezone})
          </p>
        </div>
        <MeetingStatusBadge status={meeting.status} />
      </div>

      {meeting.status === "MEETING_CREATION_PENDING" && (
        <p className="mt-3 text-xs text-nav-plum/60">We&apos;re preparing your meeting link — check back shortly.</p>
      )}
      {meeting.status === "MEETING_CREATION_FAILED" && (
        <p className="mt-3 text-xs text-red-600">
          We hit an issue setting up your meeting link. Your booking is confirmed — our team will follow up with your link shortly.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {meeting.googleMeetUrl && meeting.status === "SCHEDULED" && (
          <a
            href={meeting.googleMeetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-nav-amethyst px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-nav-amethyst-deep"
          >
            <Video className="h-3.5 w-3.5" aria-hidden="true" />
            Join Meeting
          </a>
        )}
        <Link
          href={`/account/orders/${meeting.orderId}`}
          className="inline-flex min-h-9 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-4 py-1.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
        >
          View Order
        </Link>
      </div>
    </div>
  );
}

function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  const className =
    status === "COMPLETED"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      : status === "CANCELLED" || status === "MEETING_CREATION_FAILED"
        ? "bg-rose-50/80 text-rose-700/90 ring-1 ring-rose-200/80"
        : status === "SCHEDULED"
          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
          : "bg-nav-lavender-soft text-nav-amethyst-deep ring-1 ring-nav-lavender-line";
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium ${className}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
