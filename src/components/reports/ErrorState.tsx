"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
};

/** Shared error card. `message` must stay a friendly, non-technical
 * summary — this component never renders raw error detail, keeping
 * that out of `message` is the caller's job. Optionally renders a
 * Retry button (`onRetry`) and/or a "Back to form" link (`backHref`). */
export function ErrorState({
  message = "We couldn't complete your reading right now.",
  onRetry,
  backHref,
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

      {(onRetry || backHref) && (
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
          {backHref && (
            <Link
              href={backHref}
              className="flex min-h-11 items-center justify-center rounded-full border border-nav-lavender-line px-6 py-2.5 text-sm font-medium text-nav-plum transition-colors hover:border-nav-amethyst/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-pearl"
            >
              {backLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
