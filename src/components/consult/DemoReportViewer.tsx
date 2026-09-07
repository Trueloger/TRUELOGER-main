"use client";

// Modal viewer for a consultation service's demo/sample report
// (service.demoReport). Always clearly labelled as a sample so it can
// never be mistaken for a real personalized reading — see the
// ConsultationDemoReport doc comment in types.ts.
//
// Scroll-lock + focus + Escape-to-close pattern mirrors
// MobileMenuPanel in src/components/nav/MobileNav.tsx.
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { ConsultationService } from "@/lib/consultation/types";

export function DemoReportViewer({
  service,
  open,
  onClose,
}: {
  service: ConsultationService;
  open: boolean;
  onClose: () => void;
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const headingId = "demo-report-heading";

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

  const { demoReport } = service;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close demo report overlay"
        onClick={onClose}
        className="absolute inset-0 bg-nav-violet/30 backdrop-blur-[1px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="motion-reduce:transition-none relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-nav-pearl shadow-2xl transition-transform duration-200"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-nav-lavender-line bg-nav-lavender-mist px-5 py-4">
          <div>
            <span className="inline-block rounded-full bg-nav-amethyst px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-white">
              Sample / Demonstration Report
            </span>
            <h2 id={headingId} className="mt-2 font-serif text-xl text-nav-plum">
              {demoReport.title}
            </h2>
            <p className="mt-1 text-xs italic text-nav-plum/60">{demoReport.sampleSubject}</p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close demo report"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-nav-violet transition-colors duration-200 hover:bg-nav-lavender-soft"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="nav-scroll-hidden flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          <p className="text-sm leading-relaxed text-nav-plum/85">{demoReport.summary}</p>

          <div className="mt-5 flex flex-col gap-4">
            {demoReport.sections.map((section) => (
              <div
                key={section.heading}
                className="rounded-xl border border-nav-lavender-line bg-white p-4"
              >
                <h3 className="font-serif text-base text-nav-amethyst-deep">
                  {section.heading}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-nav-plum/85">
                  {section.body}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs text-nav-plum/50">
            This sample is for illustration only and does not reflect any real person&apos;s
            reading.
          </p>
        </div>
      </div>
    </div>
  );
}
