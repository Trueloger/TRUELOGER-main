"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FocusEvent } from "react";
import { ChevronDown, LogIn, LogOut, ShoppingBag, ShoppingCart } from "lucide-react";
import { NAV_ITEMS, MALL_ITEM, PROFILE_MENU, type NavItem } from "./nav-data";
import { useCart } from "@/context/CartContext";
import { useAuth, getInitials } from "@/context/AuthContext";

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
    <div ref={rootRef} className="hidden lg:flex items-center gap-1.5">
      <ul className="flex items-center gap-1">
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

      <div className="ml-2 flex items-center gap-2">
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

  if (!hasChildren) {
    return (
      <li className="relative">
        <Link
          href={item.href}
          className={`relative block rounded-full px-3.5 py-2 text-[0.925rem] font-medium transition-colors duration-200 ${
            active
              ? "bg-nav-lavender-soft text-nav-violet font-semibold"
              : "text-nav-violet/75 hover:bg-nav-lavender-mist hover:text-nav-violet"
          }`}
        >
          {item.label}
          {active && (
            <span className="absolute left-1/2 -bottom-1.5 h-1 w-1 -translate-x-1/2 rounded-full bg-nav-amethyst" />
          )}
        </Link>
      </li>
    );
  }

  const wide = item.children!.length > 8;

  return (
    <li className="relative" onMouseEnter={onOpen} onMouseLeave={onLeave} onBlur={onBlur}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={onOpen}
        onFocus={onOpen}
        className={`flex items-center gap-1 rounded-full px-3.5 py-2 text-[0.925rem] font-medium transition-colors duration-200 ${
          active || open
            ? "bg-nav-lavender-soft text-nav-violet font-semibold"
            : "text-nav-violet/75 hover:bg-nav-lavender-mist hover:text-nav-violet"
        }`}
      >
        {item.label}
        <ChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onLeave} onBlur={onBlur}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="nav-menu-mall"
        onClick={onOpen}
        onFocus={onOpen}
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
          open
            ? "border-nav-orchid bg-nav-lavender-soft text-nav-violet"
            : "border-nav-lavender-line bg-nav-pearl text-nav-violet hover:bg-nav-lavender-mist"
        }`}
      >
        <ShoppingBag className="h-4 w-4" aria-hidden="true" />
        {MALL_ITEM.label.toUpperCase()}
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
  const { itemCount } = useCart();
  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-mist"
    >
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-nav-amethyst-deep px-1 text-[0.65rem] font-semibold text-white"
      >
        {itemCount}
      </span>
    </Link>
  );
}

function AuthControl({ open, onOpen, onLeave, onBlur }: DropdownHandlers & { open: boolean }) {
  const { user, login, logout } = useAuth();

  if (!user) {
    return (
      <button
        type="button"
        onClick={login}
        className="flex items-center gap-2 rounded-full border border-nav-lavender-line bg-nav-pearl px-4 py-2 text-sm font-medium text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-mist"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Login / Sign Up
      </button>
    );
  }

  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onLeave} onBlur={onBlur}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="nav-menu-profile"
        aria-label={`Account menu for ${user.name}`}
        onClick={onOpen}
        onFocus={onOpen}
        className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 pr-3 text-sm font-medium transition-colors duration-200 ${
          open
            ? "border-nav-orchid bg-nav-lavender-soft text-nav-violet"
            : "border-nav-lavender-line bg-nav-pearl text-nav-violet hover:bg-nav-lavender-mist"
        }`}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-nav-amethyst text-xs font-semibold text-white">
          {getInitials(user.name)}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
            {user.name}
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
            onClick={logout}
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
