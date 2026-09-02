"use client";

import { AlertCircle } from "lucide-react";

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
  /** Resets the caller's own state back to the form (e.g.
   * `setStatus("idle")`). NOT a real navigation — every tool's error
   * screen replaces the form in the DOM entirely (conditional render,
   * not CSS hide/show), so a `#form-id` anchor link has no live target
   * to jump to and silently does nothing. A callback that flips the
   * caller's status back is the only thing that actually works here. */
  onBack?: () => void;
  backLabel?: string;
};

/** Shared error card. `message` must stay a friendly, non-technical
 * summary — this component never renders raw error detail, keeping
 * that out of `message` is the caller's job. Optionally renders a
 * Retry button (`onRetry`) and/or a "Back to form" button (`onBack`). */
export function ErrorState({
  message = "We couldn't complete your reading right now.",
  onRetry,
  onBack,
  backLabel = "Back to form",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-2xl border border-nav-lavender-line bg-nav-pearl px-6 py-12 text-center"
    >
      <AlertCircle
        aria-hidden="true"
        strokeWidth={1.5}
        className="h-10 w-10 text-nav-amethyst-deep"
      />
      <p className="max-w-sm text-sm leading-relaxed text-nav-plum/80">{message}</p>

      {(onRetry || onBack) && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex min-h-11 items-center justify-center rounded-full bg-nav-amethyst px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl"
            >
              Retry
            </button>
          )}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex min-h-11 items-center justify-center rounded-full border border-nav-lavender-line px-6 py-2.5 text-sm font-medium text-nav-plum transition-colors hover:border-nav-amethyst/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl"
            >
              {backLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
