import type { Metadata } from "next";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { LotusIcon } from "@/components/quick-services/icons";
import { SupportForm } from "@/components/legal/SupportForm";
import { FOOTER_CONTACT } from "@/components/footer/footer-data";
import { SUPPORT_RESPONSE_NOTE } from "@/lib/policy/config";
import type { SupportCategory } from "@/lib/support/types";

export const metadata: Metadata = {
  title: "Contact Us | TRUELOGER",
  description: "Get in touch with TrueLoger for questions about orders, consultations, reports, or your account.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; reportId?: string; meetingId?: string; category?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="bg-gradient-to-b from-nav-ivory via-nav-pearl to-nav-lavender-soft px-4 pt-24 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-24">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-nav-lavender-line" aria-hidden="true" />
          <LotusIcon className="h-6 w-6 text-nav-gold" strokeWidth={1.3} />
          <span className="h-px w-10 bg-nav-lavender-line" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-center font-serif text-3xl leading-[1.15] text-nav-plum sm:text-4xl">Contact Us</h1>
        <p className="mt-2 text-center text-sm text-nav-plum/70">{SUPPORT_RESPONSE_NOTE}</p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ContactCard icon={Mail} label="Email" value={FOOTER_CONTACT.email} href={`mailto:${FOOTER_CONTACT.email}`} />
          <ContactCard icon={Phone} label="Phone" value={FOOTER_CONTACT.phone} href={`tel:${FOOTER_CONTACT.phone.replace(/\s+/g, "")}`} />
          <ContactCard icon={MessageCircle} label="WhatsApp" value="Chat with us" href={`https://wa.me/${FOOTER_CONTACT.whatsappDigits}`} external />
        </div>

        <div className="mt-8">
          <SupportForm
            heading="Send us a message"
            orderId={params.orderId}
            reportId={params.reportId}
            meetingId={params.meetingId}
            defaultCategory={
              (params.category as SupportCategory | undefined) ??
              (params.orderId ? "order" : params.reportId ? "report" : params.meetingId ? "meeting" : undefined)
            }
          />
        </div>
      </div>
    </main>
  );
}

function ContactCard({
  icon: Icon,
  label,
  value,
  href,
  external,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex flex-col items-center gap-2 rounded-2xl border border-nav-lavender-line bg-white p-5 text-center transition-colors hover:bg-nav-lavender-mist/40"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-nav-amethyst/10 text-nav-amethyst-deep">
        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
      </span>
      <p className="text-xs font-semibold uppercase tracking-wide text-nav-plum/50">{label}</p>
      <p className="break-all text-sm font-medium text-nav-violet">{value}</p>
    </a>
  );
}
