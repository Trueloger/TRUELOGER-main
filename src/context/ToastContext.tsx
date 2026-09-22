"use client";

// src/context/ToastContext.tsx
// Site-wide toast notifications — "added to cart", "coupon applied",
// "profile saved", "report ready" per the spec's Task 23H. Deliberately
// a small, capped stack (max 3 visible, oldest drops first) with a
// single auto-dismiss timer per toast — never "dozens of toasts"
// stacking. Cart-add itself already has its own inline "Added ✓"
// button-label swap (ServiceCard/GemstoneCard/ProductCard/
// AddReportToCartButton), which already satisfies the "brief scale +
// fade" confirmation the spec asks for there, so this provider is for
// the cases that had NO confirmation before: coupon applied, profile
// saved, and anywhere else that wants one going forward.
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; message: string; kind: ToastKind };

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 3000;

const ToastContext = createContext<((message: string, kind?: ToastKind) => void) | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const ICON_BY_KIND: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const COLOR_BY_KIND: Record<ToastKind, string> = {
  success: "border-nav-amethyst/40 text-nav-amethyst-deep",
  error: "border-red-300 text-red-700",
  info: "border-nav-lavender-line text-nav-plum",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = nextId.current++;
    setToasts((cur) => [...cur.slice(-(MAX_VISIBLE - 1)), { id, message, kind }]);
    window.setTimeout(() => {
      setToasts((cur) => cur.filter((t) => t.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:right-6 sm:left-auto sm:px-0"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = ICON_BY_KIND[toast.kind];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                role="status"
                className={`pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl border bg-nav-pearl px-4 py-3 text-sm font-medium shadow-[0_12px_32px_rgba(80,50,130,0.18)] ${COLOR_BY_KIND[toast.kind]}`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {toast.message}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
