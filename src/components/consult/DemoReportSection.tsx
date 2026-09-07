"use client";

// Thin client wrapper around the "View Demo Report" trigger + the
// DemoReportViewer modal it opens — kept separate from the (server)
// page component so only this small slice needs client-side state.
import { useState } from "react";
import { FileText } from "lucide-react";
import type { ConsultationService } from "@/lib/consultation/types";
import { DemoReportViewer } from "./DemoReportViewer";

export function DemoReportSection({ service }: { service: ConsultationService }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[44px] items-center gap-2 rounded-full border border-nav-lavender-line bg-white px-5 text-sm font-medium text-nav-amethyst-deep transition-colors duration-200 hover:bg-nav-lavender-soft"
      >
        <FileText className="h-4.5 w-4.5" aria-hidden="true" />
        View Demo Report
      </button>

      <DemoReportViewer service={service} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
