import type { Metadata } from "next";
import Link from "next/link";
import { UserRound, PackageSearch, CreditCard, CalendarClock, FileText, Gem, GraduationCap, Sparkles, LifeBuoy } from "lucide-react";
import { LotusIcon } from "@/components/quick-services/icons";

export const metadata: Metadata = {
  title: "Help & Support | TRUELOGER",
  description: "Get help with your account, orders, payments, consultations, reports, and more.",
};

const CATEGORIES = [
  { icon: UserRound, title: "Account", body: "Signup, login, Google login, and your profile.", href: "/faq#account" },
  { icon: PackageSearch, title: "Orders", body: "Order status, delivery, cancellation, and refunds.", href: "/account/orders" },
  { icon: CreditCard, title: "Payments", body: "Payment failed, pending, or duplicate charges.", href: "/payment-billing" },
  { icon: CalendarClock, title: "Consultations & Meetings", body: "Booking, duration, date/time, and your Google Meet link.", href: "/account/meetings" },
  { icon: FileText, title: "Reports", body: "Generation, delivery, and downloading your PDF.", href: "/account/reports" },
  { icon: Gem, title: "Gemstones", body: "Ratti, product info, and delivery.", href: "/gemstones" },
  { icon: GraduationCap, title: "Courses", body: "Purchase and access.", href: "/courses" },
  { icon: Sparkles, title: "Healing & Puja", body: "Session and booking details.", href: "/healing" },
];

export default function HelpPage() {
  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-nav-lavender-line" aria-hidden="true" />
          <LotusIcon className="h-6 w-6 text-nav-gold" strokeWidth={1.3} />
          <span className="h-px w-10 bg-nav-lavender-line" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-center font-serif text-3xl leading-[1.15] text-nav-plum sm:text-4xl">Help & Support</h1>
        <p className="mt-2 text-center text-sm text-nav-plum/70">Find answers, or reach us directly.</p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="flex items-start gap-3 rounded-2xl border border-nav-lavender-line bg-white p-5 transition-colors hover:bg-nav-lavender-mist/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nav-amethyst/10 text-nav-amethyst-deep">
                <c.icon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <span>
                <p className="font-medium text-nav-violet">{c.title}</p>
                <p className="mt-0.5 text-sm text-nav-plum/70">{c.body}</p>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-nav-lavender-line bg-white/60 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-serif text-lg text-nav-plum">Still need help?</p>
            <p className="mt-1 text-sm text-nav-plum/70">Browse the full FAQ or contact us directly.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/faq" className="flex min-h-11 items-center justify-center rounded-full border border-nav-lavender-line bg-white px-5 text-sm font-medium text-nav-violet hover:bg-nav-lavender-mist">
              View FAQ
            </Link>
            <Link href="/contact" className="flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-nav-amethyst px-5 text-sm font-medium text-white hover:bg-nav-amethyst-deep">
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
