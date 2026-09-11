"use client";

// src/app/admin/astrologers/page.tsx
// Admin "Astrologer Applications" tab — list + expandable detail with
// resume access and status update. Resume is fetched as a blob via
// authedFetch (admin-only route) and handed to the browser as an
// object URL, never a stored/public link.
import { useCallback, useEffect, useState } from "react";
import { authedFetch } from "@/lib/auth/authed-fetch";
import { APPLICATION_STATUSES, type AstrologerApplication, type ApplicationStatus } from "@/lib/astrologers/types";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready" };

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  Pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  "Under Review": "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  Approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Rejected: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

export default function AdminAstrologersPage() {
  const [applications, setApplications] = useState<AstrologerApplication[]>([]);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await authedFetch("/api/admin/astrologer-applications");
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { applications: AstrologerApplication[] };
      setApplications(data.applications);
      setState({ status: "ready" });
    } catch {
      setState({ status: "error", message: "We couldn't load applications right now." });
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  async function updateStatus(id: string, status: ApplicationStatus) {
    setSavingId(id);
    try {
      const res = await authedFetch(`/api/admin/astrologer-applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = (await res.json()) as { application: AstrologerApplication };
        setApplications((prev) => prev.map((a) => (a.id === id ? data.application : a)));
      }
    } finally {
      setSavingId(null);
    }
  }

  async function viewResume(app: AstrologerApplication) {
    const res = await authedFetch(`/api/admin/astrologer-applications/${app.id}/resume`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Astrologer Applications</h1>
        <p className="mt-1.5 text-sm text-nav-plum/70">Review job applications and access resumes securely.</p>
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
      {state.status === "ready" && applications.length === 0 && (
        <p className="rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/70">
          No applications yet.
        </p>
      )}

      {state.status === "ready" && applications.length > 0 && (
        <ul className="flex flex-col gap-3">
          {applications.map((app) => {
            const expanded = expandedId === app.id;
            return (
              <li key={app.id} className="rounded-2xl border border-nav-lavender-line bg-white p-4 shadow-[0_1px_2px_rgba(70,40,120,0.04)] sm:p-5">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : app.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                  aria-expanded={expanded}
                >
                  <div>
                    <p className="font-medium text-nav-violet">{app.fullName}</p>
                    <p className="mt-0.5 text-xs text-nav-plum/60">
                      {app.email} · {app.phone} · {app.primaryExpertise} · {app.yearsExperience} yrs
                    </p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium ${STATUS_STYLES[app.status]}`}>
                    {app.status}
                  </span>
                </button>

                {expanded && (
                  <div className="mt-4 border-t border-nav-lavender-line pt-4">
                    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div><dt className="text-xs text-nav-plum/50">Location</dt><dd className="text-nav-plum">{app.location}</dd></div>
                      <div><dt className="text-xs text-nav-plum/50">Languages</dt><dd className="text-nav-plum">{app.languages.join(", ")}</dd></div>
                      <div><dt className="text-xs text-nav-plum/50">Secondary Expertise</dt><dd className="text-nav-plum">{app.secondaryExpertise.join(", ") || "—"}</dd></div>
                      <div><dt className="text-xs text-nav-plum/50">Preferred Formats</dt><dd className="text-nav-plum">{app.preferredFormats.join(", ") || "—"}</dd></div>
                      <div><dt className="text-xs text-nav-plum/50">Qualifications</dt><dd className="text-nav-plum">{app.qualifications || "—"}</dd></div>
                      <div><dt className="text-xs text-nav-plum/50">Social Profile</dt><dd className="text-nav-plum">{app.socialProfile || "—"}</dd></div>
                      <div className="sm:col-span-2"><dt className="text-xs text-nav-plum/50">About</dt><dd className="text-nav-plum">{app.about}</dd></div>
                      <div><dt className="text-xs text-nav-plum/50">Submitted</dt><dd className="text-nav-plum">{new Date(app.submittedAt).toLocaleString()}</dd></div>
                    </dl>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => viewResume(app)}
                        className="min-h-9 rounded-full border border-nav-lavender-line bg-white px-4 text-sm font-medium text-nav-amethyst-deep transition-colors hover:bg-nav-lavender-mist"
                      >
                        View / Download Resume
                      </button>

                      <label className="flex items-center gap-2 text-sm text-nav-plum/70">
                        Status:
                        <select
                          value={app.status}
                          disabled={savingId === app.id}
                          onChange={(e) => updateStatus(app.id, e.target.value as ApplicationStatus)}
                          className="min-h-9 rounded-lg border border-nav-lavender-line bg-white px-2 text-sm text-nav-plum"
                        >
                          {APPLICATION_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                    </div>
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
