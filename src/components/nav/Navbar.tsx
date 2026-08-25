"use client";

import { useState } from "react";
import { Logo } from "./Logo";
import { DesktopNav } from "./DesktopNav";
import { MobileHeaderControls, MobileMenuPanel } from "./MobileNav";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 w-full px-3 pt-3 pb-2 md:px-5">
        <div className="mx-auto max-w-[1600px] rounded-2xl border border-nav-lavender-line bg-nav-pearl/95 shadow-[0_4px_24px_rgba(90,60,140,0.10)] backdrop-blur">
          <nav
            aria-label="Primary"
            className="flex h-16 items-center justify-between gap-3 px-4 md:px-6"
          >
            <Logo />
            <DesktopNav />
            <MobileHeaderControls onOpenMenu={() => setMobileOpen(true)} />
          </nav>
        </div>
      </header>

      <MobileMenuPanel open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
