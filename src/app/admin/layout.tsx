"use client";

// src/app/admin/layout.tsx
// Shared shell for every /admin/* route: desktop left side-nav, mobile
// top bar with a horizontal scrollable tab row, a small "Admin" badge
// distinguishing this from the customer site, and a "Log out" action.
// Still the site's ivory/lavender/amethyst/gold palette — never a
// dark/generic-SaaS-admin theme (admin pages are information-dense,
// not visually different in kind).
//
// /admin/login is special-cased here: rendered UNWRAPPED (no
// AdminRoute guard, no nav chrome) since a non-admin must be able to
// reach the login form itself. Every other /admin/* page is wrapped in
// <AdminRoute>, which itself redirects to /admin/login when signed out
// or signed in but not an admin.
import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Menu, PackageSearch, Users, X, LogOut, Gem, Tag, Settings, FileText, Sparkles, UserRound, CalendarClock } from "lucide-react";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { useAuth } from "@/context/AuthContext";
import { authedFetch } from "@/lib/auth/authed-fetch";
import type { NotificationTab } from "@/lib/admin-notifications/store";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", Icon: PackageSearch, notificationTab: "orders" as NotificationTab },
  { href: "/admin/products", label: "Products", Icon: Gem },
  { href: "/admin/services", label: "Services", Icon: Sparkles },
  { href: "/admin/reports", label: "Reports", Icon: FileText, notificationTab: "reports" as NotificationTab },
  { href: "/admin/meetings", label: "Meetings", Icon: CalendarClock, notificationTab: "meetings" as NotificationTab },
  { href: "/admin/astrologers", label: "Astrologers", Icon: UserRound, notificationTab: "astrologerApplications" as NotificationTab },
  { href: "/admin/coupons", label: "Coupons", Icon: Tag },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
  { href: "/admin/users", label: "Users", Icon: Users },
] as const;

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    // No AdminRoute guard here — a signed-out or non-admin visitor
    // must be able to reach the login form itself.
    return <>{children}</>;
  }

  return (
    <AdminRoute>
      <AdminShell>{children}</AdminShell>
    </AdminRoute>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [counts, setCounts] = useState<Partial<Record<NotificationTab, number>>>({});

  const loadCounts = useCallback(async () => {
    try {
      const res = await authedFetch("/api/admin/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as { counts: Record<NotificationTab, number> };
      setCounts(data.counts);
    } catch {
      // Badge counts are a nice-to-have — a failed fetch just leaves
      // them at their last known value, never breaks the admin shell.
    }
  }, []);

  // Poll every 30s so a badge updates without a full page reload —
  // this codebase's Firestore realtime listeners are all client-SDK,
  // and these counts come from an Admin-SDK-only aggregation route, so
  // polling (not a listener) is the simple, correct choice here.
  useEffect(() => {
    queueMicrotask(() => loadCounts());
    const interval = window.setInterval(loadCounts, 30_000);
    return () => window.clearInterval(interval);
  }, [loadCounts]);

  // Visiting a tab marks it seen — its badge clears immediately
  // (optimistic) and the real per-tab lastSeenAt is recorded
  // server-side so the count starts fresh from this visit.
  useEffect(() => {
    const match = NAV_LINKS.find((l) => "notificationTab" in l && pathname.startsWith(l.href));
    const tab = match && "notificationTab" in match ? match.notificationTab : undefined;
    if (!tab) return;
    queueMicrotask(() => setCounts((prev) => ({ ...prev, [tab]: 0 })));
    authedFetch("/api/admin/notifications", { method: "POST", body: JSON.stringify({ tab }) }).catch(() => {});
  }, [pathname]);

  async function handleLogout() {
    await logout();
    router.replace("/admin/login");
  }

  return (
    // The site's own public Navbar no longer renders on /admin/* at
    // all (see src/components/layout/SiteChrome.tsx) — this is a
    // fully separate app shell, so it starts at the real top of the
    // viewport with no clearance offset needed.
    <div className="min-h-screen bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft">
      {/* Desktop side-nav */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-nav-lavender-line bg-nav-pearl/80 backdrop-blur-sm lg:flex">
        <div className="flex items-center gap-2 border-b border-nav-lavender-line px-5 py-5">
          <span className="font-serif text-lg text-nav-violet">TRUELOGER</span>
          <span className="rounded-full bg-nav-amethyst/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-nav-amethyst-deep ring-1 ring-nav-amethyst/20">
            Admin
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {NAV_LINKS.map((link) => {
            const { href, label, Icon } = link;
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            const unseen = "notificationTab" in link ? counts[link.notificationTab] ?? 0 : 0;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                  active
                    ? "bg-nav-amethyst text-white"
                    : "text-nav-plum/80 hover:bg-nav-lavender-mist hover:text-nav-violet"
                }`}
              >
                <Icon aria-hidden="true" className="h-4.5 w-4.5" />
                <span className="flex-1">{label}</span>
                {unseen > 0 && <NotificationBadge count={unseen} active={active} />}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-nav-lavender-line px-3 py-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-nav-plum/80 transition-colors duration-150 hover:bg-nav-lavender-mist hover:text-nav-violet"
          >
            <LogOut aria-hidden="true" className="h-4.5 w-4.5" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-nav-lavender-line bg-nav-pearl/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div className="flex items-center gap-2">
          <span className="font-serif text-base text-nav-violet">TRUELOGER</span>
          <span className="rounded-full bg-nav-amethyst/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-nav-amethyst-deep ring-1 ring-nav-amethyst/20">
            Admin
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileNavOpen((v) => !v)}
          aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileNavOpen}
          className="flex h-10 w-10 items-center justify-center rounded-full text-nav-violet hover:bg-nav-lavender-mist"
        >
          {mobileNavOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile horizontal tab row — always visible, large tap targets */}
      <nav className="flex gap-1 overflow-x-auto border-b border-nav-lavender-line bg-nav-pearl px-3 py-2 lg:hidden">
        {NAV_LINKS.map((link) => {
          const { href, label, Icon } = link;
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          const unseen = "notificationTab" in link ? counts[link.notificationTab] ?? 0 : 0;
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150 ${
                active
                  ? "bg-nav-amethyst text-white"
                  : "bg-nav-lavender-mist text-nav-plum/80 hover:text-nav-violet"
              }`}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              {label}
              {unseen > 0 && <NotificationBadge count={unseen} active={active} />}
            </Link>
          );
        })}
      </nav>

      {/* Mobile dropdown panel (menu toggle) — mainly for Log out, since
          nav links already live in the always-visible tab row above. */}
      {mobileNavOpen && (
        <div className="border-b border-nav-lavender-line bg-nav-pearl px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-nav-lavender-line bg-white px-4 py-2.5 text-sm font-medium text-nav-violet transition-colors hover:bg-nav-lavender-mist"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}

      <main className="px-4 py-6 sm:px-6 md:px-8 md:py-8 lg:ml-60">{children}</main>
    </div>
  );
}

/** Small unseen-count pill — represents NEW items since this admin
 * last visited the tab, never the tab's total item count (AGENTS
 * "unseen counter logic"). Capped display at "9+" to stay compact. */
function NotificationBadge({ count, active }: { count: number; active: boolean }) {
  return (
    <span
      aria-label={`${count} new`}
      className={`ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[0.65rem] font-semibold ${
        active ? "bg-white text-nav-amethyst" : "bg-nav-amethyst text-white"
      }`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
