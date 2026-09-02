"use client";

import { LotusIcon } from "@/components/quick-services/icons";

type LoadingStateProps = {
  message?: string;
};

/** Shared "generating a reading" loading experience — a gentle pulsing
 * celestial ornament (the site's own LotusIcon), not a spinner library.
 * Uses Tailwind's motion-safe:/motion-reduce: variants so
 * prefers-reduced-motion gets a static icon + message instead of an
 * animation, with no extra JS or dependency needed. */
export function LoadingState({ message = "Calculating your chart…" }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center"
    >
      <LotusIcon
        aria-hidden="true"
        strokeWidth={1.2}
        className="h-12 w-12 text-nav-amethyst-deep motion-safe:animate-pulse motion-reduce:animate-none"
      />
      <p className="text-sm text-nav-plum/70">{message}</p>
    </div>
  );
}
