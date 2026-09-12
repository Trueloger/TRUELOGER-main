"use client";

// src/app/admin/support/page.tsx
// Admin view of the single support-ticket system that backs Contact,
// Grievance, and every order/report/meeting "Need help?" link — one
// list, filterable by category, not separate admin screens per source.
import { useCallback, useEffect, useState } from "react";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { SUPPORT_CATEGORIES, TICKET_STATUSES, type SupportTicket, type TicketStatus } from "@/lib/support/types";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready" };

const STATUS_STYLES: Record<TicketStatus, string> = {
  Open: "bg-nav-lavender-soft text-nav-amethyst-deep ring-1 ring-nav-lavender-line",
  "In Review": "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  "Waiting for Customer": "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Resolved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Closed: "bg-nav-lavender-mist text-nav-plum/70 ring-1 ring-nav-lavender-line",
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await authedFetch("/api/admin/support-tickets");
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { tickets: SupportTicket[] };
      setTickets(data.tickets);
      setState({ status: "ready" });
    } catch {
      setState({ status: "error", message: "We couldn't load support requests right now." });
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  async function updateTicket(id: string, patch: { status?: TicketStatus; adminNote?: string }) {
    setSavingId(id);
    try {
      const res = await authedFetch(`/api/admin/support-tickets/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      if (res.ok) {
        const data = (await res.json()) as { ticket: SupportTicket };
        setTickets((prev) => prev.map((t) => (t.id === id ? data.ticket : t)));
      }
    } finally {
      setSavingId(null);
    }
  }

  const visible = categoryFilter === "all" ? tickets : tickets.filter((t) => t.category === categoryFilter);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Support Requests</h1>
        <p className="mt-1.5 text-sm text-nav-plum/70">Contact, Grievance, and order/report/meeting support requests — one list.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoryFilter("all")}
          className={`min-h-9 rounded-full px-3.5 text-sm font-medium ${categoryFilter === "all" ? "bg-nav-amethyst text-white" : "bg-white text-nav-plum/80 ring-1 ring-nav-lavender-line"}`}
        >
          All
        </button>
        {SUPPORT_CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategoryFilter(c.value)}
            className={`min-h-9 rounded-full px-3.5 text-sm font-medium ${categoryFilter === c.value ? "bg-nav-amethyst text-white" : "bg-white text-nav-plum/80 ring-1 ring-nav-lavender-line"}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {state.status === "loading" && (
        <div role="status" aria-live="polite" className="mt-5 flex items-center justify-center gap-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center">
          <span className="h-8 w-8 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
          <p className="text-sm text-nav-plum/70">Loading…</p>
        </div>
      )}
      {state.status === "error" && (
        <div role="alert" className="mt-5 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/80">
          {state.message}
        </div>
      )}
      {state.status === "ready" && visible.length === 0 && (
        <p className="mt-5 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/70">
          No requests in this category.
        </p>
      )}

      {state.status === "ready" && visible.length > 0 && (
        <ul className="mt-5 flex flex-col gap-3">
          {visible.map((t) => {
            const expanded = expandedId === t.id;
            const categoryLabel = SUPPORT_CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category;
            return (
              <li key={t.id} className="rounded-2xl border border-nav-lavender-line bg-white p-4 shadow-[0_1px_2px_rgba(70,40,120,0.04)] sm:p-5">
                <button type="button" onClick={() => setExpandedId(expanded ? null : t.id)} className="flex w-full flex-wrap items-center justify-between gap-3 text-left" aria-expanded={expanded}>
                  <div>
                    <p className="font-medium text-nav-violet">{t.name} <span className="font-normal text-nav-plum/50">· {categoryLabel}</span></p>
                    <p className="mt-0.5 text-xs text-nav-plum/60">{t.email} · {new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium ${STATUS_STYLES[t.status]}`}>{t.status}</span>
                </button>

                {expanded && (
                  <div className="mt-4 border-t border-nav-lavender-line pt-4">
                    <p className="whitespace-pre-wrap text-sm text-nav-plum/85">{t.message}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-nav-plum/60 sm:grid-cols-4">
                      {t.orderId && <div><dt className="font-semibold">Order</dt><dd>{t.orderId}</dd></div>}
                      {t.reportId && <div><dt className="font-semibold">Report</dt><dd>{t.reportId}</dd></div>}
                      {t.meetingId && <div><dt className="font-semibold">Meeting</dt><dd>{t.meetingId}</dd></div>}
                      {t.privacyRequestType && <div><dt className="font-semibold">Privacy Type</dt><dd>{t.privacyRequestType}</dd></div>}
                    </dl>
                    <label className="mt-4 flex items-center gap-2 text-sm text-nav-plum/70">
                      Status:
                      <select
                        value={t.status}
                        disabled={savingId === t.id}
                        onChange={(e) => updateTicket(t.id, { status: e.target.value as TicketStatus })}
                        className="min-h-9 rounded-lg border border-nav-lavender-line bg-white px-2 text-sm text-nav-plum"
                      >
                        {TICKET_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
