"use client";

// src/components/ui/CollapsibleReportCard.tsx
// One expand/collapse section within a report tab — the mobile-report
// compression layer that sits BELOW SectionTabs (which already groups
// a report's tabs into Score/Charts/Planets&Houses/etc.): where one
// tab still stacks several sub-sections (e.g. Planetary Positions +
// House Strength), this wraps each in a collapsible card instead of
// one continuous scroll. Desktop keeps every card open by default
// (per the spec's "don't force the mobile accordion onto desktop") —
// `defaultOpen` differs by breakpoint in the one place that matters:
// the initial state, not the interaction itself (desktop users can
// still collapse a card if they want to).
import { useId, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

export function CollapsibleReportCard({
  icon: Icon,
  title,
  summary,
  defaultOpen = true,
  children,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="overflow-hidden rounded-2xl border border-nav-lavender-line bg-nav-pearl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-nav-lavender-mist"
      >
        {Icon && <Icon className="h-5 w-5 shrink-0 text-nav-amethyst-deep" strokeWidth={1.5} />}
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-base text-nav-plum">{title}</span>
          {summary && !open && (
            <span className="mt-0.5 block truncate text-xs text-nav-plum/60">{summary}</span>
          )}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-nav-plum/50"
        >
          <ChevronDown className="h-4.5 w-4.5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-nav-lavender-line px-4 pb-4 pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
