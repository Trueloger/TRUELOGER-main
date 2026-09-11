"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  HelpCircle,
  Info,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  ShoppingCart,
  X,
} from "lucide-react";
import { NAV_ITEMS, MALL_ITEM, SUPPORT_LINKS, PROFILE_MENU, type NavItem } from "./nav-data";
import { useCart } from "@/context/CartContext";
import { useAuth, getInitials } from "@/context/AuthContext";
import { Logo } from "./Logo";

const ALL_ITEMS: NavItem[] = [...NAV_ITEMS, MALL_ITEM];

const SUPPORT_ICONS = [HelpCircle, Info, ShieldCheck];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileHeaderControls({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { itemCount, openCart } = useCart();
  return (
    <div className="flex items-center gap-1 lg:hidden">
      <button
        type="button"
        onClick={openCart}
        aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-mist"
      >
        <ShoppingCart className="h-5 w-5" aria-hidden="true" />
        {itemCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-0.5 right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-nav-amethyst-deep px-1 text-[0.65rem] font-semibold text-white"
          >
            {itemCount}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        aria-expanded={false}
        aria-controls="mobile-nav-panel"
        className="flex h-11 w-11 items-center justify-center rounded-full text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-mist"
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  );
}

export function MobileMenuPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  function toggleAccordion(key: string) {
    setOpenAccordion((cur) => (cur === key ? null : key));
  }

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      {/* overlay */}
      <button
        type="button"
        aria-label="Close menu overlay"
        onClick={onClose}
        className="absolute inset-0 bg-nav-violet/25 backdrop-blur-[1px]"
      />

      {/* panel */}
      <div
        id="mobile-nav-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-nav-lavender-mist shadow-2xl"
        style={{
          backgroundImage:
            "radial-gradient(circle at 100% 0%, rgba(164,128,207,0.10), transparent 55%)",
        }}
      >
        {/* header */}
        <div className="flex shrink-0 items-center justify-between border-b border-nav-lavender-line px-5 py-4">
          <Logo />
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-soft"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* scrollable body */}
        <div className="nav-scroll-hidden flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          <ul className="flex flex-col gap-0.5">
            {ALL_ITEMS.map((item) => (
              <MobileRow
                key={item.label}
                item={item}
                active={isActive(pathname, item.href)}
                expanded={openAccordion === item.label}
                onToggle={() => toggleAccordion(item.label)}
                onNavigate={onClose}
              />
            ))}
          </ul>

          <div className="px-3 pt-1">
            <Link
              href="/register-as-astrologer"
              onClick={onClose}
              className="flex min-h-[48px] w-full items-center justify-center rounded-full border border-nav-gold/60 bg-nav-gold/10 px-4 text-[0.95rem] font-medium text-nav-amethyst-deep transition-colors duration-200 hover:bg-nav-gold/20"
            >
              Register as an Astrologer
            </Link>
          </div>

          <div className="mx-3 my-3 h-px bg-nav-lavender-line" />

          <ul className="flex flex-col gap-0.5 pb-2">
            {SUPPORT_LINKS.map((entry, i) => {
              const Icon = SUPPORT_ICONS[i] ?? HelpCircle;
              return (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-[0.95rem] text-nav-plum transition-colors duration-150 hover:bg-nav-lavender-soft hover:text-nav-violet"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-nav-violet" aria-hidden="true" />
                    {entry.label}
                  </Link>
                </li>
              );
            })}
            {currentUser ? (
              <MobileProfileRow
                expanded={openAccordion === "profile"}
                onToggle={() => toggleAccordion("profile")}
                onNavigate={onClose}
              />
            ) : (
              <li className="pt-1">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-nav-lavender-line bg-nav-pearl px-4 py-3 text-[0.95rem] font-medium text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-mist"
                >
                  <LogIn className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                  Login / Sign Up
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MobileRow({
  item,
  active,
  expanded,
  onToggle,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const hasChildren = !!item.children?.length;
  const panelId = `mobile-accordion-${item.label.toLowerCase().replace(/\s+/g, "-")}`;

  if (!hasChildren) {
    return (
      <li>
        <Link
          href={item.href}
          onClick={onNavigate}
          className={`flex min-h-[52px] items-center gap-3 rounded-xl px-3 py-3 text-[1rem] font-medium transition-colors duration-150 ${
            active
              ? "bg-nav-lavender-soft text-nav-violet font-semibold"
              : "text-nav-violet/85 hover:bg-nav-lavender-soft/60"
          }`}
        >
          <Icon className="h-5 w-5 shrink-0 text-nav-violet" aria-hidden="true" />
          {item.label}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[1rem] font-medium transition-colors duration-150 ${
          expanded
            ? "bg-nav-lavender-soft text-nav-violet font-semibold"
            : "text-nav-violet/85 hover:bg-nav-lavender-soft/60"
        }`}
      >
        <Icon className="h-5 w-5 shrink-0 text-nav-violet" aria-hidden="true" />
        <span className="flex-1">{item.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4.5 w-4.5 shrink-0 text-nav-violet transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <ul id={panelId} className="mt-0.5 mb-1 flex flex-col gap-0.5 pl-[3.1rem] pr-2">
          {item.children!.map((child) => (
            <li key={child.href}>
              <Link
                href={child.href}
                onClick={onNavigate}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[0.92rem] text-nav-plum transition-colors duration-150 hover:bg-nav-lavender-soft hover:text-nav-violet"
              >
                <span className="h-1 w-1 shrink-0 rounded-full bg-nav-orchid" aria-hidden="true" />
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** Mirrors the desktop profile control: avatar + name trigger, expands into
 * the same account links plus Logout — same accordion mechanics as the
 * primary nav rows above. */
function MobileProfileRow({
  expanded,
  onToggle,
  onNavigate,
}: {
  expanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const { currentUser, profile, logout } = useAuth();
  if (!currentUser) return null;
  const displayName = profile?.fullName || currentUser.displayName || currentUser.email || "Account";

  const panelId = "mobile-accordion-profile";

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-label={`Account menu for ${displayName}`}
        className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[1rem] font-medium transition-colors duration-150 ${
          expanded
            ? "bg-nav-lavender-soft text-nav-violet font-semibold"
            : "text-nav-violet/85 hover:bg-nav-lavender-soft/60"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nav-amethyst text-xs font-semibold text-white">
          {getInitials(displayName)}
        </span>
        <span className="flex-1 truncate">{displayName}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4.5 w-4.5 shrink-0 text-nav-violet transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <ul id={panelId} className="mt-0.5 mb-1 flex flex-col gap-0.5 pl-[3.1rem] pr-2">
          {PROFILE_MENU.map((entry) => (
            <li key={entry.href}>
              <Link
                href={entry.href}
                onClick={onNavigate}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[0.92rem] text-nav-plum transition-colors duration-150 hover:bg-nav-lavender-soft hover:text-nav-violet"
              >
                <span className="h-1 w-1 shrink-0 rounded-full bg-nav-orchid" aria-hidden="true" />
                {entry.label}
              </Link>
            </li>
          ))}
          <li>
            <div className="mx-2.5 my-1 h-px bg-nav-lavender-line" />
            <button
              type="button"
              onClick={() => {
                void logout();
                onNavigate();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-[0.92rem] text-nav-plum transition-colors duration-150 hover:bg-nav-lavender-soft hover:text-nav-violet"
            >
              <LogOut className="h-4 w-4 shrink-0 text-nav-violet" aria-hidden="true" />
              Logout
            </button>
          </li>
        </ul>
      )}
    </li>
  );
}
