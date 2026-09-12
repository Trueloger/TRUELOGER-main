"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FocusEvent } from "react";
import { ChevronDown, LogIn, LogOut, ShoppingBag, ShoppingCart, UserPlus } from "lucide-react";
import { NAV_ITEMS, MALL_ITEM, PROFILE_MENU, type NavItem } from "./nav-data";
import { useCart } from "@/context/CartContext";
import { useAuth, getInitials } from "@/context/AuthContext";

// Every top-level control (primary nav item, Mall, cart, auth,
// Register CTA) shares this exact height/padding/radius/font recipe —
// the actual fix for the "looks bad, everything's a different size"
// complaint: one shared sizing contract instead of each control having
// grown its own slightly-different py-2/py-1.5/px-4 combination over
// time. Deliberately compact (h-9, 13px text, tight icon gap) — with
// 8 primary items plus Register/Mall/Cart/Auth, a roomier size is what
// pushed the whole row past its container's real width.
const CONTROL_HEIGHT = "h-9";
const CONTROL_TEXT = "text-[0.8125rem] font-medium";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav() {
  const pathname = usePathname();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // click-outside + Escape close
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenKey(null);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenKey(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Clear any pending close timer on unmount.
  useEffect(() => () => clearCloseTimer(), []);

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  // Hover is the primary trigger: entering a trigger opens it immediately,
  // and it stays open — including while the mouse is over the panel itself,
  // since panel + trigger share one hoverable wrapper — until the mouse
  // leaves that wrapper entirely, after a short grace delay so crossing the
  // gap between button and panel doesn't flicker it shut. Click mirrors the
  // same "open" action (never a toggle), so a click on an already
  // hover-opened item can't race itself closed. Opening a different item
  // always wins, so only one dropdown is ever open at a time.
  function openItem(key: string) {
    clearCloseTimer();
    setOpenKey(key);
  }
  function scheduleClose(key: string) {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setOpenKey((cur) => (cur === key ? null : cur));
    }, 200);
  }
  // Keyboard parity: closes when focus moves outside the trigger+panel
  // wrapper (e.g. Shift+Tab back out, or Tab past the last menu item).
  function handleBlur(e: FocusEvent<HTMLElement>, key: string) {
    const container = e.currentTarget;
    requestAnimationFrame(() => {
      if (!container.contains(document.activeElement)) {
        setOpenKey((cur) => (cur === key ? null : cur));
      }
    });
  }

  return (
    // This full 8-item row only ever renders from 2xl (1536px) up —
    // see MobileNav.tsx's matching 2xl:hidden breakpoint. Below that,
    // the mobile menu (which already handles every nav item correctly
    // via its accordion) takes over instead of trying to cram this row
    // into less space than it needs. No overflow-x-auto here: that was
    // tried once as a "safety net" and was the actual cause of a real
    // bug — a scrollable ancestor also clips (not just scrolls) any
    // absolutely-positioned dropdown panel that opens from inside it.
    // The right fix is giving this row a width it actually fits in
    // (real 2xl-only breakpoint + compact sizing below), not clipping
    // dropdowns or guessing at a narrower breakpoint that overflows.
    <div ref={rootRef} className="hidden items-center gap-0.5 2xl:flex">
      <ul className="flex items-center gap-0.5">
        {NAV_ITEMS.map((item) => (
          <NavEntry
            key={item.label}
            item={item}
            active={isActive(pathname, item.href)}
            open={openKey === item.label}
            onOpen={() => openItem(item.label)}
            onLeave={() => scheduleClose(item.label)}
            onBlur={(e) => handleBlur(e, item.label)}
          />
        ))}
      </ul>

      <div className="ml-1 flex shrink-0 items-center gap-1.5">
        <Link
          href="/register-as-astrologer"
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border border-nav-gold/60 bg-nav-gold/10 px-3 ${CONTROL_HEIGHT} ${CONTROL_TEXT} text-nav-amethyst-deep transition-colors duration-200 hover:bg-nav-gold/20`}
        >
          <UserPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
          Register
        </Link>
        <MallControl
          open={openKey === MALL_ITEM.label}
          onOpen={() => openItem(MALL_ITEM.label)}
          onLeave={() => scheduleClose(MALL_ITEM.label)}
          onBlur={(e) => handleBlur(e, MALL_ITEM.label)}
        />
        <CartButton />
        <AuthControl
          open={openKey === "profile"}
          onOpen={() => openItem("profile")}
          onLeave={() => scheduleClose("profile")}
          onBlur={(e) => handleBlur(e, "profile")}
        />
      </div>
    </div>
  );
}

type DropdownHandlers = {
  onOpen: () => void;
  onLeave: () => void;
  onBlur: (e: FocusEvent<HTMLElement>) => void;
};

function NavEntry({
  item,
  active,
  open,
  onOpen,
  onLeave,
  onBlur,
}: DropdownHandlers & {
  item: NavItem;
  active: boolean;
  open: boolean;
}) {
  const hasChildren = !!item.children?.length;
  const menuId = `nav-menu-${item.label.toLowerCase().replace(/\s+/g, "-")}`;
  const Icon = item.icon;

  if (!hasChildren) {
    return (
      <li className="relative shrink-0">
        <Link
          href={item.href}
          className={`relative flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 ${CONTROL_HEIGHT} ${CONTROL_TEXT} transition-colors duration-200 ${
            active
              ? "bg-nav-lavender-soft text-nav-violet font-semibold"
              : "text-nav-violet/75 hover:bg-nav-lavender-mist hover:text-nav-violet"
          }`}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {item.label}
          {active && (
            <span className="absolute left-1/2 -bottom-0.5 h-1 w-1 -translate-x-1/2 rounded-full bg-nav-amethyst" />
          )}
        </Link>
      </li>
    );
  }

  const wide = item.children!.length > 8;

  return (
    <li className="relative shrink-0" onMouseEnter={onOpen} onMouseLeave={onLeave} onBlur={onBlur}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={onOpen}
        onFocus={onOpen}
        className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 ${CONTROL_HEIGHT} ${CONTROL_TEXT} transition-colors duration-200 ${
          active || open
            ? "bg-nav-lavender-soft text-nav-violet font-semibold"
            : "text-nav-violet/75 hover:bg-nav-lavender-mist hover:text-nav-violet"
        }`}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {item.label}
        <ChevronDown
          aria-hidden="true"
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={item.label}
          className={`absolute left-0 top-[calc(100%+0.5rem)] z-50 rounded-xl border border-nav-lavender-line bg-nav-pearl p-2 shadow-[0_12px_32px_rgba(80,50,130,0.14)] ${
            wide ? "grid grid-cols-2 gap-x-2 gap-y-0.5 min-w-[420px]" : "flex flex-col gap-0.5 min-w-[220px]"
          }`}
        >
          {item.children!.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              role="menuitem"
              className="rounded-lg px-3 py-2 text-sm text-nav-plum transition-colors duration-150 hover:bg-nav-lavender-soft hover:text-nav-violet"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </li>
  );
}

function MallControl({ open, onOpen, onLeave, onBlur }: DropdownHandlers & { open: boolean }) {
  return (
    <div className="relative shrink-0" onMouseEnter={onOpen} onMouseLeave={onLeave} onBlur={onBlur}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="nav-menu-mall"
        onClick={onOpen}
        onFocus={onOpen}
        className={`flex items-center gap-1 whitespace-nowrap rounded-full border px-3 ${CONTROL_HEIGHT} ${CONTROL_TEXT} transition-colors duration-200 ${
          open
            ? "border-nav-orchid bg-nav-lavender-soft text-nav-violet"
            : "border-nav-lavender-line bg-nav-pearl text-nav-violet hover:bg-nav-lavender-mist"
        }`}
      >
        <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Mall
      </button>

      {open && (
        <div
          id="nav-menu-mall"
          role="menu"
          aria-label={MALL_ITEM.label}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 flex min-w-[200px] flex-col gap-0.5 rounded-xl border border-nav-lavender-line bg-nav-pearl p-2 shadow-[0_12px_32px_rgba(80,50,130,0.14)]"
        >
          {MALL_ITEM.children!.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              role="menuitem"
              className="rounded-lg px-3 py-2 text-sm text-nav-plum transition-colors duration-150 hover:bg-nav-lavender-soft hover:text-nav-violet"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CartButton() {
  const { itemCount, openCart } = useCart();
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
      className={`relative flex ${CONTROL_HEIGHT} w-9 shrink-0 items-center justify-center rounded-full text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-mist`}
    >
      <ShoppingCart className="h-4.5 w-4.5" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-nav-amethyst-deep px-1 text-[0.65rem] font-semibold text-white"
      >
        {itemCount}
      </span>
    </button>
  );
}

function AuthControl({ open, onOpen, onLeave, onBlur }: DropdownHandlers & { open: boolean }) {
  const { currentUser, profile, logout } = useAuth();

  if (!currentUser) {
    return (
      <Link
        href="/login"
        className={`flex items-center gap-1 whitespace-nowrap rounded-full border border-nav-lavender-line bg-nav-pearl px-3 ${CONTROL_HEIGHT} ${CONTROL_TEXT} text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-mist`}
      >
        <LogIn className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Login
      </Link>
    );
  }

  const displayName = profile?.fullName || currentUser.displayName || currentUser.email || "Account";

  return (
    <div className="relative shrink-0" onMouseEnter={onOpen} onMouseLeave={onLeave} onBlur={onBlur}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="nav-menu-profile"
        aria-label={`Account menu for ${displayName}`}
        onClick={onOpen}
        onFocus={onOpen}
        className={`flex items-center gap-1 rounded-full border pl-1 pr-2 ${CONTROL_HEIGHT} ${CONTROL_TEXT} transition-colors duration-200 ${
          open
            ? "border-nav-orchid bg-nav-lavender-soft text-nav-violet"
            : "border-nav-lavender-line bg-nav-pearl text-nav-violet hover:bg-nav-lavender-mist"
        }`}
      >
        <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-nav-amethyst text-[0.65rem] font-semibold text-white">
          {getInitials(displayName)}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id="nav-menu-profile"
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[210px] rounded-xl border border-nav-lavender-line bg-nav-pearl p-2 shadow-[0_12px_32px_rgba(80,50,130,0.14)]"
        >
          <div className="px-3 py-2 text-sm font-semibold text-nav-violet truncate">
            {displayName}
          </div>
          <div className="my-1 h-px bg-nav-lavender-line" />
          {PROFILE_MENU.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              role="menuitem"
              className="block rounded-lg px-3 py-2 text-sm text-nav-plum transition-colors duration-150 hover:bg-nav-lavender-soft hover:text-nav-violet"
            >
              {entry.label}
            </Link>
          ))}
          <div className="my-1 h-px bg-nav-lavender-line" />
          <button
            type="button"
            role="menuitem"
            onClick={() => void logout()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-nav-plum transition-colors duration-150 hover:bg-nav-lavender-soft hover:text-nav-violet"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
