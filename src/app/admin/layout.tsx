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
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Menu, PackageSearch, Users, X, LogOut, Gem, Tag, Settings, FileText, Sparkles, UserRound } from "lucide-react";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { useAuth } from "@/context/AuthContext";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", Icon: PackageSearch },
  { href: "/admin/products", label: "Products", Icon: Gem },
  { href: "/admin/services", label: "Services", Icon: Sparkles },
  { href: "/admin/reports", label: "Reports", Icon: FileText },
  { href: "/admin/astrologers", label: "Astrologers", Icon: UserRound },
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
          {NAV_LINKS.map(({ href, label, Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
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
                {label}
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
        {NAV_LINKS.map(({ href, label, Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
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
