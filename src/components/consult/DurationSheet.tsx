"use client";

// src/components/consult/DurationSheet.tsx
// Shared duration-selection modal/bottom-sheet used by the direct
// "Add to Cart" flow on a ServiceCard (see ServiceCard.tsx). On mobile
// it behaves as a bottom sheet (fixed to the bottom, slides up, rounded
// top corners); on desktop it's a centered modal dialog — both share
// the same ivory/lavender/amethyst styling as the rest of this site.
// Body scroll is locked while open and focus is trapped/returned to the
// trigger, mirroring src/components/nav/MobileNav.tsx's MobileMenuPanel.
import { useEffect, useRef, useState } from "react";
import {
  DURATION_PRESETS,
  consultationVariantId,
  type ConsultationService,
} from "@/lib/consultation/types";
import { getConsultationPrice, validateDuration, formatInr } from "@/lib/consultation/pricing";
import { useCart } from "@/context/CartContext";

type DurationSheetProps = {
  service: ConsultationService;
  open: boolean;
  onClose: () => void;
  onConfirm: (duration: number, price: number) => void;
};

const CUSTOM_KEY = "custom" as const;

export function DurationSheet({ service, open, onClose, onConfirm }: DurationSheetProps) {
  const { addItem } = useCart();
  const [selection, setSelection] = useState<number | typeof CUSTOM_KEY>(30);
  const [customValue, setCustomValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<Element | null>(null);

  // Reset transient state whenever the sheet transitions from closed to
  // open. Adjusting state during render (rather than inside the effect
  // below) when a prop changes is the pattern React itself recommends —
  // it avoids an extra render pass, unlike calling setState from inside
  // useEffect.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSelection(30);
      setCustomValue("");
      setError(null);
      setSubmitting(false);
    }
  }

  // Body-scroll lock, focus-in, Escape handling, and focus-return — all
  // real DOM side effects, so these stay in an effect.
  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;

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
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  const customDuration = Number.parseInt(customValue, 10);
  const customValidation =
    selection === CUSTOM_KEY ? validateDuration(customValue === "" ? NaN : customDuration) : null;

  const activeDuration =
    selection === CUSTOM_KEY
      ? customValidation?.valid
        ? customValidation.duration
        : null
      : selection;

  const livePrice =
    activeDuration !== null ? getConsultationPrice(service.pricing, activeDuration) : null;

  const canConfirm = activeDuration !== null && !submitting;

  async function handleConfirm() {
    if (activeDuration === null) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/consult/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, duration: activeDuration }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || typeof data.price !== "number") {
        setError(
          (data && typeof data.error === "string" && data.error) ||
            "Something went wrong confirming this duration. Please try again.",
        );
        setSubmitting(false);
        return;
      }

      addItem({
        id: consultationVariantId(service.id, data.duration ?? activeDuration),
        name: service.name,
        price: data.price,
        type: "consultation",
        meta: {
          serviceId: service.id,
          serviceName: service.name,
          duration: data.duration ?? activeDuration,
        },
      });

      onConfirm(data.duration ?? activeDuration, data.price);
      onClose();
    } catch {
      setError("Network error — please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70]">
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close dialog overlay"
        onClick={onClose}
        className="absolute inset-0 bg-nav-violet/35 backdrop-blur-[1px]"
      />

      {/* panel — bottom sheet on mobile, centered modal from sm up */}
      <div
        id="duration-sheet-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="duration-sheet-heading"
        className="absolute inset-x-0 bottom-0 flex max-h-[90vh] w-full flex-col rounded-t-3xl border border-nav-lavender-line bg-nav-pearl shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85vh] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
        style={{
          backgroundImage:
            "radial-gradient(circle at 100% 0%, rgba(164,128,207,0.10), transparent 55%)",
        }}
      >
        {/* header */}
        <div className="flex shrink-0 items-center justify-between border-b border-nav-lavender-line px-5 py-4">
          <h2 id="duration-sheet-heading" className="font-serif text-lg text-nav-violet">
            Choose Consultation Duration
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-soft"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-sm text-nav-plum/75">
            {service.name} — pick a session length. Prices update instantly.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            {DURATION_PRESETS.map((minutes) => {
              const selected = selection === minutes;
              const price = getConsultationPrice(service.pricing, minutes);
              return (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setSelection(minutes)}
                  aria-pressed={selected}
                  className={`flex min-h-[48px] w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors duration-150 ${
                    selected
                      ? "border-nav-amethyst bg-nav-lavender-soft text-nav-violet"
                      : "border-nav-lavender-line bg-white text-nav-plum hover:bg-nav-lavender-mist"
                  }`}
                >
                  <span className="font-medium">{minutes} min</span>
                  <span className={selected ? "text-nav-amethyst-deep font-semibold" : "text-nav-plum/70"}>
                    {formatInr(price)}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setSelection(CUSTOM_KEY)}
              aria-pressed={selection === CUSTOM_KEY}
              className={`flex min-h-[48px] w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors duration-150 ${
                selection === CUSTOM_KEY
                  ? "border-nav-amethyst bg-nav-lavender-soft text-nav-violet"
                  : "border-nav-lavender-line bg-white text-nav-plum hover:bg-nav-lavender-mist"
              }`}
            >
              <span className="font-medium">Custom</span>
              {selection === CUSTOM_KEY && livePrice !== null ? (
                <span className="font-semibold text-nav-amethyst-deep">{formatInr(livePrice)}</span>
              ) : (
                <span className="text-nav-plum/70">15–60 min</span>
              )}
            </button>

            {selection === CUSTOM_KEY && (
              <div className="ml-1 mt-1 flex flex-col gap-1.5">
                <label htmlFor="custom-duration-input" className="text-xs text-nav-plum/70">
                  Enter minutes (15–60 min)
                </label>
                <input
                  id="custom-duration-input"
                  type="number"
                  inputMode="numeric"
                  min={15}
                  max={60}
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="e.g. 40"
                  className="w-full rounded-lg border border-nav-lavender-line bg-white px-3 py-2 text-nav-violet outline-none transition-colors duration-150 focus:border-nav-amethyst"
                />
                {customValue !== "" && customValidation && !customValidation.valid && (
                  <p className="text-xs text-red-600">{customValidation.reason}</p>
                )}
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        {/* footer */}
        <div className="flex shrink-0 items-center gap-3 border-t border-nav-lavender-line px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-nav-lavender-line bg-white text-nav-plum transition-colors duration-200 hover:bg-nav-lavender-mist"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-full bg-nav-amethyst px-4 font-medium text-white shadow-[0_4px_10px_rgba(90,55,140,0.25)] transition-colors duration-200 hover:bg-nav-amethyst-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Adding…" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
