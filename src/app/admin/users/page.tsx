"use client";

// src/app/admin/users/page.tsx
// Simple paginated user list — summary fields only (no birth/sensitive
// data, since /api/admin/users deliberately never returns any). No
// search: the API doesn't support it, and adding a client-side-only
// filter here would misleadingly imply completeness across pages, so
// this page stays a plain paginated list per scope.
import { useCallback, useEffect, useState } from "react";
import { authedFetch } from "@/lib/auth/authed-fetch";

type AdminUserSummary = {
  uid: string;
  fullName: string;
  email: string;
  createdAt: number;
  profileComplete: boolean;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready" };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await authedFetch("/api/admin/users");
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { users: AdminUserSummary[]; nextCursor: string | null };
      setUsers(data.users);
      setCursor(data.nextCursor);
      setState({ status: "ready" });
    } catch {
      setState({ status: "error", message: "We couldn't load users right now." });
    }
  }, []);

  useEffect(() => {
    // Deferred via queueMicrotask — see admin/orders/page.tsx's
    // identical comment (react-hooks/set-state-in-effect).
    queueMicrotask(() => load());
  }, [load]);

  async function handleLoadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const res = await authedFetch(`/api/admin/users?cursor=${cursor}`);
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { users: AdminUserSummary[]; nextCursor: string | null };
      setUsers((prev) => [...prev, ...data.users]);
      setCursor(data.nextCursor);
    } catch {
      // Leave the list as-is; the user can retry "Load more".
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl text-nav-violet sm:text-3xl">Users</h1>
        <p className="mt-1.5 text-sm text-nav-plum/70">Registered customers, newest first.</p>
      </header>

      {state.status === "loading" && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-3 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-16 text-center"
        >
          <span className="h-8 w-8 rounded-full border-2 border-nav-lavender-line border-t-nav-amethyst motion-safe:animate-spin motion-reduce:animate-none" />
          <p className="text-sm text-nav-plum/70">Loading users…</p>
        </div>
      )}

      {state.status === "error" && (
        <div role="alert" className="rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/80">
          {state.message}
        </div>
      )}

      {state.status === "ready" && users.length === 0 && (
        <p className="rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-14 text-center text-sm text-nav-plum/70">
          No users yet.
        </p>
      )}

      {state.status === "ready" && users.length > 0 && (
        <>
          {/* Mobile: cards */}
          <ul className="flex flex-col gap-3 lg:hidden">
            {users.map((u) => (
              <li key={u.uid} className="rounded-2xl border border-nav-lavender-line bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-nav-violet">{u.fullName || "—"}</p>
                    <p className="mt-0.5 text-xs text-nav-plum/60">{u.email}</p>
                  </div>
                  <ProfileBadge complete={u.profileComplete} />
                </div>
                <p className="mt-2 text-xs text-nav-plum/60">
                  Joined {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-nav-lavender-line bg-white lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-nav-lavender-line bg-nav-lavender-mist text-xs uppercase tracking-wide text-nav-plum/70">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Profile</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.uid} className="border-b border-nav-lavender-line/60 last:border-0">
                    <td className="px-4 py-3 font-medium text-nav-violet">{u.fullName || "—"}</td>
                    <td className="px-4 py-3 text-nav-plum/80">{u.email}</td>
                    <td className="px-4 py-3 text-nav-plum/70">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <ProfileBadge complete={u.profileComplete} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {cursor && (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex min-h-11 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-6 py-2.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProfileBadge({ complete }: { complete: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium ring-1 ${
        complete
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-amber-50 text-amber-700 ring-amber-200"
      }`}
    >
      {complete ? "Complete" : "Incomplete"}
    </span>
  );
}
