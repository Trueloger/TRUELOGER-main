import type { Metadata } from "next";
import { LotusIcon } from "@/components/quick-services/icons";
import { FaqSearch } from "./FaqSearch";

export const metadata: Metadata = {
  title: "FAQ | TRUELOGER",
  description: "Answers to common questions about accounts, orders, consultations, reports, and more on TrueLoger.",
};

export default function FaqPage() {
  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-nav-lavender-line" aria-hidden="true" />
          <LotusIcon className="h-6 w-6 text-nav-gold" strokeWidth={1.3} />
          <span className="h-px w-10 bg-nav-lavender-line" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-center font-serif text-3xl leading-[1.15] text-nav-plum sm:text-4xl">Frequently Asked Questions</h1>

        <FaqSearch />
      </div>
    </main>
  );
}
