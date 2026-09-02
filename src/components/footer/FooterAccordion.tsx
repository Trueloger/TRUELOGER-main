"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { FooterLink } from "./footer-data";

/**
 * One footer nav group. Below `md:` it's a collapsible accordion (closed by
 * default, tap the header to expand) — a full-width ≥44px tappable button
 * with aria-expanded/aria-controls wired to the link list, animated via the
 * CSS grid-template-rows 0fr→1fr trick (no max-height magic numbers, no JS
 * height measuring). At `md:` and up the SAME link list renders as a plain
 * always-open column: the row track is forced to 1fr and the interactive
 * button is swapped for a static heading purely via CSS display, so there
 * is exactly one <ul> of links in the DOM at any breakpoint — only the
 * heading chrome around it differs.
 */
export function FooterAccordion({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="border-b border-nav-lavender-line pb-2 md:border-none md:pb-0">
      <h3 className="m-0">
        {/* Mobile/tablet: interactive accordion trigger. */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-11 w-full items-center justify-between gap-2 py-3 text-left font-serif text-lg text-nav-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-lavender-mist md:hidden"
        >
          {title}
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-nav-amethyst-deep transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Desktop: static column label, no interaction. */}
        <span className="hidden text-sm font-semibold tracking-wide text-nav-plum/70 uppercase md:block">
          {title}
        </span>
      </h3>

      <div
        id={panelId}
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out md:grid-rows-[1fr] md:opacity-100 ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <ul className="overflow-hidden md:mt-4">
          {links.map((link) => (
            <li key={link.href + link.label}>
              <Link
                href={link.href}
                className="block py-2 text-[0.95rem] text-nav-plum/80 transition-colors hover:text-nav-amethyst-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-amethyst focus-visible:ring-offset-2 focus-visible:ring-offset-nav-lavender-mist md:py-1.5"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
