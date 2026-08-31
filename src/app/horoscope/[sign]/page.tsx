// src/app/horoscope/[sign]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ZODIAC_ORDER, ZODIAC_META, isZodiacSlug } from "@/lib/horoscope/zodiac";
import { getOrGenerateDailyHoroscopes } from "@/lib/horoscope/store";
import { getTodayIST } from "@/lib/horoscope/date";
import { ZODIAC_CARDS } from "@/components/horoscope/zodiac-ui-data";
import { HoroscopeReading } from "@/components/horoscope/HoroscopeReading";
import type { DailyHoroscopeDoc } from "@/lib/horoscope/types";

export const revalidate = 3600;

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
    title: `${meta.name} Daily Horoscope | TRUELOGER`,
    description: `Today's ${meta.name} horoscope — love, career, finance and health, refreshed daily.`,
  };
}

export default async function ZodiacHoroscopePage({
  params,
}: {
  params: Promise<{ sign: string }>;
}) {
  const { sign } = await params;
  if (!isZodiacSlug(sign)) notFound();

  const meta = ZODIAC_META[sign];
  const card = ZODIAC_CARDS.find((c) => c.slug === sign)!;
  const date = getTodayIST();

  // The Firestore fetch is isolated in try/catch, but the JSX return is
  // built outside it (react-hooks/error-boundaries flags constructing
  // JSX inside a try/catch, since a later render-time throw wouldn't be
  // caught there anyway) — same behavior, lint-clean structure.
  let doc: DailyHoroscopeDoc | null = null;
  try {
    doc = await getOrGenerateDailyHoroscopes(date);
  } catch {
    doc = null;
  }

  if (!doc) {
    return (
      <section className="min-h-screen bg-nav-ivory">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="font-serif text-2xl text-nav-plum">{meta.name}</h1>
          <p className="mt-4 text-nav-plum/70">
            The stars are aligning — today&apos;s reading will be ready shortly.
            Please check back in a few minutes.
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
        dateLabel={date}
      />
    </section>
  );
}
