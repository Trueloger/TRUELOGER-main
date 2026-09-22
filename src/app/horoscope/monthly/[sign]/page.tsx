// src/app/horoscope/monthly/[sign]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ZODIAC_ORDER, ZODIAC_META, isZodiacSlug } from "@/lib/horoscope/zodiac";
import { getOrGenerateMonthlyHoroscopes } from "@/lib/horoscope/store";
import { CARD_BY_SLUG } from "@/components/horoscope/zodiac-ui-data";
import { HoroscopeReading } from "@/components/horoscope/HoroscopeReading";
import type { MonthlyHoroscopeDoc } from "@/lib/horoscope/types";

export const revalidate = 3600;
export const maxDuration = 300;

export function generateStaticParams() {
  return ZODIAC_ORDER.map((sign) => ({ sign }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sign: string }>;
}): Promise<Metadata> {
  const { sign } = await params;
  if (!isZodiacSlug(sign)) return {};
  const meta = ZODIAC_META[sign];
  return {
    title: `${meta.name} Monthly Horoscope | TRUELOGER`,
    description: `This month's ${meta.name} horoscope — love, career, finance and health for the month ahead.`,
  };
}

export default async function ZodiacMonthlyHoroscopePage({
  params,
}: {
  params: Promise<{ sign: string }>;
}) {
  const { sign } = await params;
  if (!isZodiacSlug(sign)) notFound();

  const meta = ZODIAC_META[sign];
  const card = CARD_BY_SLUG[sign];

  let doc: MonthlyHoroscopeDoc | null = null;
  try {
    doc = await getOrGenerateMonthlyHoroscopes();
  } catch (err) {
    console.error("[horoscope] monthly fetch failed for", sign, err);
    doc = null;
  }

  if (!doc) {
    return (
      <section className="min-h-screen bg-nav-ivory">
        <div className="mx-auto max-w-lg px-4 pb-20 pt-28 text-center md:pt-32">
          <h1 className="font-serif text-2xl text-nav-plum">{meta.name}</h1>
          <p className="mt-4 text-nav-plum/70">
            The stars are aligning — this month&apos;s reading will be ready shortly. Please check
            back in a few minutes.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-nav-ivory">
      <HoroscopeReading
        meta={meta}
        Icon={card.Icon}
        reading={doc.signs[sign]}
        dateLabel={doc.monthLabel}
        periodTabs={[
          { label: "Daily", href: `/horoscope/${sign}`, active: false },
          { label: "Weekly", href: `/horoscope/weekly/${sign}`, active: false },
          { label: "Monthly", href: `/horoscope/monthly/${sign}`, active: true },
        ]}
      />
    </section>
  );
}
