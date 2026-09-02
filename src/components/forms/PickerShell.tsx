"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

type PickerShellProps = {
  open: boolean;
  onClose: () => void;
  /** The trigger button that opened this panel — refocused on close. */
  triggerRef: RefObject<HTMLButtonElement | null>;
  /** Accessible name for the dialog panel. */
  title: string;
  panelId: string;
  children: ReactNode;
  /** Element to move focus into once the panel opens. Defaults to the
   * panel container itself. */
  initialFocusRef?: RefObject<HTMLElement | null>;
};

/** Shared chrome for both DateOfBirthField's calendar and
 * TimeOfBirthField's time picker: a bottom sheet on mobile (`<md`,
 * matching the slide-up feel MobileNav.tsx already uses for its
 * overlay panel), an anchored popover on desktop (`md:+`) — pure CSS
 * breakpoint switch, no matchMedia/JS viewport detection. Handles the
 * backdrop, Escape-to-close, click-outside-to-close, initial focus,
 * and body scroll lock while open. The calendar/time grid itself is
 * supplied by the caller as children; this component only frames it. */
export function PickerShell({
  open,
  onClose,
  triggerRef,
  title,
  panelId,
  children,
  initialFocusRef,
}: PickerShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const toFocus = initialFocusRef?.current ?? panelRef.current;
    toFocus?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable identities
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* backdrop — dims the screen on mobile's full sheet, stays
          invisible on desktop where it's only a click-outside catcher */}
      <button
        type="button"
        aria-label={`Close ${title}`}
        onClick={() => {
          onClose();
          triggerRef.current?.focus();
        }}
        className="fixed inset-0 z-40 cursor-default bg-nav-violet/25 backdrop-blur-[1px] md:bg-transparent md:backdrop-blur-none"
      />
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="picker-panel fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-nav-lavender-line bg-nav-pearl shadow-2xl outline-none md:absolute md:inset-x-auto md:top-full md:bottom-auto md:left-0 md:mt-2 md:max-h-none md:w-[22rem] md:rounded-2xl md:border md:shadow-[0_20px_60px_-15px_rgba(90,55,140,0.35)]"
      >
        {children}
      </div>
    </>
  );
}
