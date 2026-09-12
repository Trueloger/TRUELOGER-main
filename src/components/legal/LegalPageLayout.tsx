import type { ReactNode } from "react";
import { LotusIcon } from "@/components/quick-services/icons";
import { PolicyContents, type PolicyTocEntry } from "./PolicyContents";

/**
 * Shared shell for every legal/policy/help page — extracted from the
 * pattern the original Terms & Conditions page hand-rolled (see
 * AGENTS "do not create seven copies of the same page layout").
 * Desktop: a two-column layout (sticky contents left, content right)
 * once there are enough sections to warrant a TOC; mobile: contents
 * collapses via PolicyContents' own <details> element.
 */
export function LegalPageLayout({
  title,
  intro,
  lastUpdated,
  toc,
  children,
  footnote,
}: {
  title: string;
  intro?: ReactNode;
  lastUpdated?: string;
  toc?: PolicyTocEntry[];
  children: ReactNode;
  footnote?: ReactNode;
}) {
  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-nav-lavender-line" aria-hidden="true" />
          <LotusIcon className="h-6 w-6 text-nav-gold" strokeWidth={1.3} />
          <span className="h-px w-10 bg-nav-lavender-line" aria-hidden="true" />
        </div>

        <h1 className="mt-4 text-center font-serif text-3xl leading-[1.15] text-nav-plum sm:text-4xl">
          {title}
        </h1>
        {lastUpdated && <p className="mt-2 text-center text-sm text-nav-plum/70">Last updated: {lastUpdated}</p>}

        {intro && <div className="mt-6 flex flex-col gap-3 text-sm leading-relaxed text-nav-plum/85">{intro}</div>}

        {toc && toc.length > 0 && <PolicyContents entries={toc} />}

        <div className="mt-10 flex flex-col gap-10">{children}</div>

        {footnote && (
          <div className="mt-10 border-t border-nav-lavender-line pt-5 text-xs leading-relaxed text-nav-plum/50">
            {footnote}
          </div>
        )}
      </div>
    </main>
  );
}

export function PolicySection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="font-serif text-xl text-nav-plum sm:text-2xl">{title}</h2>
      <div className="mt-3 flex flex-col gap-2.5 text-sm leading-relaxed text-nav-plum/85">{children}</div>
    </section>
  );
}

/** A soft lavender callout box for important notices/placeholders
 * inside a policy section — used instead of ad-hoc inline styling per
 * page (AGENTS "subtle lavender information boxes where appropriate"). */
export function PolicyNotice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "placeholder" }) {
  return (
    <div
      className={`rounded-xl border p-4 text-sm ${
        tone === "placeholder"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-nav-lavender-line bg-white/60 text-nav-plum/85"
      }`}
    >
      {children}
    </div>
  );
}
