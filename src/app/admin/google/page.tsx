"use client";

// src/app/admin/google/page.tsx
// One-time Google Calendar connection screen. Clicking "Connect"
// fetches a real Google consent URL (admin-auth-verified server-side)
// and navigates the browser there; Google redirects back here with
// ?connected=1 or ?error=... after the admin approves.
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { authedFetch } from "@/lib/auth/authed-fetch";

type Status = { connected: boolean; email: string | null; connectedAt: number | null };

export default function AdminGooglePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl text-sm text-nav-plum/60">Loading…</div>}>
      <AdminGooglePageContent />
    </Suspense>
  );
}

function AdminGooglePageContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authedFetch("/api/admin/google/status");
      if (res.ok) setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await authedFetch("/api/admin/google/connect-url");
      const data = await res.json().catch(() => null);
      if (res.ok && data?.url) {
        window.location.href = data.url;
      } else {
        setConnecting(false);
      }
    } catch {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await authedFetch("/api/admin/google/status", { method: "DELETE" });
      await load();
    } finally {
      setDisconnecting(false);
    }
  }

  const connectedParam = searchParams.get("connected");
  const errorParam = searchParams.get("error");

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Google Calendar</h1>
        <p className="mt-1.5 text-sm text-nav-plum/70">
          Connect the host Google account used to create real Google Meet links for paid consultations.
        </p>
      </header>

      {connectedParam && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Google Calendar connected successfully.
        </div>
      )}
      {errorParam && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          Connection failed: {errorParam.replace(/_/g, " ")}
        </div>
      )}

      <div className="rounded-2xl border border-nav-lavender-line bg-white p-5 shadow-[0_1px_2px_rgba(70,40,120,0.04)] sm:p-6">
        {loading ? (
          <p className="text-sm text-nav-plum/60">Loading…</p>
        ) : status?.connected ? (
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-nav-violet">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              Connected as {status.email}
            </p>
            <p className="mt-1 text-xs text-nav-plum/60">
              Connected {status.connectedAt ? new Date(status.connectedAt).toLocaleString() : ""}
            </p>
            <p className="mt-4 text-sm text-nav-plum/75">
              New paid consultations will automatically get a real Google Meet link created on this account&apos;s
              calendar. Disconnecting stops new meetings from being created (existing paid orders are never lost —
              they&apos;ll show as needing attention).
            </p>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="mt-4 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-nav-plum/75">
              Not connected yet. Consultations are booked but no Google Meet link can be created until this is set
              up — those bookings stay in a real, honest &quot;Preparing Your Meeting&quot; state.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="mt-4 flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 text-sm font-medium text-white transition-colors hover:bg-nav-amethyst-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              {connecting ? "Redirecting…" : "Connect Google Calendar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
